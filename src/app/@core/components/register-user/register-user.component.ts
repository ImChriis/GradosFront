import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ClientsService } from '../../services/clients.service';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ClientForm } from '../../models/forms/client-form';
import { MessageService } from 'primeng/api';
import { Client } from '../../models/client.model';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-register-user',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './register-user.component.html',
  styleUrl: './register-user.component.scss'
})
export class RegisterUserComponent {
  private clientService = inject(ClientsService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  private dialogRef = inject(DynamicDialogRef);
  ref: DynamicDialogRef | undefined

  userForm: FormGroup<ClientForm> = this.fb.group({
    id: new FormControl<number | null>(null, { nonNullable: true }),
    nucedula: new FormControl<string | null>('', { nonNullable: true }),
    txnombre: new FormControl<string | null>('', { nonNullable: true }),
    txdireccion: new FormControl<string | null>('', { nonNullable: true }),
    txtelefono: new FormControl<string | null>('', { nonNullable: true }),
    txcelular: new FormControl<string | null>('', { nonNullable: true }),
    txemail: new FormControl<string | null>('', { nonNullable: true }),
    codUser: new FormControl<string | null>('', { nonNullable: true }),
  })

  onSubmit(){
    this.clientService.addClient(this.userForm.value as Client).subscribe({
      next: (res => {
        this.messageService.add({ severity: 'success', summary: 'Usuario registrado correctamente' });
        
        this.dialogRef.close()
      }),
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error al registrar el usuario' });
        console.log(err);
      }
    })
  }

  onCancel(){
    this.dialogRef.close()
  }
}
