import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { SpecialitiesService } from '../../../../@core/services/specialities.service';
import { Speciality } from '../../../../@core/models/speciality.model';

@Component({
  selector: 'app-search-speciality',
  imports: [
    CommonModule,
    TableModule,
    InputTextModule
  ],
  templateUrl: './search-speciality.component.html',
  styleUrl: './search-speciality.component.scss'
})
export class SearchSpecialityComponent implements OnInit {
  private specialitiesService = inject(SpecialitiesService);
  private ref = inject(DynamicDialogRef, { optional: true });

  specialities$!: Observable<Speciality[]>;
  selectedSpeciality: Speciality | null = null;

  ngOnInit() {
    this.specialities$ = this.specialitiesService.getAllSpecialities();
  }

  selectSpeciality(speciality: Speciality) {
    this.selectedSpeciality = speciality;
  }

  /** Devuelve el objeto COMPLETO, para que el padre tome Titulo y Especialidad */
  accept() {
    if (!this.selectedSpeciality) return;
    this.ref?.close(this.selectedSpeciality);
  }

  cancel() {
    this.ref?.close(null);
  }
}
