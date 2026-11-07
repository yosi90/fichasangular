import { Component, EventEmitter, Input, Optional, Output } from '@angular/core';
import {
    DatoFicha,
    DoteFicha,
    EtiquetaFicha,
    HabilidadFicha,
    datoAlineamiento,
    datosModificadoresCaracteristicas,
    dotesVisibles,
    etiquetaTraducido,
    habilidadesVisibles,
    nombreOriginalVisible,
    textoDato,
    textoEsenciaRasgo,
    textoPies,
    textosMovimiento,
    unirTipo,
} from 'src/app/components/detalles/ficha';
import { textoListasRaciales } from 'src/app/components/detalles/ficha/personaje-edad';
import { IdiomaDetalle } from 'src/app/interfaces/idioma';
import { RacialDetalle, RacialReferencia } from 'src/app/interfaces/racial';
import {
    CategoriaEdadRaza, Raza, RazaHabilidadBase, RazaHabilidadCustom, RazaPlantillaReferencia, RazaPrerrequisitos, RacialDeEdad,
    SujetoPrerrequisitoMutacion,
} from 'src/app/interfaces/raza';
import { CARACTERISTICAS } from 'src/app/interfaces/caracteristica';
import { Id_nombre } from 'src/app/interfaces/genericas';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { SubtipoRef } from 'src/app/interfaces/subtipo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { avisoRazaConClase } from 'src/app/services/utils/clases-de-monstruo';
import { UserService } from 'src/app/services/user.service';
import { puedeModificarDesdeDetalle } from 'src/app/services/utils/permisos-catalogo';
import { resolverExtraHabilidadVisible } from 'src/app/services/utils/habilidad-extra-visible';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { mayusculaInicial } from 'src/app/services/utils/formato-registros';
import { buildManiobrabilidadInfoSecciones, tieneManiobrabilidadVisible } from 'src/app/services/utils/maniobrabilidad-info';
import { getGrupoOpcionalRacial } from 'src/app/services/utils/racial-opcionales';
import { normalizarTexto, toBoolean } from 'src/app/services/utils/normalizacion';
import { tieneNumeroVisible, tieneTextoVisible } from 'src/app/services/utils/texto-visible';
import { compararTexto, porNombre } from 'src/app/services/utils/orden-texto';
import { GrupoPrerrequisitos, agruparPrerrequisitos } from 'src/app/services/utils/prerrequisito-frase';
import { Comodin } from 'src/app/interfaces/comodin';
import { leerComodin } from 'src/app/services/utils/comodin';
import { edadesDeLaRaza, GRUPOS_EDAD_INICIAL, textoDadosEdadInicial, textoEdadMaxima } from 'src/app/services/utils/edad-personaje';
import { NavegacionRolService } from 'src/app/services/navegacion-rol.service';
import { abreviaturaCaracteristica, NOMBRES_CARACTERISTICAS, SIN_CARACTERISTICA } from 'src/app/services/utils/caracteristicas';
import { textoVd } from 'src/app/services/utils/tipo-personaje';
import { textoDeArmasNaturales } from 'src/app/services/utils/armas-naturales';
import {
    SOLO_PNJ,
    categoriasEdadOrdenadas,
    edadDeLasCifras,
    gananciasPorEdad,
    nombreEdadEnFrase,
    pasosEdadOrdenados,
    racialesConValorPorEdad,
    textoAjusteEdad,
    textoAnios,
    textoNivelLanzamientoRaza,
    textoRangoEdad,
} from 'src/app/services/utils/razas-por-edades';

interface GrupoRacialesDetalle {
    grupo: number;
    opcionales: boolean;
    raciales: RacialDetalle[];
}

interface HabilidadRazaVisible {
    Id_habilidad: number;
    Habilidad: string;
    Id_extra: number;
    Extra: string;
    Extra_comodin: Comodin | null;
    Tiene_id_extra: boolean;
    Soporta_extra: boolean;
    Cantidad: number;
    Varios: string;
}

/** Un par de nombre y valor de una lista lateral («Fuerza … +2», «Adulto … 15 años»). */
interface ParRaza {
    nombre: string;
    valor: string;
}

/** Una columna de las tablas por edad: su título, el nombre entero (si se abrevia) y si es una cifra (centrada). */
interface ColumnaEdad {
    titulo: string;
    nombre?: string;
    cifra?: boolean;
}

/** Una tabla por edad: la primera columna es la edad; las columnas sin ningún dato no salen. */
interface TablaEdad {
    columnas: ColumnaEdad[];
    filas: string[][];
}

/** Lo que gana una edad, ya con su texto: cada aptitud con la característica de su CD y cada sortílega con sus usos. */
interface GananciaEdadFila {
    edad: string;
    raciales: { racial: RacialDeEdad; detalle: string; }[];
    sortilegas: { conjuro: Id_nombre; detalle: string; }[];
}

