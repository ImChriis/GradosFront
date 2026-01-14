import { Routes } from '@angular/router';
import { LayoutComponent } from './@core/layout/layout.component';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./@core/auth/login/login.component').then(m => m.LoginComponent),
        title: 'Login',
    },
    {
        path: '',
        component: LayoutComponent,
        children: [
            {
                path: 'home',
                loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
                title: 'Home',
            },
            {
                path: 'clients',
                loadComponent: () => import('./pages/clients/clients.component').then(m => m.ClientsComponent),
                title: 'Grados - Clientes',
            },
            {
                path: 'specialties',
                loadComponent: () => import('./pages/specialities/specialities.component').then(m => m.SpecialitiesComponent),
                title: 'Grados - Especialidades',
            },
            {
                path: 'institutions',
                loadComponent: () => import('./pages/institutions/institutions.component').then(m => m.InstitutionsComponent),
                title: 'Grados - Instituciones',
            },
            {
                path: 'actPlaces',
                loadComponent: () => import('./pages/act-places/act-places.component').then(m => m.ActPlacesComponent),
                title: 'Grados - Lugares de Actos',
            },
            {
                path: 'banks',
                loadComponent: () => import('./pages/banks/banks.component').then(m => m.BanksComponent),
                title: 'Grados - Bancos',
            }

        ]
    }
];
