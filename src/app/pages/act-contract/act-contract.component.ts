import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { delay, finalize, Observable, startWith, switchMap, tap } from 'rxjs';
import { ActContractService } from '../../@core/services/act-contract.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RecalculateModalComponent } from './components/recalculate-modal/recalculate-modal.component';
import { MessageService } from 'primeng/api';
import { AddContractComponent } from './components/add-contract/add-contract.component';
import { RegisterUserComponent } from '../../shared/components/modals/register-user/register-user.component';
import { PaymentsComponent } from './components/payments/payments.component';
import { ActsService } from '../../@core/services/acts.service';
import { InstitutionsService } from '../../@core/services/institutions.service';
import { SpecialitiesService } from '../../@core/services/specialities.service';
import { OnlyNumbersDirective } from '../../@core/directives/only-numbers.directive';
import { SettingsService } from '../../@core/services/settings.service';
import { ActPlace } from '../../@core/models/act.model';
import { Institution } from '../../@core/models/institution.model'; 
import { UppercaseDirective } from '../../@core/directives/uppercase.directive';
import { LoaderComponent } from '../../@core/components/loader/loader.component';
import { RefreshComponent } from './components/refresh/refresh.component';

//temporal
interface Act {
  CodigoActo: number | null;
  Fecha: string;
  Hora: string;
  TxLugar: string;
  especialidad: string;
  siglas: string;
  nbInstitucion: string;
  titulo: string;
  MnCosto: null;
  CoLugar: number | null;
  CodigoInst: number | null;

  //users data
  Nombre: string;
  NoContrato: number;
  MnPagado: number;
  MnSaldo: number;
}

@Component({
  selector: 'app-act-contract',
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    ReactiveFormsModule,
    OnlyNumbersDirective,
    UppercaseDirective,
    LoaderComponent
  ],
  templateUrl: './act-contract.component.html',
  styleUrl: './act-contract.component.scss',
})
export class ActContractComponent implements OnInit{
  private actContractService =  inject(ActContractService);
  private fb = inject(FormBuilder);
  private dialogService = inject(DialogService);
  private messageService = inject(MessageService);
  private actsService = inject(ActsService);
  private institutionsService = inject(InstitutionsService);
  private specialitiesService = inject(SpecialitiesService);
  private settingsService = inject(SettingsService);
  acts$: Observable<Act[]> | null = null;
  actUsers$: Observable<any> | null = null;
  isAdding = true;
  isEnabled = false;
  selectedAct: any | null = null;
  selectActUser: any | null = null;
  codigoActo: number | null = null;
  total: number | null = null;
  totalPaid: number | null = null;
  saldo: number | null = null;
  usersAmount: number | null = null;
  ref: DynamicDialogRef | undefined;
  time!: string;
  actPlaces: ActPlace[] = [];
  instituctions: Institution[] = [];
  specialities: string[] = [];
  titulo: string[] = [];
  MnTotal!: number;
  CodigoActoGet!: number;
  siglas!: string;
  isLoading = signal(true);
  MnCosto!: number | null;

  actForm = this.fb.group({
    CodigoActo: this.fb.control<number | null>(null),
    Fecha: [''],
    Hora: [''],
    siglas: [''],
    titulo: [''],
    CoLugar: this.fb.control<number | null>(null),
    MnCosto: [null],
    TxLugar: [''],
    especialidad: [''],
    CodUser: [null],
    Culminada: [null],
    nbInstitucion: [''],
    CodigoInst: this.fb.control<number | null>(null),

    //users data
    Nombre: [''],
    NoContrato: [null],
    MnPagado: [null],
    MnSaldo: [null]
  })

  ngOnInit() {
    this.actContractService.getActs().subscribe(acts => {
      // console.log(acts);
    });

    // this.acts$ = this.actContractService.getActs();

    this.acts$ = this.actContractService.refreshObservable$.pipe(
      startWith(null),
      tap(() => this.isLoading.set(true)),
      switchMap(() => {
        return this.actContractService.getActs();
      }),
      delay(500),
      tap(() => this.isLoading.set(false))
    )


    this.actsService.getAllActsPlaces().subscribe(res => {
      this.actPlaces = res;
      // console.log("lugares: ", this.actPlaces);
    })

    this.institutionsService.getAllInstitutions().subscribe(res => {
      this.instituctions = res;
      // console.log("instituciones: ", this.instituctions);
    });

    this.specialitiesService.getAllSpecialities().subscribe(res => {
      this.specialities = res.map((spec: any) => spec.Especialidad);
      // console.log("especialidades: ", this.specialities);

      const titulos = res.map((spec: any) => spec.Titulo);
      this.titulo = [...new Set(titulos)]; // Filtra títulos únicos

    });

   this.loadSettings();
  
    this.total = null;
    this.totalPaid = null;
    this.saldo = null;
    this.usersAmount = null;
    this.actForm.disable();
    this.isAdding = false;
  }

