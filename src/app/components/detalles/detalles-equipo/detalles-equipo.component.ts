import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
    ConjuntoObjetosDetalle,
    EncantamientoDetalle,
    EntradaEquipo,
    EquipoAura,
    MaterialDetalle,
    ModificadorEstructurado,
    MunicionDetalle,
    ObjetoDetalle,
    TipoCatalogoEquipo,
} from 'src/app/interfaces/equipo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { formatoNumero, textoAplicaA, textoConSigno, textoModificador, textoPeso, textoPrecio } from 'src/app/services/utils/equipo-texto';
import { etiquetaManual } from 'src/app/services/utils/manual-mapper';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';

/** Un dato corto del detalle: «Dureza 15». */
interface DatoEquipo {
    etiqueta: string;
    valor: string;
    ayuda?: string;
}

const CATEGORIA_OBJETO: Readonly<Record<string, string>> = { mundano: 'Mundano', magico: 'Mágico', psionico: 'Psiónico' };

/**
 * El detalle de una entrada de los catálogos nuevos del equipo (objeto, material, munición, aptitud especial de armas y
 * armaduras, conjunto de objetos), con el patrón de las vistas `detalles-*`. Los enlaces a otras entradas (las armas que
 * disparan una munición, las piezas de un conjunto, los requisitos de una aptitud) abren su detalle.
 */
@Component({
    selector: 'app-detalles-equipo',
    templateUrl: './detalles-equipo.component.html',
    styleUrls: ['./detalles-equipo.component.sass'],
    standalone: false
})
export class DetallesEquipoComponent {
    @Input() entrada!: EntradaEquipo;
    @Output() equipoDetalles = new EventEmitter<{ tipo: TipoCatalogoEquipo; id: number; }>();
    @Output() armaDetallesId = new EventEmitter<number>();
    @Output() armaduraDetallesId = new EventEmitter<number>();
    @Output() doteDetallesId = new EventEmitter<number>();
    @Output() conjuroDetallesId = new EventEmitter<number>();

    readonly tieneTextoVisible = tieneTextoVisible;
    readonly textoModificador = textoModificador;

    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    get objeto(): ObjetoDetalle | null { return this.entrada?.tipo === 'objeto' ? this.entrada.item : null; }
    get material(): MaterialDetalle | null { return this.entrada?.tipo === 'material' ? this.entrada.item : null; }
    get municion(): MunicionDetalle | null { return this.entrada?.tipo === 'municion' ? this.entrada.item : null; }
    get encantamiento(): EncantamientoDetalle | null { return this.entrada?.tipo === 'encantamiento' ? this.entrada.item : null; }
    get conjunto(): ConjuntoObjetosDetalle | null { return this.entrada?.tipo === 'conjunto' ? this.entrada.item : null; }

    get manualLabel(): string {
        return etiquetaManual(this.entrada?.item?.Manual);
    }

    get tieneManual(): boolean {
        return tieneTextoVisible(this.entrada?.item?.Manual?.Nombre);
    }

    get modificadores(): ModificadorEstructurado[] {
        return this.objeto?.Modificadores ?? this.encantamiento?.Modificadores ?? [];
    }