/** Los prerrequisitos de una raza mutada de un sujeto (la raza base, o el personaje y el momento), por su tipo. */
function prerrequisitosDe(prerrequisitos: RazaPrerrequisitos | null | undefined,
                          incluir: (sujeto: SujetoPrerrequisitoMutacion) => boolean): RazaPrerrequisitos {
    const salida: RazaPrerrequisitos = {};
    Object.entries(prerrequisitos ?? {}).forEach(([clave, items]) => {
        const deEse = (items ?? []).filter((item) => incluir(item.Sujeto));
        if (deEse.length > 0)
            salida[clave] = deEse;
    });
    return salida;
}

@Component({
    selector: 'app-detalles-raza',
    templateUrl: './detalles-raza.component.html',
    styleUrls: ['./detalles-raza.component.sass'],
    standalone: false
})
export class DetallesRazaComponent {
    constructor(
        private manualDetalleNavSvc: ManualDetalleNavigationService,
        private userSvc: UserService,
        // Abre el conjuro de una sortílega y la clase del lanzamiento racial en su pestaña (las pestañas lo escuchan).
        @Optional() private navegacion?: NavegacionRolService,
    ) { }

    /**
     * La clase de monstruo que lleva la raza (*Libris Mortis*: la raza mutada es su bloque de rasgos raciales), o `null`:
     * `Clase_de_monstruo` de la raza (API y caché `Razas` 25, desde el 2026-11-07), una sola fuente.
     */
    claseDeMonstruo: Id_nombre | null = null;

    private razaActual!: Raza;
    mostrarInfoManiobrabilidad = false;

    /** «Raza · Mediano · Humanoide». */
    tipoCabecera = '';
    /** «Mutada», si su tamaño depende de la mutación y «Traducido» (con el nombre original en el tooltip). */
    etiquetas: (string | EtiquetaFicha)[] = [];
    /** Los datos clave, en el orden del manual. Lo que la API da `null` o 0 no sale. */
    datos: DatoFicha[] = [];
    /** Los dados de golpe raciales y lo que dan, si la raza los tiene. */
    datosDgs: DatoFicha[] = [];
    modificadores: ParRaza[] = [];
    edades: ParRaza[] = [];
    subtipos: SubtipoRef[] = [];
    habilidadesBase: HabilidadRazaVisible[] = [];
    habilidadesCustom: HabilidadRazaVisible[] = [];
    /** Las mismas, como las pinta `<app-ficha-habilidades>`. */
    filasHabilidadesBase: HabilidadFicha[] = [];
    filasHabilidadesCustom: HabilidadFicha[] = [];
    idiomas: IdiomaDetalle[] = [];
    gruposRaciales: GrupoRacialesDetalle[] = [];
    /** Los prerrequisitos de una raza mutada, con la frase de la API, agrupados por `Opcional`. */
    /** Lo que pide una raza mutada de su raza base y del personaje (o del momento), con la frase de la API. */
    prerrequisitosDeLaBase: GrupoPrerrequisitos[] = [];
    prerrequisitosDelPersonaje: GrupoPrerrequisitos[] = [];
    /** Lo que cambia una raza mutada de su raza base (la frase de cada cambio). */
    cambiosMutacion: string[] = [];
    dotes: DoteFicha[] = [];
    /** Las plantillas que incorpora por cada subtipo. */
    plantillasPorSubtipo: { subtipo: string; plantillas: RazaPlantillaReferencia[]; }[] = [];
    /** Si alguna sortílega tiene dados de golpe mínimos o descripción (si no, la tabla no lleva esas columnas). */
    sortilegasConDgs = false;
    sortilegasConDescripcion = false;

    /** Crece por categorías de edad (los dragones): sus cifras sueltas son las de una edad y lleva sus tablas por edad. */
    porEdades = false;
    /** «cría»: la edad de las cifras sueltas (la primera, o la de la raza resuelta a un paso). */
    edadCifras = '';
    /** La línea de la cabecera que lo dice. */
    notaCifras: string | null = null;
    tablaPorEdad: TablaEdad | null = null;
    tablaCaracteristicas: TablaEdad | null = null;
    tablaMovimiento: TablaEdad | null = null;
    ganancias: GananciaEdadFila[] = [];
    tablaPasos: TablaEdad | null = null;
    /** El lanzamiento racial (el rakshasa, los dragones): como qué clase y con qué nivel, y las listas de más. */
    lanzamientoClase: Id_nombre | null = null;
    lanzamiento: ParRaza[] = [];
    lanzamientoListas: string | null = null;

