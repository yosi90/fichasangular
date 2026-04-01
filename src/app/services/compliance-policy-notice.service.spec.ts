import { BehaviorSubject } from 'rxjs';
import Swal from 'sweetalert2';
import { CompliancePolicyNoticeService } from './compliance-policy-notice.service';

describe('CompliancePolicyNoticeService', () => {
    let service: CompliancePolicyNoticeService;
    let isLoggedIn$: BehaviorSubject<boolean>;
    let currentPrivateProfile$: BehaviorSubject<any>;
    let userProfileNavSvc: jasmine.SpyObj<any>;

    beforeEach(() => {
        isLoggedIn$ = new BehaviorSubject<boolean>(false);
        currentPrivateProfile$ = new BehaviorSubject<any>(null);
        userProfileNavSvc = jasmine.createSpyObj('UserProfileNavigationService', ['openPrivateProfile']);

        service = new CompliancePolicyNoticeService(
            {
                isLoggedIn$,
                currentPrivateProfile$,
                get CurrentPrivateProfile() {
                    return currentPrivateProfile$.value;
                },
            } as any,
            userProfileNavSvc as any,
        );
    });

    it('avisa y ofrece abrir el perfil cuando la sesión exige aceptar normas de uso', async () => {
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        service.init();

        isLoggedIn$.next(true);
        currentPrivateProfile$.next({
            uid: 'uid-1',
            compliance: {
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: { version: '4' },
                creation: null,
            },
        });
        await Promise.resolve();
        await Promise.resolve();

        expect(Swal.fire).toHaveBeenCalled();
        expect((Swal.fire as jasmine.Spy).calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
            title: 'Debes aceptar los términos de uso',
            text: 'Para poder usar la web debes aceptar los términos de uso vigentes.',
        }));
        expect(userProfileNavSvc.openPrivateProfile).toHaveBeenCalledWith(jasmine.objectContaining({
            section: 'resumen',
        }));
    });

    it('no repite el aviso para la misma política pendiente dentro de la misma sesión', async () => {
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);
        service.init();

        isLoggedIn$.next(true);
        currentPrivateProfile$.next({
            uid: 'uid-1',
            compliance: {
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: { version: '4' },
                creation: null,
            },
        });
        await Promise.resolve();
        await Promise.resolve();

        currentPrivateProfile$.next({
            uid: 'uid-1',
            compliance: {
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: { version: '4' },
                creation: null,
            },
        });
        await Promise.resolve();
        await Promise.resolve();

        expect(Swal.fire).toHaveBeenCalledTimes(1);
        expect(userProfileNavSvc.openPrivateProfile).not.toHaveBeenCalled();
    });

    it('vuelve a avisar si cambia la versión pendiente o si reaparece en otra sesión', async () => {
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);
        service.init();

        isLoggedIn$.next(true);
        currentPrivateProfile$.next({
            uid: 'uid-1',
            compliance: {
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: { version: '4' },
                creation: null,
            },
        });
        await Promise.resolve();
        await Promise.resolve();

        currentPrivateProfile$.next({
            uid: 'uid-1',
            compliance: {
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: { version: '5' },
                creation: null,
            },
        });
        await Promise.resolve();
        await Promise.resolve();

        isLoggedIn$.next(false);
        isLoggedIn$.next(true);
        currentPrivateProfile$.next({
            uid: 'uid-1',
            compliance: {
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: { version: '5' },
                creation: null,
            },
        });
        await Promise.resolve();
        await Promise.resolve();

        expect(Swal.fire).toHaveBeenCalledTimes(3);
    });

    it('usa un copy de actualización cuando la política pendiente ya tuvo una aceptación previa', async () => {
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);
        service.init();

        isLoggedIn$.next(true);
        currentPrivateProfile$.next({
            uid: 'uid-1',
            compliance: {
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: false,
                activeSanction: null,
                usage: {
                    version: '5',
                    accepted: false,
                    acceptedAtUtc: '2026-03-01T10:00:00Z',
                },
                creation: null,
            },
        });
        await Promise.resolve();
        await Promise.resolve();

        expect((Swal.fire as jasmine.Spy).calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
            title: 'Los términos de uso han sido actualizados',
            text: 'Para poder usar la web debes aceptar los términos de uso vigentes.',
        }));
    });

    it('también avisa si el perfil ya estaba cargado antes de que la sesión quede marcada como logeada', async () => {
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);
        service.init();

        currentPrivateProfile$.next({
            uid: 'uid-1',
            compliance: {
                banned: false,
                mustAcceptUsage: false,
                mustAcceptCreation: true,
                activeSanction: null,
                usage: null,
                creation: { version: '2' },
            },
        });
        await Promise.resolve();
        await Promise.resolve();

        isLoggedIn$.next(true);
        await Promise.resolve();
        await Promise.resolve();

        expect(Swal.fire).toHaveBeenCalledTimes(1);
    });

    it('no vuelve a abrir la alerta durante el mismo flujo de revisión si aún queda otra política pendiente', async () => {
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        service.init();

        isLoggedIn$.next(true);
        currentPrivateProfile$.next({
            uid: 'uid-1',
            compliance: {
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: true,
                activeSanction: null,
                usage: { version: '4' },
                creation: { version: '2' },
            },
        });
        await Promise.resolve();
        await Promise.resolve();

        currentPrivateProfile$.next({
            uid: 'uid-1',
            compliance: {
                banned: false,
                mustAcceptUsage: false,
                mustAcceptCreation: true,
                activeSanction: null,
                usage: { version: '4', acceptedAtUtc: '2026-04-01T10:00:00Z' },
                creation: { version: '2' },
            },
        });
        await Promise.resolve();
        await Promise.resolve();

        expect(Swal.fire).toHaveBeenCalledTimes(1);
        expect(userProfileNavSvc.openPrivateProfile).toHaveBeenCalledTimes(1);
    });

    it('recupera el aviso en una sesión posterior si sigue quedando alguna política pendiente', async () => {
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
        service.init();

        isLoggedIn$.next(true);
        currentPrivateProfile$.next({
            uid: 'uid-1',
            compliance: {
                banned: false,
                mustAcceptUsage: true,
                mustAcceptCreation: true,
                activeSanction: null,
                usage: { version: '4' },
                creation: { version: '2' },
            },
        });
        await Promise.resolve();
        await Promise.resolve();

        currentPrivateProfile$.next({
            uid: 'uid-1',
            compliance: {
                banned: false,
                mustAcceptUsage: false,
                mustAcceptCreation: true,
                activeSanction: null,
                usage: { version: '4', acceptedAtUtc: '2026-04-01T10:00:00Z' },
                creation: { version: '2' },
            },
        });
        await Promise.resolve();
        await Promise.resolve();

        isLoggedIn$.next(false);
        isLoggedIn$.next(true);
        await Promise.resolve();
        await Promise.resolve();

        expect(Swal.fire).toHaveBeenCalledTimes(2);
    });
});
