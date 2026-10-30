import { Component, ElementRef, Input, OnChanges, ViewEncapsulation, inject } from '@angular/core';
import { AyudaSolicitud, SeccionAyuda } from 'src/app/interfaces/ayuda';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { AUTORES_ICONOS_ROL, ICONOS_PROPIOS_ROL } from 'src/app/services/utils/iconos-rol';

export const SECCIONES_AYUDA: readonly { id: SeccionAyuda; titulo: string }[] = [
    { id: 'primeros-pasos', titulo: 'Primeros pasos' },
    { id: 'novedades', titulo: 'Novedades' },
    { id: 'legal', titulo: 'Legal y privacidad' },
    { id: 'companion', titulo: '3.5 Companion' },
    { id: 'creditos', titulo: 'Créditos' },
];

/**
 * La Ayuda, en una sola pestaña (lienzo «Rol: las vistas que faltan», vista 9): navegación lateral (el patrón de
 * «Mi perfil») y, a la derecha, la sección en tarjetas de lectura como la ficha (prosa de 15 px, 74 caracteres). Los
 * estilos van sin encapsular, con el prefijo `ayuda-`, porque los usan también las secciones (`app-help-*`).
 */
@Component({
    selector: 'app-ayuda',
    templateUrl: './ayuda.component.html',
    styleUrls: ['./ayuda.component.sass'],
    encapsulation: ViewEncapsulation.None,
    standalone: false
})
export class AyudaComponent implements OnChanges {
    @Input() solicitud: AyudaSolicitud | null = null;

    readonly secciones = SECCIONES_AYUDA;
    readonly autores = AUTORES_ICONOS_ROL;
    readonly iconosPropios = ICONOS_PROPIOS_ROL;
    readonly urlCompanion = inject(PlatformSessionService).urlCompanion;
    seccion: SeccionAyuda = 'primeros-pasos';

    constructor(private host: ElementRef<HTMLElement>) { }

    get tituloSeccion(): string {
        return this.secciones.find((s) => s.id === this.seccion)?.titulo ?? '';
    }

    ngOnChanges(): void {
        if (this.solicitud)
            this.ir(this.solicitud.seccion);
    }

    ir(seccion: SeccionAyuda): void {
        this.seccion = seccion;
        setTimeout(() => this.host.nativeElement.querySelector('.ayuda-contenido')?.scrollTo?.({ top: 0 }));
    }
}