    @Input()
    set raza(value: Raza) {
        this.razaActual = value;
        this.claseDeMonstruo = value?.Clase_de_monstruo && value.Clase_de_monstruo.Id > 0 ? value.Clase_de_monstruo : null;
        this.construirEdades();
        this.tipoCabecera = unirTipo(['Raza', value?.Tamano?.Nombre, value?.Tipo_criatura?.Nombre]);
        this.etiquetas = [
            value?.Mutada ? 'Mutada' : null,
            etiquetaTraducido(value),
        ].filter((etiqueta): etiqueta is string | EtiquetaFicha => etiqueta !== null);
        this.prerrequisitosDeLaBase = agruparPrerrequisitos(prerrequisitosDe(value?.Prerrequisitos, (sujeto) => sujeto === 'raza_base'));
        this.prerrequisitosDelPersonaje = agruparPrerrequisitos(prerrequisitosDe(value?.Prerrequisitos, (sujeto) => sujeto !== 'raza_base'));
        this.cambiosMutacion = (value?.Cambios_mutacion ?? []).map((cambio) => cambio.Frase).filter((frase) => tieneTextoVisible(frase));
        this.dotes = dotesVisibles(value?.DotesContextuales);
        this.plantillasPorSubtipo = (value?.Plantillas_por_subtipo ?? [])
            .map((grupo) => ({
                subtipo: `${grupo?.Subtipo?.Nombre ?? ''}`.trim(),
                plantillas: (grupo?.Plantillas ?? []).filter((plantilla) => tieneTextoVisible(plantilla?.Nombre)),
            }))
            .filter((grupo) => grupo.plantillas.length > 0);
        this.datos = this.construirDatos();
        this.datosDgs = this.construirDatosDgs();
        this.modificadores = this.construirModificadores();
        this.edades = this.porEdades ? [] : this.construirEdadesManual();
        this.construirLanzamiento();
        this.subtipos = this.getSubtiposActivos();
        this.habilidadesBase = this.getHabilidadesBaseOtorgadas();
        this.habilidadesCustom = this.getHabilidadesCustomOtorgadas();
        this.filasHabilidadesBase = this.filasHabilidades(this.habilidadesBase);
        this.filasHabilidadesCustom = this.filasHabilidades(this.habilidadesCustom);
        this.idiomas = this.getIdiomasOtorgados();
        this.gruposRaciales = this.getRacialesAgrupados();
        this.sortilegasConDgs = (value?.Sortilegas ?? []).some((s) => tieneNumeroVisible(s?.Dgs_necesarios));
        this.sortilegasConDescripcion = (value?.Sortilegas ?? []).some((s) => tieneTextoVisible(s?.Descripcion));
    }
    get raza(): Raza {
        return this.razaActual;
    }

    @Output() racialDetallesPorNombre: EventEmitter<RacialReferencia> = new EventEmitter<RacialReferencia>();
    @Output() subtipoDetalles: EventEmitter<{ Id?: number | null; Nombre: string; }> = new EventEmitter<{ Id?: number | null; Nombre: string; }>();
    @Output() doteDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() plantillaDetalles: EventEmitter<number> = new EventEmitter<number>();
    /** El lápiz «Modificar»: abre la pestaña de modificar la raza. Sin quien lo escuche (la creación), no sale. */
    @Output() modificar: EventEmitter<Raza> = new EventEmitter<Raza>();

    /** Solo con permiso: el de crear razas, que es el que pide `PUT /razas/<id>` (`permisos-catalogo.ts`). */
    get puedeModificar(): boolean {
        return puedeModificarDesdeDetalle(this.modificar, this.userSvc, 'razas');
    }

    abrirDetallesDote(doteCtx: DoteContextual) {
        const id = Number(doteCtx?.Dote?.Id);
        if (Number.isFinite(id) && id > 0)
            this.doteDetalles.emit(id);
    }

    abrirDetallesPlantilla(plantilla: RazaPlantillaReferencia) {
        const id = Number(plantilla?.Id);
        if (Number.isFinite(id) && id > 0)
            this.plantillaDetalles.emit(id);
    }

    /** El conjuro de una sortílega que gana con la edad, en su pestaña. */
    abrirDetalleConjuro(conjuro: Id_nombre): void {
        this.abrirReferencia('conjuro', conjuro);
    }

    /** La clase como la que lanza la raza, en su pestaña. */
    abrirDetalleClaseLanzamiento(): void {
        if (this.lanzamientoClase)
            this.abrirReferencia('clase', this.lanzamientoClase);
    }

    /** Una aptitud que gana con la edad, como los demás raciales. */
    abrirDetalleRacialDeEdad(racial: RacialDeEdad): void {
        this.abrirDetalleRacial({ Id: racial.Id, Nombre: racial.Nombre } as RacialDetalle);
    }

    /** La clase de monstruo que lleva la raza, en su pestaña. */
    abrirDetalleClaseDeMonstruo(): void {
        if (this.claseDeMonstruo)
            this.abrirReferencia('clase', { Id: this.claseDeMonstruo.Id, Nombre: this.claseDeMonstruo.Nombre });
    }

    get puedeAbrirReferencias(): boolean {
        return !!this.navegacion;
    }

