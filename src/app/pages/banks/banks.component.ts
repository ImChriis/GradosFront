import { Component, inject, OnInit } from '@angular/core';
import { BanksService } from '../../@core/services/banks.service';
import { Bank } from '../../@core/models/bank.model';
import { MessageService } from 'primeng/api';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable, startWith, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { InputText } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { BankForm } from '../../@core/models/forms/bank-form';
import { UppercaseDirective } from '../../@core/directives/uppercase.directive';

@Component({
  selector: 'app-banks',
  imports: [
    CommonModule,
    InputText,
    TableModule,
    ReactiveFormsModule,
    UppercaseDirective
  ],
  templateUrl: './banks.component.html',
  styleUrl: './banks.component.scss'
})
export class BanksComponent implements OnInit{
  private banksService = inject(BanksService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  isAdding = false;
  isEnabled = false;
  selectedBank: Bank | null = null;
  banks$!: Observable<Bank[]>;
  id!: number | null;

  banksForm: FormGroup<BankForm> = this.fb.group({
    id: new FormControl<number | null>(null),
    Bancos: new FormControl<string | null>('', { nonNullable: true }),
  })

  ngOnInit(): void {
    this.banks$ = this.banksService.refreshObservable$.pipe(
      startWith(null),
      switchMap(() => {
        return this.banksService.getAllBanks();
      })
    )

    this.banksForm.disable();
    this.selectedBank = null;
  }

  onSelectedBank(bank: Bank){
    this.isAdding = false;
    this.isEnabled = true;
    this.selectedBank = bank;
    this.banksForm.enable();
    this.banksForm.patchValue({
      id: bank.id,
      Bancos: bank.Bancos,
    })

    this.id = bank.id;
  }

  onAdd(){
    this.isAdding = true;
    this.isEnabled = true;
    this.selectedBank = null;
    this.banksForm.enable();

    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(
        'input[formcontrolname="Bancos"], textarea[formcontrolname="Bancos"]'
      );
      el?.focus();
    }, 0);
  }

  onSave(){
    if(this.selectedBank){
      this.banksService.updateBank(this.id!, this.banksForm.value as Bank).subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Banco actualizado correctamente' });
          this.banksForm.reset();
          this.isAdding = false;
          this.selectedBank = null;
          this.isEnabled = false;
          this.banksForm.disable();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar el banco' });
        }
      })
    }else{
      this.banksService.addBank(this.banksForm.value as Bank).subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Banco agregado correctamente' });
          this.banksForm.reset();
          this.isAdding = false;
          this.selectedBank = null;
          this.isEnabled = false;
          this.banksForm.disable();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al agregar el banco' });
        }
      })
    }
  }

  onCancel(){
    this.isEnabled = false;
    this.isAdding = false;
    this.selectedBank = null;
    this.banksForm.reset();
    this.banksForm.disable();
  }

  onDelete(){

  }
  
  
}
