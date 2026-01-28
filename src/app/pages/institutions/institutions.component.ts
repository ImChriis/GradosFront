import { Component, inject, OnInit } from '@angular/core';
import { InstitutionsService } from '../../@core/services/institutions.service';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-institutions',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule
  ],
  templateUrl: './institutions.component.html',
  styleUrl: './institutions.component.scss'
})
export class InstitutionsComponent implements OnInit{
  private institutionsService = inject(InstitutionsService);
  private fb = inject(FormBuilder);
  institutions$!: Observable<any[]>;
  isAdding = false;
  isEnabled = false;
  selectedInstitution = false;

  ngOnInit(){

  }

  onAdd(){

  }

  onSave(){

  }

  onDelete(){

  }

  onCancel(){

  }
}
