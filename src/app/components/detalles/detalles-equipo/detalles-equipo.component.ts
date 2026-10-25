import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatoFicha, EtiquetaFicha, unirTipo } from 'src/app/components/detalles/ficha';
import { descripcionEquipoVisible } from 'src/app/components/shared/descripcion-equipo/descripcion-equipo.component';
import {
    ConjuntoObjetosDetalle,
    EncantamientoDetalle,
    EntradaEquipo,
    EquipoAura,
    EquipoRef,
    MaterialDetalle,
    ModificadorEstructurado,
    MunicionDetalle,
    ObjetoDetalle,
    TipoCatalogoEquipo,
} from 'src/app/interfaces/equipo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { formatoNumero, textoAplicaA, textoConSigno, textoMejora, textoModificador, textoPeso, textoPrecio } from 'src/app/services/utils/equipo-texto';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';

const CATEGORIA_OBJETO: Readonly<Record<string, string>> = { mundano: 'Mundano', magico: 'Mágico', psionico: 'Psiónico' };

/** El nombre de cada catálogo, para el tipo de la cabecera. */
const TIPO_CATALOGO: Readonly<Record<TipoCatalogoEquipo, string>> = {
    objeto: 'Objeto',
    material: 'Material especial',
    municion: 'Munición',
    encantamiento: 'Aptitud especial',
    conjunto: 'Conjunto de objetos',
};

/** Un modificador en una línea; los condicionales se enseñan y no se suman. */
interface ModificadorVisible {
    texto: string;
    condicional: boolean;
}

/** Un conjuro de un objeto, con lo que se sepa de él. */
interface ConjuroObjetoVisible {
    id: number;
    nombre: string;
    nivelLanzador: string;
    cargasPorUso: string;
    usosPorDia: string;
}

/** Un coste de un material según a qué se aplica («Armadura ligera», +1.000 po). */
interface CosteMaterialVisible {
    aplicacion: string;
    coste: string;
    porLibra: string;
    multiplicador: string;
    encantar: string;
}

/** Qué columnas de una tabla tienen algo en alguna fila (las vacías en todas no se pintan). */
type Columnas<T> = Partial<Record<keyof T, boolean>>;

/**
 * El detalle de una entrada de los catálogos nuevos del equipo (objeto, material, munición, aptitud especial de armas y
 * armaduras, conjunto de objetos), con la ficha común de los detalles. Los enlaces a otras entradas (la base de un arma
 * o armadura específica, las armas que disparan una munición, las piezas de un conjunto, los requisitos de una aptitud)
 * abren su detalle.
 */
@Component({
    selector: 'app-detalles-equipo',
    templateUrl: './detalles-equipo.component.html',
    standalone: false
})
export class DetallesEquipoComponent {
    private entradaActual!: EntradaEquipo;

    @Input()
    set entrada(valor: EntradaEquipo) {
        this.entradaActual = valor;
        this.recalcular();
    }
    get entrada(): EntradaEquipo {
        return this.entradaActual;
    }

    @Output() equipoDetalles = new EventEmitter<{ tipo: TipoCatalogoEquipo; id: number; }>();
    @Output() armaDetallesId = new EventEmitter<number>();
    @Output() armaduraDetallesId = new EventEmitter<number>();
    @Output() doteDetallesId = new EventEmitter<number>();
    @Output() conjuroDetallesId = new EventEmitter<number>();

    objeto: ObjetoDetalle | null = null;
    material: MaterialDetalle | null = null;
    municion: MunicionDetalle | null = null;
    encantamiento: EncantamientoDetalle | null = null;
    conjunto: ConjuntoObjetosDetalle | null = null;

