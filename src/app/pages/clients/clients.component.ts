import { Component, inject, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ClientsService } from '../../@core/services/clients.service';
import { Observable } from 'rxjs';
import { Client } from '../../@core/models/client.model';
import { AsyncPipe, CommonModule } from '@angular/common';
import { InputText } from 'primeng/inputtext';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ClientForm } from '../../@core/models/forms/client-form';
import { MessageService } from 'primeng/api';
import { UppercaseDirective } from '../../@core/directives/uppercase.directive';

@Component({
  selector: 'app-clients',
  imports: [
    CommonModule,
    AsyncPipe,
    TableModule,
    InputText,
    ReactiveFormsModule,
    UppercaseDirective
  ],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent implements OnInit{
  private clientsService = inject(ClientsService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  isModalOpen = false;
  clients$!: Observable<Client[]>;
  selectedClient: Client | null = null;
  isEnabled: boolean = false;
  isAdding: boolean = false;
  id!: number;


  clientsForm: FormGroup<ClientForm> = this.fb.group({
    id: this.fb.control<number | null>(null),
    nucedula: this.fb.control<string | null>(null),
    txnombre: this.fb.control<string | null>(null),
    txdireccion: this.fb.control<string | null>(null),
    txtelefono: this.fb.control<string | null>(null),
    txcelular: this.fb.control<string | null>(null),
    txemail: this.fb.control<string | null>(null),
    feingreso: this.fb.control<string | null>(null),
    codUser: this.fb.control<string | null>(null),
  })

  
  ngOnInit(): void {
    this.clients$ = this.clientsService.findAllClients();
    this.clientsForm.disable();
    this.selectedClient = null;
  }

  onSelectClient(client: Client){
    this.isAdding = true;
    this.isEnabled = true;
    this.selectedClient = client;
    this.clientsForm.enable();
    this.clientsForm.patchValue({
      id: client.id,
      nucedula: client.nucedula,
      txnombre: client.txnombre,
      txdireccion: client.txdireccion,
      txtelefono: client.txtelefono,
      txcelular: client.txcelular,
      txemail: client.txemail,
      feingreso: client.feingreso,
      codUser: client.codUser,
    });

    this.id = client.id;

    console.log(this.id + ' selected');
  }

  onAdd(){
    this.isEnabled = true;
    this.isAdding = true;
    this.clientsForm.enable();
    // Wait for the form control to be rendered/enabled, then focus the corresponding input element
    // (AbstractControl does not have a focus() method)
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(
        'input[formcontrolname="nucedula"], textarea[formcontrolname="nucedula"]'
      );
      el?.focus();
    }, 0);
  }

  onSave(){
    if(this.selectedClient){
      console.log(this.id + ' updating');
      this.clientsService.updateClient(this.id, this.clientsForm.value as Client).subscribe({
        next: (client) => {
          this.messageService.add({severity:'success', summary: 'Success', detail: 'Client updated successfully'});
          setTimeout(() => {
            window.location.reload();
          }, 500);
        },
        error: (err) => {
          this.messageService.add({severity:'error', summary: 'Error', detail: 'Error updating client'});
        }
      });

    }else{
         this.clientsService.addClient(this.clientsForm.value as Client).subscribe({
      next: (client) => {
        this.messageService.add({severity:'success', summary: 'Success', detail: 'Client added successfully'});
        setTimeout(() => {
          window.location.reload();
        }, 500);
      },
      error: (err) => {
        this.messageService.add({severity:'error', summary: 'Error', detail: 'Error adding client'});
      }
    })
    }
  }

  onCancel(){
    this.isEnabled = false;
    this.isAdding = false;
    this.selectedClient = null;
    this.clientsForm.reset();
    this.clientsForm.disable();
  }

  onDelete(){
    
  }
}
