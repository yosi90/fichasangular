import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { Plantilla, PlantillaPrerrequisitos } from 'src/app/interfaces/plantilla';
import { SubtipoRef } from 'src/app/interfaces/subtipo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';

type PrerrequisitoCondicion = {
    familiaEtiqueta: string;
    campos: { etiqueta: string; valor: string }[];
};

type PrerrequisitoGrupo = {
    titulo: string;
    descripcion: string;
    opcional: boolean;
    condiciones: PrerrequisitoCondicion[];
};

type CambioNumerico = {
    etiqueta: string;
    valor: number;
};

type CambioTexto = {
    etiqueta: string;
    valor: string;
};

@Component({
    selector: 'app-detalles-plantilla',
    templateUrl: './detalles-plantilla.component.html',
    styleUrls: ['./detalles-plantilla.component.sass']
})
export class DetallesPlantillaComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    plantillaData!: Plantilla;

    private readonly ordenPrerrequisitos: (keyof PlantillaPrerrequisitos)[] = [
        'actitud_requerido',
        'actitud_prohibido',
        'alineamiento_requerido',
        'caracteristica',
        'criaturas_compatibles',
    ];

    private readonly etiquetasPrerrequisitos: Record<keyof PlantillaPrerrequisitos, string> = {
        actitud_requerido: 'Actitud requerida',
        actitud_prohibido: 'Actitud prohibida',
        alineamiento_requerido: 'Alineamiento requerido',
        caracteristica: 'Caracteristica',
        criaturas_compatibles: 'Criaturas compatibles',
    };

    @Input()
    set plantilla(value: Plantilla) {
        this.plantillaData = value;
    }

    @Output() conjuroDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() doteDetalles: EventEmitter<number> = new EventEmitter<number>();
    @Output() subtipoDetalles: EventEmitter<{ Id?: number | null; Nombre: string; }> = new EventEmitter<{ Id?: number | null; Nombre: string; }>();

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.plantillaData?.Manual?.Id,
            nombre: this.plantillaData?.Manual?.Nombre,
        });
    }

    abrirDetallesConjuro(idConjuro: number) {
        const id = Number(idConjuro);
        if (Number.isFinite(id) && id > 0)
            this.conjuroDetalles.emit(id);
    }

    abrirDetallesDote(doteCtx: DoteContextual) {
        const id = Number(doteCtx?.Dote?.Id);
        if (Number.isFinite(id) && id > 0)
            this.doteDetalles.emit(id);
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

    getSigno(valor: number): string {
        return valor > 0 ? `+${valor}` : `${valor}`;
    }

    tieneCambiosMovimientos(): boolean {
        const mov = this.plantillaData?.Movimientos;
        if (!mov)
            return false;

        return this.toNumber(mov.Correr) > 0
            || this.toNumber(mov.Nadar) > 0
            || this.toNumber(mov.Volar) > 0
            || this.toNumber(mov.Trepar) > 0
            || this.toNumber(mov.Escalar) > 0
            || this.tieneManiobrabilidadVisible();
    }

    getMovimientosVisibles(): CambioNumerico[] {
        const mov = this.plantillaData?.Movimientos;
        if (!mov)
            return [];

        const cambios: CambioNumerico[] = [
            { etiqueta: 'Correr', valor: this.toNumber(mov.Correr) },
            { etiqueta: 'Nadar', valor: this.toNumber(mov.Nadar) },
            { etiqueta: 'Volar', valor: this.toNumber(mov.Volar) },
            { etiqueta: 'Trepar', valor: this.toNumber(mov.Trepar) },
            { etiqueta: 'Escalar', valor: this.toNumber(mov.Escalar) },
        ];

        return cambios.filter(c => c.valor > 0);
    }

    tieneManiobrabilidadVisible(): boolean {
        const nombre = `${this.plantillaData?.Maniobrabilidad?.Nombre ?? ''}`;
        const normalizado = this.normalizar(nombre);
        if (!this.tieneTextoVisible(nombre))
            return false;

        return normalizado !== 'no vuela'
            && normalizado !== 'sin vuelo'
            && normalizado !== 'no tiene vuelo';
    }

    tieneTipoDadoVisible(): boolean {
        const nombre = `${this.plantillaData?.Tipo_dado?.Nombre ?? ''}`;
        const normalizado = this.normalizar(nombre);
        if (!this.tieneTextoVisible(nombre))
            return false;

        // Regla de negocio: "Elegir" en tipo de dado implica que la plantilla no modifica el dado de golpe.
        return normalizado !== 'elegir'
            && normalizado !== 'a elegir'
            && normalizado !== 'elige';
    }

    getCambiosCombateNumericos(): CambioNumerico[] {
        return [
            { etiqueta: 'Ataque base', valor: this.toNumber(this.plantillaData?.Ataque_base) },
            { etiqueta: 'Iniciativa', valor: this.toNumber(this.plantillaData?.Iniciativa) },
            { etiqueta: 'Presa', valor: this.toNumber(this.plantillaData?.Presa) },
            { etiqueta: 'Fortaleza', valor: this.toNumber(this.plantillaData?.Fortaleza) },
            { etiqueta: 'Reflejos', valor: this.toNumber(this.plantillaData?.Reflejos) },
            { etiqueta: 'Voluntad', valor: this.toNumber(this.plantillaData?.Voluntad) },
        ].filter(c => c.valor !== 0);
    }

    getCambiosCombateTexto(): CambioTexto[] {
        const cambios: CambioTexto[] = [
            { etiqueta: 'CA', valor: `${this.plantillaData?.Ca ?? ''}` },
            { etiqueta: 'Reduccion de dano', valor: `${this.plantillaData?.Reduccion_dano ?? ''}` },
            { etiqueta: 'Resistencia a conjuros', valor: `${this.plantillaData?.Resistencia_conjuros ?? ''}` },
            { etiqueta: 'Resistencia elemental', valor: `${this.plantillaData?.Resistencia_elemental ?? ''}` },
        ];

        return cambios.filter(c => this.tieneTextoVisible(c.valor));
    }

    tieneCambiosCombateDefensas(): boolean {
        return this.getCambiosCombateNumericos().length > 0 || this.getCambiosCombateTexto().length > 0;
    }

    getModificadoresCaracteristicasVisibles(): CambioNumerico[] {
        const mod = this.plantillaData?.Modificadores_caracteristicas;
        if (!mod)
            return [];

        return [
            { etiqueta: 'Fue', valor: this.toNumber(mod.Fuerza) },
            { etiqueta: 'Des', valor: this.toNumber(mod.Destreza) },
            { etiqueta: 'Con', valor: this.toNumber(mod.Constitucion) },
            { etiqueta: 'Int', valor: this.toNumber(mod.Inteligencia) },
            { etiqueta: 'Sab', valor: this.toNumber(mod.Sabiduria) },
            { etiqueta: 'Car', valor: this.toNumber(mod.Carisma) },
        ].filter(c => c.valor !== 0);
    }

    getMinimosCaracteristicasVisibles(): CambioNumerico[] {
        const min = this.plantillaData?.Minimos_caracteristicas;
        if (!min)
            return [];

        return [
            { etiqueta: 'Fue', valor: this.toNumber(min.Fuerza) },
            { etiqueta: 'Des', valor: this.toNumber(min.Destreza) },
            { etiqueta: 'Con', valor: this.toNumber(min.Constitucion) },
            { etiqueta: 'Int', valor: this.toNumber(min.Inteligencia) },
            { etiqueta: 'Sab', valor: this.toNumber(min.Sabiduria) },
            { etiqueta: 'Car', valor: this.toNumber(min.Carisma) },
        ].filter(c => c.valor > 0);
    }

    tieneCambiosCaracteristicas(): boolean {
        return this.getModificadoresCaracteristicasVisibles().length > 0
            || this.getMinimosCaracteristicasVisibles().length > 0;
    }

    getPrerrequisitosAgrupados(): PrerrequisitoGrupo[] {
        if (!this.plantillaData?.Prerrequisitos)
            return [];

        // Convencion de opcional: 0 = condicion obligatoria, >0 = grupo de eleccion vinculado por ese valor.
        const condiciones: { opcional: number; condicion: PrerrequisitoCondicion; }[] = [];

        this.ordenPrerrequisitos.forEach(clave => {
            const items = this.plantillaData.Prerrequisitos[clave] ?? [];
            const familiaEtiqueta = this.etiquetasPrerrequisitos[clave];
            items.forEach(item => {
                const campos = this.getCamposVisibles(item);
                if (campos.length < 1)
                    return;

                condiciones.push({
                    opcional: this.getOpcional(item),
                    condicion: {
                        familiaEtiqueta,
                        campos,
                    },
                });
            });
        });

        if (condiciones.length < 1)
            return [];

        const grupos: PrerrequisitoGrupo[] = [];
        const obligatorias = condiciones.filter(c => c.opcional === 0).map(c => c.condicion);
        if (obligatorias.length > 0) {
            grupos.push({
                titulo: 'Obligatorios',
                descripcion: 'Se deben cumplir todos',
                opcional: false,
                condiciones: obligatorias,
            });
        }

        const opcionalesMap = new Map<number, PrerrequisitoCondicion[]>();
        condiciones
            .filter(c => c.opcional > 0)
            .forEach(c => {
                if (!opcionalesMap.has(c.opcional))
                    opcionalesMap.set(c.opcional, []);
                opcionalesMap.get(c.opcional)?.push(c.condicion);
            });

        const opcionalesOrdenados = Array.from(opcionalesMap.keys()).sort((a, b) => a - b);
        opcionalesOrdenados.forEach((opcional, index) => {
            grupos.push({
                titulo: this.getEtiquetaGrupoEleccion(index),
                descripcion: 'Debes cumplir al menos una de estas opciones',
                opcional: true,
                condiciones: opcionalesMap.get(opcional) ?? [],
            });
        });

        return grupos.filter(g => g.condiciones.length > 0);
    }

    getCamposVisibles(item: any): { etiqueta: string; valor: string }[] {
        if (!item || typeof item !== 'object')
            return [];

        return Object.entries(item)
            .filter(([clave]) => !this.esCampoId(clave) && !this.esCampoTecnicoPrerrequisito(clave))
            .map(([clave, valor]) => this.mapCampoPrerrequisito(clave, valor, item))
            .filter(campo => this.tieneTextoVisible(campo.valor) || campo.valor === '0');
    }

    esBloqueHabilidad(campos: { etiqueta: string; valor: string }[]): boolean {
        return this.tieneTextoVisible(this.getValorCampo(campos, 'Habilidad'));
    }

    getValorCampo(campos: { etiqueta: string; valor: string }[], etiqueta: string): string {
        const normalizada = etiqueta.replace(/[_\s]/g, '').toLowerCase();
        const campo = campos.find(c => c.etiqueta.replace(/[_\s]/g, '').toLowerCase() === normalizada);
        return campo?.valor ?? '';
    }

    getCamposSinEtiquetas(campos: { etiqueta: string; valor: string }[], etiquetas: string[]): { etiqueta: string; valor: string }[] {
        const normalizadas = etiquetas.map(e => e.replace(/[_\s]/g, '').toLowerCase());
        return campos.filter(c => !normalizadas.includes(c.etiqueta.replace(/[_\s]/g, '').toLowerCase()));
    }

    getCompatibilidadesVisibles(): { tipoComp: string; tipoNuevo: string; }[] {
        return (this.plantillaData?.Compatibilidad_tipos ?? [])
            .map(item => {
                const tipoComp = this.tieneTextoVisible(item.Tipo_comp) ? `${item.Tipo_comp}` : `Tipo #${item.Id_tipo_comp}`;
                const tipoNuevoRaw = `${item.Tipo_nuevo ?? ''}`;
                if (this.normalizar(tipoNuevoRaw) === 'cualquiera') {
                    return {
                        tipoComp,
                        tipoNuevo: tipoComp,
                    };
                }

                return {
                    tipoComp,
                    tipoNuevo: item.Id_tipo_nuevo > 0
                        ? (this.tieneTextoVisible(item.Tipo_nuevo) ? `${item.Tipo_nuevo}` : `Tipo #${item.Id_tipo_nuevo}`)
                        : 'No cambia',
                };
            });
    }

    getNombreDote(doteCtx: DoteContextual): string {
        const extra = doteCtx?.Contexto?.Extra;
        if (this.tieneTextoVisible(extra) && this.normalizar(extra) !== 'no aplica')
            return `${doteCtx.Dote.Nombre} (${extra})`;
        return doteCtx.Dote.Nombre;
    }

    getSubtiposActivos(): SubtipoRef[] {
        return (this.plantillaData?.Subtipos ?? [])
            .filter(subtipo => this.tieneTextoVisible(subtipo?.Nombre))
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
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

    private esCampoOpcional(clave: string): boolean {
        const normalizada = clave.replace(/[_\s]/g, '').toLowerCase();
        return normalizada === 'opcional' || normalizada === 'o';
    }

    private esCampoTecnicoPrerrequisito(clave: string): boolean {
        const normalizada = clave.replace(/[_\s]/g, '').toLowerCase();
        return this.esCampoOpcional(clave)
            || normalizada === 'requiereextra'
            || normalizada === 'requierex';
    }

    private getOpcional(item: Record<string, any>): number {
        if (!item || typeof item !== 'object')
            return 0;

        const raw = item['opcional'] ?? item['Opcional'] ?? item['o'] ?? item['O'] ?? 0;
        const valor = this.toNumber(raw);
        return valor > 0 ? valor : 0;
    }

    private getEtiquetaGrupoEleccion(index: number): string {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (index >= 0 && index < letters.length)
            return `Eleccion ${letters[index]}`;
        return `Eleccion ${(index + 1)}`;
    }

    private mapCampoPrerrequisito(clave: string, valor: unknown, item: Record<string, any>): { etiqueta: string; valor: string } {
        const base = clave.replace(/[_\s]/g, '').toLowerCase();

        if (base === 'tipocomp' || base === 'tipocompatible' || base === 'tipocriatura' || base === 'criaturacompatible') {
            return {
                etiqueta: 'Tipo compatible',
                valor: this.extraerValorSimple(valor),
            };
        }

        if (base === 'tiponuevo' || base === 'tiponuevotipo' || base === 'tiporesultante') {
            const tipoNuevo = this.extraerValorSimple(valor);
            if (this.normalizar(tipoNuevo) === 'cualquiera') {
                return {
                    etiqueta: 'Tipo nuevo',
                    valor: this.getTipoCompatibleEnCondicion(item),
                };
            }
            return {
                etiqueta: 'Tipo nuevo',
                valor: tipoNuevo,
            };
        }

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

    private getTipoCompatibleEnCondicion(item: Record<string, any>): string {
        const candidatos = [
            item?.['Tipo_comp'],
            item?.['tipo_comp'],
            item?.['Tipo compatible'],
            item?.['tipo compatible'],
            item?.['Tipo_criatura'],
            item?.['tipo_criatura'],
        ];

        for (const candidato of candidatos) {
            const valor = this.extraerValorSimple(candidato);
            if (this.tieneTextoVisible(valor))
                return valor;
        }

        return 'No cambia';
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

    private normalizar(value: string): string {
        return (value ?? '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    private toNumber(value: any): number {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    }
}
