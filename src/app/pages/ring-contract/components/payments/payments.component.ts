import { Component, inject, OnInit } from '@angular/core';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RingContractService } from '../../../../@core/services/ring-contract.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BanksService } from '../../../../@core/services/banks.service';
import { SettingsService } from '../../../../@core/services/settings.service';
import { UppercaseDirective } from '../../../../@core/directives/uppercase.directive';
import { OnlyNumbersDirective } from '../../../../@core/directives/only-numbers.directive';
import { MessageService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { PrintModalComponent } from '../../../act-contract/components/print-modal/print-modal.component';
import { OnlyAlphanumericsDirective } from '../../../../shared/directives/only-alphanumerics.directive';
import { ConfirmDeleteModalComponent } from '../../../../shared/components/modals/confirm-delete-modal/confirm-delete-modal.component';
import { AuthService } from '../../../../@core/services/auth.service';

/**
 * Modal de pagos de los contratos de anillo.
 *
 * Réplica del PaymentsComponent de act-contract. La única diferencia de datos es
 * `Tipo: ['2']` (1 = actos, 2 = anillos) y que la capa de persistencia apunta a
 * los endpoints de /ringContracts en lugar de los de /actContracts.
 *
 * Diferencia de montos con act: los valores de `contratos` se guardan como texto
 * ("215000" o "215.000,00"), así que pasan por `monto()` antes de ser números.
 */
@Component({
  selector: 'app-payments-ring',
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
  private ringContractService = inject(RingContractService);
  private dialogConfig = inject(DynamicDialogConfig);
  private banksService = inject(BanksService);
  private settingsService = inject(SettingsService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private ref = inject(DynamicDialogRef);
  private printRef = inject(DynamicDialogRef);
  private dialogService = inject(DialogService);
  private authsService = inject(AuthService);

  contract = this.dialogConfig.data.contract;
  contractId = this.contract.id;
  contractEmail = this.contract.txemail;

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

  /**
   * Tope real de pago: en anillos el saldo se calcula como
   * mncontrato - mndescuento - mnpagado (igual que hace el backend).
   */
  private get limitePago(): number {
    return Math.max(0, this.montoContrato - this.descuento);
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
    Tipo: ['2'], // Tipo 1 = Contrato de actos, 2 = Contrato de anillos
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
    this.NuCedula = this.contract.nucedula;
    this.NoContrato = this.contract.NoContrato;
    this.client = this.contract.txnombre;
    this.email = this.contractEmail;
    this.montoContrato = this.monto(this.contract.mncontrato);
    this.descuento = this.monto(this.contract.mndescuento);
    this.MnInicial = this.monto(this.contract.mninicial);

    this.reciboPagoForm.disable();

    this.loadInitialPaymentData();

    // El valor de CodSucursal se congela en el constructor del formulario. Si nadie
    // llamó a getSettings() antes de abrir el modal, sigue en null y un '' rompe
    // el INSERT de depositos (columna int). Lo reponemos en cuanto llegue.
    this.settingsService.getSettings().subscribe({
      next: (res: any) => {
        if (res?.CoSucursal) {
          this.reciboPagoForm.patchValue({ CodSucursal: String(res.CoSucursal) });
        }
      }
    });

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

  /**
   * Los montos de `contratos` son texto en formato venezolano: acepta
   * "215000", "215.000,00" y "215000.00" sin perder el valor.
   */
  private monto(valor: any): number {
    if (valor === null || valor === undefined || valor === '') return 0;
    if (typeof valor === 'number') return isNaN(valor) ? 0 : valor;

    const s = String(valor).trim().replace(/\s/g, '');
    const puntos = (s.match(/\./g) ?? []).length;
    const tieneComa = s.includes(',');

    let n: number;
    if (puntos && tieneComa) {
      // "1.400,00" -> el último separador es el decimal
      n = parseFloat(s.replace(/\./g, '').replace(',', '.'));
    } else if (tieneComa) {
      n = parseFloat(s.replace(',', '.'));
    } else if (puntos === 1) {
      const decimales = s.split('.')[1].length;
      // 3 decimales = separador de miles ("1.400"), si no es decimal ("1400.00")
      n = decimales === 3 ? parseFloat(s.replace(/\./g, '')) : parseFloat(s);
    } else if (puntos > 1) {
      n = parseFloat(s.replace(/\./g, ''));
    } else {
      n = parseFloat(s);
    }

    return isNaN(n) ? 0 : n;
  }

  private loadInitialPaymentData() {
    this.ringContractService.getContractById(this.contractId).subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;

        this.montoContrato = this.monto(data?.mncontrato ?? this.montoContrato);
        this.descuento = this.monto(data?.mndescuento ?? this.descuento);
        this.MnInicial = this.monto(data?.mninicial ?? this.MnInicial);

        this.montoPagadoBase = this.monto(data?.mnpagado);
        this.montoSaldoBase = this.monto(data?.mnsaldo) || Math.max(0, this.limitePago - this.montoPagadoBase);

        this.montoPagado = this.montoPagadoBase;
        this.montoSaldo = this.montoSaldoBase;

        if (data?.txemail) this.email = data.txemail;
      },
      error: (err) => {
        console.error('Error al obtener los datos del contrato:', err);
      }
    });

    this.ringContractService.getRecibos(this.contractId).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data ?? []);

        this.recibosBD = (Array.isArray(list) ? list : [list]).map((r: any) => ({
          ...r,
          mnrecibo: this.monto(r?.MnRecibo ?? r?.mnrecibo)
        }));
        this.totalRecibos = this.recibosBD.reduce((acc, r) => acc + Number(r?.mnrecibo ?? 0), 0);
        this.emitRecibos();
      },
      error: (err) => {
        console.error('Error al obtener recibos del contrato:', err);
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
    this.montoSaldo = Math.max(0, this.limitePago - this.montoPagado);
    this.actualizarEstadoCierre();
  }

  selectRecibo(recibo: any) {
    const numRecibo = Number(recibo.NoRecibo);
    this.NoRecibo = numRecibo;
    this.reciboDeTabla = 'tabla';
    this.selectedRecibo = numRecibo;
    this.fechaSelectedRecibo = recibo.ferecibo;
    this.observacion = recibo.TxConcepRec ?? '';
    this.montoSelectedRecibo = this.monto(recibo.MnRecibo ?? recibo.mnrecibo);

    this.isAdding = false;
    this.reciboPagoForm.disable();

    this.abonosBD = [];
    this.abonosSubject.next([]);

    this.ringContractService.getAbonos(this.contractId, numRecibo).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
        this.abonosBD = list.map((a: any) => ({ ...a, MnDeposito: this.monto(a?.MnDeposito) }));
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

    if (montoFuturoPagado > this.limitePago) {
      const maximoPermitido = Math.max(0, this.limitePago - (this.montoPagadoBase + totalAbonosMemoria));
      this.messageService.add({
        severity: 'error',
        summary: 'Monto Excedido',
        detail: `El monto excede el total del contrato (${this.limitePago}). Máximo permitido a agregar: ${maximoPermitido}`
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
          MaFormPag: formData.MaFormPag ?? '',
          TxBanco: formData.TxBanco ?? '',
          CodUser: formData.CodUser || null,
          CodSucursal: formData.CodSucursal || null,
          Tipo: formData.Tipo ?? '2'
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
      CodUser: formData.CodUser || null,
      CodSucursal: formData.CodSucursal || null
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
    const nuevoMontoSaldo = Math.max(0, this.limitePago - nuevoMontoPagado);

    this.guardarRecibosYAbonosEnBD().pipe(
      concatMap(() => {
        return this.ringContractService.getContractById(this.contractId);
      }),
      concatMap((resContract: any) => {
        const data = resContract?.data ?? resContract;
        this.MnInicial = this.monto(data?.mninicial ?? this.MnInicial);

        const payload = {
          mncontrato: this.montoContrato,
          mndescuento: this.descuento,
          mninicial: this.MnInicial,
          mnpagado: nuevoMontoPagado
        };

        return this.ringContractService.updateTotals(this.contractId, payload);
      })
    ).subscribe({
      next: (resUpdate: any) => {
        const data = resUpdate?.data ?? resUpdate;

        this.montoContrato = this.monto(data?.mncontrato ?? this.montoContrato);
        this.descuento = this.monto(data?.mndescuento ?? this.descuento);
        this.MnInicial = this.monto(data?.mninicial ?? this.MnInicial);

        this.montoPagado = this.monto(data?.mnpagado ?? nuevoMontoPagado);
        this.montoSaldo = this.monto(data?.mnsaldo ?? nuevoMontoSaldo);

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

    const peticionesRecibos = recibos.map((recibo) => {
      return this.ringContractService.createRecibo(recibo).pipe(
        concatMap((resRecibo: any) => {
          // El backend reasigna el correlativo si el número pedido ya existía.
          // Adoptamos el número real: si no, los depósitos se escriben contra un
          // NoRecibo que no existe y cada reintento duplica el recibo.
          this.adoptarNoRecibo(recibo, Number(resRecibo?.noRecibo ?? 0));
          return this.crearAbonosDe(recibo.NoRecibo);
        })
      );
    });

    return forkJoin(peticionesRecibos);
  }

  /** Propaga el NoRecibo definitivo a todo lo que apuntaba al número original */
  private adoptarNoRecibo(recibo: any, noReal: number) {
    const noPrevio = Number(recibo.NoRecibo);
    if (!noReal || noReal === noPrevio) return;

    recibo.NoRecibo = noReal;

    [...this.pendingAbonos, ...this.abonosBD].forEach((a: any) => {
      if (Number(a.NoRecibo) === noPrevio) a.NoRecibo = noReal;
    });

    if (Number(this.selectedRecibo) === noPrevio) {
      this.selectedRecibo = noReal;
      this.NoRecibo = noReal;
      this.reciboPagoForm.patchValue({ NoRecibo: noReal });
    }

    this.messageService.add({
      severity: 'warn',
      summary: 'Correlativo Ajustado',
      detail: `El recibo #${noPrevio} ya estaba usado. Se registró con el número #${noReal}.`
    });
  }

  private crearAbonosDe(noRecibo: number): Observable<any> {
    const abonosDelRecibo = this.pendingAbonos.filter(a => Number(a.NoRecibo) === Number(noRecibo));
    if (abonosDelRecibo.length === 0) return of([]);

    return forkJoin(abonosDelRecibo.map((abono) => this.ringContractService.createDeposito(abono)));
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
    this.ringContractService.anularRecibo(this.contractId, {
      NoRecibo: Number(recibo.NoRecibo),
      CodUser: this.CodUser()
    }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? {};

        recibo.Anulado = '1';

        if (data.mninicial !== undefined) this.MnInicial = this.monto(data.mninicial);
        if (data.mnpagado !== undefined) this.montoPagadoBase = this.monto(data.mnpagado);
        if (data.mnsaldo !== undefined) this.montoSaldoBase = this.monto(data.mnsaldo);

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
    if (!NoRecibo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Recibo inválido',
        detail: 'No se puede imprimir un recibo sin número válido'
      });
      return;
    } else {
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
}