    /** «Objeto maravilloso · Mágico», «Material especial»… */
    tipoCabecera = '';
    /** Lo que es la entrada además de sus datos: maldito, inteligente, reliquia, plantilla. */
    etiquetas: EtiquetaFicha[] = [];
    datos: DatoFicha[] = [];
    conDescripcion = false;
    modificadores: ModificadorVisible[] = [];
    /** Lo que da un material además de sus efectos: cuenta como de gran calidad, supera la RD… */
    propiedadesMaterial: string[] = [];
    danosEncantamiento: string[] = [];
    creacion: DatoFicha[] = [];
    tieneCreacion = false;
    tieneRequisitosEncantamiento = false;
    conjuros: ConjuroObjetoVisible[] = [];
    columnasConjuros: Columnas<ConjuroObjetoVisible> = {};
    costesMaterial: CosteMaterialVisible[] = [];
    columnasCostes: Columnas<CosteMaterialVisible> = {};

    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

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

    private recalcular(): void {
        const entrada = this.entrada;
        this.objeto = entrada?.tipo === 'objeto' ? entrada.item : null;
        this.material = entrada?.tipo === 'material' ? entrada.item : null;
        this.municion = entrada?.tipo === 'municion' ? entrada.item : null;
        this.encantamiento = entrada?.tipo === 'encantamiento' ? entrada.item : null;
        this.conjunto = entrada?.tipo === 'conjunto' ? entrada.item : null;

        this.tipoCabecera = this.construirTipo();
        this.etiquetas = this.construirEtiquetas();
        this.datos = this.construirDatos();
        this.conDescripcion = descripcionEquipoVisible(entrada?.item);
        this.modificadores = (this.objeto?.Modificadores ?? this.encantamiento?.Modificadores ?? [])
            .map((modificador: ModificadorEstructurado) => ({ texto: textoModificador(modificador), condicional: !!modificador.Condicion }));
        this.propiedadesMaterial = this.construirPropiedadesMaterial();
        this.danosEncantamiento = (this.encantamiento?.Danos ?? []).map((dano) =>
            [dano.Dados, dano.Tipo_dano?.Nombre?.toLowerCase() ?? '', dano.Condicion ?? ''].filter((p) => p.length > 0).join(' '));
        this.creacion = this.construirCreacion();
        const requisitosCreacion = this.objeto?.Creacion?.Requisitos;
        this.tieneCreacion = this.creacion.length > 0 || (requisitosCreacion?.Dotes?.length ?? 0) + (requisitosCreacion?.Conjuros?.length ?? 0) > 0;
        this.tieneRequisitosEncantamiento = (this.encantamiento?.Requisitos?.Dotes?.length ?? 0) + (this.encantamiento?.Requisitos?.Conjuros?.length ?? 0) > 0;
        this.conjuros = (this.objeto?.Conjuros ?? []).map((conjuro) => ({
            id: conjuro.Id,
            nombre: conjuro.Nombre,
            nivelLanzador: this.numero(conjuro.Nivel_lanzador) ?? '',
            cargasPorUso: this.numero(conjuro.Cargas_por_uso) ?? '',
            usosPorDia: conjuro.Usos_por_dia === null ? '' : `${formatoNumero(conjuro.Usos_por_dia)}/día`,
        }));
        this.columnasConjuros = columnasConDatos(this.conjuros, ['nivelLanzador', 'cargasPorUso', 'usosPorDia']);
        this.costesMaterial = (this.material?.Costes ?? []).map((coste) => ({
            aplicacion: coste.Aplicacion?.Nombre ?? '',
            coste: coste.Coste === null ? '' : `+${textoPrecio(coste.Coste)}`,
            porLibra: coste.Coste_por_libra === null ? '' : `+${textoPrecio(coste.Coste_por_libra)}`,
            multiplicador: coste.Multiplicador_precio === null ? '' : `×${formatoNumero(coste.Multiplicador_precio)}`,
            encantar: coste.Coste_encantar === null ? '' : `+${textoPrecio(coste.Coste_encantar)}`,
        }));
        this.columnasCostes = columnasConDatos(this.costesMaterial, ['coste', 'porLibra', 'multiplicador', 'encantar']);
    }

    private construirTipo(): string {
        const entrada = this.entrada;
        if (!entrada)
            return '';
        const objeto = this.objeto;
        if (objeto?.Tipo)
            return unirTipo([objeto.Tipo.Nombre, CATEGORIA_OBJETO[objeto.Tipo.Categoria] ?? objeto.Tipo.Categoria]);
        return TIPO_CATALOGO[entrada.tipo] ?? '';
    }

