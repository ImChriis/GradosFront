import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ActsService } from '../../@core/services/acts.service';
import { Observable } from 'rxjs';

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
export class ActPlacesComponent {
  private actsService = inject(ActsService);
  isAdding = false;
  isEnabled = false;
  selectedAct = false;
  acts$!: Observable<any[]>;

  onSelect(){

  }

  onAdd(){

  }

  onSave(){

  }

  onDelete(){

  }

  onCancel(){

  }


}

