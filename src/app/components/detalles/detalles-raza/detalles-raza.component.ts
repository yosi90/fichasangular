import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatoFicha, unirTipo } from 'src/app/components/detalles/ficha';
import { IdiomaDetalle } from 'src/app/interfaces/idioma';
import { RacialDetalle, RacialReferencia } from 'src/app/interfaces/racial';
import { Raza, RazaHabilidadBase, RazaHabilidadCustom } from 'src/app/interfaces/raza';
import { SubtipoRef } from 'src/app/interfaces/subtipo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { resolverExtraHabilidadVisible } from 'src/app/services/utils/habilidad-extra-visible';
import { textoConSigno } from 'src/app/services/utils/equipo-texto';
import { mayusculaInicial } from 'src/app/services/utils/formato-registros';
import { buildManiobrabilidadInfoSecciones, tieneManiobrabilidadVisible } from 'src/app/services/utils/maniobrabilidad-info';
import { getGrupoOpcionalRacial } from 'src/app/services/utils/racial-opcionales';
import { normalizarTexto, toBoolean } from 'src/app/services/utils/normalizacion';
import { tieneNumeroVisible, tieneTextoVisible } from 'src/app/services/utils/texto-visible';
import { compararTexto, porNombre } from 'src/app/services/utils/orden-texto';
import { Comodin } from 'src/app/interfaces/comodin';
import { leerComodin } from 'src/app/services/utils/comodin';

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

@Component({
    selector: 'app-detalles-raza',
    templateUrl: './detalles-raza.component.html',
    styleUrls: ['./detalles-raza.component.sass'],
    standalone: false
})
export class DetallesRazaComponent {
    constructor(private manualDetalleNavSvc: ManualDetalleNavigationService) { }

    private razaActual!: Raza;
    mostrarInfoManiobrabilidad = false;

    /** «Raza · Mediano · Humanoide». */
    tipoCabecera = '';
    /** Los datos clave, en el orden del manual. Lo que la API da `null` o 0 no sale. */
    datos: DatoFicha[] = [];
    /** Los dados de golpe raciales y lo que dan, si la raza los tiene. */
    datosDgs: DatoFicha[] = [];
    modificadores: ParRaza[] = [];
    edades: ParRaza[] = [];
    subtipos: SubtipoRef[] = [];
    habilidadesBase: HabilidadRazaVisible[] = [];
    habilidadesCustom: HabilidadRazaVisible[] = [];
    idiomas: IdiomaDetalle[] = [];
    gruposRaciales: GrupoRacialesDetalle[] = [];
    /** Si alguna sortílega tiene dados de golpe mínimos o descripción (si no, la tabla no lleva esas columnas). */
    sortilegasConDgs = false;
    sortilegasConDescripcion = false;

    @Input()
    set raza(value: Raza) {
        this.razaActual = value;
        this.tipoCabecera = unirTipo(['Raza', value?.Tamano?.Nombre, value?.Tipo_criatura?.Nombre]);
        this.datos = this.construirDatos();
        this.datosDgs = this.construirDatosDgs();
        this.modificadores = this.construirModificadores();
        this.edades = this.construirEdades();
        this.subtipos = this.getSubtiposActivos();
        this.habilidadesBase = this.getHabilidadesBaseOtorgadas();
        this.habilidadesCustom = this.getHabilidadesCustomOtorgadas();
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

    trackByGrupoRacial(_index: number, grupo: GrupoRacialesDetalle): number {
        return Number(grupo.grupo);
    }

    private construirDatos(): DatoFicha[] {
        const r = this.raza;
        return [
            { etiqueta: 'Ajuste de nivel', valor: tieneNumeroVisible(r?.Ajuste_nivel) ? `+${r.Ajuste_nivel}` : null },
            { etiqueta: 'Clase predilecta', valor: mayusculaInicial(r?.Clase_predilecta) },
            { etiqueta: 'Alineamiento', valor: this.getAlineamientoResumen() },
            { etiqueta: 'Altura', valor: this.textoRango(r?.Altura_rango_inf, r?.Altura_rango_sup, 'm') },
            { etiqueta: 'Peso', valor: this.textoRango(r?.Peso_rango_inf, r?.Peso_rango_sup, 'kg') },
            { etiqueta: 'Espacio', valor: this.textoPies(r?.Espacio) },
            { etiqueta: 'Alcance', valor: this.textoPies(r?.Alcance) },
            { etiqueta: 'Correr', valor: this.textoPies(r?.Correr) },
            { etiqueta: 'Nadar', valor: this.textoPies(r?.Nadar) },
            { etiqueta: 'Volar', valor: this.textoPies(r?.Volar) },
            {
                etiqueta: 'Maniobrabilidad',
                valor: this.mostrarManiobrabilidad() ? r.Maniobrabilidad.Nombre : null,
                ayuda: 'Reglas de maniobrabilidad',
                alPulsar: () => this.abrirInfoManiobrabilidad(),
            },
            { etiqueta: 'Trepar', valor: this.textoPies(r?.Trepar) },
            { etiqueta: 'Escalar', valor: this.textoPies(r?.Escalar) },
            { etiqueta: 'Armadura natural', valor: this.tieneNumeroNoCero(r?.Armadura_natural) ? textoConSigno(Number(r.Armadura_natural)) : null },
            { etiqueta: 'CA varios', valor: this.tieneNumeroNoCero(r?.Varios_armadura) ? textoConSigno(Number(r.Varios_armadura)) : null },
        ];
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

    /** Los modificadores de característica distintos de 0, con signo. */
    private construirModificadores(): ParRaza[] {
        const m = this.raza?.Modificadores;
        return [
            { nombre: 'Fuerza', valor: m?.Fuerza },
            { nombre: 'Destreza', valor: m?.Destreza },
            { nombre: 'Constitución', valor: m?.Constitucion },
            { nombre: 'Inteligencia', valor: m?.Inteligencia },
            { nombre: 'Sabiduría', valor: m?.Sabiduria },
            { nombre: 'Carisma', valor: m?.Carisma },
        ]
            .filter((item) => this.tieneNumeroNoCero(item.valor))
            .map((item) => ({ nombre: item.nombre, valor: textoConSigno(Number(item.valor)) }));
    }

    private construirEdades(): ParRaza[] {
        const r = this.raza;
        return [
            { nombre: 'Adulto', valor: r?.Edad_adulto },
            { nombre: 'Mediana', valor: r?.Edad_mediana },
            { nombre: 'Viejo', valor: r?.Edad_viejo },
            { nombre: 'Venerable', valor: r?.Edad_venerable },
        ]
            .filter((item) => tieneNumeroVisible(item.valor))
            .map((item) => ({ nombre: item.nombre, valor: `${item.valor} años` }));
    }

    /** «1.5 - 1.8 m»; sin ninguno de los dos extremos, nada. */
    private textoRango(inferior: number | null | undefined, superior: number | null | undefined, unidad: string): string | null {
        if (!tieneNumeroVisible(inferior) && !tieneNumeroVisible(superior))
            return null;
        return `${inferior ?? 0} - ${superior ?? 0} ${unidad}`;
    }

    /** «30'», o nada si no lo tiene. */
    private textoPies(valor: number | null | undefined): string | null {
        return tieneNumeroVisible(valor) ? `${valor}'` : null;
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
