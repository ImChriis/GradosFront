import { Component, inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '../../../../@core/models/user.mode';
import { AsyncPipe, CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ClientsService } from '../../../../@core/services/clients.service';
import { Client } from '../../../../@core/models/client.model';

@Component({
  selector: 'app-search-user',
  imports: [
    CommonModule,
    AsyncPipe,
    TableModule,
    InputTextModule
  ],
  templateUrl: './search-user.component.html',
  styleUrl: './search-user.component.scss'
})
export class SearchUserComponent implements OnInit{
  private clientService = inject(ClientsService);
  private ref = inject(DynamicDialogRef, { optional: true } );
  clients$!: Observable<Client[]>;
  selectedClient: Client | null = null;

  ngOnInit() {
    this.clients$ = this.clientService.findAllClients();
  }

    selectClient(client: Client) {
    this.selectedClient = client;
  }

  accept() {
    if (!this.selectedClient) return;
    this.ref?.close(this.selectedClient);           // ← manda el objeto COMPLETO
  }

  cancel() {
    this.ref?.close(null);
  }
}
