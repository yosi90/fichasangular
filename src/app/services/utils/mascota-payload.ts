import { CompaneroMonstruoDetalle, FamiliarMonstruoDetalle, MonstruoHabilidad } from 'src/app/interfaces/monstruo';
import {
    PersonajeCreateCompaneroDto,
    PersonajeCreateFamiliarDto,
    PersonajeCreateHabilidadMascotaDto,
} from 'src/app/interfaces/personajes-api';
import { ID_EXTRA_HABILIDAD_SIN_EXTRA } from './habilidad-extra-visible';
import { primerEntero, toInt, toNumber } from './normalizacion';
import { carasDado } from './puntos-golpe';
import { dadosGolpeCompanero, rangosDelCompaneroQueCaben } from './companero-reglas';
import { TablaDelFamiliar } from './familiar-reglas';
import { idDelMonstruo } from './mascota-cupos';

/**
 * El familiar y el compañero animal de la creación, en la forma de `POST /personajes/add` (bloques `familiar` y
 * `companero`, que la API guarda como un familiar o un compañero propios con sus habilidades, dotes y especiales).
 *
 * Familiar (Manual del jugador, págs. 44-45; contrato: `docs/publica/endpoints/personajes.md`, «El familiar, comprobado
 * por la API»): la mitad de los puntos de golpe de su amo y el ataque base del amo (con `Pg_ataque_mayores` en su
 * pseudoplantilla, los mayores entre esos y los suyos: el dracónico, el celestial), en cada salvación la base mejor (la
 * suya o la del amo) con sus modificadores, en cada habilidad los rangos mejores (los suyos o los del amo), y la fila de su
 * tabla al nivel de su amo (`tablaDelFamiliar`): armadura natural, Inteligencia y resistencia a conjuros. Lleva los
 * valores de su monstruo; lo de su nivel se le suma aquí.
 */

const LONGITUD_NOMBRE_MASCOTA = 50;

export interface AmoDelFamiliar {
    /** Puntos de golpe del amo. */
    vida: number;
    /** Ataque base del amo (el primero, «+6/+1» → 6). */
    ataqueBase: number;
    /** Las salvaciones base del amo por sus clases. */
    salvacionesBase: { fortaleza: number; reflejos: number; voluntad: number; };
    /** Las habilidades del amo, ya en la forma del contrato. */
    habilidades: PersonajeCreateHabilidadMascotaDto[];
}

/** La mitad de los puntos de golpe del amo, hacia abajo y como mínimo 1: los del familiar (MJ, pág. 44). */
export function mitadDeLosPg(vidaAmo: number): number {
    return Math.max(1, Math.floor(toNumber(vidaAmo) / 2));
}

/**
 * Los DG de un monstruo como número (`Dados_golpe.Cantidad`: «4», «1/2», «1/4»), como fracción `[numerador,
 * denominador]`; sin número, 0.
 */
function dadosComoFraccion(cantidad: unknown): [number, number] {
    const texto = `${cantidad ?? ''}`;
    const fraccion = /(\d+)\s*\/\s*(\d+)/.exec(texto);
    if (fraccion)
        return [toInt(fraccion[1]), Math.max(1, toInt(fraccion[2]))];
    return [Math.max(0, primerEntero(texto) ?? 0), 1];
}

/**
 * Los puntos de golpe medios de los DG de un monstruo (`vidaMediaPorDados`), también con menos de un DG (el gato, ½ DG:
 * 2; la rata, ¼: 1), como la API (`utils/mascotas.pg_medios`).
 */
export function vidaMediaDelMonstruo(monstruo: Pick<FamiliarMonstruoDetalle, 'Dados_golpe' | 'Caracteristicas'> | null | undefined): number {
    const [numerador, denominador] = dadosComoFraccion(monstruo?.Dados_golpe?.Cantidad);
    const caras = carasDado(monstruo?.Dados_golpe?.Tipo_dado?.Nombre);
    const modConstitucion = toInt((monstruo?.Caracteristicas as Record<string, number | null> | undefined)?.['Constitucion_modificador']);
    if (denominador === 1)
        return vidaMediaPorDados(numerador, caras, modConstitucion);
    if (numerador < 1)
        return 1;
    // ⌊DG × (caras + 1) / 2 + DG × mod. de Con⌋ con la fracción exacta.
    return Math.max(1, Math.trunc((numerador * (Math.max(1, caras) + 1) + 2 * numerador * modConstitucion) / (2 * denominador)));
}

