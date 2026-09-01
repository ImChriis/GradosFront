import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActContractService } from '../../../../@core/services/act-contract.service';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PdfViewerComponent } from '../../../../@core/components/pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-print-modal',
  imports: [],
  templateUrl: './print-modal.component.html',
  styleUrl: './print-modal.component.scss'
})
export class PrintModalComponent implements OnInit, OnDestroy {
  private actContractService = inject(ActContractService)
  private messageService = inject(MessageService);
  private dialogConfig = inject(DynamicDialogConfig);
  private dialogService = inject(DialogService);
  private currentBlobUrl: string | null = null;
  ref!: DynamicDialogRef;
  nombre!: string;
  NoRecibo = this.dialogConfig.data.NoRecibo;
  email = this.dialogConfig.data.email;
  
  ngOnInit(): void {
    const user = localStorage.getItem('User');

    if(user){
      this.nombre = JSON.parse(user).user.nombre;
      console.log(this.nombre);
    }
  }

 onSubmitPrint(type: 'PDF' | 'CORREO', esPantalla: boolean, esUnaPagina: boolean, NoRecibo: number) {
    const bodyRaw = '';
    const body = { emailCliente: this.email };

    let serviceCall;

    if (type === 'CORREO') {
      // Selección de método según cantidad de páginas para CORREO
      serviceCall = esUnaPagina
        ? this.actContractService.sendReciboEmail(NoRecibo, this.nombre, body)
        : this.actContractService.sendReciboEmailTwoPages(NoRecibo, this.nombre, body);
    } else {
      // Selección de método según cantidad de páginas para PDF
      serviceCall = esUnaPagina
        ? this.actContractService.printReciboPdf(NoRecibo, this.nombre, bodyRaw)
        : this.actContractService.printReciboPdfTwoPages(NoRecibo, this.nombre, bodyRaw);
    }

    serviceCall.subscribe({
      next: (res: any) => {
        // CASO A: Envío por Correo
        if (type === 'CORREO') {
          this.messageService.add({
            severity: 'success',
            summary: 'Correo enviado',
            detail: `El recibo Nº ${NoRecibo} ha sido enviado por correo exitosamente.`
          });
          return;
        }

        // CASO B: Generación de PDF (Visualización en pantalla o Descarga)
        this.messageService.add({
          severity: 'success',
          summary: 'Recibo generado',
          detail: 'Procesando archivo PDF...'
        });

        this.cleanupBlob();
        const blob = new Blob([res], { type: 'application/pdf' });
        this.currentBlobUrl = window.URL.createObjectURL(blob);

        if (esPantalla) {
          this.ref = this.dialogService.open(PdfViewerComponent, {
            header: `Vista Previa - Recibo Nº ${NoRecibo}`,
            width: '80%',
            closable: true,
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            data: { url: this.currentBlobUrl }
          });

          this.ref.onClose.subscribe(() => {
            this.cleanupBlob();
          });
        } else {
          const a = document.createElement('a');
          a.href = this.currentBlobUrl;
          a.download = `recibo_${NoRecibo}.pdf`;
          a.click();

          setTimeout(() => this.cleanupBlob(), 1000);
        }
      },
      error: (err) => {
        console.error(`Error procesando solicitud (${type}):`, err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: type === 'PDF'
            ? 'No se pudo generar el PDF del recibo.'
            : 'No se pudo enviar el recibo por correo.'
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
