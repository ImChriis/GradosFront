import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PaymentMethodsService } from '../../@core/services/payment-methods.service';
import { MessageService } from 'primeng/api';
import { PaymentMethodForm } from '../../@core/models/forms/paymentMethod-form';
import { PaymentMethod } from '../../@core/models/paymentMethod.model';
import { delay, Observable, startWith, switchMap, tap } from 'rxjs';
import { TableModule } from 'primeng/table';
import { LoaderComponent } from '../../@core/components/loader/loader.component';
import { UppercaseDirective } from '../../@core/directives/uppercase.directive';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-payment-methods',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    InputTextModule,
    LoaderComponent,
    UppercaseDirective
  ],
  templateUrl: './payment-methods.component.html',
  styleUrl: './payment-methods.component.scss'
})
export class PaymentMethodsComponent implements OnInit{
  private paymentMethodsService = inject(PaymentMethodsService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  isAdding = false;
  isEnabled = false;
  selectedPaymentMethod: PaymentMethod | null = null;
  paymentMethods$!: Observable<PaymentMethod[]>;
  id!: number | null;
  isLoading = signal(true);

  paymentMethodForm: FormGroup<PaymentMethodForm> = this.fb.group({
    idMetodoPago: new FormControl<number | null>(null),
    nombreMetodoPago: new FormControl<string | null>(null),
    status: new FormControl<number | null>(null)
  })

  ngOnInit(): void {
    this.paymentMethods$ = this.paymentMethodsService.refreshObservable$.pipe(
      startWith(null),
      tap(() => this.isLoading.set(true)),
      switchMap(() => {
        return this.paymentMethodsService.getPaymentMethods();
      }),
      delay(500),
      tap(() => this.isLoading.set(false))
      )

      this.paymentMethodForm.disable();
      this.selectedPaymentMethod = null;
  }

  onSelectedPaymentMethod(paymentMethod: PaymentMethod){
    this.isAdding = true;
    this.isEnabled = true;
    this.selectedPaymentMethod = paymentMethod;
    this.paymentMethodForm.enable();
    this.paymentMethodForm.patchValue({
      idMetodoPago: paymentMethod.idMetodoPago,
      nombreMetodoPago: paymentMethod.nombreMetodoPago,
      status: paymentMethod.status
    })

    this.id = paymentMethod.idMetodoPago;
  }

  add(){
    this.isAdding = true;
    this.isEnabled = true;
    this.selectedPaymentMethod = null;
    this.paymentMethodForm.enable();

     setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(
        'input[formcontrolname="nombreMetodoPago"]'
      );
      el?.focus();
    }, 0);
  }

  save(){
    if(this.selectedPaymentMethod){
      this.paymentMethodsService.updatePaymentMethod(this.id!, this.paymentMethodForm.value).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Método de pago actualizado correctamente' });
          this.paymentMethodForm.reset();
          this.isAdding = false;
          this.selectedPaymentMethod = null;
          this.isEnabled = false;
          this.paymentMethodForm.disable();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el método de pago' });
        }
      })
    }else{
      this.paymentMethodsService.addPaymentMethod(this.paymentMethodForm.value).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Método de pago agregado correctamente' });
          this.paymentMethodForm.reset();
          this.isAdding = false;
          this.selectedPaymentMethod = null;
          this.isEnabled = false;
          this.paymentMethodForm.disable();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo agregar el método de pago' });
        }
      })
    }
  }

  cancel(){
    this.isEnabled = false;
    this.isAdding = false;
    this.selectedPaymentMethod = null;
    this.paymentMethodForm.reset();
    this.paymentMethodForm.disable();
  }
}
