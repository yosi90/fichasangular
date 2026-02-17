import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Clase, ClaseDoteNivel, ClaseNivelDetalle, ClasePrerrequisitos } from 'src/app/interfaces/clase';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';

type PrerrequisitoActivo = {
    clave: keyof ClasePrerrequisitos;
    etiqueta: string;
    items: Record<string, any>[];
};

type ElementoVisual = {
    nombre: string;
    extras: string[];
    detalle: string;
};

type ResumenDote = {
    texto: string;
    opcional: boolean;
    tooltip: string;
    idEntidad: number | null;
};

type TipoResumenEspecial = 'especial' | 'dote' | 'grupo';

type ResumenEspecial = {
    texto: string;
    opcional: boolean;
    tooltip: string;
    tipo: TipoResumenEspecial;
    idEntidad: number | null;
    clicable: boolean;
};

@Component({
    selector: 'app-detalles-clase',
    templateUrl: './detalles-clase.component.html',
    styleUrls: ['./detalles-clase.component.sass']
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
    mostrarNivelMaxConjuro: boolean = false;
    mostrarReservaPsionica: boolean = false;
    mostrarAumentosClaseLanzadora: boolean = false;
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

    private readonly ordenPrerrequisitos: (keyof ClasePrerrequisitos)[] = [
        'subtipo',
        'caracteristica',
        'dg',
        'dominio',
        'nivel_minimo_escuela',
        'ataque_base',
        'reserva_psionica_minima',
        'lanzar_conjuros_psionicos_nivel',
        'poder_psionico_conocido',
        'genero',
        'competencia_arma',
        'competencia_armadura',
        'competencia_grupo_arma',
        'competencia_grupo_armadura',
        'dote',
        'habilidad',
        'idioma',
        'alineamiento_requerido',
        'alineamiento_prohibido',
        'actitud_requerido',
        'actitud_prohibido',
        'lanzador_arcano',
        'lanzador_divino',
        'lanzar_conjuros_arcanos_nivel',
        'lanzar_conjuros_divinos_nivel',
        'conjuro_conocido',
        'inherente',
        'clase_especial',
        'tamano_maximo',
        'tamano_minimo',
        'raza',
        'no_raza',
    ];

    private readonly etiquetasPrerrequisitos: Record<string, string> = {
        subtipo: 'Subtipo',
        caracteristica: 'Caracteristica',
        dg: 'Dados de golpe',
        dominio: 'Dominio',
        nivel_minimo_escuela: 'Nivel minimo de escuela',
        ataque_base: 'Ataque base',
        reserva_psionica_minima: 'Reserva psionica minima',
        lanzar_conjuros_psionicos_nivel: 'Conjuros psionicos de nivel',
        poder_psionico_conocido: 'Poder psionico conocido',
        genero: 'Genero',
        competencia_arma: 'Competencia de arma',
        competencia_armadura: 'Competencia de armadura',
        competencia_grupo_arma: 'Competencia de grupo de armas',
        competencia_grupo_armadura: 'Competencia de grupo de armaduras',
        dote: 'Dote',
        habilidad: 'Habilidad',
        idioma: 'Idioma',
        alineamiento_requerido: 'Alineamiento requerido',
        alineamiento_prohibido: 'Alineamiento prohibido',
        actitud_requerido: 'Actitud requerida',
        actitud_prohibido: 'Actitud prohibida',
        lanzador_arcano: 'Lanzador arcano',
        lanzador_divino: 'Lanzador divino',
        lanzar_conjuros_arcanos_nivel: 'Conjuros arcanos de nivel',
        lanzar_conjuros_divinos_nivel: 'Conjuros divinos de nivel',
        conjuro_conocido: 'Conjuro conocido',
        inherente: 'Inherente',
        clase_especial: 'Clase especial',
        tamano_maximo: 'Tamano maximo',
        tamano_minimo: 'Tamano minimo',
        raza: 'Raza',
        no_raza: 'No raza',
    };

    @Input()
    set clase(value: Clase) {
        this.claseData = value;
        this.recalcularBloquesVisuales();
        this.recalcularTablaProgresion();
    }

    @Output() conjuroDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() especialDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() doteDetalles: EventEmitter<number> = new EventEmitter<number>();

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
        if (!especial.clicable || !especial.idEntidad || especial.idEntidad <= 0)
            return;

        if (especial.tipo === 'especial') {
            this.especialDetalles.emit(especial.idEntidad);
            return;
        }

        if (especial.tipo === 'dote')
            this.doteDetalles.emit(especial.idEntidad);
    }

    getTooltipEspecial(especial: ResumenEspecial): string {
        const detalle = this.tieneTextoVisible(especial.tooltip) ? especial.tooltip : '';
        if (especial.clicable)
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

    tieneBloqueConjuros(): boolean {
        return this.flagsConjurosActivos.length > 0
            || this.tieneTextoVisible(this.claseData?.Mod_salv_conjuros)
            || (this.claseData?.Conjuros?.Listado?.length ?? 0) > 0;
    }

    tieneTextoVisible(texto: string | undefined | null): boolean {
        if (!texto)
            return false;
        const base = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
        if (!base)
            return false;
        const limpiado = base.replace(/[.]/g, '');
        return limpiado !== 'no especifica'
            && limpiado !== 'no se especifica'
            && limpiado !== 'no aplica'
            && limpiado !== 'no modifica'
            && limpiado !== 'no vuela'
            && limpiado !== '-';
    }

    getCompetenciasVisibles(grupo: keyof Clase['Competencias']): ElementoVisual[] {
        return this.competenciasVisibles[grupo] ?? [];
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

    getPrerrequisitosActivos(): PrerrequisitoActivo[] {
        if (!this.claseData?.Prerrequisitos)
            return [];

        return this.ordenPrerrequisitos
            .map(clave => {
                const items = (this.claseData.Prerrequisitos[clave] ?? [])
                    .filter(item => this.getCamposVisibles(item).length > 0);
                return {
                    clave,
                    etiqueta: this.etiquetasPrerrequisitos[clave] ?? this.formatearTexto(clave),
                    items,
                };
            })
            .filter(f => Array.isArray(f.items) && f.items.length > 0);
    }

    getCamposVisibles(item: any): { etiqueta: string, valor: string }[] {
        if (!item || typeof item !== 'object')
            return [];

        return Object.entries(item)
            .filter(([clave]) => !this.esCampoId(clave))
            .filter(([clave]) => !this.esCampoTecnicoPrerrequisito(clave))
            .filter(([, valor]) => this.tieneValorMostrable(valor))
            .map(([clave, valor]) => this.mapCampoPrerrequisito(clave, valor, item))
            .filter(campo => campo.valor.trim().length > 0)
            .sort((a, b) => this.getOrdenCampoPrerrequisito(a.etiqueta) - this.getOrdenCampoPrerrequisito(b.etiqueta));
    }

    esBloqueHabilidad(campos: { etiqueta: string, valor: string }[]): boolean {
        return this.tieneTextoVisible(this.getValorCampo(campos, 'Habilidad'));
    }

    getValorCampo(campos: { etiqueta: string, valor: string }[], etiqueta: string): string {
        const normalizada = etiqueta.replace(/[_\s]/g, '').toLowerCase();
        const campo = campos.find(c => c.etiqueta.replace(/[_\s]/g, '').toLowerCase() === normalizada);
        return campo?.valor ?? '';
    }

    getCamposSinEtiquetas(campos: { etiqueta: string, valor: string }[], etiquetas: string[]): { etiqueta: string, valor: string }[] {
        const normalizadas = etiquetas.map(e => e.replace(/[_\s]/g, '').toLowerCase());
        return campos.filter(c => !normalizadas.includes(c.etiqueta.replace(/[_\s]/g, '').toLowerCase()));
    }

    private getResumenDotes(nivel: ClaseNivelDetalle): ResumenDote[] {
        if (!nivel?.Dotes)
            return [];

        const agrupadas = new Map<string, { nombre: string, opcional: boolean, extras: Set<string>, tooltipExtras: Set<string>, idEntidad: number | null }>();

        nivel.Dotes.forEach((doteNivel) => {
            const nombre = this.tieneTextoVisible(doteNivel?.Dote?.Nombre)
                ? doteNivel.Dote.Nombre
                : 'Dote';
            const opcional = !!doteNivel?.Opcional;
            const idDote = Number(doteNivel?.Dote?.Id);
            const idEntidad = Number.isFinite(idDote) && idDote > 0 ? idDote : null;
            const clave = `${idEntidad ?? nombre}|${opcional ? 1 : 0}`;
            const extra = this.getExtraVisibleDoteNivel(doteNivel);
            const tooltipExtra = this.getTooltipExtrasDoteNivel(doteNivel);

            if (!agrupadas.has(clave)) {
                agrupadas.set(clave, {
                    nombre,
                    opcional,
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
            const extraTxt = extras.length > 0 ? ` (${extras.join(' / ')})` : '';
            const tooltip = Array.from(item.tooltipExtras.values()).join(' | ');
            return {
                texto: `${item.nombre}${extraTxt}`,
                opcional: item.opcional,
                tooltip,
                idEntidad: item.idEntidad,
            };
        });

        return base;
    }

    getResumenEspeciales(nivel: ClaseNivelDetalle): ResumenEspecial[] {
        const especiales = (nivel?.Especiales ?? []).map(especial => {
            const nombre = this.getNombreEspecial(especial.Especial);
            const extra = this.tieneTextoVisible(especial?.Extra) && especial.Extra !== 'No aplica' ? ` (${especial.Extra})` : '';
            const idEntidad = this.getIdEspecial(especial?.Especial);
            return {
                texto: `${nombre}${extra}`,
                opcional: !!especial?.Opcional,
                tooltip: '',
                tipo: 'especial' as TipoResumenEspecial,
                idEntidad,
                clicable: idEntidad !== null,
            };
        });

        const dotes = this.getResumenDotes(nivel).map(dote => ({
            texto: dote.texto,
            opcional: dote.opcional,
            tooltip: dote.tooltip,
            tipo: 'dote' as TipoResumenEspecial,
            idEntidad: dote.idEntidad,
            clicable: dote.idEntidad !== null,
        }));

        const base = [...especiales, ...dotes];
        const obligatorias = base.filter(item => !item.opcional);
        const opcionales = base.filter(item => item.opcional);
        if (opcionales.length > 1) {
            obligatorias.push({
                texto: `Elige una: ${opcionales.map(item => item.texto).join(' o ')}`,
                opcional: false,
                tooltip: opcionales
                    .filter(item => this.tieneTextoVisible(item.tooltip))
                    .map(item => `${item.texto}: ${item.tooltip}`)
                    .join(' | '),
                tipo: 'grupo',
                idEntidad: null,
                clicable: false,
            });
            return obligatorias;
        }

        return [...obligatorias, ...opcionales];
    }

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
            this.mostrarConocidosTotal = false;
            this.mostrarAtaqueBase = false;
            this.mostrarFortaleza = false;
            this.mostrarReflejos = false;
            this.mostrarVoluntad = false;
            this.mostrarEspeciales = false;
            this.mostrarNivelMaxConjuro = false;
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

        this.columnasDiarios = this.getColumnasDinamicas('Conjuros_diarios', (v: number) => v >= 0);
        this.columnasConocidos = this.getColumnasDinamicas('Conjuros_conocidos_nivel_a_nivel', (v: number) => v > 0);
        this.mostrarConocidosTotal = this.filasNivel.some(n => (n.Conjuros_conocidos_total ?? 0) > 0);
        this.mostrarAtaqueBase = this.filasNivel.some(n => this.tieneTextoVisible(n.Ataque_base));
        this.mostrarFortaleza = this.filasNivel.some(n => this.tieneTextoVisible(n.Salvaciones?.Fortaleza));
        this.mostrarReflejos = this.filasNivel.some(n => this.tieneTextoVisible(n.Salvaciones?.Reflejos));
        this.mostrarVoluntad = this.filasNivel.some(n => this.tieneTextoVisible(n.Salvaciones?.Voluntad));
        this.mostrarEspeciales = this.filasNivel.some(n => this.getResumenEspeciales(n).length > 0);
        this.mostrarNivelMaxConjuro = this.filasNivel.some(n => (n.Nivel_max_conjuro ?? -1) >= 0);
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
            Nivel_max_conjuro: -1,
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
            const texto = this.formatearValor(item);
            return { nombre: texto || 'Elemento', extras: [], detalle: '' };
        }

        const entradas = Object.entries(item)
            .filter(([clave]) => !this.esCampoId(clave))
            .filter(([, valor]) => this.tieneValorMostrable(valor));

        const nombre = this.detectarNombre(entradas);
        const extras = this.detectarExtras(entradas);
        const detalle = this.detectarDetalle(entradas, nombre.origen, extras.clavesOrigen);

        return {
            nombre: nombre.valor || 'Elemento',
            extras: extras.valores,
            detalle,
        };
    }

    private detectarNombre(entradas: [string, any][]): { valor: string, origen: string | null } {
        const prioridades = ['Nombre', 'nombre', 'Habilidad', 'habilidad', 'Competencia', 'competencia', 'Especial', 'especial'];
        for (const clave of prioridades) {
            const encontrado = entradas.find(([k]) => k === clave);
            if (encontrado) {
                const valor = this.formatearValor(encontrado[1]);
                if (this.tieneTextoVisible(valor))
                    return { valor, origen: clave };
            }
        }

        const primerTexto = entradas.find(([, value]) => this.tieneTextoVisible(this.formatearValor(value)));
        if (primerTexto)
            return { valor: this.formatearValor(primerTexto[1]), origen: primerTexto[0] };

        return { valor: '', origen: null };
    }

    private detectarExtras(entradas: [string, any][]): { valores: string[], clavesOrigen: string[] } {
        const clavesOrigen: string[] = [];
        const valores: string[] = [];

        entradas.forEach(([clave, valor]) => {
            if (!this.esCampoExtra(clave))
                return;

            clavesOrigen.push(clave);
            if (Array.isArray(valor)) {
                valor.forEach(v => {
                    const t = this.formatearValor(v);
                    if (this.tieneTextoVisible(t))
                        valores.push(t);
                });
                return;
            }

            const texto = this.formatearValor(valor);
            if (this.tieneTextoVisible(texto))
                valores.push(texto);
        });

        return { valores, clavesOrigen };
    }

    private detectarDetalle(entradas: [string, any][], claveNombre: string | null, clavesExtra: string[]): string {
        return entradas
            .filter(([clave]) => clave !== claveNombre && !clavesExtra.includes(clave))
            .map(([clave, valor]) => `${this.formatearTexto(clave)}: ${this.formatearValor(valor)}`)
            .filter(v => this.tieneTextoVisible(v))
            .join(' | ');
    }

    private esCampoExtra(clave: string): boolean {
        const base = clave.replace(/[_\s]/g, '').toLowerCase();
        return base.includes('extra');
    }

    private esCampoTecnicoPrerrequisito(clave: string): boolean {
        const base = clave.replace(/[_\s]/g, '').toLowerCase();
        return base === 'opcional'
            || base === 'o'
            || base === 'requiereextra'
            || base === 'requierex';
    }

    private mapCampoPrerrequisito(clave: string, valor: unknown, item: Record<string, any>): { etiqueta: string, valor: string } {
        const base = clave.replace(/[_\s]/g, '').toLowerCase();

        if (base.includes('rangos')) {
            const n = Number(this.extraerValorSimple(valor));
            return {
                etiqueta: 'Rangos',
                valor: Number.isFinite(n) && n > 0 ? `>= ${n}` : `${this.formatearValor(valor)}`,
            };
        }

        if (base === 'extra' || base === 'extras') {
            return {
                etiqueta: 'Extra',
                valor: this.extraerValorSimple(valor),
            };
        }

        if (base.includes('habilidad')) {
            return {
                etiqueta: 'Habilidad',
                valor: this.formatearHabilidadPrerrequisito(valor, item),
            };
        }

        return {
            etiqueta: this.formatearTexto(clave),
            valor: this.formatearValor(valor),
        };
    }

    private formatearHabilidadPrerrequisito(valor: unknown, item: Record<string, any>): string {
        const habilidad = this.extraerValorSimple(valor);
        const extra = this.extraerValorSimple(item?.['Extra'] ?? item?.['extra'] ?? item?.['Extras'] ?? item?.['extras']);
        const matchSaberGenerico = /^saber\s*\d+$/i.test(habilidad);
        if (matchSaberGenerico && this.tieneTextoVisible(extra))
            return 'Saber';
        return habilidad;
    }

    private extraerValorSimple(valor: unknown): string {
        if (valor === null || valor === undefined)
            return '';
        if (typeof valor === 'string' || typeof valor === 'number')
            return `${valor}`.trim();
        if (typeof valor === 'boolean')
            return valor ? 'Si' : 'No';
        if (Array.isArray(valor))
            return valor.map(v => this.extraerValorSimple(v)).filter(v => this.tieneTextoVisible(v)).join(', ');
        if (typeof valor === 'object') {
            const obj = valor as Record<string, unknown>;
            const prioridad = ['Extra', 'extra', 'Nombre', 'nombre', 'Habilidad', 'habilidad', 'Valor', 'valor'];
            for (const key of prioridad) {
                const picked = this.extraerValorSimple(obj[key]);
                if (this.tieneTextoVisible(picked))
                    return picked;
            }
            return this.formatearValor(valor);
        }
        return '';
    }

    private getOrdenCampoPrerrequisito(etiqueta: string): number {
        const base = etiqueta.replace(/[_\s]/g, '').toLowerCase();
        if (base === 'habilidad')
            return 1;
        if (base === 'extra')
            return 2;
        if (base === 'rangos')
            return 3;
        return 10;
    }

    private formatearObjeto(item: any): string {
        if (!item || typeof item !== 'object')
            return this.formatearValor(item);

        const claves = Object.keys(item).filter(key => !this.esCampoId(key) && this.tieneValorMostrable(item[key]));
        if (claves.length < 1)
            return '';

        if (claves.includes('Nombre') && this.tieneTextoVisible(item.Nombre))
            return item.Nombre;

        return claves
            .map(key => `${this.formatearTexto(key)}: ${this.formatearValor(item[key])}`)
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

        const claves = Object.keys(especial).filter(k => !this.esCampoId(k) && this.tieneValorMostrable(especial[k]));
        if (claves.length < 1)
            return 'Especial';
        return this.formatearValor(especial[claves[0]]);
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

    private formatearValor(valor: unknown): string {
        if (valor === null || valor === undefined)
            return '';
        if (typeof valor === 'boolean')
            return valor ? 'Si' : 'No';
        if (typeof valor === 'number' || typeof valor === 'string')
            return `${valor}`;
        if (Array.isArray(valor))
            return valor.map(v => this.formatearValor(v)).filter(v => v.trim().length > 0).join(', ');
        if (typeof valor === 'object') {
            return Object.entries(valor as Record<string, unknown>)
                .filter(([key]) => !this.esCampoId(key))
                .map(([key, v]) => `${this.formatearTexto(key)}: ${this.formatearValor(v)}`)
                .filter(v => v.trim().length > 0)
                .join(' | ');
        }
        return '';
    }

    private formatearTexto(texto: string): string {
        if (!texto)
            return '';
        const normalizado = texto.replace(/_/g, ' ').trim();
        return normalizado.charAt(0).toUpperCase() + normalizado.slice(1);
    }

    private esCampoId(clave: string): boolean {
        const normalizada = clave.replace(/[_\s]/g, '').toLowerCase();
        return normalizada === 'id' || normalizada.startsWith('id');
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
            || Number(soportados.Extra_armadura) > 0
            || Number(soportados.Extra_escuela) > 0
            || Number(soportados.Extra_habilidad) > 0
        );
        return soportaTipo || this.getExtrasDisponiblesDote(doteNivel).length > 0;
    }

    private esExtraDesconocido(extra: string): boolean {
        const base = extra
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
        return base === 'desconocido' || base === 'sin especificar';
    }
}
