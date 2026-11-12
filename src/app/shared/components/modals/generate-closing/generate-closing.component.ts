import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { OnlyNumbersDirective } from '../../../../@core/directives/only-numbers.directive';
import { ReportsService } from '../../../../@core/services/reports.service';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PdfViewerComponent } from '../../../../@core/components/pdf-viewer/pdf-viewer.component';
import { SettingsService } from '../../../../@core/services/settings.service';
import { LoaderComponent } from '../../../../@core/components/loader/loader.component';
import { AuthService } from '../../../../@core/services/auth.service';


/**
 * Modal de cierres.
 *  - Cierre X (data.tipo = 'X'): parcial del cajero logueado, acumulado del día hasta ahora.
 *  - Cierre Z (data.tipo = 'Z', por defecto): uno solo por día para todos los cajeros.
 * El número a generar lo asigna el backend; aquí solo se muestra el correlativo actual.
 */
@Component({
  selector: 'app-generate-closing',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OnlyNumbersDirective,
    LoaderComponent
  ],
  templateUrl: './generate-closing.component.html',
  styleUrl: './generate-closing.component.scss'
})
export class GenerateClosingComponent implements OnInit, OnDestroy{
  private reportsService = inject(ReportsService);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  private settingsService = inject(SettingsService);
  private authService = inject(AuthService);
  private dialogConfig = inject(DynamicDialogConfig);
  private fb = inject(FormBuilder);
  private currentBlobUrl: string | null = null;
  ref!: DynamicDialogRef;
  nombre!: string;
  tipo: 'X' | 'Z' = this.dialogConfig.data?.tipo === 'X' ? 'X' : 'Z';
  isLoading = signal(false);

  // Solo lectura: el X es de hoy y el Z de la fecha que indique el backend
  generateClosingForm = this.fb.group({
    ferecibo: [''],
    fechaVista: [''],
    hora: [''],
    NoCierre: ['']
  })

  ngOnInit(){
    const user = localStorage.getItem('User');

    if(user){
      const userData = JSON.parse(user);
      this.nombre = userData.user.nombre;
    }

    this.settingsService.getSettings().subscribe({
      next: (res: any) => {
        this.generateClosingForm.patchValue({ NoCierre: this.tipo === 'X' ? res.NoCierreX : res.NoCierreZ });
      }
    })

    this.generateClosingForm.patchValue({
      hora: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true })
    });
    this.setFecha(new Date().toLocaleDateString('en-CA'));

    if (this.tipo === 'Z') {
      this.reportsService.getClosingZFecha().subscribe({
        next: (res) => this.setFecha(res.fecha)
      });
    }
  }

  private setFecha(fecha: string) {
    this.generateClosingForm.patchValue({ ferecibo: fecha, fechaVista: fecha.split('-').reverse().join('/') });
  }

  onSubmit(formato: 'PDF' | 'EXCEL', optPantalla: boolean) {
    const formValues = this.generateClosingForm.value;

    if (!formValues.ferecibo) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'No se pudo obtener la Fecha del Cierre.'
      });
      return;
    }

    if (this.tipo === 'X' && !this.authService.CodUser()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'No se encontró el cajero de la sesión. Vuelva a iniciar sesión.'
      });
      return;
    }

    this.isLoading.set(true);

    const serviceCall = this.tipo === 'X'
      ? this.reportsService.generateClosingXPdf({ CodUser: this.authService.CodUser(), usuarioReporte: this.nombre, formato, NoCierre: formValues.NoCierre })
      : this.reportsService.generateClosingPdf({ ferecibo: formValues.ferecibo, CodUser: this.authService.CodUser(), usuarioReporte: this.nombre, formato, NoCierre: formValues.NoCierre });

    serviceCall.subscribe({
      next: (res: Blob) => {
        this.messageService.add({
          severity: 'success',
          summary: `Cierre ${this.tipo} generado`,
          detail: 'Procesando archivo...'
        });

        const isPdf = formato === 'PDF';
        const blob = new Blob([res], {
          type: isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        this.currentBlobUrl = url;
        const titulo = `Cierre ${this.tipo} N° ${formValues.NoCierre}`;

        // Excel siempre se descarga; la vista previa es solo para PDF
        if (optPantalla && isPdf) {
          this.ref = this.dialogService.open(PdfViewerComponent, {
            header: `Vista Previa - ${titulo}`,
            width: '85%',
            height: '90vh',
            closable: true,
            contentStyle: { overflow: 'auto' },
            baseZIndex: 10000,
            data: { url: url }
          });

          this.ref.onClose.subscribe(() => {
            this.isLoading.set(false);
            this.cleanupBlob();
          });
        } else {
          const a = document.createElement('a');
          a.href = url;
          a.download = `Cierre_${this.tipo}_${formValues.NoCierre}_${new Date().getTime()}.${isPdf ? 'pdf' : 'xlsx'}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          setTimeout(() => {
            this.isLoading.set(false);
            this.cleanupBlob()
          }, 1000);
        }
      },
      error: async (err) => {
        this.isLoading.set(false);
        console.error(`Error al generar el cierre ${this.tipo}:`, err);

        // Con responseType 'blob' el JSON de error del backend llega como Blob
        let detail = 'Ocurrió un error al generar el reporte. Por favor, inténtelo de nuevo.';
        if (err.error instanceof Blob) {
          try {
            detail = JSON.parse(await err.error.text()).message || detail;
          } catch { }
        }

        this.messageService.add({
          severity: err.status === 404 || err.status === 409 ? 'warn' : 'error',
          summary: `Cierre ${this.tipo}`,
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
