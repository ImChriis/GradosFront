import { Component, inject, OnInit } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ActContractService } from '../../../../@core/services/act-contract.service';


@Component({
  selector: 'app-payments',
  imports: [
    
  ],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements OnInit{
  private actContractService = inject(ActContractService);
  private dialogConfig = inject(DynamicDialogConfig);
  actUser = this.dialogConfig.data.actUser;
  codigoActo = this.dialogConfig.data.codigoActo;
  NuCedula!: number;
  NoContrato!: number;

  ngOnInit(): void {
    this.NuCedula = this.actUser.NuCedula;
    this.NoContrato = this.actUser.NoContrato;
    
    this.actContractService.getPaymentDataByUser(
      this.codigoActo,
      String(this.NoContrato),
      String(this.NuCedula)
    ).subscribe({
      next: (response) => {
        console.log('Payment data for user:', response);
      },
      error: (error) => {
        console.error('Error fetching payment data for user:', error);
      }
    });
  }
}
 