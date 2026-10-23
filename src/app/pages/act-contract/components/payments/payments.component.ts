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
import { ConfirmDeleteModalComponent } from '../../../../shared/components/modals/confirm-delete-modal/confirm-delete-modal.component';
import { AuthService } from '../../../../@core/services/auth.service';

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
  private authsService = inject(AuthService);

  actUser = this.dialogConfig.data.actUser;
  codigoActo = this.dialogConfig.data.codigoActo;
  totalPerStudent = this.dialogConfig.data.MnCosto;
  actUserEmail = this.dialogConfig.data.actUser.email;

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
  CodUser = this.authsService.CodUser;
  CodSucursal = this.settingsService.CodSucursal;

  reciboDeTabla: 'nuevo' | 'tabla' | null = null;

  get hayReciboNuevo(): boolean {
    return this.reciboDeTabla === 'nuevo';
  }

  get hayReciboTabla(): boolean {
    return this.reciboDeTabla === 'tabla';
  }

  // ----------------------------------------------------------------
  //  Anulación de recibos
  // ----------------------------------------------------------------

  /**
   * Estado de un recibo de la tabla (columna `Anulado` del backend, que llega
   * como texto: '0' / '1').
   */
  esReciboAnulado(recibo: any): boolean {
    return String(recibo?.Anulado ?? '') === '1';
  }

  /** Recibo seleccionado tal como está guardado en BD (no uno en memoria). */
  private get reciboSeleccionadoEnTabla(): any | null {
    return this.recibosBD.find(r => Number(r.NoRecibo) === Number(this.selectedRecibo)) ?? null;
  }

  /** Lo que refleja el checkbox ANULADO. */
  get reciboAnulado(): boolean {
    return this.esReciboAnulado(this.reciboSeleccionadoEnTabla);
  }

  /**
   * Un recibo con NoCierre o FechaCierre ya pertenece a un cierre diario y no
   * se puede anular.
   */
  private get reciboCerrado(): boolean {
    const r = this.reciboSeleccionadoEnTabla;
    if (!r) return false;

    const cierre = r.NoCierre;
    if (cierre !== null && cierre !== undefined && cierre !== '' && Number(cierre) !== 0) return true;

    return r.FechaCierre !== null && r.FechaCierre !== undefined && r.FechaCierre !== '';
  }

  /**
   * Último recibo aún activo. Los recibos se anulan del más reciente al más
   * antiguo, así que este es el único que toca anular en cada paso.
   *
   * Se busca el de mayor NoRecibo en lugar de confiar en la posición del array:
   * el orden de la tabla lo decide el backend (ahora descendente).
   */
  private get reciboMasRecienteActivo(): any | null {
    return this.recibosBD
      .filter(r => !this.esReciboAnulado(r))
      .reduce<any>(
        (masReciente, r) =>
          !masReciente || Number(r.NoRecibo) > Number(masReciente.NoRecibo) ? r : masReciente,
        null
      );
  }

  /** El recibo seleccionado es el que sigue en el orden de anulación. */
  private get respetaOrdenAnulacion(): boolean {
    const recibo = this.reciboSeleccionadoEnTabla;
    if (!recibo) return false;

    const ultimo = this.reciboMasRecienteActivo;
    return !!ultimo && Number(recibo.NoRecibo) === Number(ultimo.NoRecibo);
  }

  /** Botón Anular: recibos guardados en BD, no anulados, fuera de un cierre y en orden. */
  get puedeAnularRecibo(): boolean {
    return this.hayReciboTabla && !this.reciboAnulado && !this.reciboCerrado && this.respetaOrdenAnulacion;

  }

  private recibosBD: any[] = [];
  private abonosBD: any[] = [];
  private pendingRecibos: any[] = [];
  private pendingAbonos: any[] = [];

  private recibosSubject = new BehaviorSubject<any[]>([]);
  private abonosSubject = new BehaviorSubject<any[]>([]);

  recibos$: Observable<any[]> = this.recibosSubject.asObservable();
  abonos$: Observable<any[]> = this.abonosSubject.asObservable();

  reciboPagoForm = this.fb.group({
    NoRecibo: [null as number | null],
    ferecibo: [new Date().toISOString()],
    NuCedula: [null as number | null],
    CodSucursal: [this.CodSucursal() ? String(this.CodSucursal()) : null],
    NoContrato: [null as number | null],
    tprecibo: [''],
    mnrecibo: [null as number | null],
    mnsaldorec: [null as number | null],
    TxConcepRec: [''],
    CodUser: [this.CodUser() ? String(this.CodUser()) : null],
    Anulado: [null as number | null],
    Tipo: ['1'], // Tipo 1 = Contrato de actos, 2 = Contrato de anillos
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

    console.log('Datos iniciales del usuario:', this.actUser);
  }

  private loadInitialPaymentData() {
    this.actContractService.getPaymentDataByUser(
      this.codigoActo,
      String(this.NoContrato),
      String(this.NuCedula)
    ).subscribe({
      next: (res: any) => {
        console.log('Datos de pago recibidos:', res);

        console.log(this.NoContrato, this.NuCedula, this.codigoActo);
        
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

    this.actContractService.getRecibosByUserContract(this.NoContrato, this.codigoActo, this.NuCedula).subscribe({
      next: (res: any) => {
        console.log("Recibos recibidos:", res);

        const list = Array.isArray(res) ? res : (res?.data ?? []);

        this.recibosBD = Array.isArray(list) ? list : [list];
        this.totalRecibos = this.recibosBD.reduce((acc, r) => acc + Number(r?.mnrecibo ?? 0), 0);
        this.emitRecibos();
      },
      error: (err) => {
        console.error('Error al obtener recibos del usuario:', err);
        this.recibosBD = [];
        this.totalRecibos = 0;
        this.emitRecibos();
      }
    });
  }

  private emitRecibos() {
    // La tabla va de más reciente a más antiguo: los pendientes (correlativo
    // todavía más alto) encima de los que ya están en BD.
    const todosLosRecibos = [...this.pendingRecibos, ...this.recibosBD];
    this.recibosSubject.next(todosLosRecibos);
  }

  private emitAbonos() {
    const targetRecibo = Number(this.selectedRecibo);

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
    this.montoPagado = this.montoPagadoBase;
    this.montoSaldo = Math.max(0, this.montoContrato - this.montoPagado);
    this.actualizarEstadoCierre();
  }

  selectRecibo(recibo: any) {
    const numRecibo = Number(recibo.NoRecibo);
    this.NoRecibo = numRecibo;
    this.reciboDeTabla = 'tabla';
    this.selectedRecibo = numRecibo;
    this.fechaSelectedRecibo = recibo.ferecibo;
    this.observacion = recibo.TxConcepRec ?? '';
    this.montoSelectedRecibo = Number(recibo.mnrecibo ?? 0);

    this.isAdding = false;
    this.reciboPagoForm.disable();

    this.abonosBD = [];
    this.abonosSubject.next([]);

    this.actContractService.getAbonosByUserContract(
      String(this.NoContrato),
      String(this.NuCedula),
      numRecibo
    ).subscribe({
      next: (res: any) => {
        if (Array.isArray(res)) {
          this.abonosBD = res;
        } else if (res && Array.isArray(res.data)) {
          this.abonosBD = res.data;
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

    this.reciboDeTabla = 'nuevo';
    this.reciboPagoForm.enable();
    const hoy = new Date();
    const fechaFormateada = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

    this.reciboPagoForm.patchValue({ ferecibo: fechaFormateada });

    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>('textarea[formcontrolname="TxConcepRec"]');
      el?.focus();
    }, 0);

    // Consultamos la tabla de configuración únicamente para precargar una vista previa inicial
    this.settingsService.getSettings().subscribe({
      next: (res: any) => {
        const NoReciboSugerido = Number(res.NoRecibo ?? 0);
        this.NoRecibo = NoReciboSugerido;

        this.selectedRecibo = NoReciboSugerido;
        this.montoSelectedRecibo = 0;
        this.fechaSelectedRecibo = new Date().toISOString();
        this.observacion = '';
        this.isAdding = true;

        this.reciboPagoForm.patchValue({ NoRecibo: NoReciboSugerido });

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
          TxBanco: formData.TxBanco ?? '',
          CodUser: formData.CodUser ?? '',
          CodSucursal: formData.CodSucursal ?? ''
        };
        this.pendingRecibos.push(reciboExistente);
      } else {
        reciboExistente.mnrecibo = Number(reciboExistente.mnrecibo ?? 0) + montoInput;
      }

      this.montoSelectedRecibo = reciboExistente.mnrecibo;
      this.isAdding = false;
    }

    const nuevoAbono = {
      NoRecibo: this.selectedRecibo,
      NoContrato: this.NoContrato,
      NuCedula: this.NuCedula,
      Fecha: formData.ferecibo || new Date().toISOString(),
      TipoOperacion: formData.MaFormPag ?? '',
      TxBanco: formData.TxBanco ?? '',
      NuDeposito: formData.NuRefDocBan ?? null,
      MnDeposito: montoInput,
      CodUser: formData.CodUser ?? '',
      CodSucursal: formData.CodSucursal ?? ''
    };

    this.pendingAbonos.push(nuevoAbono);

    this.emitRecibos();
    this.emitAbonos();

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

    const totalAbonosNuevos = this.pendingAbonos.reduce(
      (acc, abono) => acc + Number(abono.MnDeposito ?? 0),
      0
    );

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

        this.montoContrato = Number(data?.MnContrato ?? this.montoContrato);
        this.descuento = Number(data?.MnDescuento ?? this.descuento);
        this.MnInicial = Number(data?.MnInicial ?? this.MnInicial);

        this.montoPagado = Number(data?.MnPagado ?? nuevoMontoPagado);
        this.montoSaldo = Number(data?.MnSaldo ?? nuevoMontoSaldo);

        this.montoPagadoBase = this.montoPagado;
        this.montoSaldoBase = this.montoSaldo;

        this.recibosBD = [...this.recibosBD, ...this.pendingRecibos];
        this.abonosBD = [...this.abonosBD, ...this.pendingAbonos];

        const numReciboFinal = Number(this.selectedRecibo || this.NoRecibo);

        this.pendingRecibos = [];
        this.pendingAbonos = [];

        this.emitRecibos();
        this.emitAbonos();

        this.puedeCerrar = true;
        this.facturado = true;

        this.messageService.add({
          severity: 'success',
          summary: 'Facturación Exitosa',
          detail: `Se guardó el recibo #${numReciboFinal} correctamente`
        });

        if (numReciboFinal && numReciboFinal > 0) {
          this.print(numReciboFinal);
        }
      },
      error: (err) => {
        console.error('Error durante la facturación:', err);

        // Si el backend responde con conflicto de duplicidad (409)
        if (err.status === 409 && err.error?.code === 'RECIBO_DUPLICADO') {
          const nuevoNumero = err.error.sugerido;

          if (nuevoNumero) {
            // Reasignamos automáticamente el nuevo correlativo asignado por el servidor
            this.NoRecibo = nuevoNumero;
            this.selectedRecibo = nuevoNumero;

            this.pendingRecibos.forEach(r => r.NoRecibo = nuevoNumero);
            this.pendingAbonos.forEach(a => a.NoRecibo = nuevoNumero);

            this.reciboPagoForm.patchValue({ NoRecibo: nuevoNumero });

            this.messageService.add({
              severity: 'warn',
              summary: 'Correlativo Ajustado',
              detail: `El número original ya había sido asignado. Reintentando automáticamente con el recibo #${nuevoNumero}...`
            });

            // Reintentamos automáticamente la facturación con el nuevo correlativo sin cancelar nada
            this.facturar();
            return;
          }
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Ocurrió un error al procesar la facturación'
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
    this.reciboDeTabla = null;
    this.pendingRecibos = [];
    this.pendingAbonos = [];
    this.NoRecibo = 0;
    this.fechaSelectedRecibo = '';
    this.montoSelectedRecibo = null;
    this.observacion = '';
    this.selectedRecibo = 0;
    this.facturado = false;
    this.isAdding = false;


    this.reciboPagoForm.reset({
    CodUser: this.CodUser() ? String(this.CodUser()) : null,
    CodSucursal: this.CodSucursal() ? String(this.CodSucursal()) : null
  });
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

  /**
   * Botón "Anular": antes de tocar nada pregunta con el mismo modal de
   * confirmación que usan los clientes
   * (shared/components/modals/confirm-delete-modal). Los casos que no se pueden
   * anular se contestan aquí, sin abrir el modal.
   */
  anularRecibo() {
    const recibo = this.reciboSeleccionadoEnTabla;

    if (!this.hayReciboTabla || !recibo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Recibo requerido',
        detail: 'Selecciona un recibo de la tabla para poder anularlo.'
      });
      return;
    }

    if (this.reciboAnulado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Ya anulado',
        detail: `El recibo N° ${recibo.NoRecibo} ya fue anulado.`
      });
      return;
    }

    if (this.reciboCerrado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Recibo cerrado',
        detail: `No se puede anular: el recibo N° ${recibo.NoRecibo} ya pertenece a un cierre.`
      });
      return;
    }

    if (!this.respetaOrdenAnulacion) {
      const ultimo = this.reciboMasRecienteActivo;
      this.messageService.add({
        severity: 'warn',
        summary: 'Fuera de orden',
        detail: `Los recibos se anulan del último al primero: antes debe anularse el recibo N° ${ultimo?.NoRecibo}.`
      });
      return;
    }

    const montoTexto = Number(recibo.mnrecibo ?? 0).toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const confirmRef = this.dialogService.open(ConfirmDeleteModalComponent, {
      header: 'Confirmar Anulación',
      width: '40vw',
      modal: true,
      data: {
        message: `¿Anular el recibo N° ${recibo.NoRecibo} por Bs. ${montoTexto}?`,
        recibo
      }
    });

    confirmRef.onClose.subscribe((confirmed: boolean) => {
      if (confirmed) this.ejecutarAnulacion(recibo);
    });
  }

  /** Confirmado por el usuario: marca Anulado = '1' y devuelve el monto al saldo. */
  private ejecutarAnulacion(recibo: any) {
    this.actContractService.anularRecibo({
      NoContrato: this.NoContrato,
      CodigoActo: this.codigoActo,
      NuCedula: this.NuCedula,
      NoRecibo: Number(recibo.NoRecibo),
      CodUser: this.CodUser()
    }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? {};

        recibo.Anulado = '1';

        if (data.MnInicial !== undefined) this.MnInicial = Number(data.MnInicial);
        if (data.MnPagado !== undefined) this.montoPagadoBase = Number(data.MnPagado);
        if (data.MnSaldo !== undefined) this.montoSaldoBase = Number(data.MnSaldo);


        this.montoPagado = this.montoPagadoBase;
        this.montoSaldo = this.montoSaldoBase;

        this.emitRecibos();

        // La selección queda sobre el recibo que acaba de anularse y ese ya no
        // sirve; se salta al siguiente para que el botón Anular quede listo.
        this.seleccionarSiguienteRecibo();

        this.messageService.add({
          severity: 'success',
          summary: 'Recibo anulado',
          detail: `El recibo N° ${recibo.NoRecibo} fue anulado y su monto volvió al saldo.`
        });
      },
      error: (err: any) => {
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo anular',
          detail: err?.error?.message || 'Ocurrió un error al anular el recibo.'
        });
      }
    });
  }

  /**
   * Después de anular, enfoca el recibo que sigue en el orden de anulación.
   * Si no queda ninguno, deja la tabla sin selección.
   */
  private seleccionarSiguienteRecibo() {
    const siguiente = this.reciboMasRecienteActivo;

    if (!siguiente) {
      this.selectedRecibo = 0;
      this.NoRecibo = 0;
      this.reciboDeTabla = null;
      this.montoSelectedRecibo = null;
      this.fechaSelectedRecibo = '';
      this.observacion = '';
      this.abonosBD = [];
      this.abonosSubject.next([]);
      return;
    }

    this.selectRecibo(siguiente);
  }

  print(NoRecibo: number) {
    if(!NoRecibo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Recibo inválido',
        detail: 'No se puede imprimir un recibo sin número válido'
      });
      return;
    }else{
          this.printRef = this.dialogService.open(PrintModalComponent, {
          header: "¿Qué te gustaría hacer con el recibo?",
          width: '40%',
          modal: true,
          closable: true,
          data: {
            NoRecibo: NoRecibo,
            email: this.actUserEmail,
          },
          breakpoints: {
            '960px': '90%',
            '640px': '100%'
          }
        });
      }
    }
}