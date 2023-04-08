import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { ReactiveFormsModule } from '@angular/forms';


import { AppComponent } from './app.component';
import { EmpleadosComponent } from './pruebas/empleados/empleados.component';
import { EmpleadoComponent } from './pruebas/empleado/empleado.component';
import { NavbarComponent } from './navbar/navbar.component';
import { ContPrincipalComponent } from './cont-principal/cont-principal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckbox, MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { ListaPersonajesComponent } from './lista-personajes/lista-personajes.component';
import { HttpClientModule } from '@angular/common/http';
import { DataServices } from './data.services';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HijoEmpleadoComponent } from './pruebas/empleado/hijo-empleado/hijo-empleado.component';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { SesionDialogComponent } from './@Utilidades/sesion-dialog/sesion-dialog.component';
import { TabControlComponent } from './tab-control/tab-control.component';

@NgModule({
    declarations: [
        AppComponent,
        EmpleadosComponent,
        EmpleadoComponent,
        NavbarComponent,
        ContPrincipalComponent,
        ListaPersonajesComponent,
        HijoEmpleadoComponent,
        SesionDialogComponent,
        TabControlComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        BrowserAnimationsModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatButtonModule,
        MatSelectModule,
        MatCheckboxModule,
        MatSlideToggleModule,
        MatExpansionModule,
        MatCardModule,
        MatTabsModule,
        MatTableModule,
        MatMenuModule,
        MatChipsModule,
        MatDialogModule,
        MatSortModule,
        MatPaginatorModule,
        HttpClientModule,
        NgbModule,
        ReactiveFormsModule,
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideAuth(() => getAuth()),
        provideDatabase(() => getDatabase())
    ],
    entryComponents: [
        SesionDialogComponent,
    ],
    providers: [DataServices],
    bootstrap: [AppComponent]
})
export class AppModule { }