    private construirEtiquetas(): EtiquetaFicha[] {
        const etiquetas: EtiquetaFicha[] = [];
        if (this.objeto?.Maldito) etiquetas.push({ texto: 'Maldito', aviso: true });
        if (this.objeto?.Inteligente) etiquetas.push({ texto: 'Inteligente' });
        if (this.objeto?.Reliquia) etiquetas.push({ texto: 'Reliquia' });
        if (this.encantamiento?.Es_plantilla) etiquetas.push({ texto: 'Plantilla' });
        return etiquetas;
    }

    private construirPropiedadesMaterial(): string[] {
        const material = this.material;
        if (!material)
            return [];
        return [
            material.Cuenta_como_gran_calidad ? 'Cuenta como de gran calidad' : '',
            material.Supera_rd ? 'Supera la reducción de daño' : '',
            material.Efectos?.Categoria_mas_ligera ? 'La armadura cuenta una categoría más ligera' : '',
        ].filter((propiedad) => propiedad.length > 0);
    }

    /** Los datos clave de la entrada, según su tipo. Los que no tienen valor no se enseñan. */
    private construirDatos(): DatoFicha[] {
        const objeto = this.objeto;
        if (objeto)
            return this.datosObjeto(objeto);
        const material = this.material;
        if (material) {
            const efectos = material.Efectos;
            return [
                { etiqueta: 'Dureza', valor: this.numero(material.Dureza) },
                { etiqueta: 'PG por pulgada', valor: this.numero(material.Pg_por_pulgada) },
                { etiqueta: 'Peso', valor: efectos?.Peso_multiplicador == null ? null : `×${formatoNumero(efectos.Peso_multiplicador)}` },
                { etiqueta: 'Destreza máxima', valor: efectos?.Bon_des_mas == null ? null : textoConSigno(efectos.Bon_des_mas) },
                { etiqueta: 'Penalizador de armadura', valor: efectos?.Penalizador_menos == null ? null : `${formatoNumero(efectos.Penalizador_menos)} menos` },
                { etiqueta: 'Fallo de conjuro arcano', valor: efectos?.Fallo_arcano_menos == null ? null : `${formatoNumero(efectos.Fallo_arcano_menos)}% menos` },
                { etiqueta: 'Daño', valor: efectos?.Dano_mod == null ? null : textoConSigno(efectos.Dano_mod) },
            ];
        }
        const municion = this.municion;
        if (municion) {
            return [
                { etiqueta: 'Precio', valor: municion.Precio === null ? null : `${textoPrecio(municion.Precio)} las ${municion.Cantidad_por_precio}` },
                { etiqueta: 'Peso', valor: municion.Peso === null ? null : `${textoPeso(municion.Peso)} las ${municion.Cantidad_por_precio}` },
            ];
        }
        const encantamiento = this.encantamiento;
        if (encantamiento) {
            const base = encantamiento.Encantamiento_base;
            return [
                { etiqueta: 'Bonificador equivalente', valor: encantamiento.Modificador > 0 ? textoConSigno(encantamiento.Modificador) : null },
                { etiqueta: 'Precio', valor: encantamiento.Coste > 0 ? textoPrecio(encantamiento.Coste) : null },
                { etiqueta: 'Se aplica a', valor: textoAplicaA(encantamiento.Aplica_a) },
                { etiqueta: 'Solo armas', valor: encantamiento.Tipos_dano_requeridos.map((tipo) => tipo.Nombre.toLowerCase()).join(', ') },
                { etiqueta: 'Nivel de lanzador', valor: this.numero(encantamiento.Nivel_lanzador) },
                { etiqueta: 'Aura', valor: this.textoAura(encantamiento.Aura) },
                { ...this.enlace('Requiere antes', base, () => this.abrirEquipo('encantamiento', base?.Id ?? 0)), ayuda: 'La aptitud que pide antes' },
            ];
        }
        return [];
    }

