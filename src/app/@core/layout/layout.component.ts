import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { last } from 'rxjs';

@Component({
  selector: 'app-layout',
  imports: [
    MenubarModule,
    RouterOutlet,
    RouterLink
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit{
  private router = inject(Router);

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
            routerLink: '/clients',
            icon: 'pi pi-user'
          },
          {
            label: 'Especialidades',
            routerLink: '/specialties',
            icon: 'pi pi-briefcase'
          },
          {
            label: 'Instituciones',
            routerLink: '/institutions',
            icon: 'pi pi-building'
          },
          {
            label: 'Lugar de Actos',
            routerLink: '/actPlaces',
            icon: 'pi pi-home'
          },
          {
            label: 'Bancos',
            routerLink: '/banks',
            icon: 'pi pi-money-bill'
          },
          {
            separator: true
          },
          {
            label: 'Cerrar Sesión',
            command: () => this.logout(),
            icon: 'pi pi-sign-out',
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
                label: 'Actos de Grado',
                routerLink: '/actContracts'
              }
            ]
          },
          {
            separator: true
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
            separator: true
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
            separator: true
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
            separator: true
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

  logout(){
    localStorage.removeItem('User');
    this.router.navigateByUrl('/');
  }
}
