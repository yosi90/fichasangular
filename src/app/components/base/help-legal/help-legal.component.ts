import { Component, ElementRef, inject } from '@angular/core';
import { PlatformSessionService } from 'src/app/services/platform-session.service';

@Component({
    selector: 'app-help-legal',
    templateUrl: './help-legal.component.html',
    standalone: false
})
export class HelpLegalComponent {
    /** Normas comunes y política de privacidad de la plataforma, públicas (ecosistema-kit/PRIVACIDAD.md). */
    readonly urlNormas = inject(PlatformSessionService).urlSocial('normas');
    private readonly host = inject(ElementRef<HTMLElement>);

    /** El índice «En esta página» (lienzo, vista 9), en el orden del texto. */
    readonly apartados: readonly { id: string; titulo: string }[] = [
        { id: 'legal-no-oficial', titulo: 'Proyecto no oficial' },
        { id: 'legal-propiedad', titulo: 'Propiedad intelectual' },
        { id: 'legal-uso', titulo: 'Uso de la web' },
        { id: 'legal-datos', titulo: 'Datos de usuario' },
        { id: 'legal-medicion', titulo: 'Medición de audiencia' },
        { id: 'legal-alcance', titulo: 'Alcance del texto' },
    ];

    ir(id: string): void {
        const apartado = this.host.nativeElement.querySelector(`#${id}`) as HTMLElement | null;
        apartado?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        apartado?.querySelector('h3')?.setAttribute('tabindex', '-1');
        (apartado?.querySelector('h3') as HTMLElement | null)?.focus({ preventScroll: true });
    }
}
