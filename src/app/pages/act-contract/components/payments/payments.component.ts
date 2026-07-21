import { Component, inject, OnInit } from '@angular/core';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ActContractService } from '../../../../@core/services/act-contract.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { BehaviorSubject, map, Observable, startWith, switchMap, tap } from 'rxjs';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { BanksService } from '../../../../@core/services/banks.service';
import { SettingsService } from '../../../../@core/services/settings.service';
import { UppercaseDirective } from '../../../../@core/directives/uppercase.directive';
import { OnlyNumbersDirective } from '../../../../@core/directives/only-numbers.directive';
import { MessageService } from 'primeng/api';
import { forkJoin, of } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { PrintModalComponent } from '../print-modal/print-modal.component';

@Component({
  selector: 'app-payments',
  imports: [
    CommonModule,
    TableModule,
    ReactiveFormsModule,
    UppercaseDirective,
    OnlyNumbersDirective
  ],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements OnInit{
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
  // recibos$!: Observable<any>;
  // abonos$!: Observable<any>;
  client!: string;
  montoContrato!: number;
  descuento!: number;
  MnInicial!: number;
  montoPagado!: number;
  montoSaldo!: number;
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

  private pendingRecibos: any[] = [];
  private pendingAbonos: any[] = [];
  private recibosSubject = new BehaviorSubject<any[]>([]);
  private abonosSubject = new BehaviorSubject<any[]>([]);

  recibos$ = this.recibosSubject.asObservable().pipe(
    map((value) => value ?? [])
  );

  abonos$ = this.abonosSubject.asObservable().pipe(
    map((value) => value ?? [])
  );

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
    NuRefDocBan: [null as number | null],
    Fecha: [''],
    TipoOperacion: [''],
    NuDeposito: [null as number | null],
    MnDeposito: [null as number | null],
  })

  ngOnInit(): void {
    this.NuCedula = this.actUser.NuCedula;
    this.NoContrato = this.actUser.NoContrato;
    this.client = this.actUser.Nombre;
    this.email = this.actUser.email;
    this.montoContrato = this.actUser.MnContrato;
    this.descuento = this.actUser.MnDescuento;
    this.MnInicial = this.actUser.MnInicial;
    this.montoPagadoBase = Number(this.actUser.MnPagado ?? 0);
    this.montoSaldoBase = Number(this.actUser.MnSaldo ?? 0);

    this.montoPagado = this.montoPagadoBase;
    this.montoSaldo = this.montoSaldoBase;

    console.log(this.codigoActo, this.NoContrato, this.NuCedula);

    console.log("data", this.actUser);

    console.log("MnCosto", this.totalPerStudent);
    
    this.actContractService.getPaymentDataByUser(
      this.codigoActo,
      String(this.NoContrato),
      String(this.NuCedula)
    ).subscribe({
      next: (response) => {
        console.log('Payment data for user:', response.data[0]);
      },
      error: (error) => {
        console.error('Error fetching payment data for user:', error);
      }
    });

    // this.recibos$ = this.actContractService.getRecibosByUserContract(this.NoContrato).pipe(
    //   map(response => response.data)
    // );

    this.actContractService.getRecibosByUserContract(this.NoContrato);

    this.loadRecibos();

    this.banksService.getMetodoPago().subscribe({
      next: (response) => {
        this.metodosPago = response.map((item: any) => item.nombreMetodoPago);
        console.log('Métodos de pago:', this.metodosPago);
      }
    })

    this.banksService.getAllBanks().subscribe({
      next: (response) => {
        this.banks = response.map((item: any) => item.Bancos);
        console.log('Bancos:', this.banks);
      }
    })

    this.reciboPagoForm.disable();

    this.recibosSubject.next(this.pendingRecibos);
    this.abonosSubject.next(this.pendingAbonos);
  }

  private loadRecibos(){
     this.recibos$ = this.actContractService.refreshRecibosObservable$.pipe(
      startWith(null),
      switchMap(() => {
        console.log('Fetching recibos for contract:', this.NoContrato);
        return this.actContractService.getRecibosByUserContract(this.NoContrato)
      }),
      tap((recibos: any[]) => {
          this.totalRecibos = recibos.reduce(
            (total, recibo) => total + Number(recibo.mnrecibo ?? 0),
            0
          );
      })
    )
  }

//   private refreshPaymentData() {
//   this.actContractService.getPaymentDataByUser(
//     this.codigoActo,
//     String(this.NoContrato),
//     String(this.NuCedula)
//   ).subscribe({
//     next: (res: any) => {
//       // Ajusta según la forma exacta de la respuesta
//       this.montoPagado = res.MnPagado ?? this.montoPagado;
//       this.montoSaldo = res.MnSaldo ?? this.montoSaldo;
//       // Si quieres actualizar montoSelectedRecibo también, recarga recibos o encontrar el recibo
//     },
//     error: (err) => console.error('Error refresh payment data', err)
//   });
// }

private refreshPaymentData() {
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

      this.montoPagadoBase = Number(data?.MnPagado ?? this.montoPagadoBase);
      this.montoSaldoBase = Number(data?.MnSaldo ?? this.montoSaldoBase);

      this.montoPagado = this.montoPagadoBase + this.totalAbonos;
      this.montoSaldo = this.montoSaldoBase - this.totalAbonos;
    },
    error: (err) => console.error('Error refresh payment data', err)
  });
}

  // onSubmit(){
  //   if(this.selectedRecibo){
  //     const formData = this.reciboPagoForm.value;
  //     const nuevoMonto = Number(formData.mnrecibo ?? 0);
  //     const montoRecibo = Number(this.montoSelectedRecibo ?? 0);

  //      if (this.totalAbonos + nuevoMonto > montoRecibo) {
  //         this.messageService.add({
  //           severity: 'warn',
  //           summary: 'No permitido',
  //           detail: 'El total de abonos excede el monto del recibo seleccionado'
  //         });
  //         return;
  //     }

  //     formData.NoContrato = this.NoContrato;
  //     formData.NuCedula = this.NuCedula;
  //     formData.NoRecibo = this.selectedRecibo;
  //     formData.Fecha = new Date().toISOString();
  //     formData.TipoOperacion = formData.MaFormPag;
  //     formData.TxBanco = formData.TxBanco;
  //     formData.NuDeposito = formData.NuRefDocBan;
  //     formData.MnDeposito = formData.mnrecibo;
      
  //     this.actContractService.addDeposito(formData).subscribe({
  //       next: (response) => {
  //         console.log('Depósito agregado:', response);
  //         this.reciboPagoForm.reset();

  //         this.totalAbonos += nuevoMonto;
  //         this.montoPagado = this.montoPagadoBase + this.totalAbonos;
  //         this.montoSaldo = this.montoSaldoBase - this.totalAbonos;
  //         this.saldoRestante = Number(this.montoSelectedRecibo ?? 0) - this.totalAbonos;

  //         this.loadAbonos();
  //         this.refreshPaymentData();
  //         this.actualizarEstadoCierre();
  //       },
  //       error: (error) => {
  //         console.error('Error al agregar depósito:', error);
  //         this.messageService.add({severity:'error', summary: 'Error', detail: 'Error al agregar depósito'});
  //       }
  //     });

  //   }else{
  //     const formData = this.reciboPagoForm.value;
  //     formData.CodigoActo = this.codigoActo;
  //     formData.NoContrato = this.NoContrato;
  //     formData.NuCedula = this.NuCedula;
  //     formData.ferecibo = new Date().toISOString(); // Asignar la fecha actual en formato ISO
  //     formData.mnsaldorec = this.montoSelectedRecibo;
  //     formData.NoRecibo = this.NoRecibo;
  //     formData.MnDeposito = formData.mnrecibo;

  //     console.log("datos form", formData);

  //     const nuevoMonto = Number(formData.mnrecibo ?? 0);

  //     if (!this.addReciboCheck(nuevoMonto)) {
  //       this.messageService.add({
  //         severity: 'warn',
  //         summary: 'No permitido',
  //         detail: 'El nuevo recibo excede el monto del contrato'
  //       });
  //       return;
  //     }

  //     this.actContractService.addARecibo(formData).subscribe({
  //       next: (response) => {
  //         console.log('Recibo agregado:', response);
  //         this.messageService.add({severity:'success', summary: 'Éxito', detail: 'Recibo agregado correctamente'});
  //         const montoNuevoRecibo = Number(formData.mnrecibo ?? 0);
  //         const noReciboNuevo = Number(formData.NoRecibo ?? this.NoRecibo ?? 0);
  //         this.NoRecibo = noReciboNuevo;
  //         this.selectedRecibo = noReciboNuevo;
  //         this.montoSelectedRecibo = montoNuevoRecibo;
  //         this.totalAbonos = 0;
  //         this.saldoRestante = montoNuevoRecibo;
  //         this.facturado = false;
  //         this.puedeCerrar = false;
  //         this.isAdding = false;

  //         this.reciboPagoForm.reset();

  //         this.loadRecibos();
  //         this.loadAbonos();
  //         this.actualizarEstadoCierre();
  //         this.refreshPaymentData();

  //       },
  //       error: (error) => {
  //         console.error('Error al agregar recibo:', error);
  //         this.messageService.add({severity:'error', summary: 'Error', detail: 'Error al agregar recibo'});
  //       }
  //     });
  //   }
  // }

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

  // --- VALIDACIÓN: No sobrepasar el total del contrato ---
  // Calculamos todo lo abonado en la memoria actual
  const totalAbonosMemoria = this.pendingAbonos.reduce(
    (sum, a) => sum + Number(a.MnDeposito ?? 0),
    0
  );
  
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

  // --- CASO A: CREAR UN NUEVO RECIBO (Primer abono) ---
  if (this.isAdding || !this.selectedRecibo) {
    const nuevoNoRecibo = Number(this.NoRecibo ?? 1);

    const nuevoRecibo = {
      NoRecibo: nuevoNoRecibo,
      ferecibo: formData.ferecibo || new Date().toISOString(),
      mnrecibo: montoInput, // Inicia con el valor del primer abono
      mnsaldorec: montoInput,
      TxConcepRec: formData.TxConcepRec ?? '',
      NoContrato: this.NoContrato,
      NuCedula: this.NuCedula,
      CodigoActo: this.codigoActo,
      MaFormPag: formData.MaFormPag ?? '',
      TxBanco: formData.TxBanco ?? '',
    };

    this.pendingRecibos.push(nuevoRecibo);
    this.selectedRecibo = nuevoNoRecibo;
    this.NoRecibo = nuevoNoRecibo;
    this.fechaSelectedRecibo = nuevoRecibo.ferecibo;
    this.observacion = nuevoRecibo.TxConcepRec;
    this.isAdding = false;

  } else {
    // --- CASO B: AGREGAR ABONOS A UN RECIBO YA EXISTENTE ---
    // Buscamos el recibo en la lista temporal y le sumamos el nuevo abono a su monto total
    const reciboExistente = this.pendingRecibos.find(
      r => Number(r.NoRecibo) === Number(this.selectedRecibo)
    );

    if (reciboExistente) {
      reciboExistente.mnrecibo = Number(reciboExistente.mnrecibo ?? 0) + montoInput;
    }
  }

  // Guardar el abono en el array temporal en memoria
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

  // Actualizamos la tabla superior de recibos con una nueva referencia
  this.recibosSubject.next([...this.pendingRecibos]);

  // Recalculamos los totales acumulados y actualizamos la tabla de abonos
  this.sincronizarEstadoReciboSeleccionado();

  // Limpiar el formulario de las formas de pago para la siguiente entrada
  this.reciboPagoForm.patchValue({
    MaFormPag: '',
    TxBanco: '',
    NuRefDocBan: null,
    ferecibo: new Date().toISOString(),
    mnrecibo: null
  })
}


 private addReciboCheck(nuevoMonto: number): boolean {
  const montoContrato = Number(this.montoContrato ?? 0);
  return this.totalRecibos + nuevoMonto <= montoContrato;
}

