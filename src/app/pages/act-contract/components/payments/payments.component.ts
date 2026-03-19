import { Component, inject, OnInit } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ActContractService } from '../../../../@core/services/act-contract.service';
import { AsyncPipe, CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { map, Observable } from 'rxjs';


@Component({
  selector: 'app-payments',
  imports: [
    CommonModule,
    TableModule,
    AsyncPipe
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
  recibos$!: Observable<any>;
  abonos$!: Observable<any>;

  ngOnInit(): void {
    this.NuCedula = this.actUser.NuCedula;
    this.NoContrato = this.actUser.NoContrato;

    console.log(this.codigoActo, this.NoContrato, this.NuCedula);
    
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

    this.recibos$ = this.actContractService.getRecibosByUserContract(this.NoContrato).pipe(
      map(response => response.data)
    );

    this.abonos$ = this.actContractService.getAbonosByUserContract(
      String(this.NuCedula),
      String(this.NoContrato)
    ).pipe(
      map(response => {response.data
        console.log('Abonos data for user:', response);
      })
    );
  }
}
 