    private abrirReferencia(tipo: 'conjuro' | 'clase', ref: Id_nombre): void {
        const id = Number(ref?.Id);
        if (!this.navegacion || !Number.isFinite(id) || id <= 0)
            return;
        this.navegacion.abrir({ clase: 'referencia-manual', referencia: { tipo, id, nombre: ref.Nombre, manualId: 0 } });
    }

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual(this.raza?.Manual);
    }

    abrirDetalleRacial(racial: RacialDetalle) {
        const nombre = `${racial?.Nombre ?? ''}`.trim();
        if (!this.tieneTextoVisible(nombre))
            return;

        const id = Number(racial?.Id);
        this.racialDetallesPorNombre.emit({
            id: Number.isFinite(id) && id > 0 ? id : null,
            nombre,
        });
    }

    getRacialesActivos(): RacialDetalle[] {
        return (this.raza?.Raciales ?? [])
            .filter(racial => this.tieneTextoVisible(racial?.Nombre))
            .sort(porNombre);
    }

    getRacialesAgrupados(): GrupoRacialesDetalle[] {
        const grupos = new Map<number, RacialDetalle[]>();

        this.getRacialesActivos().forEach((racial) => {
            const grupo = getGrupoOpcionalRacial(racial);
            if (!grupos.has(grupo))
                grupos.set(grupo, []);
            grupos.get(grupo)?.push(racial);
        });

        return Array.from(grupos.entries())
            .sort(([grupoA], [grupoB]) => grupoA - grupoB)
            .map(([grupo, raciales]) => ({
                grupo,
                opcionales: grupo > 0,
                raciales,
            }));
    }

    getSubtiposActivos(): SubtipoRef[] {
        return (this.raza?.Subtipos ?? [])
            .filter(subtipo => this.tieneTextoVisible(subtipo?.Nombre))
            .sort(porNombre);
    }

    getIdiomasOtorgados(): IdiomaDetalle[] {
        const vistos = new Set<string>();
        return (this.raza?.Idiomas ?? [])
            .filter(idioma => this.tieneTextoVisible(idioma?.Nombre))
            .filter((idioma) => {
                const key = normalizarTexto(idioma.Nombre);
                if (!key || vistos.has(key))
                    return false;
                vistos.add(key);
                return true;
            })
            .sort(porNombre);
    }

    getHabilidadesBaseOtorgadas(): HabilidadRazaVisible[] {
        return this.normalizarHabilidadesOtorgadas(this.raza?.Habilidades?.Base ?? []);
    }

    getHabilidadesCustomOtorgadas(): HabilidadRazaVisible[] {
        return this.normalizarHabilidadesOtorgadas(this.raza?.Habilidades?.Custom ?? []);
    }

    getExtraVisibleHabilidad(habilidad: HabilidadRazaVisible): string {
        return resolverExtraHabilidadVisible({
            extra: habilidad?.Extra,
            idExtra: habilidad?.Id_extra,
            extraComodin: habilidad?.Extra_comodin,
            soportaExtra: habilidad?.Soporta_extra,
            allowIdZeroAsChoose: habilidad?.Tiene_id_extra === true,
        });
    }

    mostrarManiobrabilidad(): boolean {
        return this.tieneNumeroNoCero(this.raza?.Volar)
            && tieneManiobrabilidadVisible(this.raza?.Maniobrabilidad);
    }

    abrirInfoManiobrabilidad(): void {
        this.mostrarInfoManiobrabilidad = true;
    }

    cerrarInfoManiobrabilidad(): void {
        this.mostrarInfoManiobrabilidad = false;
    }

    getManiobrabilidadInfoSecciones() {
        return buildManiobrabilidadInfoSecciones(this.raza?.Maniobrabilidad);
    }

    abrirDetalleSubtipo(subtipo: SubtipoRef) {
        const nombre = `${subtipo?.Nombre ?? ''}`.trim();
        if (!this.tieneTextoVisible(nombre))
            return;
        const id = Number(subtipo?.Id);
        this.subtipoDetalles.emit({
            Id: Number.isFinite(id) && id > 0 ? id : null,
            Nombre: nombre,
        });
    }

    readonly tieneTextoVisible = tieneTextoVisible;

    tieneNumeroNoCero(valor: number | string | null | undefined): boolean {
        const parsed = Number(valor);
        return Number.isFinite(parsed) && Math.abs(parsed) > 0.0001;
    }

    /** Magic of Incarnum: «+1 de esencia, receptáculo de esencia» del racial; vacío si no tiene. */
    textoEsencia(racial: RacialDetalle): string {
        return textoEsenciaRasgo(racial?.Esencia);
    }

    trackByGrupoRacial(_index: number, grupo: GrupoRacialesDetalle): number {
        return Number(grupo.grupo);
    }

    private construirDatos(): DatoFicha[] {
        const r = this.raza;
        // En una raza por edades, las cifras que cambian con la edad son las de una edad: se dice cuál.
        const deEdad = (dato: DatoFicha): DatoFicha => this.porEdades && this.edadCifras
            ? { ...dato, detalle: `de ${this.edadCifras}` }
            : dato;
        return [
            deEdad({ etiqueta: 'Ajuste de nivel', valor: tieneNumeroVisible(r?.Ajuste_nivel) ? `+${r.Ajuste_nivel}` : null }),
            { etiqueta: 'Clase predilecta', valor: mayusculaInicial(r?.Clase_predilecta) },
            {
                etiqueta: 'Clase de monstruo',
                valor: this.claseDeMonstruo?.Nombre ?? null,
                ayuda: this.claseDeMonstruo ? avisoRazaConClase(this.claseDeMonstruo) : null,
                alPulsar: this.claseDeMonstruo && this.navegacion ? () => this.abrirDetalleClaseDeMonstruo() : undefined,
            },
            {
                etiqueta: 'Dotes adicionales',
                valor: tieneNumeroVisible(r?.Dotes_adicionales) ? Number(r.Dotes_adicionales) : null,
                ayuda: 'Dotes que da la raza en el primer nivel del personaje, además de la de nivel',
            },
            { etiqueta: 'Puntos de habilidad extra', valor: this.textoPuntosHabilidadExtra(), ancho: 2 },
            datoAlineamiento(r?.Alineamiento),
            { etiqueta: 'Nombre original', valor: nombreOriginalVisible(r) },
            { etiqueta: 'Altura', valor: this.textoRango(r?.Altura_rango_inf, r?.Altura_rango_sup, 'm') },
            { etiqueta: 'Peso', valor: this.textoRango(r?.Peso_rango_inf, r?.Peso_rango_sup, 'kg') },
            deEdad({ etiqueta: 'Espacio', valor: textoPies(r?.Espacio) }),
            deEdad({ etiqueta: 'Alcance', valor: textoPies(r?.Alcance) }),
            deEdad({ etiqueta: 'Correr', valor: textoPies(r?.Correr) }),
            deEdad({ etiqueta: 'Nadar', valor: textoPies(r?.Nadar) }),
            deEdad({ etiqueta: 'Volar', valor: textoPies(r?.Volar) }),
            deEdad({
                etiqueta: 'Maniobrabilidad',
                valor: this.mostrarManiobrabilidad() ? r.Maniobrabilidad.Nombre : null,
                ayuda: 'Reglas de maniobrabilidad',
                alPulsar: () => this.abrirInfoManiobrabilidad(),
            }),
            deEdad({ etiqueta: 'Trepar', valor: textoPies(r?.Trepar) }),
            deEdad({ etiqueta: 'Excavar', valor: textoPies(r?.Excavar) }),
            deEdad({ etiqueta: 'Armadura natural', valor: this.tieneNumeroNoCero(r?.Armadura_natural) ? textoConSigno(Number(r.Armadura_natural)) : null }),
            { etiqueta: 'CA varios', valor: this.tieneNumeroNoCero(r?.Varios_armadura) ? textoConSigno(Number(r.Varios_armadura)) : null },
            deEdad({ etiqueta: 'Reducción de daño', valor: r?.Reduccion_dano }),
            deEdad({ etiqueta: 'Resistencia a conjuros', valor: r?.Resistencia_magica }),
            deEdad({ etiqueta: 'Resistencia elemental', valor: r?.Resistencia_energia }),
        ];
    }

    /**
     * Lo que enseña una raza que crece por edades (decisión 8 de la ronda de noviembre; como 3.5 Companion): qué edad
     * tienen sus cifras sueltas y sus tablas por edad. Todo sale de `Categorias_edad` y `Pasos_edad`.
     */
    private construirEdades(): void {
        const raza = this.raza;
        const categorias = categoriasEdadOrdenadas(raza);
        this.porEdades = categorias.length > 0;
        this.edadCifras = this.porEdades ? nombreEdadEnFrase(edadDeLasCifras(raza)) : '';
        this.notaCifras = !this.porEdades || !this.edadCifras
            ? null
            : raza?.Categoria_edad
                ? `Crece por edades: las cifras son las de ${this.edadCifras}; las de cada edad, abajo, en «Por edad».`
                : `Crece por edades: las cifras sueltas son las de ${this.edadCifras}, su primera edad; las de cada edad, abajo, en «Por edad».`;
        this.tablaPorEdad = this.porEdades ? this.construirTablaPorEdad(categorias) : null;
        this.tablaCaracteristicas = this.porEdades ? this.construirTablaCaracteristicas(categorias) : null;
        this.tablaMovimiento = this.porEdades ? this.construirTablaMovimiento(categorias) : null;
        this.ganancias = this.porEdades ? this.construirGanancias(categorias) : [];
        this.tablaPasos = this.construirTablaPasos();
    }

    /**
     * Una fila por edad: los años, el tamaño, los DG, la armadura natural, la cifra de cada aptitud que cambia con la edad,
     * la RD, la RC, el nivel de lanzamiento, el ajuste o «Solo PNJ» y el VD.
     */
    private construirTablaPorEdad(categorias: CategoriaEdadRaza[]): TablaEdad | null {
        const conValor = racialesConValorPorEdad(categorias);
        const clase = `${this.raza?.Lanzamiento?.Clase?.Nombre ?? ''}`.trim();
        const columnas: ColumnaEdad[] = [
            { titulo: 'Edad' },
            { titulo: 'Años', cifra: true },
            { titulo: 'Tamaño' },
            { titulo: 'DG', nombre: 'Dados de golpe', cifra: true },
            { titulo: 'CA natural', nombre: 'Armadura natural', cifra: true },
            ...conValor.map((racial) => ({ titulo: racial.titulo })),
            { titulo: 'RD', nombre: 'Reducción del daño' },
            { titulo: 'RC', nombre: 'Resistencia a conjuros', cifra: true },
            { titulo: clase ? `Nivel de ${nombreEdadEnFrase(clase)}` : 'Nivel de lanzador', cifra: true },
            { titulo: 'Ajuste', nombre: 'Ajuste de nivel', cifra: true },
            { titulo: 'VD', nombre: 'Valor de desafío', cifra: true },
        ];
        const filas = categorias.map((categoria, indice) => [
            categoria.Categoria.Nombre,
            textoRangoEdad({ desde: categoria.Edad_desde, hasta: categoria.Edad_hasta }, 'corta'),
            `${categoria.Tamano?.Nombre ?? ''}`.trim(),
            categoria.Dgs > 0 ? `${categoria.Dgs}` : '',
            textoConSigno(Number(categoria.Armadura_natural) || 0),
            ...conValor.map((racial) => racial.valores[indice]),
            `${categoria.Rd ?? ''}`.trim(),
            `${categoria.Rc ?? ''}`.trim(),
            categoria.Nivel_lanzamiento > 0 ? `${categoria.Nivel_lanzamiento}` : '',
            textoAjusteEdad(categoria.Ajuste_nivel),
            categoria.Vd === null ? '' : textoVd(categoria.Vd),
        ]);
        return this.sinColumnasVacias(columnas, filas);
    }

    /** Las puntuaciones del libro a cada edad y, entre paréntesis, lo que suma la raza («13 (+2)»). */
    private construirTablaCaracteristicas(categorias: CategoriaEdadRaza[]): TablaEdad | null {
        const columnas: ColumnaEdad[] = [
            { titulo: 'Edad' },
            ...CARACTERISTICAS.map((clave) => ({ titulo: abreviaturaCaracteristica(clave), nombre: NOMBRES_CARACTERISTICAS[clave], cifra: true })),
        ];
        const filas = categorias.map((categoria) => [
            categoria.Categoria.Nombre,
            ...CARACTERISTICAS.map((clave) => {
                const valor = categoria.Caracteristicas?.[clave];
                if (valor === null || valor === undefined)
                    return SIN_CARACTERISTICA;
                const modificador = categoria.Modificadores?.[clave];
                return modificador === null || modificador === undefined ? `${valor}` : `${valor} (${textoConSigno(modificador)})`;
            }),
        ]);
        return this.sinColumnasVacias(columnas, filas);
    }

    /** El espacio y el alcance, las velocidades (el vuelo con su maniobrabilidad), los ataques, la energía y el NL de las sortílegas. */
    private construirTablaMovimiento(categorias: CategoriaEdadRaza[]): TablaEdad | null {
        const columnas: ColumnaEdad[] = [
            { titulo: 'Edad' },
            { titulo: 'Espacio / alcance' },
            { titulo: 'Velocidad' },
            { titulo: 'Ataques naturales' },
            { titulo: 'Resistencia a la energía' },
            { titulo: 'NL de las sortílegas', nombre: 'Nivel de lanzador de las aptitudes sortílegas', cifra: true },
        ];
        const filas = categorias.map((categoria) => [
            categoria.Categoria.Nombre,
            [textoPies(categoria.Espacio), textoPies(categoria.Alcance)].filter((t): t is string => !!t).join(' / '),
            textosMovimiento(categoria.Velocidades, categoria.Maniobrabilidad?.Nombre).join(', '),
            textoDeArmasNaturales(categoria.Armas_naturales) || `${categoria.Ataques_naturales ?? ''}`.trim(),
            `${categoria.Re ?? ''}`.trim(),
            categoria.Nivel_lanzador_sortilegas > 0 ? `${categoria.Nivel_lanzador_sortilegas}` : '',
        ]);
        return this.sinColumnasVacias(columnas, filas);
    }

    private construirGanancias(categorias: CategoriaEdadRaza[]): GananciaEdadFila[] {
        return gananciasPorEdad(categorias).map((ganancia) => ({
            edad: ganancia.categoria.Categoria.Nombre,
            raciales: ganancia.raciales.map((racial) => ({
                racial,
                detalle: racial.Caracteristica_cd?.Nombre ? `CD por ${racial.Caracteristica_cd.Nombre}` : '',
            })),
            sortilegas: ganancia.sortilegas.map((sortilega) => ({
                conjuro: sortilega.Conjuro,
                detalle: [sortilega.Usos_diarios, sortilega.Descripcion].filter((parte) => tieneTextoVisible(parte)).join(' · '),
            })),
        }));
    }

    /** Los pasos que puede elegir el personaje al crearlo (*Draconomicón*, tabla 3-21). */
    private construirTablaPasos(): TablaEdad | null {
        const pasos = pasosEdadOrdenados(this.raza);
        if (pasos.length < 1)
            return null;
        const columnas: ColumnaEdad[] = [
            { titulo: 'Desde' },
            { titulo: 'Edad' },
            { titulo: 'DG', nombre: 'Dados de golpe', cifra: true },
            { titulo: 'CA natural', nombre: 'Armadura natural', cifra: true },
            { titulo: 'Ajuste', nombre: 'Ajuste de nivel', cifra: true },
            { titulo: 'NEP', nombre: 'Nivel efectivo de personaje', cifra: true },
            { titulo: 'VD', nombre: 'Valor de desafío', cifra: true },
        ];
        const filas = pasos.map((paso) => [
            textoAnios(paso.Edad),
            paso.Categoria.Nombre,
            `${paso.Dgs}`,
            textoConSigno(Number(paso.Armadura_natural) || 0),
            textoAjusteEdad(paso.Ajuste_nivel),
            paso.Jugable && paso.Nep_base !== null ? `${paso.Nep_base}` : SOLO_PNJ,
            paso.Vd === null ? '' : textoVd(paso.Vd),
        ]);
        return this.sinColumnasVacias(columnas, filas);
    }

    /** Como qué clase lanza la raza, con qué nivel, y las listas que lanza además como arcanas. */
    private construirLanzamiento(): void {
        const lanzamiento = this.raza?.Lanzamiento;
        this.lanzamientoClase = lanzamiento?.Clase && tieneTextoVisible(lanzamiento.Clase.Nombre) ? lanzamiento.Clase : null;
        if (!lanzamiento || !this.lanzamientoClase) {
            this.lanzamiento = [];
            this.lanzamientoListas = null;
            return;
        }
        const nivel = textoNivelLanzamientoRaza(this.raza);
        this.lanzamiento = nivel ? [{ nombre: 'Nivel', valor: nivel }] : [];
        this.lanzamientoListas = textoListasRaciales(lanzamiento.Listas ?? []);
    }

    /** Quita las columnas en las que no hay nada (la primera, la edad, se queda siempre); sin filas, nada. */
    private sinColumnasVacias(columnas: ColumnaEdad[], filas: string[][]): TablaEdad | null {
        if (filas.length < 1)
            return null;
        const visibles = columnas.map((_, i) => i).filter((i) => i === 0 || filas.some((fila) => `${fila[i] ?? ''}`.trim().length > 0));
        return {
            columnas: visibles.map((i) => columnas[i]),
            filas: filas.map((fila) => visibles.map((i) => fila[i] ?? '')),
        };
    }

    /** «4 en el primer nivel y 1 por nivel» (el humano), o la parte que tenga la raza. */
    private textoPuntosHabilidadExtra(): string | null {
        const primerNivel = this.raza?.Puntos_habilidad_extra_primer_nivel;
        const porNivel = this.raza?.Puntos_habilidad_extra_por_nivel;
        const partes = [
            tieneNumeroVisible(primerNivel) ? `${primerNivel} en el primer nivel` : '',
            tieneNumeroVisible(porNivel) ? `${porNivel} por nivel` : '',
        ].filter((parte) => parte.length > 0);
        return partes.length > 0 ? partes.join(' y ') : null;
    }

    private construirDatosDgs(): DatoFicha[] {
        const dgs = this.raza?.Dgs_adicionales;
        if (!dgs || !(dgs.Cantidad > 0))
            return [];
        return [
            { etiqueta: 'Dados de golpe', valor: `+${dgs.Cantidad}${dgs.Dado} de ${dgs.Tipo_criatura}`, ancho: 2 },
            { etiqueta: 'Ataque base', valor: textoConSigno(Number(dgs.Ataque_base ?? 0)) },
            { etiqueta: 'Fortaleza', valor: textoConSigno(Number(dgs.Fortaleza ?? 0)) },
            { etiqueta: 'Reflejos', valor: textoConSigno(Number(dgs.Reflejos ?? 0)) },
            { etiqueta: 'Voluntad', valor: textoConSigno(Number(dgs.Voluntad ?? 0)) },
            { etiqueta: 'Dotes extra', valor: dgs.Dotes_extra },
            { etiqueta: 'Puntos de habilidad', valor: dgs.Puntos_habilidad },
            { etiqueta: 'Multiplicador', valor: `x${dgs.Multiplicador_puntos_habilidad}` },
        ];
    }

    private filasHabilidades(habilidades: HabilidadRazaVisible[]): HabilidadFicha[] {
        return habilidadesVisibles(habilidades, (habilidad) => habilidad.Cantidad, (habilidad) => this.getExtraVisibleHabilidad(habilidad));
    }

    /** Los modificadores de característica distintos de 0, con signo. */
    private construirModificadores(): ParRaza[] {
        return datosModificadoresCaracteristicas(this.raza?.Modificadores)
            .map((dato) => ({ nombre: dato.etiqueta, valor: textoDato(dato.valor) ?? '' }));
    }

    private construirEdadesManual(): ParRaza[] {
        const edades = edadesDeLaRaza(this.raza)
            .filter((item) => tieneNumeroVisible(item.valor))
            .map((item) => ({ nombre: item.nombre, valor: `${item.valor} años` }));
        // La edad máxima (tabla 6-5): la venerable más sus dados, como mucho lo que pueden dar.
        const maxima = textoEdadMaxima(this.raza);
        // La edad inicial (tabla 6-4): la mayoría de edad más los dados de cada grupo de clases.
        const iniciales = GRUPOS_EDAD_INICIAL
            .map((grupo) => ({ grupo, dados: textoDadosEdadInicial(this.raza, grupo) }))
            .filter((item) => item.dados.length > 0)
            .map((item) => ({ nombre: `Inicial (grupo ${item.grupo})`, valor: `adulto ${item.dados}` }));
        return [...edades, ...(maxima ? [{ nombre: 'Máxima', valor: maxima }] : []), ...iniciales];
    }

    /** «1.5 - 1.8 m»; sin ninguno de los dos extremos, nada. */
    private textoRango(inferior: number | null | undefined, superior: number | null | undefined, unidad: string): string | null {
        if (!tieneNumeroVisible(inferior) && !tieneNumeroVisible(superior))
            return null;
        return `${inferior ?? 0} - ${superior ?? 0} ${unidad}`;
    }

    private normalizarHabilidadesOtorgadas(
        origen: Array<RazaHabilidadBase | RazaHabilidadCustom>
    ): HabilidadRazaVisible[] {
        const acumulado = new Map<string, HabilidadRazaVisible>();

        (origen ?? []).forEach((raw) => {
            const id = Number((raw as any)?.Id_habilidad ?? (raw as any)?.id_habilidad ?? (raw as any)?.Id ?? (raw as any)?.id);
            const idHabilidad = Number.isFinite(id) ? id : 0;
            const nombre = `${(raw as any)?.Habilidad ?? (raw as any)?.habilidad ?? (raw as any)?.Nombre ?? (raw as any)?.nombre ?? ''}`.trim();
            if (!this.tieneTextoVisible(nombre) && idHabilidad <= 0)
                return;

            const cantidadRaw = Number((raw as any)?.Cantidad ?? (raw as any)?.cantidad ?? (raw as any)?.Rangos ?? (raw as any)?.rangos);
            const cantidad = Number.isFinite(cantidadRaw) ? cantidadRaw : 0;
            const tieneIdExtra = Object.prototype.hasOwnProperty.call(raw ?? {}, 'Id_extra')
                || Object.prototype.hasOwnProperty.call(raw ?? {}, 'id_extra')
                || Object.prototype.hasOwnProperty.call(raw ?? {}, 'IdExtra')
                || Object.prototype.hasOwnProperty.call(raw ?? {}, 'idExtra')
                || Object.prototype.hasOwnProperty.call(raw ?? {}, 'i_ex')
                || Object.prototype.hasOwnProperty.call(raw ?? {}, 'ie');
            const idExtraRaw = Number((raw as any)?.Id_extra ?? (raw as any)?.id_extra ?? (raw as any)?.IdExtra ?? (raw as any)?.idExtra ?? (raw as any)?.i_ex ?? (raw as any)?.ie);
            const idExtra = Number.isFinite(idExtraRaw) ? idExtraRaw : 0;
            const extra = `${(raw as any)?.Extra ?? (raw as any)?.extra ?? (raw as any)?.x ?? ''}`.trim();
            const extraComodin = leerComodin((raw as any)?.Extra_comodin);
            const soportaExtraRaw = (raw as any)?.Soporta_extra ?? (raw as any)?.soporta_extra;
            const soportaExtra = toBoolean(soportaExtraRaw);
            const varios = `${(raw as any)?.Varios ?? (raw as any)?.varios ?? ''}`.trim();
            const key = idHabilidad > 0
                ? `id:${idHabilidad}`
                : `n:${normalizarTexto(nombre)}`;

            const existente = acumulado.get(key);
            if (!existente) {
                acumulado.set(key, {
                    Id_habilidad: idHabilidad,
                    Habilidad: nombre.length > 0 ? nombre : `Habilidad ${idHabilidad}`,
                    Id_extra: idExtra,
                    Extra: extra,
                    Extra_comodin: extraComodin,
                    Tiene_id_extra: tieneIdExtra,
                    Soporta_extra: soportaExtra,
                    Cantidad: cantidad,
                    Varios: varios,
                });
                return;
            }

            existente.Cantidad += cantidad;
            existente.Tiene_id_extra = existente.Tiene_id_extra || tieneIdExtra;
            existente.Soporta_extra = existente.Soporta_extra || soportaExtra;
            if (existente.Id_extra <= 0 && idExtra > 0)
                existente.Id_extra = idExtra;
            existente.Extra_comodin = existente.Extra_comodin ?? extraComodin;
            if (!this.tieneTextoVisible(existente.Extra) && this.tieneTextoVisible(extra))
                existente.Extra = extra;
            else if (this.tieneTextoVisible(existente.Extra)
                && this.tieneTextoVisible(extra)
                && existente.Extra.toLowerCase() !== extra.toLowerCase()) {
                existente.Extra = `${existente.Extra}; ${extra}`;
            }
            if (!this.tieneTextoVisible(existente.Varios) && this.tieneTextoVisible(varios)) {
                existente.Varios = varios;
            } else if (this.tieneTextoVisible(existente.Varios)
                && this.tieneTextoVisible(varios)
                && existente.Varios.toLowerCase() !== varios.toLowerCase()) {
                existente.Varios = `${existente.Varios}; ${varios}`;
            }
        });

        return Array.from(acumulado.values())
            .sort((a, b) => compararTexto(a.Habilidad, b.Habilidad));
    }
}
