import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Dote } from 'src/app/interfaces/dote';
import { DoteContexto, DoteContextual } from 'src/app/interfaces/dote-contextual';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';

interface PrerrequisitoCampoDetalle {
    etiqueta: string;
    valor: string;
}

interface PrerrequisitoCondicionDetalle {
    key: string;
    familiaEtiqueta: string;
    item: Record<string, any>;
    campos: PrerrequisitoCampoDetalle[];
}

interface PrerrequisitoGrupoDetalle {
    titulo: string;
    descripcion: string;
    opcional: boolean;
    condiciones: PrerrequisitoCondicionDetalle[];
}

@Component({
    selector: 'app-detalles-dote',
    templateUrl: './detalles-dote.component.html',
    styleUrls: ['./detalles-dote.component.sass'],
    standalone: false
})
export class DetallesDoteComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    doteData!: Dote;
    contexto?: DoteContexto;
    private readonly etiquetasPrerrequisitos: Record<string, string> = {
        actitud_prohibido: 'No tener esta actitud',
        actitud_requerido: 'Tener esta actitud',
        alineamiento_prohibido: 'No tener este alineamiento',
        alineamiento_requerido: 'Tener este alineamiento',
        ataque_base: 'Tener este ataque base mínimo',
        caracteristica: 'Tener esta característica mínima',
        clase: 'Tener niveles en esta clase',
        clase_especial: 'Tener este especial de clase',
        competencia_arma: 'Tener competencia con esta arma',
        competencia_armadura: 'Tener competencia con esta armadura',
        competencia_grupo_arma: 'Tener competencia con este grupo de armas',
        competencia_grupo_armadura: 'Tener competencia con este grupo de armaduras',
        conjuros_escuela: 'Conocer conjuros de esta escuela',
        dg: 'Tener estos DG mínimos',
        dominio: 'Tener este dominio',
        dote: 'Tener esta dote',
        escuela: 'Pertenecer a esta escuela',
        escuela_nivel: 'Poder lanzar conjuros de esta escuela',
        habilidad: 'Tener estos rangos en habilidad',
        idioma: 'Hablar este idioma',
        inherente: 'Tener este rasgo inherente',
        lanz_espontaneo: 'Poder lanzar espontáneamente este conjuro',
        lanzador_arcano: 'Tener este nivel de lanzador arcano',
        lanzador_divino: 'Tener este nivel de lanzador divino',
        lanzador_psionico: 'Tener este nivel de manifestador',
        lanzar_conjuros_arcanos_nivel: 'Poder lanzar conjuros arcanos de este nivel',
        lanzar_conjuros_divinos_nivel: 'Poder lanzar conjuros divinos de este nivel',
        limite_tipo_dote: 'No superar este límite de dotes de este tipo',
        nivel: 'Tener este nivel de personaje',
        nivel_de_clase: 'Tener este nivel de clase',
        nivel_max: 'No superar este nivel de personaje',
        poder_seleccionar_companero: 'Poder elegir un compañero nuevo',
        poder_seleccionar_familiar: 'Poder elegir un familiar nuevo',
        raza: 'Ser de esta raza',
        region: 'Ser de esta región',
        salvacion_minimo: 'Tener esta salvación mínima',
        tamano_maximo: 'Ser como máximo de este tamaño',
        tamano_minimo: 'Ser como mínimo de este tamaño',
        tipo_criatura: 'Ser de este tipo de criatura',
        tipo_dote: 'Tener una dote de este tipo',
    };

    @Input()
    set dote(value: Dote | DoteContextual) {
        if ((value as DoteContextual)?.Dote) {
            this.doteData = (value as DoteContextual).Dote;
            this.contexto = (value as DoteContextual).Contexto;
            return;
        }
        this.doteData = value as Dote;
        this.contexto = undefined;
    }

    abrirDetalleManual() {
        this.manualDetalleNavSvc.abrirDetalleManual({
            id: this.doteData?.Manual?.Id,
            nombre: this.doteData?.Manual?.Nombre,
        });
    }

    getTipos(): string {
        return this.doteData?.Tipos?.map(t => t.Nombre).join(', ') ?? '';
    }

    @Output() armaDetallesId: EventEmitter<number> = new EventEmitter<number>();
    @Output() armaduraDetallesId: EventEmitter<number> = new EventEmitter<number>();

    getModificadoresActivos(): { clave: string, valor: number }[] {
        if (!this.doteData?.Modificadores)
            return [];
        return Object.entries(this.doteData.Modificadores)
            .filter(([, value]) => value !== 0)
            .map(([clave, valor]) => ({ clave, valor }));
    }

    getPrerrequisitosConDatos(): string[] {
        if (!this.doteData?.Prerrequisitos)
            return [];
        return Object.keys(this.doteData.Prerrequisitos)
            .filter(key => key !== 'inherente')
            .filter(key => Array.isArray(this.doteData.Prerrequisitos[key]) && this.doteData.Prerrequisitos[key].length > 0);
    }

    getEtiquetaPrerrequisito(key: string): string {
        return this.etiquetasPrerrequisitos[key] ?? this.formatearTexto(key);
    }

    getPrerrequisitosAgrupados(): PrerrequisitoGrupoDetalle[] {
        if (!this.doteData?.Prerrequisitos)
            return [];

        const condiciones: Array<{ opcional: number; condicion: PrerrequisitoCondicionDetalle; }> = [];
        this.getPrerrequisitosConDatos().forEach((key) => {
            const items = Array.isArray(this.doteData?.Prerrequisitos?.[key]) ? this.doteData.Prerrequisitos[key] : [];
            const familiaEtiqueta = this.getEtiquetaPrerrequisito(key);

            items.forEach((item: Record<string, any>) => {
                let campos = this.getCamposPrerrequisito(item, key);
                if (campos.length < 1 && this.esPrerrequisitoFlagOnly(key)) {
                    campos = [{
                        etiqueta: 'Requisito',
                        valor: familiaEtiqueta,
                    }];
                }
                if (campos.length < 1)
                    return;

                condiciones.push({
                    opcional: this.getOpcional(item),
                    condicion: {
                        key,
                        familiaEtiqueta,
                        item,
                        campos,
                    },
                });
            });
        });

        if (condiciones.length < 1)
            return [];

        const grupos: PrerrequisitoGrupoDetalle[] = [];
        const obligatorias = condiciones.filter((entry) => entry.opcional === 0).map((entry) => entry.condicion);
        if (obligatorias.length > 0) {
            grupos.push({
                titulo: 'Obligatorios',
                descripcion: 'Se deben cumplir todos',
                opcional: false,
                condiciones: obligatorias,
            });
        }

        const opcionalesMap = new Map<number, PrerrequisitoCondicionDetalle[]>();
        condiciones
            .filter((entry) => entry.opcional > 0)
            .forEach((entry) => {
                if (!opcionalesMap.has(entry.opcional))
                    opcionalesMap.set(entry.opcional, []);
                opcionalesMap.get(entry.opcional)?.push(entry.condicion);
            });

        Array.from(opcionalesMap.keys())
            .sort((a, b) => a - b)
            .forEach((grupoOpcional, index) => {
                grupos.push({
                    titulo: this.getEtiquetaGrupoEleccion(index),
                    descripcion: 'Basta con una de estas opciones',
                    opcional: true,
                    condiciones: opcionalesMap.get(grupoOpcional) ?? [],
                });
            });

        return grupos.filter((grupo) => grupo.condiciones.length > 0);
    }

    getCamposPrerrequisito(item: any, prerequisiteKey: string = ''): PrerrequisitoCampoDetalle[] {
        if (!item || typeof item !== 'object')
            return [];

        return Object.entries(item)
            .filter(([clave]) => !this.esCampoId(clave) && !this.esCampoTecnicoPrerrequisito(clave))
            .filter(([, valor]) => this.tieneValorMostrable(valor))
            .map(([clave, valor]) => ({
                etiqueta: this.getEtiquetaCampoPrerrequisito(prerequisiteKey, clave),
                valor: this.formatearValorPrerrequisito(valor)
            }))
            .filter((campo) => !this.esCampoExtraSinValor(campo))
            .filter(campo => campo.valor.trim().length > 0);
    }

    getTextosCondicionPrerrequisito(condicion: PrerrequisitoCondicionDetalle): string[] {
        const key = this.normalizar(condicion?.key ?? '').replace(/[_\s]/g, '');
        const campos = Array.isArray(condicion?.campos) ? condicion.campos : [];

        if (key === 'ataquebase')
            return this.composePrimaryAndRemaining(this.getCampoValor(campos, ['Ataque base']), campos, ['Ataque base']);

        if (key === 'caracteristica') {
            const caracteristica = this.getCampoValor(campos, ['Caracteristica']);
            const cantidad = this.getCampoValor(campos, ['Cantidad']);
            const principal = caracteristica && cantidad ? `${caracteristica} ${cantidad}` : '';
            return this.composePrimaryAndRemaining(principal, campos, ['Caracteristica', 'Cantidad']);
        }

        if (key === 'dote')
            return this.composePrimaryAndRemaining(this.getCampoValor(campos, ['Dote prerrequisito', 'Dote', 'Nombre']), campos, ['Dote prerrequisito', 'Dote', 'Nombre']);

        if (key === 'claseespecial')
            return this.composePrimaryAndRemaining(this.getCampoValor(campos, ['Especial de clase', 'Especial', 'Clase especial']), campos, ['Especial de clase', 'Especial', 'Clase especial']);

        if (key === 'habilidad') {
            const habilidad = this.getCampoValor(campos, ['Habilidad']);
            const rangos = this.getCampoValor(campos, ['Rangos']);
            const principal = habilidad && rangos ? `${habilidad} ${rangos} rangos` : '';
            return this.composePrimaryAndRemaining(principal, campos, ['Habilidad', 'Rangos']);
        }

        if (key === 'niveldeclase') {
            const clase = this.getCampoValor(campos, ['Clase']);
            const nivel = this.getCampoValor(campos, ['Nivel']);
            const principal = clase && nivel ? `${clase} ${nivel}` : '';
            return this.composePrimaryAndRemaining(principal, campos, ['Clase', 'Nivel']);
        }

        if (key === 'conjurosescuela') {
            const escuela = this.getCampoValor(campos, ['Escuela']);
            const cantidad = this.getCampoValor(campos, ['Cantidad']);
            const principal = escuela && cantidad ? `${escuela} ${cantidad} conjuros` : '';
            return this.composePrimaryAndRemaining(principal, campos, ['Escuela', 'Cantidad']);
        }

        if (key === 'escuelanivel') {
            const escuela = this.getCampoValor(campos, ['Escuela']);
            const nivel = this.getCampoValor(campos, ['Nivel']);
            const principal = escuela && nivel ? `${escuela} nivel ${nivel}` : '';
            return this.composePrimaryAndRemaining(principal, campos, ['Escuela', 'Nivel']);
        }

        if (key === 'salvacionminimo') {
            const salvacion = this.getCampoValor(campos, ['Salvacion', 'Salvación']);
            const puntuacion = this.getCampoValor(campos, ['Puntuacion minima', 'Puntuación mínima', 'Cantidad']);
            const principal = salvacion && puntuacion ? `${salvacion} ${puntuacion}` : '';
            return this.composePrimaryAndRemaining(principal, campos, ['Salvacion', 'Salvación', 'Puntuacion minima', 'Puntuación mínima', 'Cantidad']);
        }

        if (key === 'limitetipodote') {
            const tipo = this.getCampoValor(campos, ['Tipo dote', 'Tipo']);
            const cantidad = this.getCampoValor(campos, ['Cantidad maxima', 'Cantidad máxima', 'Cantidad']);
            const principal = tipo && cantidad ? `${tipo} ${cantidad}` : '';
            return this.composePrimaryAndRemaining(principal, campos, ['Tipo dote', 'Tipo', 'Cantidad maxima', 'Cantidad máxima', 'Cantidad']);
        }

        if (key === 'poderseleccionarcompanero' || key === 'poderseleccionarfamiliar')
            return [condicion.familiaEtiqueta];

        if ([
            'clase',
            'competenciaarma',
            'competenciaarmadura',
            'competenciagrupoarma',
            'competenciagrupoarmadura',
            'dominio',
            'escuela',
            'idioma',
            'raza',
            'region',
            'tipocriatura',
            'tipodote',
            'tamonomaximo',
            'tamanominimo',
            'actitudrequerido',
            'actitudprohibido',
            'alineamientorequerido',
            'alineamientoprohibido',
            'lanzespontaneo',
            'inherente',
        ].includes(key))
            return this.composePrimaryAndRemaining(this.getCampoPrincipal(campos), campos, [this.getEtiquetaCampoPrincipal(campos)]);

        if ([
            'dg',
            'nivel',
            'nivelmax',
            'lanzadorarcano',
            'lanzadordivino',
            'lanzadorpsionico',
            'lanzarconjurosarcanosnivel',
            'lanzarconjurosdivinosnivel',
        ].includes(key))
            return this.composePrimaryAndRemaining(this.getCampoPrincipal(campos), campos, [this.getEtiquetaCampoPrincipal(campos)]);

        return this.getCamposComoTexto(campos);
    }

    private tieneValorMostrable(valor: unknown): boolean {
        if (valor === null || valor === undefined)
            return false;
        if (typeof valor === 'string')
            return valor.trim().length > 0;
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

    private esPrerrequisitoFlagOnly(key: string): boolean {
        const normalizada = this.normalizar(key).replace(/[_\s]/g, '');
        return normalizada === 'poderseleccionarcompanero'
            || normalizada === 'poderseleccionarfamiliar';
    }

    private formatearValorPrerrequisito(valor: unknown): string {
        if (typeof valor === 'boolean')
            return valor ? 'Si' : 'No';
        if (typeof valor === 'number' || typeof valor === 'string')
            return `${valor}`;
        if (Array.isArray(valor))
            return valor.map(v => this.formatearValorPrerrequisito(v)).filter(v => v.trim().length > 0).join(', ');
        if (valor && typeof valor === 'object') {
            return Object.entries(valor as Record<string, unknown>)
                .filter(([k]) => !this.esCampoId(k))
                .map(([k, v]) => `${this.formatearTexto(k)}: ${this.formatearValorPrerrequisito(v)}`)
                .filter(v => v.trim().length > 0)
                .join(' | ');
        }
        return '-';
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
        const valor = Math.trunc(Number(raw));
        return Number.isFinite(valor) && valor > 0 ? valor : 0;
    }

    private getEtiquetaGrupoEleccion(index: number): string {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (index >= 0 && index < letters.length)
            return `Eleccion ${letters[index]}`;
        return `Eleccion ${index + 1}`;
    }

    private formatearTexto(texto: string): string {
        if (!texto)
            return '';
        const normalizado = texto.replace(/_/g, ' ').trim();
        return normalizado.charAt(0).toUpperCase() + normalizado.slice(1);
    }

    private esCampoExtraSinValor(campo: PrerrequisitoCampoDetalle): boolean {
        if (this.normalizar(`${campo?.etiqueta ?? ''}`) !== 'extra')
            return false;

        const valor = this.normalizar(`${campo?.valor ?? ''}`);
        return valor === 'nada'
            || valor === 'no aplica'
            || valor === 'noaplica'
            || valor === 'ninguno'
            || valor === 'ninguna'
            || valor === 'sin extra';
    }

    private getEtiquetaCampoPrerrequisito(prerequisiteKey: string, fieldKey: string): string {
        const tipo = this.normalizar(prerequisiteKey).replace(/[_\s]/g, '');
        const campo = this.normalizar(fieldKey).replace(/[_\s]/g, '');

        if (tipo === 'claseespecial' && (campo === 'especial' || campo === 'claseespecial'))
            return 'Especial de clase';

        return this.formatearTexto(fieldKey);
    }

    private getCampoValor(campos: PrerrequisitoCampoDetalle[], etiquetas: string[]): string {
        const normalizadas = etiquetas.map((etiqueta) => this.normalizar(etiqueta).replace(/[_\s]/g, ''));
        const encontrado = campos.find((campo) => normalizadas.includes(this.normalizar(campo.etiqueta).replace(/[_\s]/g, '')));
        return `${encontrado?.valor ?? ''}`.trim();
    }

    private getEtiquetaCampoPrincipal(campos: PrerrequisitoCampoDetalle[]): string {
        return `${campos[0]?.etiqueta ?? ''}`.trim();
    }

    private getCampoPrincipal(campos: PrerrequisitoCampoDetalle[]): string {
        return `${campos[0]?.valor ?? ''}`.trim();
    }

    private composePrimaryAndRemaining(primary: string, campos: PrerrequisitoCampoDetalle[], omitLabels: string[]): string[] {
        const chips = primary.trim().length > 0 ? [primary.trim()] : [];
        return [...chips, ...this.getCamposRestantesComoTexto(campos, omitLabels)];
    }

    private getCamposRestantesComoTexto(campos: PrerrequisitoCampoDetalle[], omitLabels: string[]): string[] {
        const omitidos = omitLabels
            .map((label) => this.normalizar(label).replace(/[_\s]/g, ''))
            .filter((label) => label.length > 0);

        return campos
            .filter((campo) => !omitidos.includes(this.normalizar(campo.etiqueta).replace(/[_\s]/g, '')))
            .map((campo) => `${campo.etiqueta}: ${campo.valor}`);
    }

    private getCamposComoTexto(campos: PrerrequisitoCampoDetalle[]): string[] {
        return campos.map((campo) => `${campo.etiqueta}: ${campo.valor}`);
    }

    private normalizar(texto: string): string {
        return `${texto ?? ''}`
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim()
            .toLowerCase();
    }

    getExtrasDisponibles(): { nombre: string, items: { Id: number, Nombre: string }[] }[] {
        if (!this.doteData?.Extras_disponibles)
            return [];
        const activas = new Set(this.getExtrasSoportadosActivos().map(extra => extra.nombre));
        const armaduras = this.doteData.Extras_disponibles.Armaduras ?? [];
        return [
            { nombre: 'Armas', items: this.doteData.Extras_disponibles.Armas ?? [] },
            { nombre: 'Armaduras', items: armaduras.filter((item: any) => !item?.Es_escudo) },
            { nombre: 'Escudos', items: armaduras.filter((item: any) => !!item?.Es_escudo) },
            { nombre: 'Escuelas', items: this.doteData.Extras_disponibles.Escuelas ?? [] },
            { nombre: 'Habilidades', items: this.doteData.Extras_disponibles.Habilidades ?? [] },
        ].filter(bloque => activas.has(bloque.nombre) && bloque.items.length > 0);
    }

    bloqueExtraRequiereCompetencia(nombreBloque: string): boolean {
        if (!this.doteData?.Comp_arma)
            return false;
        return nombreBloque === 'Armas' || nombreBloque === 'Escudos';
    }

    esExtraNavegable(nombreBloque: string): boolean {
        return nombreBloque === 'Armas' || nombreBloque === 'Armaduras' || nombreBloque === 'Escudos';
    }

    abrirDetalleExtra(nombreBloque: string, item: { Id: number, Nombre: string }): void {
        const id = Number(item?.Id ?? 0);
        if (!this.esExtraNavegable(nombreBloque) || !Number.isFinite(id) || id <= 0)
            return;
        if (nombreBloque === 'Armas') {
            this.armaDetallesId.emit(id);
            return;
        }
        this.armaduraDetallesId.emit(id);
    }

    getExtrasSoportadosActivos(): { nombre: string, activo: boolean }[] {
        if (!this.doteData?.Extras_soportados)
            return [];
        return [
            { nombre: 'Armas', activo: !!this.doteData.Extras_soportados.Extra_arma },
            {
                nombre: 'Armaduras',
                activo: !!(this.doteData.Extras_soportados.Extra_armadura_armaduras ?? this.doteData.Extras_soportados.Extra_armadura)
            },
            {
                nombre: 'Escudos',
                activo: !!(this.doteData.Extras_soportados.Extra_armadura_escudos ?? this.doteData.Extras_soportados.Extra_armadura)
            },
            { nombre: 'Escuelas', activo: !!this.doteData.Extras_soportados.Extra_escuela },
            { nombre: 'Habilidades', activo: !!this.doteData.Extras_soportados.Extra_habilidad },
        ].filter(extra => extra.activo);
    }

    tieneExtras(): boolean {
        return this.getExtrasSoportadosActivos().length > 0;
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
            && limpiado !== 'no modifica'
            && limpiado !== 'no vuela';
    }

    tienePrerrequisitoNavegable(key: string, item: unknown): boolean {
        if (key !== 'competencia_arma' && key !== 'competencia_armadura')
            return false;
        return this.getIdPrerrequisito(item) > 0;
    }

    abrirDetallePrerrequisito(key: string, item: unknown): void {
        const id = this.getIdPrerrequisito(item);
        if (id <= 0)
            return;
        if (key === 'competencia_arma') {
            this.armaDetallesId.emit(id);
            return;
        }
        if (key === 'competencia_armadura')
            this.armaduraDetallesId.emit(id);
    }

    getOrigenContexto(): string {
        if (!this.contexto || this.contexto.Entidad !== 'personaje')
            return '';
        return this.contexto.Origen?.trim() ?? '';
    }

    private getIdPrerrequisito(item: unknown): number {
        if (!item || typeof item !== 'object')
            return 0;
        const valores = Object.entries(item as Record<string, unknown>)
            .filter(([clave]) => this.esCampoId(clave))
            .map(([, valor]) => Number(valor))
            .filter((valor) => Number.isFinite(valor) && valor > 0);
        return valores[0] ?? 0;
    }
}
