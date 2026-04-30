import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-refresh',
  imports: [
    CommonModule
  ],
  templateUrl: './refresh.component.html',
  styleUrl: './refresh.component.scss'
})
export class RefreshComponent {
  private dialogConfig = inject(DynamicDialogConfig);
  private dialogRef = inject(DynamicDialogRef);
  codigoActo = this.dialogConfig.data.codigoActo;

  refreshUsers(){
    this.dialogRef.close("users");
  }

  refreshActs(){
    this.dialogRef.close("acts");
  }

  close(){
    this.dialogRef.close();
  }
}
