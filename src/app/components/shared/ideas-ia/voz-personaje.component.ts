import { Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subscription } from 'rxjs';
import { Personaje } from 'src/app/interfaces/personaje';
import { datosIdeaDePersonaje, DisponibilidadIa, IdeasIaError, IdeasIaService } from 'src/app/services/ideas-ia.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { ajustesVoz, elegirVoz, sintesisDisponible, textoParaLeer } from 'src/app/services/utils/voz-personaje';

/**
 * «Que hable»: pide a la IA una frase del personaje (con la clave de la persona) y la lee el navegador con
 * `speechSynthesis`. Sin síntesis de voz en el navegador, solo se enseña la frase.
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

    private estadoSub?: Subscription;
    private consulta = 0;

    constructor(private ideasIaSvc: IdeasIaService, private platformSessionSvc: PlatformSessionService, private zone: NgZone) { }

    /** Si hay algo que enseñar: el botón (clave lista) o el enlace a la gestión de las claves. */
    get visible(): boolean {
        return this.disponibilidad === 'lista' || this.disponibilidad === 'sin_clave';
    }

    get urlGestion(): string {
        return this.ideasIaSvc.urlGestion;
    }

    ngOnInit(): void {
        this.estadoSub = this.platformSessionSvc.estado$.subscribe(() => void this.comprobar());
    }

    ngOnChanges(changes: SimpleChanges): void {
        const anterior = changes['pj']?.previousValue as Personaje | null | undefined;
        const actual = changes['pj']?.currentValue as Personaje | null | undefined;
        if (changes['pj'] && !changes['pj'].firstChange && anterior?.Id !== actual?.Id) {
            this.parar();
            this.frase = null;
            this.error = null;
        }
    }

    ngOnDestroy(): void {
        this.estadoSub?.unsubscribe();
        this.parar();
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
