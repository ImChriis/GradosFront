import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-confirm-delete-modal',
  imports: [
    CommonModule,
    ButtonModule
  ],
  templateUrl: './confirm-delete-modal.component.html',
  styleUrl: './confirm-delete-modal.component.scss'
})
export class ConfirmDeleteModalComponent implements OnInit{
  private dialogConfig = inject(DynamicDialogConfig);
  private dialogRef = inject(DynamicDialogRef);
  data = this.dialogConfig.data;
  message!: string;

  ngOnInit(): void {
    console.log('Data received in ConfirmDeleteModalComponent:', this.data);
  
    this.message = this.data.message || 'Are you sure you want to delete this item?';
  }

   confirm(){
    this.dialogRef.close(true);
  }

  cancel(){
    this.dialogRef.close(false);
  }
}
