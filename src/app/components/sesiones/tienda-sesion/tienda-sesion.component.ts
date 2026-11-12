import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCompraRequestDto } from 'src/app/interfaces/personajes-api';
import { ModoTienda } from 'src/app/components/nuevo-personaje/tienda-equipo/tienda-equipo.component';
import { ArticuloTienda, POLITICA_TIENDA_LIBRE, PoliticaTienda, ReglaDineroInicial } from 'src/app/services/utils/tienda-equipo';

/**
 * La tienda de la creación (`<app-tienda-equipo>`, con su configuración de piezas) abierta desde una sesión, a pantalla
 * completa (lienzo de sesiones, pantallas 2 y 5): para comprar con el saldo (`compra`) o para apuntar el botín o un
 * regalo (`botin`). Solo es la ventana: los datos los pone el panel de la sesión, que la crea al pulsar «Comprar» u
 * «Objeto obtenido» (la tienda está declarada en `AppModule`, así que esta envoltura también; el panel, con carga
 * diferida, la crea con `ViewContainerRef.createComponent`).
 */
@Component({
    selector: 'app-tienda-sesion',
    templateUrl: './tienda-sesion.component.html',
    styleUrls: ['./tienda-sesion.component.sass'],
    standalone: false
})
export class TiendaSesionComponent {
    @Input() titulo = '';
    @Input() modo: Exclude<ModoTienda, 'creacion'> = 'compra';
    /** El saldo como regla «libre» (`sugerido` = el saldo); en el botín, sin dinero. */
    @Input() regla!: ReglaDineroInicial;
    @Input() articulos: ArticuloTienda[] = [];
    @Input() conjuros: { Id: number; Nombre: string; }[] = [];
    @Input() politica: PoliticaTienda = POLITICA_TIENDA_LIBRE;
    @Input() capacidadCarga: Personaje['Capacidad_carga'] | null = null;
    @Input() guardando = false;
    @Input() error = '';
    @Input() piezaConError: number | null = null;
    @Output() confirmar = new EventEmitter<PersonajeCompraRequestDto>();
    @Output() cancelar = new EventEmitter<void>();

    @HostListener('document:keydown.escape')
    alPulsarEscape(): void {
        if (!this.guardando)
            this.cancelar.emit();
    }
}
