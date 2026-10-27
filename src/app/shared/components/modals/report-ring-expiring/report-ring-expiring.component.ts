import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ReportsService } from '../../../../@core/services/reports.service';
import { PdfViewerComponent } from '../../../../@core/components/pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-report-ring-expiring',
  imports: [
    CommonModule
  ],
  templateUrl: './report-ring-expiring.component.html',
  styleUrl: './report-ring-expiring.component.scss'
})
export class ReportRingExpiringComponent implements OnInit, OnDestroy {
  private reportsService = inject(ReportsService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  private currentBlobUrl: string | null = null;
  nombre!: string;
  ref!: DynamicDialogRef;

  /** Ventana fija que usa el backend (DIAS_VENCIMIENTO) */
  diasVentana = 30;

  ngOnInit(): void {
    const user = localStorage.getItem('User');

    if (user) {
      this.nombre = JSON.parse(user).user.nombre;
    }
  }

  onSubmit(type: string, esPantalla: boolean) {
    const payload = {
      usuarioReporte: this.nombre
    };

    const serviceCall = type === 'PDF'
      ? this.reportsService.getRingExpiringPdf(payload)
      : this.reportsService.getRingExpiringExcel(payload);

    serviceCall.subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Reporte generado', detail: 'Procesando archivo...' });

        const mimeType = type === 'PDF'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        const blob = new Blob([res], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        this.currentBlobUrl = url;

        if (esPantalla && type === 'PDF') {
          this.ref = this.dialogService.open(PdfViewerComponent, {
            header: 'Vista Previa - Anillos Próximos a Vencer',
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
          const a = document.createElement('a');
          a.href = url;
          a.download = `anillos_por_vencer_${new Date().getTime()}.${type === 'PDF' ? 'pdf' : 'xlsx'}`;
          a.click();

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
