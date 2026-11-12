import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ReportsService } from '../../../../@core/services/reports.service';
import { PdfViewerComponent } from '../../../../@core/components/pdf-viewer/pdf-viewer.component';
import { LoaderComponent } from '../../../../@core/components/loader/loader.component';
import { OnlyNumbersDirective } from '../../../../@core/directives/only-numbers.directive';

/**
 * Datos de un contrato: todos sus datos, montos, recibos y depósitos.
 * El NoContrato se repite entre actos y anillos, por eso se elige el tipo.
 */
@Component({
  selector: 'app-report-contract-data',
  imports: [
    ReactiveFormsModule,
    LoaderComponent,
    OnlyNumbersDirective
  ],
  templateUrl: './report-contract-data.component.html',
  styleUrl: './report-contract-data.component.scss'
})
export class ReportContractDataComponent implements OnInit, OnDestroy {
  private reportsService = inject(ReportsService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  private fb = inject(FormBuilder);
  private currentBlobUrl: string | null = null;
  ref!: DynamicDialogRef;
  nombre!: string;
  isLoading = signal(false);

  contractForm = this.fb.group({
    NoContrato: [''],
    tipo: ['ACTO']
  });

  ngOnInit() {
    const user = localStorage.getItem('User');
    if (user) {
      this.nombre = JSON.parse(user).user.nombre;
    }
  }

  onSubmit(formato: 'PDF' | 'EXCEL', esPantalla: boolean) {
    const { NoContrato, tipo } = this.contractForm.value;

    if (!Number(NoContrato)) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe indicar el número de contrato.' });
      return;
    }

    this.isLoading.set(true);

    this.reportsService.getContractData({ NoContrato: Number(NoContrato), tipo, usuarioReporte: this.nombre, formato }).subscribe({
      next: (res: Blob) => {
        this.messageService.add({ severity: 'success', summary: 'Reporte generado', detail: 'Procesando archivo...' });

        const isPdf = formato === 'PDF';
        const blob = new Blob([res], {
          type: isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        this.cleanupBlob();
        this.currentBlobUrl = window.URL.createObjectURL(blob);

        // Excel siempre se descarga; la vista previa es solo para PDF
        if (esPantalla && isPdf) {
          this.ref = this.dialogService.open(PdfViewerComponent, {
            header: `Vista Previa - Contrato N° ${NoContrato}`,
            width: '80%',
            closable: true,
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            data: { url: this.currentBlobUrl }
          });

          this.ref.onClose.subscribe(() => {
            this.isLoading.set(false);
            this.cleanupBlob();
          });
        } else {
          const a = document.createElement('a');
          a.href = this.currentBlobUrl;
          a.download = `contrato_${NoContrato}.${isPdf ? 'pdf' : 'xlsx'}`;
          a.click();

          setTimeout(() => {
            this.isLoading.set(false);
            this.cleanupBlob();
          }, 1000);
        }
      },
      error: async (err) => {
        this.isLoading.set(false);
        console.error('Error al generar los datos del contrato:', err);

        // Con responseType 'blob' el JSON de error del backend llega como Blob
        let detail = 'Ocurrió un error al generar el reporte. Por favor, inténtelo de nuevo.';
        if (err.error instanceof Blob) {
          try {
            detail = JSON.parse(await err.error.text()).message || detail;
          } catch { }
        }

        this.messageService.add({
          severity: err.status === 404 || err.status === 400 ? 'warn' : 'error',
          summary: 'Datos del Contrato',
          detail
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
