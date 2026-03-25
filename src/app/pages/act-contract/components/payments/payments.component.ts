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
    TableModule
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
  client!: string;
  montoContrato!: number;
  descuento!: number;
  MnInicial!: number;
  montoPagado!: number;
  montoSaldo!: number;
  NoRecibo: number = 0;
  fechaSelectedRecibo: string = '';
  montoSelectedRecibo: number | null = null;
  observacion: string = '';

  ngOnInit(): void {
    this.NuCedula = this.actUser.NuCedula;
    this.NoContrato = this.actUser.NoContrato;
    this.client = this.actUser.Nombre;
    this.montoContrato = this.actUser.MnContrato;
    this.descuento = this.actUser.MnDescuento;
    this.MnInicial = this.actUser.MnInicial;
    this.montoPagado = this.actUser.MnPagado;
    this.montoSaldo = this.actUser.MnSaldo;

    console.log(this.codigoActo, this.NoContrato, this.NuCedula);

    console.log("data", this.actUser);
    
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
  }

  selectRecibo(recibo: any){
    console.log('Selected recibo:', recibo);
    this.NoRecibo = recibo.NoRecibo;
    this.fechaSelectedRecibo = recibo.ferecibo;
    this.montoSelectedRecibo = recibo.mnrecibo;
    this.observacion = recibo.TxConcepRec;
    this.abonos$ = this.actContractService.getAbonosByUserContract(
      String(this.NoContrato),
      String(this.NuCedula),
      this.NoRecibo
    ).pipe(
      map(response => {
        console.log('Abonos for recibo:', response.data)
        return response.data
      })
    );
    
    console.log(this.abonos$)
  }
}
 