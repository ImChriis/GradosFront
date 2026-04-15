import { Component, inject, OnInit } from '@angular/core';
import { SettingsService } from '../../@core/services/settings.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SettingsForm } from '../../@core/models/forms/settings-form';
import { Settings } from '../../@core/models/settings.model';
import { MessageService } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BackupComponent } from '../../shared/components/modals/backup/backup.component';

@Component({
  selector: 'app-settings',
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit{
  private settingsService = inject(SettingsService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private dialogService = inject(DialogService);
  ref!: DynamicDialogRef;
  id!: string;

  ngOnInit(): void {
    this.settingsService.getSettings().subscribe({
      next: (res: any) => {
        this.id = res.Id;
        this.settingsForm.patchValue({
          ...res,
          feregistro: new Date(res.feregistro).toISOString().substring(0, 10)
        });
      }
    })
  }

 settingsForm: FormGroup<SettingsForm> = this.fb.group({
  Id: new FormControl<string | null>(null),
  CoSucursal: new FormControl<string | null>(null),
  NbSucursal: new FormControl<string | null>(null),
  Producto: new FormControl<string | null>(null),
  Nombre: new FormControl<string | null>(null),
  Rif: new FormControl<string | null>(null),
  Direccion: new FormControl<string | null>(null),
  Telefono: new FormControl<string | null>(null),
  Fax: new FormControl<string | null>(null),
  feregistro: new FormControl<Date | string | null>(null),
  txclaveadm: new FormControl<string | null>(null),
  NoRecibo: new FormControl<number | null>(0),
  NoContrato: new FormControl<number | null>(0),
  NoActo: new FormControl<number | null>(0),
  NoCierre: new FormControl<number | null>(0),
  CaDiasFab: new FormControl<number | null>(0),
  CaDiasEngaste: new FormControl<number | null>(0),
  MaFormRec: new FormControl<number | null>(0),
  PcOro18: new FormControl<string | null>('0'),
  PcOro14: new FormControl<string | null>('0'),
  PcOro10: new FormControl<string | null>('0'),
  MnMerma: new FormControl<string | null>('0'),
  MnCostOro: new FormControl<string | null>('0'),
  Impuesto: new FormControl<string | null>('0'),
  MnCostoMano: new FormControl<string | null>('0'),
  UbicacionLogo: new FormControl<string | null>(null),
  UbicacionRpt: new FormControl<string | null>(null),
  TxMensaje1: new FormControl<string | null>(null),
  TxMensaje2: new FormControl<string | null>(null),
  TxMensaje3: new FormControl<string | null>(null),
  GeneraNoRecibo: new FormControl<boolean | null>(false),
  GeneraNoContrato: new FormControl<boolean | null>(false),
  GeneraNoActo: new FormControl<boolean | null>(false),
  GeneraNoCierre: new FormControl<boolean | null>(false)
});

  onSubmit(){
    this.settingsService.updateSettings(this.id, this.settingsForm.value as unknown as Settings).subscribe({
      next: (res) => {
        console.log('Configuración actualizada:', res);
        this.messageService.add({severity:'success', summary: 'Éxito', detail: 'Configuración actualizada correctamente'});
      },
      error: (err) => {
        console.error('Error al actualizar configuración:', err);
        this.messageService.add({severity:'error', summary: 'Error', detail: 'Hubo un error al actualizar la configuración'});
      }
    });
  }

  openBackUpModal(){
    this.ref = this.dialogService.open(BackupComponent, {
      header: 'Respaldo de Datos',
      width: '50%',
      modal: true,
      closable: true,
    })
  }
}
