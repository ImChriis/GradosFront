import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ActsService } from '../../@core/services/acts.service';
import { Observable } from 'rxjs';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ActPlace } from '../../@core/models/act.model';
import { ActPlacesForm } from '../../@core/models/forms/act-form';

@Component({
  selector: 'app-act-places',
  imports: [
    CommonModule,
    TableModule,
    InputTextModule
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
    this.acts$ = this.actsService.getAllActsPlaces();
    this.actPlacesForm.disable();
    this.selectedActPlace = null;
  }

  onSelect(actPlce: ActPlace){
    this.isAdding = true;
    this.isEnabled = true;
    this.selectedActPlace = actPlce;
    this.actPlacesForm.patchValue({
      CoLugar: actPlce.CoLugar,
      TxLugar: actPlce.TxLugar,
      Capacidad: actPlce.Capacidad,
      MaTipoLugar: actPlce.MaTipoLugar,
      Activo: actPlce.Activo,
      CodUser: actPlce.CodUser,
    });

    this.CodLugar = actPlce.CoLugar ;
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
      this.actsService.updateActPlace(this.CodLugar!, this.actPlacesForm.value as ActPlace).subscribe({
        next:(res) => {
          this.messageService.add({ severity: 'success', summary: 'Sucess', detail: 'Lugar de Acto actualizado correctamente' });
           
          setTimeout(() => {
            window.location.reload();
          }, 500);
        },
        error: (err) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar el lugar de acto' });
        }
      })
    }else{
      this.actsService.addActPlace(this.actPlacesForm.value as ActPlace).subscribe({
        next: (res) => {
          this.messageService.add({ severity: 'success', summary: 'Sucess', detail: 'Lugar de Acto agregado correctamente' });
          
          setTimeout(() => {
            window.location.reload();
          }, 500);
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

