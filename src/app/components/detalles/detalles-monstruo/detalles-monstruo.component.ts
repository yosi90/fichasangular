import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
    CasillaFicha,
    DatoFicha,
    DatoFranja,
    DoteFicha,
    SortilegaFicha,
    datoAlineamiento,
    datoFranjaVelocidad,
    datosVisibles,
    dotesVisibles,
    sortilegasVisibles,
    textoDato,
    unirTipo,
} from 'src/app/components/detalles/ficha';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { CARACTERISTICAS, Caracteristica } from 'src/app/interfaces/caracteristica';
import { MonstruoDetalle } from 'src/app/interfaces/monstruo';
import { UserService } from 'src/app/services/user.service';
import { esMonstruoDerivado } from 'src/app/services/utils/monstruo-mapper';
import { esNivelDeFamiliar } from 'src/app/services/utils/familiar-reglas';
import { puedeModificarDesdeDetalle } from 'src/app/services/utils/permisos-catalogo';
import { RacialDetalle } from 'src/app/interfaces/racial';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { textoEjesAlineamiento } from 'src/app/services/utils/alineamiento-contrato';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { buildManiobrabilidadInfoSecciones, tieneManiobrabilidadVisible } from 'src/app/services/utils/maniobrabilidad-info';
import { toNumber } from 'src/app/services/utils/normalizacion';
import { nombreDeDieta } from 'src/app/services/utils/monstruo-formulario';
import { textoVisible, tieneTextoVisible } from 'src/app/services/utils/texto-visible';
import { porNombre } from 'src/app/services/utils/orden-texto';
import {
    NOMBRES_CARACTERISTICAS,
    SIN_CARACTERISTICA,
    abreviaturaCaracteristica,
    textoCaracteristicaMonstruo,
    textoModificadorCaracteristica,
    textoValorCaracteristica,
} from 'src/app/services/utils/caracteristicas';

/** Un par etiqueta y valor ya listo para pintar (solo los que tienen algo que enseñar). */
interface ParPintado {
    etiqueta: string;
    valor: string;
    detalle: string | null;
}

interface NivelClaseRequerido {
    idClase: number;
    nombreClase: string;
    nivel: number;
    plantilla: string;
    dote: string;
    /** Las preferencias de ley y de moral que pide ese nivel de clase («Siempre bueno»), o vacío. */
    alineamiento: string;
}

interface RequisitosRelacion {
    alineamientos: string[];
    niveles: NivelClaseRequerido[];
}

