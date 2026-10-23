import { Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { Personaje } from 'src/app/interfaces/personaje';
import { datosIdeaDePersonaje, DisponibilidadIa, IdeasIaError, IdeasIaService, ProveedorDeVoz, VocesIaProveedor, VozIa } from 'src/app/services/ideas-ia.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { ajustesVoz, elegirVoz, sintesisDisponible, textoParaLeer } from 'src/app/services/utils/voz-personaje';
import { VozGuardada, VozPersonajeService } from 'src/app/services/voz-personaje.service';

/** Una voz de la lista, con su proveedor. */
interface VozElegible {
    proveedor: ProveedorDeVoz;
    voz: VozIa;
}

/**
 * La voz del personaje. Arriba, su voz guardada, si la tiene: la oye quien ve la ficha. Debajo, «Que hable»: pide a la
 * IA una frase suya (con la clave de la persona) y la lee el navegador con `speechSynthesis`; sin síntesis, solo se
 * enseña la frase. El dueño puede guardar esa frase con una voz de su cuenta (ElevenLabs o la voz de OpenAI), que
 * genera la API con su clave; 3.5 Companion solo la reproduce.
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
    vozElegida: VozElegible | null = null;
    textoParaGuardar = '';
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

    /** Elegir una voz de la cuenta (`GET /v1/ia/voces`) para guardar la frase con ella. */
    async abrirVoces(): Promise<void> {
        this.eligiendo = true;
        this.error = null;
        this.textoParaGuardar = this.frase ?? this.guardada?.texto ?? '';
        if (this.voces)
            return;
        try {
            const proveedores: VocesIaProveedor[] = await this.ideasIaSvc.voces();
            this.voces = proveedores.flatMap(p => p.voces.map(voz => ({ proveedor: p.proveedor, voz })));
            this.vozElegida = this.voces.find(v => v.voz.id === this.guardada?.voz) ?? this.voces[0] ?? null;
        } catch {
            this.voces = [];
        }
    }

    async guardarConVoz(): Promise<void> {
        const id = Number(this.pj?.Id);
        const texto = this.textoParaGuardar.trim();
        if (!this.vozElegida || !texto || this.generando || !(id > 0))
            return;
        this.generando = true;
        this.error = null;
        try {
            this.guardada = await this.vozSvc.generar(id, {
                texto,
                proveedor: this.vozElegida.proveedor,
                voz: this.vozElegida.voz.id,
                nombreVoz: this.vozElegida.voz.nombre,
            });
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
        sintesis.cancel();
        const locucion = new SpeechSynthesisUtterance(texto);
        const { tono, velocidad } = ajustesVoz(this.pj?.Raza?.Nombre, this.pj?.Genero);
        locucion.lang = 'es-ES';
        locucion.pitch = tono;
        locucion.rate = velocidad;
        const voz = elegirVoz(sintesis.getVoices());
        if (voz)
            locucion.voice = voz;
        const terminar = () => this.zone.run(() => this.hablando = false);
        locucion.onend = terminar;
        locucion.onerror = terminar;
        this.hablando = true;
        sintesis.speak(locucion);
    }

    parar(): void {
        if (this.puedeHablar && (this.hablando || window.speechSynthesis.speaking))
            window.speechSynthesis.cancel();
        this.hablando = false;
    }
}