    private datosObjeto(objeto: ObjetoDetalle): DatoFicha[] {
        const datos: DatoFicha[] = [
            // Las armas y armaduras mágicas específicas: su base (que se abre), su mejora y su material.
            this.enlace('Arma base', objeto.Arma_base, () => this.abrirArma(objeto.Arma_base?.Id ?? 0)),
            this.enlace('Armadura base', objeto.Armadura_base, () => this.abrirArmadura(objeto.Armadura_base?.Id ?? 0)),
            { etiqueta: 'Mejora', valor: objeto.Bonificador_mejora === null ? null : textoMejora(objeto.Bonificador_mejora, objeto.Bonificador_mejora_2) },
            this.enlace('Material', objeto.Material, () => this.abrirEquipo('material', objeto.Material?.Id ?? 0)),
        ];
        if (objeto.Generico_conjuro) {
            datos.push(
                {
                    etiqueta: 'Precio',
                    valor: `${textoPrecio(objeto.Generico_conjuro.Precio_por_nivel)} × nivel del conjuro × nivel de lanzador`,
                    ayuda: 'El conjuro de nivel 0 cuenta como ½. El conjuro se elige al comprarlo.',
                },
                { etiqueta: 'Conjuros hasta el nivel', valor: this.numero(objeto.Generico_conjuro.Nivel_maximo) },
            );
        } else {
            datos.push({ etiqueta: 'Precio', valor: objeto.Precio === null ? null : textoPrecio(objeto.Precio) });
        }
        datos.push(
            { etiqueta: 'Peso', valor: objeto.Peso === null ? null : textoPeso(objeto.Peso) },
            { etiqueta: 'Ranura', valor: objeto.Ranura?.Nombre },
            { etiqueta: 'Nivel de objeto', valor: this.numero(objeto.Nivel_objeto) },
            { etiqueta: 'Nivel de lanzador', valor: this.numero(objeto.Nivel_lanzador) },
            { etiqueta: 'Aura', valor: this.textoAura(objeto.Aura) },
            {
                etiqueta: 'Activación',
                valor: (objeto.Activaciones ?? [])
                    .map((activacion) => activacion.Accion ? `${activacion.Nombre} (${activacion.Accion.Nombre.toLowerCase()})` : activacion.Nombre)
                    .join(', '),
            },
            { etiqueta: 'Cargas', valor: this.numero(objeto.Cargas) },
            { etiqueta: 'Usos al día', valor: this.numero(objeto.Usos_por_dia) },
            { etiqueta: 'Para usarlo', valor: objeto.Requisitos_uso },
            { etiqueta: 'Montura', valor: objeto.Monstruo?.Nombre },
            this.enlace('Conjunto', objeto.Conjunto, () => this.abrirEquipo('conjunto', objeto.Conjunto?.Id ?? 0)),
        );
        return datos;
    }

    /** Un dato que abre otra entrada si tiene id; si no, es solo texto. */
    private enlace(etiqueta: string, ref: EquipoRef | null | undefined, abrir: () => void): DatoFicha {
        return { etiqueta, valor: ref?.Nombre, alPulsar: Number(ref?.Id ?? 0) > 0 ? abrir : undefined };
    }

    private construirCreacion(): DatoFicha[] {
        const creacion = this.objeto?.Creacion;
        if (!creacion)
            return [];
        return [
            { etiqueta: 'Coste', valor: creacion.Coste_po === null ? null : textoPrecio(creacion.Coste_po) },
            { etiqueta: 'PX', valor: this.numero(creacion.Coste_px) },
            { etiqueta: 'Días', valor: this.numero(creacion.Dias) },
            { etiqueta: 'Otros requisitos', valor: creacion.Otros_requisitos, ancho: 2 },
        ].filter((dato) => tieneTextoVisible(dato.valor));
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

/** Las columnas que tienen algún valor en alguna fila. */
function columnasConDatos<T>(filas: T[], columnas: (keyof T)[]): Columnas<T> {
    const resultado: Columnas<T> = {};
    for (const columna of columnas)
        resultado[columna] = filas.some((fila) => `${fila[columna] ?? ''}`.trim().length > 0);
    return resultado;
}
