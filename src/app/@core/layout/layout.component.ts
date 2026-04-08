import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MenubarModule } from 'primeng/menubar';
import { ReportInstitutionsComponent } from '../../shared/components/modals/report-institutions/report-institutions.component';
import { ReportSpecialitiesComponent } from '../../shared/components/modals/report-specialities/report-specialities.component';
import { ReportActPlacesComponent } from '../../shared/components/modals/report-act-places/report-act-places.component';
import { ReportClientsComponent } from '../../shared/components/modals/report-clients/report-clients.component';
import { AboutUsComponent } from '../../shared/components/modals/about-us/about-us.component';


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
            label: 'Inicio',
            routerLink: '/home',
            icon: 'pi pi-home'
          },
          {
            separator: true
          },
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
            icon: 'pi pi-map-marker'
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
            label: 'Especialidades',
            command: () => this.openModal(ReportSpecialitiesComponent, 'Reporte de Especialidades', '30%')
          },
          {
            label: 'Institutos',
            command: () => this.openModal(ReportInstitutionsComponent, 'Reporte de Instituciones', '30%')
          },
          {
            label: 'Lugares para Actos',
            command: () => this.openModal(ReportActPlacesComponent, 'Reporte de Lugares para Actos', '30%')
          },
          {
            separator: true
          },
          {
            label: 'Clientes',
            items: [
              {
                label: 'Listado de Clientes',
                command: () => this.openModal(ReportClientsComponent, 'Reporte de Clientes', '30%')
              }
            ]
          },
          {
            label: 'Contratos',
            items: [
              {
                label: 'Por Estatus'
              },
              {
                label: 'Datos de un contrato'
              },
              {
                label: 'Lista de Anillos Prox. a Vencer Solicitud'
              }
            ]
          },
          {
            label: 'Recibos',
            items: [
              {
                label: 'En Rango de fechas'
              },
              {
                label: 'Impresión de Recibos'
              }
            ]
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
            separator: true
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
            label: 'Acerca de',
            command: () => this.openModal(AboutUsComponent, "Acerca de Grados", "50%")
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

  openModal(component: any, title: string, width: string){
    this.ref = this.dialogService.open(component, {
            header: title,
            width: width,
            modal: true,
            closable: true,
            breakpoints: {
              '960px': '90%',
              '640px': '100%'
            }
    });
  }

  logout(){
    localStorage.removeItem('User');
    this.router.navigateByUrl('/');
  }
}
