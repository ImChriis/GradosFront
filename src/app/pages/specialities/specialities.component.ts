import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SpecialitiesForm } from '../../@core/models/forms/specialities-form';
import { SpecialitiesService } from '../../@core/services/specialities.service';
import { Observable, startWith, switchMap } from 'rxjs';
import { Speciality } from '../../@core/models/speciality.model';
import { InputText } from 'primeng/inputtext';
import { UppercaseDirective } from "../../@core/directives/uppercase.directive";
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-specialities',
  imports: [
    CommonModule,
    TableModule,
    InputText,
    ReactiveFormsModule,
    UppercaseDirective
],
  templateUrl: './specialities.component.html',
  styleUrl: './specialities.component.scss'
})
export class SpecialitiesComponent implements OnInit{
  private specialitiesService = inject(SpecialitiesService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  selectedSpeciality: Speciality | null = null;
  isAdding = false;
  isEnabled = false;
  specialities$!: Observable<Speciality[]>;
  CodigoEsp!: number | null;

  specialititesForm: FormGroup<SpecialitiesForm> = this.fb.group({
    CodigoEsp: new FormControl<number | null>(null),
    Titulo: new FormControl('', { nonNullable: true }),
    Especialidad: new FormControl('', { nonNullable: true }),
  })

  ngOnInit(): void {
    this.specialities$ = this.specialitiesService.refreshObservable$.pipe(
      startWith(null),
      switchMap(() => {
        return this.specialitiesService.getAllSpecialities();
      })
    )
  }

  onSelectedSpeciality(speciality: Speciality){
    this.isAdding = true;
    this.isEnabled = true;
    this.selectedSpeciality = speciality;
    this.specialititesForm.enable();
    this.specialititesForm.patchValue({
      CodigoEsp: speciality.CodigoEsp,
      Titulo: speciality?.Titulo,
      Especialidad: speciality?.Especialidad
    });

    this.CodigoEsp = speciality.CodigoEsp;
  }

  onAdd(){
    this.isAdding = true;
    this.isEnabled = true;
    this.specialititesForm.enable();

    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(
        'input[formcontrolname="Titulo"], input[formcontrolname="Especialidad"]'
      );
      el?.focus();
    }, 0)
  }

  onSave(){
    if(this.selectedSpeciality){
      console.log('Updating Speciality:', this.specialititesForm.value);
      this.specialitiesService.updateSpeciality(this.CodigoEsp!, this.specialititesForm.value as Speciality).subscribe({
        next: (res) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Speciality updated successfully'
          });
          this.specialititesForm.reset();
          this.isAdding = false;
          this.selectedSpeciality = null;
          this.isEnabled = false;
          this.specialititesForm.disable();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update speciality'
          })
        }
      })
    }else{
      this.specialitiesService.addSpeciality(this.specialititesForm.value as Speciality).subscribe({
        next: (res) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Speciality added successfully'
          });
          this.specialititesForm.reset();
          this.isAdding = false;
          this.selectedSpeciality = null;
          this.isEnabled = false;
          this.specialititesForm.disable();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to add speciality'
          })
        }
      })
    }
  }

  onDelete(){

  }

  onCancel(){
    this.isEnabled = false;
    this.isAdding = false;
    this.selectedSpeciality = null;
    this.specialititesForm.reset();
    this.specialititesForm.disable();
  }
}
