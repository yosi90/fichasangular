import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ICONOS_ROL, TipoRol, tipoRolDeClase } from 'src/app/services/utils/iconos-rol';
import { DatoFicha, EtiquetaFicha, FilaMoldeado, datoAlineamiento, datosMoldeadoClase, datosVisibles, filasMoldeado, textoBonoCapacidad, unirTipo } from 'src/app/components/detalles/ficha';
import { NombreTraducible } from 'src/app/interfaces/incarnum';
import { Clase, ClaseConjuroRef, ClaseDoteNivel, ClaseNivelDetalle } from 'src/app/interfaces/clase';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { resolverExtraHabilidadVisible } from 'src/app/services/utils/habilidad-extra-visible';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { idiomasVisibles, tieneTextoVisible } from 'src/app/services/utils/texto-visible';
import { esCampoId, extraerValorSimple, formatearClave, formatearValor, mayusculaInicial } from 'src/app/services/utils/formato-registros';
import {
    CondicionPrerrequisito,
    GrupoPrerrequisitos,
    agruparPrerrequisitos,
    destinoPrerrequisito,
} from 'src/app/services/utils/prerrequisito-frase';

type ElementoVisual = {
    nombre: string;
    extras: string[];
    detalle: string;
    idEntidad?: number | null;
};

type ResumenDote = {
    texto: string;
    grupoOpcional: number;
    extras: string[];
    tooltip: string;
    idEntidad: number | null;
};

type TipoResumenEspecial = 'especial' | 'dote';

type ResumenEspecial = {
    texto: string;
    grupoOpcional: number;
    extras: string[];
    tooltip: string;
    tipo: TipoResumenEspecial;
    idEntidad: number | null;
    nombreEntidad: string;
    clicable: boolean;
};

type ResumenEspecialRenderItem = {
    tipoRender: 'simple';
    item: ResumenEspecial;
} | {
    tipoRender: 'grupo_opcional';
    grupo: number;
    opciones: ResumenEspecial[];
};

/** Una fila de la tabla de progresión, ya con lo que enseña cada celda. */
type FilaProgresion = {
    nivel: number;
    ataqueBase: string;
    fortaleza: string;
    reflejos: string;
    voluntad: string;
    especiales: ResumenEspecialRenderItem[];
    nivelMaxPoder: string;
    reservaPsionica: string;
    aumentos: string;
    /** En el orden de `columnasDiarios` y `columnasConocidos`. */
    diarios: string[];
    conocidos: string[];
    conocidosTotal: string;
};

/** Los conjuros del listado de la clase de un mismo nivel. */
type NivelListadoConjuros = {
    nivel: number;
    etiqueta: string;
    conjuros: ClaseConjuroRef[];
};

