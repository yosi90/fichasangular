import { Component, ElementRef, Input, OnChanges, ViewEncapsulation, inject } from '@angular/core';
import { AyudaSolicitud, SECCIONES_AYUDA, SeccionAyuda } from 'src/app/interfaces/ayuda';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { AUTORES_ICONOS_ROL, ICONOS_PROPIOS_ROL } from 'src/app/services/utils/iconos-rol';

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
    /** La petición que pide bajar a un apartado (`?vista=ayuda&seccion=legal#legal-companion`), hasta cambiar de sección. */
    solicitudDeApartado: AyudaSolicitud | null = null;

    constructor(private host: ElementRef<HTMLElement>) { }

    get tituloSeccion(): string {
        return this.secciones.find((s) => s.id === this.seccion)?.titulo ?? '';
    }

    ngOnChanges(): void {
        if (!this.solicitud)
            return;
        this.ir(this.solicitud.seccion);
        this.solicitudDeApartado = this.solicitud.apartado ? this.solicitud : null;
    }

    ir(seccion: SeccionAyuda): void {
        this.seccion = seccion;
        this.solicitudDeApartado = null;
        setTimeout(() => this.host.nativeElement.querySelector('.ayuda-contenido')?.scrollTo?.({ top: 0 }));
    }
}
