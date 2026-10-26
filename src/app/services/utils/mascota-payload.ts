import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle, MonstruoHabilidad } from 'src/app/interfaces/monstruo';
import {
    PersonajeCreateCompaneroDto,
    PersonajeCreateFamiliarDto,
    PersonajeCreateHabilidadMascotaDto,
} from 'src/app/interfaces/personajes-api';
import { ID_EXTRA_HABILIDAD_SIN_EXTRA } from './habilidad-extra-visible';
import { primerEntero, toInt, toNumber } from './normalizacion';

/**
 * El familiar y el compañero animal de la creación, en la forma de `POST /personajes/add` (bloques `familiar` y
 * `companero`, que la API guarda como un familiar o un compañero propios con sus habilidades, dotes y especiales).
 *
 * Familiar (Manual del jugador, cap. 3, «Familiares»): la mitad de los puntos de golpe de su amo, el ataque base del amo,
 * en cada salvación la base mejor (la suya o la del amo) con sus modificadores, en cada habilidad los rangos mejores (los
 * suyos o los del amo), y por el nivel de las clases que le dan el familiar: ajuste de armadura natural, Inteligencia y,
 * desde el nivel 11, resistencia a conjuros de nivel + 5.
 */

const LONGITUD_NOMBRE_MASCOTA = 50;

export interface AmoDelFamiliar {
    /** Puntos de golpe del amo. */
    vida: number;
    /** Ataque base del amo (el primero, «+6/+1» → 6). */
    ataqueBase: number;
    /** Las salvaciones base del amo por sus clases. */
    salvacionesBase: { fortaleza: number; reflejos: number; voluntad: number; };
    /** Nivel de las clases que le dan el familiar. */
    nivelFamiliar: number;
    /** Las habilidades del amo, ya en la forma del contrato. */
    habilidades: PersonajeCreateHabilidadMascotaDto[];
}

export interface BonosFamiliarPorNivel {
    ajusteArmaduraNatural: number;
    inteligencia: number;
    resistenciaConjuros: number | null;
}

/** La tabla del familiar por nivel del amo (MJ, cap. 3): +1 a la armadura natural y +1 de Int cada dos niveles. */
export function bonosFamiliarPorNivel(nivelAmo: number): BonosFamiliarPorNivel {
    const nivel = Math.max(0, toInt(nivelAmo));
    const tramo = Math.ceil(nivel / 2);
    return {
        ajusteArmaduraNatural: tramo,
        inteligencia: nivel > 0 ? 5 + tramo : 0,
        resistenciaConjuros: nivel >= 11 ? nivel + 5 : null,
    };
}

function nombreMascota(nombre: unknown, porDefecto: string): string {
    const texto = `${nombre ?? ''}`.trim();
    return (texto.length > 0 ? texto : porDefecto).slice(0, LONGITUD_NOMBRE_MASCOTA);
}

function idMonstruo(mascota: FamiliarMonstruoDetalle | CompaneroMonstruoDetalle): number {
    return toInt(mascota?.Monstruo_origen?.Id) || toInt(mascota?.Id);
}

function habilidadesDelMonstruo(habilidades: MonstruoHabilidad[] | null | undefined): PersonajeCreateHabilidadMascotaDto[] {
    return (habilidades ?? [])
        .filter((habilidad) => toInt(habilidad?.Id_habilidad) > 0)
        .map((habilidad) => ({
            idHabilidad: toInt(habilidad.Id_habilidad),
            idExtra: habilidad?.Id_extra === null || habilidad?.Id_extra === undefined
                ? ID_EXTRA_HABILIDAD_SIN_EXTRA
                : Math.max(ID_EXTRA_HABILIDAD_SIN_EXTRA, toInt(habilidad.Id_extra)),
            rangos: Math.max(0, toInt(habilidad?.Rangos)),
        }));
}

/** Une las habilidades por habilidad y extra, con los rangos mayores. */
function unirHabilidadesConRangosMayores(...listas: PersonajeCreateHabilidadMascotaDto[][]): PersonajeCreateHabilidadMascotaDto[] {
    const porClave = new Map<string, PersonajeCreateHabilidadMascotaDto>();
    listas.flat().forEach((habilidad) => {
        const clave = `${habilidad.idHabilidad}|${habilidad.idExtra}`;
        const actual = porClave.get(clave);
        if (!actual || habilidad.rangos > actual.rangos)
            porClave.set(clave, { ...habilidad });
    });
    return Array.from(porClave.values());
}

function especialesDe(mascota: FamiliarMonstruoDetalle | CompaneroMonstruoDetalle): Array<{ idEspecial: number; idExtra: number; }> {
    return (mascota?.Especiales ?? [])
        .map((item) => ({
            idEspecial: toInt((item?.Especial as any)?.Id),
            idExtra: Math.max(0, toInt(item?.Contexto?.['Id_extra'])),
        }))
        .filter((item) => item.idEspecial > 0);
}

/** Las dotes que la creación le dio a la mascota (no las de su monstruo, que la API ya lee de él). */
function dotesPropias(mascota: FamiliarMonstruoDetalle | CompaneroMonstruoDetalle): Array<{ idDote: number; idExtra: number; }> {
    return (mascota?.Dotes ?? [])
        .filter((item) => item?.Contexto?.Entidad === 'personaje' && toInt(item?.Dote?.Id) > 0)
        .map((item) => ({ idDote: toInt(item.Dote.Id), idExtra: Math.max(0, toInt(item?.Contexto?.Id_extra)) }));
}

