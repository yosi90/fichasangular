import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { fakeAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BehaviorSubject, Subject } from 'rxjs';
import Swal from 'sweetalert2';

import { UserProfileComponent } from './user-profile.component';
import { CampanasGestionComponent } from '../campanas-gestion/campanas-gestion.component';
import { AppToastService } from 'src/app/services/app-toast.service';
import { CampanaService } from 'src/app/services/campana.service';
import { CampaignRealtimeSyncService } from 'src/app/services/campaign-realtime-sync.service';
import { UserProfileApiService } from 'src/app/services/user-profile-api.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { PlatformSpacesService } from 'src/app/services/platform-spaces.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { UserService } from 'src/app/services/user.service';
import { ApiActionGuardService } from 'src/app/services/api-action-guard.service';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { resolveDefaultProfileAvatar } from 'src/app/services/utils/profile-avatar.util';

describe('UserProfileComponent', () => {
    let fixture: ComponentFixture<UserProfileComponent>;
    let component: UserProfileComponent;
    let profileSubject: BehaviorSubject<any>;
    let campaignRealtimeEvents$: Subject<any>;
    let watchedCampaignSummariesNext: ((items: any[]) => void) | null;
    let userSvc: any;
    let chatFloatingSvc: jasmine.SpyObj<ChatFloatingService>;
    let userSettingsSvc: jasmine.SpyObj<UserSettingsService>;
    let apiActionGuardSvc: jasmine.SpyObj<ApiActionGuardService>;

    const buildProfile = (authProvider: 'correo' | 'google') => ({
        uid: 'uid-1',
        displayName: 'Yosi',
        bio: 'Bio inicial',
        genderIdentity: 'No binario',
        pronouns: 'elle',
        email: 'yosi@test.dev',
        emailVerified: true,
        authProvider,
        photoUrl: null,
        photoThumbUrl: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        lastSeenAt: '2025-01-02T00:00:00.000Z',
        role: 'jugador',
        permissions: {},
    });

    const settings = {
        version: 1 as const,
        nuevo_personaje: {
            generador_config: null,
            preview_minimizada: null,
            preview_restaurada: null,
        },
        perfil: {
            visibilidadPorDefectoPersonajes: false,
            mostrarPerfilPublico: true,
            allowDirectMessagesFromNonFriends: false,
            autoAbrirVentanaChats: true,
            permitirBurbujasChat: true,
            notificaciones: {
                mensajes: true,
                amistad: true,
                campanas: true,
                cuentaSistema: true,
            },
        },
        mensajeria_flotante: null,
    };

    const buildCampaignPolicy = (partial: Record<string, any> = {}) => ({
        tiradaMinimaCaracteristica: 3,
        nepMaximoPersonajeNuevo: null,
        maxTablasDadosCaracteristicas: 1,
        permitirHomebrewGeneral: false,
        permitirVentajasDesventajas: false,
        permitirIgnorarRestriccionesAlineamiento: false,
        maxFuentesHomebrewGeneralesPorPersonaje: 0,
        ...partial,
    });

    const buildCampaignDetail = (partial: Record<string, any> = {}) => ({
        campaign: {
            id: 7,
            nombre: 'Campaña de prueba',
            campaignRole: 'master',
            membershipStatus: 'activo',
            ...(partial['campaign'] ?? {}),
        },
        ownerUid: 'uid-1',
        ownerDisplayName: 'Yosi',
        activeMasterUid: 'uid-1',
        activeMasterDisplayName: 'Yosi',
        espacio: { id: 41, entrada: 'invitacion' as const },
        politicaCreacion: buildCampaignPolicy(partial['politicaCreacion']),
        members: [],
        pendingInvitations: [],
        joinRequests: [],
        pendingTransfer: null,
        includeInactiveMembers: false,
        tramas: [],
        loadingInvitations: false,
        loadingMembers: false,
        loadingTramas: false,
        ...partial,
    });

    beforeEach(async () => {
        sessionStorage.clear();
        profileSubject = new BehaviorSubject<any>(buildProfile('correo'));
        campaignRealtimeEvents$ = new Subject<any>();
        watchedCampaignSummariesNext = null;
        userSettingsSvc = jasmine.createSpyObj<UserSettingsService>('UserSettingsService', [
            'loadSettings',
            'saveSettings',
            'clearPreviewPlacements',
        ]);
        userSettingsSvc.loadSettings.and.resolveTo(settings);
        userSettingsSvc.saveSettings.and.resolveTo(settings);
        userSettingsSvc.clearPreviewPlacements.and.resolveTo();
        apiActionGuardSvc = jasmine.createSpyObj<ApiActionGuardService>('ApiActionGuardService', ['shouldAllow', 'getBlockedMessage', 'getBlockedToastDedupeKey']);
        apiActionGuardSvc.shouldAllow.and.returnValue({
            status: 'allowed',
            blockedUntil: null,
            blocksToday: 0,
            newlyBlocked: false,
        });
        apiActionGuardSvc.getBlockedMessage.and.returnValue('Hemos observado un comportamiento inusual en esta sesión.');
        apiActionGuardSvc.getBlockedToastDedupeKey.and.returnValue('api-action-guard.uid-1.toast.cooldown');

        userSvc = {
            currentPrivateProfile$: profileSubject.asObservable(),
            CurrentUserUid: 'uid-1',
            refreshCurrentPrivateProfile: jasmine.createSpy('refreshCurrentPrivateProfile').and.callFake(async () => profileSubject.value),
            setCurrentCompliance: jasmine.createSpy('setCurrentCompliance'),
            setCurrentPrivateProfile: jasmine.createSpy('setCurrentPrivateProfile'),
            getCurrentBanStatus: jasmine.createSpy('getCurrentBanStatus').and.returnValue({
                restriction: null,
                sanction: null,
                isActiveNow: false,
                endsAtUtc: null,
                expiresInMs: null,
            }),
            getCurrentRole: jasmine.createSpy('getCurrentRole').and.callFake(() => profileSubject.value?.role ?? 'jugador'),
            can: jasmine.createSpy('can').and.returnValue(true),
            canProceed: jasmine.createSpy('canProceed').and.returnValue(true),
            getAccessRestriction: jasmine.createSpy('getAccessRestriction').and.returnValue(null),
            getAccessRestrictionMessage: jasmine.createSpy('getAccessRestrictionMessage').and.returnValue(''),
            getComplianceErrorMessage: jasmine.createSpy('getComplianceErrorMessage').and.callFake((error: any, scope: 'usage' | 'creation' = 'usage') => {
                if (error?.code === 'CREATION_POLICY_ACCEPTANCE_REQUIRED' || (Number(error?.status ?? 0) === 403 && scope === 'creation'))
                    return 'Debes aceptar las normas de Rol vigentes antes de crear o editar contenido.';
                if (Number(error?.status ?? 0) === 403)
                    return 'Debes aceptar las normas de uso vigentes antes de continuar.';
                return '';
            }),
        };

        chatFloatingSvc = jasmine.createSpyObj<ChatFloatingService>('ChatFloatingService', ['abrir', 'applyProfileSettings']);
        chatFloatingSvc.abrir.and.resolveTo(true);

        await TestBed.configureTestingModule({
            declarations: [UserProfileComponent, CampanasGestionComponent],
            imports: [FormsModule, MatSlideToggleModule],
            providers: [
                { provide: UserService, useValue: userSvc },
                {
                    provide: UserProfileApiService,
                    useValue: jasmine.createSpyObj<UserProfileApiService>('UserProfileApiService', [
                        'getMyRoleRequestStatus',
                        'createRoleRequest',
                        'downloadMyData',
                    ]),
                },
                {
                    provide: CampanaService,
                    useValue: jasmine.createSpyObj<CampanaService>('CampanaService', [
                        'listProfileCampaigns',
                        'listSocialCampaigns',
                        'listVisibleCampaigns',
                        'getCampaignDetail',
                        'createCampaign',
                        'updateCampaign',
                        'searchUsers',
                        'syncMembership',
                        'getCampaignEntry',
                        'createTrama',
                        'updateTrama',
                        'createSubtrama',
                        'updateSubtrama',
                        'watchCampaignSummaries',
                    ]),
                },
                {
                    provide: CampaignRealtimeSyncService,
                    useValue: {
                        events$: campaignRealtimeEvents$.asObservable(),
                    },
                },
                {
                    provide: UserProfileNavigationService,
                    useValue: jasmine.createSpyObj<UserProfileNavigationService>('UserProfileNavigationService', ['openSocial', 'openAccountRestriction']),
                },
                { provide: UserSettingsService, useValue: userSettingsSvc },
                { provide: ChatFloatingService, useValue: chatFloatingSvc },
                {
                    provide: PlatformSessionService,
                    useValue: jasmine.createSpyObj<PlatformSessionService>('PlatformSessionService', ['editarPerfil', 'privacidad', 'urlSocial']),
                },
                {
                    provide: AppToastService,
                    useValue: jasmine.createSpyObj<AppToastService>('AppToastService', ['showSuccess', 'showError', 'showInfo']),
                },
                { provide: ApiActionGuardService, useValue: apiActionGuardSvc },
                {
                    provide: PlatformSpacesService,
                    useValue: jasmine.createSpyObj<PlatformSpacesService>('PlatformSpacesService', [
                        'invitarCuenta',
                        'invitarCorreo',
                        'retirarInvitacion',
                        'resolverSolicitud',
                        'cambiarEntrada',
                        'sacar',
                        'ofrecerTraspaso',
                        'cancelarTraspaso',
                    ]),
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(UserProfileComponent);
        component = fixture.componentInstance;
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        apiSvc.getMyRoleRequestStatus.and.resolveTo({
            currentRole: 'jugador',
            requestedRole: null,
            status: 'none',
            blockedUntilUtc: null,
            requestId: null,
            requestedAtUtc: null,
            resolvedAtUtc: null,
            eligible: true,
            reasonCode: null,
            currentRoleAtRequest: null,
            requestComment: null,
            adminComment: null,
        });
        apiSvc.createRoleRequest.and.resolveTo({
            currentRole: 'jugador',
            requestedRole: 'master',
            status: 'pending',
            blockedUntilUtc: null,
            requestId: 10,
            requestedAtUtc: '2026-03-10T10:00:00.000Z',
            resolvedAtUtc: null,
            eligible: false,
            reasonCode: 'REQUEST_PENDING',
            currentRoleAtRequest: 'jugador',
            requestComment: 'Quiero arbitrar una campaña.',
            adminComment: null,
        });
        campanaSvc.listProfileCampaigns.and.resolveTo([{
            id: 7,
            nombre: 'Campaña de prueba',
            campaignRole: 'master',
            membershipStatus: 'activo',
        }]);
        campanaSvc.watchCampaignSummaries.and.callFake((next: (items: any[]) => void) => {
            watchedCampaignSummariesNext = next;
            return () => undefined;
        });
        campanaSvc.syncMembership.and.resolveTo();
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail());
    });

    it('abre la sección solicitada cuando recibe un request válido', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'preferencias', requestId: 1 }, false),
        });

        expect(component.currentSection).toBe('preferencias');
    }));

    it('presenta el resumen de permisos con etiquetas legibles para usuario final', fakeAsync(() => {
        profileSubject.next({
            ...buildProfile('correo'),
            permissions: {
                personajes: { create: true },
            },
        });

        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        expect(component.permisosResumen).toBe('Crear personajes nuevos');
        expect(fixture.nativeElement.textContent).toContain('Tus permisos');
        expect(fixture.nativeElement.textContent).toContain('Crear personajes nuevos');
    }));

    it('bloquea localmente la creación de campaña cuando falta aceptar normas de creación', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;

        profileSubject.next({
            ...buildProfile('correo'),
            role: 'master',
            permissions: {
                campanas: { create: true },
            },
        });
        userSvc.getAccessRestrictionMessage.and.callFake((scope: string) =>
            scope === 'creation' ? 'Debes aceptar las normas de creación vigentes antes de continuar.' : ''
        );

        fixture.detectChanges();
        tick();

        component.gestion.seleccionarNuevaCampana();
        component.gestion.campaignCreateDraft = 'Campaña nueva';
        void component.gestion.crearCampana();
        tick();

        expect(campanaSvc.createCampaign).not.toHaveBeenCalled();
        expect(apiActionGuardSvc.shouldAllow).not.toHaveBeenCalled();
        expect(toastSvc.showError).toHaveBeenCalledWith('Debes aceptar las normas de creación vigentes antes de continuar.');
    }));

    it('cae a resumen si se solicita seguridad para un proveedor sin cambio de contraseña', fakeAsync(() => {
        profileSubject.next(buildProfile('google'));
        userSvc.refreshCurrentPrivateProfile.and.resolveTo(profileSubject.value);
        fixture.detectChanges();
        tick();

        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'seguridad', requestId: 3 }, false),
        });

        expect(component.currentSection).toBe('resumen');
    }));

    it('guarda las preferencias de Rol en los ajustes de la cuenta', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        component.visibilidadPorDefectoPersonajes = true;
        component.onGeneradorMinimoSeleccionadoChange(20);
        component.onGeneradorTablasPermitidasChange('2');
        void component.guardarPreferencias();
        tick();

        const guardado = userSettingsSvc.saveSettings.calls.mostRecent().args[0];
        expect(guardado.perfil.visibilidadPorDefectoPersonajes).toBeTrue();
        expect(guardado.nuevo_personaje.generador_config).toEqual(jasmine.objectContaining({
            minimoSeleccionado: 13,
            tablasPermitidas: 2,
        }));
    }));

    it('permite solicitar ser master cuando el usuario es elegible', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        fixture.detectChanges();
        tick();

        expect(component.canRequestRole).toBeTrue();
        expect(component.requestRoleButtonLabel).toBe('Solicitar acceso a Master');
        component.roleRequestCommentDraft = '  Quiero arbitrar una campaña.  ';

        void component.solicitarCambioRol();
        tick();

        expect(apiSvc.createRoleRequest).toHaveBeenCalledWith('master', 'Quiero arbitrar una campaña.');
        expect(component.roleRequestStatus?.status).toBe('pending');
        expect(component.roleRequestUserComment).toBe('Quiero arbitrar una campaña.');
        expect(component.roleRequestCommentDraft).toBe('');
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        expect(toastSvc.showSuccess).toHaveBeenCalled();
    }));

    it('permite solicitar ser colaborador cuando el usuario es master y es elegible', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        profileSubject.next({
            ...buildProfile('correo'),
            role: 'master',
        });
        userSvc.refreshCurrentPrivateProfile.and.resolveTo(profileSubject.value);
        apiSvc.getMyRoleRequestStatus.and.resolveTo({
            currentRole: 'master',
            requestedRole: null,
            status: 'none',
            blockedUntilUtc: null,
            requestId: null,
            requestedAtUtc: null,
            resolvedAtUtc: null,
            eligible: true,
            reasonCode: null,
            currentRoleAtRequest: null,
            requestComment: null,
            adminComment: null,
        });
        apiSvc.createRoleRequest.and.resolveTo({
            currentRole: 'master',
            requestedRole: 'colaborador',
            status: 'pending',
            blockedUntilUtc: null,
            requestId: 11,
            requestedAtUtc: '2026-03-11T10:00:00.000Z',
            resolvedAtUtc: null,
            eligible: false,
            reasonCode: 'REQUEST_PENDING',
            currentRoleAtRequest: 'master',
            requestComment: 'Puedo ayudar con revisiones.',
            adminComment: null,
        });

        fixture.detectChanges();
        tick();

        expect(component.requestedRoleTarget).toBe('colaborador');
        expect(component.canRequestRole).toBeTrue();
        expect(component.roleRequestStatusLabel).toContain('Colaborador');

        void component.solicitarCambioRol();
        tick();

        expect(apiSvc.createRoleRequest).toHaveBeenCalledWith('colaborador', null);
        expect(component.roleRequestStatus?.requestedRole).toBe('colaborador');
    }));

    it('adapta el panel de solicitud al flujo master a colaborador', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        profileSubject.next({
            ...buildProfile('correo'),
            role: 'master',
        });
        userSvc.refreshCurrentPrivateProfile.and.resolveTo(profileSubject.value);
        apiSvc.getMyRoleRequestStatus.and.resolveTo({
            currentRole: 'master',
            requestedRole: null,
            status: 'none',
            blockedUntilUtc: null,
            requestId: null,
            requestedAtUtc: null,
            resolvedAtUtc: null,
            eligible: true,
            reasonCode: null,
            currentRoleAtRequest: null,
            requestComment: null,
            adminComment: null,
        });

        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const text = `${fixture.nativeElement.textContent ?? ''}`;
        expect(component.showRoleRequestPanel).toBeTrue();
        expect(text).toContain('Acceso a Colaborador');
        expect(text).toContain('Solicitar acceso a Colaborador');
    }));

    it('permite solicitar colaborador aunque el estado venga como none no elegible tras subir a master', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        profileSubject.next({
            ...buildProfile('correo'),
            role: 'master',
        });
        userSvc.refreshCurrentPrivateProfile.and.resolveTo(profileSubject.value);
        apiSvc.getMyRoleRequestStatus.and.resolveTo({
            currentRole: 'master',
            requestedRole: null,
            status: 'none',
            blockedUntilUtc: null,
            requestId: null,
            requestedAtUtc: null,
            resolvedAtUtc: null,
            eligible: false,
            reasonCode: null,
            currentRoleAtRequest: 'jugador',
            requestComment: null,
            adminComment: null,
        });

        fixture.detectChanges();
        tick();

        expect(component.requestedRoleTarget).toBe('colaborador');
        expect(component.canRequestRole).toBeTrue();
        expect(component.roleRequestStatusLabel).toContain('Puedes solicitar acceso a Colaborador');
    }));

    it('ignora la solicitud previa aprobada a master y permite pedir colaborador', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        profileSubject.next({
            ...buildProfile('correo'),
            role: 'master',
        });
        userSvc.refreshCurrentPrivateProfile.and.resolveTo(profileSubject.value);
        apiSvc.getMyRoleRequestStatus.and.resolveTo({
            currentRole: 'master',
            requestedRole: 'master',
            status: 'approved',
            blockedUntilUtc: null,
            requestId: 21,
            requestedAtUtc: '2026-03-10T10:00:00.000Z',
            resolvedAtUtc: '2026-03-11T10:00:00.000Z',
            eligible: false,
            reasonCode: 'ROLE_ALREADY_GRANTED',
            currentRoleAtRequest: 'jugador',
            requestComment: 'Quiero arbitrar una campaña.',
            adminComment: 'Solicitud aprobada.',
        });

        fixture.detectChanges();
        tick();

        expect(component.canRequestRole).toBeTrue();
        expect(component.roleRequestStatusLabel).toContain('Puedes solicitar acceso a Colaborador');
        expect(component.roleRequestUserComment).toBe('');
        expect(component.roleRequestAdminComment).toBe('');
    }));

    it('oculta el panel de solicitud cuando el usuario ya es colaborador', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        profileSubject.next({
            ...buildProfile('correo'),
            role: 'colaborador',
        });
        userSvc.refreshCurrentPrivateProfile.and.resolveTo(profileSubject.value);
        apiSvc.getMyRoleRequestStatus.and.resolveTo({
            currentRole: 'colaborador',
            requestedRole: null,
            status: 'none',
            blockedUntilUtc: null,
            requestId: null,
            requestedAtUtc: null,
            resolvedAtUtc: null,
            eligible: false,
            reasonCode: 'ROLE_NOT_ALLOWED',
            currentRoleAtRequest: null,
            requestComment: null,
            adminComment: null,
        });

        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        const text = `${fixture.nativeElement.textContent ?? ''}`;
        expect(component.showRoleRequestPanel).toBeFalse();
        expect(text).not.toContain('Acceso a Colaborador');
    }));

    it('muestra el bloqueo temporal cuando la solicitud fue rechazada', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        apiSvc.getMyRoleRequestStatus.and.resolveTo({
            currentRole: 'jugador',
            requestedRole: 'master',
            status: 'rejected',
            blockedUntilUtc: '2099-04-08T09:30:00.000Z',
            requestId: 12,
            requestedAtUtc: '2026-03-10T10:00:00.000Z',
            resolvedAtUtc: '2026-03-11T10:00:00.000Z',
            eligible: false,
            reasonCode: 'REQUEST_BLOCKED',
            currentRoleAtRequest: 'jugador',
            requestComment: 'Quiero dirigir mesa.',
            adminComment: 'Espera un tiempo antes de volver a pedirlo.',
        });

        fixture.detectChanges();
        tick();

        expect(component.canRequestRole).toBeFalse();
        expect(component.roleRequestStatusLabel).toContain('No podrás volver a pedirlo');
        expect(component.roleRequestAdminComment).toContain('Espera un tiempo');
    }));

    it('recarga campañas al reabrir la sección aunque ya se hubiera cargado antes', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        campanaSvc.listProfileCampaigns.and.returnValues(
            Promise.resolve([{
                id: 7,
                nombre: 'Campaña de prueba',
                campaignRole: 'master',
                membershipStatus: 'activo',
            }]),
            Promise.resolve([
                {
                    id: 7,
                    nombre: 'Campaña de prueba',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                },
                {
                    id: 9,
                    nombre: 'Costa',
                    campaignRole: 'jugador',
                    membershipStatus: 'activo',
                },
            ]),
            Promise.resolve([
                {
                    id: 7,
                    nombre: 'Campaña de prueba',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                },
                {
                    id: 9,
                    nombre: 'Costa',
                    campaignRole: 'jugador',
                    membershipStatus: 'activo',
                },
            ]),
        );
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail());

        fixture.detectChanges();
        tick();

        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 40 }, false),
        });
        tick();

        void component.setSection('resumen');
        tick();
        void component.setSection('campanas');
        tick();

        expect(campanaSvc.listProfileCampaigns.calls.count()).toBe(3);
        expect(component.gestion.campaigns.map((item) => item.id)).toEqual([7]);
    }));

    it('también refresca campañas ante invalidaciones locales mientras la sección está abierta', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        campanaSvc.listProfileCampaigns.and.returnValues(
            Promise.resolve([{
                id: 7,
                nombre: 'Campaña de prueba',
                campaignRole: 'master',
                membershipStatus: 'activo',
            }]),
            Promise.resolve([
                {
                    id: 7,
                    nombre: 'Campaña de prueba',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                },
                {
                    id: 9,
                    nombre: 'Costa',
                    campaignRole: 'jugador',
                    membershipStatus: 'activo',
                },
            ]),
            Promise.resolve([
                {
                    id: 7,
                    nombre: 'Campaña de prueba',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                },
                {
                    id: 9,
                    nombre: 'Costa',
                    campaignRole: 'jugador',
                    membershipStatus: 'activo',
                },
            ]),
        );

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 41 }, false),
        });
        tick();

        campaignRealtimeEvents$.next({
            code: 'campaign.local_change',
            campaignId: 9,
            conversationId: null,
            source: 'local',
        });
        tick(300);

        expect(campanaSvc.listProfileCampaigns.calls.count()).toBe(3);
        expect(component.gestion.campaigns.some((item) => item.id === 9)).toBeFalse();
    }));

    it('oculta el formulario de crear campaña a jugadores aunque el ACL diga campanas.create=true', fakeAsync(() => {
        profileSubject.next({
            ...buildProfile('correo'),
            role: 'jugador',
        });
        userSvc.refreshCurrentPrivateProfile.and.resolveTo(profileSubject.value);
        userSvc.can.and.returnValue(true);

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 13 }, false),
        });
        tick();
        fixture.detectChanges();

        const text = `${fixture.nativeElement.textContent ?? ''}`;
        expect(component.gestion.canCreateCampaignByRole).toBeFalse();
        expect(component.gestion.canCreateCampaign).toBeFalse();
        expect(text).toContain('Solo los Masters y Colaboradores pueden crear campañas.');
        expect(text).not.toContain('Crear campaña');
    }));

    it('permite crear campañas si el rol efectivo es admin aunque el perfil local venga degradado', fakeAsync(() => {
        profileSubject.next({
            ...buildProfile('correo'),
            role: 'jugador',
        });
        userSvc.getCurrentRole.and.returnValue('admin');
        userSvc.can.and.returnValue(true);

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 112 }, false),
        });
        tick();

        expect(component.gestion.canCreateCampaignByRole).toBeTrue();
        expect(component.gestion.canCreateCampaign).toBeTrue();
    }));

    it('oculta el panel de solicitar master cuando el rol efectivo ya es admin', fakeAsync(() => {
        profileSubject.next({
            ...buildProfile('correo'),
            role: 'jugador',
        });
        userSvc.getCurrentRole.and.returnValue('admin');

        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        expect(component.profileRoleLabel).toBe('Admin');
        expect(component.requestedRoleTarget).toBeNull();
        expect(component.showRoleRequestPanel).toBeFalse();
        expect(`${fixture.nativeElement.textContent ?? ''}`).not.toContain('Acceso a Master');
    }));

    it('vuelve a resumen si el actor no tiene acceso a gestión de campañas', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        campanaSvc.listProfileCampaigns.and.resolveTo([]);

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 12 }, false),
        });
        tick();
        fixture.detectChanges();

        const text = `${fixture.nativeElement.textContent ?? ''}`;
        expect(component.currentSection).toBe('resumen');
        expect(text).not.toContain('Gestión de campañas');
    }));

    it('oculta firebase uid y diferencia visualmente resultados de búsqueda de miembros actuales', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        component.currentSection = 'campanas';
        component.gestion.campaigns = [{
            id: 7,
            nombre: 'Caballeros',
            campaignRole: 'master',
            membershipStatus: 'activo',
        }];
        component.gestion.selectedCampaignId = 7;
        component.gestion.selectedCampaignDetail = buildCampaignDetail({
            campaign: {
                id: 7,
                nombre: 'Caballeros',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
            members: [{
                userId: 'u-1',
                uid: 'firebase-visible-1',
                displayName: 'MiYosi90',
                email: 'mryosi@test.dev',
                campaignRole: 'master',
                membershipStatus: 'activo',
                isActive: true,
                addedAtUtc: '2026-03-12T22:51:00.000Z',
                addedByUserId: null,
            }],
        });
        component.gestion.memberSearchResults = [{
            uid: 'firebase-visible-2',
            displayName: 'Yosi',
            photoThumbUrl: null,
        }];
        component.gestion.campaignWorkspaceMode = 'peopleStories';
        component.gestion.campaignWorkspaceTab = 'usuarios';

        fixture.detectChanges();

        const text = `${fixture.nativeElement.textContent ?? ''}`;
        expect(text).toContain('Resultados de búsqueda');
        expect(text).toContain('Invitar a la campaña');
        expect(text).not.toContain('firebase-visible-1');
        expect(text).not.toContain('firebase-visible-2');
    }));

    it('filtra del buscador de jugadores a miembros, invitados pendientes y al propio actor', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        component.profile = buildProfile('correo') as any;
        component.gestion.selectedCampaignDetail = buildCampaignDetail({
            campaign: {
                id: 7,
                nombre: 'Caballeros',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
            members: [{
                userId: 'u-1',
                uid: 'uid-master',
                displayName: 'MrYosi90',
                email: 'mryosi@test.dev',
                campaignRole: 'master',
                membershipStatus: 'activo',
                isActive: true,
                addedAtUtc: null,
                addedByUserId: null,
            }],
            pendingInvitations: [{
                id: 18,
                cuenta: 'uid-pending',
                alias: 'Pendiente',
                correo: null,
                creada: null,
                caduca: null,
            }],
        });
        campanaSvc.searchUsers.and.resolveTo([
            { uid: 'uid-master', displayName: 'MrYosi90', photoThumbUrl: null },
            { uid: 'uid-1', displayName: 'Yosi', photoThumbUrl: null },
            { uid: 'uid-pending', displayName: 'Pendiente', photoThumbUrl: null },
            { uid: 'uid-new', displayName: 'Yosi', photoThumbUrl: null },
        ]);

        component.gestion.memberSearchQuery = 'yosi';
        void (component.gestion as any).runUserSearch('member', 'yosi');
        tick();

        expect(component.gestion.memberSearchResults).toEqual([
            { uid: 'uid-new', displayName: 'Yosi', photoThumbUrl: null },
        ]);
    }));

    it('refresca campañas de gestión al llegar un evento realtime de campaña', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        campanaSvc.listProfileCampaigns.and.returnValues(
            Promise.resolve([{
                id: 7,
                nombre: 'Campaña de prueba',
                campaignRole: 'master',
                membershipStatus: 'activo',
            }]),
            Promise.resolve([{
                id: 7,
                nombre: 'Campaña de prueba',
                campaignRole: 'master',
                membershipStatus: 'activo',
            }]),
            Promise.resolve([{
                id: 7,
                nombre: 'Campaña de prueba',
                campaignRole: 'master',
                membershipStatus: 'activo',
            }]),
        );
        campanaSvc.getCampaignDetail.and.returnValues(
            Promise.resolve(buildCampaignDetail({
                pendingInvitations: [{
                    id: 31,
                    cuenta: 'uid-new',
                    alias: 'Nuevo',
                    correo: null,
                    creada: null,
                    caduca: null,
                }],
            })),
            Promise.resolve(buildCampaignDetail({
                members: [{
                    userId: 'u-2',
                    uid: 'uid-new',
                    displayName: 'Nuevo',
                    email: 'new@test.dev',
                    campaignRole: 'jugador',
                    membershipStatus: 'activo',
                    isActive: true,
                    addedAtUtc: null,
                    addedByUserId: null,
                }],
                pendingInvitations: [],
            })),
        );

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 22 }, false),
        });
        tick();

        campaignRealtimeEvents$.next({
            code: 'system.campaign_invitation_resolved',
            campaignId: 7,
            conversationId: null,
            source: 'remote',
        });
        tick(300);

        expect(campanaSvc.listProfileCampaigns.calls.count()).toBe(3);
        expect(component.gestion.selectedCampaignSummary?.id).toBe(7);
        expect(toastSvc.showInfo).not.toHaveBeenCalled();
    }));

    it('permite retirar una invitación pendiente en el espacio de la campaña', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        const spacesSvc = TestBed.inject(PlatformSpacesService) as jasmine.SpyObj<PlatformSpacesService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        component.gestion.campaigns = [{ id: 7, nombre: 'Campaña de prueba', campaignRole: 'master', membershipStatus: 'activo' }];
        component.gestion.selectedCampaignId = 7;
        component.gestion.selectedCampaignDetail = buildCampaignDetail({
            pendingInvitations: [{ id: 18, cuenta: 'uid-pending', alias: 'Pendiente', correo: null, creada: null, caduca: null }],
        });
        spacesSvc.retirarInvitacion.and.resolveTo();
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail());

        void component.gestion.cancelarInvitacionCampana(component.gestion.selectedCampaignDetail!.pendingInvitations[0]);
        tick();

        expect(spacesSvc.retirarInvitacion).toHaveBeenCalledWith(41, 18);
        expect(toastSvc.showSuccess).toHaveBeenCalledWith('Invitación retirada.', { category: 'campanas' });
    }));

    it('invita por correo en el espacio de la campaña y rechaza correos no válidos', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        const spacesSvc = TestBed.inject(PlatformSpacesService) as jasmine.SpyObj<PlatformSpacesService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        component.gestion.campaigns = [{ id: 7, nombre: 'Campaña de prueba', campaignRole: 'master', membershipStatus: 'activo' }];
        component.gestion.selectedCampaignId = 7;
        component.gestion.selectedCampaignDetail = buildCampaignDetail();
        spacesSvc.invitarCorreo.and.resolveTo();
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail());

        component.gestion.memberInviteEmailDraft = 'no-es-un-correo';
        void component.gestion.invitarPorCorreo();
        tick();
        expect(spacesSvc.invitarCorreo).not.toHaveBeenCalled();
        expect(toastSvc.showError).toHaveBeenCalledWith('Escribe un correo válido.');

        component.gestion.memberInviteEmailDraft = 'ana@ejemplo.es';
        void component.gestion.invitarPorCorreo();
        tick();
        expect(spacesSvc.invitarCorreo).toHaveBeenCalledWith(41, 'ana@ejemplo.es');
        expect(component.gestion.memberInviteEmailDraft).toBe('');
    }));

    it('aprobar una solicitud la resuelve en la plataforma y pone al día la campaña', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        const spacesSvc = TestBed.inject(PlatformSpacesService) as jasmine.SpyObj<PlatformSpacesService>;
        component.gestion.campaigns = [{ id: 7, nombre: 'Campaña de prueba', campaignRole: 'master', membershipStatus: 'activo' }];
        component.gestion.selectedCampaignId = 7;
        component.gestion.selectedCampaignDetail = buildCampaignDetail({
            espacio: { id: 41, entrada: 'solicitud' },
            joinRequests: [{ id: 5, cuenta: 'uid-x', alias: 'x', nombre: 'Ana', mensaje: 'Hola', creada: null }],
        });
        spacesSvc.resolverSolicitud.and.resolveTo();
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail());

        void component.gestion.resolverSolicitud(component.gestion.selectedCampaignJoinRequests[0], 'aprobar');
        tick();

        expect(spacesSvc.resolverSolicitud).toHaveBeenCalledWith(41, 5, 'aprobar');
        expect(campanaSvc.syncMembership).toHaveBeenCalledWith(7);
    }));

    it('abrir la campaña a solicitudes cambia la entrada del espacio y sincroniza', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        const spacesSvc = TestBed.inject(PlatformSpacesService) as jasmine.SpyObj<PlatformSpacesService>;
        component.gestion.campaigns = [{ id: 7, nombre: 'Campaña de prueba', campaignRole: 'master', membershipStatus: 'activo' }];
        component.gestion.selectedCampaignId = 7;
        component.gestion.selectedCampaignDetail = buildCampaignDetail();
        spacesSvc.cambiarEntrada.and.resolveTo();
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail({ espacio: { id: 41, entrada: 'solicitud' } }));

        void component.gestion.cambiarEntradaCampana(true);
        tick();

        expect(spacesSvc.cambiarEntrada).toHaveBeenCalledWith(41, 'solicitud');
        expect(campanaSvc.syncMembership).toHaveBeenCalledWith(7);
        expect(component.gestion.selectedCampaignAcceptsRequests).toBeTrue();
        expect(component.gestion.selectedCampaignEntryLink).toContain('?vista=campanas&campana=7');
    }));

    it('ofrece el traspaso del máster en la plataforma y no deja sacar al máster', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        const spacesSvc = TestBed.inject(PlatformSpacesService) as jasmine.SpyObj<PlatformSpacesService>;
        const master = { userId: 'u-1', uid: 'uid-1', displayName: 'Yosi', email: null, campaignRole: 'master' as const, membershipStatus: 'activo' as const, isActive: true, addedAtUtc: null, addedByUserId: null };
        const player = { ...master, userId: 'u-2', uid: 'uid-2', displayName: 'Lia', campaignRole: 'jugador' as const };
        component.gestion.campaigns = [{ id: 7, nombre: 'Campaña de prueba', campaignRole: 'master', membershipStatus: 'activo' }];
        component.gestion.selectedCampaignId = 7;
        component.gestion.selectedCampaignDetail = buildCampaignDetail({ members: [master, player] });
        spacesSvc.ofrecerTraspaso.and.resolveTo();
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail({
            members: [master, player],
            pendingTransfer: { cuenta: 'uid-2', rolSaliente: 'jugador', caduca: null },
        }));

        component.gestion.seleccionarNuevoMaster(player);
        void component.gestion.transferirMaster();
        tick();

        expect(spacesSvc.ofrecerTraspaso).toHaveBeenCalledWith(41, 'uid-2');
        expect(component.gestion.selectedCampaignPendingTransferLabel).toBe('Lia');

        void component.gestion.retirarJugador(master);
        tick();
        expect(spacesSvc.sacar).not.toHaveBeenCalled();
    }));

    it('no ofrece transferir master si la campaña solo tiene al master activo', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        campanaSvc.listProfileCampaigns.and.resolveTo([{
            id: 7,
            nombre: 'Caballeros',
            campaignRole: 'master',
            membershipStatus: 'activo',
        }]);
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail({
            campaign: {
                id: 7,
                nombre: 'Caballeros',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
            members: [{
                userId: 'u-1',
                uid: 'uid-1',
                displayName: 'Yosi',
                email: 'yosi@test.dev',
                campaignRole: 'master',
                membershipStatus: 'activo',
                isActive: true,
                addedAtUtc: '2026-03-12T20:03:00.000Z',
                addedByUserId: null,
            }],
        }));

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 9 }, false),
        });
        tick();

        expect(component.gestion.selectedCampaignCanManage).toBeTrue();
        expect(component.gestion.selectedCampaignCanTransferMaster).toBeFalse();
    }));

    it('no permite gestión convencional si el actor no es master aunque sea admin', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        profileSubject.next({
            ...buildProfile('correo'),
            role: 'admin',
        });
        userSvc.refreshCurrentPrivateProfile.and.resolveTo(profileSubject.value);
        campanaSvc.listProfileCampaigns.and.resolveTo([{
            id: 7,
            nombre: 'Caballeros',
            campaignRole: 'jugador',
            membershipStatus: 'activo',
        }]);
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail({
            campaign: {
                id: 7,
                nombre: 'Caballeros',
                campaignRole: 'jugador',
                membershipStatus: 'activo',
            },
            activeMasterUid: null,
            activeMasterDisplayName: null,
            members: [{
                userId: 'u-1',
                uid: 'uid-1',
                displayName: 'Yosi',
                email: 'yosi@test.dev',
                campaignRole: 'jugador',
                membershipStatus: 'activo',
                isActive: true,
                addedAtUtc: null,
                addedByUserId: null,
            }],
        }));

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 7 }, false),
        });
        tick();

        expect(component.gestion.selectedCampaignSummary).toBeNull();
        expect(component.gestion.selectedCampaignCanManage).toBeFalse();
        expect(component.gestion.selectedCampaignCanTransferMaster).toBeFalse();
    }));

    it('expone solo jugadores activos como candidatos a transferir master', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail({
            members: [
                {
                    userId: 'u-master',
                    uid: 'uid-1',
                    displayName: 'Yosi',
                    email: 'yosi@test.dev',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                    isActive: true,
                    addedAtUtc: null,
                    addedByUserId: null,
                },
                {
                    userId: 'u-player-1',
                    uid: 'uid-2',
                    displayName: 'Lia',
                    email: 'lia@test.dev',
                    campaignRole: 'jugador',
                    membershipStatus: 'activo',
                    isActive: true,
                    addedAtUtc: null,
                    addedByUserId: null,
                },
                {
                    userId: 'u-player-2',
                    uid: 'uid-3',
                    displayName: 'Marcus',
                    email: 'marcus@test.dev',
                    campaignRole: 'jugador',
                    membershipStatus: 'inactivo',
                    isActive: false,
                    addedAtUtc: null,
                    addedByUserId: null,
                },
            ],
        }));

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 14 }, false),
        });
        tick();

        expect(component.gestion.selectedCampaignTransferCandidates.map((member) => member.uid)).toEqual(['uid-2']);
        expect(component.gestion.selectedCampaignCanTransferMaster).toBeTrue();
    }));

    it('hace visible gestión de campañas en caliente cuando una campaña pasa a master', fakeAsync(() => {
        profileSubject.next({
            ...buildProfile('correo'),
            role: 'jugador',
        });
        userSvc.can.and.returnValue(false);
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;

        fixture.detectChanges();
        tick();

        component.gestion.campaigns = [];
        expect(component.canAccessCampaignManagementSection).toBeFalse();
        watchedCampaignSummariesNext?.([]);
        tick();
        toastSvc.showInfo.calls.reset();

        watchedCampaignSummariesNext?.([{
            id: 9,
            nombre: 'Caballeros de Cormyr',
            campaignRole: 'master',
            membershipStatus: 'activo',
        }]);
        tick();

        expect(component.canAccessCampaignManagementSection).toBeTrue();
        expect(component.gestion.manageableCampaigns.map((campaign) => campaign.id)).toEqual([9]);
        expect(toastSvc.showInfo).toHaveBeenCalledWith('Ahora eres Master de la campaña Caballeros de Cormyr.', {
            category: 'campanas',
        });
    }));

    it('seleccionar una campaña deja el workspace en modo neutro', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        campanaSvc.listProfileCampaigns.and.resolveTo([{
            id: 7,
            nombre: 'Caballeros',
            campaignRole: 'master',
            membershipStatus: 'activo',
        }]);
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail());

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 18 }, false),
        });
        tick();

        expect(component.gestion.selectedCampaignId).toBe(7);
        expect(component.gestion.campaignWorkspaceMode).toBe('idle');
    }));

    it('abre la configuración desde la navegación interna sin cambiar a modo creación', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        campanaSvc.listProfileCampaigns.and.resolveTo([{
            id: 7,
            nombre: 'Caballeros',
            campaignRole: 'master',
            membershipStatus: 'activo',
        }]);
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail());

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 19 }, false),
        });
        tick();

        void component.gestion.abrirConfiguracionCampana(7);
        tick();

        expect(component.gestion.selectedCampaignId).toBe(7);
        expect(component.gestion.campaignWorkspaceMode).toBe('config');
        expect(component.gestion.isCreatingCampaign).toBeFalse();
    }));

    it('abre historias directamente desde la navegación interna', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        campanaSvc.listProfileCampaigns.and.resolveTo([{
            id: 7,
            nombre: 'Caballeros',
            campaignRole: 'master',
            membershipStatus: 'activo',
        }]);
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail());

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 21 }, false),
        });
        tick();

        void component.gestion.abrirHistoriasCampana(7);
        tick();

        expect(component.gestion.campaignWorkspaceMode).toBe('peopleStories');
        expect(component.gestion.campaignWorkspaceTab).toBe('historias');
        expect(component.gestion.isCampaignWorkspaceStoriesTab).toBeTrue();
    }));

    it('usa una política mínima y conservadora al abrir nueva campaña', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        component.gestion.seleccionarNuevaCampana();

        expect(component.gestion.campaignCreatePolicyDraft).toEqual(jasmine.objectContaining({
            tiradaMinimaCaracteristica: 3,
            maxTablasDadosCaracteristicas: 1,
            permitirHomebrewGeneral: false,
            permitirVentajasDesventajas: false,
            permitirIgnorarRestriccionesAlineamiento: false,
            maxFuentesHomebrewGeneralesPorPersonaje: 0,
        }));
        expect(component.gestion.campaignWorkspaceMode).toBe('create');
        expect(component.gestion.campaignHomebrewMode).toBe('none');
    }));

    it('normaliza el modo homebrew limitado antes de crear campaña', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        campanaSvc.createCampaign.and.resolveTo({
            id: 11,
            nombre: 'Nueva',
            campaignRole: 'master',
            membershipStatus: 'activo',
        });

        profileSubject.next({
            ...buildProfile('correo'),
            role: 'master',
        });
        userSvc.refreshCurrentPrivateProfile.and.resolveTo(profileSubject.value);
        fixture.detectChanges();
        tick();

        component.gestion.seleccionarNuevaCampana();
        component.gestion.campaignCreateDraft = 'Nueva';
        component.gestion.setCampaignHomebrewMode('limitado');
        component.gestion.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje = -2 as any;
        void component.gestion.crearCampana();
        tick();

        expect(campanaSvc.createCampaign).toHaveBeenCalledWith(jasmine.objectContaining({
            nombre: 'Nueva',
            politicaCreacion: jasmine.objectContaining({
                tiradaMinimaCaracteristica: 3,
                maxTablasDadosCaracteristicas: 1,
                permitirHomebrewGeneral: false,
                maxFuentesHomebrewGeneralesPorPersonaje: 1,
            }),
        }));
    }));

    it('bloquea crear campaña si el nombre tiene menos de 5 caracteres', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;

        profileSubject.next({
            ...buildProfile('correo'),
            role: 'master',
        });
        userSvc.refreshCurrentPrivateProfile.and.resolveTo(profileSubject.value);
        fixture.detectChanges();
        tick();

        component.gestion.seleccionarNuevaCampana();
        component.gestion.campaignCreateDraft = 'Mini';
        void component.gestion.crearCampana();
        tick();

        expect(campanaSvc.createCampaign).not.toHaveBeenCalled();
        expect(toastSvc.showError).toHaveBeenCalledWith('El nombre de campaña debe tener entre 5 y 150 caracteres.');
    }));

    it('bloquea crear campaña si el nombre está formado solo por números', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;

        profileSubject.next({
            ...buildProfile('correo'),
            role: 'master',
        });
        userSvc.refreshCurrentPrivateProfile.and.resolveTo(profileSubject.value);
        fixture.detectChanges();
        tick();

        component.gestion.seleccionarNuevaCampana();
        component.gestion.campaignCreateDraft = '12345';
        void component.gestion.crearCampana();
        tick();

        expect(campanaSvc.createCampaign).not.toHaveBeenCalled();
        expect(toastSvc.showError).toHaveBeenCalledWith('El nombre de campaña no puede estar formado solo por números.');
    }));

    it('acota los límites numéricos de campaña al perder foco y no durante la edición', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        component.gestion.seleccionarNuevaCampana();
        component.gestion.campaignCreatePolicyDraft.tiradaMinimaCaracteristica = null as any;
        component.gestion.campaignCreatePolicyDraft.nepMaximoPersonajeNuevo = null as any;
        component.gestion.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas = null as any;
        component.gestion.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje = 99 as any;

        expect(component.gestion.campaignCreatePolicyDraft.tiradaMinimaCaracteristica).toBeNull();
        expect(component.gestion.campaignCreatePolicyDraft.nepMaximoPersonajeNuevo).toBeNull();
        expect(component.gestion.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas).toBeNull();

        component.gestion.campaignCreatePolicyDraft.tiradaMinimaCaracteristica = 99 as any;
        component.gestion.campaignCreatePolicyDraft.nepMaximoPersonajeNuevo = -4 as any;
        component.gestion.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas = 99 as any;

        component.gestion.onCampaignMinimumRollBlur();
        component.gestion.onCampaignMaxNepBlur();
        component.gestion.onCampaignMaxTablesBlur();
        component.gestion.setCampaignHomebrewMode('limitado');
        component.gestion.onCampaignHomebrewLimitBlur();

        expect(component.gestion.campaignCreatePolicyDraft.tiradaMinimaCaracteristica).toBe(13);
        expect(component.gestion.campaignCreatePolicyDraft.nepMaximoPersonajeNuevo).toBe(1);
        expect(component.gestion.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas).toBe(5);
        expect(component.gestion.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje).toBe(20);
    }));

    it('autocompleta campañas legacy con mínimos 3/1 y persiste el autofix al cargar el detalle', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail({
            politicaCreacion: {
                tiradaMinimaCaracteristica: null,
                maxTablasDadosCaracteristicas: null,
                permitirHomebrewGeneral: false,
                permitirVentajasDesventajas: false,
                permitirIgnorarRestriccionesAlineamiento: false,
                maxFuentesHomebrewGeneralesPorPersonaje: 0,
            },
        }));
        campanaSvc.updateCampaign.and.resolveTo(buildCampaignDetail() as any);

        profileSubject.next({
            ...buildProfile('correo'),
            role: 'master',
        });
        userSvc.refreshCurrentPrivateProfile.and.resolveTo(profileSubject.value);

        fixture.detectChanges();
        tick();

        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', campaignId: 7, requestId: 44 }, false),
        });
        tick();

        expect(component.gestion.campaignCreatePolicyDraft.tiradaMinimaCaracteristica).toBe(3);
        expect(component.gestion.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas).toBe(1);
        expect(campanaSvc.updateCampaign).toHaveBeenCalledWith(7, {
            politicaCreacion: jasmine.objectContaining({
                tiradaMinimaCaracteristica: 3,
                maxTablasDadosCaracteristicas: 1,
            }),
        });
    }));
});
