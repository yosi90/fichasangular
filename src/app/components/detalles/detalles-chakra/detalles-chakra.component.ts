import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatoFicha, EtiquetaFicha, esTextoCorto, etiquetaTraducido, nombreOriginalVisible, unirTipo } from 'src/app/components/detalles/ficha';
import { ChakraClase, ChakraDetalle, ChakraFusion } from 'src/app/interfaces/incarnum';
import { porNombre } from 'src/app/services/utils/orden-texto';
import { UserService } from 'src/app/services/user.service';
import { puedeModificarDesdeDetalle } from 'src/app/services/utils/permisos-catalogo';

/**
 * El detalle de un chakra (Magic of Incarnum) con la ficha común: su categoría, la ranura de objeto que cierra su
 * vínculo, las clases que lo abren (y desde qué nivel) y las fusiones que se moldean o se vinculan en él.
 */
@Component({
    selector: 'app-detalles-chakra',
    templateUrl: './detalles-chakra.component.html',
    standalone: false
})
export class DetallesChakraComponent {
    private chakraActual!: ChakraDetalle;

    tipoCabecera = '';
    etiquetas: EtiquetaFicha[] = [];
    descripcionEnCabecera = false;
    datos: DatoFicha[] = [];
    clases: ChakraClase[] = [];
    fusiones: ChakraFusion[] = [];

    @Input()
    set chakra(valor: ChakraDetalle) {
        this.chakraActual = valor;
        if (!valor)
            return;
        this.tipoCabecera = unirTipo(['Chakra', valor.Categoria?.Nombre]);
        this.etiquetas = [etiquetaTraducido(valor)].filter((etiqueta): etiqueta is EtiquetaFicha => etiqueta !== null);
        this.descripcionEnCabecera = esTextoCorto(valor.Descripcion);
        this.datos = [
            { etiqueta: 'Categoría', valor: valor.Categoria?.Nombre },
            { etiqueta: 'Ranura que cierra al vincular', valor: valor.Ranura?.Nombre ?? null },
            { etiqueta: 'Fusiones que se moldean aquí', valor: valor.Fusiones.filter((f) => f.Ocupa).length },
            { etiqueta: 'Fusiones que se vinculan aquí', valor: valor.Fusiones.filter((f) => f.Vinculo).length },
            { etiqueta: 'Nombre original', valor: nombreOriginalVisible(valor) },
        ];
        this.clases = [...valor.Clases].sort((a, b) => a.Nivel - b.Nivel || porNombre(a, b));
        this.fusiones = [...valor.Fusiones].sort(porNombre);
    }
    get chakra(): ChakraDetalle {
        return this.chakraActual;
    }

    @Output() claseDetallesId = new EventEmitter<number>();
    @Output() fusionDetallesId = new EventEmitter<number>();
    /** El lápiz «Modificar»: abre la pestaña de modificar el chakra. Sin quien lo escuche, no sale. */
    @Output() modificar = new EventEmitter<ChakraDetalle>();

    constructor(private userSvc: UserService) { }

    get puedeModificar(): boolean {
        return puedeModificarDesdeDetalle(this.modificar, this.userSvc, 'chakras');
    }

    abrirDetallesClase(id: number): void {
        if (Number(id) > 0)
            this.claseDetallesId.emit(Number(id));
    }

    abrirDetallesFusion(id: number): void {
        if (Number(id) > 0)
            this.fusionDetallesId.emit(Number(id));
    }
}
