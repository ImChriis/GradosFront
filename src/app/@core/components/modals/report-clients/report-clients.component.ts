import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ReportsService } from '../../../services/reports.service';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PdfViewerComponent } from '../../pdf-viewer/pdf-viewer.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-report-clients',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './report-clients.component.html',
  styleUrl: './report-clients.component.scss'
})
export class ReportClientsComponent implements OnInit, OnDestroy{
  private reportsService = inject(ReportsService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  private fb = inject(FormBuilder);
  private currentBlobUrl: string | null = null;
  nombre!: string;
  ref!: DynamicDialogRef;

  reportClientsForm = this.fb.group({
    fechaDesde: [null],
    nucedula: [true],
    txnombre: [true],
    txdireccion: [false],
    txtelefono: [false],
    txcelular: [false],
    txemail: [true],
    usuarioReporte: [''],
    campos: [['']]
  })

  ngOnInit(): void {
    const user = localStorage.getItem('User');

    if(user){
      this.nombre = JSON.parse(user).user.nombre;
      console.log(this.nombre);
    }
  }

 onSubmit(type: string, esPantalla: boolean) {
    // 1. Obtener los valores del formulario
    const formValues = this.reportClientsForm.value;

    // 2. Filtrar qué campos (checkboxes) están en 'true'
    // Estos nombres deben coincidir con los de tu DB: nucedula, txnombre, etc.
    const camposDisponibles = ['nucedula', 'txnombre', 'txdireccion', 'txtelefono', 'txcelular', 'txemail'] as const;
    const camposSeleccionados = camposDisponibles.filter(campo => formValues[campo] === true);

    // Validar que al menos haya un campo seleccionado
    if (camposSeleccionados.length === 0) {
        this.messageService.add({ 
            severity: 'warn', 
            summary: 'Atención', 
            detail: 'Debe seleccionar al menos una columna para el reporte.' 
        });
        return;
    }

    // 3. Preparar el Payload (Cuerpo de la petición)
    const payload = {
        usuarioReporte: this.nombre, // Nombre del usuario actual
        fechaDesde: formValues.fechaDesde, // Fecha del input date
        campos: camposSeleccionados
    };

    // 4. Llamada al servicio (Ahora es un POST que recibe el payload)
    const serviceCall = type === 'PDF' 
      ? this.reportsService.getClientsPdf(payload as any) // Cast necesario si el método espera un tipo específico
      : this.reportsService.getClientsExcel(payload as any);

    serviceCall.subscribe({
      next: (res) => {
        this.messageService.add({ severity: 'success', summary: 'Reporte generado', detail: 'Procesando archivo...' });

        const mimeType = type === 'PDF' 
          ? 'application/pdf' 
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
          a.download = `reporte_usuarios_${new Date().getTime()}.${type === 'PDF' ? 'pdf' : 'xlsx'}`;
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
