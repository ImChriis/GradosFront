import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { Observable } from 'rxjs';
import { InstitutionsService } from '../../../../@core/services/institutions.service';
import { Institution } from '../../../../@core/models/institution.model';

@Component({
  selector: 'app-search-institution',
  imports: [
    CommonModule,
    TableModule,
    InputTextModule
  ],
  templateUrl: './search-institution.component.html',
  styleUrl: './search-institution.component.scss'
})
export class SearchInstitutionComponent implements OnInit {
  private institutionsService = inject(InstitutionsService);
  private ref = inject(DynamicDialogRef, { optional: true });

  institutions$!: Observable<Institution[]>;
  selectedInstitution: Institution | null = null;

  ngOnInit() {
    this.institutions$ = this.institutionsService.getAllInstitutions();
  }

  selectInstitution(institution: Institution) {
    this.selectedInstitution = institution;
  }

  /** Devuelve el objeto COMPLETO, para que el padre tome las siglas */
  accept() {
    if (!this.selectedInstitution) return;
    this.ref?.close(this.selectedInstitution);
  }

  cancel() {
    this.ref?.close(null);
  }
}
