import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ReportsService } from '../../../../@core/services/reports.service';
import { PdfViewerComponent } from '../../../../@core/components/pdf-viewer/pdf-viewer.component';


@Component({
  selector: 'app-report-specialities',
  imports: [],
  templateUrl: './report-specialities.component.html',
  styleUrl: './report-specialities.component.scss'
})
export class ReportSpecialitiesComponent implements OnInit, OnDestroy{
 private reportsService = inject(ReportsService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  private currentBlobUrl: string | null = null;
  ref!: DynamicDialogRef;
  nombre!: string;

  ngOnInit(){
    const user = localStorage.getItem('User');
    if(user){
      this.nombre = JSON.parse(user).user.nombre;
      console.log(this.nombre);
    }
  }

  onSubmit(type: string, esPantalla: boolean) {
    const serviceCall = type === 'PDF' 
      ? this.reportsService.getSpecialitiesPdf(this.nombre)
      : this.reportsService.getSpecialitiesExcel(this.nombre);

    serviceCall.subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Reporte generado', detail: 'Procesando archivo...' });

        // Determinar el MIME type
        const mimeType = type === 'PDF' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        const blob = new Blob([res], { type: mimeType });
        const url = window.URL.createObjectURL(blob);

        if (esPantalla && type === "PDF") {
// --- ABRIR MODAL DINÁMICO ---
          this.ref = this.dialogService.open(PdfViewerComponent, {
            header: 'Vista Previa del Reporte',
            width: '80%',
            closable: true,
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            data: { url: url } // Pasamos la URL al componente inyectado
          });

          // Limpiar memoria cuando se cierre el diálogo
          this.ref.onClose.subscribe(() => {
            this.cleanupBlob();
          });
        } else {
          // --- CASO: DESCARGAR ---
          const a = document.createElement('a');
          a.href = url;
          a.download = `reporte_lugares_actos.${type === 'PDF' ? 'pdf' : 'xlsx'}`;
          a.click();
        }
        
        // Limpieza de memoria (opcional pero recomendado con un pequeño delay)
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Ha ocurrido un error al generar el reporte.' });
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
