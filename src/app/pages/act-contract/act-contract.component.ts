import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Observable } from 'rxjs';
import { ActContractService } from '../../@core/services/act-contract.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

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
  acts$: Observable<Act[]> | null = null;
  actUsers$: Observable<any> | null = null;
  isAdding = true;
  isEnabled = false;
  selectedAct: any | null = null;
  selectActUser: any | null = null;
  codigoActo: number | null = null;

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
}
