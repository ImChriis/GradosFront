import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActContractService } from '../../../../@core/services/act-contract.service';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ConfirmModalComponent } from '../../../../shared/components/modals/confirm-modal/confirm-modal.component';
import { ClientsService } from '../../../../@core/services/clients.service';
import { SettingsService } from '../../../../@core/services/settings.service';

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
  private clientsService = inject(ClientsService);
  private messageService = inject(MessageService);
  private settingsService = inject(SettingsService);
  private dialogConfig = inject(DynamicDialogConfig);
  private dialogService = inject(DialogService);
  private dialogRef = inject(DynamicDialogRef);
  private fb = inject(FormBuilder);
  codigoActo = this.dialogConfig.data.CodigoActo;
  MnCosto = this.dialogConfig.data.MnCosto;
  ref: DynamicDialogRef | undefined;
  NoContrato: string | null = null;

  actForm = this.fb.group({
    CodigoActo: this.fb.control<number | null>(null, Validators.required),
    NoContrato: this.fb.control<string | null>(null, Validators.required),
    NuCedula: this.fb.control<string | null>(null),
    Nombre: this.fb.control<string | null>(null),
    Txcontacto: this.fb.control<string | null>(null),
    MnPagado: this.fb.control<number | null>(null),
    MnSaldo: this.fb.control<number | null>(null),
    MnInicial: this.fb.control<number | null>(null),
    MnContrato: this.fb.control<number | null>(null),
    MaEdoCont: this.fb.control<string | null>(null),
    CodUser: this.fb.control<string | null>(null),
    Chemise: this.fb.control<string | null>(null),
    MnDescuento: this.fb.control<number | null>(null),
    CodSucursal: this.fb.control<string | null>(null),
  })

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe({
      next: (res: any) => {
        this.NoContrato = res.NoContrato;
        this.actForm.patchValue({ NoContrato: this.NoContrato });
      }
    })
  }

  searchUserByCedula(event: any){
    const NuCedula = event?.target.value;

    // console.log(NuCedula);

    this.clientsService.getClientByCedula(NuCedula).subscribe({
      next: (res: any) => {
       if(res){
        // console.log(res);
         this.actForm.patchValue({
          Nombre: res.txnombre,
          Txcontacto: res.txcelular
         });
        this.messageService.add({ severity: 'success', summary: 'Usuario encontrado' });

         setTimeout(() => {
        const el = document.querySelector<HTMLInputElement>(
          'input[formcontrolname="NoContrato"]'
        );
      el?.focus();
    }, 0);
       }else{
        this.messageService.add({ severity: 'warn', summary: 'Usuario no encontrado, por favor registrelo' });
            this.ref = this.dialogService.open(ConfirmModalComponent, {
            header: 'Quieres agregar un nuevo cliente?',
            width: '50%',
            modal: true,
            closable: true,
            breakpoints: {
              '960px': '90%',
              '640px': '100%'
            }
          })
        }
      }
    })
  }

  onSubmit(){
    this.actForm.patchValue({ CodigoActo: this.codigoActo });
    this.actForm.patchValue({ MnContrato: this.MnCosto });
    this.actForm.patchValue({ MnSaldo: this.MnCosto });
    this.actForm.patchValue({ MnInicial: 0 });
    this.actForm.patchValue({ MnPagado: 0 });


    if(this.actForm.valid){
       this.actContractService.addUserToAct(this.actForm.value).subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Usuario agregado al acto correctamente' });
        // console.log(res);
        // console.log(this.actForm.value)
        this.dialogRef.close();
      },
      error: (err) => {
         if(err.status == 400){
          this.messageService.add({ severity: 'warn', summary: err.error.message });
         }else if(err.status == 404){
          this.messageService.add({ severity: 'warn', summary: err.error.message});
          // console.log(err);
         }
         else{
          this.messageService.add({ severity: 'error', summary: 'Error al agregar usuario al acto' });
          // console.error(err);
         }
      }
    })
    }else{
      this.messageService.add({ severity: 'error', summary: 'Por favor complete los campos' });
    }
  }
}