@Component({
    selector: 'app-detalles-clase',
    templateUrl: './detalles-clase.component.html',
    standalone: false
})
export class DetallesClaseComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    claseData!: Clase;
    /** El nombre con la primera letra en mayúscula (algunos llegan en minúscula de los datos). */
    nombreClase = '';
    /** «Clase básica» o «Clase de prestigio». */
    tipoCabecera = '';
    /** El icono de la cabecera: el de su catálogo y variante (`ICONOS_ROL`). */
    iconoCabecera: TipoRol = 'clase';
    etiquetas: EtiquetaFicha[] = [];
    /** Los datos clave: dado de golpe, puntos de habilidad, alineamiento, niveles, progresiones y roles. */
    datos: DatoFicha[] = [];
    flagsConjuros: string[] = [];
    datosConjuros: DatoFicha[] = [];
    listadoConjuros: NivelListadoConjuros[] = [];
    idiomas: { Nombre: string; Descripcion: string; }[] = [];
    flagsPrerrequisito: string[] = [];
    hayCompetencias = false;
    hayHabilidades = false;
    readonly gruposCompetencias: { clave: keyof Clase['Competencias'], titulo: string }[] = [
        { clave: 'Armas', titulo: 'Armas' },
        { clave: 'Armaduras', titulo: 'Armaduras' },
        { clave: 'Grupos_arma', titulo: 'Grupos de arma' },
        { clave: 'Grupos_armadura', titulo: 'Grupos de armadura' },
    ];
    filasNivel: ClaseNivelDetalle[] = [];
    filasTabla: FilaProgresion[] = [];
    /** Dos filas de cabecera si la tabla lleva conjuros diarios o conocidos por nivel de conjuro. */
    filasCabecera = 1;
    columnasDiarios: number[] = [];
    columnasConocidos: number[] = [];
    mostrarConocidosTotal: boolean = false;
    mostrarAtaqueBase: boolean = false;
    mostrarFortaleza: boolean = false;
    mostrarReflejos: boolean = false;
    mostrarVoluntad: boolean = false;
    mostrarEspeciales: boolean = false;
    mostrarNivelMaxPoderAccesible: boolean = false;
    mostrarReservaPsionica: boolean = false;
    mostrarAumentosClaseLanzadora: boolean = false;
    renderEspecialesPorNivel: Record<number, ResumenEspecialRenderItem[]> = {};
    competenciasVisibles: Record<keyof Clase['Competencias'], ElementoVisual[]> = {
        Armas: [],
        Armaduras: [],
        Grupos_arma: [],
        Grupos_armadura: [],
    };
    habilidadesVisibles: Record<'Base' | 'Custom', ElementoVisual[]> = {
        Base: [],
        Custom: [],
    };
    /** Las que son de clase solo con un alineamiento básico («Diplomacia», «Legal bueno»; el nacido del alma). */
    habilidadesPorAlineamiento: { habilidad: string; alineamiento: string; }[] = [];
    /** Magic of Incarnum: lo que dice su `Moldeado` (nada si la clase no moldea fusiones). */
    datosMoldeado: DatoFicha[] = [];
    filasMoldeado: FilaMoldeado[] = [];
    chakrasMoldeado: { id: number; texto: string; }[] = [];
    capacidadMoldeado: string[] = [];
    fusionesClase: NombreTraducible[] = [];

    /** Los prerrequisitos con la frase de la API, agrupados por `Opcional`. */
    prerrequisitosAgrupados: GrupoPrerrequisitos[] = [];

    @Input()
    set clase(value: Clase) {
        this.claseData = value;
        this.nombreClase = mayusculaInicial(value?.Nombre);
        this.iconoCabecera = tipoRolDeClase(value);
        this.tipoCabecera = unirTipo([ICONOS_ROL[this.iconoCabecera].etiqueta]);
        this.etiquetas = [
            value?.Aumenta_clase_lanzadora ? { texto: 'Aumenta clase lanzadora' } : null,
            value?.Es_predilecta ? { texto: 'Puede ser predilecta' } : null,
        ].filter((etiqueta): etiqueta is EtiquetaFicha => etiqueta !== null);
        this.datos = this.construirDatos();
        this.flagsConjuros = this.construirFlagsConjuros();
        this.datosConjuros = datosVisibles([
            { etiqueta: 'Salvación de conjuros', valor: value?.Mod_salv_conjuros },
            { etiqueta: 'Lista de conjuros de', valor: value?.Conjuros?.Clase_origen?.Nombre },
        ]);
        this.listadoConjuros = this.construirListadoConjuros();
        this.idiomas = idiomasVisibles(value?.Idiomas);
        this.prerrequisitosAgrupados = agruparPrerrequisitos(value?.Prerrequisitos);
        this.flagsPrerrequisito = value?.Prerrequisitos_flags?.habilidad_clase ? ['Habilidad de clase'] : [];
        this.recalcularBloquesVisuales();
        this.recalcularTablaProgresion();
        this.recalcularMoldeado();
    }

    @Output() conjuroDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() especialDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() especialDetallesPorNombre: EventEmitter<string> = new EventEmitter<string>();
    @Output() doteDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() doteDetallesPorNombre: EventEmitter<string> = new EventEmitter<string>();
    @Output() armaDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() armaduraDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() fusionDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() chakraDetalles: EventEmitter<number> = new EventEmitter<number>();

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.claseData?.Manual?.Id,
            nombre: this.claseData?.Manual?.Nombre,
        });
    }

    abrirDetallesConjuro(idConjuro: number) {
        if (Number.isFinite(Number(idConjuro)) && Number(idConjuro) > 0)
            this.conjuroDetalles.emit(Number(idConjuro));
    }

    abrirDetalleEspecialFila(especial: ResumenEspecial) {
        const idEntidad = Number(especial?.idEntidad ?? 0);
        const tieneId = Number.isFinite(idEntidad) && idEntidad > 0;
        const nombreEntidad = `${especial?.nombreEntidad ?? ''}`.trim();
        const nombreFallback = this.tieneTextoVisible(nombreEntidad)
            ? nombreEntidad
            : `${especial?.texto ?? ''}`.trim();

        if (especial.tipo === 'especial') {
            if (tieneId) {
                this.especialDetalles.emit(idEntidad);
                return;
            }
            if (this.tieneTextoVisible(nombreFallback))
                this.especialDetallesPorNombre.emit(nombreFallback);
            return;
        }

        if (tieneId) {
            this.doteDetalles.emit(idEntidad);
            return;
        }

        if (this.tieneTextoVisible(nombreFallback))
            this.doteDetallesPorNombre.emit(nombreFallback);
    }

    readonly tieneTextoVisible = tieneTextoVisible;

    getCompetenciasVisibles(grupo: keyof Clase['Competencias']): ElementoVisual[] {
        return this.competenciasVisibles[grupo] ?? [];
    }

    esCompetenciaNavegable(grupo: keyof Clase['Competencias'], item: ElementoVisual): boolean {
        return (grupo === 'Armas' || grupo === 'Armaduras') && Number(item?.idEntidad ?? 0) > 0;
    }

    abrirDetalleCompetencia(grupo: keyof Clase['Competencias'], item: ElementoVisual): void {
        const id = Number(item?.idEntidad ?? 0);
        if (!Number.isFinite(id) || id <= 0)
            return;
        if (grupo === 'Armas') {
            this.armaDetallesId.emit(id);
            return;
        }
        if (grupo === 'Armaduras')
            this.armaduraDetallesId.emit(id);
    }

    getHabilidadesVisibles(grupo: 'Base' | 'Custom'): ElementoVisual[] {
        return this.habilidadesVisibles[grupo] ?? [];
    }

    /** Las competencias con un arma o una armadura llevan a su detalle (función: la usa `<app-ficha-prerrequisitos>`). */
    readonly esPrerrequisitoNavegable = (condicion: CondicionPrerrequisito): boolean => {
        const destino = destinoPrerrequisito(condicion);
        return destino?.entidad === 'arma' || destino?.entidad === 'armadura';
    };

    abrirDetallePrerrequisito(condicion: CondicionPrerrequisito): void {
        const destino = destinoPrerrequisito(condicion);
        if (destino?.entidad === 'arma')
            this.armaDetallesId.emit(destino.id);
        else if (destino?.entidad === 'armadura')
            this.armaduraDetallesId.emit(destino.id);
    }

    private getResumenDotes(nivel: ClaseNivelDetalle): ResumenDote[] {
        if (!nivel?.Dotes)
            return [];

        const agrupadas = new Map<string, { nombre: string, grupoOpcional: number, extras: Set<string>, tooltipExtras: Set<string>, idEntidad: number | null }>();

        nivel.Dotes.forEach((doteNivel) => {
            const nombre = this.tieneTextoVisible(doteNivel?.Dote?.Nombre)
                ? doteNivel.Dote.Nombre
                : 'Dote';
            const grupoOpcional = this.getGrupoOpcional(doteNivel?.Opcional);
            const idEntidad = this.getIdDoteNivel(doteNivel);
            const clave = `${idEntidad ?? nombre}|${grupoOpcional}`;
            const extra = this.getExtraVisibleDoteNivel(doteNivel);
            const tooltipExtra = this.getTooltipExtrasDoteNivel(doteNivel);

            if (!agrupadas.has(clave)) {
                agrupadas.set(clave, {
                    nombre,
                    grupoOpcional,
                    extras: new Set<string>(),
                    tooltipExtras: new Set<string>(),
                    idEntidad,
                });
            }

            if (this.tieneTextoVisible(extra)) {
                agrupadas.get(clave)?.extras.add(extra);
                if (extra === 'extra a elegir' && this.tieneTextoVisible(tooltipExtra))
                    agrupadas.get(clave)?.tooltipExtras.add(tooltipExtra);
            }
        });

        const base = Array.from(agrupadas.values()).map((item) => {
            const extras = Array.from(item.extras.values());
            return {
                texto: item.nombre,
                grupoOpcional: item.grupoOpcional,
                extras,
                tooltip: Array.from(item.tooltipExtras.values()).join(' | '),
                idEntidad: item.idEntidad,
            };
        });

        return base;
    }

    getResumenEspeciales(nivel: ClaseNivelDetalle): ResumenEspecial[] {
        const especiales = (nivel?.Especiales ?? []).map(especialNivel => {
            const nombre = this.getNombreEspecialNivel(especialNivel);
            const extra = this.getExtraVisibleEspecialNivel(especialNivel);
            const idEntidad = this.getIdEspecialNivel(especialNivel);
            return {
                texto: nombre,
                grupoOpcional: this.getGrupoOpcional(especialNivel?.Opcional),
                extras: this.tieneTextoVisible(extra) ? [extra] : [],
                tooltip: '',
                tipo: 'especial' as const,
                idEntidad,
                nombreEntidad: nombre,
                clicable: idEntidad !== null || this.tieneTextoVisible(nombre),
            };
        });

        const dotes = this.getResumenDotes(nivel).map(dote => ({
            texto: dote.texto,
            grupoOpcional: dote.grupoOpcional,
            extras: dote.extras,
            tooltip: dote.tooltip,
            tipo: 'dote' as const,
            idEntidad: dote.idEntidad,
            nombreEntidad: dote.texto,
            clicable: dote.idEntidad !== null || this.tieneTextoVisible(dote.texto),
        }));

        return [...especiales, ...dotes];
    }

    getRenderEspeciales(nivel: ClaseNivelDetalle): ResumenEspecialRenderItem[] {
        const base = this.getResumenEspeciales(nivel);
        if (base.length < 1)
            return [];

        const opcionesPorGrupo = new Map<number, ResumenEspecial[]>();
        base.forEach((item) => {
            const grupo = Number(item?.grupoOpcional ?? 0);
            if (!Number.isFinite(grupo) || grupo <= 0)
                return;
            const opciones = opcionesPorGrupo.get(grupo) ?? [];
            opciones.push(item);
            opcionesPorGrupo.set(grupo, opciones);
        });

        const render: ResumenEspecialRenderItem[] = [];
        const gruposEmitidos = new Set<number>();
        base.forEach((item) => {
            const grupo = Number(item?.grupoOpcional ?? 0);
            if (!Number.isFinite(grupo) || grupo <= 0) {
                render.push({
                    tipoRender: 'simple',
                    item,
                });
                return;
            }

            if (gruposEmitidos.has(grupo))
                return;
            gruposEmitidos.add(grupo);

            const opciones = opcionesPorGrupo.get(grupo) ?? [];
            if (opciones.length > 1) {
                render.push({
                    tipoRender: 'grupo_opcional',
                    grupo,
                    opciones,
                });
                return;
            }

            render.push({
                tipoRender: 'simple',
                item: opciones[0] ?? item,
            });
        });

        return render;
    }

    getRenderEspecialesFila(nivel: ClaseNivelDetalle): ResumenEspecialRenderItem[] {
        const key = Number(nivel?.Nivel ?? 0);
        return this.renderEspecialesPorNivel[key] ?? [];
    }

    trackByFila = (_index: number, fila: FilaProgresion): number => fila.nivel;

    /** El nombre del especial o la dote con sus extras: «Dote adicional (Guerrero)». */
    textoEspecial(especial: ResumenEspecial): string {
        return especial.extras.length > 0 ? `${especial.texto} (${especial.extras.join(', ')})` : especial.texto;
    }

    getAumentosLanzadora(nivel: ClaseNivelDetalle): string[] {
        return (nivel?.Aumentos_clase_lanzadora ?? [])
            .map(a => a.Nombre)
            .filter(nombre => this.tieneTextoVisible(nombre))
            .map(nombre => mayusculaInicial(nombre));
    }

    getValorDiarios(nivel: ClaseNivelDetalle, nivelConjuro: number): string {
        const valor = nivel.Conjuros_diarios?.[`Nivel_${nivelConjuro}`];
        if (valor === undefined || valor === null || Number(valor) < 0)
            return '';
        return `${valor}`;
    }

    getValorConocidos(nivel: ClaseNivelDetalle, nivelConjuro: number): string {
        const valor = nivel.Conjuros_conocidos_nivel_a_nivel?.[`Nivel_${nivelConjuro}`];
        if (valor === undefined || valor === null || Number(valor) <= 0)
            return '';
        return `${valor}`;
    }

    getValorConocidosTotal(nivel: ClaseNivelDetalle): string {
        if (!nivel?.Conjuros_conocidos_total || nivel.Conjuros_conocidos_total <= 0)
            return '';
        return `${nivel.Conjuros_conocidos_total}`;
    }

    getEtiquetaNivelConjuro(nivel: number): string {
        if (Number(nivel) === 0)
            return 'Truco';
        return `${nivel}`;
    }

    private recalcularTablaProgresion() {
        if (!this.claseData) {
            this.filasNivel = [];
            this.filasTabla = [];
            this.filasCabecera = 1;
            this.columnasDiarios = [];
            this.columnasConocidos = [];
            this.renderEspecialesPorNivel = {};
            this.mostrarConocidosTotal = false;
            this.mostrarAtaqueBase = false;
            this.mostrarFortaleza = false;
            this.mostrarReflejos = false;
            this.mostrarVoluntad = false;
            this.mostrarEspeciales = false;
            this.mostrarNivelMaxPoderAccesible = false;
            this.mostrarReservaPsionica = false;
            this.mostrarAumentosClaseLanzadora = false;
            return;
        }

        const nivelesRaw = Array.isArray(this.claseData.Desglose_niveles) ? this.claseData.Desglose_niveles : [];
        const nivelMax = this.claseData.Nivel_max_claseo > 0
            ? this.claseData.Nivel_max_claseo
            : Math.max(1, ...nivelesRaw.map(n => Number(n?.Nivel ?? 0)));

        const nivelMap = new Map<number, ClaseNivelDetalle>();
        nivelesRaw.forEach(n => {
            const nivel = Number(n?.Nivel ?? 0);
            if (nivel > 0)
                nivelMap.set(nivel, n);
        });

        this.filasNivel = [];
        for (let i = 1; i <= nivelMax; i++) {
            this.filasNivel.push(nivelMap.get(i) ?? this.crearNivelVacio(i));
        }

        this.renderEspecialesPorNivel = this.filasNivel.reduce((acc, nivel) => {
            acc[nivel.Nivel] = this.getRenderEspeciales(nivel);
            return acc;
        }, {} as Record<number, ResumenEspecialRenderItem[]>);

        this.columnasDiarios = this.getColumnasDinamicas('Conjuros_diarios', (v: number) => v >= 0);
        this.columnasConocidos = this.getColumnasDinamicas('Conjuros_conocidos_nivel_a_nivel', (v: number) => v > 0);
        this.mostrarConocidosTotal = this.filasNivel.some(n => (n.Conjuros_conocidos_total ?? 0) > 0);
        this.mostrarAtaqueBase = this.filasNivel.some(n => this.tieneTextoVisible(n.Ataque_base));
        this.mostrarFortaleza = this.filasNivel.some(n => this.tieneTextoVisible(n.Salvaciones?.Fortaleza));
        this.mostrarReflejos = this.filasNivel.some(n => this.tieneTextoVisible(n.Salvaciones?.Reflejos));
        this.mostrarVoluntad = this.filasNivel.some(n => this.tieneTextoVisible(n.Salvaciones?.Voluntad));
        this.mostrarEspeciales = Object.values(this.renderEspecialesPorNivel).some(items => items.length > 0);
        this.mostrarNivelMaxPoderAccesible = this.filasNivel.some(n => (n.Nivel_max_poder_accesible_nivel_lanzadorPsionico ?? -1) >= 0);
        this.mostrarReservaPsionica = this.filasNivel.some(n => (n.Reserva_psionica ?? 0) > 0);
        this.mostrarAumentosClaseLanzadora = this.filasNivel.some(n => this.getAumentosLanzadora(n).length > 0);
        this.filasCabecera = this.columnasDiarios.length > 0 || this.columnasConocidos.length > 0 ? 2 : 1;
        this.filasTabla = this.filasNivel.map((nivel) => this.construirFilaProgresion(nivel));
    }

    private construirFilaProgresion(nivel: ClaseNivelDetalle): FilaProgresion {
        const texto = (valor: string | null | undefined): string => this.tieneTextoVisible(valor) ? `${valor}` : '';
        const nivelMaxPoder = nivel.Nivel_max_poder_accesible_nivel_lanzadorPsionico;
        return {
            nivel: nivel.Nivel,
            ataqueBase: texto(nivel.Ataque_base),
            fortaleza: texto(nivel.Salvaciones?.Fortaleza),
            reflejos: texto(nivel.Salvaciones?.Reflejos),
            voluntad: texto(nivel.Salvaciones?.Voluntad),
            especiales: this.getRenderEspecialesFila(nivel),
            nivelMaxPoder: nivelMaxPoder >= 0 ? `${nivelMaxPoder}` : '',
            reservaPsionica: nivel.Reserva_psionica > 0 ? `${nivel.Reserva_psionica}` : '',
            aumentos: this.getAumentosLanzadora(nivel).join(', '),
            diarios: this.columnasDiarios.map((nivelConjuro) => this.getValorDiarios(nivel, nivelConjuro)),
            conocidos: this.columnasConocidos.map((nivelConjuro) => this.getValorConocidos(nivel, nivelConjuro)),
            conocidosTotal: this.getValorConocidosTotal(nivel),
        };
    }

    private construirDatos(): DatoFicha[] {
        const c = this.claseData;
        const roles = [
            c?.Roles?.Dps ? 'DPS' : '',
            c?.Roles?.Tanque ? 'Tanque' : '',
            c?.Roles?.Support ? 'Support' : '',
            c?.Roles?.Utilidad ? 'Utilidad' : '',
        ].filter(Boolean);
        const puntos = c?.Puntos_habilidad?.Valor;
        return [
            { etiqueta: 'Dado de golpe', valor: `${c?.Tipo_dado?.Nombre ?? ''}`.toLowerCase() },
            { etiqueta: 'Puntos de habilidad por nivel', valor: puntos, detalle: puntos !== null && puntos !== undefined ? '+ mod. de Int' : null },
            datoAlineamiento(c?.Alineamiento),
            { etiqueta: 'Niveles', valor: c?.Nivel_max_claseo > 0 ? `1 a ${c.Nivel_max_claseo}` : null },
            // Las progresiones («Medio», «Buena»); sus valores, nivel a nivel, en la tabla.
            { etiqueta: 'Ataque base', valor: c?.Ataque_base?.Nombre },
            { etiqueta: 'Fortaleza', valor: c?.Salvaciones?.Fortaleza?.Nombre },
            { etiqueta: 'Reflejos', valor: c?.Salvaciones?.Reflejos?.Nombre },
            { etiqueta: 'Voluntad', valor: c?.Salvaciones?.Voluntad?.Nombre },
            { etiqueta: 'Roles', valor: roles.join(', ') },
        ];
    }

    private construirFlagsConjuros(): string[] {
        const conjuros = this.claseData?.Conjuros;
        return [
            conjuros?.Arcanos === true ? 'Arcanos' : '',
            conjuros?.Divinos === true ? 'Divinos' : '',
            conjuros?.Psionicos === true ? 'Poderes psiónicos' : '',
            conjuros?.Conocidos_nivel_a_nivel === true ? 'Conocidos nivel a nivel' : '',
            conjuros?.Conocidos_total === true ? 'Conocidos en total' : '',
            conjuros?.Lanzamiento_espontaneo === true ? 'Lanzamiento espontáneo' : '',
            conjuros?.Dependientes_alineamiento === true ? 'Dependen del alineamiento' : '',
            conjuros?.Dominio === true ? 'Dominios' : '',
            conjuros?.puede_elegir_especialidad === true ? 'Puede elegir especialidad' : '',
        ].filter(Boolean);
    }

    /** El listado de conjuros de la clase por nivel («Truco», 1, 2…), en el orden de la API dentro de cada nivel. */
    private construirListadoConjuros(): NivelListadoConjuros[] {
        const porNivel = new Map<number, ClaseConjuroRef[]>();
        (this.claseData?.Conjuros?.Listado ?? [])
            .filter((conjuro) => this.tieneTextoVisible(conjuro?.Nombre))
            .forEach((conjuro) => {
                const nivel = Number(conjuro.Nivel) || 0;
                porNivel.set(nivel, [...(porNivel.get(nivel) ?? []), conjuro]);
            });
        return Array.from(porNivel.entries())
            .sort(([a], [b]) => a - b)
            .map(([nivel, conjuros]) => ({ nivel, etiqueta: this.getEtiquetaNivelConjuro(nivel), conjuros }));
    }

    private getColumnasDinamicas(
        campo: 'Conjuros_diarios' | 'Conjuros_conocidos_nivel_a_nivel',
        validador: (valor: number) => boolean
    ): number[] {
        const columnas: number[] = [];
        for (let nivel = 0; nivel <= 9; nivel++) {
            const key = `Nivel_${nivel}`;
            const tieneValor = this.filasNivel.some(f => {
                const valor = Number(f[campo]?.[key]);
                return Number.isFinite(valor) && validador(valor);
            });
            if (tieneValor)
                columnas.push(nivel);
        }
        return columnas;
    }

    private crearNivelVacio(nivel: number): ClaseNivelDetalle {
        return {
            Nivel: nivel,
            Ataque_base: '',
            Salvaciones: {
                Fortaleza: '',
                Reflejos: '',
                Voluntad: '',
            },
            Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
            Reserva_psionica: 0,
            Aumentos_clase_lanzadora: [],
            Conjuros_diarios: {},
            Conjuros_conocidos_nivel_a_nivel: {},
            Conjuros_conocidos_total: 0,
            Dotes: [],
            Especiales: [],
        };
    }

    private recalcularBloquesVisuales() {
        this.competenciasVisibles = {
            Armas: this.toVisualItems(this.claseData?.Competencias?.Armas ?? []),
            Armaduras: this.toVisualItems(this.claseData?.Competencias?.Armaduras ?? []),
            Grupos_arma: this.toVisualItems(this.claseData?.Competencias?.Grupos_arma ?? []),
            Grupos_armadura: this.toVisualItems(this.claseData?.Competencias?.Grupos_armadura ?? []),
        };
        this.habilidadesVisibles = {
            Base: this.toVisualItems(this.claseData?.Habilidades?.Base ?? []),
            Custom: this.toVisualItems(this.claseData?.Habilidades?.Custom ?? []),
        };
        this.habilidadesPorAlineamiento = (this.claseData?.Habilidades?.Por_alineamiento ?? [])
            .filter((item) => this.tieneTextoVisible(item.Habilidad))
            .map((item) => ({
                habilidad: this.tieneTextoVisible(item.Extra) ? `${item.Habilidad} (${item.Extra})` : item.Habilidad,
                alineamiento: item.Alineamiento.Nombre,
            }));
        this.hayCompetencias = Object.values(this.competenciasVisibles).some(items => items.length > 0);
        this.hayHabilidades = Object.values(this.habilidadesVisibles).some(items => items.length > 0)
            || this.habilidadesPorAlineamiento.length > 0;
    }

    /** El moldeado de fusiones de Magic of Incarnum: sus datos, su tabla, los chakras que abre, su capacidad y su lista. */
    private recalcularMoldeado(): void {
        const moldeado = this.claseData?.Moldeado ?? null;
        this.datosMoldeado = datosMoldeadoClase(moldeado);
        this.filasMoldeado = filasMoldeado(moldeado);
        this.chakrasMoldeado = (moldeado?.Chakras ?? [])
            .map((chakra) => ({ id: chakra.Id, texto: `${chakra.Nombre}, desde el nivel ${chakra.Nivel}` }));
        this.capacidadMoldeado = (moldeado?.Capacidad ?? [])
            .map((fila) => `${textoBonoCapacidad(fila.Bonificador, fila.Chakra)} desde el nivel ${fila.Nivel}`);
        this.fusionesClase = [...(moldeado?.Fusiones ?? [])];
    }

    abrirDetallesFusion(id: number): void {
        if (Number(id) > 0)
            this.fusionDetalles.emit(Number(id));
    }

    abrirDetallesChakra(id: number): void {
        if (Number(id) > 0)
            this.chakraDetalles.emit(Number(id));
    }

    private toVisualItems(items: Record<string, any>[]): ElementoVisual[] {
        return items
            .map(item => this.mapVisualItem(item))
            .filter(item => this.tieneTextoVisible(item.nombre) || item.extras.length > 0 || this.tieneTextoVisible(item.detalle));
    }

    private mapVisualItem(item: Record<string, any>): ElementoVisual {
        if (!item || typeof item !== 'object') {
            const texto = formatearValor(item);
            return { nombre: texto || 'Elemento', extras: [], detalle: '' };
        }

        const entradas = Object.entries(item)
            .filter(([clave]) => !esCampoId(clave))
            .filter(([, valor]) => this.tieneValorMostrable(valor));

        const nombre = this.detectarNombre(entradas);
        const extras = this.detectarExtras(entradas);
        const esHabilidad = this.esRegistroHabilidad(item);
        const extraVisible = esHabilidad ? this.getExtraVisibleRegistroHabilidad(item) : '';
        if (this.tieneTextoVisible(extraVisible) && !extras.valores.some((extra) => normalizarTexto(extra) === normalizarTexto(extraVisible)))
            extras.valores.unshift(extraVisible);
        const detalle = this.detectarDetalle(entradas, nombre.origen, extras.clavesOrigen);
        // En las habilidades, «Artesanía 1» es solo la casilla del catálogo y el comodín repite el extra:
        // se enseña «Artesanía (a elegir)».
        const nombreVisible = esHabilidad ? `${nombre.valor ?? ''}`.replace(/\s+\d+$/, '') : nombre.valor;
        const extrasVisibles = esHabilidad
            ? Array.from(new Map(extras.valores
                .map((extra) => normalizarTexto(extra) === 'elegir' ? 'a elegir' : extra)
                .map((extra) => [normalizarTexto(extra), extra] as [string, string])).values())
            : extras.valores;

        return {
            nombre: nombreVisible || 'Elemento',
            extras: extrasVisibles,
            detalle,
            idEntidad: this.detectarIdEntidad(item),
        };
    }

    private detectarIdEntidad(item: Record<string, any>): number | null {
        const ids = Object.entries(item ?? {})
            .filter(([clave]) => esCampoId(clave))
            .map(([, valor]) => Number(valor))
            .filter((valor) => Number.isFinite(valor) && valor > 0);
        return ids[0] ?? null;
    }

    private detectarNombre(entradas: [string, any][]): { valor: string, origen: string | null } {
        const prioridades = ['Nombre', 'nombre', 'Habilidad', 'habilidad', 'Competencia', 'competencia', 'Especial', 'especial'];
        for (const clave of prioridades) {
            const encontrado = entradas.find(([k]) => k === clave);
            if (encontrado) {
                const valor = formatearValor(encontrado[1]);
                if (this.tieneTextoVisible(valor))
                    return { valor, origen: clave };
            }
        }

        const primerTexto = entradas.find(([, value]) => this.tieneTextoVisible(formatearValor(value)));
        if (primerTexto)
            return { valor: formatearValor(primerTexto[1]), origen: primerTexto[0] };

        return { valor: '', origen: null };
    }

    private detectarExtras(entradas: [string, any][]): { valores: string[], clavesOrigen: string[] } {
        const clavesOrigen: string[] = [];
        const valores: string[] = [];

        entradas.forEach(([clave, valor]) => {
            if (!this.esCampoExtra(clave))
                return;
            if (this.esCampoExtraTecnico(clave))
                return;

            clavesOrigen.push(clave);
            if (Array.isArray(valor)) {
                valor.forEach(v => {
                    const t = formatearValor(v);
                    if (this.tieneTextoVisible(t))
                        valores.push(t);
                });
                return;
            }

            const texto = formatearValor(valor);
            if (this.tieneTextoVisible(texto))
                valores.push(texto);
        });

        return { valores, clavesOrigen };
    }

    private detectarDetalle(entradas: [string, any][], claveNombre: string | null, clavesExtra: string[]): string {
        return entradas
            .filter(([clave]) => clave !== claveNombre && !clavesExtra.includes(clave))
            .map(([clave, valor]) => `${formatearClave(clave)}: ${formatearValor(valor)}`)
            .filter(v => this.tieneTextoVisible(v))
            .join(' | ');
    }

    private esCampoExtra(clave: string): boolean {
        const base = clave.replace(/[_\s]/g, '').toLowerCase();
        return base.includes('extra');
    }

    private esCampoExtraTecnico(clave: string): boolean {
        const base = clave.replace(/[_\s]/g, '').toLowerCase();
        return base === 'soportaextra'
            || base === 'idextra'
            || base === 'idextraelegido'
            || base === 'extrasdisponibles'
            || base === 'extras';
    }

    private esRegistroHabilidad(item: Record<string, any>): boolean {
        if (!item || typeof item !== 'object')
            return false;
        return this.tieneTextoVisible(extraerValorSimple(item?.['Habilidad'] ?? item?.['habilidad']))
            || this.tieneTextoVisible(extraerValorSimple(item?.['Nombre'] ?? item?.['nombre']));
    }

    private getExtraVisibleRegistroHabilidad(item: Record<string, any>): string {
        if (!item || typeof item !== 'object')
            return '';

        const hasIdExtra = Object.prototype.hasOwnProperty.call(item, 'Id_extra')
            || Object.prototype.hasOwnProperty.call(item, 'id_extra')
            || Object.prototype.hasOwnProperty.call(item, 'i_ex')
            || Object.prototype.hasOwnProperty.call(item, 'ie');

        return resolverExtraHabilidadVisible({
            extra: item?.['Extra'] ?? item?.['extra'] ?? item?.['x'],
            idExtra: item?.['Id_extra'] ?? item?.['id_extra'] ?? item?.['i_ex'] ?? item?.['ie'],
            extraComodin: item?.['Extra_comodin'],
            soportaExtra: item?.['Soporta_extra'] ?? item?.['soporta_extra'],
            allowIdZeroAsChoose: hasIdExtra,
        });
    }

    private getNombreEspecial(especial: Record<string, any>): string {
        if (!especial || typeof especial !== 'object')
            return 'Especial';

        if (this.tieneTextoVisible(especial['Nombre']))
            return especial['Nombre'];
        if (this.tieneTextoVisible(especial['nombre']))
            return especial['nombre'];
        if (this.tieneTextoVisible(especial['Especial']))
            return especial['Especial'];

        const claves = Object.keys(especial).filter(k => !esCampoId(k) && this.tieneValorMostrable(especial[k]));
        if (claves.length < 1)
            return 'Especial';
        return formatearValor(especial[claves[0]]);
    }

    private getNombreEspecialNivel(especialNivel: any): string {
        const nombreDesdeEspecial = this.getNombreEspecial(especialNivel?.Especial ?? {});
        if (this.tieneTextoVisible(nombreDesdeEspecial) && normalizarTexto(nombreDesdeEspecial) !== 'especial')
            return nombreDesdeEspecial;

        const candidatos = [
            especialNivel?.Nombre,
            especialNivel?.nombre,
            especialNivel?.Especial_nombre,
            especialNivel?.especial_nombre,
            especialNivel?.Especial,
            especialNivel?.especial,
        ];

        for (const candidato of candidatos) {
            const nombre = `${candidato ?? ''}`.trim();
            if (this.tieneTextoVisible(nombre))
                return nombre;
        }

        return nombreDesdeEspecial;
    }

    private getIdEspecial(especial: Record<string, any>): number | null {
        if (!especial || typeof especial !== 'object')
            return null;

        const candidatos = [
            especial['Id'],
            especial['id'],
            especial['Id_especial'],
            especial['id_especial'],
        ];

        for (const candidato of candidatos) {
            const id = Number(candidato);
            if (Number.isFinite(id) && id > 0)
                return id;
        }

        return null;
    }

    private getIdEspecialNivel(especialNivel: any): number | null {
        const desdeEspecial = this.getIdEspecial(especialNivel?.Especial ?? {});
        if (desdeEspecial && desdeEspecial > 0)
            return desdeEspecial;

        const candidatos = [
            especialNivel?.Id_especial,
            especialNivel?.id_especial,
            especialNivel?.Id,
            especialNivel?.id,
        ];

        for (const candidato of candidatos) {
            const id = Number(candidato);
            if (Number.isFinite(id) && id > 0)
                return id;
        }

        return null;
    }

    private getIdDoteNivel(doteNivel: ClaseDoteNivel): number | null {
        const candidatos = [
            doteNivel?.Dote?.Id,
            (doteNivel as any)?.Id_dote,
            (doteNivel as any)?.id_dote,
            (doteNivel as any)?.Id,
            (doteNivel as any)?.id,
        ];

        for (const candidato of candidatos) {
            const id = Number(candidato);
            if (Number.isFinite(id) && id > 0)
                return id;
        }

        return null;
    }

    private getGrupoOpcional(value: unknown): number {
        const grupo = Number(value);
        return Number.isFinite(grupo) && grupo > 0 ? Math.trunc(grupo) : 0;
    }

    private getExtraVisibleEspecialNivel(especialNivel: any): string {
        const extraRaw = `${especialNivel?.Extra ?? ''}`.trim();
        if (this.tieneTextoVisible(extraRaw) && !this.esExtraDesconocido(extraRaw))
            return extraRaw;

        const idExtra = Number(especialNivel?.Id_extra ?? 0);
        if (!Number.isFinite(idExtra) || idExtra <= 0)
            return '';

        const encontrada = this.getExtrasDisponiblesEspecial(especialNivel?.Especial)
            .find(extra => extra.Id === idExtra);
        if (encontrada && this.tieneTextoVisible(encontrada.Nombre))
            return encontrada.Nombre;

        return '';
    }

    private getExtrasDisponiblesEspecial(especial: Record<string, any>): { Id: number, Nombre: string }[] {
        if (!especial || typeof especial !== 'object')
            return [];

        const extrasRaw = Array.isArray(especial?.['Extras'])
            ? especial['Extras']
            : (especial?.['Extras'] && typeof especial['Extras'] === 'object')
                ? Object.values(especial['Extras'])
                : [];

        return extrasRaw
            .map((item: any) => {
                const id = Number(item?.Id_extra ?? item?.Id ?? item?.id_extra ?? item?.id ?? 0);
                const nombre = `${item?.Extra ?? item?.Nombre ?? item?.extra ?? item?.nombre ?? ''}`.trim();
                return {
                    Id: Number.isFinite(id) ? id : 0,
                    Nombre: nombre,
                };
            })
            .filter(extra => extra.Id > 0 && this.tieneTextoVisible(extra.Nombre));
    }

    esChipEspecialInteractivo(especial: ResumenEspecial): boolean {
        return this.tieneTextoVisible(especial?.texto ?? '');
    }

    private tieneValorMostrable(valor: unknown): boolean {
        if (valor === null || valor === undefined)
            return false;
        if (typeof valor === 'string')
            return this.tieneTextoVisible(valor);
        if (typeof valor === 'number')
            return valor !== 0;
        if (typeof valor === 'boolean')
            return valor;
        if (Array.isArray(valor))
            return valor.length > 0;
        if (typeof valor === 'object')
            return Object.keys(valor as object).length > 0;
        return true;
    }

    private getExtraVisibleDoteNivel(doteNivel: ClaseDoteNivel): string {
        const extraRaw = `${doteNivel?.Extra ?? ''}`.trim();
        if (this.tieneTextoVisible(extraRaw) && !this.esExtraDesconocido(extraRaw))
            return extraRaw;

        const opciones = this.getExtrasDisponiblesDote(doteNivel);
        if (doteNivel?.Id_extra && doteNivel.Id_extra > 0) {
            const encontrada = opciones.find(extra => extra.Id === doteNivel.Id_extra);
            if (encontrada && this.tieneTextoVisible(encontrada.Nombre))
                return encontrada.Nombre;
        }

        if (this.doteTieneExtras(doteNivel))
            return 'extra a elegir';

        return '';
    }

    private getTooltipExtrasDoteNivel(doteNivel: ClaseDoteNivel): string {
        const nombres = this.getExtrasDisponiblesDote(doteNivel)
            .map(extra => extra?.Nombre ?? '')
            .filter(nombre => this.tieneTextoVisible(nombre));

        const unicos = Array.from(new Set(nombres));
        if (unicos.length < 1)
            return '';
        return `Extras posibles: ${unicos.join(', ')}`;
    }

    private getExtrasDisponiblesDote(doteNivel: ClaseDoteNivel): { Id: number, Nombre: string }[] {
        const disponibles = doteNivel?.Dote?.Extras_disponibles;
        if (!disponibles)
            return [];

        return [
            ...(disponibles.Armas ?? []),
            ...(disponibles.Armaduras ?? []),
            ...(disponibles.Escuelas ?? []),
            ...(disponibles.Habilidades ?? []),
        ];
    }

    private doteTieneExtras(doteNivel: ClaseDoteNivel): boolean {
        const soportados = doteNivel?.Dote?.Extras_soportados;
        const soportaTipo = !!soportados && (
            Number(soportados.Extra_arma) > 0
            || Number(soportados.Extra_armadura_armaduras ?? soportados.Extra_armadura) > 0
            || Number(soportados.Extra_armadura_escudos ?? soportados.Extra_armadura) > 0
            || Number(soportados.Extra_escuela) > 0
            || Number(soportados.Extra_habilidad) > 0
        );
        return soportaTipo || this.getExtrasDisponiblesDote(doteNivel).length > 0;
    }

    private esExtraDesconocido(extra: string): boolean {
        const base = normalizarTexto(extra);
        return base === 'desconocido' || base === 'sin especificar';
    }

}