  loadSettings(){
     this.settingsService.getSettings().subscribe((res: any) => {
      // console.log("settings: ", res);
      this.CodigoActoGet = res.NoActo + 1;
      // console.log("CodigoActoGet: ", this.CodigoActoGet);
    });
  }

onLugarChange(event: any) {
  const nombre = event.target.value;
  const lugar = this.actPlaces.find(p => p.TxLugar === nombre);

  this.actForm.patchValue({
    CoLugar: lugar?.CoLugar ?? null,
    TxLugar: lugar?.TxLugar ?? nombre
  }, { emitEvent: false });
}

onInstitutionChange(event: any) {
  const nombre = event.target.value;
  const institucion = this.instituctions.find(inst => inst.nbinstitucion === nombre);

  this.siglas = institucion?.siglas ?? '';

  this.actForm.patchValue({
    CodigoInst: institucion?.CodigoInst ?? null,
    nbInstitucion: institucion?.nbinstitucion ?? nombre
  }, { emitEvent: false });
}

  onSelectActContract(act: Act){  
    this.isEnabled = true;
    this.isAdding = true;
    this.selectedAct  = act;
    this.actForm.enable();

    this.codigoActo = act.CodigoActo;
    this.MnCosto = act.MnCosto
    this.siglas = act.siglas;
    
    this.actForm.patchValue({
      CodigoActo: act.CodigoActo,
      Fecha: this.formateDateToInput(act.Fecha),
      Hora: this.formateTimeString(act.Hora),
      TxLugar: act.TxLugar,
      especialidad: act.especialidad,
      siglas: act.siglas,
      nbInstitucion: act.nbInstitucion,
      titulo: act.titulo,
      MnCosto: act.MnCosto,
      CodigoInst: act.CodigoInst,
      CoLugar: act.CoLugar
    })

    console.log("selected act: ", this.selectedAct);
    this.actUsers$ = this.actContractService.getActUsersByCodigoActo(act.CodigoActo!);
    this.updateTotals(act.CodigoActo!);
  }

  updateTotals(CodigoActo: number){
    this.actContractService.getActTotal(CodigoActo).subscribe(res => this.total = res.MontoTotal);
    this.actContractService.getTotalPaid(CodigoActo).subscribe(res => this.totalPaid = res.TotalPagado);
    this.actContractService.getSaldo(CodigoActo).subscribe(res => this.saldo = res.saldo);
    this.actContractService.getActUsersAmount(CodigoActo).subscribe(res => {
        this.usersAmount = res.cantidadEstudiantes;
    });
    // También refrescamos la lista de usuarios/contratos
    this.actUsers$ = this.actContractService.getActUsersByCodigoActo(CodigoActo);
  }

  selectedUser(user: any){
    this.selectActUser = user;
    console.log(user);
  }

