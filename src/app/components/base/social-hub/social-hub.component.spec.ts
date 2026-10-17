import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs';
import Swal from 'sweetalert2';
import { SocialHubComponent } from './social-hub.component';
import { AppToastService } from 'src/app/services/app-toast.service';
import { CampanaService } from 'src/app/services/campana.service';
import { CampaignRealtimeSyncService } from 'src/app/services/campaign-realtime-sync.service';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { PlatformSpacesService } from 'src/app/services/platform-spaces.service';
import { SocialRealtimeService } from 'src/app/services/social-realtime.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { UserService } from 'src/app/services/user.service';
import { ApiActionGuardService } from 'src/app/services/api-action-guard.service';

describe('SocialHubComponent', () => {
    let fixture: ComponentFixture<SocialHubComponent>;
    let component: SocialHubComponent;
    let isLoggedIn$: BehaviorSubject<boolean>;
    let chatFloatingSvc: jasmine.SpyObj<ChatFloatingService>;
    let campanaSvc: jasmine.SpyObj<CampanaService>;
    let campaignRealtimeSyncSvc: jasmine.SpyObj<CampaignRealtimeSyncService>;
    let userProfileNavSvc: jasmine.SpyObj<UserProfileNavigationService>;
    let apiActionGuardSvc: jasmine.SpyObj<ApiActionGuardService>;
    let appToastSvc: jasmine.SpyObj<AppToastService>;
    let platformSessionSvc: jasmine.SpyObj<PlatformSessionService>;
    let platformSpacesSvc: jasmine.SpyObj<PlatformSpacesService>;

    beforeEach(async () => {
        sessionStorage.clear();
        isLoggedIn$ = new BehaviorSubject<boolean>(false);
        campanaSvc = jasmine.createSpyObj<CampanaService>('CampanaService', [
            'listSocialCampaigns',
            'getCampaignDetail',
            'getCampaignConversation',
            'getCampaignEntry',
            'syncMembership',
        ]);
        campanaSvc.listSocialCampaigns.and.resolveTo([]);
        campanaSvc.syncMembership.and.resolveTo();
        platformSpacesSvc = jasmine.createSpyObj<PlatformSpacesService>('PlatformSpacesService', [
            'misInvitaciones',
            'aceptarInvitacion',
            'rechazarInvitacion',
            'pedirEntrar',
            'salir',
            'responderTraspaso',
        ]);
        platformSpacesSvc.misInvitaciones.and.resolveTo([]);
        campanaSvc.getCampaignConversation.and.resolveTo({ conversacionId: 'conv-4', idExterno: 'campana-4' });
        campanaSvc.getCampaignDetail.and.resolveTo({
            campaign: {
                id: 4,
                nombre: 'Caballeros de Cormyr',
                campaignRole: 'jugador',
                membershipStatus: 'activo',
            },
            ownerUid: 'uid-master',
            ownerDisplayName: 'MrYosi90',
            activeMasterUid: 'uid-master',
            activeMasterDisplayName: 'MrYosi90',
            espacio: { id: 41, entrada: 'invitacion' },
            politicaCreacion: {
                tiradaMinimaCaracteristica: null,
                maxTablasDadosCaracteristicas: null,
                permitirHomebrewGeneral: true,
                permitirVentajasDesventajas: true,
                permitirIgnorarRestriccionesAlineamiento: false,
                maxFuentesHomebrewGeneralesPorPersonaje: null,
            },
            members: [],
            pendingInvitations: [],
            joinRequests: [],
            pendingTransfer: null,
            includeInactiveMembers: false,
            tramas: [],
            loadingInvitations: false,
            loadingMembers: false,
            loadingTramas: false,
        } as any);
        campaignRealtimeSyncSvc = jasmine.createSpyObj<CampaignRealtimeSyncService>('CampaignRealtimeSyncService', [], {
            events$: new Subject<any>().asObservable(),
        });

        userProfileNavSvc = jasmine.createSpyObj<UserProfileNavigationService>('UserProfileNavigationService', ['openPublicProfile', 'openSocial', 'openPrivateProfile']);
        apiActionGuardSvc = jasmine.createSpyObj<ApiActionGuardService>('ApiActionGuardService', ['shouldAllow', 'getBlockedMessage', 'getBlockedToastDedupeKey']);
        apiActionGuardSvc.shouldAllow.and.returnValue({
            status: 'allowed',
            blockedUntil: null,
            blocksToday: 0,
            newlyBlocked: false,
        });
        apiActionGuardSvc.getBlockedMessage.and.returnValue('Hemos observado un comportamiento inusual en esta sesión.');
        apiActionGuardSvc.getBlockedToastDedupeKey.and.returnValue('api-action-guard.uid-1.toast.cooldown');
        appToastSvc = jasmine.createSpyObj<AppToastService>('AppToastService', ['showSuccess', 'showError', 'showInfo', 'showSystem']);
        platformSessionSvc = jasmine.createSpyObj<PlatformSessionService>('PlatformSessionService', ['denunciar', 'urlSocial']);
        platformSessionSvc.denunciar.and.resolveTo(true);
        platformSessionSvc.urlSocial.and.returnValue('https://qa-social.yosiftware.es');

        chatFloatingSvc = jasmine.createSpyObj<ChatFloatingService>('ChatFloatingService', ['abrir']);
        chatFloatingSvc.abrir.and.resolveTo(true);

        await TestBed.configureTestingModule({
            declarations: [SocialHubComponent],
            imports: [FormsModule],
            providers: [
                {
                    provide: UserService,
                    useValue: {
                        isLoggedIn$,
                        CurrentUserUid: 'uid-1',
                        getAccessRestrictionMessage: jasmine.createSpy('getAccessRestrictionMessage').and.returnValue(''),
                        getComplianceErrorMessage: jasmine.createSpy('getComplianceErrorMessage').and.returnValue(''),
                    },
                },
                { provide: CampanaService, useValue: campanaSvc },
                { provide: CampaignRealtimeSyncService, useValue: campaignRealtimeSyncSvc },
                {
                    provide: SocialRealtimeService,
                    useValue: {
                        activate: jasmine.createSpy('activate'),
                        deactivate: jasmine.createSpy('deactivate'),
                        events$: new Subject<any>().asObservable(),
                        refetchRequested$: new Subject<void>().asObservable(),
                    },
                },
                { provide: UserProfileNavigationService, useValue: userProfileNavSvc },
                { provide: ApiActionGuardService, useValue: apiActionGuardSvc },
                { provide: AppToastService, useValue: appToastSvc },
                { provide: ChatFloatingService, useValue: chatFloatingSvc },
                { provide: PlatformSessionService, useValue: platformSessionSvc },
                { provide: PlatformSpacesService, useValue: platformSpacesSvc },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(SocialHubComponent);
        component = fixture.componentInstance;
    });

    it('deja solo lo que sigue siendo de Rol: resumen, comunidad, convocatorias y campañas', () => {
        fixture.detectChanges();

        expect(component.sections.map((item) => item.id)).toEqual([
            'resumen',
            'comunidad',
            'convocatorias',
            'campanas',
        ]);
    });

    it('abre el chat de la campaña en el chat de la plataforma', fakeAsync(() => {
        campanaSvc.listSocialCampaigns.and.resolveTo([
            { id: 4, nombre: 'Caballeros de Cormyr', campaignRole: 'jugador', membershipStatus: 'activo' },
        ] as any);
        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();
        component.selectedCampaignId = 4;
        spyOnProperty(component, 'canOpenSelectedCampaignChat').and.returnValue(true);

        void component.openSelectedCampaignChat();
        tick();

        expect(campanaSvc.getCampaignConversation).toHaveBeenCalledWith(4);
        expect(chatFloatingSvc.abrir).toHaveBeenCalledWith('conv-4');
    }));

    it('lleva los mensajes al chat de la plataforma', () => {
        fixture.detectChanges();

        component.ngOnChanges({
            openRequest: { currentValue: { section: 'mensajes', requestId: 1 } } as any,
        });

        expect(chatFloatingSvc.abrir).toHaveBeenCalled();
        expect(component.currentSection).toBe('resumen');
    });

    it('denuncia a otra persona de la campaña, pero no a uno mismo', fakeAsync(() => {
        const otra = { uid: 'uid-2', displayName: 'Yuna' } as any;
        const yo = { uid: 'uid-1', displayName: 'Yo' } as any;

        expect(component.canReportCampaignMember(yo)).toBeFalse();
        expect(component.canReportCampaignMember(otra)).toBeTrue();

        void component.reportCampaignMember(otra);
        tick();

        expect(platformSessionSvc.denunciar).toHaveBeenCalledWith(jasmine.objectContaining({
            tipo: 'persona',
            referencia: 'uid-2',
            nombre: 'Yuna',
        }));
    }));

    it('mantiene campañas visibles aunque falle la carga de invitaciones', fakeAsync(() => {
        campanaSvc.listSocialCampaigns.and.resolveTo([
            { id: 4, nombre: 'Caballeros de Cormyr', campaignRole: 'master', membershipStatus: 'activo' },
        ] as any);
        platformSpacesSvc.misInvitaciones.and.rejectWith(new Error('Fallo invitaciones'));

        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();

        component.selectSection('campanas');
        tick();

        expect(component.campaigns.map((item: any) => item.id)).toEqual([4]);
        expect(component.campaignInvitations).toEqual([]);
        expect(component.campaignInvitationsErrorMessage).toBe('Fallo invitaciones');
        expect(component.campaignsErrorMessage).toBe('');
    }));

    it('acepta una invitación en la plataforma, pone al día la campaña y la abre', fakeAsync(() => {
        const invitation = { id: 9, espacio: { id: 41, idExterno: 'campana-4', nombre: 'Caballeros de Cormyr' }, de: { cuenta: 'uid-master', nombre: 'MrYosi90' }, miembros: 2, caduca: null };
        platformSpacesSvc.aceptarInvitacion.and.resolveTo();
        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();
        campanaSvc.listSocialCampaigns.and.resolveTo([
            { id: 4, nombre: 'Caballeros de Cormyr', campaignRole: 'jugador', membershipStatus: 'activo' },
        ] as any);

        void component.respondCampaignInvitation(invitation, 'aceptar');
        tick();

        expect(platformSpacesSvc.aceptarInvitacion).toHaveBeenCalledWith(9);
        expect(campanaSvc.syncMembership).toHaveBeenCalledWith(4);
        expect(component.selectedCampaignId).toBe(4);
    }));

    it('un jugador sale de la campaña en la plataforma; el máster no ve esa opción', fakeAsync(() => {
        campanaSvc.listSocialCampaigns.and.resolveTo([
            { id: 4, nombre: 'Caballeros de Cormyr', campaignRole: 'jugador', membershipStatus: 'activo' },
        ] as any);
        platformSpacesSvc.salir.and.resolveTo();
        const swal = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();
        component.selectSection('campanas');
        tick();

        expect(component.selectedCampaignCanLeave).toBeTrue();
        void component.leaveSelectedCampaign();
        tick();

        expect(swal).toHaveBeenCalled();
        expect(platformSpacesSvc.salir).toHaveBeenCalledWith(41);
        expect(campanaSvc.syncMembership).toHaveBeenCalledWith(4);
    }));

    it('desde el enlace de una campaña con solicitudes ofrece pedir entrar', fakeAsync(() => {
        campanaSvc.getCampaignEntry.and.resolveTo({
            idCampana: 7, nombre: 'La tumba', masterDisplayName: 'Ana', esMiembro: false, espacio: { id: 50, entrada: 'solicitud' },
        });
        platformSpacesSvc.pedirEntrar.and.resolveTo();
        fixture.detectChanges();
        isLoggedIn$.next(true);
        tick();

        component.ngOnChanges({ openRequest: { currentValue: { section: 'campanas', campaignId: 7, requestId: 1 } } as any });
        component.openRequest = { section: 'campanas', campaignId: 7, requestId: 1 } as any;
        tick();

        expect(component.entryCandidate?.nombre).toBe('La tumba');
        component.entryRequestMessage = 'Hola, me apunto';
        void component.requestCampaignEntry();
        tick();

        expect(platformSpacesSvc.pedirEntrar).toHaveBeenCalledWith(50, 'Hola, me apunto');
        expect(component.entryRequestSent).toBeTrue();
    }));

    it('activa el realtime social solo cuando la sesión está abierta', fakeAsync(() => {
        const socialRealtimeSvc = TestBed.inject(SocialRealtimeService) as jasmine.SpyObj<SocialRealtimeService>;
        fixture.detectChanges();

        expect(socialRealtimeSvc.activate).not.toHaveBeenCalled();

        isLoggedIn$.next(true);
        tick();

        expect(socialRealtimeSvc.activate).toHaveBeenCalled();

        isLoggedIn$.next(false);
        tick();

        expect(socialRealtimeSvc.deactivate).toHaveBeenCalled();
    }));

});