//  private loadAbonos() {
//   this.abonos$ = this.actContractService.refreshAbonosObservable$.pipe(
//     startWith(null),
//     switchMap(() =>
//       this.actContractService.getAbonosByUserContract(
//         String(this.NoContrato),
//         String(this.NuCedula),
//         this.NoRecibo
//       )
//     ),
//     map(response => response.data),
//       tap(abonos => {
//       this.totalAbonos = abonos.reduce(
//         (total: number, abono: any) => total + Number(abono.MnDeposito ?? 0),
//         0
//       );

      
//       const montoSeleccionado = Number(this.montoSelectedRecibo ?? 0);

//       this.saldoRestante = montoSeleccionado - this.totalAbonos;

//       this.montoPagado = this.montoPagadoBase + this.totalAbonos;
//       this.montoSaldo = this.montoSaldoBase - this.totalAbonos;
//       this.actualizarEstadoCierre();
//     })
//   );
// }

  // selectRecibo(recibo: any){
  //   console.log('Selected recibo:', recibo);
  //   this.NoRecibo = recibo.NoRecibo;
  //   this.selectedRecibo = recibo.NoRecibo;
  //   this.fechaSelectedRecibo = recibo.ferecibo;
  //   this.montoSelectedRecibo = recibo.mnrecibo;
  //   this.observacion = recibo.TxConcepRec;

    
  //   this.facturado = false;
  //   this.puedeCerrar = false

  //   this.reciboPagoForm.enable();
  //   this.loadAbonos();
  //   this.actualizarEstadoCierre();
    
  //   console.log(this.abonos$)
  // }

 private loadAbonos() {
  this.abonos$ = this.actContractService.refreshAbonosObservable$.pipe(
    startWith(null),
    switchMap(() =>
      this.actContractService.getAbonosByUserContract(
        String(this.NoContrato),
        String(this.NuCedula),
        this.NoRecibo
      )
    ),
    map(response => {
      const abonosBD = response?.data ?? [];

      // Filtrar abonos pendientes en memoria SOLO para el recibo actualmente seleccionado
      const abonosMemoria = this.pendingAbonos.filter(
        (abono: any) => Number(abono.NoRecibo) === Number(this.NoRecibo)
      );

      // Combinar ambos orígenes de datos
      return [...abonosBD, ...abonosMemoria];
    }),
    tap(abonos => {
      // 1. Total abonos de ESTE recibo en particular
      this.totalAbonos = abonos.reduce(
        (total: number, abono: any) => total + Number(abono.MnDeposito ?? 0),
        0
      );

      // 2. Obtener el monto seleccionado
      const reciboActual = this.pendingRecibos.find(
        r => Number(r.NoRecibo) === Number(this.NoRecibo)
      );

      if (reciboActual) {
        this.montoSelectedRecibo = Number(reciboActual.mnrecibo ?? this.totalAbonos);
      } else if (!this.montoSelectedRecibo || this.montoSelectedRecibo === 0) {
        this.montoSelectedRecibo = this.totalAbonos;
      }

      const montoSeleccionado = Number(this.montoSelectedRecibo ?? 0);
      this.saldoRestante = Math.max(0, montoSeleccionado - this.totalAbonos);

      // 3. RECALCULAR PAGADO Y SALDO GLOBAL DEL CONTRATO
      // Solo sumamos/restamos los abonos temporales que están en memoria (sin guardar en BD aún)
      const totalAbonosEnMemoria = this.pendingAbonos.reduce(
        (total: number, abono: any) => total + Number(abono.MnDeposito ?? 0),
        0
      );

      this.montoPagado = this.montoPagadoBase + totalAbonosEnMemoria;
      this.montoSaldo = Math.max(0, this.montoSaldoBase - totalAbonosEnMemoria);

      this.actualizarEstadoCierre();
    })
  );
}