    /** Los datos cortos de la entrada, según su tipo. */
    get datos(): DatoEquipo[] {
        const datos: DatoEquipo[] = [];
        const poner = (etiqueta: string, valor: string | null | undefined, ayuda?: string) => {
            if (tieneTextoVisible(valor))
                datos.push({ etiqueta, valor: `${valor}`, ayuda });
        };
        const objeto = this.objeto;
        if (objeto) {
            poner('Tipo', objeto.Tipo ? `${objeto.Tipo.Nombre} (${CATEGORIA_OBJETO[objeto.Tipo.Categoria] ?? objeto.Tipo.Categoria})` : null);
            if (objeto.Generico_conjuro) {
                poner('Precio', `${textoPrecio(objeto.Generico_conjuro.Precio_por_nivel)} × nivel del conjuro × nivel de lanzador`,
                    'El conjuro de nivel 0 cuenta como ½. El conjuro se elige al comprarlo.');
                poner('Conjuros hasta el nivel', this.numero(objeto.Generico_conjuro.Nivel_maximo));
            } else {
                poner('Precio', objeto.Precio === null ? null : textoPrecio(objeto.Precio));
            }
            poner('Peso', objeto.Peso === null ? null : textoPeso(objeto.Peso));
            poner('Ranura', objeto.Ranura?.Nombre);
            poner('Nivel de objeto', this.numero(objeto.Nivel_objeto));
            poner('Nivel de lanzador', this.numero(objeto.Nivel_lanzador));
            poner('Aura', this.textoAura(objeto.Aura));
            poner('Activación', objeto.Activaciones
                .map((activacion) => activacion.Accion ? `${activacion.Nombre} (${activacion.Accion.Nombre.toLowerCase()})` : activacion.Nombre)
                .join(', '));
            poner('Cargas', this.numero(objeto.Cargas));
            poner('Usos al día', this.numero(objeto.Usos_por_dia));
            poner('Para usarlo', objeto.Requisitos_uso);
            poner('Montura', objeto.Monstruo?.Nombre);
            poner('Mejora', this.textoMejora(objeto.Bonificador_mejora, objeto.Bonificador_mejora_2));
            poner('Material', objeto.Material?.Nombre);
        }
        const material = this.material;
        if (material) {
            poner('Dureza', this.numero(material.Dureza));
            poner('PG por pulgada', this.numero(material.Pg_por_pulgada));
            const efectos = material.Efectos;
            poner('Peso', efectos.Peso_multiplicador === null ? null : `×${formatoNumero(efectos.Peso_multiplicador)}`);
            poner('Destreza máxima', efectos.Bon_des_mas === null ? null : textoConSigno(efectos.Bon_des_mas));
            poner('Penalizador de armadura', efectos.Penalizador_menos === null ? null : `${formatoNumero(efectos.Penalizador_menos)} menos`);
            poner('Fallo de conjuro arcano', efectos.Fallo_arcano_menos === null ? null : `${formatoNumero(efectos.Fallo_arcano_menos)}% menos`);
            poner('Daño', efectos.Dano_mod === null ? null : textoConSigno(efectos.Dano_mod));
        }
        const municion = this.municion;
        if (municion) {
            poner('Precio', municion.Precio === null ? null : `${textoPrecio(municion.Precio)} las ${municion.Cantidad_por_precio}`);
            poner('Peso', municion.Peso === null ? null : `${textoPeso(municion.Peso)} las ${municion.Cantidad_por_precio}`);
        }
        const encantamiento = this.encantamiento;
        if (encantamiento) {
            poner('Bonificador equivalente', encantamiento.Modificador > 0 ? textoConSigno(encantamiento.Modificador) : null);
            poner('Precio', encantamiento.Coste > 0 ? textoPrecio(encantamiento.Coste) : null);
            poner('Se aplica a', textoAplicaA(encantamiento.Aplica_a));
            poner('Solo armas', encantamiento.Tipos_dano_requeridos.map((tipo) => tipo.Nombre.toLowerCase()).join(', '));
            poner('Nivel de lanzador', this.numero(encantamiento.Nivel_lanzador));
            poner('Aura', this.textoAura(encantamiento.Aura));
        }
        return datos;
    }

    /** Lo que es la entrada además de sus datos: maldito, inteligente, reliquia, de gran calidad… */
    get marcas(): string[] {
        const marcas: string[] = [];
        if (this.objeto?.Maldito) marcas.push('Maldito');
        if (this.objeto?.Inteligente) marcas.push('Inteligente');
        if (this.objeto?.Reliquia) marcas.push('Reliquia');
        if (this.material?.Cuenta_como_gran_calidad) marcas.push('Cuenta como de gran calidad');
        if (this.material?.Supera_rd) marcas.push('Supera la reducción de daño');
        if (this.material?.Efectos.Categoria_mas_ligera) marcas.push('La armadura cuenta una categoría más ligera');
        if (this.encantamiento?.Es_plantilla) marcas.push('Plantilla');
        return marcas;
    }

