import { Routes } from '@angular/router';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/pages/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { SystemBaseComponent } from './app/components/base-sistema/system-base.component';
import { TemplateBaseComponent } from './app/components/template-base/template-base.component';
import { LoginComponent } from './app/components-publics/auth/login/login.component';
import { authGuard } from './app/core/guards/auth.guard';
import { noAuthGuard } from './app/core/guards/no-auth.guard';
import { menuGuard } from './app/core/guards/menu.guard';
import { AppLayout } from './app/layout/component/app.layout';
import { UsuariosComponent } from './app/pages/usuarios/usuarios';
import { RolesComponent } from './app/pages/roles/roles';
import { MenusComponent } from './app/pages/menus/menus';
import { RecursosComponent } from './app/pages/recursos/recursos';
import { PrivilegiosComponent } from './app/pages/privilegios/privilegios';

export const appRoutes: Routes = [
    {
        path: '',
        component: Landing,
        canActivate: [noAuthGuard],
        pathMatch: 'full'
    },
    {
        path: '',
        component: TemplateBaseComponent,
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', component: Dashboard },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') },
            { path: 'usuarios', component: UsuariosComponent, canActivate: [authGuard, menuGuard] },
            { path: 'roles', component: RolesComponent, canActivate: [authGuard, menuGuard] },
            { path: 'menus', component: MenusComponent, canActivate: [authGuard, menuGuard] },
            { path: 'privilegios', component: PrivilegiosComponent, canActivate: [authGuard, menuGuard] },
            { path: 'recursos', component: RecursosComponent, canActivate: [authGuard, menuGuard] },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ]
    },
    {
        path: 'auth',
        children: [
            { path: 'login', component: LoginComponent, canActivate: [noAuthGuard] },
            { path: '', redirectTo: 'login', pathMatch: 'full' }
        ]
    },
    { path: 'auth/access', loadComponent: () => import('./app/pages/auth/access').then((m) => m.Access) },
    { path: 'auth/error', loadComponent: () => import('./app/pages/auth/error').then((m) => m.Error) },
    {
        path: 'ejemplos',
        canActivate: [authGuard],
        component: AppLayout,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', component: Dashboard },
            { path: 'uikit', loadChildren: () => import('./app/pages/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    { path: 'landing', redirectTo: '/', pathMatch: 'full' },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' }
];
