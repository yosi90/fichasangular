import { BehaviorSubject } from 'rxjs';
import { PublicUserProfileComponent } from './public-user-profile.component';
import { PlatformSocialError, RelacionPlataforma } from 'src/app/services/platform-social.service';

describe('PublicUserProfileComponent', () => {
    let component: PublicUserProfileComponent;
    let socialV3ApiSvc: any;
    let platformSocialSvc: any;
    let platformSessionSvc: any;
    let userSvc: any;
    let appToastSvc: any;
    let isLoggedIn$: BehaviorSubject<boolean>;

    const perfilRol = {
        profile: { uid: 'uid-2', displayName: 'Yuna', photoThumbUrl: null, bio: null, pronouns: null, joinedAtUtc: '2026-01-02T00:00:00Z' },
        relationship: { state: 'none', mutualFriendsCount: 1, mutualCampaignsCount: 2 },
        visibility: { showAuthenticatedBlock: true, showFriendsBlock: false },
        stats: { totalCharacters: 3, publicCharacters: 1, activeCampaigns: 1, campaignsAsMaster: 0, campaignsCreated: 0 },
    };
    const sinRelacion: RelacionPlataforma = { amistad: 'ninguna', idSolicitud: null, sigo: false, meSigue: false, bloqueada: false };

    function crear(logueado = true): void {
        isLoggedIn$ = new BehaviorSubject<boolean>(logueado);
        userSvc = { IsLoggedIn: logueado, isLoggedIn$ };
        component = new PublicUserProfileComponent(socialV3ApiSvc, platformSocialSvc, platformSessionSvc, userSvc, appToastSvc);
        component.uid = 'uid-2';
        component.isLoggedIn = logueado;
    }

    beforeEach(() => {
        socialV3ApiSvc = jasmine.createSpyObj('SocialV3ApiService', ['getRelationshipProfile']);
        socialV3ApiSvc.getRelationshipProfile.and.resolveTo(perfilRol);
        platformSocialSvc = jasmine.createSpyObj('PlatformSocialService', [
            'relacion', 'perfil', 'pedirAmistad', 'responderSolicitud', 'retirarSolicitud', 'dejarAmistad', 'seguir', 'bloquear',
        ]);
        platformSocialSvc.relacion.and.resolveTo(sinRelacion);
        platformSocialSvc.perfil.and.resolveTo({ id: 'uid-2', alias: 'yuna', nombre: 'Yuna', biografia: 'Barda', pronombres: 'ella', privado: false });
        platformSocialSvc.pedirAmistad.and.resolveTo();
        platformSocialSvc.responderSolicitud.and.resolveTo();
        platformSocialSvc.bloquear.and.resolveTo();
        platformSessionSvc = jasmine.createSpyObj('PlatformSessionService', ['entrar', 'denunciar', 'urlSocial']);
        platformSessionSvc.entrar.and.resolveTo(true);
        platformSessionSvc.denunciar.and.resolveTo(true);
        platformSessionSvc.urlSocial.and.returnValue('https://qa-social.yosiftware.es');
        appToastSvc = jasmine.createSpyObj('AppToastService', ['showSuccess', 'showError']);
    });

    afterEach(() => component?.ngOnDestroy());

    it('sin sesión no pide nada y ofrece entrar', async () => {
        crear(false);
        component.ngOnInit();
        await component.cargar();

        expect(socialV3ApiSvc.getRelationshipProfile).not.toHaveBeenCalled();
        expect(component.relationshipProfile).toBeNull();
        component.entrar();
        expect(platformSessionSvc.entrar).toHaveBeenCalled();
    });

    it('junta la ficha de Rol con la biografía y la relación de la plataforma', async () => {
        crear();
        await component.cargar();

        expect(component.profileLabel).toBe('Yuna');
        expect(component.bio).toBe('Barda');
        expect(component.pronouns).toBe('ella');
        expect(component.relacion).toEqual(sinRelacion);
        expect(component.sharedItems.map((item) => item.value)).toEqual([1, 2]);
    });

    it('pide amistad en la plataforma y recarga la relación', async () => {
        crear();
        await component.cargar();

        await component.pedirAmistad();

        expect(platformSocialSvc.pedirAmistad).toHaveBeenCalledWith('uid-2');
        expect(platformSocialSvc.relacion).toHaveBeenCalledTimes(2);
        expect(appToastSvc.showSuccess).toHaveBeenCalled();
    });

    it('acepta la solicitud recibida con su id', async () => {
        platformSocialSvc.relacion.and.resolveTo({ ...sinRelacion, amistad: 'solicitud_recibida', idSolicitud: 12 });
        crear();
        await component.cargar();

        await component.aceptarSolicitud();

        expect(platformSocialSvc.responderSolicitud).toHaveBeenCalledWith(12, 'aceptar');
    });

    it('enseña el error de la plataforma sin romper la ficha', async () => {
        platformSocialSvc.pedirAmistad.and.rejectWith(new PlatformSocialError('Ya le has pedido amistad.', 'solicitud_ya_enviada', 409));
        crear();
        await component.cargar();

        await component.pedirAmistad();

        expect(appToastSvc.showError).toHaveBeenCalledWith('Ya le has pedido amistad.');
    });

    it('si la tienes bloqueada, la API no la enseña pero se puede desbloquear', async () => {
        socialV3ApiSvc.getRelationshipProfile.and.rejectWith(new Error('El perfil de comunidad no esta disponible.'));
        platformSocialSvc.relacion.and.resolveTo({ ...sinRelacion, bloqueada: true });
        crear();
        await component.cargar();

        expect(component.relationshipProfile).toBeNull();
        expect(component.isBlockedByMe).toBeTrue();
        expect(component.errorMessage).toBe('');

        await component.desbloquear();
        expect(platformSocialSvc.bloquear).toHaveBeenCalledWith('uid-2', false);
    });

    it('denuncia a la persona con la ventana de la plataforma', async () => {
        crear();
        await component.cargar();

        await component.denunciar();

        expect(platformSessionSvc.denunciar).toHaveBeenCalledWith({ tipo: 'persona', referencia: 'uid-2', nombre: 'Yuna' });
    });
});
