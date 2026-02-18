import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IdiomaDetalle } from 'src/app/interfaces/idioma';
import { RacialDetalle, RacialReferencia } from 'src/app/interfaces/racial';
import { Raza, RazaHabilidadBase, RazaHabilidadCustom } from 'src/app/interfaces/raza';
import { SubtipoRef } from 'src/app/interfaces/subtipo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { resolverExtraHabilidadVisible } from 'src/app/services/utils/habilidad-extra-visible';
import { getGrupoOpcionalRacial } from 'src/app/services/utils/racial-opcionales';

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
    Tiene_id_extra: boolean;
    Soporta_extra: boolean;
    Cantidad: number;
    Varios: string;
}

@Component({
    selector: 'app-detalles-raza',
    templateUrl: './detalles-raza.component.html',
    styleUrls: ['./detalles-raza.component.sass']
})
export class DetallesRazaComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    @Input() raza!: Raza;

    @Output() racialDetallesPorNombre: EventEmitter<RacialReferencia> = new EventEmitter<RacialReferencia>();
    @Output() subtipoDetalles: EventEmitter<{ Id?: number | null; Nombre: string; }> = new EventEmitter<{ Id?: number | null; Nombre: string; }>();

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
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
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
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
    }

    getIdiomasOtorgados(): IdiomaDetalle[] {
        const vistos = new Set<string>();
        return (this.raza?.Idiomas ?? [])
            .filter(idioma => this.tieneTextoVisible(idioma?.Nombre))
            .filter((idioma) => {
                const key = idioma.Nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
                if (!key || vistos.has(key))
                    return false;
                vistos.add(key);
                return true;
            })
            .sort((a, b) => a.Nombre.localeCompare(b.Nombre, 'es', { sensitivity: 'base' }));
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
            soportaExtra: habilidad?.Soporta_extra,
            allowIdZeroAsChoose: habilidad?.Tiene_id_extra === true,
        });
    }

    getAlineamientoResumen(): string {
        const alineamiento = this.raza?.Alineamiento;
        if (!alineamiento)
            return '';

        const basico = `${alineamiento?.Basico?.Nombre ?? ''}`.trim();
        const ley = `${alineamiento?.Ley?.Nombre ?? ''}`.trim();
        const moral = `${alineamiento?.Moral?.Nombre ?? ''}`.trim();

        const partesEje: string[] = [];
        if (this.tieneTextoVisible(ley))
            partesEje.push(ley);
        if (this.tieneTextoVisible(moral))
            partesEje.push(moral);
        const resumenEjes = partesEje.join('/');

        if (this.tieneTextoVisible(basico) && resumenEjes.length > 0)
            return `${basico} (${resumenEjes})`;
        if (this.tieneTextoVisible(basico))
            return basico;
        if (resumenEjes.length > 0)
            return resumenEjes;
        return '';
    }

    tieneAlineamientoVisible(): boolean {
        return this.getAlineamientoResumen().length > 0;
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

    tieneNumeroNoCero(valor: number | string | null | undefined): boolean {
        const parsed = Number(valor);
        return Number.isFinite(parsed) && Math.abs(parsed) > 0.0001;
    }

    trackByGrupoRacial(_index: number, grupo: GrupoRacialesDetalle): number {
        return Number(grupo.grupo);
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
            const soportaExtraRaw = (raw as any)?.Soporta_extra ?? (raw as any)?.soporta_extra;
            const soportaExtra = soportaExtraRaw === true || soportaExtraRaw === 1 || soportaExtraRaw === '1';
            const varios = `${(raw as any)?.Varios ?? (raw as any)?.varios ?? ''}`.trim();
            const key = idHabilidad > 0
                ? `id:${idHabilidad}`
                : `n:${nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()}`;

            const existente = acumulado.get(key);
            if (!existente) {
                acumulado.set(key, {
                    Id_habilidad: idHabilidad,
                    Habilidad: nombre.length > 0 ? nombre : `Habilidad ${idHabilidad}`,
                    Id_extra: idExtra,
                    Extra: extra,
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
            .sort((a, b) => a.Habilidad.localeCompare(b.Habilidad, 'es', { sensitivity: 'base' }));
    }
}
