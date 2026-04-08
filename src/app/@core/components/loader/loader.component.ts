import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-loader',
  imports: [
    CommonModule
  ],
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent implements OnInit, OnDestroy{
 private router = inject(Router);
  private routerSub?: Subscription; // Guardamos la suscripción aquí

  @Input() isLoading: boolean = false;
  @Input() mode: 'window' | 'component' = 'window';

  ngOnInit() {
    // Solo escuchamos al router si es el loader GLOBAL (pantalla completa)
    if (this.mode === 'window') {
      this.listenToRouter();
    }
  }

  private listenToRouter() {
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isLoading = true;
      }
      if (event instanceof NavigationEnd || 
          event instanceof NavigationCancel || 
          event instanceof NavigationError) {
        setTimeout(() => {
          this.isLoading = false;
        }, 600);
      }
    });
  }

  // ¡ESTA ES LA CLAVE!
  ngOnDestroy() {
    if (this.routerSub) {
      this.routerSub.unsubscribe(); // Matamos la suscripción al salir
    }
  }
}
