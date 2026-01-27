import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { SpecilitiesForm } from '../../@core/models/forms/specialities-form';
import { SpecialitiesService } from '../../@core/services/specialities.service';
import { Observable } from 'rxjs';
import { Specility } from '../../@core/models/speciality.model';
import { InputText } from 'primeng/inputtext';
import { UppercaseDirective } from "../../@core/directives/uppercase.directive";

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
  private fb = inject(FormBuilder);
  isAdding = false;
  selectedSpeciality = false; 
  isEnabled = false;
  specialities$!: Observable<Specility[]>;

  specialititesForm: FormGroup<SpecilitiesForm> = this.fb.group({
    id: new FormControl<number | null>(null),
    Titulo: new FormControl('', { nonNullable: true }),
    Descripcion: new FormControl('', { nonNullable: true }),
  })

  ngOnInit(): void {
    this.specialities$ = this.specialitiesService.getAllSpecialities();
  }

  onSelectedSpeciality(speciality: Specility){
    this.isAdding = true;
    this.selectedSpeciality = true;
    this.specialititesForm.enable();
    this.specialititesForm.patchValue({
      id: speciality.id,
      Titulo: speciality?.Titulo,
      Descripcion: speciality?.Descripcion
    });

    console.log('Selected Speciality:', speciality);
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
