import { Component, inject, OnInit } from '@angular/core';
import { InstitutionsService } from '../../@core/services/institutions.service';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { Institution } from '../../@core/models/institution.model';
import { InstitutionForm } from '../../@core/models/forms/institution-form';

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
  institutions$!: Observable<Institution[]>;
  isAdding = false;
  isEnabled = false;
  selectedInstitution!: Institution | null;

  institutionsForm: FormGroup<InstitutionForm> = this.fb.group({
    CodigoInst: new FormControl<number | null>(null, { nonNullable: true }),
    siglas: new FormControl('', { nonNullable: true }),
    nbinstitucion: new FormControl('', { nonNullable: true }),
    tpinstitucion: new FormControl('', { nonNullable: true }),
  })

  ngOnInit(){
    this.institutions$ = this.institutionsService.getAllInstitutions();
  }

  onSelectedInstitution(institution: Institution){
    this.isAdding = false;
    this.isEnabled = false;
    this.selectedInstitution = institution;
    this.institutionsForm.patchValue({
      
    })
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
