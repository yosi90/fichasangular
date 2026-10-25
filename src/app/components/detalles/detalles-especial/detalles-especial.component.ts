import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatoFicha } from 'src/app/components/detalles/ficha';
import { Comodin } from 'src/app/interfaces/comodin';
import { EspecialClaseDetalle, EspecialExtraRef, EspecialHabilidadRef } from 'src/app/interfaces/especial';
import { resolverExtraHabilidadVisible } from 'src/app/services/utils/habilidad-extra-visible';
import { NOMBRES_CARACTERISTICAS } from 'src/app/services/utils/caracteristicas';
import { compararTexto } from 'src/app/services/utils/orden-texto';
import { tieneTextoVisible } from 'src/app/services/utils/texto-visible';

/** Cómo se enseñan las claves de `Bonificadores` que no se leen bien tal cual. */
const NOMBRE_BONIFICADOR: Readonly<Record<string, string>> = {
    ...NOMBRES_CARACTERISTICAS,
    Armadura_natural: 'Armadura natural',
};

/** Una habilidad del especial, ya lista para enseñar: «Saber (arcano)» con sus rangos. */
interface HabilidadVisible {
    nombre: string;
    extra: string;
    rangos: number;
}

@Component({
    selector: 'app-detalles-especial',
    templateUrl: './detalles-especial.component.html',
    standalone: false
})
export class DetallesEspecialComponent {
    private especialActual!: EspecialClaseDetalle;

    @Input()
    set especial(valor: EspecialClaseDetalle) {
        this.especialActual = valor;
        this.etiquetas = this.construirEtiquetas();
        this.datos = this.construirDatos();
        this.bonificadores = this.getBonificadoresActivos();
        this.flagsExtra = this.getFlagsExtraActivos();
        this.extras = this.getExtrasOrdenados();
        this.habilidades = this.getHabilidadesOrdenadas().map((habilidad) => ({
            nombre: habilidad.Habilidad,
            extra: this.getExtraVisibleHabilidad(habilidad),
            rangos: habilidad.Rangos,
        }));
    }
    get especial(): EspecialClaseDetalle {
        return this.especialActual;
    }

    @Output() subtipoDetalles: EventEmitter<{ Id?: number | null; Nombre: string; }> = new EventEmitter<{ Id?: number | null; Nombre: string; }>();

    /** Cómo se elige: usa extra, repetible… */
    etiquetas: string[] = [];
    datos: DatoFicha[] = [];
    bonificadores: { clave: string, valor: number }[] = [];
    flagsExtra: string[] = [];
    extras: EspecialExtraRef[] = [];
    habilidades: HabilidadVisible[] = [];

    readonly tieneTextoVisible = tieneTextoVisible;

    getBonificadoresActivos(): { clave: string, valor: number }[] {
        if (!this.especial?.Bonificadores)
            return [];
        return Object.entries(this.especial.Bonificadores)
            .filter(([, value]) => value !== 0)
            .map(([clave, valor]) => ({ clave: NOMBRE_BONIFICADOR[clave] ?? clave.replace(/_/g, ' '), valor }));
    }

    getFlagsExtraActivos(): string[] {
        if (!this.especial?.Flags_extra)
            return [];

        const flags = this.especial.Flags_extra;
        const activos: string[] = [];
        if (flags.Da_CA) activos.push('Da CA');
        if (flags.Da_armadura_natural) activos.push('Da armadura natural');
        if (flags.Da_RD) activos.push('Da RD');
        if (flags.Da_velocidad) activos.push('Da velocidad');
        return activos;
    }

    getExtrasOrdenados(): EspecialExtraRef[] {
        return [...(this.especial?.Extras ?? [])]
            .filter(extra => this.tieneTextoVisible(extra?.Extra))
            .sort((a, b) => Number(a.Orden ?? 0) - Number(b.Orden ?? 0));
    }

    getHabilidadesOrdenadas(): EspecialHabilidadRef[] {
        return [...(this.especial?.Habilidades ?? [])]
            .filter(habilidad => this.tieneTextoVisible(habilidad?.Habilidad))
            .sort((a, b) => compararTexto(a.Habilidad, b.Habilidad));
    }

    getExtraVisibleHabilidad(habilidad: { Id_extra?: number | null; Extra?: string; Extra_comodin?: Comodin | null; }): string {
        const hasIdExtra = Object.prototype.hasOwnProperty.call(habilidad ?? {}, 'Id_extra')
            || Object.prototype.hasOwnProperty.call(habilidad ?? {}, 'id_extra')
            || Object.prototype.hasOwnProperty.call(habilidad ?? {}, 'i_ex')
            || Object.prototype.hasOwnProperty.call(habilidad ?? {}, 'ie');

        return resolverExtraHabilidadVisible({
            extra: habilidad?.Extra,
            idExtra: habilidad?.Id_extra,
            extraComodin: habilidad?.Extra_comodin,
            soportaExtra: this.especial?.Extra || this.especial?.Activa_extra,
            allowIdZeroAsChoose: hasIdExtra,
        });
    }

    abrirDetalleSubtipo() {
        const nombre = `${this.especial?.Subtipo?.Nombre ?? ''}`.trim();
        if (!this.tieneTextoVisible(nombre))
            return;
        const id = Number(this.especial?.Subtipo?.Id);
        this.subtipoDetalles.emit({
            Id: Number.isFinite(id) && id > 0 ? id : null,
            Nombre: nombre,
        });
    }

    private construirEtiquetas(): string[] {
        const especial = this.especial;
        return [
            especial?.Extra ? 'Usa extra' : '',
            especial?.Activa_extra ? 'Activa extra' : '',
            especial?.Repetible ? 'Repetible' : '',
            especial?.Repite_mismo_extra ? 'Repite el mismo extra' : '',
            especial?.Repite_combinacion ? 'Repite combinación' : '',
        ].filter((etiqueta) => etiqueta.length > 0);
    }

    private construirDatos(): DatoFicha[] {
        const especial = this.especial;
        if (!especial)
            return [];
        return [
            { etiqueta: 'Característica', valor: (especial.Caracteristica?.Id ?? 0) > 0 ? especial.Caracteristica.Nombre : null },
            {
                etiqueta: 'Subtipo',
                valor: (especial.Subtipo?.Id ?? 0) > 0 ? especial.Subtipo.Nombre : null,
                alPulsar: () => this.abrirDetalleSubtipo(),
            },
        ];
    }
}
