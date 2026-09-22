import { Routes } from '@angular/router';
import { LayoutComponent } from './@core/layout/layout.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./@core/auth/login/login.component').then(m => m.LoginComponent),
    title: 'Grados de Venezuela - Iniciar Sesión'
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
        title: 'Grados de Venezuela - Inicio'
      },
      {
        path: 'clients',
        loadComponent: () => import('./pages/clients/clients.component').then(m => m.ClientsComponent),
        title: 'Grados de Venezuela - Clientes'
      },
      {
        path: 'specialties',
        loadComponent: () => import('./pages/specialities/specialities.component').then(m => m.SpecialitiesComponent),
        title: 'Grados de Venezuela - Especialidades'
      },
      {
        path: 'institutions',
        loadComponent: () => import('./pages/institutions/institutions.component').then(m => m.InstitutionsComponent),
        title: 'Grados de Venezuela - Instituciones'
      },
      {
        path: 'actPlaces',
        loadComponent: () => import('./pages/act-places/act-places.component').then(m => m.ActPlacesComponent),
        title: 'Grados de Venezuela - Lugares de Acto'
      },
      {
        path: 'banks',
        loadComponent: () => import('./pages/banks/banks.component').then(m => m.BanksComponent),
        title: 'Grados de Venezuela - Bancos'
      },
      {
        path: 'paymentMethods',
        loadComponent: () => import('./pages/payment-methods/payment-methods.component').then(m => m.PaymentMethodsComponent),
        title: 'Grados de Venezuela - Métodos de Pago'
      },
      {
        path: 'actContracts',
        loadComponent: () => import('./pages/act-contract/act-contract.component').then(m => m.ActContractComponent),
        title: 'Grados de Venezuela - Contratos de Acto'
      },
      {
        path: 'ringContracts',
        loadComponent: () => import('./pages/ring-contract/ring-contract.component').then(m => m.RingContractComponent),
        title: 'Grados de Venezuela - Contratos de Anillo'
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
        title: 'Grados de Venezuela - Configuración'
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent),
        title: 'Grados de Venezuela - Usuarios'
      },
      {
        path: 'audit',
        loadComponent: () => import('./pages/audits/audits.component').then(m => m.AuditsComponent),
        title: 'Grados de Venezuela - Auditoría'
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];