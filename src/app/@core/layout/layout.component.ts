import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';

@Component({
  selector: 'app-layout',
  imports: [
    MenubarModule,
    RouterOutlet
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit{
  items: MenuItem[]| undefined;

  ngOnInit() {
    this.items = [
      {
        label: 'Archivo'
      },
      {
        label: 'Procesos'
      },
      {
        label: 'Ver'
      },
      {
        label: 'Reportes',
      },
      {
        label: 'Herramientas',
      },
      {
        label: 'Ayuda'
      }
    ]
  }
}
