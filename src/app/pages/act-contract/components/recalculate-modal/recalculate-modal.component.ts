import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActContractService } from '../../../../@core/services/act-contract.service';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-recalculate-modal',
  imports: [
    CommonModule
  ],
  templateUrl: './recalculate-modal.component.html',
  styleUrl: './recalculate-modal.component.scss'
})
export class RecalculateModalComponent implements OnInit{
  private actContractService = inject(ActContractService);
  private dialogConfig = inject(DynamicDialogConfig);
  private messageService = inject(MessageService);
  private dynamicDialogRef = inject(DynamicDialogRef);
  actContractId = this.dialogConfig.data.actContractId;
  MnCosto = this.dialogConfig.data.MnCosto;

  ngOnInit(): void {
    console.log('Act Contract ID received in modal:', this.actContractId);
    console.log('MnCosto received in modal:', this.MnCosto);
  }

  recalculate(){
    this.actContractService.recalculateTotal(this.actContractId).subscribe({
      next: (response) => {
        this.messageService.add({ severity: 'success', summary: 'Recalculated', detail: 'The act contract has been recalculated successfully.' });
        this.dynamicDialogRef.close(response);
      },
      error: (error) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to recalculate the act contract.' });
        console.error('Error recalculating act contract:', error);
      }
    });
  }

  close(){
    this.dynamicDialogRef.close();
    console.log('Modal closed without recalculating');
  }
}