function nombreMascota(nombre: unknown, porDefecto: string): string {
    const texto = `${nombre ?? ''}`.trim();
    return (texto.length > 0 ? texto : porDefecto).slice(0, LONGITUD_NOMBRE_MASCOTA);
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

/**
 * El familiar para guardar con su amo y la fila de su tabla al nivel de su amo (`tablaDelFamiliar`). Sus aptitudes son las
 * que ya lleva (las de su monstruo y las de su nivel, que le pone la creación); las del amo van en el personaje.
 */
export function construirFamiliarParaGuardar(
    familiar: FamiliarMonstruoDetalle,
    amo: AmoDelFamiliar,
    tabla: TablaDelFamiliar,
): PersonajeCreateFamiliarDto {
    if (familiar?.Inactiva)
        return familiarInactivoParaGuardar(familiar);
    const bonos = tabla.bonos;
    const mayores = !!tabla.plantilla?.Pg_ataque_mayores;
    const caracteristicas = (familiar?.Caracteristicas ?? {}) as Record<string, number | null>;
    const salvacion = (clave: 'Fortaleza' | 'Reflejos' | 'Voluntad', caracteristica: string): number => {
        const total = toNumber(familiar?.Salvaciones?.[clave]);
        const modificador = toNumber(caracteristicas[`${caracteristica}_modificador`]);
        const base = amo.salvacionesBase[clave.toLowerCase() as keyof AmoDelFamiliar['salvacionesBase']];
        return Math.max(total, toNumber(base) + modificador);
    };
    const inteligenciaMonstruo = toInt(caracteristicas['Inteligencia']);
    const mitad = mitadDeLosPg(amo.vida);
    const dto: PersonajeCreateFamiliarDto = {
        nombre: nombreMascota(familiar?.Nombre, 'Familiar'),
        idMonstruo: idDelMonstruo(familiar),
        idPlantilla: Math.max(0, toInt(familiar?.Plantilla?.Id)),
        vida: mayores ? Math.max(mitad, vidaMediaDelMonstruo(familiar)) : mitad,
        ataqueBase: mayores ? Math.max(toInt(amo.ataqueBase), toInt(familiar?.Ataque?.Ataque_base)) : toInt(amo.ataqueBase),
        fortaleza: salvacion('Fortaleza', 'Constitucion'),
        reflejos: salvacion('Reflejos', 'Destreza'),
        voluntad: salvacion('Voluntad', 'Sabiduria'),
        armaduraNatural: toInt(familiar?.Defensa?.Armadura_natural) + toInt(bonos.Armadura_natural),
        inteligencia: bonos.Inteligencia === null ? inteligenciaMonstruo : Math.max(toInt(bonos.Inteligencia), inteligenciaMonstruo),
        habilidades: unirHabilidadesConRangosMayores(habilidadesDelMonstruo(familiar?.Habilidades), amo.habilidades),
        especiales: sinRepetidos(
            especialesDe(familiar).map(({ idEspecial }) => ({ idEspecial })),
            (item) => `${item.idEspecial}`
        ),
        dotes: dotesPropias(familiar),
    };
    if (bonos.Rc_sobre_nivel !== null)
        dto.rc = `${tabla.nivel + toInt(bonos.Rc_sobre_nivel)}`;
    return dto;
}

/**
 * El familiar inactivo (contrato: `personajes.md`, «La mascota inactiva, y la mascota en los cambios de la ficha»): la
 * criatura de su monstruo tal cual, sin lo que le da el nivel de su amo (ni sus PG, ni su ataque base, ni sus salvaciones
 * base, ni sus rangos, ni la tabla). Sus aptitudes de la tabla ya no las lleva (las quita el motor).
 */
function familiarInactivoParaGuardar(familiar: FamiliarMonstruoDetalle): PersonajeCreateFamiliarDto {
    const caracteristicas = (familiar?.Caracteristicas ?? {}) as Record<string, number | null>;
    return {
        nombre: nombreMascota(familiar?.Nombre, 'Familiar'),
        idMonstruo: idDelMonstruo(familiar),
        idPlantilla: Math.max(0, toInt(familiar?.Plantilla?.Id)),
        vida: vidaMediaDelMonstruo(familiar),
        ataqueBase: toInt(familiar?.Ataque?.Ataque_base),
        fortaleza: toInt(familiar?.Salvaciones?.Fortaleza),
        reflejos: toInt(familiar?.Salvaciones?.Reflejos),
        voluntad: toInt(familiar?.Salvaciones?.Voluntad),
        armaduraNatural: toInt(familiar?.Defensa?.Armadura_natural),
        inteligencia: toInt(caracteristicas['Inteligencia']),
        habilidades: habilidadesDelMonstruo(familiar?.Habilidades),
        especiales: sinRepetidos(especialesDe(familiar).map(({ idEspecial }) => ({ idEspecial })), (item) => `${item.idEspecial}`),
        dotes: dotesPropias(familiar),
        inactiva: true,
    };
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
 * trucos; `clonarCompaneroParaPersonaje`); inactivo, los de su monstruo (`inactiva`). Sus puntos de golpe son los medios de
 * sus DG (los suyos y los adicionales). Con las habilidades de su monstruo y los puntos por DG de su tipo
 * (`Habilidades_monstruo` y `Puntos_habilidad_tipo`, en las sesiones), sus rangos son los que le caben con sus DG
 * adicionales (`rangosDelCompaneroQueCaben`).
 */
export function construirCompaneroParaGuardar(
    companero: CompaneroMonstruoDetalle,
    idsEspecialesDelVinculo: number[] = []
): PersonajeCreateCompaneroDto {
    const caracteristicas = (companero?.Caracteristicas ?? {}) as Record<string, number | null>;
    const dgAdi = Math.max(0, toInt(companero?.Dg_adi));
    const dados = dadosGolpeCompanero(companero);
    const caras = carasDado(companero?.Dados_golpe?.Tipo_dado?.Nombre);
    const habilidades = companero?.Habilidades_monstruo && companero.Puntos_habilidad_tipo !== undefined
        ? rangosDelCompaneroQueCaben(companero.Habilidades ?? [], companero.Habilidades_monstruo, dgAdi,
            companero.Puntos_habilidad_tipo, caracteristicas['Inteligencia'])
        : companero?.Habilidades;
    return {
        nombre: nombreMascota(companero?.Nombre, 'Compañero'),
        idMonstruo: idDelMonstruo(companero),
        idPlantilla: Math.max(0, toInt(companero?.Plantilla?.Id)),
        vida: vidaMediaPorDados(dados, caras, toNumber(caracteristicas['Constitucion_modificador'])),
        dgAdi,
        armaduraNatural: toInt(companero?.Defensa?.Armadura_natural),
        fuerza: toInt(caracteristicas['Fuerza']),
        destreza: toInt(caracteristicas['Destreza']),
        inteligencia: toInt(caracteristicas['Inteligencia']),
        trucosAdi: Math.max(0, toInt(companero?.Trucos_adi)),
        habilidades: habilidadesDelMonstruo(habilidades),
        especiales: sinRepetidos(
            [...especialesDe(companero), ...idsEspecialesDelVinculo.filter((id) => id > 0).map((idEspecial) => ({ idEspecial, idExtra: 0 }))],
            (item) => `${item.idEspecial}|${item.idExtra}`
        ),
        dotes: dotesPropias(companero),
        ...(companero?.Inactiva ? { inactiva: true } : {}),
    };
}
