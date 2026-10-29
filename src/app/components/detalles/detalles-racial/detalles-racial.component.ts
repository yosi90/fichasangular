import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatoFicha, datosEsenciaRasgo, datosVisibles } from 'src/app/components/detalles/ficha';
import { RacialDetalle } from 'src/app/interfaces/racial';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { resolverExtraHabilidadVisible } from 'src/app/services/utils/habilidad-extra-visible';
import { toBoolean } from 'src/app/services/utils/normalizacion';
import { textoVisible, tieneTextoVisible } from 'src/app/services/utils/texto-visible';
import {
    CondicionPrerrequisito,
    GrupoPrerrequisitos,
    agruparPrerrequisitos,
    destinoPrerrequisito,
} from 'src/app/services/utils/prerrequisito-frase';

/** Una fila de nombre y bonificador (característica, salvación o habilidad), con sus notas. */
interface BonificadorRacial {
    nombre: string;
    /** «+2», o vacío si no modifica. */
    valor: string;
    notas: string[];
}

interface DoteRacial {
    id: number;
    nombre: string;
    extra: string;
}

interface SortilegaRacial {
    id: number;
    nombre: string;
    detalle: string;
}

@Component({
    selector: 'app-detalles-racial',
    templateUrl: './detalles-racial.component.html',
    standalone: false
})
export class DetallesRacialComponent {
    private racialActual!: RacialDetalle;
    /** Los prerrequisitos (raza y característica) con la frase de la API, agrupados por `Opcional`. */
    prerrequisitosAgrupados: GrupoPrerrequisitos[] = [];
    /** Las marcas de prerrequisito que no tienen ya su condición en los grupos («Requiere raza»). */
    flagsPrerrequisito: string[] = [];
    dotes: DoteRacial[] = [];
    habilidadesBase: BonificadorRacial[] = [];
    habilidadesCustom: BonificadorRacial[] = [];
    caracteristicas: BonificadorRacial[] = [];
    salvaciones: BonificadorRacial[] = [];
    sortilegas: SortilegaRacial[] = [];
    ataques: string[] = [];
    /** Magic of Incarnum: la esencia que da y si es receptáculo. */
    datosEsencia: DatoFicha[] = [];

    @Input()
    set racial(value: RacialDetalle) {
        this.racialActual = value;
        this.prerrequisitosAgrupados = agruparPrerrequisitos(value?.Prerrequisitos);
        this.flagsPrerrequisito = this.construirFlags();
        this.dotes = (value?.Dotes ?? [])
            .filter((dote) => tieneTextoVisible(dote?.Dote))
            .map((dote) => ({
                id: Number(dote.Id_dote),
                nombre: `${dote.Dote}`.trim(),
                extra: textoVisible(dote.Extra),
            }));
        this.habilidadesBase = this.construirHabilidades(value?.Habilidades?.Base);
        this.habilidadesCustom = this.construirHabilidades(value?.Habilidades?.Custom);
        this.caracteristicas = this.construirBonificadores(value?.Caracteristicas, 'Caracteristica');
        this.salvaciones = this.construirBonificadores(value?.Salvaciones, 'Salvacion');
        this.sortilegas = (value?.Sortilegas ?? []).map((sortilega) => ({
            id: Number(sortilega?.Conjuro?.Id),
            nombre: tieneTextoVisible(sortilega?.Conjuro?.Nombre) ? `${sortilega.Conjuro.Nombre}`.trim() : 'Conjuro sin nombre',
            detalle: [
                tieneTextoVisible(sortilega?.Nivel_lanzador) ? `Nivel de lanzador ${sortilega.Nivel_lanzador}` : '',
                tieneTextoVisible(sortilega?.Usos_diarios) ? `Usos: ${sortilega.Usos_diarios}` : '',
            ].filter(Boolean).join(' · '),
        }));
        this.ataques = (value?.Ataques ?? [])
            .map((ataque) => `${ataque?.Descripcion ?? ''}`.trim())
            .filter((descripcion) => tieneTextoVisible(descripcion));
        this.datosEsencia = datosVisibles(datosEsenciaRasgo(value?.Esencia));
    }

