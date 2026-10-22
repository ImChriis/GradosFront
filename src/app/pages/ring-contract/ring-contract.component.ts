import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { LoaderComponent } from '../../@core/components/loader/loader.component';
import {
  RingContractQuery,
  RingContractService,
} from '../../@core/services/ring-contract.service';
import { AuthService } from '../../@core/services/auth.service';
import { SettingsService } from '../../@core/services/settings.service';
import { TabsModule } from 'primeng/tabs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { SearchUserComponent } from './components/search-user/search-user.component';
import { SearchSpecialityComponent } from './components/search-speciality/search-speciality.component';
import { SearchInstitutionComponent } from './components/search-institution/search-institution.component';
import { PaymentsComponent } from './components/payments/payments.component';
import { Client } from '../../@core/models/client.model';
import { Speciality } from '../../@core/models/speciality.model';
import { Institution } from '../../@core/models/institution.model';
import { OnlyNumbersDirective } from '../../@core/directives/only-numbers.directive';

/** La tabla guarda los flags como texto: '0' | '1' */
const aFlag = (v: any): boolean => v === true || v === 1 || v === '1' || v === 'S';

/** Las fechas vienen como '1900-01-01' cuando el sistema antiguo no tenía dato */
const aFecha = (v: any): string => {
  if (!v || String(v).startsWith('1900-01-01')) return '';
  return String(v).slice(0, 10);
};

@Component({
  selector: 'app-ring-contract',
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    ReactiveFormsModule,
    LoaderComponent,
    TabsModule,
    OnlyNumbersDirective
  ],
  templateUrl: './ring-contract.component.html',
  styleUrl: './ring-contract.component.scss',
})
export class RingContractComponent implements OnInit {
  private ringContractService = inject(RingContractService);
  private messageService = inject(MessageService);
  private auth = inject(AuthService);
  private settingsService = inject(SettingsService);
  private dialogService = inject(DialogService);
  private fb = inject(FormBuilder);
  private ref = inject(DynamicDialogRef, { optional: true });

  contracts$!: Observable<any>;
  isLoading = signal(false);
  activeTab = signal<string | number>(0);

  /** Estado de los botones de acción, mismo patrón que act-contract */
  isAdding = false;
  isEnabled = false;
  selectedContract: any | null = null;

  ringForm = this.fb.group({
    // --- cabecera ---
    NoContrato: ['', Validators.required],
    nucedula: ['', Validators.required],
    txnombre: [{ value: '', disabled: true }],
    MaTpCont: ['1'],

    // --- pestaña Detalles ---
    titulo: [''],
    especialidad: [''],
    siglas: [''],
    modelo: [''],
    kilate: [''],
    medida: [''],
    peso: [''],
    cazirc: [''],
    tpzirc: [''],
    MnCostoAnillo: [0],
    TxObservacion: [''],
    txconcepto: [''],
    feinicio: [''],
    InActivo: [false],
    Anulado: [false],
    Exonerado: [false],

    // --- pestaña Regalías (flags '1'/'0') ---
    inmedalla: [false],
    inestuche: [false],
    incinta: [false],
    inbotoninst: [false],
    inbotesp: [false],
    indiploma: [false],
    inportadip: [false],
    inalbumesp: [false],
    inalbumsenc: [false],
    inllavero: [false],
    inportanombre: [false],
    infotografia: [false],
    intoga: [false],
    invideo: [false],
    indescuento: [false],
    Inotroreg: [false],
    inplaca: [false],
    cafotografia: ['0'],
    TxOtroReg: [''],
    TxPlaca: [''],
    TxDiploma: [''],

    // --- pestaña Estado ---
    MaEstado: ['1'],
    FeSolici: [''],
    FeFin: [''],
    Feinifab: [''],
    FeFinFab: [''],
    FeIniEng: [''],
    FeFinEng: [''],
    nuordenfab: [''],

    // --- pestaña Saldo ---
    // Arrancan vacíos (igual que add-contract de actContract) y solo
    // mncontrato se digita al crear; mninicial solo se digita sobre un contrato existente
    mncontrato: [''],
    mndescuento: [''],
    mninicial: [''],
    mnpagado: [{ value: '', disabled: true }],
    mnsaldo: [{ value: '', disabled: true }],
  });