selectRecibo(recibo: any) {
  this.NoRecibo = recibo.NoRecibo;
  this.selectedRecibo = recibo.NoRecibo;
  this.fechaSelectedRecibo = recibo.ferecibo;
  this.observacion = recibo.TxConcepRec;
  this.montoSelectedRecibo = Number(recibo.mnrecibo ?? 0);

  this.isAdding = false;
  this.reciboPagoForm.enable();

  // Reconfiguramos / Disparamos la carga reactiva de abonos
  this.loadAbonos(); 
  // O si tienes un Subject disparador en tu servicio:
  // this.actContractService.refreshAbonosSubject.next();
}

  get tieneReciboPendiente(): boolean {
  const tieneAbonosSinGuardar = this.pendingAbonos.length > 0;
  return this.isAdding || tieneAbonosSinGuardar;
}

  // add(){
  //   if (this.bloquearSiReciboPendiente(
  //     'Debes terminar primero el proceso de facturación antes de agregar un nuevo recibo'
  //   )) {
  //     return;
  //   }

  //     this.reciboPagoForm.enable();
  //       setTimeout(() => {
  //     const el = document.querySelector<HTMLInputElement>(
  //       'input[formcontrolname="mnrecibo"]'
  //     );
  //     el?.focus();
  //   }, 0);

  //   this.settingsService.getSettings().subscribe({
  //     next: (res: any) => {
  //       console.log(res) // Incrementar el número de recibo basado en la configuración actual
  //       const NoRecibo = res.NoRecibo + 1; // Suponiendo que la configuración devuelve un array y el número de recibo está en la primera posición
  //       this.NoRecibo = NoRecibo;
  //     }
  //   })
  //   this.fechaSelectedRecibo = new Date().toISOString();
  //   this.isAdding = true;
  // }

  add() {
  if (this.bloquearSiReciboPendiente(
    'Debes terminar primero el proceso de facturación antes de agregar un nuevo recibo'
  )) {
    return;
  }

      this.reciboPagoForm.enable();

      const hoy = new Date();
      const fechaFormateada = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

      this.reciboPagoForm.patchValue({
        ferecibo: fechaFormateada, // "2026-07-21"
      });

        setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(
        'textarea[formcontrolname="TxConcepRec"]'
      );
      el?.focus();
    }, 0);

  this.settingsService.getSettings().subscribe({
    next: (res: any) => {
      const NoRecibo = res.NoRecibo + 1;
      this.NoRecibo = NoRecibo;
      this.selectedRecibo = NoRecibo;
      this.montoSelectedRecibo = 0;
      this.fechaSelectedRecibo = new Date().toISOString();
      this.observacion = '';
      this.isAdding = true;

      // Limpiar tabla de abonos para el nuevo recibo
      this.abonosSubject.next([]);
    }
  });
}
  
 cancel() {
  this.pendingRecibos = [];
  this.pendingAbonos = [];
  this.recibosSubject.next([]);
  this.abonosSubject.next([]);

  this.NoRecibo = 0;
  this.fechaSelectedRecibo = '';
  this.montoSelectedRecibo = null;
  this.observacion = '';
  this.selectedRecibo = 0;
  this.facturado = false;
  this.puedeCerrar = true;
  this.isAdding = false;

  this.reciboPagoForm.reset();
  this.reciboPagoForm.disable();
}

  private actualizarEstadoCierre() {
    this.puedeCerrar = Number(this.montoSelectedRecibo ?? 0) > 0 && this.saldoRestante <= 0;
  }

  
  get bloquearAcciones(): boolean {    
    return this.tieneReciboPendiente;
  }


  // close() {
  //     if (this.bloquearSiReciboPendiente(
  //     'Debes completar y facturar antes de cerrar'
  //   )) {
  //     return;
  //   }


  //   if (!this.puedeCerrar) {
  //     this.messageService.add({
  //       severity: 'warn',
  //       summary: 'No permitido',
  //       detail: 'Debes completar el monto y facturar antes de cerrar'
  //     });
  //     return;
  //   }

  //   this.ref.close();
  // }

  close() {
    if (this.facturado || this.puedeCerrar) {
    this.ref.close(true);
    return;
  }

  // Si hay cambios locales no facturados, advertir al usuario
  if (this.pendingAbonos.length > 0 && !this.facturado) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Cambios no guardados',
      detail: 'Tienes abonos pendientes de facturar. Presiona Facturar antes de cerrar o Cancela la operación.'
    });
    return;
  }

  this.ref.close();
}

