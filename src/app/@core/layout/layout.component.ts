import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MenubarModule } from 'primeng/menubar';
import { ReportActPlacesComponent } from '../components/modals/report-act-places/report-act-places.component';

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
  private dialogService = inject(DialogService);
  // private dialogRef = inject(DynamicDialogRef);
  ref!: DynamicDialogRef;

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
              // {
              //   label: 'Anillos',
              // },
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
          // {
          //   label: 'Reclamos y Servicios',
          // },
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
            label: 'Lugares para Actos',
            command: () => this.openModal(ReportActPlacesComponent)
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
            label: 'Usuarios',
            routerLink: '/users'
          },
          {
            label: 'Opciones',
            routerLink: '/settings'
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
            separator: true
          },
          {
            label: 'Manual de Usuario'
          }
        ]
      }
    ]
  }

  openModal(component: any){
    this.ref = this.dialogService.open(component, {
       header: 'Reporte Lugardes de Acto',
            width: '50%',
            modal: true,
            closable: true,
            breakpoints: {
              '960px': '90%',
              '640px': '100%'
            }
    })
  }

  logout(){
    localStorage.removeItem('User');
    this.router.navigateByUrl('/');
  }
}