@Component({
    selector: 'app-detalles-monstruo',
    templateUrl: './detalles-monstruo.component.html',
    styleUrls: ['./detalles-monstruo.component.sass'],
    standalone: false
})
export class DetallesMonstruoComponent {
    private monstruoData!: MonstruoDetalle;
    mostrarInfoManiobrabilidad = false;

    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService, private userSvc: UserService) { }

    @Input()
    set monstruo(value: MonstruoDetalle) {
        this.monstruoData = value;
        this.calcular();
    }

    get monstruo(): MonstruoDetalle {
        return this.monstruoData;
    }

    @Output() conjuroDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() doteDetalles: EventEmitter<DoteContextual> = new EventEmitter<DoteContextual>();
    @Output() racialDetalles: EventEmitter<RacialDetalle> = new EventEmitter<RacialDetalle>();
    @Output() claseDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() subtipoDetalles: EventEmitter<{ Id?: number | null; Nombre: string; }> = new EventEmitter<{ Id?: number | null; Nombre: string; }>();
    @Output() tipoCriaturaDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() monstruoRelacionadoDetalles: EventEmitter<MonstruoDetalle> = new EventEmitter<MonstruoDetalle>();
    /** El lápiz «Modificar»: abre la pestaña de modificar el monstruo. Sin quien lo escuche, no sale. */
    @Output() modificar: EventEmitter<MonstruoDetalle> = new EventEmitter<MonstruoDetalle>();

    /**
     * Solo con permiso (el de crear monstruos, que es el que pide `PUT /monstruos/<id>`) y en el detalle del monstruo:
     * el de un familiar o un compañero que sale de él no se modifica aquí.
     */
    get puedeModificar(): boolean {
        return !this.esDetalleFamiliarOCompanero && puedeModificarDesdeDetalle(this.modificar, this.userSvc, 'monstruos');
    }

    // Lo que pinta la ficha, calculado una vez al recibir el monstruo.
    /** «Monstruo · Bestia · Mediano» (o «Familiar» / «Compañero animal» en el detalle de uno de ellos). */
    tipoCabecera = '';
    etiquetas: string[] = [];
    /** La franja grande: valor de desafío, dados de golpe, CA, iniciativa y velocidad. */
    principales: DatoFranja[] = [];
    /** Las casillas de características: «FUE», «15», «+2» (sin valor, «—» y sin modificador). */
    casillas: CasillaFicha[] = [];
    combate: ParPintado[] = [];
    resumen: DatoFicha[] = [];
    sortilegas: SortilegaFicha[] = [];
    habilidades: { nombre: string; rangos: number; }[] = [];
    dotes: DoteFicha[] = [];
    raciales: RacialDetalle[] = [];
    ataquesEspeciales: RacialDetalle[] = [];
    subtipos: { Id: number; Nombre: string; }[] = [];
    requisitosFamiliar: RequisitosRelacion | null = null;
    requisitosCompanero: RequisitosRelacion | null = null;
    familiares: MonstruoDetalle[] = [];
    companeros: MonstruoDetalle[] = [];
    /** Los datos propios del familiar o compañero (su número, vida, DG y trucos adicionales, origen y plantilla). */
    relacion: DatoFicha[] = [];
    personajesDirectos: { Id_personaje: number; Nombre: string; }[] = [];
    especiales: { nombre: string; contexto: string; }[] = [];
    personajesPorFamiliar = '';
    personajesPorCompanero = '';

    get hayAptitudes(): boolean {
        return this.habilidades.length > 0 || this.dotes.length > 0 || this.raciales.length > 0 || this.ataquesEspeciales.length > 0;
    }

    get hayPersonajesRelacionados(): boolean {
        return this.personajesDirectos.length > 0 || this.especiales.length > 0
            || this.personajesPorFamiliar.length > 0 || this.personajesPorCompanero.length > 0;
    }

    /** «16 (+3)» con el modificador de la API, o «—» si la característica no tiene valor. */
    textoCaracteristica(clave: Caracteristica): string {
        return textoCaracteristicaMonstruo(this.monstruo?.Caracteristicas, clave);
    }

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.monstruo?.Manual?.Id,
            nombre: this.monstruo?.Manual?.Nombre,
        });
    }

    abrirDetallesConjuro(idConjuro: number) {
        const id = toNumber(idConjuro);
        if (id > 0)
            this.conjuroDetallesId.emit(id);
    }

    abrirDetallesDote(doteCtx: DoteContextual) {
        const id = toNumber(doteCtx?.Dote?.Id);
        if (id > 0)
            this.doteDetalles.emit(doteCtx);
    }

    abrirDetallesRacial(racial: RacialDetalle) {
        if (racial && tieneTextoVisible(racial?.Nombre))
            this.racialDetalles.emit(racial);
    }

    abrirDetallesClase(idClase: number) {
        const id = toNumber(idClase);
        if (id > 0)
            this.claseDetallesId.emit(id);
    }

    abrirDetallesSubtipo(subtipo: { Id?: number | null; Nombre?: string; }) {
        const nombre = `${subtipo?.Nombre ?? ''}`.trim();
        if (!tieneTextoVisible(nombre))
            return;
        const id = toNumber(subtipo?.Id);
        this.subtipoDetalles.emit({
            Id: id > 0 ? id : null,
            Nombre: nombre,
        });
    }

    abrirDetallesTipoCriatura(idTipo: number) {
        const id = toNumber(idTipo);
        if (id > 0)
            this.tipoCriaturaDetallesId.emit(id);
    }

    abrirDetallesMonstruoRelacionado(monstruo: MonstruoDetalle) {
        if (!monstruo || toNumber(monstruo.Id) <= 0)
            return;
        this.monstruoRelacionadoDetalles.emit(monstruo);
    }

    get esDetalleFamiliarOCompanero(): boolean {
        return esMonstruoDerivado(this.monstruo);
    }

    private get idFamiliar(): number {
        return toNumber((this.monstruo as any)?.Id_familiar);
    }

    private get idCompanero(): number {
        return toNumber((this.monstruo as any)?.Id_companero);
    }

    getNivelesClaseRequeridosFamiliar(): NivelClaseRequerido[] {
        return this.getNivelesClaseRequeridos('Familiar');
    }

    getNivelesClaseRequeridosCompanero(): NivelClaseRequerido[] {
        return this.getNivelesClaseRequeridos('Companero');
    }

    mostrarManiobrabilidad(): boolean {
        const vuela = toNumber(this.monstruo?.Movimientos?.Volar) > 0;
        if (!vuela)
            return false;
        return tieneManiobrabilidadVisible(this.monstruo?.Maniobrabilidad);
    }

    abrirInfoManiobrabilidad(event?: Event): void {
        event?.preventDefault();
        event?.stopPropagation();
        this.mostrarInfoManiobrabilidad = true;
    }

    cerrarInfoManiobrabilidad(): void {
        this.mostrarInfoManiobrabilidad = false;
    }

    getManiobrabilidadInfoSecciones() {
        return buildManiobrabilidadInfoSecciones(this.monstruo?.Maniobrabilidad);
    }

    private calcular(): void {
        const m = this.monstruoData;
        const relacionado = this.esDetalleFamiliarOCompanero;
        this.tipoCabecera = unirTipo([
            this.idFamiliar > 0 ? 'Familiar' : this.idCompanero > 0 ? 'Compañero animal' : 'Monstruo',
            m?.Tipo?.Nombre,
            m?.Tamano?.Nombre,
        ]);
        this.etiquetas = [
            m?.Familiar && !relacionado ? 'Puede ser familiar' : '',
            m?.Companero && !relacionado ? 'Puede ser compañero animal' : '',
        ].filter(Boolean);
        this.principales = this.calcularPrincipales();
        this.casillas = CARACTERISTICAS.map((clave) => this.casilla(clave));
        this.combate = this.calcularCombate();
        this.resumen = this.calcularResumen();
        this.sortilegas = sortilegasVisibles(m?.Sortilegas);
        this.habilidades = (m?.Habilidades ?? [])
            .map((h) => {
                const habilidad = `${h?.Habilidad ?? ''}`.trim();
                const extra = `${h?.Extra ?? ''}`.trim();
                return { nombre: tieneTextoVisible(extra) ? `${habilidad} (${extra})` : habilidad, habilidad, rangos: toNumber(h?.Rangos) };
            })
            .filter((h) => tieneTextoVisible(h.habilidad) && h.rangos > 0)
            .map(({ nombre, rangos }) => ({ nombre, rangos }));
        this.dotes = dotesVisibles(m?.Dotes);
        this.raciales = (m?.Raciales ?? []).filter((racial) => tieneTextoVisible(racial?.Nombre));
        this.ataquesEspeciales = (m?.Ataques_especiales ?? []).filter((ataque) => tieneTextoVisible(ataque?.Nombre));
        this.subtipos = (m?.Subtipos ?? [])
            .filter((subtipo) => tieneTextoVisible(subtipo?.Nombre))
            .map((subtipo) => ({ Id: toNumber(subtipo?.Id), Nombre: `${subtipo?.Nombre ?? ''}`.trim() }))
            .sort(porNombre);
        this.requisitosFamiliar = relacionado ? null : this.requisitos('Familiar');
        this.requisitosCompanero = relacionado ? null : this.requisitos('Companero');
        this.familiares = this.relacionados(m?.Familiares);
        this.companeros = this.relacionados(m?.Companeros);
        this.relacion = this.calcularRelacion();
        this.personajesDirectos = (Array.isArray((m as any)?.Personajes) ? (m as any).Personajes : [])
            .filter((item: any) => toNumber(item?.Id_personaje) > 0 && tieneTextoVisible(item?.Nombre))
            .map((item: any) => ({ Id_personaje: toNumber(item?.Id_personaje), Nombre: `${item?.Nombre ?? ''}`.trim() }));
        this.especiales = (Array.isArray((m as any)?.Especiales) ? (m as any).Especiales : [])
            .map((item: any) => ({ nombre: `${item?.Especial?.Nombre ?? ''}`.trim(), contexto: this.formatearContexto(item?.Contexto) }))
            .filter((item: { nombre: string; }) => tieneTextoVisible(item.nombre));
        this.personajesPorFamiliar = this.formatearListaPersonajes((m?.Personajes_relacionados?.Por_familiar ?? [])
            .map((item) => ({ id: item?.Id_personaje, nombre: item?.Nombre, extra: `F#${toNumber(item?.Id_familiar)}` })));
        this.personajesPorCompanero = this.formatearListaPersonajes((m?.Personajes_relacionados?.Por_companero ?? [])
            .map((item) => ({ id: item?.Id_personaje, nombre: item?.Nombre, extra: `C#${toNumber(item?.Id_companero)}` })));
    }

    private calcularPrincipales(): DatoFranja[] {
        const m = this.monstruoData;
        const defensa = m?.Defensa;
        return [
            { etiqueta: 'Valor de desafío', valor: m?.Valor_desafio },
            { etiqueta: 'Dados de golpe', valor: this.textoDadosGolpe() },
            {
                etiqueta: 'Clase de armadura',
                valor: defensa?.Ca,
                detalle: defensa ? `toque ${defensa.Toque}, desprevenido ${defensa.Desprevenido}` : null,
            },
            { etiqueta: 'Iniciativa', valor: m ? textoConSigno(toNumber(m.Iniciativa)) : null },
            datoFranjaVelocidad(m?.Movimientos, this.mostrarManiobrabilidad()
                ? { maniobrabilidad: m.Maniobrabilidad.Nombre, abrirReglas: (evento: Event) => this.abrirInfoManiobrabilidad(evento) }
                : null),
        ];
    }

    /** «1d8+1»: los dados de golpe con su suma. */
    private textoDadosGolpe(): string {
        const dg = this.monstruoData?.Dados_golpe;
        const cantidad = `${dg?.Cantidad ?? ''}`.trim();
        if (!tieneTextoVisible(cantidad))
            return '';
        const suma = toNumber(dg?.Suma);
        return `${cantidad}${`${dg?.Tipo_dado?.Nombre ?? ''}`.trim().toLowerCase()}${suma !== 0 ? textoConSigno(suma) : ''}`;
    }

    private calcularCombate(): ParPintado[] {
        const m = this.monstruoData;
        const ataque = m?.Ataque;
        const salvaciones = m?.Salvaciones;
        const defensa = m?.Defensa;
        return this.pintar([
            {
                etiqueta: 'Ataque base / presa',
                valor: ataque ? `${textoConSigno(toNumber(ataque.Ataque_base))} / ${textoConSigno(toNumber(ataque.Presa))}` : null,
            },
            { etiqueta: 'Ataque', valor: ataque?.Ataques },
            { etiqueta: 'Ataque completo', valor: ataque?.Ataque_completo },
            {
                etiqueta: 'Salvaciones',
                valor: salvaciones
                    ? `Fortaleza ${textoConSigno(toNumber(salvaciones.Fortaleza))}, Reflejos ${textoConSigno(toNumber(salvaciones.Reflejos))}, `
                    + `Voluntad ${textoConSigno(toNumber(salvaciones.Voluntad))}`
                    : null,
            },
            { etiqueta: 'Armadura natural', valor: toNumber(defensa?.Armadura_natural) !== 0 ? textoConSigno(toNumber(defensa?.Armadura_natural)) : null },
            this.espacioYAlcance(),
            { etiqueta: 'Reducción de daño', valor: defensa?.Reduccion_dano },
            { etiqueta: 'Resistencia a conjuros', valor: defensa?.Resistencia_conjuros },
            { etiqueta: 'Resistencia elemental', valor: defensa?.Resistencia_elemental },
            { etiqueta: 'CD de las sortílegas', valor: m?.Cd_sortilegas },
        ]);
    }

    /** «5' / 5'», o solo el que tenga valor. */
    private espacioYAlcance(): DatoFicha {
        const espacio = toNumber(this.monstruoData?.Espacio);
        const alcance = toNumber(this.monstruoData?.Alcance);
        if (espacio > 0 && alcance > 0)
            return { etiqueta: 'Espacio / alcance', valor: `${espacio}' / ${alcance}'` };
        if (espacio > 0)
            return { etiqueta: 'Espacio', valor: `${espacio}'` };
        return { etiqueta: 'Alcance', valor: alcance > 0 ? `${alcance}'` : null };
    }

    private calcularResumen(): DatoFicha[] {
        const m = this.monstruoData;
        const idTipo = toNumber(m?.Tipo?.Id);
        return [
            {
                etiqueta: 'Tipo',
                valor: m?.Tipo?.Nombre,
                alPulsar: idTipo > 0 ? () => this.abrirDetallesTipoCriatura(idTipo) : undefined,
            },
            { etiqueta: 'Tamaño', valor: m?.Tamano?.Nombre },
            // Un animal carnívoro u omnívoro de 1 DG o más tiene licántropos (los licántropos automáticos, 2026-11-06).
            { etiqueta: 'Dieta', valor: nombreDeDieta(m?.Dieta) },
            datoAlineamiento(this.monstruoData?.Alineamiento),
            { etiqueta: 'Tesoro', valor: m?.Tesoro },
            {
                etiqueta: 'Idiomas',
                valor: (m?.Idiomas ?? []).map((i) => `${i?.Nombre ?? ''}`.trim()).filter((nombre) => tieneTextoVisible(nombre)).join(', '),
                ancho: 2,
            },
        ];
    }

    private calcularRelacion(): DatoFicha[] {
        const m = this.monstruoData as any;
        const positivo = (valor: unknown) => toNumber(valor) > 0 ? toNumber(valor) : null;
        return [
            { etiqueta: 'Familiar', valor: this.idFamiliar > 0 ? `#${this.idFamiliar}` : null },
            { etiqueta: 'Compañero', valor: this.idCompanero > 0 ? `#${this.idCompanero}` : null },
            { etiqueta: 'Vida', valor: positivo(m?.Vida) },
            { etiqueta: 'DG adicionales', valor: positivo(m?.Dg_adi) },
            { etiqueta: 'Trucos adicionales', valor: positivo(m?.Trucos_adi) },
            { etiqueta: 'Origen', valor: m?.Monstruo_origen?.Nombre },
            { etiqueta: 'Plantilla', valor: m?.Plantilla?.Nombre },
        ];
    }

    private casilla(clave: Caracteristica): CasillaFicha {
        const caracteristicas = this.monstruoData?.Caracteristicas;
        const valor = textoValorCaracteristica(caracteristicas, clave);
        const modificador = textoModificadorCaracteristica(caracteristicas, clave);
        const nombre = NOMBRES_CARACTERISTICAS[clave];
        return {
            abreviatura: abreviaturaCaracteristica(clave),
            nombre,
            valor,
            modificador: valor === SIN_CARACTERISTICA || modificador === SIN_CARACTERISTICA ? null : modificador,
            texto: `${nombre} ${textoCaracteristicaMonstruo(caracteristicas, clave)}`,
        };
    }

    private requisitos(tipo: 'Familiar' | 'Companero'): RequisitosRelacion | null {
        const alineamientos = (this.monstruoData?.Alineamientos_requeridos?.[tipo] ?? [])
            .map((item) => `${item?.Nombre ?? ''}`.trim())
            .filter((item) => tieneTextoVisible(item));
        const niveles = this.getNivelesClaseRequeridos(tipo);
        return alineamientos.length > 0 || niveles.length > 0 ? { alineamientos, niveles } : null;
    }

    private relacionados(lista: MonstruoDetalle[] | null | undefined): MonstruoDetalle[] {
        return (lista ?? [])
            .filter(item => toNumber(item?.Id) > 0 && tieneTextoVisible(item?.Nombre))
            .sort(porNombre);
    }

    /** Los datos con algo que enseñar, ya como texto. */
    private pintar(datos: DatoFicha[]): ParPintado[] {
        return datosVisibles(datos).map((dato) => ({
            etiqueta: dato.etiqueta,
            valor: textoDato(dato.valor) ?? '',
            detalle: textoVisible(dato.detalle),
        }));
    }

    private formatearListaPersonajes(items: Array<{ id: any; nombre: any; extra?: string; }>): string {
        return items
            .filter(item => toNumber(item?.id) > 0 && tieneTextoVisible(`${item?.nombre ?? ''}`))
            .map(item => `${item.nombre}${item.extra ? ` (${item.extra})` : ''}`)
            .join(', ');
    }

    private formatearContexto(contexto: any): string {
        if (!contexto || typeof contexto !== 'object')
            return '';
        return Object.entries(contexto as Record<string, unknown>)
            .filter(([_, value]) => value !== undefined && value !== null && `${value}`.trim().length > 0)
            .map(([key, value]) => `${key}: ${value}`)
            .join(' | ');
    }

    private getNivelesClaseRequeridos(tipo: 'Familiar' | 'Companero'): NivelClaseRequerido[] {
        return this.getNivelesClaseNormalizados()
            .filter((item) => this.getContextosNivelClase(item).includes(tipo))
            .map((item) => ({
                idClase: item.idClase,
                nombreClase: item.nombreClase,
                nivel: item.nivel,
                plantilla: item.plantilla,
                dote: item.dote,
                alineamiento: item.alineamiento,
            }));
    }

    private getNivelesClaseNormalizados(): Array<NivelClaseRequerido & { deFamiliar: boolean; }> {
        return (this.monstruo?.Niveles_clase ?? [])
            .filter(item => toNumber(item?.Clase?.Id) > 0 && tieneTextoVisible(item?.Clase?.Nombre))
            .map((item) => ({
                idClase: toNumber(item?.Clase?.Id),
                nombreClase: `${item?.Clase?.Nombre ?? ''}`.trim(),
                nivel: toNumber(item?.Nivel),
                deFamiliar: esNivelDeFamiliar(item),
                plantilla: `${item?.Plantilla?.Nombre ?? ''}`.trim(),
                dote: `${item?.Dote?.Nombre ?? ''}`.trim(),
                alineamiento: textoEjesAlineamiento(item?.Preferencia_legal?.Nombre, item?.Preferencia_moral?.Nombre),
            }));
    }

    /**
     * Si una fila de `Niveles_clase` es una forma de tenerlo de familiar o de compañero, por sus datos y no por ids o
     * nombres fijos: la que lleva pseudoplantilla de familiar es de familiar (`esNivelDeFamiliar`, la regla de la
     * creación); sin ella, de compañero si el monstruo puede serlo (`Companero`) y, si no, de familiar. Comprobado el 2026-11-05 con las 288 filas de `rol` y
     * `rol_dev`: la misma separación que daban los ids de las clases y las dotes.
     */
    private getContextosNivelClase(nivel: NivelClaseRequerido & { deFamiliar: boolean; }): Array<'Familiar' | 'Companero'> {
        if (nivel.deFamiliar)
            return ['Familiar'];
        if (this.monstruo?.Companero)
            return ['Companero'];
        if (this.monstruo?.Familiar)
            return ['Familiar'];
        return ['Familiar', 'Companero'];
    }

}
