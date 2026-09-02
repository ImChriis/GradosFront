import { Component, inject, OnInit } from '@angular/core';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ActContractService } from '../../../../@core/services/act-contract.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BanksService } from '../../../../@core/services/banks.service';
import { SettingsService } from '../../../../@core/services/settings.service';
import { UppercaseDirective } from '../../../../@core/directives/uppercase.directive';
import { OnlyNumbersDirective } from '../../../../@core/directives/only-numbers.directive';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { PrintModalComponent } from '../print-modal/print-modal.component';
import { OnlyAlphanumericsDirective } from '../../../../shared/directives/only-alphanumerics.directive';

@Component({
  selector: 'app-payments',
  imports: [
    CommonModule,
    TableModule,
    ReactiveFormsModule,
    UppercaseDirective,
    OnlyNumbersDirective,
    OnlyAlphanumericsDirective
  ],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements OnInit {
  private actContractService = inject(ActContractService);
  private dialogConfig = inject(DynamicDialogConfig);
  private banksService = inject(BanksService);
  private settingsService = inject(SettingsService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private ref = inject(DynamicDialogRef);
  private printRef = inject(DynamicDialogRef);
  private dialogService = inject(DialogService);

  actUser = this.dialogConfig.data.actUser;
  codigoActo = this.dialogConfig.data.codigoActo;
  totalPerStudent = this.dialogConfig.data.MnCosto;

  NuCedula!: number;
  NoContrato!: number;
  client!: string;
  montoContrato: number = 0;
  descuento: number = 0;
  MnInicial: number = 0;
  montoPagado: number = 0;
  montoSaldo: number = 0;
  NoRecibo!: number;
  fechaSelectedRecibo: string = '';
  montoSelectedRecibo: number | null = null;
  observacion: string = '';
  metodosPago: String[] = [];
  banks: String[] = [];
  isAdding: boolean = false;
  selectedRecibo!: number;
  totalAbonos: number = 0;
  saldoRestante: number = 0;
  totalRecibos: number = 0;
  puedeCerrar: boolean = false;
  facturado: boolean = false;
  montoPagadoBase: number = 0;
  montoSaldoBase: number = 0;
  email!: string;

  // Listas persistidas desde BD + Listas temporales en memoria
  private recibosBD: any[] = [];
  private abonosBD: any[] = [];
  private pendingRecibos: any[] = [];
  private pendingAbonos: any[] = [];

  private recibosSubject = new BehaviorSubject<any[]>([]);
  private abonosSubject = new BehaviorSubject<any[]>([]);

  // Observables conectados ÚNICAMENTE a los Subjects
  recibos$: Observable<any[]> = this.recibosSubject.asObservable();
  abonos$: Observable<any[]> = this.abonosSubject.asObservable();

  reciboPagoForm = this.fb.group({
    NoRecibo: [null as number | null],
    ferecibo: [new Date().toISOString()],
    NuCedula: [null as number | null],
    CodSucursal: [null as number | null],
    NoContrato: [null as number | null],
    tprecibo: [''],
    mnrecibo: [null as number | null],
    mnsaldorec: [null as number | null],
    TxConcepRec: [''],
    CodUser: [null as number | null],
    Anulado: [null as number | null],
    Tipo: [''],
    CodigoActo: [null as number | null],
    MaFormPag: [''],
    TxBanco: [''],
    NuRefDocBan: [null as number | null, { validators: [Validators.pattern('^[a-zA-Z0-9]*$')] }],
    Fecha: [''],
    TipoOperacion: [''],
    NuDeposito: [null as number | null],
    MnDeposito: [null as number | null],
  });

  ngOnInit(): void {
    this.NuCedula = this.actUser.NuCedula;
    this.NoContrato = this.actUser.NoContrato;
    this.client = this.actUser.Nombre;
    this.email = this.actUser.email;
    this.montoContrato = Number(this.actUser.MnContrato ?? 0);
    this.descuento = Number(this.actUser.MnDescuento ?? 0);
    this.MnInicial = Number(this.actUser.MnInicial ?? 0);

    this.reciboPagoForm.disable();

    // Cargar datos iniciales desde la BD
    this.loadInitialPaymentData();

    this.banksService.getMetodoPago().subscribe({
      next: (response) => {
        this.metodosPago = response.map((item: any) => item.nombreMetodoPago);
      }
    });

    this.banksService.getAllBanks().subscribe({
      next: (response) => {
        this.banks = response.filter((item: any) => item.status === 1).map((item: any) => item.bancos);
      }
    });
  }

  private loadInitialPaymentData() {
    // 1. Cargar estado fresco del contrato/usuario
    this.actContractService.getPaymentDataByUser(
      this.codigoActo,
      String(this.NoContrato),
      String(this.NuCedula)
    ).subscribe({
      next: (res: any) => {
        const data = res?.data?.[0] ?? res;
        this.montoContrato = Number(data?.MnContrato ?? this.montoContrato);
        this.descuento = Number(data?.MnDescuento ?? this.descuento);
        this.MnInicial = Number(data?.MnInicial ?? this.MnInicial);

        this.montoPagadoBase = Number(data?.MnPagado ?? 0);
        this.montoSaldoBase = Number(data?.MnSaldo ?? (this.montoContrato - this.montoPagadoBase));

        this.montoPagado = this.montoPagadoBase;
        this.montoSaldo = this.montoSaldoBase;
      }
    });

    // 2. Cargar Recibos ya guardados en BD
    this.actContractService.getRecibosByUserContract(this.NoContrato).subscribe({
      next: (res: any) => {
        this.recibosBD = Array.isArray(res) ? res : (res?.data ?? []);
        this.totalRecibos = this.recibosBD.reduce((acc, r) => acc + Number(r.mnrecibo ?? 0), 0);
        this.emitRecibos();
      }
    });
  }

  private emitRecibos() {
    const todosLosRecibos = [...this.recibosBD, ...this.pendingRecibos];
    this.recibosSubject.next(todosLosRecibos);
  }

private emitAbonos() {
  const targetRecibo = Number(this.selectedRecibo);

  // Si abonosBD ya viene filtrado desde el servidor por ese NoRecibo, 
  // validamos si existe a.NoRecibo; si no viene, incluimos el elemento directamente.
  const abonosBDFiltrados = this.abonosBD.filter(
    a => a.NoRecibo !== undefined ? Number(a.NoRecibo) === targetRecibo : true
  );

  const abonosMemoriaFiltrados = this.pendingAbonos.filter(
    a => Number(a.NoRecibo) === targetRecibo
  );

  const todosLosAbonos = [...abonosBDFiltrados, ...abonosMemoriaFiltrados];

  this.abonosSubject.next(todosLosAbonos);

  this.totalAbonos = todosLosAbonos.reduce((total, a) => total + Number(a.MnDeposito ?? 0), 0);
  const montoSeleccionado = Number(this.montoSelectedRecibo ?? 0);
  this.saldoRestante = Math.max(0, montoSeleccionado - this.totalAbonos);

  this.actualizarTotalesGlobales();
}

 private actualizarTotalesGlobales() {
  // Mantener el monto pagado fijado en el valor base de la BD (sin sumar memoria en tiempo real)
  this.montoPagado = this.montoPagadoBase;
  this.montoSaldo = Math.max(0, this.montoContrato - this.montoPagado);
  
  this.actualizarEstadoCierre();
}

selectRecibo(recibo: any) {
  // Asegurar conversión numérica
  const numRecibo = Number(recibo.NoRecibo);
  this.NoRecibo = numRecibo;
  this.selectedRecibo = numRecibo;
  this.fechaSelectedRecibo = recibo.ferecibo;
  this.observacion = recibo.TxConcepRec ?? '';
  this.montoSelectedRecibo = Number(recibo.mnrecibo ?? 0);

  this.isAdding = false;
  this.reciboPagoForm.enable();

  // Limpiar lista visualmente mientras carga
  this.abonosBD = [];
  this.abonosSubject.next([]);

  // Petición al backend
  this.actContractService.getAbonosByUserContract(
    String(this.NoContrato),
    String(this.NuCedula),
    numRecibo
  ).subscribe({
    next: (res: any) => {
      console.log('Respuesta de abonos:', res);

      // Asignación correcta evaluando la respuesta del backend
      if (Array.isArray(res)) {
        this.abonosBD = res;
      } else if (res && Array.isArray(res.data)) {
        this.abonosBD = res.data; // ✅ Extrae el arreglo correctamente
      } else {
        this.abonosBD = [];
      }

      this.emitAbonos();
    },
    error: (err) => {
      console.error('Error al obtener abonos del recibo:', err);
      this.abonosBD = [];
      this.emitAbonos();
    }
  });
}

  add() {
    if (this.bloquearSiReciboPendiente('Debes terminar primero el proceso de facturación antes de agregar un nuevo recibo')) {
      return;
    }

    this.reciboPagoForm.enable();
    const hoy = new Date();
    const fechaFormateada = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    this.reciboPagoForm.patchValue({ ferecibo: fechaFormateada });

    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>('textarea[formcontrolname="TxConcepRec"]');
      el?.focus();
    }, 0);

    this.settingsService.getSettings().subscribe({
      next: (res: any) => {
        const NoRecibo = Number(res.NoRecibo ?? 0) + 1;
        this.NoRecibo = NoRecibo;
        this.selectedRecibo = NoRecibo;
        this.montoSelectedRecibo = 0;
        this.fechaSelectedRecibo = new Date().toISOString();
        this.observacion = '';
        this.isAdding = true;

        this.abonosBD = [];
        this.emitAbonos();
      }
    });
  }

  onSubmit() {
    const formData = this.reciboPagoForm.getRawValue();
    const montoInput = Number(formData.mnrecibo ?? 0);

    if (montoInput <= 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Monto inválido',
        detail: 'El monto ingresado debe ser mayor a 0'
      });
      return;
    }

    const totalAbonosMemoria = this.pendingAbonos.reduce((sum, a) => sum + Number(a.MnDeposito ?? 0), 0);
    const montoFuturoPagado = this.montoPagadoBase + totalAbonosMemoria + montoInput;

    if (montoFuturoPagado > this.montoContrato) {
      const maximoPermitido = Math.max(0, this.montoContrato - (this.montoPagadoBase + totalAbonosMemoria));
      this.messageService.add({
        severity: 'error',
        summary: 'Monto Excedido',
        detail: `El monto excede el total del contrato (${this.montoContrato}). Máximo permitido a agregar: ${maximoPermitido}`
      });
      return;
    }

    // CREAR O ACTUALIZAR RECIBO EN MEMORIA
    if (this.isAdding || !this.recibosBD.some(r => Number(r.NoRecibo) === Number(this.selectedRecibo))) {
      let reciboExistente = this.pendingRecibos.find(r => Number(r.NoRecibo) === Number(this.selectedRecibo));

      if (!reciboExistente) {
        reciboExistente = {
          NoRecibo: this.selectedRecibo,
          ferecibo: formData.ferecibo || new Date().toISOString(),
          mnrecibo: montoInput,
          mnsaldorec: this.montoSaldo - montoInput,
          TxConcepRec: formData.TxConcepRec ?? '',
          NoContrato: this.NoContrato,
          NuCedula: this.NuCedula,
          CodigoActo: this.codigoActo,
          MaFormPag: formData.MaFormPag ?? '',
          TxBanco: formData.TxBanco ?? ''
        };
        this.pendingRecibos.push(reciboExistente);
      } else {
        reciboExistente.mnrecibo = Number(reciboExistente.mnrecibo ?? 0) + montoInput;
      }

      this.montoSelectedRecibo = reciboExistente.mnrecibo;
      this.isAdding = false;
    }

    // REGISTRAR ABONO EN MEMORIA
    const nuevoAbono = {
      NoRecibo: this.selectedRecibo,
      NoContrato: this.NoContrato,
      NuCedula: this.NuCedula,
      Fecha: formData.ferecibo || new Date().toISOString(),
      TipoOperacion: formData.MaFormPag ?? '',
      TxBanco: formData.TxBanco ?? '',
      NuDeposito: formData.NuRefDocBan ?? null,
      MnDeposito: montoInput
    };

    this.pendingAbonos.push(nuevoAbono);

    // Emitir cambios a los observadores para refrescar tablas al instante
    this.emitRecibos();
    this.emitAbonos();

    // Limpiar campos de transacción
    this.reciboPagoForm.patchValue({
      MaFormPag: '',
      TxBanco: '',
      NuRefDocBan: null,
      mnrecibo: null
    });
  }

