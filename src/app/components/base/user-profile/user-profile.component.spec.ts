import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { fakeAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import Swal from 'sweetalert2';

import { UserProfileComponent } from './user-profile.component';
import { AppToastService } from 'src/app/services/app-toast.service';
import { CampanaService } from 'src/app/services/campana.service';
import { CampaignRealtimeSyncService } from 'src/app/services/campaign-realtime-sync.service';
import { ChatApiService } from 'src/app/services/chat-api.service';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import { ChatRealtimeService } from 'src/app/services/chat-realtime.service';
import { UserProfileApiService } from 'src/app/services/user-profile-api.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { SocialAlertPreferencesService } from 'src/app/services/social-alert-preferences.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { UserService } from 'src/app/services/user.service';
import { ApiActionGuardService } from 'src/app/services/api-action-guard.service';
import { Auth } from '@angular/fire/auth';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { resolveDefaultProfileAvatar } from 'src/app/services/utils/profile-avatar.util';

describe('UserProfileComponent', () => {
    let fixture: ComponentFixture<UserProfileComponent>;
    let component: UserProfileComponent;
    let profileSubject: BehaviorSubject<any>;
    let campaignRealtimeEvents$: Subject<any>;
    let watchedCampaignSummariesNext: ((items: any[]) => void) | null;
    let userSvc: any;
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
        canRecoverMaster: false,
        politicaCreacion: buildCampaignPolicy(partial['politicaCreacion']),
        members: [],
        pendingInvitations: [],
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
            resolveComplianceRestrictionFromError: jasmine.createSpy('resolveComplianceRestrictionFromError').and.callFake((error: any, scope: 'usage' | 'creation' = 'usage') => {
                const code = `${error?.code ?? ''}`.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                if (code.includes('banned'))
                    return 'banned';
                if (code.includes('mustacceptusage') || code.includes('usagepolicyacceptancerequired'))
                    return 'mustAcceptUsage';
                if (code.includes('mustacceptcreation') || code.includes('creationpolicyacceptancerequired'))
                    return 'mustAcceptCreation';
                if (Number(error?.status ?? 0) === 403)
                    return scope === 'creation' ? 'mustAcceptCreation' : 'mustAcceptUsage';
                return null;
            }),
        };

        await TestBed.configureTestingModule({
            declarations: [UserProfileComponent],
            imports: [FormsModule],
            providers: [
                { provide: Auth, useValue: { currentUser: null } },
                { provide: UserService, useValue: userSvc },
                {
                    provide: UserProfileApiService,
                    useValue: jasmine.createSpyObj<UserProfileApiService>('UserProfileApiService', [
                        'getMyRoleRequestStatus',
                        'listMyModerationHistory',
                        'getActivePolicy',
                        'acceptActivePolicy',
                        'createRoleRequest',
                        'uploadAvatar',
                        'deleteAvatar',
                        'updateMyProfile',
                    ]),
                },
                {
                    provide: CampanaService,
                    useValue: jasmine.createSpyObj<CampanaService>('CampanaService', [
                        'listProfileCampaigns',
                        'listSocialCampaigns',
                        'listVisibleCampaigns',
                        'getCampaignDetail',
                        'recoverCampaignMaster',
                        'createCampaign',
                        'updateCampaign',
                        'searchUsers',
                        'inviteCampaignMember',
                        'listReceivedCampaignInvitations',
                        'cancelCampaignInvitation',
                        'resolveCampaignInvitation',
                        'removeCampaignMember',
                        'transferCampaignMaster',
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
                    provide: ChatApiService,
                    useValue: jasmine.createSpyObj<ChatApiService>('ChatApiService', ['ensureCampaignConversation']),
                },
                {
                    provide: ChatRealtimeService,
                    useValue: jasmine.createSpyObj<ChatRealtimeService>('ChatRealtimeService', ['upsertConversation']),
                },
                {
                    provide: ChatFloatingService,
                    useValue: jasmine.createSpyObj<ChatFloatingService>('ChatFloatingService', ['applyProfileSettings']),
                },
                {
                    provide: UserProfileNavigationService,
                    useValue: jasmine.createSpyObj<UserProfileNavigationService>('UserProfileNavigationService', ['openSocial', 'openAccountRestriction']),
                },
                { provide: UserSettingsService, useValue: userSettingsSvc },
                {
                    provide: SocialAlertPreferencesService,
                    useValue: jasmine.createSpyObj<SocialAlertPreferencesService>('SocialAlertPreferencesService', ['applyProfileSettings']),
                },
                {
                    provide: AppToastService,
                    useValue: jasmine.createSpyObj<AppToastService>('AppToastService', ['showSuccess', 'showError', 'showInfo']),
                },
                { provide: ApiActionGuardService, useValue: apiActionGuardSvc },
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
        apiSvc.listMyModerationHistory.and.resolveTo({
            items: [],
            total: 0,
            limit: 10,
            offset: 0,
            hasMore: false,
        } as any);
        apiSvc.getActivePolicy.and.callFake(async (kind: 'usage' | 'creation') => ({
            kind,
            version: kind === 'creation' ? '2' : '4',
            title: kind === 'creation' ? 'Normas de creación' : 'Normas de uso',
            markdown: `# ${kind}\n\nTexto ${kind}.`,
            publishedAtUtc: '2026-04-01T10:00:00Z',
        }) as any);
        apiSvc.acceptActivePolicy.and.callFake(async (kind: 'usage' | 'creation') => ({
            policy: {
                kind,
                version: kind === 'creation' ? '2' : '4',
                title: kind === 'creation' ? 'Normas de creación' : 'Normas de uso',
                markdown: `# ${kind}\n\nTexto ${kind}.`,
                publishedAtUtc: '2026-04-01T10:00:00Z',
            },
            compliance: {
                banned: false,
                mustAcceptUsage: kind === 'usage' ? false : profileSubject.value?.compliance?.mustAcceptUsage === true,
                mustAcceptCreation: kind === 'creation' ? false : profileSubject.value?.compliance?.mustAcceptCreation === true,
                activeSanction: null,
                usage: {
                    version: '4',
                    accepted: true,
                    acceptedAtUtc: '2026-04-01T12:00:00Z',
                    publishedAtUtc: '2026-04-01T10:00:00Z',
                    title: 'Normas de uso',
                },
                creation: {
                    version: '2',
                    accepted: kind === 'creation',
                    acceptedAtUtc: kind === 'creation' ? '2026-04-01T12:00:00Z' : null,
                    publishedAtUtc: '2026-04-01T10:00:00Z',
                    title: 'Normas de creación',
                },
            },
        }) as any);
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
        campanaSvc.listReceivedCampaignInvitations.and.resolveTo([]);
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

    it('abre seguridad cuando la cuenta permite cambio de contraseña', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'seguridad', requestId: 2 }, false),
        });

        expect(component.currentSection).toBe('seguridad');
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

    it('muestra compliance actor-scoped en el resumen cuando llega en el perfil privado', fakeAsync(() => {
        profileSubject.next({
            ...buildProfile('correo'),
            compliance: {
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: false,
                activeSanction: {
                    sanctionId: 4,
                    kind: 'temporary',
                    code: 'cooldown',
                    name: 'Cooldown',
                    startsAtUtc: '2026-04-01T10:00:00Z',
                    endsAtUtc: '2026-04-08T10:00:00Z',
                    isPermanent: false,
                },
                usage: {
                    version: '4',
                    accepted: false,
                    acceptedAtUtc: null,
                    publishedAtUtc: null,
                    title: null,
                },
                creation: {
                    version: '2',
                    accepted: true,
                    acceptedAtUtc: '2026-03-20T10:00:00Z',
                    publishedAtUtc: null,
                    title: null,
                },
            },
        });

        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        expect(component.compliance?.mustAcceptUsage).toBeTrue();
        expect(fixture.nativeElement.textContent).toContain('Normas de uso');
        expect(fixture.nativeElement.textContent).toContain('Normas de creación');
        expect(fixture.nativeElement.textContent).toContain('Moderación y avisos');
        expect(fixture.nativeElement.textContent).toContain('Aceptar normas');
    }));

    it('abre un modal con la política activa desde el resumen de compliance', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        profileSubject.next({
            ...buildProfile('correo'),
            compliance: {
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: {
                    version: '4',
                    accepted: false,
                    acceptedAtUtc: null,
                    publishedAtUtc: '2026-04-01T10:00:00Z',
                    title: 'Normas de uso',
                },
                creation: null,
            },
        });

        fixture.detectChanges();
        tick();

        void component.abrirPoliticaCumplimiento('usage');
        tick();
        fixture.detectChanges();

        expect(apiSvc.getActivePolicy).toHaveBeenCalledWith('usage');
        expect(Swal.fire).toHaveBeenCalled();
        expect((Swal.fire as jasmine.Spy).calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
            title: 'Normas de uso',
        }));
        expect(`${(Swal.fire as jasmine.Spy).calls.mostRecent().args[0]?.html ?? ''}`).toContain('Texto usage');
        expect(fixture.nativeElement.textContent).toContain('Ver normas');
        expect(fixture.nativeElement.textContent).toContain('Aceptar normas');
    }));

    it('acepta la política desde la tarjeta y actualiza compliance en memoria', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        profileSubject.next({
            ...buildProfile('correo'),
            compliance: {
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: {
                    version: '4',
                    accepted: false,
                    acceptedAtUtc: null,
                    publishedAtUtc: '2026-04-01T10:00:00Z',
                    title: 'Normas de uso',
                },
                creation: null,
            },
        });

        fixture.detectChanges();
        tick();

        void component.aceptarPoliticaCumplimiento('usage');
        tick();

        expect(apiSvc.acceptActivePolicy).toHaveBeenCalledWith('usage');
        expect(userSvc.setCurrentCompliance).toHaveBeenCalledWith(jasmine.objectContaining({
            mustAcceptUsage: false,
        }));
        expect(userSvc.setCurrentPrivateProfile).toHaveBeenCalledWith(jasmine.objectContaining({
            compliance: jasmine.objectContaining({
                mustAcceptUsage: false,
            }),
        }));
        expect(component.compliance?.mustAcceptUsage).toBeFalse();
        expect(toastSvc.showSuccess).toHaveBeenCalled();
    }));

    it('muestra el estado verde de ya aceptadas cuando la política no está pendiente', fakeAsync(() => {
        profileSubject.next({
            ...buildProfile('correo'),
            compliance: {
                banned: false,
                mustAcceptUsage: false,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: {
                    version: '4',
                    accepted: true,
                    acceptedAtUtc: '2026-04-01T12:00:00Z',
                    publishedAtUtc: '2026-04-01T10:00:00Z',
                    title: 'Normas de uso',
                },
                creation: {
                    version: '2',
                    accepted: true,
                    acceptedAtUtc: '2026-04-01T12:00:00Z',
                    publishedAtUtc: '2026-04-01T10:00:00Z',
                    title: 'Normas de creación',
                },
            },
        });

        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Ya aceptadas');
        expect(fixture.nativeElement.textContent).not.toContain('Aceptar normas');
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

        component.seleccionarNuevaCampana();
        component.campaignCreateDraft = 'Campaña nueva';
        void component.crearCampana();
        tick();

        expect(campanaSvc.createCampaign).not.toHaveBeenCalled();
        expect(apiActionGuardSvc.shouldAllow).not.toHaveBeenCalled();
        expect(toastSvc.showError).toHaveBeenCalledWith('Debes aceptar las normas de creación vigentes antes de continuar.');
    }));

    it('muestra el estado limpio cuando no hay historial de moderación', fakeAsync(() => {
        profileSubject.next({
            ...buildProfile('correo'),
            compliance: {
                banned: false,
                mustAcceptUsage: false,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: null,
                creation: null,
            },
        });

        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        expect(component.hasModerationEvents).toBeFalse();
        expect(fixture.nativeElement.textContent).toContain('Moderación y avisos');
        expect(fixture.nativeElement.textContent).toContain('Estás limpi@');
    }));

    it('abre un modal con el historial actor-scoped de moderación', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        profileSubject.next({
            ...buildProfile('correo'),
            compliance: {
                banned: false,
                mustAcceptUsage: false,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: null,
                creation: null,
            },
        });
        apiSvc.listMyModerationHistory.and.resolveTo({
            items: [{
                incidentId: 19,
                caseId: 8,
                caseCode: 'harassment',
                caseName: 'Acoso',
                mode: 'report',
                confirmedAtUtc: '2026-04-01T10:00:00Z',
                createdAtUtc: '2026-04-01T09:55:00Z',
                userVisibleMessage: 'Se ha confirmado una incidencia.',
                result: 'reported',
                sanction: null,
            }],
            total: 1,
            limit: 10,
            offset: 0,
            hasMore: false,
        } as any);

        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        void component.abrirHistorialModeracionModal();
        tick();

        expect(apiSvc.listMyModerationHistory).toHaveBeenCalledWith(10, 0);
        expect(component.moderationHistory.length).toBe(1);
        expect(fixture.nativeElement.textContent).toContain('Ver historial');
        expect(Swal.fire).toHaveBeenCalled();
        expect(`${(Swal.fire as jasmine.Spy).calls.mostRecent().args[0]?.html ?? ''}`).toContain('Acoso');
        expect(`${(Swal.fire as jasmine.Spy).calls.mostRecent().args[0]?.html ?? ''}`).toContain('Reporte confirmado');
    }));

    it('muestra un botón de cuenta bloqueada cuando hay restricción temporal activa', fakeAsync(() => {
        userSvc.getCurrentBanStatus.and.returnValue({
            restriction: 'temporaryBan',
            sanction: {
                sanctionId: 22,
                kind: 'restriction',
                code: 'technical_account_restriction_temporary',
                name: 'Restricción temporal de cuenta',
                startsAtUtc: '2026-04-08T10:00:00Z',
                endsAtUtc: '2026-04-08T20:00:00Z',
                isPermanent: false,
            },
            isActiveNow: true,
            endsAtUtc: '2026-04-08T20:00:00Z',
            expiresInMs: 60_000,
        });
        profileSubject.next({
            ...buildProfile('correo'),
            compliance: {
                banned: true,
                mustAcceptUsage: false,
                mustAcceptCreation: false,
                activeSanction: {
                    sanctionId: 22,
                    kind: 'restriction',
                    code: 'technical_account_restriction_temporary',
                    name: 'Restricción temporal de cuenta',
                    startsAtUtc: '2026-04-08T10:00:00Z',
                    endsAtUtc: '2026-04-08T20:00:00Z',
                    isPermanent: false,
                },
                usage: null,
                creation: null,
            },
        });

        fixture.detectChanges();
        tick();
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('Cuenta bloqueada');
    }));

    it('abre un modal con la información de la restricción activa desde el resumen', fakeAsync(() => {
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        userSvc.getCurrentBanStatus.and.returnValue({
            restriction: 'temporaryBan',
            sanction: {
                sanctionId: 22,
                kind: 'restriction',
                code: 'technical_account_restriction_temporary',
                name: 'Restricción temporal de cuenta',
                startsAtUtc: '2026-04-08T10:00:00Z',
                endsAtUtc: '2026-04-08T20:00:00Z',
                isPermanent: false,
            },
            isActiveNow: true,
            endsAtUtc: '2026-04-08T20:00:00Z',
            expiresInMs: 60_000,
        });
        profileSubject.next({
            ...buildProfile('correo'),
            compliance: {
                banned: true,
                mustAcceptUsage: false,
                mustAcceptCreation: false,
                activeSanction: {
                    sanctionId: 22,
                    kind: 'restriction',
                    code: 'technical_account_restriction_temporary',
                    name: 'Restricción temporal de cuenta',
                    startsAtUtc: '2026-04-08T10:00:00Z',
                    endsAtUtc: '2026-04-08T20:00:00Z',
                    isPermanent: false,
                },
                usage: null,
                creation: null,
            },
        });
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        apiSvc.listMyModerationHistory.and.resolveTo({
            items: [{
                incidentId: 71,
                caseId: 8,
                caseCode: 'spam_button',
                caseName: 'Spam técnico de API button',
                mode: 'report',
                confirmedAtUtc: '2026-04-08T10:00:00Z',
                createdAtUtc: '2026-04-08T09:55:00Z',
                userVisibleMessage: 'Se ha registrado una incidencia técnica por abuso repetitivo de acciones sensibles.',
                result: 'sanctioned',
                sanction: {
                    sanctionId: 22,
                    kind: 'restriction',
                    code: 'technical_account_restriction_temporary',
                    name: 'Restricción temporal de cuenta',
                    startsAtUtc: '2026-04-08T10:00:00Z',
                    endsAtUtc: '2026-04-08T20:00:00Z',
                    isPermanent: false,
                },
            }],
            total: 1,
            limit: 10,
            offset: 0,
            hasMore: false,
        } as any);

        fixture.detectChanges();
        tick();

        void component.abrirRestriccionCuentaResumenModal();
        tick();

        expect(Swal.fire).toHaveBeenCalled();
        expect(`${(Swal.fire as jasmine.Spy).calls.mostRecent().args[0]?.html ?? ''}`).toContain('Restricción temporal de cuenta');
        expect(`${(Swal.fire as jasmine.Spy).calls.mostRecent().args[0]?.html ?? ''}`).toContain('abuso repetitivo de acciones sensibles');
        expect((Swal.fire as jasmine.Spy).calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
            confirmButtonText: 'Cerrar',
        }));
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

    it('hidrata los borradores de identidad desde el perfil cargado', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        expect(component.displayNameDraft).toBe('Yosi');
        expect(component.bioDraft).toBe('Bio inicial');
        expect(component.genderIdentityDraft).toBe('No binario');
        expect(component.pronounsDraft).toBe('elle');
    }));

    it('hidrata el selector de identidad en modo personalizado cuando el perfil trae un valor fuera de presets', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        expect(component.genderIdentityPreset).toBe('custom');
        expect(component.showCustomGenderIdentityInput).toBeTrue();
        expect(component.showPronounsField).toBeTrue();
    }));

    it('hidrata el selector como no mostrar si no hay género ni pronombres guardados', fakeAsync(() => {
        profileSubject.next({
            ...buildProfile('correo'),
            genderIdentity: null,
            pronouns: null,
        });

        fixture.detectChanges();
        tick();

        expect(component.genderIdentityPreset).toBe('hidden');
        expect(component.showCustomGenderIdentityInput).toBeFalse();
        expect(component.showPronounsField).toBeFalse();
    }));

    it('al elegir rellenar limpia el input custom y vuelve a mostrar pronombres', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        component.genderIdentityDraft = 'Valor heredado';
        component.onGenderIdentityPresetChange('male');
        component.onGenderIdentityPresetChange('custom');

        expect(component.genderIdentityDraft).toBe('');
        expect(component.showCustomGenderIdentityInput).toBeTrue();
        expect(component.showPronounsField).toBeTrue();
    }));

    it('guarda la identidad completa y actualiza el perfil en memoria', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        const chatFloatingSvc = TestBed.inject(ChatFloatingService) as jasmine.SpyObj<ChatFloatingService>;
        apiSvc.updateMyProfile.and.resolveTo({
            ...buildProfile('correo'),
            displayName: 'Nombre nuevo',
            bio: 'Bio nueva 2',
            genderIdentity: 'Agénero',
            pronouns: 'they',
        } as any);

        fixture.detectChanges();
        tick();

        component.displayNameDraft = '  Nombre nuevo ';
        component.bioDraft = ' Bio nueva 2 ';
        component.genderIdentityDraft = ' Agénero ';
        component.pronounsDraft = ' they ';
        void component.guardarIdentidad();
        tick();

        expect(apiSvc.updateMyProfile).toHaveBeenCalledWith({
            displayName: 'Nombre nuevo',
            bio: 'Bio nueva 2',
            genderIdentity: 'Agénero',
            pronouns: 'they',
        });
        expect(userSvc.setCurrentPrivateProfile).toHaveBeenCalledWith(jasmine.objectContaining({
            displayName: 'Nombre nuevo',
            bio: 'Bio nueva 2',
            genderIdentity: 'Agénero',
            pronouns: 'they',
        }));
        expect(component.displayNameDraft).toBe('Nombre nuevo');
        expect(component.bioDraft).toBe('Bio nueva 2');
        expect(toastSvc.showSuccess).toHaveBeenCalled();
        expect(chatFloatingSvc.applyProfileSettings).not.toHaveBeenCalled();
    }));

    it('guarda un preset cerrado de género y limpia pronombres al persistir', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        apiSvc.updateMyProfile.and.resolveTo({
            ...buildProfile('correo'),
            genderIdentity: 'Chico',
            pronouns: null,
        } as any);

        fixture.detectChanges();
        tick();

        component.displayNameDraft = 'Nombre válido';
        component.bioDraft = 'Bio suficientemente larga';
        component.pronounsDraft = 'elle';
        component.onGenderIdentityPresetChange('male');
        void component.guardarIdentidad();
        tick();

        expect(apiSvc.updateMyProfile).toHaveBeenCalledWith({
            displayName: 'Nombre válido',
            bio: 'Bio suficientemente larga',
            genderIdentity: 'Chico',
            pronouns: null,
        });
    }));

    it('traduce 403 funcional mustAcceptUsage sin depender del mensaje backend al guardar identidad', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        apiSvc.updateMyProfile.and.rejectWith(new ProfileApiError('Forbidden', 'mustAcceptUsage', 403));

        fixture.detectChanges();
        tick();

        component.displayNameDraft = 'Nombre válido';
        component.bioDraft = 'Bio suficientemente larga';
        component.genderIdentityDraft = 'No binario';
        component.pronounsDraft = 'elle';
        void component.guardarIdentidad();
        tick();

        expect(toastSvc.showError).toHaveBeenCalledWith('Debes aceptar las normas de uso vigentes antes de continuar.');
    }));

    it('no bloquea localmente el guard y permite guardar identidad', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        apiActionGuardSvc.shouldAllow.and.returnValue({
            status: 'allowed',
            blockedUntil: null,
            blocksToday: 1,
            newlyBlocked: true,
        });

        fixture.detectChanges();
        tick();

        component.displayNameDraft = 'Nombre válido';
        component.bioDraft = 'Bio suficientemente larga';
        component.genderIdentityDraft = 'No binario';
        component.pronounsDraft = 'elle';
        void component.guardarIdentidad();
        tick();

        expect(apiSvc.updateMyProfile).toHaveBeenCalled();
    }));

    it('asegura el chat de campaña y navega a Social > mensajes', fakeAsync(() => {
        const chatApiSvc = TestBed.inject(ChatApiService) as jasmine.SpyObj<ChatApiService>;
        const chatRealtimeSvc = TestBed.inject(ChatRealtimeService) as jasmine.SpyObj<ChatRealtimeService>;
        const navSvc = TestBed.inject(UserProfileNavigationService) as jasmine.SpyObj<UserProfileNavigationService>;
        chatApiSvc.ensureCampaignConversation.and.resolveTo({
            conversationId: 88,
            type: 'campaign',
            title: 'Campaña de prueba',
            photoThumbUrl: null,
            campaignId: 7,
            participantRole: 'member',
            participantStatus: 'active',
            lastMessagePreview: null,
            lastMessageAtUtc: null,
            unreadCount: 0,
            canSend: true,
            isSystemConversation: false,
            counterpartUid: null,
            lastMessageNotification: null,
            participants: [],
        } as any);

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 31 }, false),
        });
        tick();

        void component.abrirChatCampanaSeleccionada();
        tick();

        expect(chatApiSvc.ensureCampaignConversation).toHaveBeenCalledWith(7);
        expect(chatRealtimeSvc.upsertConversation).toHaveBeenCalled();
        expect(navSvc.openSocial).toHaveBeenCalledWith(jasmine.objectContaining({
            section: 'mensajes',
            conversationId: 88,
        }));
    }));

    it('muestra error controlado si no puede abrir el chat de campaña', fakeAsync(() => {
        const chatApiSvc = TestBed.inject(ChatApiService) as jasmine.SpyObj<ChatApiService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        chatApiSvc.ensureCampaignConversation.and.rejectWith(new Error('Fallo al abrir chat.'));

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 32 }, false),
        });
        tick();

        void component.abrirChatCampanaSeleccionada();
        tick();

        expect(toastSvc.showError).toHaveBeenCalledWith('Fallo al abrir chat.');
    }));

    it('bloquea el guardado si los pronombres contienen saltos de línea', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;

        fixture.detectChanges();
        tick();

        component.pronounsDraft = 'elle\nthey';
        void component.guardarIdentidad();
        tick();

        expect(apiSvc.updateMyProfile).not.toHaveBeenCalled();
        expect(toastSvc.showError).toHaveBeenCalledWith('Los pronombres no pueden contener saltos de línea.');
    }));

    it('bloquea el guardado si el nombre visible tiene menos de 3 caracteres', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;

        fixture.detectChanges();
        tick();

        component.displayNameDraft = 'Yo';
        void component.guardarIdentidad();
        tick();

        expect(apiSvc.updateMyProfile).not.toHaveBeenCalled();
        expect(toastSvc.showError).toHaveBeenCalledWith('El nombre visible debe tener entre 3 y 150 caracteres.');
    }));

    it('bloquea el guardado si el nombre visible está formado solo por números', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;

        fixture.detectChanges();
        tick();

        component.displayNameDraft = '12345';
        void component.guardarIdentidad();
        tick();

        expect(apiSvc.updateMyProfile).not.toHaveBeenCalled();
        expect(toastSvc.showError).toHaveBeenCalledWith('El nombre visible no puede estar formado solo por números.');
    }));

    it('bloquea el guardado si la bio no vacía tiene menos de 10 caracteres', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;

        fixture.detectChanges();
        tick();

        component.bioDraft = 'Demasiad';
        void component.guardarIdentidad();
        tick();

        expect(apiSvc.updateMyProfile).not.toHaveBeenCalled();
        expect(toastSvc.showError).toHaveBeenCalledWith('La bio debe tener al menos 10 caracteres o dejarse vacía.');
    }));

    it('bloquea el guardado si la bio está formada solo por números', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;

        fixture.detectChanges();
        tick();

        component.bioDraft = '1234567890';
        void component.guardarIdentidad();
        tick();

        expect(apiSvc.updateMyProfile).not.toHaveBeenCalled();
        expect(toastSvc.showError).toHaveBeenCalledWith('La bio no puede estar formada solo por números.');
    }));

    it('muestra error inline en bio al perder foco con un texto demasiado corto', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        component.currentSection = 'identidad';
        fixture.detectChanges();
        tick();

        const bioInput = fixture.nativeElement.querySelector('#bio-input') as HTMLTextAreaElement;
        bioInput.value = 'a';
        bioInput.dispatchEvent(new Event('input'));
        bioInput.dispatchEvent(new Event('blur'));
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('La bio debe tener al menos 10 caracteres o dejarse vacía.');
    }));

    it('muestra error inline en nombre visible al perder foco si solo contiene números', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        component.currentSection = 'identidad';
        fixture.detectChanges();
        tick();

        const displayNameInput = fixture.nativeElement.querySelector('#display-name-input') as HTMLInputElement;
        displayNameInput.value = '12345';
        displayNameInput.dispatchEvent(new Event('input'));
        displayNameInput.dispatchEvent(new Event('blur'));
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toContain('El nombre visible no puede estar formado solo por números.');
    }));

    it('cae al avatar por defecto si falla la carga de la imagen persistida', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        profileSubject.next({
            ...buildProfile('correo'),
            photoUrl: 'https://cdn.test/avatar-roto.webp',
            photoThumbUrl: null,
        });
        fixture.detectChanges();
        tick();

        component.onAvatarImageError({
            target: {
                src: 'https://cdn.test/avatar-roto.webp',
                currentSrc: 'https://cdn.test/avatar-roto.webp',
            },
        } as any);

        expect(component.avatarUrl).toBe(resolveDefaultProfileAvatar('uid-1'));
    }));

    it('prioriza la miniatura persistida frente al original para el avatar del perfil', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        profileSubject.next({
            ...buildProfile('correo'),
            photoUrl: 'https://cdn.test/avatar-original.webp',
            photoThumbUrl: 'https://cdn.test/avatar-thumb.webp',
        });
        fixture.detectChanges();
        tick();

        expect(component.avatarUrl).toBe('https://cdn.test/avatar-thumb.webp');
    }));

    it('mantiene el fallback del avatar si el mismo perfil roto se reemite en caliente', fakeAsync(() => {
        const brokenAvatar = 'https://cdn.test/avatar-roto.webp';
        fixture.detectChanges();
        tick();

        profileSubject.next({
            ...buildProfile('correo'),
            photoUrl: brokenAvatar,
            photoThumbUrl: null,
        });
        fixture.detectChanges();
        tick();

        component.onAvatarImageError({
            target: {
                src: brokenAvatar,
                currentSrc: brokenAvatar,
            },
        } as any);

        profileSubject.next({
            ...buildProfile('correo'),
            photoUrl: brokenAvatar,
            photoThumbUrl: null,
        });
        fixture.detectChanges();
        tick();

        expect(component.avatarUrl).toBe(resolveDefaultProfileAvatar('uid-1'));
    }));

    it('envia null al limpiar bio, genero y pronombres', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        apiSvc.updateMyProfile.and.resolveTo({
            ...buildProfile('correo'),
            bio: null,
            genderIdentity: null,
            pronouns: null,
        } as any);

        fixture.detectChanges();
        tick();

        component.bioDraft = '   ';
        component.genderIdentityDraft = ' ';
        component.pronounsDraft = '';
        void component.guardarIdentidad();
        tick();

        expect(apiSvc.updateMyProfile).toHaveBeenCalledWith({
            displayName: 'Yosi',
            bio: null,
            genderIdentity: null,
            pronouns: null,
        });
    }));

    it('resetear la preview no pisa los borradores actuales de preferencias', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        component.visibilidadPorDefectoPersonajes = true;
        component.generadorMinimoSeleccionado = 11;
        component.generadorTablasPermitidas = 5;

        void component.resetearPosicionPreview();
        tick();

        expect(userSettingsSvc.clearPreviewPlacements).toHaveBeenCalled();
        expect(component.visibilidadPorDefectoPersonajes).toBeTrue();
        expect(component.generadorMinimoSeleccionado).toBe(11);
        expect(component.generadorTablasPermitidas).toBe(5);
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

    it('abre campañas y carga el detalle seleccionado', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 4 }, false),
        });
        tick();

        expect(component.currentSection).toBe('campanas');
        expect(component.masterCampaigns.length).toBe(1);
        expect(component.selectedCampaignSummary?.id).toBe(7);
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
        expect(component.campaigns.map((item) => item.id)).toEqual([7]);
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
        expect(component.campaigns.some((item) => item.id === 9)).toBeFalse();
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
        expect(component.canCreateCampaignByRole).toBeFalse();
        expect(component.canCreateCampaign).toBeFalse();
        expect(text).toContain('Solo los Masters y Colaboradores pueden crear campañas.');
        expect(text).not.toContain('Crear campaña');
    }));

    it('mantiene separadas las campañas master y jugador aunque el rol global sea admin', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        profileSubject.next({
            ...buildProfile('correo'),
            role: 'admin',
        });
        userSvc.refreshCurrentPrivateProfile.and.resolveTo(profileSubject.value);
        campanaSvc.listProfileCampaigns.and.resolveTo([
            {
                id: 7,
                nombre: 'Caballeros',
                campaignRole: 'jugador',
                membershipStatus: 'activo',
            },
            {
                id: 8,
                nombre: 'Costa',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
        ]);
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail({
            campaign: {
                id: 8,
                nombre: 'Costa',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
        }));

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 5 }, false),
        });
        tick();

        expect(component.masterCampaigns.map(item => item.id)).toEqual([8]);
        expect(component.manageableCampaigns.map(item => item.id)).toEqual([8]);
    }));

    it('lista campañas propias legacy del creador en el bloque de participación y no como master', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        profileSubject.next({
            ...buildProfile('correo'),
            role: 'admin',
        });
        userSvc.refreshCurrentPrivateProfile.and.resolveTo(profileSubject.value);
        campanaSvc.listProfileCampaigns.and.resolveTo([
            {
                id: 7,
                nombre: 'Propia legacy',
                campaignRole: null,
                membershipStatus: null,
                isOwner: true,
            },
            {
                id: 8,
                nombre: 'Ajena visible',
                campaignRole: null,
                membershipStatus: null,
                isOwner: false,
            },
        ]);
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail({
            campaign: {
                id: 7,
                nombre: 'Propia legacy',
                campaignRole: null,
                membershipStatus: null,
                isOwner: true,
            },
            activeMasterUid: null,
            activeMasterDisplayName: null,
            canRecoverMaster: true,
        }));

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 11 }, false),
        });
        tick();
        fixture.detectChanges();

        expect(component.masterCampaigns).toEqual([]);
        expect(component.manageableCampaigns.map(item => item.id)).toEqual([7]);
        expect(component.selectedCampaignSummary?.id).toBe(7);
        expect(component.getCampaignRoleLabel(component.selectedCampaignSummary?.campaignRole, component.selectedCampaignSummary?.isOwner === true))
            .toBe('Creador');
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

        expect(component.canCreateCampaignByRole).toBeTrue();
        expect(component.canCreateCampaign).toBeTrue();
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
        component.campaigns = [{
            id: 7,
            nombre: 'Caballeros',
            campaignRole: 'master',
            membershipStatus: 'activo',
        }];
        component.selectedCampaignId = 7;
        component.selectedCampaignDetail = buildCampaignDetail({
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
        component.memberSearchResults = [{
            uid: 'firebase-visible-2',
            displayName: 'Yosi',
            photoThumbUrl: null,
        }];
        component.campaignWorkspaceMode = 'peopleStories';
        component.campaignWorkspaceTab = 'usuarios';

        fixture.detectChanges();

        const text = `${fixture.nativeElement.textContent ?? ''}`;
        expect(text).toContain('Resultados de búsqueda');
        expect(text).toContain('Seleccionar para invitar a la campaña');
        expect(text).not.toContain('firebase-visible-1');
        expect(text).not.toContain('firebase-visible-2');
    }));

    it('filtra del buscador de jugadores a miembros, invitados pendientes y al propio actor', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        component.profile = buildProfile('correo') as any;
        component.selectedCampaignDetail = buildCampaignDetail({
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
                inviteId: 18,
                status: 'pending',
                createdAtUtc: '2026-03-13T10:15:00.000Z',
                resolvedAtUtc: null,
                campaignId: 7,
                campaignName: 'Caballeros',
                invitedUser: {
                    userId: 'u-3',
                    uid: 'uid-pending',
                    displayName: 'Pendiente',
                    email: 'pending@test.dev',
                },
                invitedBy: {
                    userId: 'u-1',
                    uid: 'uid-1',
                    displayName: 'Yosi',
                    email: 'yosi@test.dev',
                },
                resolvedByUserId: null,
            }],
        });
        campanaSvc.searchUsers.and.resolveTo([
            { uid: 'uid-master', displayName: 'MrYosi90', photoThumbUrl: null },
            { uid: 'uid-1', displayName: 'Yosi', photoThumbUrl: null },
            { uid: 'uid-pending', displayName: 'Pendiente', photoThumbUrl: null },
            { uid: 'uid-new', displayName: 'Yosi', photoThumbUrl: null },
        ]);

        component.memberSearchQuery = 'yosi';
        void (component as any).runUserSearch('member', 'yosi');
        tick();

        expect(component.memberSearchResults).toEqual([
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
                    inviteId: 31,
                    status: 'pending',
                    createdAtUtc: '2026-03-13T10:15:00.000Z',
                    resolvedAtUtc: null,
                    campaignId: 7,
                    campaignName: 'Campaña de prueba',
                    invitedUser: {
                        userId: 'u-2',
                        uid: 'uid-new',
                        displayName: 'Nuevo',
                        email: 'new@test.dev',
                    },
                    invitedBy: {
                        userId: 'u-1',
                        uid: 'uid-1',
                        displayName: 'Yosi',
                        email: 'yosi@test.dev',
                    },
                    resolvedByUserId: null,
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
        expect(component.selectedCampaignSummary?.id).toBe(7);
        expect(toastSvc.showInfo).not.toHaveBeenCalled();
    }));

    it('permite cancelar una invitación pendiente emitida desde el detalle de campaña', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        component.selectedCampaignId = 7;
        component.selectedCampaignDetail = buildCampaignDetail({
            campaign: {
                id: 7,
                nombre: 'Caballeros',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
            members: [],
            pendingInvitations: [{
                inviteId: 18,
                status: 'pending',
                createdAtUtc: '2026-03-13T10:15:00.000Z',
                resolvedAtUtc: null,
                campaignId: 7,
                campaignName: 'Caballeros',
                invitedUser: {
                    userId: 'u-3',
                    uid: 'uid-pending',
                    displayName: 'Pendiente',
                    email: 'pending@test.dev',
                },
                invitedBy: {
                    userId: 'u-1',
                    uid: 'uid-1',
                    displayName: 'Yosi',
                    email: 'yosi@test.dev',
                },
                resolvedByUserId: null,
            }],
        });
        campanaSvc.cancelCampaignInvitation.and.resolveTo();
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail({
            ...(component.selectedCampaignDetail as any),
            pendingInvitations: [],
        }));

        void component.cancelarInvitacionCampana(component.selectedCampaignDetail!.pendingInvitations[0]);
        tick();

        expect(campanaSvc.cancelCampaignInvitation).toHaveBeenCalledWith(18);
        expect(toastSvc.showSuccess).toHaveBeenCalledWith('Invitación cancelada.', {
            category: 'campanas',
        });
    }));

    it('si cancelar falla porque la invitación ya cambió, refresca el detalle y muestra aviso no bloqueante', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        component.selectedCampaignId = 7;
        component.selectedCampaignDetail = buildCampaignDetail({
            campaign: {
                id: 7,
                nombre: 'Caballeros',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
            members: [],
            pendingInvitations: [{
                inviteId: 18,
                status: 'pending',
                createdAtUtc: '2026-03-13T10:15:00.000Z',
                resolvedAtUtc: null,
                campaignId: 7,
                campaignName: 'Caballeros',
                invitedUser: {
                    userId: 'u-3',
                    uid: 'uid-pending',
                    displayName: 'Pendiente',
                    email: 'pending@test.dev',
                },
                invitedBy: {
                    userId: 'u-1',
                    uid: 'uid-1',
                    displayName: 'Yosi',
                    email: 'yosi@test.dev',
                },
                resolvedByUserId: null,
            }],
        });
        campanaSvc.cancelCampaignInvitation.and.rejectWith(new Error('La invitación ya no está pendiente.'));
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail({
            ...(component.selectedCampaignDetail as any),
            pendingInvitations: [],
        }));

        void component.cancelarInvitacionCampana(component.selectedCampaignDetail!.pendingInvitations[0]);
        tick();

        expect(campanaSvc.getCampaignDetail).toHaveBeenCalledWith(7, false);
        expect(toastSvc.showInfo).toHaveBeenCalledWith('La invitación ya había cambiado en otra sesión. Se ha refrescado la campaña.', {
            category: 'campanas',
        });
        expect(toastSvc.showError).not.toHaveBeenCalled();
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

        expect(component.selectedCampaignCanManage).toBeTrue();
        expect(component.selectedCampaignCanTransferMaster).toBeFalse();
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
            canRecoverMaster: true,
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

        expect(component.selectedCampaignSummary).toBeNull();
        expect(component.selectedCampaignCanManage).toBeFalse();
        expect(component.selectedCampaignCanTransferMaster).toBeFalse();
        expect(component.selectedCampaignCanRecoverMaster).toBeFalse();
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

        expect(component.selectedCampaignTransferCandidates.map((member) => member.uid)).toEqual(['uid-2']);
        expect(component.selectedCampaignCanTransferMaster).toBeTrue();
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

        component.campaigns = [];
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
        expect(component.manageableCampaigns.map((campaign) => campaign.id)).toEqual([9]);
        expect(toastSvc.showInfo).toHaveBeenCalledWith('Ahora eres Master de la campaña Caballeros de Cormyr.', {
            category: 'campanas',
        });
    }));

    it('permite recuperar master en legacy si ownerUid coincide aunque canRecoverMaster venga false', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        campanaSvc.listProfileCampaigns.and.resolveTo([{
            id: 7,
            nombre: 'Legacy',
            campaignRole: null,
            membershipStatus: null,
            isOwner: true,
        }]);
        campanaSvc.getCampaignDetail.and.resolveTo(buildCampaignDetail({
            campaign: {
                id: 7,
                nombre: 'Legacy',
                campaignRole: null,
                membershipStatus: null,
                isOwner: true,
            },
            activeMasterUid: null,
            activeMasterDisplayName: null,
            canRecoverMaster: false,
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
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 8 }, false),
        });
        tick();

        expect(component.selectedCampaignOwnerMatchesCurrentUser).toBeTrue();
        expect(component.selectedCampaignCanRecoverMaster).toBeTrue();
    }));

    it('construye fallback de recuperación cuando el creador ve la campaña pero el detalle devuelve 403 por no ser miembro activo', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        campanaSvc.listProfileCampaigns.and.resolveTo([{
            id: 7,
            nombre: 'Legacy',
            campaignRole: null,
            membershipStatus: null,
            isOwner: true,
        }]);
        campanaSvc.getCampaignDetail.and.rejectWith(new Error('El usuario no pertenece a la campaña.'));

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 113 }, false),
        });
        tick();

        expect(component.selectedCampaignSummary?.id).toBe(7);
        expect(component.selectedCampaignDetail?.campaign.id).toBe(7);
        expect(component.selectedCampaignErrorMessage).toBe('');
        expect(component.selectedCampaignCanRecoverMaster).toBeTrue();
        expect(component.selectedCampaignCanManage).toBeFalse();
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

        expect(component.selectedCampaignId).toBe(7);
        expect(component.campaignWorkspaceMode).toBe('idle');
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

        void component.abrirConfiguracionCampana(7);
        tick();

        expect(component.selectedCampaignId).toBe(7);
        expect(component.campaignWorkspaceMode).toBe('config');
        expect(component.isCreatingCampaign).toBeFalse();
    }));

    it('abre usuarios e historias con la pestaña de usuarios activa por defecto', fakeAsync(() => {
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
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 20 }, false),
        });
        tick();

        void component.abrirUsuariosHistoriasCampana(7);
        tick();

        expect(component.campaignWorkspaceMode).toBe('peopleStories');
        expect(component.campaignWorkspaceTab).toBe('usuarios');
        expect(component.isCampaignWorkspaceUsersTab).toBeTrue();
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

        void component.abrirHistoriasCampana(7);
        tick();

        expect(component.campaignWorkspaceMode).toBe('peopleStories');
        expect(component.campaignWorkspaceTab).toBe('historias');
        expect(component.isCampaignWorkspaceStoriesTab).toBeTrue();
        expect(component.campaignWorkspaceTitle).toBe('Historias de campaña');
    }));

    it('permite editar allowDirectMessagesFromNonFriends al guardar preferencias', fakeAsync(() => {
        const persistedSettings = {
            ...settings,
            perfil: {
                ...settings.perfil,
                allowDirectMessagesFromNonFriends: false,
                notificaciones: {
                    ...settings.perfil.notificaciones,
                },
            },
        };
        userSettingsSvc.loadSettings.and.resolveTo(persistedSettings as any);
        userSettingsSvc.saveSettings.and.callFake(async (payload: any) => payload);

        fixture.detectChanges();
        tick();

        component.mostrarPerfilPublico = false;
        component.allowDirectMessagesFromNonFriends = true;
        void component.guardarPreferencias();
        tick();

        expect(userSettingsSvc.saveSettings).toHaveBeenCalledWith(jasmine.objectContaining({
            perfil: jasmine.objectContaining({
                mostrarPerfilPublico: false,
                visibilidadPorDefectoPersonajes: false,
                allowDirectMessagesFromNonFriends: true,
            }),
        }));
    }));

    it('permite guardar preferencias aunque usage siga pendiente de aceptar', fakeAsync(() => {
        userSettingsSvc.saveSettings.and.callFake(async (payload: any) => payload);
        profileSubject.next({
            ...buildProfile('correo'),
            compliance: {
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: null,
                creation: null,
            },
        });
        userSvc.getAccessRestrictionMessage.and.returnValue('Debes aceptar las normas de uso vigentes antes de continuar.');

        fixture.detectChanges();
        tick();

        component.allowDirectMessagesFromNonFriends = true;
        void component.guardarPreferencias();
        tick();

        expect(userSettingsSvc.saveSettings).toHaveBeenCalled();
    }));

    it('hidrata los toggles de avisos desde settings', fakeAsync(() => {
        userSettingsSvc.loadSettings.and.resolveTo({
            ...settings,
            perfil: {
                ...settings.perfil,
                notificaciones: {
                    mensajes: false,
                    amistad: true,
                    campanas: false,
                    cuentaSistema: true,
                },
            },
        } as any);

        fixture.detectChanges();
        tick();

        expect(component.socialAlertsMensajes).toBeFalse();
        expect(component.socialAlertsAmistad).toBeTrue();
        expect(component.socialAlertsCampanas).toBeFalse();
        expect(component.socialAlertsCuentaSistema).toBeTrue();
    }));

    it('persiste los toggles de avisos y actualiza la caché síncrona', fakeAsync(() => {
        const socialAlertPrefsSvc = TestBed.inject(SocialAlertPreferencesService) as jasmine.SpyObj<SocialAlertPreferencesService>;
        const chatFloatingSvc = TestBed.inject(ChatFloatingService) as jasmine.SpyObj<ChatFloatingService>;
        userSettingsSvc.saveSettings.and.callFake(async (payload: any) => payload);

        fixture.detectChanges();
        tick();

        component.socialAlertsMensajes = false;
        component.socialAlertsAmistad = false;
        component.socialAlertsCampanas = true;
        component.socialAlertsCuentaSistema = false;
        void component.guardarPreferencias();
        tick();

        expect(userSettingsSvc.saveSettings).toHaveBeenCalledWith(jasmine.objectContaining({
            perfil: jasmine.objectContaining({
                notificaciones: {
                    mensajes: false,
                    amistad: false,
                    campanas: true,
                    cuentaSistema: false,
                },
            }),
        }));
        expect(socialAlertPrefsSvc.applyProfileSettings).toHaveBeenCalledWith(jasmine.objectContaining({
            notificaciones: {
                mensajes: false,
                amistad: false,
                campanas: true,
                cuentaSistema: false,
            },
        }));
        expect(chatFloatingSvc.applyProfileSettings).toHaveBeenCalled();
    }));

    it('usa una política mínima y conservadora al abrir nueva campaña', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        component.seleccionarNuevaCampana();

        expect(component.campaignCreatePolicyDraft).toEqual(jasmine.objectContaining({
            tiradaMinimaCaracteristica: 3,
            maxTablasDadosCaracteristicas: 1,
            permitirHomebrewGeneral: false,
            permitirVentajasDesventajas: false,
            permitirIgnorarRestriccionesAlineamiento: false,
            maxFuentesHomebrewGeneralesPorPersonaje: 0,
        }));
        expect(component.campaignWorkspaceMode).toBe('create');
        expect(component.campaignHomebrewMode).toBe('none');
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

        component.seleccionarNuevaCampana();
        component.campaignCreateDraft = 'Nueva';
        component.setCampaignHomebrewMode('limitado');
        component.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje = -2 as any;
        void component.crearCampana();
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

        component.seleccionarNuevaCampana();
        component.campaignCreateDraft = 'Mini';
        void component.crearCampana();
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

        component.seleccionarNuevaCampana();
        component.campaignCreateDraft = '12345';
        void component.crearCampana();
        tick();

        expect(campanaSvc.createCampaign).not.toHaveBeenCalled();
        expect(toastSvc.showError).toHaveBeenCalledWith('El nombre de campaña no puede estar formado solo por números.');
    }));

    it('acota los límites numéricos de campaña al perder foco y no durante la edición', fakeAsync(() => {
        fixture.detectChanges();
        tick();

        component.seleccionarNuevaCampana();
        component.campaignCreatePolicyDraft.tiradaMinimaCaracteristica = null as any;
        component.campaignCreatePolicyDraft.nepMaximoPersonajeNuevo = null as any;
        component.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas = null as any;
        component.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje = 99 as any;

        expect(component.campaignCreatePolicyDraft.tiradaMinimaCaracteristica).toBeNull();
        expect(component.campaignCreatePolicyDraft.nepMaximoPersonajeNuevo).toBeNull();
        expect(component.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas).toBeNull();

        component.campaignCreatePolicyDraft.tiradaMinimaCaracteristica = 99 as any;
        component.campaignCreatePolicyDraft.nepMaximoPersonajeNuevo = -4 as any;
        component.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas = 99 as any;

        component.onCampaignMinimumRollBlur();
        component.onCampaignMaxNepBlur();
        component.onCampaignMaxTablesBlur();
        component.setCampaignHomebrewMode('limitado');
        component.onCampaignHomebrewLimitBlur();

        expect(component.campaignCreatePolicyDraft.tiradaMinimaCaracteristica).toBe(13);
        expect(component.campaignCreatePolicyDraft.nepMaximoPersonajeNuevo).toBe(1);
        expect(component.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas).toBe(5);
        expect(component.campaignCreatePolicyDraft.maxFuentesHomebrewGeneralesPorPersonaje).toBe(20);
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

        expect(component.campaignCreatePolicyDraft.tiradaMinimaCaracteristica).toBe(3);
        expect(component.campaignCreatePolicyDraft.maxTablasDadosCaracteristicas).toBe(1);
        expect(campanaSvc.updateCampaign).toHaveBeenCalledWith(7, {
            politicaCreacion: jasmine.objectContaining({
                tiradaMinimaCaracteristica: 3,
                maxTablasDadosCaracteristicas: 1,
            }),
        });
    }));
});
