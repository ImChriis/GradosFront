import { Component, inject, OnInit } from '@angular/core';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { ActContractService } from '../../../../@core/services/act-contract.service';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { map, Observable } from 'rxjs';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { BanksService } from '../../../../@core/services/banks.service';
import { SettingsService } from '../../../../@core/services/settings.service';
import { UppercaseDirective } from '../../../../@core/directives/uppercase.directive';
import { OnlyNumbersDirective } from '../../../../@core/directives/only-numbers.directive';

@Component({
  selector: 'app-payments',
  imports: [
    CommonModule,
    TableModule,
    ReactiveFormsModule,
    UppercaseDirective,
    OnlyNumbersDirective
  ],
  templateUrl: './payments.component.html',
  styleUrl: './payments.component.scss'
})
export class PaymentsComponent implements OnInit{
  private actContractService = inject(ActContractService);
  private dialogConfig = inject(DynamicDialogConfig);
  private banksService = inject(BanksService);
  private settingsService = inject(SettingsService);
  private fb = inject(FormBuilder);
  actUser = this.dialogConfig.data.actUser;
  codigoActo = this.dialogConfig.data.codigoActo;
  totalPerStudent = this.dialogConfig.data.totalPerStudent;
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
  metodosPago: String[] = [];
  banks: String[] = [];
  isAdding: boolean = false;

  reciboPagoForm = this.fb.group({
    NoRecibo: [null as number | null],
    ferecibo: [''],
    NuCedula: [null as number | null],
    CodSucursal: [null as number | null],
    NoContrato: [null as number | null],
    tprecibo: [''],
    mnrecibo: [null as number | null],
    mnsaldorec: [null as number | null],
    TxConcepRec: [''],
    CodUser: [null as number | null],
    Anulado: [null as number | null],
    Tipo: [''],
    CodigoActo: [null as number | null],
    MaFormPag: [''],
    TxBanco: [''],
    NuRefDocBan: [null as number | null]
  })

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

    this.banksService.getMetodoPago().subscribe({
      next: (response) => {
        this.metodosPago = response.map((item: any) => item.nombreMetodoPago);
        console.log('Métodos de pago:', this.metodosPago);
      }
    })

    this.banksService.getAllBanks().subscribe({
      next: (response) => {
        this.banks = response.map((item: any) => item.Bancos);
        console.log('Bancos:', this.banks);
      }
    })
  }

  onSubmit(){
    const formData = this.reciboPagoForm.value;
    formData.CodigoActo = this.codigoActo;
    formData.NoContrato = this.NoContrato;
    formData.NuCedula = this.NuCedula;
    formData.ferecibo = new Date().toISOString(); // Asignar la fecha actual en formato ISO
    formData.mnsaldorec = this.montoSelectedRecibo;

    this.actContractService.addARecibo(formData).subscribe({
      next: (response) => {
        console.log('Recibo agregado:', response);
      },
      error: (error) => {
        console.error('Error al agregar recibo:', error);
      }
    });
    
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

  add(){
        setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(
        'input[formcontrolname="mnrecibo"]'
      );
      el?.focus();
    }, 0);

    this.settingsService.getSettings().subscribe({
      next: (res: any) => {
        console.log(res) // Incrementar el número de recibo basado en la configuración actual
        const NoRecibo = res.NoRecibo + 1; // Suponiendo que la configuración devuelve un array y el número de recibo está en la primera posición
        this.NoRecibo = NoRecibo;
      }
    })
    this.fechaSelectedRecibo = new Date().toISOString();
    this.isAdding = true;
  }
  
  cancel(){
    this.NoRecibo = 0;
    this.fechaSelectedRecibo = '';
    this.montoSelectedRecibo = null;
    this.observacion = '';
    this.abonos$ = new Observable();
  }
}
 