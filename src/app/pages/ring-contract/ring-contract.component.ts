import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { LoaderComponent } from '../../@core/components/loader/loader.component';
import { RingContractService } from '../../@core/services/ring-contract.service';
import { Observable } from 'rxjs';
import { TabsModule } from 'primeng/tabs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SearchUserComponent } from './components/search-user/search-user.component';

@Component({
  selector: 'app-ring-contract',
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    ReactiveFormsModule,
    LoaderComponent,
    TabsModule
  ],
  templateUrl: './ring-contract.component.html',
  styleUrl: './ring-contract.component.scss'
})
export class RingContractComponent implements OnInit {
  private ringContractService = inject(RingContractService);
  private dialogService = inject(DialogService);
  private ref = inject(DynamicDialogRef, { optional: true } );
  contracts$!: Observable<any>;
  isLoading = signal(false);
  activeTab = signal<string | number>(0);
  user: any[] = [];
  userName!: string;

  /** Estado de los botones de acción, mismo patrón que act-contract:
   *  Agregar  -> inhabilitado mientras se está agregando/editando
   *  Guardar  -> inhabilitado hasta que haya algo que guardar
   *  Eliminar -> inhabilitado hasta seleccionar una fila */
  isAdding = false;
  isEnabled = false;
  selectedContract: any | null = null;

  ngOnInit() {
    this.contracts$ = this.ringContractService.getRingContract();
    this.isAdding = false;
  }

  onSelectContract(contract: any) {
    this.selectedContract = contract;
    this.isEnabled = true;
    this.isAdding = true;
  }

  onAdd() {
    this.selectedContract = null;
    this.isEnabled = true;
    this.isAdding = true;
  }

  onSave() {
    // TODO: acá va el llamado a RingContractService cuando exista el endpoint de guardar
    this.resetActions();
  }

  onDelete() {
    // TODO: acá va el llamado a RingContractService cuando exista el endpoint de eliminar
    this.resetActions();
  }

  onCancel() {
    this.resetActions();
  }

  private resetActions() {
    this.isEnabled = false;
    this.isAdding = false;
    this.selectedContract = null;
  }

  openSearchUserModal(){
    this.ref = this.dialogService.open(SearchUserComponent, {
      header: 'Seleccionar usuario',
      width: '50vw',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw'
      },
    } 
  )
    this.ref?.onClose.subscribe((result: any) => {
      this.user = result;
      this.userName = result.txnombre;
      console.log('Selected user:', this.user); // Log the selected user to the console
    })
  }
}
