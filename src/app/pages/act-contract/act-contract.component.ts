import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { delay, Observable, startWith, switchMap, tap } from 'rxjs';
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
  CoLugar: string | null;
  CodigoInst: string | null;

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
    OnlyNumbersDirective
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
      console.log(acts);
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

      this.titulo = res.map((spec: any) => spec.Titulo);
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
      console.log("settings: ", res);
      this.CodigoActoGet = res.NoActo + 1;
      console.log("CodigoActoGet: ", this.CodigoActoGet);
    });
  }

onLugarChange(event: any) {
  const nombreSeleccionado = event.target.value;
  
  // Buscamos el objeto completo en nuestra lista
  const lugarEncontrado = this.actPlaces.find(p => p.TxLugar === nombreSeleccionado);

  if (lugarEncontrado) {
    // Seteamos el código en el control oculto CoLugar
    this.actForm.patchValue({
      CoLugar: lugarEncontrado.CoLugar
    });
    console.log("CoLugar seleccionado:", lugarEncontrado.CoLugar);
  } else {
    // Si el usuario escribe algo que no está en la lista, limpiamos el código
    this.actForm.patchValue({ CoLugar: null });
  }
}

onInstitutionChange(event: any){
  const nombreSeleccionado = event.target.value;
  console.log("Institución seleccionada: ", nombreSeleccionado);

  const institutionSelected = this.instituctions.find((inst: any) => 
    inst.nbinstitucion === nombreSeleccionado);

  if(institutionSelected){
       this.siglas = institutionSelected.siglas;

    console.log("Institución seleccionada: ", institutionSelected);

    this.actForm.patchValue({
      CodigoInst: institutionSelected.CodigoInst
    });
  
    console.log("CodigoInst seleccionado: ", institutionSelected.CodigoInst);
  } else {
    this.actForm.patchValue({ CodigoInst: null });
    this.siglas = '';
  }
}

  onSelectActContract(act: Act){  
    this.isEnabled = true;
    this.isAdding = true;
    this.selectedAct  = act;
    this.actForm.patchValue({
      CodigoActo: act.CodigoActo,
      Fecha: this.formateDateString(act.Fecha),
      Hora: this.formateTimeString(act.Hora),
      TxLugar: act.TxLugar,
      especialidad: act.especialidad,
      siglas: act.siglas,
      nbInstitucion: act.nbInstitucion,
      titulo: act.titulo,
      MnCosto: act.MnCosto
      
    })

    console.log("selected act: ", this.selectedAct);

    this.codigoActo = act.CodigoActo;
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
          this.messageService.add({ severity: 'success', summary: 'Acto creado', detail: 'El acto ha sido creado exitosamente.' });
          this.actForm.reset();
          this.actForm.disable();
          this.isEnabled = false;
          this.isAdding = false;

          this.loadSettings();
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
    // this.totalPerStudent = null;
    this.totalPaid = null;
    this.usersAmount = null;
    this.saldo = null;
  }
  
  recalculateModal(codigoActo: number | null){
    if(codigoActo){
          this.ref = this.dialogService.open(RecalculateModalComponent, {
      header: 'Estas seguro de recalcular el monto del acto por estudiante?',
      width: '50vw',
      modal: true,
      data: { actContractId: codigoActo },
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

  addContract(CodigoActo: number | null, MnTotal: number | null){
    if(!CodigoActo || !MnTotal){
      this.messageService.add({ severity: 'warn', summary: 'No se ha seleccionado ningún acto para agregar un contrato.' });
    }else{
        this.ref = this.dialogService.open(AddContractComponent, {
        header: 'Incluir Contratos',
        width: '50vw',
        modal: true,
        data: { CodigoActo, MnTotal },
        closable: true,
        breakpoints: {
          '960px': '75vw',
          '640px': '90vw'
        }    
      });

      this.ref.onClose.subscribe((res) => {
        this.updateTotals(CodigoActo!);
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
      })
    }
  }

  formateTimeString(time: string){
    const [hours, minutes] = time.split(':'); 
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
