import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { fakeAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';

import { UserProfileComponent } from './user-profile.component';
import { AppToastService } from 'src/app/services/app-toast.service';
import { CampanaService } from 'src/app/services/campana.service';
import { CampaignRealtimeSyncService } from 'src/app/services/campaign-realtime-sync.service';
import { ChatApiService } from 'src/app/services/chat-api.service';
import { ChatRealtimeService } from 'src/app/services/chat-realtime.service';
import { UserProfileApiService } from 'src/app/services/user-profile-api.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { UserService } from 'src/app/services/user.service';
import { Auth } from '@angular/fire/auth';

describe('UserProfileComponent', () => {
    let fixture: ComponentFixture<UserProfileComponent>;
    let component: UserProfileComponent;
    let profileSubject: BehaviorSubject<any>;
    let campaignRealtimeEvents$: Subject<any>;
    let userSvc: any;
    let userSettingsSvc: jasmine.SpyObj<UserSettingsService>;

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
        },
    };

    beforeEach(async () => {
        profileSubject = new BehaviorSubject<any>(buildProfile('correo'));
        campaignRealtimeEvents$ = new Subject<any>();
        userSettingsSvc = jasmine.createSpyObj<UserSettingsService>('UserSettingsService', [
            'loadSettings',
            'saveSettings',
            'clearPreviewPlacements',
        ]);
        userSettingsSvc.loadSettings.and.resolveTo(settings);
        userSettingsSvc.saveSettings.and.resolveTo(settings);
        userSettingsSvc.clearPreviewPlacements.and.resolveTo();

        userSvc = {
            currentPrivateProfile$: profileSubject.asObservable(),
            refreshCurrentPrivateProfile: jasmine.createSpy('refreshCurrentPrivateProfile').and.callFake(async () => profileSubject.value),
            setCurrentPrivateProfile: jasmine.createSpy('setCurrentPrivateProfile'),
            can: jasmine.createSpy('can').and.returnValue(true),
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
                        'listVisibleCampaigns',
                        'getCampaignDetail',
                        'recoverCampaignMaster',
                        'createCampaign',
                        'renameCampaign',
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
                    provide: UserProfileNavigationService,
                    useValue: jasmine.createSpyObj<UserProfileNavigationService>('UserProfileNavigationService', ['openSocial']),
                },
                { provide: UserSettingsService, useValue: userSettingsSvc },
                {
                    provide: AppToastService,
                    useValue: jasmine.createSpyObj<AppToastService>('AppToastService', ['showSuccess', 'showError', 'showInfo']),
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
        campanaSvc.listReceivedCampaignInvitations.and.resolveTo([]);
        campanaSvc.getCampaignDetail.and.resolveTo({
            campaign: {
                id: 7,
                nombre: 'Campaña de prueba',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
            ownerUid: 'uid-1',
            ownerDisplayName: 'Yosi',
            activeMasterUid: 'uid-1',
            activeMasterDisplayName: 'Yosi',
            canRecoverMaster: false,
            members: [],
            pendingInvitations: [],
            includeInactiveMembers: false,
            tramas: [],
            loadingInvitations: false,
            loadingMembers: false,
            loadingTramas: false,
        });
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

    it('guarda la identidad completa y actualiza el perfil en memoria', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        apiSvc.updateMyProfile.and.resolveTo({
            ...buildProfile('correo'),
            displayName: 'Nombre nuevo',
            bio: 'Bio nueva',
            genderIdentity: 'Agénero',
            pronouns: 'they',
        } as any);

        fixture.detectChanges();
        tick();

        component.displayNameDraft = '  Nombre nuevo ';
        component.bioDraft = ' Bio nueva ';
        component.genderIdentityDraft = ' Agénero ';
        component.pronounsDraft = ' they ';
        void component.guardarIdentidad();
        tick();

        expect(apiSvc.updateMyProfile).toHaveBeenCalledWith({
            displayName: 'Nombre nuevo',
            bio: 'Bio nueva',
            genderIdentity: 'Agénero',
            pronouns: 'they',
        });
        expect(userSvc.setCurrentPrivateProfile).toHaveBeenCalledWith(jasmine.objectContaining({
            displayName: 'Nombre nuevo',
            bio: 'Bio nueva',
            genderIdentity: 'Agénero',
            pronouns: 'they',
        }));
        expect(component.displayNameDraft).toBe('Nombre nuevo');
        expect(component.bioDraft).toBe('Bio nueva');
        expect(toastSvc.showSuccess).toHaveBeenCalled();
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

    it('permite solicitar ser master cuando el usuario es elegible', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        fixture.detectChanges();
        tick();

        expect(component.canRequestRole).toBeTrue();
        expect(component.requestRoleButtonLabel).toBe('Solicitar ser master');
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
        expect(component.roleRequestStatusLabel).toContain('colaborador');

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
        expect(text).toContain('Solicitud de rol');
        expect(text).toContain('funciones de colaborador');
        expect(text).toContain('Solicitar ser colaborador');
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
        expect(component.roleRequestStatusLabel).toContain('Puedes solicitar convertirte en colaborador');
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
        expect(component.roleRequestStatusLabel).toContain('Puedes solicitar convertirte en colaborador');
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
        expect(text).not.toContain('Solicitud de rol');
    }));

    it('muestra el bloqueo temporal cuando la solicitud fue rechazada', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        apiSvc.getMyRoleRequestStatus.and.resolveTo({
            currentRole: 'jugador',
            requestedRole: 'master',
            status: 'rejected',
            blockedUntilUtc: '2026-04-01T09:30:00.000Z',
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
        expect(text).toContain('Solo los master y colaboradores pueden crear campañas.');
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
        campanaSvc.getCampaignDetail.and.resolveTo({
            campaign: {
                id: 8,
                nombre: 'Costa',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
            ownerUid: 'uid-1',
            ownerDisplayName: 'Yosi',
            activeMasterUid: 'uid-1',
            activeMasterDisplayName: 'Yosi',
            canRecoverMaster: false,
            members: [],
            pendingInvitations: [],
            includeInactiveMembers: false,
            tramas: [],
            loadingInvitations: false,
            loadingMembers: false,
            loadingTramas: false,
        });

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 5 }, false),
        });
        tick();

        expect(component.masterCampaigns.map(item => item.id)).toEqual([8]);
        expect(component.participantCampaigns.map(item => item.id)).toEqual([7]);
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
        campanaSvc.getCampaignDetail.and.resolveTo({
            campaign: {
                id: 7,
                nombre: 'Propia legacy',
                campaignRole: null,
                membershipStatus: null,
                isOwner: true,
            },
            ownerUid: 'uid-1',
            ownerDisplayName: 'Yosi',
            activeMasterUid: null,
            activeMasterDisplayName: null,
            canRecoverMaster: true,
            members: [],
            pendingInvitations: [],
            includeInactiveMembers: false,
            tramas: [],
            loadingInvitations: false,
            loadingMembers: false,
            loadingTramas: false,
        });

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 11 }, false),
        });
        tick();
        fixture.detectChanges();

        expect(component.masterCampaigns).toEqual([]);
        expect(component.participantCampaigns.map(item => item.id)).toEqual([7]);
        expect(component.selectedCampaignSummary?.id).toBe(7);
        expect(component.getCampaignRoleLabel(component.selectedCampaignSummary?.campaignRole, component.selectedCampaignSummary?.isOwner === true))
            .toBe('Creador');
    }));

    it('usa un mensaje vacío neutro en campañas de participación', fakeAsync(() => {
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
        expect(text).toContain('No tienes campañas en este bloque ahora mismo.');
        expect(text).not.toContain('No participas en campañas ajenas ahora mismo.');
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
        component.selectedCampaignDetail = {
            campaign: {
                id: 7,
                nombre: 'Caballeros',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
            ownerUid: 'uid-1',
            ownerDisplayName: 'Yosi',
            activeMasterUid: 'uid-1',
            activeMasterDisplayName: 'Yosi',
            canRecoverMaster: false,
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
            pendingInvitations: [],
            includeInactiveMembers: false,
            tramas: [],
            loadingInvitations: false,
            loadingMembers: false,
            loadingTramas: false,
        };
        component.memberSearchResults = [{
            uid: 'firebase-visible-2',
            displayName: 'Yosi',
            photoThumbUrl: null,
        }];

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
        component.selectedCampaignDetail = {
            campaign: {
                id: 7,
                nombre: 'Caballeros',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
            ownerUid: 'uid-1',
            ownerDisplayName: 'Yosi',
            activeMasterUid: 'uid-1',
            activeMasterDisplayName: 'Yosi',
            canRecoverMaster: false,
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
            includeInactiveMembers: false,
            tramas: [],
            loadingInvitations: false,
            loadingMembers: false,
            loadingTramas: false,
        };
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

    it('acepta una invitación recibida y recarga campañas seleccionando la campaña aceptada', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        const invitation = {
            inviteId: 25,
            status: 'pending' as const,
            createdAtUtc: '2026-03-13T10:15:00.000Z',
            resolvedAtUtc: null,
            campaignId: 9,
            campaignName: 'Costa',
            invitedUser: {
                userId: 'u-1',
                uid: 'uid-1',
                displayName: 'Yosi',
                email: 'yosi@test.dev',
            },
            invitedBy: {
                userId: 'u-2',
                uid: 'uid-master',
                displayName: 'Master',
                email: 'master@test.dev',
            },
            resolvedByUserId: null,
        };
        campanaSvc.listReceivedCampaignInvitations.and.returnValues(
            Promise.resolve([invitation]),
            Promise.resolve([])
        );
        campanaSvc.resolveCampaignInvitation.and.resolveTo({
            message: 'Invitación aceptada',
            invitation: {
                ...invitation,
                status: 'accepted',
                resolvedAtUtc: '2026-03-13T10:20:00.000Z',
                resolvedByUserId: 'u-1',
            },
        });
        campanaSvc.listProfileCampaigns.and.resolveTo([{
            id: 9,
            nombre: 'Costa',
            campaignRole: 'jugador',
            membershipStatus: 'activo',
        }]);
        campanaSvc.getCampaignDetail.and.resolveTo({
            campaign: {
                id: 9,
                nombre: 'Costa',
                campaignRole: 'jugador',
                membershipStatus: 'activo',
            },
            ownerUid: 'uid-owner',
            ownerDisplayName: 'Owner',
            activeMasterUid: 'uid-master',
            activeMasterDisplayName: 'Master',
            canRecoverMaster: false,
            members: [],
            pendingInvitations: [],
            includeInactiveMembers: false,
            tramas: [],
            loadingInvitations: false,
            loadingMembers: false,
            loadingTramas: false,
        });

        fixture.detectChanges();
        tick();

        void component.responderInvitacionCampana(invitation, 'accept');
        tick();

        expect(campanaSvc.resolveCampaignInvitation).toHaveBeenCalledWith(25, 'accept');
        expect(component.selectedCampaignId).toBe(9);
        expect(toastSvc.showSuccess).toHaveBeenCalledWith('Invitación aceptada. Ya formas parte de la campaña.');
    }));

    it('refresca invitaciones recibidas al llegar un evento realtime de invitación nueva', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        campanaSvc.listReceivedCampaignInvitations.and.returnValues(
            Promise.resolve([]),
            Promise.resolve([{
                inviteId: 22,
                status: 'pending',
                createdAtUtc: '2026-03-13T10:15:00.000Z',
                resolvedAtUtc: null,
                campaignId: 7,
                campaignName: 'Campaña de prueba',
                invitedUser: {
                    userId: 'u-1',
                    uid: 'uid-1',
                    displayName: 'Yosi',
                    email: 'yosi@test.dev',
                },
                invitedBy: {
                    userId: 'u-2',
                    uid: 'uid-master',
                    displayName: 'Master',
                    email: 'master@test.dev',
                },
                resolvedByUserId: null,
            }]),
        );

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 21 }, false),
        });
        tick();

        campaignRealtimeEvents$.next({
            code: 'system.campaign_invitation_received',
            campaignId: 7,
            conversationId: null,
            source: 'remote',
        });
        tick(300);

        expect(campanaSvc.listReceivedCampaignInvitations.calls.count()).toBe(2);
        expect(component.receivedCampaignInvitations.length).toBe(1);
        expect(toastSvc.showInfo).toHaveBeenCalledWith('Tus invitaciones de campaña se han actualizado.');
    }));

    it('refresca campañas y detalle al llegar un evento realtime de invitación resuelta', fakeAsync(() => {
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
        );
        campanaSvc.getCampaignDetail.and.returnValues(
            Promise.resolve({
                campaign: {
                    id: 7,
                    nombre: 'Campaña de prueba',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                },
                ownerUid: 'uid-1',
                ownerDisplayName: 'Yosi',
                activeMasterUid: 'uid-1',
                activeMasterDisplayName: 'Yosi',
                canRecoverMaster: false,
                members: [],
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
                includeInactiveMembers: false,
                tramas: [],
                loadingInvitations: false,
                loadingMembers: false,
                loadingTramas: false,
            }),
            Promise.resolve({
                campaign: {
                    id: 7,
                    nombre: 'Campaña de prueba',
                    campaignRole: 'master',
                    membershipStatus: 'activo',
                },
                ownerUid: 'uid-1',
                ownerDisplayName: 'Yosi',
                activeMasterUid: 'uid-1',
                activeMasterDisplayName: 'Yosi',
                canRecoverMaster: false,
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
                includeInactiveMembers: false,
                tramas: [],
                loadingInvitations: false,
                loadingMembers: false,
                loadingTramas: false,
            }),
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

        expect(campanaSvc.listProfileCampaigns.calls.count()).toBe(2);
        expect(campanaSvc.getCampaignDetail.calls.count()).toBe(2);
        expect(component.selectedCampaignDetail?.pendingInvitations).toEqual([]);
        expect(component.selectedCampaignMembers.length).toBe(1);
        expect(toastSvc.showInfo).toHaveBeenCalledWith('La información de campañas se ha actualizado.');
    }));

    it('permite cancelar una invitación pendiente emitida desde el detalle de campaña', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        component.selectedCampaignId = 7;
        component.selectedCampaignDetail = {
            campaign: {
                id: 7,
                nombre: 'Caballeros',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
            ownerUid: 'uid-1',
            ownerDisplayName: 'Yosi',
            activeMasterUid: 'uid-1',
            activeMasterDisplayName: 'Yosi',
            canRecoverMaster: false,
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
            includeInactiveMembers: false,
            tramas: [],
            loadingInvitations: false,
            loadingMembers: false,
            loadingTramas: false,
        };
        campanaSvc.cancelCampaignInvitation.and.resolveTo();
        campanaSvc.getCampaignDetail.and.resolveTo({
            ...(component.selectedCampaignDetail as any),
            pendingInvitations: [],
        });

        void component.cancelarInvitacionCampana(component.selectedCampaignDetail.pendingInvitations[0]);
        tick();

        expect(campanaSvc.cancelCampaignInvitation).toHaveBeenCalledWith(18);
        expect(toastSvc.showSuccess).toHaveBeenCalledWith('Invitación cancelada.');
    }));

    it('si cancelar falla porque la invitación ya cambió, refresca el detalle y muestra aviso no bloqueante', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        const toastSvc = TestBed.inject(AppToastService) as jasmine.SpyObj<AppToastService>;
        component.selectedCampaignId = 7;
        component.selectedCampaignDetail = {
            campaign: {
                id: 7,
                nombre: 'Caballeros',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
            ownerUid: 'uid-1',
            ownerDisplayName: 'Yosi',
            activeMasterUid: 'uid-1',
            activeMasterDisplayName: 'Yosi',
            canRecoverMaster: false,
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
            includeInactiveMembers: false,
            tramas: [],
            loadingInvitations: false,
            loadingMembers: false,
            loadingTramas: false,
        };
        campanaSvc.cancelCampaignInvitation.and.rejectWith(new Error('La invitación ya no está pendiente.'));
        campanaSvc.getCampaignDetail.and.resolveTo({
            ...(component.selectedCampaignDetail as any),
            pendingInvitations: [],
        });

        void component.cancelarInvitacionCampana(component.selectedCampaignDetail.pendingInvitations[0]);
        tick();

        expect(campanaSvc.getCampaignDetail).toHaveBeenCalledWith(7, false);
        expect(toastSvc.showInfo).toHaveBeenCalledWith('La invitación ya había cambiado en otra sesión. Se ha refrescado la campaña.');
        expect(toastSvc.showError).not.toHaveBeenCalled();
    }));

    it('usa la membresía detallada del actor para detectar si realmente es master', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        campanaSvc.listProfileCampaigns.and.resolveTo([{
            id: 7,
            nombre: 'Caballeros',
            campaignRole: 'jugador',
            membershipStatus: 'activo',
        }]);
        campanaSvc.getCampaignDetail.and.resolveTo({
            campaign: {
                id: 7,
                nombre: 'Caballeros',
                campaignRole: 'jugador',
                membershipStatus: 'activo',
            },
            ownerUid: 'uid-1',
            ownerDisplayName: 'Yosi',
            activeMasterUid: 'uid-1',
            activeMasterDisplayName: 'Yosi',
            canRecoverMaster: false,
            members: [{
                userId: 'u-1',
                uid: 'uid-1',
                displayName: 'Yosi',
                email: 'yosi@test.dev',
                campaignRole: 'master',
                membershipStatus: 'activo',
                isActive: true,
                addedAtUtc: null,
                addedByUserId: null,
            }, {
                userId: 'u-2',
                uid: 'uid-2',
                displayName: 'Acompañante',
                email: 'otro@test.dev',
                campaignRole: 'jugador',
                membershipStatus: 'activo',
                isActive: true,
                addedAtUtc: null,
                addedByUserId: null,
            }],
            pendingInvitations: [],
            includeInactiveMembers: false,
            tramas: [],
            loadingInvitations: false,
            loadingMembers: false,
            loadingTramas: false,
        });

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 6 }, false),
        });
        tick();

        expect(component.selectedCampaignActorRole).toBe('master');
        expect(component.selectedCampaignCanManage).toBeTrue();
        expect(component.selectedCampaignCanTransferMaster).toBeTrue();
    }));

    it('no ofrece transferir master si la campaña solo tiene al master activo', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        campanaSvc.listProfileCampaigns.and.resolveTo([{
            id: 7,
            nombre: 'Caballeros',
            campaignRole: 'master',
            membershipStatus: 'activo',
        }]);
        campanaSvc.getCampaignDetail.and.resolveTo({
            campaign: {
                id: 7,
                nombre: 'Caballeros',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
            ownerUid: 'uid-1',
            ownerDisplayName: 'Yosi',
            activeMasterUid: 'uid-1',
            activeMasterDisplayName: 'Yosi',
            canRecoverMaster: false,
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
            pendingInvitations: [],
            includeInactiveMembers: false,
            tramas: [],
            loadingInvitations: false,
            loadingMembers: false,
            loadingTramas: false,
        });

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
        campanaSvc.getCampaignDetail.and.resolveTo({
            campaign: {
                id: 7,
                nombre: 'Caballeros',
                campaignRole: 'jugador',
                membershipStatus: 'activo',
            },
            ownerUid: 'uid-1',
            ownerDisplayName: 'Yosi',
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
            pendingInvitations: [],
            includeInactiveMembers: false,
            tramas: [],
            loadingInvitations: false,
            loadingMembers: false,
            loadingTramas: false,
        });

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 7 }, false),
        });
        tick();

        expect(component.selectedCampaignCanManage).toBeFalse();
        expect(component.selectedCampaignCanTransferMaster).toBeFalse();
        expect(component.selectedCampaignCanRecoverMaster).toBeTrue();
    }));

    it('permite recuperar master en legacy si ownerUid coincide aunque canRecoverMaster venga false', fakeAsync(() => {
        const campanaSvc = TestBed.inject(CampanaService) as jasmine.SpyObj<CampanaService>;
        campanaSvc.listProfileCampaigns.and.resolveTo([{
            id: 7,
            nombre: 'Legacy',
            campaignRole: 'jugador',
            membershipStatus: 'activo',
        }]);
        campanaSvc.getCampaignDetail.and.resolveTo({
            campaign: {
                id: 7,
                nombre: 'Legacy',
                campaignRole: 'jugador',
                membershipStatus: 'activo',
            },
            ownerUid: 'uid-1',
            ownerDisplayName: 'Yosi',
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
            pendingInvitations: [],
            includeInactiveMembers: false,
            tramas: [],
            loadingInvitations: false,
            loadingMembers: false,
            loadingTramas: false,
        });

        fixture.detectChanges();
        tick();
        component.ngOnChanges({
            openRequest: new SimpleChange(null, { section: 'campanas', requestId: 8 }, false),
        });
        tick();

        expect(component.selectedCampaignOwnerMatchesCurrentUser).toBeTrue();
        expect(component.selectedCampaignCanRecoverMaster).toBeTrue();
    }));

    it('permite editar allowDirectMessagesFromNonFriends al guardar preferencias', fakeAsync(() => {
        const persistedSettings = {
            ...settings,
            perfil: {
                ...settings.perfil,
                allowDirectMessagesFromNonFriends: false,
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
});
