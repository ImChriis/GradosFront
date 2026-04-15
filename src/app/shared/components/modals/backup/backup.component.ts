import { Component, inject } from '@angular/core';
import { BackupService } from '../../../../@core/services/backup.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-backup',
  imports: [],
  templateUrl: './backup.component.html',
  styleUrl: './backup.component.scss'
})
export class BackupComponent {
  private backUpService = inject(BackupService);
  private messageService = inject(MessageService);

  async downloadBackup() {
  this.backUpService.downloadBackup().subscribe({
    next: async (blob) => {
      try {
        // 1. Abrir el selector de archivos (Solo funciona en navegadores modernos)
        if ('showSaveFilePicker' in window) {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: `respaldo_bd_${new Date().getTime()}.sql`,
            types: [{
              description: 'Archivo SQL',
              accept: { 'text/plain': ['.sql'] },
            }],
          });

          // 2. Escribir el contenido en el lugar elegido
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
        } else {
          // Fallback: Descarga clásica si el navegador es viejo
          this.fallbackDownload(blob);
        }
      } catch (err) {
        console.error('El usuario canceló la selección o hubo un error', err);
      }
    },
    error: (err) => console.error('Error al obtener backup', err)
  });
}

private fallbackDownload(blob: Blob) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `respaldo_bd_${new Date().getTime()}.sql`;
  a.click();
  window.URL.revokeObjectURL(url);
}
}
