import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Clase, ClaseDoteNivel, ClaseNivelDetalle } from 'src/app/interfaces/clase';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { resolverExtraHabilidadVisible } from 'src/app/services/utils/habilidad-extra-visible';
import { normalizarTexto } from 'src/app/services/utils/normalizacion';
import { idiomasVisibles, tieneTextoVisible } from 'src/app/services/utils/texto-visible';
import { esCampoId, extraerValorSimple, formatearClave, formatearValor } from 'src/app/services/utils/formato-registros';
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

@Component({
    selector: 'app-detalles-clase',
    templateUrl: './detalles-clase.component.html',
    styleUrls: ['./detalles-clase.component.sass'],
    standalone: false
})
export class DetallesClaseComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    claseData!: Clase;
    filasNivel: ClaseNivelDetalle[] = [];
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
    habilidadesVisibles: Record<keyof Clase['Habilidades'], ElementoVisual[]> = {
        Base: [],
        Custom: [],
    };

    /** Los prerrequisitos con la frase de la API, agrupados por `Opcional` («inherente» no se enseña). */
    prerrequisitosAgrupados: GrupoPrerrequisitos[] = [];

    @Input()
    set clase(value: Clase) {
        this.claseData = value;
        this.prerrequisitosAgrupados = agruparPrerrequisitos(value?.Prerrequisitos, ['inherente']);
        this.recalcularBloquesVisuales();
        this.recalcularTablaProgresion();
    }

    @Output() conjuroDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() especialDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() especialDetallesPorNombre: EventEmitter<string> = new EventEmitter<string>();
    @Output() doteDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() doteDetallesPorNombre: EventEmitter<string> = new EventEmitter<string>();
    @Output() armaDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() armaduraDetallesId: EventEmitter<number> = new EventEmitter<number>();

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

    getTooltipEspecial(especial: ResumenEspecial): string {
        const detalle = this.tieneTextoVisible(especial.tooltip) ? especial.tooltip : '';
        if (this.esChipEspecialInteractivo(especial))
            return detalle ? `Pulsa para ver detalles | ${detalle}` : 'Pulsa para ver detalles';
        return detalle;
    }

    get rolesActivos(): string[] {
        if (!this.claseData?.Roles)
            return [];
        const roles: string[] = [];
        if (this.claseData.Roles.Dps) roles.push('DPS');
        if (this.claseData.Roles.Tanque) roles.push('Tanque');
        if (this.claseData.Roles.Support) roles.push('Support');
        if (this.claseData.Roles.Utilidad) roles.push('Utilidad');
        return roles;
    }

    get flagsConjurosActivos(): string[] {
        if (!this.claseData?.Conjuros)
            return [];
        const flags: { clave: keyof Clase['Conjuros'], etiqueta: string }[] = [
            { clave: 'Arcanos', etiqueta: 'Arcanos' },
            { clave: 'Conocidos_nivel_a_nivel', etiqueta: 'Conocidos nivel a nivel' },
            { clave: 'Lanzamiento_espontaneo', etiqueta: 'Lanzamiento espontaneo' },
        ];
        return flags
            .filter(item => this.claseData.Conjuros[item.clave] === true)
            .map(item => item.etiqueta);
    }

    getIdiomasOtorgados(): { Nombre: string; Descripcion: string; }[] {
        return idiomasVisibles(this.claseData?.Idiomas);
    }

    tieneBloqueConjuros(): boolean {
        return this.flagsConjurosActivos.length > 0
            || this.tieneTextoVisible(this.claseData?.Mod_salv_conjuros)
            || (this.claseData?.Conjuros?.Listado?.length ?? 0) > 0;
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

    tieneCompetenciasVisibles(): boolean {
        return Object.values(this.competenciasVisibles).some(items => items.length > 0);
    }

    getHabilidadesVisibles(grupo: keyof Clase['Habilidades']): ElementoVisual[] {
        return this.habilidadesVisibles[grupo] ?? [];
    }

    tieneHabilidadesVisibles(): boolean {
        return Object.values(this.habilidadesVisibles).some(items => items.length > 0);
    }

    getPrerrequisitosFlagsActivos(): string[] {
        const flags = this.claseData?.Prerrequisitos_flags;
        if (!flags)
            return [];

        const activos: string[] = [];
        if (flags.habilidad_clase)
            activos.push('Habilidad de clase');

        return activos;
    }

    esPrerrequisitoNavegable(condicion: CondicionPrerrequisito): boolean {
        const destino = destinoPrerrequisito(condicion);
        return destino?.entidad === 'arma' || destino?.entidad === 'armadura';
    }

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

    trackByNivel = (index: number, nivel: ClaseNivelDetalle): number => {
        const key = Number(nivel?.Nivel ?? 0);
        return Number.isFinite(key) ? key : index;
    };

    trackByRenderEspecial = (index: number, item: ResumenEspecialRenderItem): string => {
        if (item.tipoRender === 'simple') {
            const nombre = normalizarTexto(item.item.nombreEntidad || item.item.texto || '');
            const id = Number(item.item.idEntidad ?? 0);
            return `s|${item.item.tipo}|${id}|${nombre}|${item.item.grupoOpcional}|${item.item.extras.join('|')}`;
        }

        const opciones = item.opciones
            .map((opcion) => {
                const id = Number(opcion.idEntidad ?? 0);
                const nombre = normalizarTexto(opcion.nombreEntidad || opcion.texto || '');
                return `${opcion.tipo}:${id}:${nombre}:${opcion.extras.join('|')}`;
            })
            .join('||');
        return `g|${item.grupo}|${opciones}`;
    };

    trackByResumenEspecial = (index: number, item: ResumenEspecial): string => {
        const id = Number(item?.idEntidad ?? 0);
        const nombre = normalizarTexto(item?.nombreEntidad || item?.texto || '');
        return `${item?.tipo ?? 'especial'}|${id}|${nombre}|${item?.grupoOpcional ?? 0}|${(item?.extras ?? []).join('|')}`;
    };

    trackByTexto = (index: number, texto: string): string => {
        return `${index}|${texto ?? ''}`;
    };

    getAumentosLanzadora(nivel: ClaseNivelDetalle): string[] {
        return (nivel?.Aumentos_clase_lanzadora ?? [])
            .map(a => a.Nombre)
            .filter(nombre => this.tieneTextoVisible(nombre));
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

    getTextoSalvaciones(nivel: ClaseNivelDetalle): string {
        const fortaleza = this.tieneTextoVisible(nivel?.Salvaciones?.Fortaleza) ? `${nivel.Salvaciones.Fortaleza}` : '-';
        const reflejos = this.tieneTextoVisible(nivel?.Salvaciones?.Reflejos) ? `${nivel.Salvaciones.Reflejos}` : '-';
        const voluntad = this.tieneTextoVisible(nivel?.Salvaciones?.Voluntad) ? `${nivel.Salvaciones.Voluntad}` : '-';
        return `Fort ${fortaleza} / Ref ${reflejos} / Vol ${voluntad}`;
    }

    getEtiquetaNivelConjuro(nivel: number): string {
        if (Number(nivel) === 0)
            return 'Truco';
        return `${nivel}`;
    }

    private recalcularTablaProgresion() {
        if (!this.claseData) {
            this.filasNivel = [];
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
    }

    private toVisibleTokens(items: Record<string, any>[]): string[] {
        return items
            .map(item => this.formatearObjeto(item))
            .filter(texto => texto.length > 0);
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

        return {
            nombre: nombre.valor || 'Elemento',
            extras: extras.valores,
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


    private formatearObjeto(item: any): string {
        if (!item || typeof item !== 'object')
            return formatearValor(item);

        const claves = Object.keys(item).filter(key => !esCampoId(key) && this.tieneValorMostrable(item[key]));
        if (claves.length < 1)
            return '';

        if (claves.includes('Nombre') && this.tieneTextoVisible(item.Nombre))
            return item.Nombre;

        return claves
            .map(key => `${formatearClave(key)}: ${formatearValor(item[key])}`)
            .filter(part => part.trim().length > 0)
            .join(' | ');
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

    tieneReferenciaDetalle(especial: ResumenEspecial): boolean {
        const id = Number(especial?.idEntidad ?? 0);
        if (Number.isFinite(id) && id > 0)
            return true;
        return this.tieneTextoVisible(especial?.nombreEntidad ?? '');
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
