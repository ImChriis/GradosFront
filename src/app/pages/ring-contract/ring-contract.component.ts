import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { LoaderComponent } from '../../@core/components/loader/loader.component';

@Component({
  selector: 'app-ring-contract',
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    ReactiveFormsModule,
    LoaderComponent
  ],
  templateUrl: './ring-contract.component.html',
  styleUrl: './ring-contract.component.scss'
})
export class RingContractComponent {
  isLoading = signal(false);
}
