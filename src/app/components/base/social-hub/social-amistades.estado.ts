import { Injectable, OnDestroy } from '@angular/core';
import { Subject, catchError, debounceTime, distinctUntilChanged, from, map, of, switchMap, takeUntil } from 'rxjs';
import { AppToastService } from 'src/app/services/app-toast.service';
import { ChatFloatingService } from 'src/app/services/chat-floating.service';
import {
    BUSQUEDA_PERSONAS_MAX,
    BUSQUEDA_PERSONAS_MIN,
    PaginaVinculosPlataforma,
    PersonaPlataforma,
    PlatformSocialService,
    ResumenSocialPlataforma,
    SolicitudAmistadPlataforma,
    VinculoPlataforma,
    mensajeDeErrorSocial,
    nombreVisiblePersona,
    urlAvatar,
} from 'src/app/services/platform-social.service';
import { UserProfileNavigationService } from 'src/app/services/user-profile-navigation.service';
import { resolveDefaultProfileAvatar } from 'src/app/services/utils/profile-avatar.util';
import { confirmarAccion } from '../user-profile/perfil-acciones';

/** La espera al teclear antes de buscar personas. */
export const ESPERA_BUSQUEDA_MS = 350;

/**
 * Un listado por cursor de la plataforma (las amistades o los bloqueos): la primera página, «Cargar más» y su estado.
 * Al vaciarlo sube su generación, así que una página que llegue tarde, de la cuenta anterior, se descarta.
 */
export class ListaPorCursor {
    vinculos: VinculoPlataforma[] = [];
    cursor: string | null = null;
    cargando = false;
    cargandoMas = false;
    error = '';
    cargada = false;
    private generacion = 0;

    constructor(
        private readonly leer: (cursor: string | null) => Promise<PaginaVinculosPlataforma>,
        private readonly errorAlCargar: string,
        private readonly errorAlCargarMas: string,
    ) { }

    /** La primera página (al entrar en la sección, al reintentar o tras un cambio). */
    cargar(): Promise<void> {
        return this.pedir(null);
    }

    /** La página siguiente, si la hay y no se está pidiendo ya. */
    async cargarMas(): Promise<void> {
        if (this.cursor && !this.cargandoMas)
            await this.pedir(this.cursor);
    }

    /** Quita a esa persona de lo cargado (tras dejar la amistad o desbloquearla). */
    quitar(idPersona: string): void {
        this.vinculos = this.vinculos.filter((item) => item.persona.id !== idPersona);
    }

    vaciar(): void {
        this.generacion += 1;
        this.vinculos = [];
        this.cursor = null;
        this.cargando = false;
        this.cargandoMas = false;
        this.error = '';
        this.cargada = false;
    }

    private async pedir(cursor: string | null): Promise<void> {
        const generacion = this.generacion;
        const mas = cursor !== null;
        if (mas) {
            this.cargandoMas = true;
        } else {
            this.cargando = true;
            this.error = '';
        }
        try {
            const pagina = await this.leer(cursor);
            if (generacion !== this.generacion)
                return;
            this.vinculos = mas ? [...this.vinculos, ...pagina.vinculos] : pagina.vinculos;
            this.cursor = pagina.cursor;
            if (!mas)
                this.cargada = true;
        } catch (error) {
            if (generacion === this.generacion)
                this.error = mensajeDeErrorSocial(error, mas ? this.errorAlCargarMas : this.errorAlCargar);
        } finally {
            if (generacion === this.generacion) {
                if (mas)
                    this.cargandoMas = false;
                else
                    this.cargando = false;
            }
        }
    }
}

/**
 * Las amistades, sus solicitudes, la búsqueda de personas y los bloqueos dentro de Social (decisión 7 de la ronda de
 * mejoras de noviembre), con las rutas de la plataforma (ecosistema-kit/SOCIAL.md, «con páginas propias»). Rol no guarda
 * nada de esto: lo lee cada vez. La provee `SocialHubComponent` (una por pestaña de Social) y la plantilla solo pinta.
 *
 * Cambio de cuenta (ecosistema-kit/CAMBIO_DE_CUENTA.md): al salir se vacía todo y sube la generación, así que una
 * respuesta que llegue tarde, de la cuenta anterior, se descarta. Además, la página se recarga al cambiar de identidad.
 */
@Injectable()
export class SocialAmistadesEstado implements OnDestroy {
    resumen: ResumenSocialPlataforma | null = null;

    readonly amistades: ListaPorCursor;

    recibidas: SolicitudAmistadPlataforma[] = [];
    enviadas: SolicitudAmistadPlataforma[] = [];
    solicitudesCargando = false;
    solicitudesError = '';

    readonly bloqueos: ListaPorCursor;

    busqueda = '';
    resultados: PersonaPlataforma[] = [];
    /** El texto de los resultados que se ven («Nadie con «…»»). */
    busquedaHecha = '';
    buscando = false;
    busquedaError = '';

    /** Las personas (por id) con una acción en curso: sus botones se desactivan. */
    private readonly enCurso = new Set<string>();
    private generacion = 0;
    private readonly busqueda$ = new Subject<string>();
    private readonly destroy$ = new Subject<void>();

