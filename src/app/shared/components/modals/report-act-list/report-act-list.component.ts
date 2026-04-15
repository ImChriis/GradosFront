import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ReportsService } from '../../../../@core/services/reports.service';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PdfViewerComponent } from '../../../../@core/components/pdf-viewer/pdf-viewer.component';
import { OnlyNumbersDirective } from '../../../../@core/directives/only-numbers.directive';

@Component({
  selector: 'app-report-act-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OnlyNumbersDirective
  ],
  templateUrl: './report-act-list.component.html',
  styleUrl: './report-act-list.component.scss'
})
export class ReportActListComponent implements OnInit, OnDestroy{
  private reportsService = inject(ReportsService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  private fb = inject(FormBuilder);
  private currentBlobUrl: string | null = null;
  ref!: DynamicDialogRef;
  nombre!: string;

  reportActListForm = this.fb.group({
    CodigoActo: [null as number | null],
    usuarioReporte: ['']
  })

  ngOnInit() {
    const user = localStorage.getItem('User');

    if(user){
      this.nombre = JSON.parse(user).user.nombre;
      console.log(this.nombre);
    }
  }

  onSubmit(type: string, esPantalla: boolean){
    const formValues = this.reportActListForm.value;
  
    const codigoActo = parseInt(formValues.CodigoActo as any, 10); // Convertir a número entero

    const payload = {
      usuarioReporte: this.nombre,
      CodigoActo: codigoActo,
    }

     const serviceCall = type === 'PDF' 
    ? this.reportsService.getActListPdf(payload as any)
    : type === 'TXT'
        ? this.reportsService.getActListTxt(payload as any)
        : this.reportsService.getActListExcel(payload as any);
    
        serviceCall.subscribe({
          next: (res) => {
            this.messageService.add({ severity: 'success', summary: 'Reporte generado', detail: 'Procesando archivo...' });
    
            const mimeType = type === 'PDF' 
              ? 'application/pdf' 
              : type === 'TXT'
                ? 'text/plain'
                : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    
            const blob = new Blob([res], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            this.currentBlobUrl = url; // Guardamos para el cleanup
    
            if (esPantalla && type === "PDF") {
              // --- ABRIR MODAL DINÁMICO ---
              this.ref = this.dialogService.open(PdfViewerComponent, {
                header: 'Vista Previa del Reporte de Usuarios',
                width: '80%',
                closable: true,
                contentStyle: { overflow: 'auto' },
                baseZIndex: 10000,
                data: { url: url } 
              });
    
              this.ref.onClose.subscribe(() => {
                this.cleanupBlob();
              });
            } else {
              // --- CASO: DESCARGAR ---
              const a = document.createElement('a');
              a.href = url;
              a.download = `reporte_usuarios_${new Date().getTime()}.${type === 'PDF' ? 'pdf' : type === 'TXT' ? 'txt' : 'xlsx' }`;
              a.click();
              
              // Limpieza rápida para descargas
              setTimeout(() => this.cleanupBlob(), 1000);
            }
          },
          error: (err) => {
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo conectar con el servidor.' });
            console.error(err);
          }
        });
  }

  private cleanupBlob() {
    if (this.currentBlobUrl) {
      window.URL.revokeObjectURL(this.currentBlobUrl);
      this.currentBlobUrl = null;
    }
  }

  ngOnDestroy() {
    if (this.ref) this.ref.close();
    this.cleanupBlob();
  }
}
