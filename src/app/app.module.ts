import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AngularFireModule } from '@angular/fire/compat';
import { initializeApp,provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';


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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { FormsModule } from '@angular/forms';
import { ListaPersonajesComponent } from './lista-personajes/lista-personajes.component';
import { HttpClientModule } from '@angular/common/http';
import { DataServices } from './data.services';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HijoEmpleadoComponent } from './pruebas/empleado/hijo-empleado/hijo-empleado.component';
import { provideAuth,getAuth } from '@angular/fire/auth';
import { provideDatabase,getDatabase } from '@angular/fire/database';

@NgModule({
  declarations: [
    AppComponent,
    EmpleadosComponent,
    EmpleadoComponent,
    NavbarComponent,
    ContPrincipalComponent,
    ListaPersonajesComponent,
    HijoEmpleadoComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    // AngularFireModule.initializeApp(environment.firebase),
    BrowserAnimationsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatExpansionModule,
    MatCardModule,
    MatTabsModule,
    HttpClientModule,
    NgbModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideDatabase(() => getDatabase())
  ],
  providers: [DataServices],
  bootstrap: [AppComponent]
})
export class AppModule { }
