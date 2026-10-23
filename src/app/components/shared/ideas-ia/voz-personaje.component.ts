import { Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { Personaje } from 'src/app/interfaces/personaje';
import { datosIdeaDePersonaje, DisponibilidadIa, IdeasIaError, IdeasIaService, ProveedorDeVoz, VocesIaProveedor, VozIa } from 'src/app/services/ideas-ia.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { elegirVozAutomatica } from 'src/app/services/utils/voz-personaje';
import { VozGuardada, VozPersonajeService } from 'src/app/services/voz-personaje.service';

/** Una voz de la lista, con su proveedor. */
interface VozElegible {
    proveedor: ProveedorDeVoz;
    voz: VozIa;
}

/**
 * Las voces del personaje. Arriba, sus voces guardadas: las oye quien ve la ficha. El dueño le da otra en un solo paso
 * (propietario, 2026-10-23): escribe lo que dice o lo genera con IA, elige la voz («Automática» o la última que eligió)
 * y la API la genera con su clave (ElevenLabs o la voz de OpenAI); 3.5 Companion solo las reproduce. Como mucho tiene 3:
 * con 3, el dueño descarta una para generar otra. Nadie más genera voces para un personaje que no es suyo.
 */
@Component({
    selector: 'app-voz-personaje',
    templateUrl: './voz-personaje.component.html',
    styleUrls: ['./ideas-ia.component.sass'],
    standalone: false
})
export class VozPersonajeComponent implements OnInit, OnChanges, OnDestroy {
    @Input() pj: Personaje | null = null;

    disponibilidad: DisponibilidadIa = 'sin_sesion';
    cargando = false;
    error: IdeasIaError | null = null;

    guardadas: VozGuardada[] = [];
    maximo = 3;
    /** La voz guardada que suena, si alguna. */
    sonando: number | null = null;
    eligiendo = false;
    vocesDisponibles: VozElegible[] | null = null;
    /** null es «Automática». */
    vozElegida: VozElegible | null = null;
    textoParaGuardar = '';
    /** El texto de la caja lo ha escrito la IA (se avisa; la persona lo puede cambiar). */
    textoDeIa = false;
    generando = false;

    private estadoSub?: Subscription;
    private consulta = 0;
    private consultaDeVoces = 0;
    private audio: HTMLAudioElement | null = null;
    private urlsDeAudio = new Map<number, string>();

    constructor(
        private ideasIaSvc: IdeasIaService,
        private vozSvc: VozPersonajeService,
        private platformSessionSvc: PlatformSessionService,
        private zone: NgZone,
    ) { }

    /** Si hay algo que enseñar: sus voces o, al dueño, el botón (clave lista) o el enlace a la gestión de las claves. */
    get visible(): boolean {
        return this.guardadas.length > 0 || (this.esDueno && (this.disponibilidad === 'lista' || this.disponibilidad === 'sin_clave'));
    }

    /** Solo el dueño del personaje genera o descarta sus voces. */
    get esDueno(): boolean {
        const cuenta = `${this.platformSessionSvc.cuenta?.id ?? ''}`.trim();
        return cuenta.length > 0 && cuenta === `${this.pj?.ownerUid ?? ''}`.trim();
    }

    get llena(): boolean {
        return this.guardadas.length >= this.maximo;
    }

    get urlGestion(): string {
        return this.ideasIaSvc.urlGestion;
    }

    nombreProveedor(voz: VozGuardada): string {
        return voz.proveedor === 'openai' ? 'OpenAI' : 'ElevenLabs';
    }

    ngOnInit(): void {
        this.estadoSub = this.platformSessionSvc.estado$.subscribe(() => void this.comprobar());
        void this.leerGuardadas();
    }

    ngOnChanges(changes: SimpleChanges): void {
        const anterior = changes['pj']?.previousValue as Personaje | null | undefined;
        const actual = changes['pj']?.currentValue as Personaje | null | undefined;
        if (changes['pj'] && !changes['pj'].firstChange && anterior?.Id !== actual?.Id) {
            this.error = null;
            this.eligiendo = false;
            this.olvidarAudios();
            void this.leerGuardadas();
        }
    }

    ngOnDestroy(): void {
        this.estadoSub?.unsubscribe();
        this.olvidarAudios();
    }

    /** Sus voces guardadas. Si fallan, el bloque se queda sin ellas. */
    async leerGuardadas(): Promise<void> {
        const consulta = ++this.consultaDeVoces;
        const id = Number(this.pj?.Id);
        this.guardadas = [];
        if (!(id > 0))
            return;
        try {
            const { voces, maximo } = await this.vozSvc.voces(id);
            if (consulta === this.consultaDeVoces) {
                this.guardadas = voces;
                this.maximo = maximo;
            }
        } catch {
            // Sin sus voces, el dueño aún puede darle una.
        }
    }

    /** Escuchar una de sus voces, o pararla si es la que suena. */
    async escuchar(voz: VozGuardada): Promise<void> {
        const sonaba = this.sonando;
        this.audio?.pause();
        this.sonando = null;
        if (sonaba === voz.id)
            return;
        const id = Number(this.pj?.Id);
        try {
            let url = this.urlsDeAudio.get(voz.id);
            if (!url) {
                url = URL.createObjectURL(await this.vozSvc.audio(id, voz.id));
                this.urlsDeAudio.set(voz.id, url);
            }
            this.audio ??= new Audio();
            this.audio.src = url;
            this.audio.onended = () => this.zone.run(() => this.sonando = null);
            this.sonando = voz.id;
            await this.audio.play();
        } catch (error) {
            this.sonando = null;
            this.error = error instanceof IdeasIaError ? error : new IdeasIaError('No se ha podido reproducir su voz.', '', 0);
        }
    }

    /** El único paso del dueño: la caja con lo que dice, el selector de voz y «Generar voz». */
    async abrirPanel(): Promise<void> {
        if (this.llena)
            return;
        this.eligiendo = true;
        this.error = null;
        this.textoParaGuardar = '';
        this.textoDeIa = false;
        if (this.vocesDisponibles)
            return;
        try {
            const proveedores: VocesIaProveedor[] = await this.ideasIaSvc.voces();
            this.vocesDisponibles = proveedores.flatMap(p => p.voces.map(voz => ({ proveedor: p.proveedor, voz })));
            const ultima = this.leerUltimaVoz();
            this.vozElegida = this.vocesDisponibles.find(v => `${v.proveedor}:${v.voz.id}` === ultima) ?? null;
        } catch {
            this.vocesDisponibles = [];
        }
    }

    /** «Generar con IA»: una frase corta y con gancho del personaje, que se puede cambiar antes de darle voz. */
    async generarTexto(): Promise<void> {
        if (this.cargando)
            return;
        this.cargando = true;
        this.error = null;
        try {
            this.textoParaGuardar = (await this.ideasIaSvc.pedir('frase', datosIdeaDePersonaje(this.pj))).texto.slice(0, 300);
            this.textoDeIa = true;
        } catch (error) {
            this.error = error instanceof IdeasIaError ? error : new IdeasIaError('No se ha podido pedir la frase.', '', 0);
            if (this.error.esDeLaClave)
                void this.comprobar();
        } finally {
            this.cargando = false;
        }
    }

    /** La voz con la que se generará: la elegida o, con «Automática», una en español del género del personaje. */
    get vozQueSeUsara(): VozElegible | null {
        return this.vozElegida ?? elegirVozAutomatica(this.vocesDisponibles ?? [], this.pj?.Genero);
    }

    async guardarConVoz(): Promise<void> {
        const id = Number(this.pj?.Id);
        const texto = this.textoParaGuardar.trim();
        const voz = this.vozQueSeUsara;
        if (!voz || !texto || this.generando || this.llena || !(id > 0))
            return;
        this.generando = true;
        this.error = null;
        try {
            const nueva = await this.vozSvc.generar(id, { texto, proveedor: voz.proveedor, voz: voz.voz.id, nombreVoz: voz.voz.nombre });
            this.guardadas = [...this.guardadas, nueva];
            this.guardarUltimaVoz(this.vozElegida);
            this.eligiendo = false;
            void this.escuchar(nueva);
        } catch (error) {
            this.error = error instanceof IdeasIaError ? error : new IdeasIaError('No se ha podido generar su voz.', '', 0);
            if (this.error.esDeLaClave)
                void this.comprobar();
            if (this.error.code === 'tope_de_voces')
                void this.leerGuardadas();
        } finally {
            this.generando = false;
        }
    }

    // La última voz elegida a mano, por cuenta (ecosistema-kit/CAMBIO_DE_CUENTA.md): con «Automática» se olvida.
    private claveUltimaVoz(): string | null {
        const cuenta = `${this.platformSessionSvc.cuenta?.id ?? ''}`.trim();
        return cuenta ? `rol.voz.ultima.${cuenta}` : null;
    }

    private leerUltimaVoz(): string | null {
        const clave = this.claveUltimaVoz();
        try {
            return clave ? localStorage.getItem(clave) : null;
        } catch {
            return null;
        }
    }

    private guardarUltimaVoz(voz: VozElegible | null): void {
        const clave = this.claveUltimaVoz();
        try {
            if (clave && voz)
                localStorage.setItem(clave, `${voz.proveedor}:${voz.voz.id}`);
            else if (clave)
                localStorage.removeItem(clave);
        } catch {
            // Sin almacenamiento, la próxima vez vuelve a «Automática».
        }
    }

    async descartar(voz: VozGuardada): Promise<void> {
        const id = Number(this.pj?.Id);
        try {
            await this.vozSvc.descartar(id, voz.id);
            if (this.sonando === voz.id) {
                this.audio?.pause();
                this.sonando = null;
            }
            const url = this.urlsDeAudio.get(voz.id);
            if (url)
                URL.revokeObjectURL(url);
            this.urlsDeAudio.delete(voz.id);
            this.guardadas = this.guardadas.filter(v => v.id !== voz.id);
        } catch (error) {
            this.error = error instanceof IdeasIaError ? error : new IdeasIaError('No se ha podido descartar su voz.', '', 0);
        }
    }

    private olvidarAudios(): void {
        this.audio?.pause();
        this.sonando = null;
        this.urlsDeAudio.forEach(url => URL.revokeObjectURL(url));
        this.urlsDeAudio.clear();
    }

    async comprobar(): Promise<void> {
        const consulta = ++this.consulta;
        const disponibilidad = await this.ideasIaSvc.disponibilidad();
        if (consulta === this.consulta)
            this.disponibilidad = disponibilidad;
    }
}
