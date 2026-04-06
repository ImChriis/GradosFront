import { Component, inject } from '@angular/core';
import { ReportsService } from '../../../services/reports.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-report-act-places',
  imports: [],
  templateUrl: './report-act-places.component.html',
  styleUrl: './report-act-places.component.scss'
})
export class ReportActPlacesComponent {
  private reportsService = inject(ReportsService);
  private messageService = inject(MessageService);

  onSubmit(type: string, esPantalla: boolean) {
    const serviceCall = type === 'PDF' 
      ? this.reportsService.getActPlacesPdf() 
      : this.reportsService.getActPlacesExcel();

    serviceCall.subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Reporte generado', detail: 'Procesando archivo...' });

        // Determinar el MIME type
        const mimeType = type === 'PDF' 
          ? 'application/pdf' 
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        const blob = new Blob([res], { type: mimeType });
        const url = window.URL.createObjectURL(blob);

        if (esPantalla) {
          // --- CASO: ABRIR EN OTRA PESTAÑA ---
          window.open(url, '_blank');
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
}