function sinRepetidos<T>(items: T[], clave: (item: T) => string): T[] {
    const vistos = new Set<string>();
    return items.filter((item) => {
        const k = clave(item);
        if (vistos.has(k))
            return false;
        vistos.add(k);
        return true;
    });
}

export function construirFamiliarParaGuardar(
    familiar: FamiliarMonstruoDetalle,
    amo: AmoDelFamiliar,
    idsEspecialesDelVinculo: number[] = []
): PersonajeCreateFamiliarDto {
    const bonos = bonosFamiliarPorNivel(amo.nivelFamiliar);
    const caracteristicas = (familiar?.Caracteristicas ?? {}) as Record<string, number | null>;
    const salvacion = (clave: 'Fortaleza' | 'Reflejos' | 'Voluntad', caracteristica: string): number => {
        const total = toNumber(familiar?.Salvaciones?.[clave]);
        const modificador = toNumber(caracteristicas[`${caracteristica}_modificador`]);
        const base = amo.salvacionesBase[clave.toLowerCase() as keyof AmoDelFamiliar['salvacionesBase']];
        return Math.max(total, toNumber(base) + modificador);
    };
    const dto: PersonajeCreateFamiliarDto = {
        nombre: nombreMascota(familiar?.Nombre, 'Familiar'),
        idMonstruo: idMonstruo(familiar),
        idPlantilla: Math.max(0, toInt(familiar?.Plantilla?.Id)),
        vida: Math.max(1, Math.floor(toNumber(amo.vida) / 2)),
        ataqueBase: toInt(amo.ataqueBase),
        fortaleza: salvacion('Fortaleza', 'Constitucion'),
        reflejos: salvacion('Reflejos', 'Destreza'),
        voluntad: salvacion('Voluntad', 'Sabiduria'),
        armaduraNatural: toInt(familiar?.Defensa?.Armadura_natural) + bonos.ajusteArmaduraNatural,
        inteligencia: Math.max(bonos.inteligencia, toInt(caracteristicas['Inteligencia'])),
        habilidades: unirHabilidadesConRangosMayores(habilidadesDelMonstruo(familiar?.Habilidades), amo.habilidades),
        especiales: sinRepetidos(
            [...especialesDe(familiar).map(({ idEspecial }) => idEspecial), ...idsEspecialesDelVinculo]
                .filter((id) => id > 0)
                .map((idEspecial) => ({ idEspecial })),
            (item) => `${item.idEspecial}`
        ),
        dotes: dotesPropias(familiar),
    };
    if (bonos.resistenciaConjuros !== null)
        dto.rc = `${bonos.resistenciaConjuros}`;
    return dto;
}

/** Puntos de golpe medios de unos DG (como los del Manual de monstruos): por DG, la media del dado y la Constitución. */
export function vidaMediaPorDados(dados: number, carasDado: number, modConstitucion: number): number {
    const cantidad = Math.max(0, toInt(dados));
    if (cantidad < 1)
        return 1;
    const media = Math.floor(cantidad * (Math.max(1, toInt(carasDado)) + 1) / 2) + cantidad * toInt(modConstitucion);
    return Math.max(cantidad, media);
}

/**
 * El compañero animal ya trae sus bonos por nivel del druida (DG adicionales, armadura natural, Fuerza, Destreza y
 * trucos; `clonarCompaneroParaPersonaje`). Sus puntos de golpe son los medios de sus DG (los suyos y los adicionales).
 */
export function construirCompaneroParaGuardar(
    companero: CompaneroMonstruoDetalle,
    idsEspecialesDelVinculo: number[] = []
): PersonajeCreateCompaneroDto {
    const caracteristicas = (companero?.Caracteristicas ?? {}) as Record<string, number | null>;
    const dgAdi = Math.max(0, toInt(companero?.Dg_adi));
    const dados = (primerEntero(companero?.Dados_golpe?.Cantidad) ?? 0) + dgAdi;
    const caras = primerEntero(companero?.Dados_golpe?.Tipo_dado?.Nombre) ?? 0;
    return {
        nombre: nombreMascota(companero?.Nombre, 'Compañero'),
        idMonstruo: idMonstruo(companero),
        idPlantilla: Math.max(0, toInt(companero?.Plantilla?.Id)),
        vida: vidaMediaPorDados(dados, caras, toNumber(caracteristicas['Constitucion_modificador'])),
        dgAdi,
        armaduraNatural: toInt(companero?.Defensa?.Armadura_natural),
        fuerza: toInt(caracteristicas['Fuerza']),
        destreza: toInt(caracteristicas['Destreza']),
        inteligencia: toInt(caracteristicas['Inteligencia']),
        trucosAdi: Math.max(0, toInt(companero?.Trucos_adi)),
        habilidades: habilidadesDelMonstruo(companero?.Habilidades),
        especiales: sinRepetidos(
            [...especialesDe(companero), ...idsEspecialesDelVinculo.filter((id) => id > 0).map((idEspecial) => ({ idEspecial, idExtra: 0 }))],
            (item) => `${item.idEspecial}|${item.idExtra}`
        ),
        dotes: dotesPropias(companero),
    };
}
