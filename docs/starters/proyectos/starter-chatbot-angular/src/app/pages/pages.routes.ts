import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';
import { UsuariosComponent } from './usuarios/usuarios';
import { RolesComponent } from './roles/roles';
import { MenusComponent } from './menus/menus';
import { CatalogosComponent } from './catalogos/catalogos';
import { PrivilegiosComponent } from './privilegios/privilegios';
import { RecursosComponent } from './recursos/recursos';

export default [
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'empty', component: Empty },
    { path: 'usuarios', component: UsuariosComponent },
    { path: 'roles', component: RolesComponent },
    { path: 'menus', component: MenusComponent },
    { path: 'catalogos', component: CatalogosComponent },
    { path: 'privilegios', component: PrivilegiosComponent },
    { path: 'recursos', component: RecursosComponent },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
