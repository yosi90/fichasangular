import { Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, inject } from '@angular/core';
import { AyudaSolicitud } from 'src/app/interfaces/ayuda';
import { NormasRolService } from 'src/app/services/normas-rol.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { textoFecha } from 'src/app/services/utils/fecha-texto';

/** Las normas propias de Rol como se enseñan aquí: la fecha, ya en texto. */
interface NormasDeRolPublicas {
    readonly titulo: string;
    readonly version: number;
    readonly texto: string;
    readonly publicadas: string;
}

@Component({
    selector: 'app-help-legal',
    templateUrl: './help-legal.component.html',
    standalone: false
})
export class HelpLegalComponent implements OnInit, OnChanges, OnDestroy {
    /** Normas comunes y política de privacidad de la plataforma, públicas (ecosistema-kit/PRIVACIDAD.md). */
    readonly urlNormas = inject(PlatformSessionService).urlSocial('normas');
    private readonly host = inject(ElementRef<HTMLElement>);
    private readonly normasRolSvc = inject(NormasRolService);

    /**
     * La petición de la Ayuda que pide bajar a un apartado de esta página (`?vista=ayuda&seccion=legal#legal-companion`,
     * la información de privacidad de 3.5 Companion que enlaza su ficha en «Apps»: ecosistema-kit/APK.md).
     */
    @Input() solicitud: AyudaSolicitud | null = null;

    /** Las normas de Rol: se leen al abrir Legal, sin sesión. */
    normas: NormasDeRolPublicas | null = null;
    estadoNormas: 'cargando' | 'error' | 'listo' = 'cargando';

    /** El índice «En esta página» (lienzo, vista 9), en el orden del texto. */
    readonly apartados: readonly { id: string; titulo: string }[] = [
        { id: 'legal-no-oficial', titulo: 'Proyecto no oficial' },
        { id: 'legal-propiedad', titulo: 'Propiedad intelectual' },
        { id: 'legal-uso', titulo: 'Uso de la web' },
        { id: 'legal-normas', titulo: 'Normas de Rol' },
        { id: 'legal-datos', titulo: 'Datos de usuario' },
        { id: 'legal-companion', titulo: '3.5 Companion' },
        { id: 'legal-medicion', titulo: 'Medición de audiencia' },
        { id: 'legal-alcance', titulo: 'Alcance del texto' },
    ];

    /** El apartado al que hay que volver a bajar cuando lleguen las normas, que van antes y lo empujan hacia abajo. */
    private apartadoPendiente: string | null = null;
    private bajada: ReturnType<typeof setTimeout> | null = null;

    ngOnChanges(): void {
        const id = `${this.solicitud?.apartado ?? ''}`;
        this.apartadoPendiente = this.apartados.some((a) => a.id === id) ? id : null;
        this.bajarAlApartadoPendiente();
    }

    ngOnInit(): void {
        void this.cargarNormas();
    }

    async cargarNormas(): Promise<void> {
        this.estadoNormas = 'cargando';
        try {
            const normas = await this.normasRolSvc.leer();
            this.normas = {
                titulo: normas.titulo,
                version: normas.version,
                texto: normas.texto,
                publicadas: textoFecha(normas.publicadas, ''),
            };
            this.estadoNormas = 'listo';
        } catch {
            this.normas = null;
            this.estadoNormas = 'error';
        }
        this.bajarAlApartadoPendiente();
    }

    ir(id: string, comportamiento: ScrollBehavior = 'smooth'): void {
        const apartado = this.host.nativeElement.querySelector(`#${id}`) as HTMLElement | null;
        apartado?.scrollIntoView({ block: 'start', behavior: comportamiento });
        apartado?.querySelector('h3')?.setAttribute('tabindex', '-1');
        (apartado?.querySelector('h3') as HTMLElement | null)?.focus({ preventScroll: true });
    }

    ngOnDestroy(): void {
        this.cancelarBajada();
    }

    /**
     * Baja al apartado pedido en cuanto se ve: la pestaña de la Ayuda se crea oculta y se elige un poco después, así que,
     * mientras el apartado no tiene caja, se vuelve a probar (como mucho unos 2 s). Deja de estar pendiente cuando ya ha
     * bajado y las normas no pueden empujarlo.
     */
    private bajarAlApartadoPendiente(intentos: number = INTENTOS_DE_BAJADA): void {
        this.cancelarBajada();
        const id = this.apartadoPendiente;
        if (!id)
            return;
        this.bajada = setTimeout(() => {
            this.bajada = null;
            const apartado = this.host.nativeElement.querySelector(`#${id}`) as HTMLElement | null;
            if (!apartado || apartado.getClientRects().length === 0) {
                if (intentos > 0)
                    this.bajarAlApartadoPendiente(intentos - 1);
                return;
            }
            this.ir(id, 'auto');
            if (this.estadoNormas !== 'cargando')
                this.apartadoPendiente = null;
        }, intentos === INTENTOS_DE_BAJADA ? 0 : ESPERA_ENTRE_INTENTOS_MS);
    }

    private cancelarBajada(): void {
        if (this.bajada)
            clearTimeout(this.bajada);
        this.bajada = null;
    }
}

const INTENTOS_DE_BAJADA = 40;
const ESPERA_ENTRE_INTENTOS_MS = 50;
