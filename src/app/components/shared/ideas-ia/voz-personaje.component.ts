import { Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { Personaje } from 'src/app/interfaces/personaje';
import { datosIdeaDePersonaje, DisponibilidadIa, IdeasIaError, IdeasIaService, ProveedorDeVoz, VocesIaProveedor, VozIa } from 'src/app/services/ideas-ia.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { ajustesVoz, elegirVoz, elegirVozAutomatica, sintesisDisponible, textoParaLeer } from 'src/app/services/utils/voz-personaje';
import { VozGuardada, VozPersonajeService } from 'src/app/services/voz-personaje.service';

/** Una voz de la lista, con su proveedor. */
interface VozElegible {
    proveedor: ProveedorDeVoz;
    voz: VozIa;
}

/**
 * La voz del personaje. Arriba, su voz guardada, si la tiene: la oye quien ve la ficha. El dueño le da voz en un solo
 * paso (propietario, 2026-10-23): escribe lo que dice o lo genera con IA, elige la voz («Automática» o la última que
 * eligió) y la API la genera con su clave (ElevenLabs o la voz de OpenAI); 3.5 Companion solo la reproduce. Quien no es
 * el dueño tiene «Que hable»: una frase suya de la IA, que lee el navegador con `speechSynthesis`.
 */
@Component({
    selector: 'app-voz-personaje',
    templateUrl: './voz-personaje.component.html',
    styleUrls: ['./ideas-ia.component.sass'],
    standalone: false
})
export class VozPersonajeComponent implements OnInit, OnChanges, OnDestroy {
    @Input() pj: Personaje | null = null;

    readonly puedeHablar = sintesisDisponible();
    disponibilidad: DisponibilidadIa = 'sin_sesion';
    cargando = false;
    hablando = false;
    frase: string | null = null;
    error: IdeasIaError | null = null;

    guardada: VozGuardada | null = null;
    reproduciendo = false;
    eligiendo = false;
    voces: VozElegible[] | null = null;
    /** null es «Automática». */
    vozElegida: VozElegible | null = null;
    textoParaGuardar = '';
    /** El texto de la caja lo ha escrito la IA (se avisa; la persona lo puede cambiar). */
    textoDeIa = false;
    generando = false;

    private estadoSub?: Subscription;
    private consulta = 0;
    private consultaDeVoz = 0;
    private audio: HTMLAudioElement | null = null;
    private urlAudio: string | null = null;

    constructor(
        private ideasIaSvc: IdeasIaService,
        private vozSvc: VozPersonajeService,
        private platformSessionSvc: PlatformSessionService,
        private zone: NgZone,
    ) { }

    /** Si hay algo que enseñar: su voz guardada, el botón (clave lista) o el enlace a la gestión de las claves. */
    get visible(): boolean {
        return !!this.guardada || this.disponibilidad === 'lista' || this.disponibilidad === 'sin_clave';
    }

    /** Solo el dueño del personaje genera o borra su voz. */
    get esDueno(): boolean {
        const cuenta = `${this.platformSessionSvc.cuenta?.id ?? ''}`.trim();
        return cuenta.length > 0 && cuenta === `${this.pj?.ownerUid ?? ''}`.trim();
    }

    get nombreProveedor(): string {
        return this.guardada?.proveedor === 'openai' ? 'OpenAI' : 'ElevenLabs';
    }

    get urlGestion(): string {
        return this.ideasIaSvc.urlGestion;
    }

    ngOnInit(): void {
        this.estadoSub = this.platformSessionSvc.estado$.subscribe(() => void this.comprobar());
        void this.leerGuardada();
    }

    ngOnChanges(changes: SimpleChanges): void {
        const anterior = changes['pj']?.previousValue as Personaje | null | undefined;
        const actual = changes['pj']?.currentValue as Personaje | null | undefined;
        if (changes['pj'] && !changes['pj'].firstChange && anterior?.Id !== actual?.Id) {
            this.parar();
            this.frase = null;
            this.error = null;
            this.eligiendo = false;
            this.olvidarAudio();
            void this.leerGuardada();
        }
    }

    ngOnDestroy(): void {
        this.estadoSub?.unsubscribe();
        this.parar();
        this.olvidarAudio();
    }

    /** Su voz guardada, si la tiene. Sin ella (o si falla), solo queda «Que hable». */
    async leerGuardada(): Promise<void> {
        const consulta = ++this.consultaDeVoz;
        const id = Number(this.pj?.Id);
        this.guardada = null;
        if (!(id > 0))
            return;
        try {
            const guardada = await this.vozSvc.guardada(id);
            if (consulta === this.consultaDeVoz)
                this.guardada = guardada;
        } catch {
            // Sin su voz guardada se puede seguir con «Que hable».
        }
    }

    async escucharGuardada(): Promise<void> {
        if (this.reproduciendo) {
            this.audio?.pause();
            this.reproduciendo = false;
            return;
        }
        this.parar();
        const id = Number(this.pj?.Id);
        try {
            if (!this.urlAudio)
                this.urlAudio = URL.createObjectURL(await this.vozSvc.audio(id));
            this.audio ??= new Audio();
            this.audio.src = this.urlAudio;
            this.audio.onended = () => this.zone.run(() => this.reproduciendo = false);
            this.reproduciendo = true;
            await this.audio.play();
        } catch (error) {
            this.reproduciendo = false;
            this.error = error instanceof IdeasIaError ? error : new IdeasIaError('No se ha podido reproducir su voz.', '', 0);
        }
    }

    /** El único paso del dueño: la caja con lo que dice, el selector de voz y «Generar voz». */
    async abrirPanel(): Promise<void> {
        this.parar();
        this.eligiendo = true;
        this.error = null;
        this.textoParaGuardar = this.guardada?.texto ?? '';
        this.textoDeIa = false;
        if (this.voces)
            return;
        try {
            const proveedores: VocesIaProveedor[] = await this.ideasIaSvc.voces();
            this.voces = proveedores.flatMap(p => p.voces.map(voz => ({ proveedor: p.proveedor, voz })));
            const ultima = this.leerUltimaVoz();
            this.vozElegida = this.voces.find(v => `${v.proveedor}:${v.voz.id}` === ultima) ?? null;
        } catch {
            this.voces = [];
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
        return this.vozElegida ?? elegirVozAutomatica(this.voces ?? [], this.pj?.Genero);
    }

    async guardarConVoz(): Promise<void> {
        const id = Number(this.pj?.Id);
        const texto = this.textoParaGuardar.trim();
        const voz = this.vozQueSeUsara;
        if (!voz || !texto || this.generando || !(id > 0))
            return;
        this.generando = true;
        this.error = null;
        try {
            this.guardada = await this.vozSvc.generar(id, { texto, proveedor: voz.proveedor, voz: voz.voz.id, nombreVoz: voz.voz.nombre });
            this.guardarUltimaVoz(this.vozElegida);
            this.eligiendo = false;
            this.olvidarAudio();
            void this.escucharGuardada();
        } catch (error) {
            this.error = error instanceof IdeasIaError ? error : new IdeasIaError('No se ha podido generar su voz.', '', 0);
            if (this.error.esDeLaClave)
                void this.comprobar();
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

    async borrarVoz(): Promise<void> {
        const id = Number(this.pj?.Id);
        try {
            await this.vozSvc.borrar(id);
            this.guardada = null;
            this.olvidarAudio();
        } catch (error) {
            this.error = error instanceof IdeasIaError ? error : new IdeasIaError('No se ha podido borrar su voz.', '', 0);
        }
    }

    private olvidarAudio(): void {
        this.audio?.pause();
        this.reproduciendo = false;
        if (this.urlAudio)
            URL.revokeObjectURL(this.urlAudio);
        this.urlAudio = null;
    }

    async comprobar(): Promise<void> {
        const consulta = ++this.consulta;
        const disponibilidad = await this.ideasIaSvc.disponibilidad();
        if (consulta === this.consulta)
            this.disponibilidad = disponibilidad;
    }

    async queHable(): Promise<void> {
        if (this.cargando)
            return;
        this.parar();
        this.cargando = true;
        this.error = null;
        try {
            const idea = await this.ideasIaSvc.pedir('frase', datosIdeaDePersonaje(this.pj));
            this.frase = idea.texto;
            this.hablar();
        } catch (error) {
            this.error = error instanceof IdeasIaError ? error : new IdeasIaError('No se ha podido pedir la frase.', '', 0);
            if (this.error.esDeLaClave)
                void this.comprobar();
        } finally {
            this.cargando = false;
        }
    }

    hablar(): void {
        const texto = textoParaLeer(this.frase);
        if (!this.puedeHablar || !texto)
            return;
        const sintesis = window.speechSynthesis;
        // Cancelar sin nada sonando y hablar en el acto deja muda la frase en algunos navegadores.
        if (sintesis.speaking || sintesis.pending)
            sintesis.cancel();
        const locucion = new SpeechSynthesisUtterance(texto);
        const { tono, velocidad } = ajustesVoz(this.pj?.Raza?.Nombre, this.pj?.Genero);
        locucion.lang = 'es-ES';
        locucion.pitch = tono;
        locucion.rate = velocidad;
        const voz = elegirVoz(sintesis.getVoices());
        if (voz)
            locucion.voice = voz;
        locucion.onend = () => this.zone.run(() => this.hablando = false);
        locucion.onerror = evento => this.zone.run(() => {
            this.hablando = false;
            // Parar o cambiar de frase también acaba en error; solo se avisa de un fallo de verdad.
            if (evento.error !== 'interrupted' && evento.error !== 'canceled')
                this.error = new IdeasIaError('Tu navegador no ha podido leerla en voz alta.', '', 0);
        });
        this.hablando = true;
        sintesis.speak(locucion);
    }

    parar(): void {
        if (this.puedeHablar && (this.hablando || window.speechSynthesis.speaking))
            window.speechSynthesis.cancel();
        this.hablando = false;
    }
}
