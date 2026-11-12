import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TableModule } from 'primeng/table';
import { ReportsService } from '../../../../@core/services/reports.service';
import { LoaderComponent } from '../../../../@core/components/loader/loader.component';
import { OnlyNumbersDirective } from '../../../../@core/directives/only-numbers.directive';
import { PrintModalComponent } from '../../../../pages/act-contract/components/print-modal/print-modal.component';

/**
 * Consulta de recibos para reimprimir.
 *  - data.tipo = 'RANGO': busca entre dos fechas y se elige uno de la tabla.
 *  - data.tipo = 'NUMERO': busca un recibo por su número.
 * En ambos casos se abre el mismo modal de impresión de pagos.
 */
@Component({
  selector: 'app-report-receipts',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    LoaderComponent,
    OnlyNumbersDirective
  ],
  templateUrl: './report-receipts.component.html',
  styleUrl: './report-receipts.component.scss'
})
export class ReportReceiptsComponent implements OnDestroy {
  private reportsService = inject(ReportsService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  private dialogConfig = inject(DynamicDialogConfig);
  private fb = inject(FormBuilder);
  printRef!: DynamicDialogRef;
  tipo: 'RANGO' | 'NUMERO' = this.dialogConfig.data?.tipo === 'NUMERO' ? 'NUMERO' : 'RANGO';
  isLoading = signal(false);
  recibos = signal<any[]>([]);
  seleccionado = signal<any>(null);

  private hoy = new Date().toLocaleDateString('en-CA');

  receiptsForm = this.fb.group({
    desde: [this.hoy],
    hasta: [this.hoy],
    NoRecibo: ['']
  });

  buscarPorRango() {
    const { desde, hasta } = this.receiptsForm.value;

    if (!desde || !hasta) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe indicar las fechas Desde y Hasta.' });
      return;
    }
    if (desde > hasta) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'La fecha Desde no puede ser mayor que la fecha Hasta.' });
      return;
    }

    this.isLoading.set(true);
    this.seleccionado.set(null);

    this.reportsService.getRecibosPorRango(desde, hasta).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.recibos.set(res);
        if (res.length === 0) {
          this.messageService.add({ severity: 'info', summary: 'Recibos', detail: 'No hay recibos en ese rango de fechas.' });
        }
      },
      error: (err) => this.mostrarError(err)
    });
  }

  buscarPorNumero() {
    const NoRecibo = Number(this.receiptsForm.value.NoRecibo);

    if (!NoRecibo) {
      this.messageService.add({ severity: 'warn', summary: 'Atención', detail: 'Debe indicar el número de recibo.' });
      return;
    }

    this.isLoading.set(true);

    this.reportsService.getReciboPorNumero(NoRecibo).subscribe({
      next: (recibo) => {
        this.isLoading.set(false);
        this.imprimir(recibo);
      },
      error: (err) => this.mostrarError(err)
    });
  }

  imprimir(recibo: any) {
    if (!recibo) return;

    this.printRef = this.dialogService.open(PrintModalComponent, {
      header: `¿Qué te gustaría hacer con el recibo N° ${recibo.NoRecibo}?`,
      width: '40%',
      modal: true,
      closable: true,
      data: {
        NoRecibo: recibo.NoRecibo,
        email: recibo.email
      },
      breakpoints: {
        '960px': '90%',
        '640px': '100%'
      }
    });
  }

  esAnulado(recibo: any): boolean {
    return String(recibo?.Anulado ?? '') === '1';
  }

  private mostrarError(err: any) {
    this.isLoading.set(false);
    console.error('Error al consultar recibos:', err);
    this.messageService.add({
      severity: err.status === 404 || err.status === 400 ? 'warn' : 'error',
      summary: 'Recibos',
      detail: err.error?.message || 'Ocurrió un error al consultar los recibos.'
    });
  }

  ngOnDestroy() {
    if (this.printRef) this.printRef.close();
  }
}
