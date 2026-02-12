import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ActsService } from '../../@core/services/acts.service';
import { Observable, startWith, switchMap } from 'rxjs';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ɵInternalFormsSharedModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ActPlace } from '../../@core/models/act.model';
import { ActPlacesForm } from '../../@core/models/forms/act-form';
import { UppercaseDirective } from '../../@core/directives/uppercase.directive';

@Component({
  selector: 'app-act-places',
  imports: [
    CommonModule,
    TableModule,
    InputTextModule,
    ɵInternalFormsSharedModule,
    ReactiveFormsModule,
    UppercaseDirective
],
  templateUrl: './act-places.component.html',
  styleUrl: './act-places.component.scss'
})
export class ActPlacesComponent implements OnInit{
  private actsService = inject(ActsService);
  private messageService = inject(MessageService);
  private fb = inject(FormBuilder);
  isAdding = false;
  isEnabled = false;
  selectedActPlace: ActPlace | null = null;
  acts$!: Observable<ActPlace[]>;
  CodLugar!: number | null;

  actPlacesForm: FormGroup<ActPlacesForm> = this.fb.group({
    CoLugar: new FormControl<number | null>(null),
    TxLugar: new FormControl<string | null>(null),
    Capacidad: new FormControl<number | null>(null),
    MaTipoLugar: new FormControl<number | null>(null),
    Activo: new FormControl<number | null>(null),
    CodUser: new FormControl<number | null>(null),
  })

  ngOnInit(): void {
    this.acts$ = this.actsService.refreshObservable$.pipe(
      startWith(null),
      switchMap(() => {
        return this.actsService.getAllActsPlaces();
      })
    )
    
    // this.actPlacesForm.disable();
    this.selectedActPlace = null;
  }

  onSelect(actPlace: ActPlace){
    this.isAdding = false;
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
        'input[formcontrolname="nucedula"], textarea[formcontrolname="nucedula"]'
      );
      el?.focus();
    }, 0);
  }

  onSave(){
    if(this.selectedActPlace){
      console.log(this.CodLugar)
      console.log('Updating Act Place:', this.actPlacesForm.value);

      this.actsService.updateActPlace(this.CodLugar!, this.actPlacesForm.value as ActPlace).subscribe({
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
      this.actsService.addActPlace(this.actPlacesForm.value as ActPlace).subscribe({
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

