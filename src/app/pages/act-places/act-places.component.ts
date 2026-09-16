import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ActsService } from '../../@core/services/acts.service';
import { delay, Observable, startWith, switchMap, tap } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ActPlace } from '../../@core/models/act.model';
import { ActPlacesForm } from '../../@core/models/forms/act-form';
import { UppercaseDirective } from '../../@core/directives/uppercase.directive';
import { LoaderComponent } from '../../@core/components/loader/loader.component';
import { OnlyNumbersDirective } from '../../@core/directives/only-numbers.directive';
import { AuthService } from '../../@core/services/auth.service';

@Component({
  selector: 'app-act-places',
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    ɵInternalFormsSharedModule,
    ReactiveFormsModule,
    UppercaseDirective,
    LoaderComponent,
    OnlyNumbersDirective
],
  templateUrl: './act-places.component.html',
  styleUrl: './act-places.component.scss'
})
export class ActPlacesComponent implements OnInit{
  private actsService = inject(ActsService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  isAdding = false;
  isEnabled = false;
  selectedActPlace: ActPlace | null = null;
  acts$!: Observable<ActPlace[]>;
  CodLugar!: number | null;
  isLoading = signal(true);
  CodUser = this.authService.CodUser;

  actPlacesForm: FormGroup<ActPlacesForm> = this.fb.group({
    CoLugar: new FormControl<number | null>(null),
    TxLugar: new FormControl<string | null>(null),
    Capacidad: new FormControl<number | null>(null),
    MaTipoLugar: new FormControl<number | null>(null),
    Activo: new FormControl<number | null>(null),
    CodUser: new FormControl<string | null>(null),
  })

  ngOnInit(): void {
    this.acts$ = this.actsService.refreshObservable$.pipe(
      startWith(null),
      tap(() => this.isLoading.set(true)),
      switchMap(() => {
        return this.actsService.getAllActsPlaces();
      }),
      delay(500),
      tap(() => this.isLoading.set(false))
    )
    
    this.actPlacesForm.disable();
    this.selectedActPlace = null;
  }

  onSelect(actPlace: ActPlace){
    this.isAdding = true;
    this.isEnabled = false;
    this.selectedActPlace = actPlace;
    this.actPlacesForm.enable();
    this.actPlacesForm.patchValue({
      CoLugar: actPlace.CoLugar,
      TxLugar: actPlace.TxLugar,
      Capacidad: actPlace.Capacidad,
      MaTipoLugar: actPlace.MaTipoLugar,
      Activo: actPlace.Activo,
      CodUser: actPlace.CodUser,
    });

    this.CodLugar = actPlace.CoLugar;
    console.log("Selected Act Place: ", actPlace);
  }

  onAdd(){
    this.isEnabled = true;
    this.isAdding = true;
    this.actPlacesForm.enable();

    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(
        'textarea[formcontrolname="TxLugar"]'
      );
      el?.focus();
    }, 0);
  }

  onSave(){
    const formValue = this.actPlacesForm.getRawValue();
    const payload: Partial<ActPlace> = {
      ...formValue, CodUser: this.CodUser() ? String(this.CodUser()) : null
    } as ActPlace;

    if(this.selectedActPlace){
      console.log(this.CodLugar)
      console.log('Updating Act Place:', this.actPlacesForm.value);

      this.actsService.updateActPlace(this.CodLugar!, payload).subscribe({
        next:(res) => {
          this.messageService.add({ severity: 'success', summary: 'Sucess', detail: 'Lugar de Acto actualizado correctamente' });
          this.actPlacesForm.reset();
          this.isAdding = false;
          this.selectedActPlace = null;
          this.isEnabled = false;
          this.actPlacesForm.disable();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar el lugar de acto' });
        }
      })
    }else{
      this.actsService.addActPlace(payload).subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Sucess', detail: 'Lugar de Acto agregado correctamente' });
          this.actPlacesForm.reset();
          this.isAdding = false;
          this.selectedActPlace = null;
          this.isEnabled = false;
          this.actPlacesForm.disable();
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al agregar el lugar de acto' });
        }
      });
    }
  }

  onDelete(){

  }

  onCancel(){
    this.isEnabled = false;
    this.isAdding = false;
    this.selectedActPlace = null;
    this.actPlacesForm.reset();
    this.actPlacesForm.disable();
  }


}

