import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginAlumnoComponent } from './pages/login-alumno/login-alumno.component';
import { LoginServiciosComponent } from './pages/login-servicios/login-servicios.component';
import { PortalAlumnoComponent } from './pages/portal-alumno/portal-alumno.component';
import { PortalAlumnoReferenciasComponent } from './pages/portal-alumno-referencias/portal-alumno-referencias.component';

export const routes: Routes = [
    {
        path:"",
        component: HomeComponent
    },

    {
        path:"loginAlumno",
        component: LoginAlumnoComponent
    },

    {
        path:"loginServicios",
        component: LoginServiciosComponent
    },

    {
        path:"portalAlumno",
        component: PortalAlumnoComponent
    },

    {
        path:"portalAlumnoReferencias",
        component: PortalAlumnoReferenciasComponent
    }
];
