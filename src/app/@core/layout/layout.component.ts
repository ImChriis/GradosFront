import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { last } from 'rxjs';

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
  user!: string;
  role!: string;

  ngOnInit() {
    const user = localStorage.getItem('User');
    if(user){
      const parsedUser = JSON.parse(user);
      this.user = parsedUser.user.usuario;
      this.role = parsedUser.user.maTipoUsr;
    }

    this.items = [
      {
        label: 'Archivo',
        items: [
          {
            label: 'Clientes',
            routerLink: '/clients'
          },
          {
            label: 'Especialidades',
            routerLink: '/specialties'
          },
          {
            label: 'Instituciones',
            routerLink: '/institutions'
          },
          {
            label: 'Lugar de Actos',
            routerLink: '/actPlaces'
          },
          {
            label: 'Bancos',
            routerLink: '/banks'
          },
          {
            label: 'Cerrar Sesión',
          }
        ]
      },
      {
        label: 'Procesos',
        items: [
          {
            label: 'Contratos',
            items: [
              {
                label: 'Anillos',
              },
              {
                label: 'Actos de Grado'
              }
            ]
          },
          {
            label: 'Anular Recibos',
            items: [

            ]
          },
          {
            label: 'Reclamos y Servicios',
          },
          {
            label: 'Generar Cierre'
          }
        ]
      },
      {
        label: 'Reportes',
        items: [
          {
            label: 'Especialidades'
          },
          {
            label: 'Institutos'
          },
          {
            label: 'Lugares para Actos'
          },
          {
            label: 'Clientes'
          },
          {
            label: 'Contratos'
          },
          {
            label: 'Recibos'
          },
          {
            label: 'Cierre Diario'
          },
          {
            label: 'Exportar Lista Acto'
          },
          {
            label: 'Graduandos para Acto'
          }
        ],

      },
      {
        label: 'Herramientas',
        items: [
          {
            label: 'Usuarios'
          },
          {
            label: 'Opciones'
          }
        ]
      },
      {
        label: 'Ayuda',
        items: [
          {
            label: 'Acerca de'
          },
          {
            label: 'Manual de Usuario'
          }
        ]
      }
    ]
  }
}
