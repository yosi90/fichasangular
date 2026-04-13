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
import { MatRadioModule } from '@angular/material/radio';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatStepperModule } from '@angular/material/stepper';
import { FormsModule } from '@angular/forms';
import { ListaPersonajesComponent } from './components/base/lista-personajes/lista-personajes.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { DataServices } from './data.services';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideDatabase, getDatabase } from '@angular/fire/database';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { forceWebSockets } from 'firebase/database';
import { getApp } from 'firebase/app';
import { SesionDialogComponent } from './components/sesion-dialog/sesion-dialog.component';
import { TabControlComponent } from './components/base/tab-control/tab-control.component';
import { BaseMenuComponent } from './components/base/base-menu/base-menu.component';
import { AdminPanelComponent } from './components/base/admin-panel/admin-panel.component';
import { AdminUserPermissionsModalComponent } from './components/base/admin-panel/admin-user-permissions-modal.component';
import { AdminUserModerationHistoryModalComponent } from './components/base/admin-panel/admin-user-moderation-history-modal.component';
import { AdminUserModerationHistoryViewComponent } from './components/base/admin-panel/admin-user-moderation-history-view.component';
import { AdminUserSanctionModalComponent } from './components/base/admin-panel/admin-user-sanction-modal.component';
import { AdminModerationCaseModalComponent } from './components/base/admin-panel/admin-moderation-case-modal.component';
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
import { SelectorDominiosModalComponent } from './components/nuevo-personaje/selector-dominios-modal/selector-dominios-modal.component';
import { SelectorRazaBaseModalComponent } from './components/nuevo-personaje/selector-raza-base-modal/selector-raza-base-modal.component';
import { SelectorRacialesOpcionalesModalComponent } from './components/nuevo-personaje/selector-raciales-opcionales-modal/selector-raciales-opcionales-modal.component';
import { SelectorAumentosCaracteristicaModalComponent } from './components/nuevo-personaje/selector-aumentos-caracteristica-modal/selector-aumentos-caracteristica-modal.component';
import { SelectorEspecialidadMagicaModalComponent } from './components/nuevo-personaje/selector-especialidad-magica-modal/selector-especialidad-magica-modal.component';
import { SelectorDotesModalComponent } from './components/nuevo-personaje/selector-dotes-modal/selector-dotes-modal.component';
import { SelectorEnemigoPredilectoModalComponent } from './components/nuevo-personaje/selector-enemigo-predilecto-modal/selector-enemigo-predilecto-modal.component';
import { SelectorExtraHabilidadModalComponent } from './components/nuevo-personaje/selector-extra-habilidad-modal/selector-extra-habilidad-modal.component';
import { SelectorFamiliarModalComponent } from './components/nuevo-personaje/selector-familiar-modal/selector-familiar-modal.component';
import { SelectorCompaneroModalComponent } from './components/nuevo-personaje/selector-companero-modal/selector-companero-modal.component';
import { SelectorPuntosGolpeModalComponent } from './components/nuevo-personaje/selector-puntos-golpe-modal/selector-puntos-golpe-modal.component';
import { SelectorVisibilidadPersonajeModalComponent } from './components/nuevo-personaje/selector-visibilidad-personaje-modal/selector-visibilidad-personaje-modal.component';
import { VentanaDetalleFlotanteComponent } from './components/nuevo-personaje/ventana-detalle-flotante/ventana-detalle-flotante.component';
import { InformacionBasicosModalComponent } from './components/nuevo-personaje/informacion-basicos-modal/informacion-basicos-modal.component';
import { SelectorClaseOpcionalModalComponent } from './components/nuevo-personaje/selector-clase-opcional-modal/selector-clase-opcional-modal.component';
import { ListadoSubtiposComponent } from './components/shared/listado-subtipos/listado-subtipos.component';
import { DetallesSubtipoComponent } from './components/detalles/detalles-subtipo/detalles-subtipo.component';
import { DetallesVentajaComponent } from './components/detalles/detalles-ventaja/detalles-ventaja.component';
import { ListadoVentajasComponent } from './components/shared/listado-ventajas/listado-ventajas.component';
import { ListadoMonstruosComponent } from './components/shared/listado-monstruos/listado-monstruos.component';
import { DetallesMonstruoComponent } from './components/detalles/detalles-monstruo/detalles-monstruo.component';
import { FichasDescargaToastHostComponent } from './components/shared/fichas-descarga-toast-host/fichas-descarga-toast-host.component';
import { AppToastHostComponent } from './components/shared/app-toast-host/app-toast-host.component';
import { NuevaDoteComponent } from './components/shared/nueva-dote/nueva-dote.component';
import { NuevaConjuroComponent } from './components/shared/nueva-conjuro/nueva-conjuro.component';
import { PrerrequisitoCatalogEditorComponent } from './components/shared/prerrequisito-editor/prerrequisito-catalog-editor.component';
import { PrerrequisitoCatalogValueEditorComponent } from './components/shared/prerrequisito-editor/prerrequisito-catalog-value-editor.component';
import { PrerrequisitoEditorHostComponent } from './components/shared/prerrequisito-editor/prerrequisito-editor-host.component';
import { PrerrequisitoFlagEditorComponent } from './components/shared/prerrequisito-editor/prerrequisito-flag-editor.component';
import { PrerrequisitoSpecialEditorComponent } from './components/shared/prerrequisito-editor/prerrequisito-special-editor.component';
import { PrerrequisitoValueEditorComponent } from './components/shared/prerrequisito-editor/prerrequisito-value-editor.component';
import { DetallesArmaComponent } from './components/detalles/detalles-arma/detalles-arma.component';
import { DetallesArmaduraComponent } from './components/detalles/detalles-armadura/detalles-armadura.component';
import { ListadoArmasComponent } from './components/shared/listado-armas/listado-armas.component';
import { ListadoArmadurasComponent } from './components/shared/listado-armaduras/listado-armaduras.component';
import { DetallesDeidadComponent } from './components/detalles/detalles-deidad/detalles-deidad.component';
import { ListadoDeidadesComponent } from './components/shared/listado-deidades/listado-deidades.component';
import { UserProfileComponent } from './components/base/user-profile/user-profile.component';
import { PublicUserProfileComponent } from './components/base/public-user-profile/public-user-profile.component';
import { SocialHubComponent } from './components/base/social-hub/social-hub.component';
import { SocialActivitySectionComponent } from './components/base/social-hub/social-activity-section.component';
import { SocialCommunitySectionComponent } from './components/base/social-hub/social-community-section.component';
import { SocialLfgSectionComponent } from './components/base/social-hub/social-lfg-section.component';
import { HelpRoadmapComponent } from './components/base/help-roadmap/help-roadmap.component';
import { HelpLegalComponent } from './components/base/help-legal/help-legal.component';
import { HelpFeedbackComponent } from './components/base/help-feedback/help-feedback.component';
import { HelpUsageAboutComponent } from './components/base/help-usage-about/help-usage-about.component';
import { AccountRestrictionTabComponent } from './components/base/account-restriction-tab/account-restriction-tab.component';
import { ChatFloatingConversationWindowComponent } from './components/chat-floating/chat-floating-conversation-window.component';
import { ChatFloatingHostComponent } from './components/chat-floating/chat-floating-host.component';
import { ChatFloatingListWindowComponent } from './components/chat-floating/chat-floating-list-window.component';
import { CloseFilterMenuOnMouseleaveDirective } from './directives/close-filter-menu-on-mouseleave.directive';

