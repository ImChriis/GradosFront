import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Observable } from 'rxjs';
import { ActContractService } from '../../@core/services/act-contract.service';
import { FormBuilder } from '@angular/forms';

//temporal
interface Act {
  CodigoActo: number | null;
  Fecha: string;
  Hora: string;
  TxLugar: string;
  especialidadd: string;
  siglas: string;
}

@Component({
  selector: 'app-act-contract',
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
  ],
  templateUrl: './act-contract.component.html',
  styleUrl: './act-contract.component.scss'
})
export class ActContractComponent implements OnInit{
  private actContractService =  inject(ActContractService);
  private fb = inject(FormBuilder);
  acts$: Observable<Act[]> | null = null;
  isAdding = true;
  isEnabled = false;
  selectedAct: any | null = null;
  selectActUser: any | null = null;

  actForm = this.fb.group({
    CodigoActo: [null],
    Fecha: [''],
    Hora: [''],
    TxLugar: [''],
    especialidadd: [''],
    siglas: ['']
  })

  ngOnInit() {
    this.acts$ = this.actContractService.getActs();
  }

  onSelectActContract(act: Act){  
    this.selectedAct  = act;
    // this.actForm.patchValue({
    //   CodigoActo: ,
    //   Fecha: act.Fecha,
    //   Hora: act.Hora,
    //   TxLugar: act.TxLugar,
    //   especialidadd: act.especialidadd,
    //   siglas: act.siglas
    // })
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
