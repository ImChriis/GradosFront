import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ReportsService } from '../../../../@core/services/reports.service';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-report-act-list',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './report-act-list.component.html',
  styleUrl: './report-act-list.component.scss'
})
export class ReportActListComponent implements OnInit, OnDestroy{
  private reportsService = inject(ReportsService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  private fb = inject(FormBuilder);
  ref!: DynamicDialogRef;
  nombre!: string;

  reportActListForm = this

  ngOnInit() {
    const user = localStorage.getItem('User');

    if(user){
      this.nombre = JSON.parse(user).user.nombre;
      console.log(this.nombre);
    }
  }

  onSubmit(tipo: string, enPantalla: boolean){
    
  }

  ngOnDestroy(): void {
    
  }
}