@NgModule({
    declarations: [
        AppComponent,
        NavbarComponent,
        ContPrincipalComponent,
        ListaPersonajesComponent,
        SesionDialogComponent,
        TabControlComponent,
        BaseMenuComponent,
        UserProfileComponent,
        PublicUserProfileComponent,
        SocialHubComponent,
        SocialCommunitySectionComponent,
        SocialActivitySectionComponent,
        SocialLfgSectionComponent,
        HelpRoadmapComponent,
        HelpLegalComponent,
        HelpFeedbackComponent,
        HelpUsageAboutComponent,
        AccountRestrictionTabComponent,
        ChatFloatingHostComponent,
        ChatFloatingListWindowComponent,
        ChatFloatingConversationWindowComponent,
        CloseFilterMenuOnMouseleaveDirective,
        AdminPanelComponent,
        AdminUserPermissionsModalComponent,
        AdminUserModerationHistoryModalComponent,
        AdminUserModerationHistoryViewComponent,
        AdminUserSanctionModalComponent,
        AdminModerationCaseModalComponent,
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
        SelectorDominiosModalComponent,
        SelectorAumentosCaracteristicaModalComponent,
        SelectorEspecialidadMagicaModalComponent,
        SelectorDotesModalComponent,
        SelectorEnemigoPredilectoModalComponent,
        SelectorExtraHabilidadModalComponent,
        SelectorFamiliarModalComponent,
        SelectorCompaneroModalComponent,
        SelectorPuntosGolpeModalComponent,
        SelectorVisibilidadPersonajeModalComponent,
        InformacionBasicosModalComponent,
        SelectorClaseOpcionalModalComponent,
        SelectorRazaBaseModalComponent,
        SelectorRacialesOpcionalesModalComponent,
        VentanaDetalleFlotanteComponent,
        DetallesManualComponent,
        ListadoPlantillasComponent,
        DetallesPlantillaComponent,
        ListadoSubtiposComponent,
        DetallesSubtipoComponent,
        DetallesVentajaComponent,
        ListadoVentajasComponent,
        ListadoMonstruosComponent,
        DetallesMonstruoComponent,
        DetallesArmaComponent,
        DetallesArmaduraComponent,
        ListadoArmasComponent,
        ListadoArmadurasComponent,
        DetallesDeidadComponent,
        ListadoDeidadesComponent,
        AppToastHostComponent,
        FichasDescargaToastHostComponent,
        NuevaDoteComponent,
        NuevaConjuroComponent,
        PrerrequisitoEditorHostComponent,
        PrerrequisitoFlagEditorComponent,
        PrerrequisitoValueEditorComponent,
        PrerrequisitoCatalogEditorComponent,
        PrerrequisitoCatalogValueEditorComponent,
        PrerrequisitoSpecialEditorComponent,
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
        MatRadioModule,
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
        MatTooltipModule,
        MatStepperModule,
        ReactiveFormsModule,
    ],
    providers: [
        DataServices,
        provideHttpClient(withInterceptorsFromDi()),
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideAuth(() => getAuth()),
        provideDatabase(() => {
            forceWebSockets();
            return getDatabase();
        }),
        provideFirestore(() => getFirestore(getApp(), environment.firestoreDatabaseId)),
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