    get racial(): RacialDetalle {
        return this.racialActual;
    }

    @Output() razaDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() doteDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() conjuroDetallesId: EventEmitter<number> = new EventEmitter<number>();

    get tienePrerrequisitos(): boolean {
        return this.prerrequisitosAgrupados.length > 0 || this.flagsPrerrequisito.length > 0;
    }

    emitirDote(idDote: number): void {
        const id = Number(idDote);
        if (Number.isFinite(id) && id > 0)
            this.doteDetallesId.emit(id);
    }

    /** La raza pedida lleva a su detalle (función: la usa `<app-ficha-prerrequisitos>`). */
    readonly esPrerrequisitoNavegable = (condicion: CondicionPrerrequisito): boolean =>
        destinoPrerrequisito(condicion)?.entidad === 'raza';

    abrirDetallePrerrequisito(condicion: CondicionPrerrequisito): void {
        const destino = destinoPrerrequisito(condicion);
        if (destino?.entidad === 'raza')
            this.razaDetallesId.emit(destino.id);
    }

    esIdNavegable(id: number | null | undefined): boolean {
        const numero = Number(id);
        return Number.isFinite(numero) && numero > 0;
    }

    emitirConjuro(idConjuro: number | null | undefined): void {
        if (this.esIdNavegable(idConjuro))
            this.conjuroDetallesId.emit(Number(idConjuro));
    }

    /**
     * Las marcas de `Prerrequisitos_flags` cuya condición no viene en los grupos: si la API da la raza o la
     * característica pedida, ya se ve su frase y la marca sobra.
     */
    private construirFlags(): string[] {
        const flags = this.racial?.Prerrequisitos_flags;
        const claves = new Set(this.prerrequisitosAgrupados.flatMap((grupo) => grupo.condiciones.map((c) => c.clave)));
        return [
            flags?.raza && !claves.has('raza') ? 'Requiere raza' : '',
            flags?.caracteristica_minima && !claves.has('caracteristica') ? 'Requiere característica mínima' : '',
        ].filter(Boolean);
    }

    /** «Avistar (Extra) +2», con la condición y si se considera de clase como notas. */
    private construirHabilidades(items: Record<string, any>[] | null | undefined): BonificadorRacial[] {
        return (items ?? [])
            .filter((item) => tieneTextoVisible(item?.['Habilidad']))
            .map((item) => {
                const extra = resolverExtraHabilidadVisible({
                    extra: item['Extra'],
                    idExtra: item['Id_extra'],
                    extraComodin: item['Extra_comodin'],
                    soportaExtra: item['Soporta_extra'],
                    allowIdZeroAsChoose: Object.prototype.hasOwnProperty.call(item, 'Id_extra'),
                });
                const nombre = `${item['Habilidad']}`.trim();
                return {
                    nombre: tieneTextoVisible(extra) ? `${nombre} (${extra})` : nombre,
                    valor: this.textoBonificador(item['Rangos']),
                    notas: [
                        textoVisible(item['Condicion']),
                        toBoolean(item['Se_considera_clasea']) ? 'Se considera de clase' : '',
                    ].filter(Boolean),
                };
            });
    }

    /** Las características o salvaciones: su nombre, la cantidad con signo y la condición, si la hay. */
    private construirBonificadores(items: Record<string, any>[] | null | undefined, campoNombre: string): BonificadorRacial[] {
        return (items ?? [])
            .filter((item) => tieneTextoVisible(item?.[campoNombre]))
            .map((item) => ({
                nombre: `${item[campoNombre]}`.trim(),
                valor: this.textoBonificador(item['Cantidad']),
                notas: tieneTextoVisible(item['Condicion']) ? [`${item['Condicion']}`.trim()] : [],
            }));
    }

    private textoBonificador(valor: unknown): string {
        const numero = Number(valor);
        return valor !== null && valor !== undefined && Number.isFinite(numero) && numero !== 0 ? textoConSigno(numero) : '';
    }
}