// facturar() {
//   if (this.bloquearSiReciboPendiente(
//     'Primero debes completar los abonos del recibo actual'
//   )) {
//     return;
//   }

//   if (this.saldoRestante > 0) {
//     this.messageService.add({
//       severity: 'warn',
//       summary: 'Pendiente',
//       detail: 'Aun falta completar el valor total'
//     });
//     return;
//   }

//   const payload = {
//     MnContrato: this.montoContrato,
//     MnDescuento: this.descuento,
//     MnInicial: this.MnInicial,
//     MnPagado: this.montoPagado,
//     MnSaldo: this.montoSaldo
//   };

//   this.actContractService.updateTotals(this.codigoActo, this.NuCedula, payload).subscribe({
//     next: (res: any) => {
//       const data = res?.data?.[0] ?? res;

//       this.montoContrato = Number(data?.MnContrato ?? this.montoContrato);
//       this.descuento = Number(data?.MnDescuento ?? this.descuento);
//       this.MnInicial = Number(data?.MnInicial ?? this.MnInicial);
//       this.montoPagado = Number(data?.MnPagado ?? this.montoPagado);
//       this.montoSaldo = Number(data?.MnSaldo ?? this.montoSaldo);

//       this.puedeCerrar = true;
//       this.facturado = true;

