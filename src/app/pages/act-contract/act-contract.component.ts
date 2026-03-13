import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Observable } from 'rxjs';
import { ActContractService } from '../../@core/services/act-contract.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RecalculateModalComponent } from './components/recalculate-modal/recalculate-modal.component';
import { MessageService } from 'primeng/api';
import { AddContractComponent } from './components/add-contract/add-contract.component';
import { RegisterUserComponent } from '../../@core/components/register-user/register-user.component';
import { PaymentsComponent } from './components/payments/payments.component';
import { ActsService } from '../../@core/services/acts.service';
import { InstitutionsService } from '../../@core/services/institutions.service';
import { SpecialitiesService } from '../../@core/services/specialities.service';

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
  ],
  templateUrl: './act-contract.component.html',
  styleUrl: './act-contract.component.scss'
})
export class ActContractComponent implements OnInit{
  private actContractService =  inject(ActContractService);
  private fb = inject(FormBuilder);
  private dialogService = inject(DialogService);
  private messageService = inject(MessageService);
  private actsService = inject(ActsService);
  private institutionsService = inject(InstitutionsService);
  private specialitiesService = inject(SpecialitiesService);
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
  totalPerStudent: number | null = null;
  ref: DynamicDialogRef | undefined;
  time!: string;
  actPlaces: string[] = [];
  instituctions: string[] = [];
  specialities: string[] = [];
  titulo: string[] = [];

  actForm = this.fb.group({
    CodigoActo: this.fb.control<number | null>(null),
    Fecha: [''],
    Hora: [''],
    TxLugar: [''],
    especialidad: [''],
    siglas: [''],
    nbInstitucion: [''],
    titulo: [''],

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

    this.acts$ = this.actContractService.getActs();
    this.actsService.getAllActsPlaces().subscribe(res => {
      this.actPlaces = res.map((act: any) => act.TxLugar);
      console.log("lugares: ", this.actPlaces);
    })

    this.institutionsService.getAllInstitutions().subscribe(res => {
      this.instituctions = res.map((inst: any) => inst.nbinstitucion);
      console.log("instituciones: ", this.instituctions);
    });

    this.specialitiesService.getAllSpecialities().subscribe(res => {
      this.specialities = res.map((spec: any) => spec.Especialidad);
      console.log("especialidades: ", this.specialities);

      this.titulo = res.map((spec: any) => spec.Titulo);
    });
  
    this.total = null;
    this.totalPaid = null;
    this.saldo = null;
    this.usersAmount = null;

    // this.payments();

    this.actForm.disable();
    this.isAdding = false;
  }

  onSelectActContract(act: Act){  
    this.selectedAct  = act;
    this.actForm.patchValue({
      CodigoActo: act.CodigoActo,
      Fecha: act.Fecha,
      Hora: act.Hora,
      TxLugar: act.TxLugar,
      especialidad: act.especialidad,
      siglas: act.siglas,
      nbInstitucion: act.nbInstitucion,
      titulo: act.titulo

      //users data
    })

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
        this.totalPerStudent = this.total! / this.usersAmount!;
    });
    // También refrescamos la lista de usuarios/contratos
    this.actUsers$ = this.actContractService.getActUsersByCodigoActo(CodigoActo);
  }

  selectedUser(user: any){
    console.log("selected user: ", user);

    this.actForm.patchValue({
      Nombre: user.Nombre,
      NoContrato: user.NoContrato,
      MnPagado: user.MnPagado,
      MnSaldo: user.MnSaldo
    })
  }

  onAdd(){
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
      })
    }
  }

  payments(){
      this.ref = this.dialogService.open(PaymentsComponent, {
                header: 'Pagos',
                width: '70%',
                modal: true,
                closable: true,
                breakpoints: {
                  '960px': '90%',
                  '640px': '100%'
                }
              })
  }

  formateTimeString(time: string){
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formateDateString(dateString: string){
    const date = new Date(dateString);
    return date.toLocaleDateString();
    
  }
}
