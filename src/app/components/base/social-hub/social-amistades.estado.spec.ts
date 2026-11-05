import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import Swal from 'sweetalert2';
import { PersonaPlataforma, PlatformSocialError } from 'src/app/services/platform-social.service';
import { ESPERA_BUSQUEDA_MS, SocialAmistadesEstado } from './social-amistades.estado';

describe('SocialAmistadesEstado', () => {
    const yuna: PersonaPlataforma = { id: 'c-yuna', alias: 'yuna', nombre: 'Yuna', privado: false, avatar: null };
    const brenna: PersonaPlataforma = {
        id: 'c-brenna', alias: 'brenna', nombre: null, privado: true,
        avatar: { url: '/v1/perfiles/c-brenna/avatar?v=2', miniatura: '/v1/perfiles/c-brenna/avatar/miniatura?v=2' },
    };

    let estado: SocialAmistadesEstado;
    let social: any;
    let chat: any;
    let toast: any;
    let nav: any;

    beforeEach(() => {
        social = jasmine.createSpyObj('PlatformSocialService', [
            'resumen', 'amistades', 'bloqueos', 'solicitudes', 'buscarPersonas', 'conversacionDirecta',
            'responderSolicitud', 'retirarSolicitud', 'dejarAmistad', 'bloquear',
        ]);
        social.resumen.and.resolveTo({ solicitudesRecibidas: 1, solicitudesEnviadas: 1, amistades: 1, seguidos: 0, seguidores: 0, bloqueos: 1 });
        social.amistades.and.resolveTo({ vinculos: [{ persona: yuna, desde: '2026-11-01T10:00:00Z' }], cursor: null });
        social.bloqueos.and.resolveTo({ vinculos: [{ persona: brenna, desde: '2026-11-02T10:00:00Z' }], cursor: null });
        social.solicitudes.and.callFake(async (tipo: string) => tipo === 'recibidas'
            ? [{ id: 12, persona: brenna, creada: '2026-11-03', caduca: '2026-12-03' }]
            : [{ id: 13, persona: yuna, creada: '2026-11-03', caduca: '2026-12-03' }]);
        social.buscarPersonas.and.resolveTo([yuna]);
        social.conversacionDirecta.and.resolveTo(77);
        social.responderSolicitud.and.resolveTo();
        social.retirarSolicitud.and.resolveTo();
        social.dejarAmistad.and.resolveTo();
        social.bloquear.and.resolveTo();
        chat = jasmine.createSpyObj('ChatFloatingService', ['abrir']);
        chat.abrir.and.resolveTo(true);
        toast = jasmine.createSpyObj('AppToastService', ['showSuccess', 'showError']);
        nav = jasmine.createSpyObj('UserProfileNavigationService', ['openPublicProfile']);
        estado = new SocialAmistadesEstado(social, chat, toast, nav);
    });

    afterEach(() => estado.ngOnDestroy());

    it('carga amistades, solicitudes recibidas y enviadas y los contadores', async () => {
        await estado.cargarAmistades();

        expect(estado.amistades.vinculos.map((v) => v.persona.alias)).toEqual(['yuna']);
        expect(estado.recibidas.map((s) => s.id)).toEqual([12]);
        expect(estado.enviadas.map((s) => s.id)).toEqual([13]);
        expect(estado.solicitudesRecibidasPendientes).toBe(1);
        expect(estado.totalAmistades).toBe(1);
        expect(social.solicitudes).toHaveBeenCalledWith('recibidas');
        expect(social.solicitudes).toHaveBeenCalledWith('enviadas');
    });

    it('enseña el nombre o, si el perfil es privado, el alias; nunca el id', () => {
        expect(estado.nombre(yuna)).toBe('Yuna');
        expect(estado.aliasSecundario(yuna)).toBe('@yuna');
        expect(estado.nombre(brenna)).toBe('@brenna');
        expect(estado.aliasSecundario(brenna)).toBe('');
        expect(estado.avatar(brenna)).toMatch(/\/v1\/perfiles\/c-brenna\/avatar\/miniatura\?v=2$/);
        expect(estado.avatar(yuna)).toContain('assets/img/');
    });

    it('pide la página siguiente con el cursor y la añade', async () => {
        social.amistades.and.returnValues(
            Promise.resolve({ vinculos: [{ persona: yuna, desde: null }], cursor: 'c2' }),
            Promise.resolve({ vinculos: [{ persona: brenna, desde: null }], cursor: null }),
        );
        await estado.cargarAmistades();
        expect(estado.amistades.cursor).toBe('c2');

        await estado.amistades.cargarMas();

        expect(social.amistades).toHaveBeenCalledWith('c2');
        expect(estado.amistades.vinculos.map((v) => v.persona.id)).toEqual(['c-yuna', 'c-brenna']);
        expect(estado.amistades.cursor).toBeNull();
    });

    it('busca personas tras la pausa al teclear, y no con menos de dos caracteres', fakeAsync(() => {
        estado.alEscribirBusqueda('y');
        tick(ESPERA_BUSQUEDA_MS);
        expect(social.buscarPersonas).not.toHaveBeenCalledWith('y');
        expect(estado.busquedaCorta).toBeTrue();

        estado.alEscribirBusqueda('yu');
        estado.alEscribirBusqueda('yun');
        tick(ESPERA_BUSQUEDA_MS - 1);
        expect(social.buscarPersonas).not.toHaveBeenCalledWith('yun');
        tick(1);
        flushMicrotasks();

        expect(social.buscarPersonas).toHaveBeenCalledOnceWith('yun');
        expect(estado.resultados).toEqual([yuna]);
        expect(estado.busquedaHecha).toBe('yun');
    }));

    it('si no encuentra a nadie lo dice, y descarta lo que llega de una búsqueda anterior', fakeAsync(() => {
        let resolverLenta: (personas: PersonaPlataforma[]) => void = () => undefined;
        social.buscarPersonas.and.returnValues(new Promise<PersonaPlataforma[]>((resolver) => resolverLenta = resolver), Promise.resolve([]));

        estado.alEscribirBusqueda('yuna');
        tick(ESPERA_BUSQUEDA_MS);
        estado.alEscribirBusqueda('zzz');
        tick(ESPERA_BUSQUEDA_MS);
        flushMicrotasks();
        resolverLenta([yuna]);
        flushMicrotasks();

        expect(estado.resultados).toEqual([]);
        expect(estado.sinResultados).toBeTrue();
        expect(estado.busquedaHecha).toBe('zzz');
    }));

    it('al abrir a alguien lleva a su perfil de la comunidad, con su relación', () => {
        estado.abrirPerfil(brenna);

        expect(nav.openPublicProfile).toHaveBeenCalledWith({ uid: 'c-brenna', initialDisplayName: '@brenna' });
    });

    it('abre la conversación directa con una amistad en el chat de Rol', async () => {
        await estado.escribir(yuna);

        expect(social.conversacionDirecta).toHaveBeenCalledWith('c-yuna');
        expect(chat.abrir).toHaveBeenCalledWith(77);
    });

    it('sin amistad, explica que las directas son solo entre amistades', async () => {
        social.conversacionDirecta.and.rejectWith(new PlatformSocialError('Solo puedes escribir por privado a tus amistades.', 'solo_entre_amistades', 409));

        await estado.escribir(yuna);

        expect(chat.abrir).not.toHaveBeenCalled();
        expect(toast.showError).toHaveBeenCalledWith('Solo puedes escribir por privado a tus amistades.');
    });

    it('acepta una solicitud y vuelve a leer solicitudes, amistades y contadores', async () => {
        await estado.cargarAmistades();
        social.amistades.calls.reset();
        social.solicitudes.calls.reset();

        await estado.aceptar(estado.recibidas[0]);

        expect(social.responderSolicitud).toHaveBeenCalledWith(12, 'aceptar');
        expect(social.solicitudes).toHaveBeenCalledTimes(2);
        expect(social.amistades).toHaveBeenCalledTimes(1);
        expect(toast.showSuccess).toHaveBeenCalled();
    });

    it('rechaza y retira solicitudes', async () => {
        await estado.cargarAmistades();

        await estado.rechazar(estado.recibidas[0]);
        await estado.retirar(estado.enviadas[0]);

        expect(social.responderSolicitud).toHaveBeenCalledWith(12, 'rechazar');
        expect(social.retirarSolicitud).toHaveBeenCalledWith(13);
    });

    it('el error de rechazada hace poco llega en una frase', async () => {
        await estado.cargarAmistades();
        social.responderSolicitud.and.rejectWith(new PlatformSocialError('Rechazó tu solicitud hace poco: podrás volver a pedirla pasados 30 días.', 'solicitud_rechazada_hace_poco', 409));

        await estado.aceptar(estado.recibidas[0]);

        expect(toast.showError).toHaveBeenCalledWith('Rechazó tu solicitud hace poco: podrás volver a pedirla pasados 30 días.');
    });

    it('deja la amistad solo si se confirma', async () => {
        await estado.cargarAmistades();
        const confirmar = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);

        await estado.dejarAmistad(estado.amistades.vinculos[0]);
        expect(social.dejarAmistad).not.toHaveBeenCalled();

        confirmar.and.resolveTo({ isConfirmed: true } as any);
        await estado.dejarAmistad(estado.amistades.vinculos[0]);
        expect(social.dejarAmistad).toHaveBeenCalledWith('c-yuna');
        expect(estado.amistades.vinculos).toEqual([]);
    });

    it('lista los bloqueos y desbloquea', async () => {
        await estado.bloqueos.cargar();
        expect(estado.bloqueos.vinculos.map((v) => v.persona.alias)).toEqual(['brenna']);

        await estado.desbloquear(estado.bloqueos.vinculos[0]);

        expect(social.bloquear).toHaveBeenCalledWith('c-brenna', false);
        expect(estado.bloqueos.vinculos).toEqual([]);
    });

    it('al cambiar de cuenta vacía todo y descarta las respuestas de la anterior', async () => {
        let resolver: (pagina: any) => void = () => undefined;
        social.amistades.and.returnValue(new Promise((r) => resolver = r));
        const carga = estado.cargarAmistades();

        estado.vaciar();
        resolver({ vinculos: [{ persona: yuna, desde: null }], cursor: 'otra' });
        await carga;

        expect(estado.amistades.vinculos).toEqual([]);
        expect(estado.amistades.cursor).toBeNull();
        expect(estado.recibidas).toEqual([]);
        expect(estado.resumen).toBeNull();
    });

    it('una acción que falla después del cambio de cuenta no avisa de nada', async () => {
        let rechazar: (error: unknown) => void = () => undefined;
        social.conversacionDirecta.and.returnValue(new Promise((_, r) => rechazar = r));
        const accion = estado.escribir(yuna);

        estado.vaciar();
        rechazar(new PlatformSocialError('x', 'demasiadas_peticiones', 429));
        await accion;

        expect(toast.showError).not.toHaveBeenCalled();
    });
});
