import { Component, inject } from '@angular/core';
import { RegisterUserComponent } from '../register-user/register-user.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-confirm-modal',
  imports: [],
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss'
})
export class ConfirmModalComponent {
  private dialogService = inject(DialogService);
  private dialogRef = inject(DynamicDialogRef);
  ref: DynamicDialogRef | undefined;

  open(){
    this.dialogRef.close();

    this.ref = this.dialogService.open(RegisterUserComponent, {
            header: 'Registrar Usuario',
            width: '50%',
            modal: true,
            closable: true,
            breakpoints: {
              '960px': '90%',
              '640px': '100%'
            }
          })
  }

  close(){
    this.dialogRef.close();
  }
}
