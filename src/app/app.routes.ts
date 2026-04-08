import { Routes } from '@angular/router';
import { LayoutComponent } from './@core/layout/layout.component';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./@core/auth/login/login.component').then(m => m.LoginComponent),
    },
    {
        path: '',
        component: LayoutComponent,
        children: [
            {
                path: 'home',
                loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
            },
            {
                path: 'clients',
                loadComponent: () => import('./pages/clients/clients.component').then(m => m.ClientsComponent),
            },
            {
                path: 'specialties',
                loadComponent: () => import('./pages/specialities/specialities.component').then(m => m.SpecialitiesComponent),
            },
            {
                path: 'institutions',
                loadComponent: () => import('./pages/institutions/institutions.component').then(m => m.InstitutionsComponent),
            },
            {
                path: 'actPlaces',
                loadComponent: () => import('./pages/act-places/act-places.component').then(m => m.ActPlacesComponent),
            },
            {
                path: 'banks',
                loadComponent: () => import('./pages/banks/banks.component').then(m => m.BanksComponent),
            },
            {
                path: 'actContracts',
                loadComponent: () => import('./pages/act-contract/act-contract.component').then(m => m.ActContractComponent),
            },
            {
                path: 'settings',
                loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
            },
            {
                path: 'users',
                loadComponent: () => import('./pages/users/users.component').then(m => m.UsersComponent),
            }
        ]
    }
];
