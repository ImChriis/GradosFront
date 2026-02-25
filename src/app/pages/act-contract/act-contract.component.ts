import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { Observable } from 'rxjs';
import { ActContractService } from '../../@core/services/act-contract.service';

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
  actContracts$: Observable<any[]> | null = null;
  isAdding = true;
  isEnabled = false;
  selectedActContract: any | null = null;

  ngOnInit() {
    this.actContractService.getActs().subscribe((data: any) => {
      console.log(data);
    });
  }

  onSelectActContract(any: any){

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
