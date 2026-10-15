import { Component, inject } from '@angular/core';
import { PlatformSessionService } from 'src/app/services/platform-session.service';

@Component({
    selector: 'app-help-legal',
    templateUrl: './help-legal.component.html',
    styleUrls: ['./help-legal.component.sass'],
    standalone: false
})
export class HelpLegalComponent {
    /** Normas comunes y política de privacidad de la plataforma, públicas (ecosistema-kit/PRIVACIDAD.md). */
    readonly urlNormas = inject(PlatformSessionService).urlSocial('normas');
}
