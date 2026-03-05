import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActContractService } from '../../../../@core/services/act-contract.service';
import { MessageService } from 'primeng/api';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-add-contract',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './add-contract.component.html',
  styleUrl: './add-contract.component.scss'
})
export class AddContractComponent implements OnInit{
  private actContractService = inject(ActContractService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private dialogConfig = inject(DynamicDialogConfig);
  codigoActo = this.dialogConfig.data.CodigoActo;
  MnTotal = this.dialogConfig.data.MnTotal;

  actForm = this.fb.group({
    CodigoActo: [null],
    NoContrato: [null],
    NuCedula: [null],
    Nombre: [null],
    Txcontacto: [null],
    MnTotal: [null],
    MnPagado: [null],
    MnSaldo: [null],
    MnInicial: [null],
    MaEdoCont: [null],
    CodUser: [null],
    Chemise: [null],
    MnDescuento: [null],
    CodSucursal: [null],
  })

  ngOnInit(): void {
    console.log(this.codigoActo);
    console.log(this.MnTotal);
  }

  onSubmit(){
    this.actForm.patchValue({ CodigoActo: this.codigoActo });
    this.actForm.patchValue({ MnTotal: this.MnTotal });

    this.actContractService.addUserToAct(this.actForm.value).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Usuario agregado al acto correctamente' });
        console.log(res);
        console.log(this.actForm.value)
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error al agregar usuario al acto' });
        console.error(err);
         console.log(this.actForm.value)
      }
    })
  }
}
