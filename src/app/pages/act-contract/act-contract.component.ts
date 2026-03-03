import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Observable } from 'rxjs';
import { ActContractService } from '../../@core/services/act-contract.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { RecalculateModalComponent } from './components/recalculate-modal/recalculate-modal.component';

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
    ReactiveFormsModule
  ],
  templateUrl: './act-contract.component.html',
  styleUrl: './act-contract.component.scss'
})
export class ActContractComponent implements OnInit{
  private actContractService =  inject(ActContractService);
  private fb = inject(FormBuilder);
  private dialogSerivice = inject(DialogService);
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
  
    this.total = null;
    this.totalPaid = null;
    this.saldo = null;
    this.usersAmount = null;
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

    this.actContractService.getActTotal(this.codigoActo!).subscribe(total => {
      console.log("total: ", total);
      this.total = total.MontoTotal;
    });

    this.actContractService.getTotalPaid(this.codigoActo!).subscribe(totalPaid => {
      console.log("total paid: ", totalPaid);
      this.totalPaid = totalPaid.TotalPagado;
    });

    this.actContractService.getSaldo(this.codigoActo!).subscribe(saldo => {
      console.log("saldo: ", saldo);
      this.saldo = saldo.saldo;
    });

    this.actContractService.getActUsersAmount(this.codigoActo!).subscribe(usersAmount => {
      console.log("users amount: ", usersAmount);
      this.usersAmount = usersAmount.cantidadEstudiantes;
      this.totalPerStudent = this.total! / this.usersAmount!;
    });
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

  }

  onSave(){

  }

  onDelete(){

  }

  onCancel(){

  }

  recalculateModal(){
    this.ref = this.dialogSerivice.open(RecalculateModalComponent, {
      header: 'Estas seguro de recalcular el monto del acto por estudiante?',
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw'
      },
    })
  }
}
