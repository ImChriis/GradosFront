import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { OnlyNumbersDirective } from '../../../../@core/directives/only-numbers.directive';
import { ReportsService } from '../../../../@core/services/reports.service';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PdfViewerComponent } from '../../../../@core/components/pdf-viewer/pdf-viewer.component';


@Component({
  selector: 'app-generate-closing',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OnlyNumbersDirective
  ],
  templateUrl: './generate-closing.component.html',
  styleUrl: './generate-closing.component.scss'
})
export class GenerateClosingComponent implements OnInit, OnDestroy{
  private reportsService = inject(ReportsService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  private fb = inject(FormBuilder);
  private currentBlobUrl: string | null = null;
  ref!: DynamicDialogRef;
  nombre!: string;

  ngOnInit(){
    const user = localStorage.getItem('user');

    if(user){
      const userData = JSON.parse(user);
      this.nombre = userData.nombre;
    }
  }

  generateClosingForm = this.fb.group({
    ferecibo: [''],
    NoCierre: [''],
    usuarioReporte: this.nombre
  })

 onSubmit(format: string, optPantalla: boolean) {
    // 1. Obtener valores del formulario de Cierre
    const formValues = this.generateClosingForm.value;
    console.log('Valores del formulario:', formValues);

    // 2. Validaciones iniciales
    if (!formValues.ferecibo || !formValues.NoCierre) {
        this.messageService.add({ 
            severity: 'warn', 
            summary: 'Atención', 
            detail: 'Debe ingresar la Fecha de Recibo y el Número de Cierre.' 
        });
        return;
    }

    // 3. Preparar el Payload exacto que espera la API Backend
    const payload = {
        ferecibo: formValues.ferecibo,     // Ej: '2026-05-20'
        NoCierre: formValues.NoCierre,     // Ej: 'C-2026-001'
        usuarioReporte: this.nombre // Nombre/Cédula del usuario autenticado
    };

    // 4. Determinar la llamada al servicio según el formato ('PDF' o 'EXCEL')
    const serviceCall = format.toUpperCase() === 'PDF' 
      ? this.reportsService.generateClosingPdf(payload)
      : this.reportsService.generateClosingPdf(payload);

    // Indicador visual de carga (opcional)
    // this.cargandoReporte = true;

    serviceCall.subscribe({
      next: (res: Blob) => {
        // this.cargandoReporte = false;
        
        this.messageService.add({ 
            severity: 'success', 
            summary: 'Reporte generado', 
            detail: 'Procesando archivo...' 
        });

        const isPdf = format.toUpperCase() === 'PDF';
        const mimeType = isPdf 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        // Crear objeto Blob a partir de la respuesta binaria
        const blob = new Blob([res], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        this.currentBlobUrl = url;

        // 5A. Caso: Vista Previa en Pantalla (Solo disponible para PDF)
        if (optPantalla && isPdf) {
          this.ref = this.dialogService.open(PdfViewerComponent, {
            header: `Vista Previa - Cierre N° ${payload.NoCierre}`,
            width: '85%',
            height: '90vh',
            closable: true,
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            data: { url: url } 
          });

          this.ref.onClose.subscribe(() => {
            this.cleanupBlob();
          });
        } 
        // 5B. Caso: Descarga directa (Excel siempre descarga o PDF si optPantalla es false)
        else {
          const extension = isPdf ? 'pdf' : 'xlsx';
          const filename = `Cierre_${payload.NoCierre}_${new Date().getTime()}.${extension}`;

          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          // Liberar recursos de memoria tras descargar
          setTimeout(() => this.cleanupBlob(), 1000);
        }
      },
      error: (err) => {
        // this.cargandoReporte = false;
        console.error('Error al generar el reporte de cierre:', err);
        
        this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'No se pudo generar el reporte. Verifique los parámetros o la conexión.' 
        });
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