//       this.messageService.add({
//         severity: 'success',
//         summary: 'Facturación',
//         detail: 'Se ha actualizado el pago correctamente'
//       });
//     },
//     error: (err) => {
//       console.error('Error al actualizar los totales:', err);
//       this.messageService.add({
//         severity: 'error',
//         summary: 'Error',
//         detail: 'No se pudieron actualizar los totales'
//       });
//     }
//   });
// }

facturar() {
  const montoReciboActual = Number(this.montoSelectedRecibo ?? 0);
  const tieneAbonos = this.pendingAbonos.length > 0;

  // REGLA 1: No se puede facturar si el recibo está en $0 o sin abonos
  if (montoReciboActual <= 0 && !tieneAbonos) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Recibo en $0',
      detail: 'No puedes facturar un recibo sin monto o sin abonos registrados.'
    });
    return;
  }

  this.sincronizarEstadoReciboSeleccionado();

  if (this.saldoRestante > 0) {
    this.messageService.add({
      severity: 'warn',
      summary: 'Pendiente',
      detail: 'Aún falta completar el valor total'
    });
    return;
  }

  const payload = {
    MnContrato: this.montoContrato,
    MnDescuento: this.descuento,
    MnInicial: this.MnInicial,
    MnPagado: this.montoPagado,
    MnSaldo: this.montoSaldo
  };

  this.actContractService.updateTotals(this.codigoActo, this.NuCedula, payload).subscribe({
    next: (res: any) => {
      const data = res?.data?.[0] ?? res;

      this.montoContrato = Number(data?.MnContrato ?? this.montoContrato);
      this.descuento = Number(data?.MnDescuento ?? this.descuento);
      this.MnInicial = Number(data?.MnInicial ?? this.MnInicial);
      this.montoPagado = Number(data?.MnPagado ?? this.montoPagado);
      this.montoSaldo = Number(data?.MnSaldo ?? this.montoSaldo);

      this.guardarRecibosYAbonosEnBD();

      this.puedeCerrar = true;
      this.facturado = true;

      this.messageService.add({
        severity: 'success',
        summary: 'Facturación',
        detail: 'Se ha actualizado el pago correctamente'
      });

      const reciboAImprimir = Number(this.selectedRecibo || this.NoRecibo);

      if (reciboAImprimir && reciboAImprimir > 0) {
        // Opción A: Si usas la versión simple de impresión
        this.print(reciboAImprimir);

        // Opción B: Si usas la versión unificada onSubmitPrint (p. ej. previsualizar o descargar)
        // this.onSubmitPrint('PDF', true, reciboAImprimir); 
      }

    },
    error: (err) => {
      console.error('Error al actualizar los totales:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron actualizar los totales'
      });
    }
  });
}