  onAdd(){
    this.actForm.patchValue({
      CodigoActo: this.CodigoActoGet
    })
    this.isEnabled = true;
    this.actForm.enable();
    this.isAdding = true;

        setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(
        'input[formcontrolname="CodigoActo"], textarea[formcontrolname="CodigoActo"]'
      );
      el?.focus();
    }, 0);
  }

  onSave(){
    if(this.codigoActo){
        const formData = this.actForm.value;
        const payload = {
        CodigoActo: formData.CodigoActo,
        Fecha: formData.Fecha,
        Hora: formData.Hora,
        siglas: this.siglas || formData.siglas,
        Titulo: formData.titulo,
        CoLugar: formData.CoLugar,
        Especialidad: formData.especialidad,
        CodUser: null,
        Culminada: 0,
        CodigoInst: formData.CodigoInst,
        TxLugar: formData.TxLugar
      }

      this.actContractService.updateAct(this.codigoActo, payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Acto actualizado', detail: 'El acto ha sido actualizado exitosamente.' });
          this.loadSettings();
          this.actForm.reset();
          this.actForm.disable();
          this.isEnabled = false;
          this.isAdding = false;
          this.selectedAct = null;
          this.actUsers$ = null;
          this.usersAmount = null;
          this.totalPaid = null;
          this.saldo = null;
          this.total = null;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al actualizar el acto.' });
        }
      })
    }else{
      const formData = this.actForm.value;
      const payload = {
        CodigoActo: formData.CodigoActo,
        Fecha: formData.Fecha,
        Hora: formData.Hora,
        siglas: this.siglas,
        Titulo: formData.titulo,
        CoLugar: formData.CoLugar,
        MnCosto: formData.MnCosto,
        Especialidad: formData.especialidad,
        CodUser: null,
        Culminada: 0,
        CodigoInst: formData.CodigoInst
      }

      console.log("Payload para crear acto: ", payload);

      this.actContractService.createAct(payload).subscribe({
        next: () => {
          console.log("Acto creado exitosamente", payload);
          this.messageService.add({ severity: 'success', summary: 'Acto creado', detail: 'El acto ha sido creado exitosamente.' });
          this.loadSettings();
          this.actForm.reset();
          this.actForm.disable();
          this.isEnabled = false;
          this.isAdding = false;
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al crear el acto.' });
        }
      })
    }
  }

  onDelete(){

  }

  onCancel(){
    this.isEnabled = false;
    this.isAdding = false;
    this.selectedAct = null;
    this.actForm.reset();
    this.actForm.disable();
    this.actUsers$ = null;
    this.selectActUser = null;
    this.total = null;
    this.totalPaid = null;
    this.usersAmount = null;
    this.saldo = null;
    this.codigoActo = null;
  }
  
  recalculateModal(codigoActo: number | null, MnCosto: number | null){
    const formData = this.actForm.value;
    if(codigoActo){
          this.ref = this.dialogService.open(RecalculateModalComponent, {
      header: 'Estas seguro de recalcular el monto del acto por estudiante?',
      width: '50vw',
      modal: true,
      data: { actContractId: codigoActo, MnCosto: formData.MnCosto },
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw'
      },
    })

    this.ref.onClose.subscribe((res) => {
      if(res){
        this.updateTotals(codigoActo!);
      }
    })
    }else{
      this.messageService.add({ severity: 'warn', summary: 'warn', detail: 'No se ha seleccionado ningún acto para recalcular.' });
    }
  }

  addContract(CodigoActo: number | null, MnCosto: number | null){
    const formData = this.actForm.value

    if(!CodigoActo || !MnCosto){
      this.messageService.add({ severity: 'warn', summary: 'No se ha seleccionado ningún acto para agregar un contrato.' });
    }else{
        this.ref = this.dialogService.open(AddContractComponent, {
        header: 'Incluir Contratos',
        width: '50vw',
        modal: true,
        data: { CodigoActo, MnCosto: formData.MnCosto },
        closable: true,
        breakpoints: {
          '960px': '75vw',
          '640px': '90vw'
        }    
      });

      this.ref.onClose.subscribe(() => {
        this.updateTotals(CodigoActo!); // Actualizamos los totales al cerrar el modal, ya sea que se haya agregado un contrato o no, para reflejar cualquier cambio.
      })
    }
  }

  payments(actUser: any){
    if(!this.selectActUser){
      this.messageService.add({ severity: 'warn', summary: 'No se ha seleccionado ningún contrato para ver los pagos.' });
    }else{
      this.ref = this.dialogService.open(PaymentsComponent, {
          header: 'Pagos',
          width: '62%',
          height: '100%',
          modal: true,
          closable: true,
          data: {
            actUser,
            codigoActo: this.selectedAct.CodigoActo
           },
          breakpoints: {
            '960px': '90%',
            '640px': '100%'
        }
      });

      this.ref.onClose.subscribe(() => {
          this.updateTotals(this.selectedAct.CodigoActo);
      })
    }
  }

  refresh(codigoActo: number | null){
    let header = "";

    if(!codigoActo){
      header =  "Quieres refrescar los actos?"
    }else{
       header =  "Quieres refrescar los usuarios y contratos de este acto?"
    }

   this.ref = this.dialogService.open(RefreshComponent, {
        header: header,
        width: '50vw',
        modal: true,
        data: { codigoActo },
        breakpoints: {
          '960px': '75vw',
          '640px': '90vw'
        }    
      });

      this.ref.onClose.subscribe((res) => {
      if (res === 'users' && codigoActo) {
        this.isLoading.set(true);
        this.actUsers$ = this.actContractService.getActUsersByCodigoActo(codigoActo).pipe(
          delay(500),
          finalize(() => this.isLoading.set(false))
        );
      } else if (res === 'acts') {
        this.isLoading.set(true);
        this.acts$ = this.actContractService.getActs().pipe(
          delay(500),
          finalize(() => this.isLoading.set(false))
        );
      }
    });
  }

formateDateToInput(dateString: string){
  if (!dateString) return '';

  const separator = dateString.includes('-') ? '-' : '/';
  const [a, b, c] = dateString.split(separator);

  if (a.length === 4) {
    return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
  }

  return `${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`;
}

formateTimeString(time: string) {
  if (!time) return '';
  const [hours = '00', minutes = '00'] = time.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

formateDateString(dateString: string) {
  if (!dateString || dateString === '0000-00-00') return '';

  // 1. Intentar detectar el separador (puede ser - o /)
  const separator = dateString.includes('-') ? '-' : '/';
  const parts = dateString.split(separator);

  let date: Date;

  // 2. Determinar si es ISO (YYYY-MM-DD) o Latino (DD-MM-YYYY)
  if (parts[0].length === 4) {
    // Es YYYY-MM-DD (Formato de base de datos o input date)
    const [y, m, d] = parts;
    date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  } else {
    // Es DD-MM-YYYY (Formato latino)
    const [d, m, y] = parts;
    date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  }

  // 3. Validar si la fecha es válida para evitar el NaN
  if (isNaN(date.getTime())) {
    console.error("Fecha inválida recibida:", dateString);
    return 'Fecha Inválida';
  }

  // 4. Formatear a DD-MM-YYYY para mostrar en la tabla
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}
}