    readonly busquedaMinima = BUSQUEDA_PERSONAS_MIN;
    readonly busquedaMaxima = BUSQUEDA_PERSONAS_MAX;
    readonly nombre = nombreVisiblePersona;

    constructor(
        private platformSocialSvc: PlatformSocialService,
        private chatFloatingSvc: ChatFloatingService,
        private appToastSvc: AppToastService,
        private userProfileNavSvc: UserProfileNavigationService,
    ) {
        this.amistades = new ListaPorCursor((cursor) => this.platformSocialSvc.amistades(cursor),
            'No se pudieron cargar tus amistades.', 'No se pudieron cargar más amistades.');
        this.bloqueos = new ListaPorCursor((cursor) => this.platformSocialSvc.bloqueos(cursor),
            'No se pudieron cargar tus bloqueos.', 'No se pudieron cargar más bloqueos.');
        this.busqueda$.pipe(
            debounceTime(ESPERA_BUSQUEDA_MS),
            distinctUntilChanged(),
            switchMap((texto) => {
                const generacion = this.generacion;
                // Borrar la búsqueda corta la que estuviera en curso y no pregunta nada.
                if (texto.length < 1)
                    return of({ texto, personas: [] as PersonaPlataforma[], error: '', generacion });
                this.buscando = true;
                this.busquedaError = '';
                return from(this.platformSocialSvc.buscarPersonas(texto)).pipe(
                    map((personas) => ({ texto, personas, error: '', generacion })),
                    catchError((error) => of({ texto, personas: [] as PersonaPlataforma[], error: mensajeDeErrorSocial(error, 'No se pudo buscar ahora mismo.'), generacion })),
                );
            }),
            takeUntil(this.destroy$),
        ).subscribe(({ texto, personas, error, generacion }) => {
            if (generacion !== this.generacion || texto !== this.textoBusqueda)
                return;
            this.buscando = false;
            this.resultados = personas;
            this.busquedaHecha = texto;
            this.busquedaError = error;
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    get solicitudesRecibidasPendientes(): number {
        return this.resumen?.solicitudesRecibidas ?? this.recibidas.length;
    }

    get totalAmistades(): number {
        return this.resumen?.amistades ?? this.amistades.vinculos.length;
    }

    get busquedaCorta(): boolean {
        const longitud = this.textoBusqueda.length;
        return longitud > 0 && longitud < BUSQUEDA_PERSONAS_MIN;
    }

    get sinResultados(): boolean {
        return !this.buscando && !this.busquedaError && this.busquedaHecha.length > 0 && this.resultados.length < 1;
    }

    private get textoBusqueda(): string {
        return `${this.busqueda ?? ''}`.trim().slice(0, BUSQUEDA_PERSONAS_MAX);
    }

    ocupada(persona: Pick<PersonaPlataforma, 'id'>): boolean {
        return this.enCurso.has(persona.id);
    }

    avatar(persona: PersonaPlataforma): string {
        return urlAvatar(persona.avatar) ?? resolveDefaultProfileAvatar(persona.alias);
    }

    /** El alias, debajo del nombre, solo si el nombre no es ya el alias. */
    aliasSecundario(persona: PersonaPlataforma): string {
        return `${persona.nombre ?? ''}`.trim().length > 0 ? `@${persona.alias}` : '';
    }

    /** Lo que sale al abrir Social: los contadores (amistades y solicitudes recibidas). */
    async cargarResumen(): Promise<void> {
        const generacion = this.generacion;
        try {
            const resumen = await this.platformSocialSvc.resumen();
            if (generacion === this.generacion)
                this.resumen = resumen;
        } catch {
            // Los contadores son secundarios: sin ellos, las listas cuentan lo que tienen.
        }
    }

    /** La sección «Amistades»: solicitudes, la primera página de amistades y los contadores. */
    async cargarAmistades(): Promise<void> {
        await Promise.all([this.amistades.cargar(), this.cargarSolicitudes(), this.cargarResumen()]);
    }

    /** Lo que se teclea en «Buscar personas»: con 2 caracteres o más, busca tras una pausa. */
    alEscribirBusqueda(texto: string): void {
        this.busqueda = `${texto ?? ''}`;
        const q = this.textoBusqueda;
        if (q.length < BUSQUEDA_PERSONAS_MIN) {
            this.resultados = [];
            this.busquedaHecha = '';
            this.busquedaError = '';
            this.buscando = false;
            this.busqueda$.next('');
            return;
        }
        this.busqueda$.next(q);
    }

    limpiarBusqueda(): void {
        this.alEscribirBusqueda('');
    }

    /** Su perfil en la comunidad de Rol, con su relación y las acciones que tocan. */
    abrirPerfil(persona: PersonaPlataforma): void {
        this.userProfileNavSvc.openPublicProfile({ uid: persona.id, initialDisplayName: nombreVisiblePersona(persona) });
    }

    /** Una conversación directa (solo entre amistades) en el chat de Rol. */
    escribir(persona: PersonaPlataforma): Promise<void> {
        return this.conPersona(persona, async () => {
            const conversacion = await this.platformSocialSvc.conversacionDirecta(persona.id);
            if (!await this.chatFloatingSvc.abrir(conversacion))
                this.appToastSvc.showError('El chat de Yosiftware no está disponible ahora mismo.');
        }, 'No se pudo abrir la conversación.');
    }

    aceptar(solicitud: SolicitudAmistadPlataforma): Promise<void> {
        return this.responder(solicitud, 'aceptar', `Ahora ${nombreVisiblePersona(solicitud.persona)} y tú sois amistades.`);
    }

    rechazar(solicitud: SolicitudAmistadPlataforma): Promise<void> {
        return this.responder(solicitud, 'rechazar', 'Solicitud rechazada.');
    }

    retirar(solicitud: SolicitudAmistadPlataforma): Promise<void> {
        return this.conPersona(solicitud.persona, async () => {
            await this.platformSocialSvc.retirarSolicitud(solicitud.id);
            this.appToastSvc.showSuccess('Solicitud retirada.', { category: 'amistad' });
            await Promise.all([this.cargarSolicitudes(), this.cargarResumen()]);
        }, 'No se pudo retirar la solicitud.');
    }

    async dejarAmistad(vinculo: VinculoPlataforma): Promise<void> {
        const persona = vinculo.persona;
        if (this.ocupada(persona) || !await confirmarAccion(`¿Dejar de ser amistades de ${nombreVisiblePersona(persona)}?`, 'Dejar la amistad'))
            return;
        await this.conPersona(persona, async () => {
            await this.platformSocialSvc.dejarAmistad(persona.id);
            this.amistades.quitar(persona.id);
            this.appToastSvc.showSuccess('Ya no sois amistades.', { category: 'amistad' });
            await this.cargarResumen();
        }, 'No se pudo dejar la amistad.');
    }

    desbloquear(vinculo: VinculoPlataforma): Promise<void> {
        const persona = vinculo.persona;
        return this.conPersona(persona, async () => {
            await this.platformSocialSvc.bloquear(persona.id, false);
            this.bloqueos.quitar(persona.id);
            this.appToastSvc.showSuccess(`Has desbloqueado a ${nombreVisiblePersona(persona)}.`, { category: 'amistad' });
            await this.cargarResumen();
        }, 'No se pudo desbloquear.');
    }

    /** Al salir o cambiar de cuenta: nada de la cuenta anterior se queda ni llega tarde. */
    vaciar(): void {
        this.generacion += 1;
        this.resumen = null;
        this.amistades.vaciar();
        this.recibidas = [];
        this.enviadas = [];
        this.solicitudesCargando = false;
        this.solicitudesError = '';
        this.bloqueos.vaciar();
        this.busqueda = '';
        this.resultados = [];
        this.busquedaHecha = '';
        this.buscando = false;
        this.busquedaError = '';
        this.enCurso.clear();
        this.busqueda$.next('');
    }

    trackPorPersona(_: number, item: { persona: PersonaPlataforma }): string {
        return item.persona.id;
    }

    trackPersona(_: number, persona: PersonaPlataforma): string {
        return persona.id;
    }

    private async cargarSolicitudes(): Promise<void> {
        const generacion = this.generacion;
        this.solicitudesCargando = true;
        this.solicitudesError = '';
        try {
            const [recibidas, enviadas] = await Promise.all([
                this.platformSocialSvc.solicitudes('recibidas'),
                this.platformSocialSvc.solicitudes('enviadas'),
            ]);
            if (generacion !== this.generacion)
                return;
            this.recibidas = recibidas;
            this.enviadas = enviadas;
        } catch (error) {
            if (generacion === this.generacion)
                this.solicitudesError = mensajeDeErrorSocial(error, 'No se pudieron cargar las solicitudes de amistad.');
        } finally {
            if (generacion === this.generacion)
                this.solicitudesCargando = false;
        }
    }

    private responder(solicitud: SolicitudAmistadPlataforma, respuesta: 'aceptar' | 'rechazar', exito: string): Promise<void> {
        return this.conPersona(solicitud.persona, async () => {
            await this.platformSocialSvc.responderSolicitud(solicitud.id, respuesta);
            this.appToastSvc.showSuccess(exito, { category: 'amistad' });
            await Promise.all([
                this.cargarSolicitudes(),
                this.cargarResumen(),
                respuesta === 'aceptar' ? this.amistades.cargar() : Promise.resolve(),
            ]);
        }, 'No se pudo responder a la solicitud.');
    }

    /**
     * Una acción sobre una persona, de una en una: sus botones se desactivan mientras tanto y el error llega en una frase.
     * Si la cuenta ha cambiado entretanto, no se dice nada.
     */
    private async conPersona(persona: PersonaPlataforma, accion: () => Promise<void>, porDefecto: string): Promise<void> {
        if (this.enCurso.has(persona.id))
            return;
        const generacion = this.generacion;
        this.enCurso.add(persona.id);
        try {
            await accion();
        } catch (error) {
            if (generacion === this.generacion)
                this.appToastSvc.showError(mensajeDeErrorSocial(error, porDefecto));
        } finally {
            this.enCurso.delete(persona.id);
        }
    }
}
