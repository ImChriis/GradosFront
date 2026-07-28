import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { LoaderComponent } from '../../@core/components/loader/loader.component';
import { RingContractService } from '../../@core/services/ring-contract.service';
import { Observable } from 'rxjs';
import { TabsModule } from 'primeng/tabs';

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
  contracts$!: Observable<any>;
  isLoading = signal(false);

  ngOnInit() {
    this.contracts$ = this.ringContractService.getRingContract();
  }
}
