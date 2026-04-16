import { Component, HostListener, inject } from '@angular/core';
import { BackupService } from '../../../../@core/services/backup.service';
import { MessageService } from 'primeng/api';
import { LoaderComponent } from '../../../../@core/components/loader/loader.component';
import { CommonModule } from '@angular/common';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-backup',
  imports: [
    CommonModule,
    LoaderComponent
  ],
  templateUrl: './backup.component.html',
  styleUrl: './backup.component.scss'
})
export class BackupComponent {
  private backUpService = inject(BackupService);
  private messageService = inject(MessageService);
  isLoading: boolean = false;
  ref!: DynamicDialogRef;

  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: BeforeUnloadEvent) {
    if (this.isLoading) {
      event.preventDefault();
      event.returnValue = false; 
    }
  }

  async downloadBackup() {
  this.backUpService.downloadBackup().subscribe({
    next: async (blob: Blob) => {
      try {
        // Esta línea abre la ventana de "Guardar como" en tu Windows
        if ('showSaveFilePicker' in window) {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: `respaldo_grados_${new Date().getTime()}.sql`,
            types: [{
              description: 'SQL Database Backup',
              accept: { 'application/sql': ['.sql'] },
            }],
          });

          // El usuario eligió la ruta, ahora escribimos el blob ahí
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          
          console.log("¡Archivo guardado donde elegiste!");
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Respaldo descargado correctamente' });
        } else {
          // Si el navegador no soporta el picker, descarga normal
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'backup.sql';
          a.click();
        }
      } catch (err) {
        // Si el usuario cierra la ventana sin elegir, cae aquí
        console.log('Descarga cancelada por el usuario');
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al descargar el respaldo' });
      }
    }
  });
}

onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      // Validación rápida de extensión
      if (!file.name.endsWith('.sql')) {
        alert('Por favor, selecciona un archivo .sql válido');
        return;
      }

      const confirmar = confirm(`¿Estás seguro de restaurar "${file.name}"? Se sobrescribirán los datos actuales.`);
      
      if (confirmar) {
        this.executeRestore(file);
      }
      
      // Limpiamos el input para que pueda seleccionar el mismo archivo otra vez si falla
      event.target.value = '';
    }
  }

  executeRestore(file: File) {
    this.isLoading = true; // ACTIVAMOS TU LOADER

    this.backUpService.restoreBackup(file).subscribe({
      next: (res: any) => {
        this.isLoading = false; // DESACTIVAMOS LOADER
        this.messageService.add({ 
          severity: 'success', 
          summary: '¡Éxito!', 
          detail: 'Base de datos restaurada completamente' 
        });
        
        this.ref.close(); // CERRAMOS EL MODAL
      },
      error: (err: any) => {
        this.isLoading = false; // DESACTIVAMOS LOADER
        console.error('Error restaurando:', err);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Fallo en restauración', 
          detail: 'La transacción fue cancelada y no se aplicaron cambios.' 
        });
      }
    });
  }
}
