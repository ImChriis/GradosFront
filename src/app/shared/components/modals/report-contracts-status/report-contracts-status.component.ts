import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ReportsService } from '../../../../@core/services/reports.service';
import { PdfViewerComponent } from '../../../../@core/components/pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-report-contracts-status',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './report-contracts-status.component.html',
  styleUrl: './report-contracts-status.component.scss'
})
export class ReportContractsStatusComponent implements OnInit, OnDestroy {
  private reportsService = inject(ReportsService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  private fb = inject(FormBuilder);
  private currentBlobUrl: string | null = null;
  nombre!: string;
  ref!: DynamicDialogRef;

  /** Mismos estados 1..7 de la pestaña Estado del contrato de anillos */
  estados = [
    { valor: '1', etiqueta: '1 - En Proceso' },
    { valor: '2', etiqueta: '2 - En Fabricación' },
    { valor: '3', etiqueta: '3 - Fabricado' },
    { valor: '4', etiqueta: '4 - En Engastes' },
    { valor: '5', etiqueta: '5 - Por Entregar' },
    { valor: '6', etiqueta: '6 - Entregado' },
    { valor: '7', etiqueta: '7 - Servicio' }
  ];

  reportForm = this.fb.group({
    estado: ['1']
  });

  ngOnInit(): void {
    const user = localStorage.getItem('User');

    if (user) {
      this.nombre = JSON.parse(user).user.nombre;
    }
  }

  onSubmit(type: string, esPantalla: boolean) {
    const estado = this.reportForm.value.estado;

    if (!estado) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debe seleccionar un estado para el reporte.'
      });
      return;
    }

    const payload = {
      usuarioReporte: this.nombre,
      estado
    };

    const serviceCall = type === 'PDF'
      ? this.reportsService.getContractsByStatusPdf(payload)
      : this.reportsService.getContractsByStatusExcel(payload);

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
            header: 'Vista Previa - Contratos por Estatus',
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
          a.download = `contratos_por_estatus_${new Date().getTime()}.${type === 'PDF' ? 'pdf' : 'xlsx'}`;
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
