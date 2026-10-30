import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ApiActionGuardService } from 'src/app/services/api-action-guard.service';
import { AppToastService } from 'src/app/services/app-toast.service';
import { CampanaService } from 'src/app/services/campana.service';
import { CampaignRealtimeSyncService } from 'src/app/services/campaign-realtime-sync.service';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import { PlatformSpacesService } from 'src/app/services/platform-spaces.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserService } from 'src/app/services/user.service';
import { Subject } from 'rxjs';
import { CampanasGestionComponent } from './campanas-gestion.component';
import { CampanasGestionEstado } from './campanas-gestion.estado';

describe('CampanasGestionComponent', () => {
    let fixture: ComponentFixture<CampanasGestionComponent>;
    let component: CampanasGestionComponent;
    let estado: CampanasGestionEstado;
    let campanaSvc: jasmine.SpyObj<CampanaService>;

    const detalle = (partial: Record<string, any> = {}) => ({
        campaign: { id: 7, nombre: 'El paso gris', campaignRole: 'master', membershipStatus: 'activo' },
        ownerUid: 'uid-1',
        ownerDisplayName: 'Yosi',
        activeMasterUid: 'uid-1',
        activeMasterDisplayName: 'Yosi',
        espacio: { id: 41, entrada: 'solicitud' as const },
        politicaCreacion: null,
        members: [
            { uid: 'uid-1', displayName: 'Yosi', email: null, campaignRole: 'master', membershipStatus: 'activo', isActive: true },
            { uid: 'uid-2', displayName: 'Brenna', email: null, campaignRole: 'jugador', membershipStatus: 'activo', isActive: true },
            { uid: 'uid-3', displayName: 'Myra', email: null, campaignRole: 'jugador', membershipStatus: 'activo', isActive: true },
        ],
        pendingInvitations: [],
        joinRequests: [],
        pendingTransfer: null,
        includeInactiveMembers: false,
        tramas: [
            { id: 1, nombre: 'La caravana', visibleParaJugadores: true, subtramas: [{ id: 11, nombre: 'El vado', visibleParaJugadores: false }] },
            { id: 2, nombre: 'El traidor', visibleParaJugadores: false, subtramas: [] },
        ],
        ...partial,
    });

    beforeEach(async () => {
        campanaSvc = jasmine.createSpyObj<CampanaService>('CampanaService', ['listProfileCampaigns', 'getCampaignDetail', 'watchCampaignSummaries', 'updateCampaign']);
        campanaSvc.getCampaignDetail.and.resolveTo(detalle() as any);
        campanaSvc.updateCampaign.and.resolveTo({} as any);
        campanaSvc.watchCampaignSummaries.and.returnValue(() => undefined);

        await TestBed.configureTestingModule({
            declarations: [CampanasGestionComponent],
            imports: [FormsModule, MatSlideToggleModule],
            providers: [
                CampanasGestionEstado,
                {
                    provide: UserService,
                    useValue: {
                        getCurrentRole: () => 'master',
                        can: () => true,
                        canProceed: () => true,
                        CurrentUserUid: 'uid-1',
                        getAccessRestrictionMessage: () => '',
                        getComplianceErrorMessage: () => '',
                    },
                },
                { provide: CampanaService, useValue: campanaSvc },
                { provide: CampaignRealtimeSyncService, useValue: { events$: new Subject() } },
                { provide: UserProfileNavigationService, useValue: jasmine.createSpyObj('UserProfileNavigationService', ['openSocial']) },
                { provide: AppToastService, useValue: jasmine.createSpyObj('AppToastService', ['showSuccess', 'showError', 'showInfo']) },
                { provide: ApiActionGuardService, useValue: { shouldAllow: () => ({ status: 'allowed' }) } },
                { provide: ChatFloatingService, useValue: jasmine.createSpyObj('ChatFloatingService', ['abrir']) },
                { provide: PlatformSpacesService, useValue: jasmine.createSpyObj('PlatformSpacesService', ['cambiarEntrada']) },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        estado = TestBed.inject(CampanasGestionEstado);
        estado.uidActual = 'uid-1';
        estado.campaigns = [
            { id: 7, nombre: 'El paso gris', campaignRole: 'master', membershipStatus: 'activo' } as any,
            { id: 8, nombre: 'Tormenta de arena', campaignRole: 'master', membershipStatus: 'activo' } as any,
        ];
        fixture = TestBed.createComponent(CampanasGestionComponent);
        component = fixture.componentInstance;
    });

    const raiz = () => fixture.nativeElement as HTMLElement;
    const textos = (selector: string) => Array.from(raiz().querySelectorAll(selector)).map((n) => (n.textContent ?? '').replace(/\s+/g, ' ').trim());

    async function elegir(id: number): Promise<void> {
        await estado.seleccionarCampana(id);
        fixture.detectChanges();
    }

    it('pinta las campañas como tarjetas, con la elegida marcada, y «Nueva campaña» arriba', async () => {
        await elegir(7);

        expect(textos('.campanas-nueva')[0]).toContain('Nueva campaña');
        expect(textos('.campanas-tarjeta__nombre')).toEqual(['El paso gris', 'Tormenta de arena']);
        const elegidas = raiz().querySelectorAll('.campanas-tarjeta--elegida');
        expect(elegidas.length).toBe(1);
        expect(elegidas[0].getAttribute('aria-pressed')).toBe('true');
        expect(Array.from(raiz().querySelectorAll('.campanas-tarjeta app-icono-rol')).map((i) => i.getAttribute('tipo'))).toEqual(['campana', 'campana']);
        expect(raiz().querySelector('.campanas-cabecera app-icono-rol')?.getAttribute('tipo')).toBe('campana');
    });

    it('lleva la cabecera de ficha con la campaña y las tres pestañas, con la política abierta al elegirla', async () => {
        await elegir(7);

        expect(textos('.campanas-cabecera__nombre')).toEqual(['El paso gris']);
        expect(component.lineaTipo).toBe('Campaña · Master · 2 jugadores');
        expect(textos('[role="tab"]')).toEqual(['Política de creación', 'Jugadores', 'Historias']);
        expect(raiz().querySelector('#campanas-pestana-politica')!.getAttribute('aria-selected')).toBe('true');
        expect(textos('.campanas-bloque__titulo')).toEqual(['Nombre', 'Entrada', 'Tiradas', 'Contenido', 'Tienda del final de la creación']);
        expect(raiz().querySelectorAll('mat-slide-toggle').length).toBeGreaterThan(0);
        expect(textos('.campanas-accion')).toContain('Guardar la política');
        expect(textos('.campanas-cabecera__acciones button')).toContain('link Copiar el enlace para pedir entrar');
    });

    it('las pestañas abren jugadores e historias con las mismas acciones de siempre', async () => {
        await elegir(7);

        component.abrirPestana('jugadores');
        await fixture.whenStable();
        fixture.detectChanges();
        expect(estado.campaignWorkspaceMode).toBe('peopleStories');
        expect(estado.campaignWorkspaceTab).toBe('usuarios');
        expect(component.pestana).toBe('jugadores');
        expect(textos('.campanas-persona__texto strong')).toEqual(['Yosi', 'Brenna', 'Myra']);

        component.abrirPestana('historias');
        await fixture.whenStable();
        fixture.detectChanges();
        expect(component.pestana).toBe('historias');
        expect(textos('.campanas-nodo__texto strong')).toEqual(['La caravana', 'El traidor']);
        const iconos = textos('.campanas-nodo__icono');
        expect(iconos).toEqual(['auto_stories', 'lock', 'lock']);

        component.abrirPestana('politica');
        await fixture.whenStable();
        expect(estado.campaignWorkspaceMode).toBe('config');
    });

    it('se mueve entre pestañas con las flechas', async () => {
        await elegir(7);
        const abrir = spyOn(component, 'abrirPestana').and.callThrough();

        const tab = raiz().querySelector<HTMLElement>('#campanas-pestana-politica')!;
        tab.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
        expect(abrir).toHaveBeenCalledWith('jugadores');

        tab.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
        expect(abrir).toHaveBeenCalledWith('historias');
    });

    it('al crear una campaña no hay pestañas y la acción es «Crear campaña»', () => {
        estado.seleccionarNuevaCampana();
        fixture.detectChanges();

        expect(textos('.campanas-cabecera__nombre')).toEqual(['Nueva campaña']);
        expect(raiz().querySelector('[role="tablist"]')).toBeNull();
        expect(textos('.campanas-accion')).toContain('Crear campaña');
    });

    it('sin campañas dice que aún no diriges ninguna y ofrece crearla', () => {
        estado.campaigns = [];
        fixture.detectChanges();

        expect(raiz().textContent).toContain('Aún no diriges ninguna campaña.');
        expect(textos('.campanas-vacio .campanas-accion')).toEqual(['Nueva campaña']);
    });
});