private guardarRecibosYAbonosEnBD() {
  if (this.pendingRecibos.length === 0) return;

  const recibos = [...this.pendingRecibos];
  const abonos = [...this.pendingAbonos];

  // Limpiamos los arreglos temporales antes de procesar
  this.pendingRecibos = [];
  this.pendingAbonos = [];

  // Procesar cada recibo secuencialmente
  recibos.forEach((recibo) => {
    this.actContractService.addARecibo(recibo).pipe(
      concatMap((resRecibo) => {
        console.log('Recibo creado exitosamente en BD:', resRecibo);

        // Filtrar abonos asociados usando conversión numérica flexible (evita problemas number vs string)
        const abonosDelRecibo = abonos.filter(
          (a) => Number(a.NoRecibo) === Number(recibo.NoRecibo)
        );

        if (abonosDelRecibo.length === 0) {
          return of([]); // Si no hay abonos para este recibo, omitimos
        }

        // Crear array de Observables para guardar todos los abonos en paralelo/grupo
        const peticionesAbonos = abonosDelRecibo.map((abono) =>
          this.actContractService.addDeposito(abono)
        );

        return forkJoin(peticionesAbonos);
      })
    ).subscribe({
      next: (resAbonos) => {
        console.log('Todos los abonos del recibo guardados en BD:', resAbonos);
        this.messageService.add({
          severity: 'success',
          summary: 'Guardado Completo',
          detail: 'Recibos y abonos registrados correctamente'
        });
        
        // Recargar datos desde la base de datos
        this.loadRecibos();
        this.loadAbonos();
      },
      error: (err) => {
        console.error('Error al persistir recibo y abonos en BD:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error al Guardar',
          detail: 'Ocurrió un problema al registrar los abonos en el servidor'
        });
      }
    });
  });

  this.recibosSubject.next([]);
  this.abonosSubject.next([]);
}

  private bloquearSiReciboPendiente(mensaje: string){
    if(this.tieneReciboPendiente){
      this.messageService.add({
        severity: 'warn',
        summary: 'No permitido',
        detail: mensaje
      });
      return true;
    }

    return false;
  }

