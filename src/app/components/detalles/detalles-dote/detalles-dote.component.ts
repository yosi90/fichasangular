import { Component, Input } from '@angular/core';
import { Dote } from 'src/app/interfaces/dote';
import { DoteContexto, DoteContextual } from 'src/app/interfaces/dote-contextual';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';

@Component({
    selector: 'app-detalles-dote',
    templateUrl: './detalles-dote.component.html',
    styleUrls: ['./detalles-dote.component.sass']
})
export class DetallesDoteComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    doteData!: Dote;
    contexto?: DoteContexto;
    private readonly etiquetasPrerrequisitos: Record<string, string> = {
        ataque_base: 'Ataque base',
        caracteristica: 'Caracteristica',
        dote: 'Dote',
        clase: 'Clase',
        raza: 'Raza',
        tamano: 'Tamano',
        alineamiento: 'Alineamiento',
        competencia_arma: 'Competencia de arma',
        escuela: 'Escuela',
        habilidad: 'Habilidad',
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
            .filter(key => Array.isArray(this.doteData.Prerrequisitos[key]) && this.doteData.Prerrequisitos[key].length > 0);
    }

    getEtiquetaPrerrequisito(key: string): string {
        return this.etiquetasPrerrequisitos[key] ?? this.formatearTexto(key);
    }

    getCamposPrerrequisito(item: any): { etiqueta: string, valor: string }[] {
        if (!item || typeof item !== 'object')
            return [];

        return Object.entries(item)
            .filter(([clave]) => !this.esCampoId(clave))
            .filter(([, valor]) => this.tieneValorMostrable(valor))
            .map(([clave, valor]) => ({
                etiqueta: this.formatearTexto(clave),
                valor: this.formatearValorPrerrequisito(valor)
            }))
            .filter(campo => campo.valor.trim().length > 0);
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

    private formatearTexto(texto: string): string {
        if (!texto)
            return '';
        const normalizado = texto.replace(/_/g, ' ').trim();
        return normalizado.charAt(0).toUpperCase() + normalizado.slice(1);
    }

    getExtrasDisponibles(): { nombre: string, items: { Id: number, Nombre: string }[] }[] {
        if (!this.doteData?.Extras_disponibles)
            return [];
        const activas = new Set(this.getExtrasSoportadosActivos().map(extra => extra.nombre));
        return [
            { nombre: 'Armas', items: this.doteData.Extras_disponibles.Armas ?? [] },
            { nombre: 'Armaduras', items: this.doteData.Extras_disponibles.Armaduras ?? [] },
            { nombre: 'Escuelas', items: this.doteData.Extras_disponibles.Escuelas ?? [] },
            { nombre: 'Habilidades', items: this.doteData.Extras_disponibles.Habilidades ?? [] },
        ].filter(bloque => activas.has(bloque.nombre) && bloque.items.length > 0);
    }

    getExtrasSoportadosActivos(): { nombre: string, activo: boolean }[] {
        if (!this.doteData?.Extras_soportados)
            return [];
        return [
            { nombre: 'Armas', activo: !!this.doteData.Extras_soportados.Extra_arma },
            { nombre: 'Armaduras', activo: !!this.doteData.Extras_soportados.Extra_armadura },
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

    getOrigenContexto(): string {
        if (!this.contexto || this.contexto.Entidad !== 'personaje')
            return '';
        return this.contexto.Origen?.trim() ?? '';
    }
}
