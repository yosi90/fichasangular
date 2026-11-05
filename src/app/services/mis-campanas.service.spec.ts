import { BehaviorSubject } from 'rxjs';
import { MisCampanasService } from './mis-campanas.service';

describe('MisCampanasService', () => {
    let logueado$: BehaviorSubject<boolean>;
    let perfil$: BehaviorSubject<any>;
    let permisos$: BehaviorSubject<number>;
    let rol: string;
    let emitir: ((campanas: any[]) => void) | null;
    let parar: jasmine.Spy;
    let campanaSvc: any;
    let servicio: MisCampanasService;
    let vistos: boolean[];

    beforeEach(() => {
        logueado$ = new BehaviorSubject<boolean>(false);
        perfil$ = new BehaviorSubject<any>(null);
        permisos$ = new BehaviorSubject<number>(0);
        rol = 'jugador';
        emitir = null;
        parar = jasmine.createSpy('parar');
        campanaSvc = {
            watchCampaignSummaries: jasmine.createSpy('watchCampaignSummaries').and.callFake((next: any) => {
                emitir = next;
                return parar;
            }),
            hasActiveMembership: (campana: any) => campana?.membershipStatus === 'activo',
        };
        const userSvc = {
            isLoggedIn$: logueado$,
            currentPrivateProfile$: perfil$,
            permisos$,
            get IsLoggedIn() { return logueado$.value; },
            getCurrentRole: () => rol,
        } as any;
        servicio = new MisCampanasService(userSvc, campanaSvc);
        vistos = [];
        servicio.visible$.subscribe((visible) => vistos.push(visible));
    });

    afterEach(() => servicio.ngOnDestroy());

    it('sin sesión no se ve ni se escuchan las campañas', () => {
        expect(servicio.visible).toBeFalse();
        expect(campanaSvc.watchCampaignSummaries).not.toHaveBeenCalled();
    });

    it('se ve con el rol de máster, colaborador o admin, sin escuchar las campañas', () => {
        for (const conCampanas of ['master', 'colaborador', 'admin']) {
            rol = conCampanas;
            logueado$.next(true);
            expect(servicio.visible).withContext(conCampanas).toBeTrue();
            logueado$.next(false);
        }
        expect(campanaSvc.watchCampaignSummaries).not.toHaveBeenCalled();
    });

    it('un jugador la ve si es miembro activo de alguna campaña, y deja de escucharlas al salir', () => {
        logueado$.next(true);
        expect(servicio.visible).toBeFalse();
        expect(campanaSvc.watchCampaignSummaries).toHaveBeenCalledTimes(1);

        emitir!([{ membershipStatus: 'expulsado' }]);
        expect(servicio.visible).toBeFalse();
        emitir!([{ membershipStatus: 'expulsado' }, { membershipStatus: 'activo' }]);
        expect(servicio.visible).toBeTrue();

        perfil$.next({ displayName: 'Aldric' });
        expect(campanaSvc.watchCampaignSummaries).toHaveBeenCalledTimes(1);

        logueado$.next(false);
        expect(parar).toHaveBeenCalled();
        expect(servicio.visible).toBeFalse();

        // Lo que llegue tarde de la cuenta anterior no cuenta.
        emitir!([{ membershipStatus: 'activo' }]);
        expect(servicio.visible).toBeFalse();
        expect(vistos).toEqual([false, true, false]);
    });

    it('si el jugador pasa a máster, deja de escuchar las campañas', () => {
        logueado$.next(true);
        rol = 'master';
        permisos$.next(0);

        expect(parar).toHaveBeenCalled();
        expect(servicio.visible).toBeTrue();
    });
});