  ngOnInit() {
    this.loadContracts();

    // Cualquier escritura recarga la tabla principal (mismo patrón que act-contract)
    this.ringContractService.refreshObservable$.subscribe(() => this.loadContracts());

    // Puebla el signal de CodSucursal que usa el modal de pagos.
    // Sin esto el formulario del modal se construye con CodSucursal null.
    this.settingsService.getSettings().subscribe();

    this.ringForm.disable();
  }

  loadContracts(query: RingContractQuery = {}) {
    this.isLoading.set(true);
    this.contracts$ = this.ringContractService.getContracts(query);
    this.isLoading.set(false);
  }

  // ----------------------------------------------------------------
  //  Selección de contrato
  // ----------------------------------------------------------------

  onSelectContract(contract: any) {
    this.isLoading.set(true);

    this.ringContractService.getContractById(contract.id).subscribe({
      next: (res: any) => {
        this.patchForm(res?.data ?? contract);
        this.loadSaldo(contract.id);
      },
      error: () => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar el contrato.',
        });
      },
    });

    this.selectedContract = contract;
    this.isEnabled = true;
    this.isAdding = true;
    // Sin esto el formulario queda deshabilitado y no se puede editar nada
    this.ringForm.enable();
  }

  private loadSaldo(id: number) {
    this.ringContractService.getSaldo(id).subscribe({
      next: (res: any) => {
        const s = res?.data;
        if (s) {
          // Refresca los 5 montos: así el monto inicial que fija el primer
          // recibo se refleja en el input apenas se cierra el modal de pagos
          this.ringForm.patchValue({
            mncontrato: s.mncontrato ?? '',
            mndescuento: s.mndescuento ?? '',
            mninicial: s.mninicial ?? '',
            mnpagado: s.pagado,
            mnsaldo: s.saldo,
          });
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private patchForm(c: any) {
    this.ringForm.patchValue({
      NoContrato: c.NoContrato ?? '',
      nucedula: c.nucedula ?? '',
      txnombre: c.txnombre ?? '',
      MaTpCont: c.MaTpCont ?? '1',

      titulo: c.titulo ?? '',
      especialidad: c.especialidad ?? '',
      siglas: c.siglas ?? '',
      modelo: c.modelo ?? '',
      kilate: c.kilate ?? '',
      medida: c.medida ?? '',
      peso: c.peso ?? '',
      cazirc: c.cazirc ?? '',
      tpzirc: c.tpzirc ?? '',
      MnCostoAnillo: c.MnCostoAnillo ?? 0,
      TxObservacion: c.TxObservacion ?? '',
      txconcepto: c.txconcepto ?? '',
      feinicio: aFecha(c.feinicio),
      InActivo: aFlag(c.InActivo),
      Anulado: aFlag(c.Anulado),
      Exonerado: aFlag(c.Exonerado),

      inmedalla: aFlag(c.inmedalla),
      inestuche: aFlag(c.inestuche),
      incinta: aFlag(c.incinta),
      inbotoninst: aFlag(c.inbotoninst),
      inbotesp: aFlag(c.inbotesp),
      indiploma: aFlag(c.indiploma),
      inportadip: aFlag(c.inportadip),
      inalbumesp: aFlag(c.inalbumesp),
      inalbumsenc: aFlag(c.inalbumsenc),
      inllavero: aFlag(c.inllavero),
      inportanombre: aFlag(c.inportanombre),
      infotografia: aFlag(c.infotografia),
      intoga: aFlag(c.intoga),
      invideo: aFlag(c.invideo),
      indescuento: aFlag(c.indescuento),
      Inotroreg: aFlag(c.Inotroreg),
      inplaca: aFlag(c.inplaca),
      cafotografia: c.cafotografia ?? '0',
      TxOtroReg: c.TxOtroReg ?? '',
      TxPlaca: c.TxPlaca ?? '',
      TxDiploma: c.TxDiploma ?? '',

      MaEstado: c.MaEstado ?? '1',
      FeSolici: aFecha(c.FeSolici),
      FeFin: aFecha(c.FeFin),
      Feinifab: aFecha(c.Feinifab),
      FeFinFab: aFecha(c.FeFinFab),
      FeIniEng: aFecha(c.FeIniEng),
      FeFinEng: aFecha(c.FeFinEng),
      nuordenfab: c.nuordenfab ?? '',

      mncontrato: c.mncontrato ?? '',
      mndescuento: c.mndescuento ?? '',
      mninicial: c.mninicial ?? '',
    });
  }

  // ----------------------------------------------------------------
  //  Botones de acción
  // ----------------------------------------------------------------

  onAdd() {
    this.selectedContract = null;
    this.ringForm.reset({
      NoContrato: '',
      nucedula: '',
      txnombre: '',
      MaTpCont: '1',
      MaEstado: '1',
      cafotografia: '0',
      MnCostoAnillo: 0,
      mncontrato: '',
      mndescuento: '',
      mninicial: '',
      mnpagado: '',
      mnsaldo: '',
    });
    this.ringForm.enable();
    this.isEnabled = true;
    this.isAdding = true;
    this.activeTab.set(0);
  }

  onSave() {
    if (this.ringForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos incompletos',
        detail: 'El número de contrato y la cédula del cliente son obligatorios.',
      });
      return;
    }

    if (!this.selectedContract) {
      this.create();
      return;
    }

    // Guarda según la pestaña visible, igual que el backend está particionado
    const tab = this.activeTab();
    const id = this.selectedContract.id;

    if (tab === 2) {
      this.updateEstado(id);
    } else if (tab === 3) {
      this.updateTotals(id);
    } else {
      this.updateDetallesRegalias(id);
    }
  }

  onDelete() {
    // El backend no expone DELETE sobre `contratos`; la baja lógica es Anulado = '1'
    this.messageService.add({
      severity: 'info',
      summary: 'No disponible',
      detail: 'Este módulo no permite eliminar contratos. Use Anulado / Inactivo.',
    });
  }

  onCancel() {
    this.ringForm.reset();
    this.ringForm.disable();
    this.resetActions();
  }

  private resetActions() {
    this.isEnabled = false;
    this.isAdding = false;
    this.selectedContract = null;
  }

  // ----------------------------------------------------------------
  //  Escritura
  // ----------------------------------------------------------------

  private create() {
    const f = this.ringForm.getRawValue();

    this.ringContractService
      .createContract({
        NoContrato: f.NoContrato,
        nucedula: f.nucedula,
        CodUser: this.auth.CodUser(),
        // Único monto que se digita al crear; el backend calcula el resto
        mncontrato: f.mncontrato,
        ...this.detallesRegaliasPayload(),
      })
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Contrato creado',
            detail: `El contrato N° ${f.NoContrato} fue registrado.`,
          });
          this.onCancel();
        },
        error: (err) => this.showError(err, 'No se pudo crear el contrato.'),
      });
  }

  private updateDetallesRegalias(id: number) {
    this.ringContractService.updateContract(id, this.detallesRegaliasPayload()).subscribe({
      next: () => this.onSaved('Contrato actualizado'),
      error: (err) => this.showError(err, 'No se pudo actualizar el contrato.'),
    });
  }

  private updateEstado(id: number) {
    const f = this.ringForm.getRawValue();

    this.ringContractService
      .updateEstado(id, {
        MaEstado: f.MaEstado,
        FeSolici: f.FeSolici,
        FeFin: f.FeFin,
        Feinifab: f.Feinifab,
        FeFinFab: f.FeFinFab,
        FeIniEng: f.FeIniEng,
        FeFinEng: f.FeFinEng,
        nuordenfab: f.nuordenfab,
        feinicio: f.feinicio,
        txconcepto: f.txconcepto,
      })
      .subscribe({
        next: () => this.onSaved('Estado actualizado'),
        error: (err) => this.showError(err, 'No se pudo actualizar el estado.'),
      });
  }

  private updateTotals(id: number) {
    const f = this.ringForm.getRawValue();

    this.ringContractService
      .updateTotals(id, {
        mncontrato: f.mncontrato,
        mndescuento: f.mndescuento,
        mninicial: f.mninicial,
      })
      .subscribe({
        next: (res: any) => {
          const d = res?.data;
          if (d) {
            this.ringForm.patchValue({
              mncontrato: d.mncontrato,
              mndescuento: d.mndescuento,
              mninicial: d.mninicial,
              mnpagado: d.mnpagado,
              mnsaldo: d.mnsaldo,
            });
          }
          this.onSaved('Montos actualizados');
        },
        error: (err) => this.showError(err, 'No se pudieron actualizar los montos.'),
      });
  }

  /** Detalles y Regalías viajan juntos: el backend los guarda en el mismo PUT */
  private detallesRegaliasPayload() {
    const f = this.ringForm.getRawValue();

    return {
      titulo: f.titulo,
      especialidad: f.especialidad,
      siglas: f.siglas,
      modelo: f.modelo,
      kilate: f.kilate,
      medida: f.medida,
      peso: f.peso,
      cazirc: f.cazirc,
      tpzirc: f.tpzirc,
      MnCostoAnillo: f.MnCostoAnillo,
      TxObservacion: f.TxObservacion,
      txconcepto: f.txconcepto,
      MaTpCont: f.MaTpCont,
      feinicio: f.feinicio,
      InActivo: f.InActivo,
      Anulado: f.Anulado,
      Exonerado: f.Exonerado,

      inmedalla: f.inmedalla,
      inestuche: f.inestuche,
      incinta: f.incinta,
      inbotoninst: f.inbotoninst,
      inbotesp: f.inbotesp,
      indiploma: f.indiploma,
      inportadip: f.inportadip,
      inalbumesp: f.inalbumesp,
      inalbumsenc: f.inalbumsenc,
      inllavero: f.inllavero,
      inportanombre: f.inportanombre,
      infotografia: f.infotografia,
      intoga: f.intoga,
      invideo: f.invideo,
      indescuento: f.indescuento,
      Inotroreg: f.Inotroreg,
      inplaca: f.inplaca,
      cafotografia: f.cafotografia,
      TxOtroReg: f.TxOtroReg,
      TxPlaca: f.TxPlaca,
      TxDiploma: f.TxDiploma,
    };
  }

  private onSaved(summary: string) {
    this.messageService.add({ severity: 'success', summary, detail: 'Los cambios fueron guardados.' });
    this.onCancel();
  }

  private showError(err: any, fallback: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: err?.error?.error ?? err?.error?.message ?? fallback,
    });
  }

  // ----------------------------------------------------------------
  //  Saldo
  // ----------------------------------------------------------------

  /**
   * Modal de pagos, idéntico al de act-contract (dentro va Tipo = 2).
   * Al cerrarse se recarga el saldo para que montos, pagado y saldo
   * queden al día en la pestaña Saldo.
   */
  pay() {
    if (!this.selectedContract) {
      this.messageService.add({
        severity: 'warn',
        summary: 'No se ha seleccionado ningún contrato para ver los pagos.',
      });
      return;
    }

    this.ref = this.dialogService.open(PaymentsComponent, {
      header: 'Pagos',
      width: '90%',
      height: 'auto',
      modal: true,
      closeOnEscape: false,
      data: {
        contract: this.selectedContract,
      },
      breakpoints: {
        '960px': '90%',
        '640px': '100%',
      },
    });

    this.ref?.onClose.subscribe(() => {
      if (this.selectedContract) {
        this.loadSaldo(this.selectedContract.id);
      }
    });
  }

  // ----------------------------------------------------------------
  //  Selector de cliente
  // ----------------------------------------------------------------

  openSearchUserModal() {
    this.ref = this.dialogService.open(SearchUserComponent, {
      header: 'Seleccionar cliente',
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref?.onClose.subscribe((result: Client | null) => {
      if (!result) return;
      this.ringForm.patchValue({
        nucedula: result.nucedula ?? '',
        txnombre: result.txnombre ?? '',
      });
    });
  }

  /** Busca el título y de paso trae la especialidad que le corresponde */
  openSearchSpecialityModal() {
    this.ref = this.dialogService.open(SearchSpecialityComponent, {
      header: 'Seleccionar título y especialidad',
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref?.onClose.subscribe((result: Speciality | null) => {
      if (!result) return;
      this.ringForm.patchValue({
        titulo: result.Titulo ?? '',
        especialidad: result.Especialidad ?? '',
      });
    });
  }

  /** Busca la institución y de ahí toma las siglas */
  openSearchInstitutionModal() {
    this.ref = this.dialogService.open(SearchInstitutionComponent, {
      header: 'Seleccionar institución',
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
    });

    this.ref?.onClose.subscribe((result: Institution | null) => {
      if (!result) return;
      this.ringForm.patchValue({
        siglas: result.siglas ?? '',
      });
    });
  }
}
