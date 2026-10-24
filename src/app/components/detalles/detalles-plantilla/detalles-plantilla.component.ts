import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DoteContextual } from 'src/app/interfaces/dote-contextual';
import { Plantilla, PlantillaPrerrequisitos } from 'src/app/interfaces/plantilla';
import { SubtipoRef } from 'src/app/interfaces/subtipo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { normalizarTexto, toNumber } from 'src/app/services/utils/normalizacion';
import { nombreDoteConExtra, tieneTextoVisible } from 'src/app/services/utils/texto-visible';
import { esCampoId, extraVisibleDesdeRegistro, extraerValorSimple, formatearClave, formatearValor } from 'src/app/services/utils/formato-prerrequisitos';

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
    styleUrls: ['./detalles-plantilla.component.sass'],
    standalone: false
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

    readonly tieneTextoVisible = tieneTextoVisible;
    readonly getNombreDote = nombreDoteConExtra;

    getSigno(valor: number): string {
        return valor > 0 ? `+${valor}` : `${valor}`;
    }

    tieneCambiosMovimientos(): boolean {
        const mov = this.plantillaData?.Movimientos;
        if (!mov)
            return false;

        return toNumber(mov.Correr) > 0
            || toNumber(mov.Nadar) > 0
            || toNumber(mov.Volar) > 0
            || toNumber(mov.Trepar) > 0
            || toNumber(mov.Escalar) > 0
            || this.tieneManiobrabilidadVisible();
    }

    getMovimientosVisibles(): CambioNumerico[] {
        const mov = this.plantillaData?.Movimientos;
        if (!mov)
            return [];

        const cambios: CambioNumerico[] = [
            { etiqueta: 'Correr', valor: toNumber(mov.Correr) },
            { etiqueta: 'Nadar', valor: toNumber(mov.Nadar) },
            { etiqueta: 'Volar', valor: toNumber(mov.Volar) },
            { etiqueta: 'Trepar', valor: toNumber(mov.Trepar) },
            { etiqueta: 'Escalar', valor: toNumber(mov.Escalar) },
        ];

        return cambios.filter(c => c.valor > 0);
    }

    tieneManiobrabilidadVisible(): boolean {
        const nombre = `${this.plantillaData?.Maniobrabilidad?.Nombre ?? ''}`;
        const normalizado = normalizarTexto(nombre);
        if (!this.tieneTextoVisible(nombre))
            return false;

        return normalizado !== 'no vuela'
            && normalizado !== 'sin vuelo'
            && normalizado !== 'no tiene vuelo';
    }

    tieneTipoDadoVisible(): boolean {
        const nombre = `${this.plantillaData?.Tipo_dado?.Nombre ?? ''}`;
        const normalizado = normalizarTexto(nombre);
        if (!this.tieneTextoVisible(nombre))
            return false;

        // Regla de negocio: "Elegir" en tipo de dado implica que la plantilla no modifica el dado de golpe.
        return normalizado !== 'elegir'
            && normalizado !== 'a elegir'
            && normalizado !== 'elige';
    }

    getDgsOtorgadosPlantilla(): number {
        return toNumber(this.plantillaData?.Licantronia_dg?.Multiplicador);
    }

    getMultiplicadorDgsPlantilla(): number {
        return toNumber(this.plantillaData?.Licantronia_dg?.Multiplicador);
    }

    getSumaPgsPlantilla(): number {
        return toNumber(this.plantillaData?.Licantronia_dg?.Suma);
    }

    getDadoDgsPlantilla(): string {
        const dado = `${this.plantillaData?.Licantronia_dg?.Dado ?? ''}`.trim();
        return this.tieneTextoVisible(dado) ? dado : '-';
    }

    tieneBloqueDgsPlantilla(): boolean {
        return this.getDgsOtorgadosPlantilla() > 0
            || this.getSumaPgsPlantilla() !== 0
            || this.getDadoDgsPlantilla() !== '-';
    }

    getCambiosCombateNumericos(): CambioNumerico[] {
        return [
            { etiqueta: 'Ataque base', valor: toNumber(this.plantillaData?.Ataque_base) },
            { etiqueta: 'Iniciativa', valor: toNumber(this.plantillaData?.Iniciativa) },
            { etiqueta: 'Presa', valor: toNumber(this.plantillaData?.Presa) },
            { etiqueta: 'Fortaleza', valor: toNumber(this.plantillaData?.Fortaleza) },
            { etiqueta: 'Reflejos', valor: toNumber(this.plantillaData?.Reflejos) },
            { etiqueta: 'Voluntad', valor: toNumber(this.plantillaData?.Voluntad) },
        ].filter(c => c.valor !== 0);
    }

    getCambiosCombateTexto(): CambioTexto[] {
        const cambios: CambioTexto[] = [
            { etiqueta: 'CA', valor: `${this.plantillaData?.Ca ?? ''}` },
            { etiqueta: 'Reducción de daño', valor: `${this.plantillaData?.Reduccion_dano ?? ''}` },
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
            { etiqueta: 'Fue', valor: toNumber(mod.Fuerza) },
            { etiqueta: 'Des', valor: toNumber(mod.Destreza) },
            { etiqueta: 'Con', valor: toNumber(mod.Constitucion) },
            { etiqueta: 'Int', valor: toNumber(mod.Inteligencia) },
            { etiqueta: 'Sab', valor: toNumber(mod.Sabiduria) },
            { etiqueta: 'Car', valor: toNumber(mod.Carisma) },
        ].filter(c => c.valor !== 0);
    }

    getMinimosCaracteristicasVisibles(): CambioNumerico[] {
        const min = this.plantillaData?.Minimos_caracteristicas;
        if (!min)
            return [];

        return [
            { etiqueta: 'Fue', valor: toNumber(min.Fuerza) },
            { etiqueta: 'Des', valor: toNumber(min.Destreza) },
            { etiqueta: 'Con', valor: toNumber(min.Constitucion) },
            { etiqueta: 'Int', valor: toNumber(min.Inteligencia) },
            { etiqueta: 'Sab', valor: toNumber(min.Sabiduria) },
            { etiqueta: 'Car', valor: toNumber(min.Carisma) },
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
            .filter(([clave]) => !esCampoId(clave) && !this.esCampoTecnicoPrerrequisito(clave))
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
                if (normalizarTexto(tipoNuevoRaw) === 'cualquiera') {
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
        const valor = toNumber(raw);
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
                valor: extraerValorSimple(valor),
            };
        }

        if (base === 'tiponuevo' || base === 'tiponuevotipo' || base === 'tiporesultante') {
            const tipoNuevo = extraerValorSimple(valor);
            if (normalizarTexto(tipoNuevo) === 'cualquiera') {
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
            const n = Number(extraerValorSimple(valor));
            return {
                etiqueta: 'Rangos',
                valor: Number.isFinite(n) && n > 0 ? `>= ${n}` : `${formatearValor(valor)}`,
            };
        }

        if (base === 'extra' || base === 'extras') {
            return {
                etiqueta: 'Extra',
                valor: extraVisibleDesdeRegistro(item, valor),
            };
        }

        if (base.includes('habilidad')) {
            return {
                etiqueta: 'Habilidad',
                valor: this.formatearHabilidadPrerrequisito(valor, item),
            };
        }

        return {
            etiqueta: formatearClave(clave),
            valor: formatearValor(valor),
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
            const valor = extraerValorSimple(candidato);
            if (this.tieneTextoVisible(valor))
                return valor;
        }

        return 'No cambia';
    }

    private formatearHabilidadPrerrequisito(valor: unknown, item: Record<string, any>): string {
        const habilidad = extraerValorSimple(valor);
        const extra = extraVisibleDesdeRegistro(
            item,
            item?.['Extra'] ?? item?.['extra'] ?? item?.['Extras'] ?? item?.['extras'],
        );
        const matchSaberGenerico = /^saber\s*\d+$/i.test(habilidad);
        if (matchSaberGenerico && this.tieneTextoVisible(extra))
            return 'Saber';
        return habilidad;
    }

}
