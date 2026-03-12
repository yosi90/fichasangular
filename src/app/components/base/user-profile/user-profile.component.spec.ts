import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { fakeAsync, ComponentFixture, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

import { UserProfileComponent } from './user-profile.component';
import { AppToastService } from 'src/app/services/app-toast.service';
import { CampanaService } from 'src/app/services/campana.service';
import { UserProfileApiService } from 'src/app/services/user-profile-api.service';
import { UserSettingsService } from 'src/app/services/user-settings.service';
import { UserService } from 'src/app/services/user.service';
import { Auth } from '@angular/fire/auth';

describe('UserProfileComponent', () => {
    let fixture: ComponentFixture<UserProfileComponent>;
    let component: UserProfileComponent;
    let profileSubject: BehaviorSubject<any>;
    let userSvc: any;
    let userSettingsSvc: jasmine.SpyObj<UserSettingsService>;

    const buildProfile = (authProvider: 'correo' | 'google') => ({
        uid: 'uid-1',
        displayName: 'Yosi',
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
                        'updateDisplayName',
                    ]),
                },
                {
                    provide: CampanaService,
                    useValue: jasmine.createSpyObj<CampanaService>('CampanaService', [
                        'listVisibleCampaigns',
                        'getCampaignDetail',
                        'createCampaign',
                        'renameCampaign',
                        'searchUsers',
                        'addCampaignMember',
                        'removeCampaignMember',
                        'transferCampaignMaster',
                        'createTrama',
                        'updateTrama',
                        'createSubtrama',
                        'updateSubtrama',
                    ]),
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
            adminComment: null,
        });
        campanaSvc.listVisibleCampaigns.and.resolveTo([{
            id: 7,
            nombre: 'Campaña de prueba',
            campaignRole: 'master',
            membershipStatus: 'activo',
        }]);
        campanaSvc.getCampaignDetail.and.resolveTo({
            campaign: {
                id: 7,
                nombre: 'Campaña de prueba',
                campaignRole: 'master',
                membershipStatus: 'activo',
            },
            members: [],
            includeInactiveMembers: false,
            tramas: [],
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

    it('permite solicitar ser master cuando el usuario es elegible', fakeAsync(() => {
        const apiSvc = TestBed.inject(UserProfileApiService) as jasmine.SpyObj<UserProfileApiService>;
        fixture.detectChanges();
        tick();

        expect(component.canRequestRole).toBeTrue();
        expect(component.requestRoleButtonLabel).toBe('Solicitar ser master');

        void component.solicitarCambioRol();
        tick();

        expect(apiSvc.createRoleRequest).toHaveBeenCalledWith('master');
        expect(component.roleRequestStatus?.status).toBe('pending');
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
            adminComment: null,
        });

        fixture.detectChanges();
        tick();

        expect(component.requestedRoleTarget).toBe('colaborador');
        expect(component.canRequestRole).toBeTrue();
        expect(component.roleRequestStatusLabel).toContain('colaborador');

        void component.solicitarCambioRol();
        tick();

        expect(apiSvc.createRoleRequest).toHaveBeenCalledWith('colaborador');
        expect(component.roleRequestStatus?.requestedRole).toBe('colaborador');
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

    it('preserva allowDirectMessagesFromNonFriends al guardar preferencias', fakeAsync(() => {
        const persistedSettings = {
            ...settings,
            perfil: {
                ...settings.perfil,
                allowDirectMessagesFromNonFriends: true,
            },
        };
        userSettingsSvc.loadSettings.and.resolveTo(persistedSettings as any);
        userSettingsSvc.saveSettings.and.callFake(async (payload: any) => payload);

        fixture.detectChanges();
        tick();

        component.mostrarPerfilPublico = false;
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
