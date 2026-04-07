import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, ToastModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit{
private router = inject(Router);
  isLoading = false; // Empezamos en false o true según prefieras

  constructor() {
    this.router.events.subscribe(event => {
      // 1. Cuando empieza la navegación, mostramos el loader
      if (event instanceof NavigationStart) {
        this.isLoading = true;
      }

      // 2. Cuando termina (con éxito, error o cancelación), lo quitamos
      if (event instanceof NavigationEnd || 
          event instanceof NavigationCancel || 
          event instanceof NavigationError) {
        
        // Le damos un pequeño respiro (500ms o 1s) para que el usuario 
        // vea el logo, o 0ms si quieres que sea instantáneo
        setTimeout(() => {
          this.isLoading = false;
          this.handleScroll(); // Ejecutamos el scroll tras apagar el loader
        }, 600); 
      }
    });
  }

  ngOnInit() {
    // La carga inicial ya está cubierta por el NavigationStart del constructor
  }

  private handleScroll() {
    const tree = this.router.parseUrl(this.router.url);
    const fragment = tree.fragment;
    if (fragment) {
      setTimeout(() => {
        const el = document.getElementById(fragment);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }
}