facturar() {
  const montoReciboActual = Number(this.montoSelectedRecibo ?? 0);
  const tieneAbonos = this.pendingAbonos.length > 0;

  if (montoReciboActual <= 0 && !tieneAbonos) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Recibo en $0',
      detail: 'No puedes facturar un recibo sin monto o sin abonos registrados.'
    });
    return;
  }

  // 1. Calcular la suma total de los abonos pendientes en memoria
  const totalAbonosNuevos = this.pendingAbonos.reduce(
    (acc, abono) => acc + Number(abono.MnDeposito ?? 0), 
    0
  );

  // 2. Calcular el nuevo monto pagado real (Lo que había en BD + abonos nuevos)
  const nuevoMontoPagado = this.montoPagadoBase + totalAbonosNuevos;
  const nuevoMontoSaldo = Math.max(0, this.montoContrato - nuevoMontoPagado);

  this.guardarRecibosYAbonosEnBD().pipe(
    concatMap(() => {
      return this.actContractService.getPaymentDataByUser(
        this.codigoActo,
        String(this.NoContrato),
        String(this.NuCedula)
      );
    }),
    concatMap((resPayment: any) => {
      const data = resPayment?.data?.[0] ?? resPayment;
      this.MnInicial = Number(data?.MnInicial ?? this.MnInicial);

      // 3. Enviar al backend los TOTALES CALCULADOS CON LOS NUEVOS ABONOS
      const payload = {
        MnContrato: this.montoContrato,
        MnDescuento: this.descuento,
        MnInicial: this.MnInicial,
        MnPagado: nuevoMontoPagado,
        MnSaldo: nuevoMontoSaldo
      };

      return this.actContractService.updateTotals(this.codigoActo, this.NuCedula, payload);
    })
  ).subscribe({
    next: (resUpdate: any) => {
      const data = resUpdate?.data?.[0] ?? resUpdate;

      // 4. Actualizar variables locales con la respuesta final o con el cálculo local
      this.montoContrato = Number(data?.MnContrato ?? this.montoContrato);
      this.descuento = Number(data?.MnDescuento ?? this.descuento);
      this.MnInicial = Number(data?.MnInicial ?? this.MnInicial);

      this.montoPagado = Number(data?.MnPagado ?? nuevoMontoPagado);
      this.montoSaldo = Number(data?.MnSaldo ?? nuevoMontoSaldo);

      // 5. Actualizar los valores base para que coincidan con la BD
      this.montoPagadoBase = this.montoPagado;
      this.montoSaldoBase = this.montoSaldo;

      // 6. Pasar los abonos pendientes a las listas definitivas de BD
      this.recibosBD = [...this.recibosBD, ...this.pendingRecibos];
      this.abonosBD = [...this.abonosBD, ...this.pendingAbonos];

      // 7. Limpiar temporales en memoria
      this.pendingRecibos = [];
      this.pendingAbonos = [];

      // Refrescar observables locales
      this.emitRecibos();
      this.emitAbonos();

      this.puedeCerrar = true;
      this.facturado = true;

      this.messageService.add({
        severity: 'success',
        summary: 'Facturación',
        detail: 'Se ha actualizado el pago correctamente'
      });

      const reciboAImprimir = Number(this.selectedRecibo || this.NoRecibo);
      if (reciboAImprimir && reciboAImprimir > 0) {
        this.print(reciboAImprimir);
      }
    },
    error: (err) => {
      console.error('Error durante la facturación:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Ocurrió un error al procesar la facturación'
      });
    }
  });
}

  private guardarRecibosYAbonosEnBD(): Observable<any> {
    if (this.pendingRecibos.length === 0) return of(null);

    const recibos = [...this.pendingRecibos];
    const abonos = [...this.pendingAbonos];

    const peticionesRecibos = recibos.map((recibo) => {
      return this.actContractService.addARecibo(recibo).pipe(
        concatMap(() => {
          const abonosDelRecibo = abonos.filter(a => Number(a.NoRecibo) === Number(recibo.NoRecibo));
          if (abonosDelRecibo.length === 0) return of([]);

          const peticionesAbonos = abonosDelRecibo.map((abono) => this.actContractService.addDeposito(abono));
          return forkJoin(peticionesAbonos);
        })
      );
    });

    return forkJoin(peticionesRecibos);
  }

  cancel() {
    this.pendingRecibos = [];
    this.pendingAbonos = [];
    this.NoRecibo = 0;
    this.fechaSelectedRecibo = '';
    this.montoSelectedRecibo = null;
    this.observacion = '';
    this.selectedRecibo = 0;
    this.facturado = false;
    this.isAdding = false;

    this.reciboPagoForm.reset();
    this.reciboPagoForm.disable();

    this.loadInitialPaymentData();
  }

  close() {
    if (this.facturado || this.puedeCerrar || this.pendingAbonos.length === 0) {
      this.ref.close(true);
      return;
    }

    this.messageService.add({
      severity: 'warn',
      summary: 'Cambios no guardados',
      detail: 'Tienes abonos pendientes de facturar. Presiona Facturar antes de cerrar o Cancela la operación.'
    });
  }

  private actualizarEstadoCierre() {
    this.puedeCerrar = Number(this.montoSelectedRecibo ?? 0) > 0 && this.saldoRestante <= 0;
  }

  private bloquearSiReciboPendiente(mensaje: string): boolean {
    if (this.tieneReciboPendiente) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No permitido',
        detail: mensaje
      });
      return true;
    }
    return false;
  }

  get tieneReciboPendiente(): boolean {
    return this.isAdding || this.pendingAbonos.length > 0;
  }

  get bloquearAcciones(): boolean {
    return this.tieneReciboPendiente;
  }

  print(NoRecibo: number) {
    this.printRef = this.dialogService.open(PrintModalComponent, {
      header: "¿Qué te gustaría hacer con el recibo?",
      width: '40%',
      modal: true,
      closable: true,
      data: {
        NoRecibo: NoRecibo,
        email: this.email,
      },
      breakpoints: {
        '960px': '90%',
        '640px': '100%'
      }
    });
  }
}