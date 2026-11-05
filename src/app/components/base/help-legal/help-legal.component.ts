import { Component, ElementRef, OnInit, inject } from '@angular/core';
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
export class HelpLegalComponent implements OnInit {
    /** Normas comunes y política de privacidad de la plataforma, públicas (ecosistema-kit/PRIVACIDAD.md). */
    readonly urlNormas = inject(PlatformSessionService).urlSocial('normas');
    private readonly host = inject(ElementRef<HTMLElement>);
    private readonly normasRolSvc = inject(NormasRolService);

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
        { id: 'legal-medicion', titulo: 'Medición de audiencia' },
        { id: 'legal-alcance', titulo: 'Alcance del texto' },
    ];

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
    }

    ir(id: string): void {
        const apartado = this.host.nativeElement.querySelector(`#${id}`) as HTMLElement | null;
        apartado?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        apartado?.querySelector('h3')?.setAttribute('tabindex', '-1');
        (apartado?.querySelector('h3') as HTMLElement | null)?.focus({ preventScroll: true });
    }
}
