import { Component, inject } from '@angular/core';
import { AuthService } from '../../../../@core/services/auth.service';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-confirm-log-out',
  imports: [],
  templateUrl: './confirm-log-out.component.html',
  styleUrl: './confirm-log-out.component.scss'
})
export class ConfirmLogOutComponent {
  private authService = inject(AuthService);
  private ref = inject(DynamicDialogRef, { optional: true });

  message: string = '¿Está seguro que desea cerrar sesión?';

  confirm() {
    this.authService.logout();
    this.ref?.close();
  }

  cancel(){
    this.ref?.close();
  }
}
