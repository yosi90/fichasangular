import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import {
    combinarTexto,
    DatosIdeaIa,
    DisponibilidadIa,
    IdeaIa,
    IdeasIaError,
    IdeasIaService,
    TipoIdeaIa,
} from 'src/app/services/ideas-ia.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import Swal from 'sweetalert2';

export interface UsoIdeaIa {
    tipo: TipoIdeaIa;
    /** El texto final del campo: la idea sola o lo que ya había más la idea. */
    texto: string;
}

const ETIQUETAS: Record<TipoIdeaIa, string> = {
    personaje: 'Idea de personaje',
    trasfondo: 'Trasfondo',
    personalidad: 'Personalidad',
    frase: 'Frase',
};

const DESTINOS: Record<TipoIdeaIa, string> = {
    personaje: 'Usar en el trasfondo',
    trasfondo: 'Usar en el trasfondo',
    personalidad: 'Usar en la personalidad',
    frase: 'Usar',
};

/**
 * Botones «Ideas con IA» con la clave de la persona: pide la idea, la enseña como propuesta («Usar», «Otra»,
 * «Descartar») y devuelve el texto final por `usar`. Sin una clave lista enlaza su gestión; sin sesión no aparece.
 */
@Component({
    selector: 'app-ideas-ia',
    templateUrl: './ideas-ia.component.html',
    styleUrls: ['./ideas-ia.component.sass'],
    standalone: false
})
export class IdeasIaComponent implements OnInit, OnDestroy {
    @Input() tipos: TipoIdeaIa[] = ['personaje', 'trasfondo', 'personalidad'];
    /** Los datos del personaje en el momento de pedir la idea. */
    @Input() obtenerDatos: () => DatosIdeaIa = () => ({});
    /** El texto que ya tiene el campo donde iría la idea, para preguntar si se sustituye o se añade. */
    @Input() textoActual: (tipo: TipoIdeaIa) => string = () => '';
    @Output() usar = new EventEmitter<UsoIdeaIa>();

    disponibilidad: DisponibilidadIa = 'sin_sesion';
    cargando: TipoIdeaIa | null = null;
    propuesta: (IdeaIa & { tipo: TipoIdeaIa }) | null = null;
    error: IdeasIaError | null = null;

    private estadoSub?: Subscription;
    private consulta = 0;

    constructor(readonly ideasIaSvc: IdeasIaService, private platformSessionSvc: PlatformSessionService) { }

    ngOnInit(): void {
        this.estadoSub = this.platformSessionSvc.estado$.subscribe(() => void this.comprobar());
    }

    ngOnDestroy(): void {
        this.estadoSub?.unsubscribe();
    }

    get urlGestion(): string {
        return this.ideasIaSvc.urlGestion;
    }

    etiqueta(tipo: TipoIdeaIa): string {
        return ETIQUETAS[tipo];
    }

    destino(tipo: TipoIdeaIa): string {
        return DESTINOS[tipo];
    }

    async comprobar(): Promise<void> {
        const consulta = ++this.consulta;
        const disponibilidad = await this.ideasIaSvc.disponibilidad();
        if (consulta === this.consulta)
            this.disponibilidad = disponibilidad;
    }

    async pedir(tipo: TipoIdeaIa): Promise<void> {
        if (this.cargando)
            return;
        this.cargando = tipo;
        this.error = null;
        try {
            const idea = await this.ideasIaSvc.pedir(tipo, this.obtenerDatos());
            this.propuesta = { ...idea, tipo };
        } catch (error) {
            this.error = error instanceof IdeasIaError ? error : new IdeasIaError('No se ha podido pedir la idea.', '', 0);
            if (this.error.esDeLaClave)
                void this.comprobar();
        } finally {
            this.cargando = null;
        }
    }

    otra(): void {
        if (this.propuesta)
            void this.pedir(this.propuesta.tipo);
    }

    descartar(): void {
        this.propuesta = null;
    }

    async aplicar(): Promise<void> {
        const propuesta = this.propuesta;
        if (!propuesta)
            return;
        const actual = `${this.textoActual(propuesta.tipo) ?? ''}`;
        let modo: 'sustituir' | 'anadir' = 'sustituir';
        if (actual.trim().length > 0) {
            const respuesta = await Swal.fire({
                icon: 'question',
                title: 'Ya hay texto',
                text: '¿Quieres sustituir lo que ya habías escrito o añadir la idea al final?',
                showDenyButton: true,
                showCancelButton: true,
                confirmButtonText: 'Sustituir',
                denyButtonText: 'Añadir al final',
                cancelButtonText: 'Cancelar',
                target: document.body,
                heightAuto: false,
                scrollbarPadding: false,
            });
            if (respuesta.isDismissed)
                return;
            modo = respuesta.isConfirmed ? 'sustituir' : 'anadir';
        }
        this.usar.emit({ tipo: propuesta.tipo, texto: combinarTexto(actual, propuesta.texto, modo) });
        this.propuesta = null;
    }
}
