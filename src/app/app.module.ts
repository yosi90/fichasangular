import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { ReactiveFormsModule } from '@angular/forms';


import { AppComponent } from './app.component';
import { NavbarComponent } from './components/base/navbar/navbar.component';
import { ContPrincipalComponent } from './components/base/cont-principal/cont-principal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { OverlayModule } from '@angular/cdk/overlay';

import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ListaPersonajesComponent } from './components/base/lista-personajes/lista-personajes.component';
import { HttpClientModule } from '@angular/common/http';
import { DataServices } from './data.services';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { SesionDialogComponent } from './components/sesion-dialog/sesion-dialog.component';
import { TabControlComponent } from './components/base/tab-control/tab-control.component';
import { BaseMenuResponsiveComponent } from './components/base/responsive-base/responsive-base.component';
import { BaseMenuComponent } from './components/base/base-menu/base-menu.component';
import { AdminPanelComponent } from './components/base/admin-panel/admin-panel.component';
import { DetallesPersonajeComponent } from './components/detalles/detalles-personaje/detalles-personaje.component';
import { NuevoPersonajeComponent } from './components/nuevo-personaje/nuevo-personaje.component';
import { DetallesRazaComponent } from './components/detalles/detalles-raza/detalles-raza.component';
import { ListadoComponent } from './components/shared/listado/listado.component';
import { ListadoRazasComponent } from './components/shared/listado-razas/listado-razas.component';
import { ListadoConjurosComponent } from './components/shared/listado-conjuros/listado-conjuros.component';
import { DetallesConjuroComponent } from './components/detalles/detalles-conjuro/detalles-conjuro.component';
import { ListadoTiposCriaturaComponent } from './components/shared/listado-tipos-criatura/listado-tipos-criatura.component';
import { DetallesTipoCriaturaComponent } from './components/detalles/detalles-tipo-criatura/detalles-tipo-criatura.component';
import { DetallesRasgoRacialComponent } from './components/detalles/detalles-rasgo/detalles-rasgo.component';
import { ListadoRasgoRacialComponent } from './components/shared/listado-rasgo/listado-rasgo.component';
import { ListadoDotesComponent } from './components/shared/listado-dotes/listado-dotes.component';
import { DetallesDoteComponent } from './components/detalles/detalles-dote/detalles-dote.component';
import { ListadoClasesComponent } from './components/shared/listado-clases/listado-clases.component';
import { DetallesClaseComponent } from './components/detalles/detalles-clase/detalles-clase.component';
import { ListadoEspecialesComponent } from './components/shared/listado-especiales/listado-especiales.component';
import { DetallesEspecialComponent } from './components/detalles/detalles-especial/detalles-especial.component';
import { ListadoRacialesComponent } from './components/shared/listado-raciales/listado-raciales.component';
import { DetallesRacialComponent } from './components/detalles/detalles-racial/detalles-racial.component';
import { GeneradorCaracteristicasModalComponent } from './components/nuevo-personaje/generador-caracteristicas-modal/generador-caracteristicas-modal.component';
import { DetallesManualComponent } from './components/detalles/detalles-manual/detalles-manual.component';
import { ListadoPlantillasComponent } from './components/shared/listado-plantillas/listado-plantillas.component';
import { DetallesPlantillaComponent } from './components/detalles/detalles-plantilla/detalles-plantilla.component';
import { SelectorIdiomaModalComponent } from './components/nuevo-personaje/selector-idioma-modal/selector-idioma-modal.component';
import { SelectorRazaBaseModalComponent } from './components/nuevo-personaje/selector-raza-base-modal/selector-raza-base-modal.component';
import { SelectorRacialesOpcionalesModalComponent } from './components/nuevo-personaje/selector-raciales-opcionales-modal/selector-raciales-opcionales-modal.component';
import { VentanaDetalleFlotanteComponent } from './components/nuevo-personaje/ventana-detalle-flotante/ventana-detalle-flotante.component';
import { ListadoSubtiposComponent } from './components/shared/listado-subtipos/listado-subtipos.component';
import { DetallesSubtipoComponent } from './components/detalles/detalles-subtipo/detalles-subtipo.component';

@NgModule({
    declarations: [
        AppComponent,
        NavbarComponent,
        ContPrincipalComponent,
        ListaPersonajesComponent,
        SesionDialogComponent,
        TabControlComponent,
        BaseMenuResponsiveComponent,
        BaseMenuComponent,
        AdminPanelComponent,
        DetallesPersonajeComponent,
        NuevoPersonajeComponent,
        DetallesRazaComponent,
        ListadoComponent,
        ListadoRazasComponent,
        ListadoConjurosComponent,
        DetallesConjuroComponent,
        ListadoTiposCriaturaComponent,
        DetallesTipoCriaturaComponent,
        DetallesRasgoRacialComponent,
        ListadoRasgoRacialComponent,
        ListadoDotesComponent,
        DetallesDoteComponent,
        ListadoClasesComponent,
        DetallesClaseComponent,
        ListadoEspecialesComponent,
        DetallesEspecialComponent,
        ListadoRacialesComponent,
        DetallesRacialComponent,
        GeneradorCaracteristicasModalComponent,
        SelectorIdiomaModalComponent,
        SelectorRazaBaseModalComponent,
        SelectorRacialesOpcionalesModalComponent,
        VentanaDetalleFlotanteComponent,
        DetallesManualComponent,
        ListadoPlantillasComponent,
        DetallesPlantillaComponent,
        ListadoSubtiposComponent,
        DetallesSubtipoComponent,
    ],
    imports: [
        BrowserModule,
        FormsModule,
        BrowserAnimationsModule,
        OverlayModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatButtonModule,
        MatSelectModule,
        MatAutocompleteModule,
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
        MatSidenavModule,
        MatTooltipModule,
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