private sincronizarEstadoReciboSeleccionado() {
  if (!this.selectedRecibo) return;

  // 1. Filtrar todos los abonos en memoria del recibo seleccionado
  const abonosDelRecibo = this.pendingAbonos.filter(
    (abono: any) => Number(abono.NoRecibo) === Number(this.selectedRecibo)
  );

  // 2. Calcular la suma acumulada de los abonos de ESTE recibo
  this.totalAbonos = abonosDelRecibo.reduce(
    (sum: number, abono: any) => sum + Number(abono.MnDeposito ?? 0),
    0
  );

  // 3. Asignar la suma total acumulada al campo del recibo
  this.montoSelectedRecibo = this.totalAbonos;

  // 4. Calcular los acumulados generales del contrato
  const totalAbonosTodosLosRecibos = this.pendingAbonos.reduce(
    (sum: number, abono: any) => sum + Number(abono.MnDeposito ?? 0),
    0
  );

  this.montoPagado = this.montoPagadoBase + totalAbonosTodosLosRecibos;
  this.montoSaldo = Math.max(0, this.montoSaldoBase - totalAbonosTodosLosRecibos);

  // 5. Refrescar la tabla de abonos emitiendo una nueva referencia del array
  this.abonosSubject.next([...abonosDelRecibo]);

  this.actualizarEstadoCierre();
}

  print(NoRecibo: number) {
    this.printRef = this.dialogService.open(PrintModalComponent, {
            header: "Qué te gustaria hacer con el recibo?",
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
    })
  }
}