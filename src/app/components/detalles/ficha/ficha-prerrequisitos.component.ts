import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CondicionPrerrequisito, GrupoPrerrequisitos } from 'src/app/services/utils/prerrequisito-frase';

/**
 * Los prerrequisitos agrupados (`agruparPrerrequisitos`), con la frase de la API: primero los obligatorios y después
 * cada elección («Basta con una de estas opciones»). Va dentro de un `<app-ficha-lateral titulo="Prerrequisitos">`; lo
 * que se proyecte (otras condiciones propias del tipo) va detrás de los grupos.
 */
@Component({
    selector: 'app-ficha-prerrequisitos',
    templateUrl: './ficha-prerrequisitos.component.html',
    standalone: false
})
export class FichaPrerrequisitosComponent {
    @Input() grupos: GrupoPrerrequisitos[] | null | undefined = [];
    /** Qué condiciones llevan a otro detalle (por defecto, ninguna). Pulsarlas emite `abrir`. */
    @Input() esNavegable: (condicion: CondicionPrerrequisito) => boolean = () => false;
    /** Lo que se enseña si no hay grupos («Sin prerrequisitos.»). Sin él, nada. */
    @Input() textoVacio: string | null = null;
    @Output() abrir = new EventEmitter<CondicionPrerrequisito>();

    get gruposVisibles(): GrupoPrerrequisitos[] {
        return (this.grupos ?? []).filter((grupo) => (grupo?.condiciones?.length ?? 0) > 0);
    }

    /** Con un solo grupo de obligatorios no hace falta su título: la tarjeta ya dice «Prerrequisitos». */
    get conTitulos(): boolean {
        const grupos = this.gruposVisibles;
        return grupos.length > 1 || grupos.some((grupo) => grupo.opcional);
    }
}