    /** Los costes de un material, uno por línea: «Armadura ligera: +1.000 po». */
    get costesMaterial(): string[] {
        return (this.material?.Costes ?? []).map((coste) => {
            const partes: string[] = [];
            if (coste.Coste !== null) partes.push(`+${textoPrecio(coste.Coste)}`);
            if (coste.Coste_por_libra !== null) partes.push(`+${textoPrecio(coste.Coste_por_libra)} por libra`);
            if (coste.Multiplicador_precio !== null) partes.push(`precio ×${formatoNumero(coste.Multiplicador_precio)}`);
            if (coste.Coste_encantar !== null) partes.push(`+${textoPrecio(coste.Coste_encantar)} al encantarlo`);
            return `${coste.Aplicacion.Nombre}: ${partes.join(', ') || '—'}`;
        });
    }

    get danosEncantamiento(): string[] {
        return (this.encantamiento?.Danos ?? []).map((dano) =>
            [dano.Dados, dano.Tipo_dano?.Nombre?.toLowerCase() ?? '', dano.Condicion ?? ''].filter((p) => p.length > 0).join(' '));
    }

    get creacion(): DatoEquipo[] {
        const creacion = this.objeto?.Creacion;
        if (!creacion)
            return [];
        return [
            { etiqueta: 'Coste', valor: creacion.Coste_po === null ? '' : textoPrecio(creacion.Coste_po) },
            { etiqueta: 'PX', valor: this.numero(creacion.Coste_px) ?? '' },
            { etiqueta: 'Días', valor: this.numero(creacion.Dias) ?? '' },
            { etiqueta: 'Otros requisitos', valor: creacion.Otros_requisitos ?? '' },
        ].filter((dato) => tieneTextoVisible(dato.valor));
    }

    get tieneCreacion(): boolean {
        const creacion = this.objeto?.Creacion;
        return !!creacion && (this.creacion.length > 0 || creacion.Requisitos.Dotes.length > 0 || creacion.Requisitos.Conjuros.length > 0);
    }

    abrirDetalleManual(): void {
        this.manualDetalleNavSvc.abrirDetalleManual({ id: this.entrada?.item?.Manual?.Id, nombre: this.entrada?.item?.Manual?.Nombre });
    }

    abrirEquipo(tipo: TipoCatalogoEquipo, id: number): void {
        if (Number(id) > 0)
            this.equipoDetalles.emit({ tipo, id: Number(id) });
    }

    abrirArma(id: number): void {
        if (Number(id) > 0)
            this.armaDetallesId.emit(Number(id));
    }

    abrirArmadura(id: number): void {
        if (Number(id) > 0)
            this.armaduraDetallesId.emit(Number(id));
    }

    abrirDote(id: number): void {
        if (Number(id) > 0)
            this.doteDetallesId.emit(Number(id));
    }

    abrirConjuro(id: number): void {
        if (Number(id) > 0)
            this.conjuroDetallesId.emit(Number(id));
    }

    /** La mejora de un arma o armadura específica: «+2», o «+1/+1» en un arma doble. */
    private textoMejora(mejora: number | null, mejora2: number | null): string | null {
        if (mejora === null)
            return null;
        return mejora2 === null ? textoConSigno(mejora) : `${textoConSigno(mejora)}/${textoConSigno(mejora2)}`;
    }

    private numero(valor: number | null | undefined): string | null {
        return valor === null || valor === undefined ? null : formatoNumero(valor);
    }

    private textoAura(aura: EquipoAura): string {
        const intensidad = `${aura?.Intensidad?.Nombre ?? ''}`.trim();
        const escuelas = (aura?.Escuelas ?? []).map((escuela) => escuela.Nombre.toLowerCase()).join(', ');
        return [intensidad, escuelas].filter((parte) => parte.length > 0).join(', ');
    }
}
