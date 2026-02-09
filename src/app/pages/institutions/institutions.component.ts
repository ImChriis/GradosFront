import { Component, inject, OnInit } from '@angular/core';
import { InstitutionsService } from '../../@core/services/institutions.service';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { Institution } from '../../@core/models/institution.model';
import { InstitutionForm } from '../../@core/models/forms/institution-form';
import { MessageService } from 'primeng/api';

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
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  institutions$!: Observable<Institution[]>;
  isAdding = false;
  isEnabled = false;
  selectedInstitution!: Institution | null;
  CodigoInst!: number;

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
      CodigoInst: institution.CodigoInst,
      siglas: institution.siglas,
      nbinstitucion: institution.nbinstitucion,
      tpinstitucion: institution.tpinstitucion,
    })

    this.CodigoInst = institution.CodigoInst;
  }

  onAdd(){
    this.isEnabled = true;
    this.isAdding = true;
    this.institutionsForm.enable();

       setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(
        'input[formcontrolname="nbinstitucion"], textarea[formcontrolname="siglas"]'
      );
      el?.focus();
    }, 0);
  }

  onSave(){
    if(this.CodigoInst){
      this.institutionsService.updateInstitution(this.CodigoInst, this.institutionsForm.value as Institution).subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Institución Actualizada', detail: `La institución ha sido actualizada exitosamente.` });

          setTimeout(() => {
            window.location.reload();
          }, 500);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error al Actualizar', detail: `Ocurrió un error al actualizar la institución` });
        }
      });
    }else{
      this.institutionsService.addInstitution(this.institutionsForm.value as Institution).subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Institución Agregada', detail: `La institución ha sido agregada exitosamente.` });
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error al Agregar', detail: `Ocurrió un error al agregar la institución` });
        }
      })
    }
  }

  onDelete(){

  }

  onCancel(){
    this.isEnabled = false;
    this.isAdding = false;
    this.selectedInstitution = null;
    this.institutionsForm.reset();
    this.institutionsForm.disable();
  }
}
