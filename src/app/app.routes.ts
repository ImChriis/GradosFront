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
            }
        ]
    }
];
