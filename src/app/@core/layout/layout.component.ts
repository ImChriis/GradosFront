import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MenubarModule } from 'primeng/menubar';
import { ReportInstitutionsComponent } from '../../shared/components/modals/report-institutions/report-institutions.component';
import { ReportSpecialitiesComponent } from '../../shared/components/modals/report-specialities/report-specialities.component';
import { ReportActPlacesComponent } from '../../shared/components/modals/report-act-places/report-act-places.component';
import { ReportClientsComponent } from '../../shared/components/modals/report-clients/report-clients.component';
import { ReportContractsStatusComponent } from '../../shared/components/modals/report-contracts-status/report-contracts-status.component';
import { ReportRingExpiringComponent } from '../../shared/components/modals/report-ring-expiring/report-ring-expiring.component';
import { AboutUsComponent } from '../../shared/components/modals/about-us/about-us.component';
import { ReportActListComponent } from '../../shared/components/modals/report-act-list/report-act-list.component';
import { GenerateClosingComponent } from '../../shared/components/modals/generate-closing/generate-closing.component';
import { ReportReceiptsComponent } from '../../shared/components/modals/report-receipts/report-receipts.component';
import { ReportGraduatesActComponent } from '../../shared/components/modals/report-graduates-act/report-graduates-act.component';
import { ReportContractDataComponent } from '../../shared/components/modals/report-contract-data/report-contract-data.component';
import { AuthService } from '../services/auth.service';
import { ConfirmLogOutComponent } from '../../shared/components/modals/confirm-log-out/confirm-log-out.component';


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
  private authService = inject(AuthService);
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
            icon: 'emoji-menu emoji-home'
          },
          {
            separator: true
          },
          {
            label: 'Clientes',
            routerLink: '/clients',
            icon: 'emoji-menu emoji-user'
          },
          {
            label: 'Especialidades',
            routerLink: '/specialties',
            icon: 'emoji-menu emoji-briefcase'
          },
          {
            label: 'Instituciones',
            routerLink: '/institutions',
            icon: 'emoji-menu emoji-building'
          },
          {
            label: 'Lugar de Actos',
            routerLink: '/actPlaces',
            icon: 'emoji-menu emoji-marker'
          },
          {
            label: 'Bancos',
            routerLink: '/banks',
            icon: 'emoji-menu emoji-bank'
          },
          {
            label: 'Métodos de Pago',
            routerLink: '/paymentMethods',
            icon: 'emoji-menu emoji-card'
          },
          {
            separator: true
          },
          {
            label: 'Cerrar Sesión',
            command: () => this.logout(),
            icon: 'emoji-menu emoji-exit',
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
                routerLink: '/ringContracts',
                icon: 'emoji-menu emoji-ring'
              },
              {
                separator: true
              },
              {
                label: 'Actos de Grado',
                routerLink: '/actContracts',
                icon: 'emoji-menu emoji-graduation'
              }
            ]
          },
          {
            separator: true
          },
          {
            label: 'Generar Cierre',
            items: [
              {
                label: 'Cierre X',
                command: () => this.openModal(GenerateClosingComponent, 'Generar Cierre X', '30%', { tipo: 'X' })
              },
              {
                label: 'Cierre Z',
                command: () => this.openModal(GenerateClosingComponent, 'Generar Cierre Z', '30%', { tipo: 'Z' })
              }
            ]
          },
          // {
          //   label: 'Anular Recibos',
          //   items: [

          //   ]
          // },
          // {
          //   label: 'Reclamos y Servicios',
          // },
          // {
          //   separator: true
          // },
      
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
                label: 'Por Estatus',
                command: () => this.openModal(ReportContractsStatusComponent, 'Reporte de Contratos por Estatus', '30%')
              },
              {
                label: 'Datos de un contrato',
                command: () => this.openModal(ReportContractDataComponent, 'Datos de un Contrato', '30%')
              },
              {
                label: 'Lista de Anillos Prox. a Vencer Solicitud',
                command: () => this.openModal(ReportRingExpiringComponent, 'Anillos Próximos a Vencer Solicitud', '30%')
              }
            ]
          },
          {
            label: 'Recibos',
            items: [
              {
                label: 'En Rango de fechas',
                command: () => this.openModal(ReportReceiptsComponent, 'Recibos en Rango de Fechas', '60%', { tipo: 'RANGO' })
              },
              {
                label: 'Impresión de Recibos',
                command: () => this.openModal(ReportReceiptsComponent, 'Impresión de Recibos', '30%', { tipo: 'NUMERO' })
              }
            ]
          },
          {
            separator: true
          },
          // {
          //   label: 'Cierre Diario'
          // },
          {
            label: 'Exportar Lista Acto',
            command:  () => this.openModal(ReportActListComponent, 'Reporte Exportar Lista Acto', '30%')
          },
          {
            label: 'Graduandos para Acto',
            command: () => this.openModal(ReportGraduatesActComponent, 'Reporte de Graduandos por Acto', '30%')
          }
        ],

      },
      {
        label: 'Herramientas',
        items: [
          {
            label: 'Usuarios',
            routerLink: '/users',
            icon: 'emoji-menu emoji-users'
          },
          {
            separator: true
          },
          {
            label: 'Auditoría',
            routerLink: '/audit',
            icon: 'emoji-menu emoji-clipboard',
            visible: this.role === 'Master'
          },
          {
            separator: true,
            visible: this.role === 'Master'
          },
          {
            label: 'Opciones',
            routerLink: '/settings',
            icon: 'emoji-menu emoji-settings'
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

  openModal(component: any, title: string, width: string, data?: any){
    this.ref = this.dialogService.open(component, {
            header: title,
            width: width,
            data,
            modal: true,
            closable: true,
            breakpoints: {
              '960px': '90%',
              '640px': '100%'
            }
    });
  }

  logout(){
    this.ref = this.dialogService.open(ConfirmLogOutComponent, {
      header: 'Confirmar Cierre de Sesión',
      width: '30%',
      modal: true,
      closable: false
    });
  }
}
