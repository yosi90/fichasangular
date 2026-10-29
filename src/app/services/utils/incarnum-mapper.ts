import {
    CapacidadEsencia,
    Chakra,
    ChakraDetalle,
    ClaseHabilidadPorAlineamiento,
    ClaseMoldeado,
    DoteIncarnum,
    EsenciaRasgo,
    Fusion,
    NombreTraducible,
    PersonajeIncarnum,
    PersonajeIncarnumRef,
} from 'src/app/interfaces/incarnum';
import { normalizeManualApi } from './manual-mapper';
import { toArray, toBoolean, toInt, toNullableText, toNumberOrNull, toText } from './normalizacion';

/*
 * Los mappers de Magic of Incarnum (`docs/publica/INCARNUM.md`). Las cachés nuevas (`Fusiones`, `Chakras`) y los
 * bloques del incarnum de las demás guardan lo que da la API con la forma de su respuesta HTTP
 * (`docs/publica/CACHES_DETALLE_FRONT.md`): no hay productores antiguos, así que un solo mapper sirve para las dos. En la
 * RTDB una clave a `null` no está: «no está» se lee como `null` o lista vacía.
 */

function idNombre(raw: any): { Id: number; Nombre: string; } {
    return { Id: toInt(raw?.Id), Nombre: toText(raw?.Nombre).trim() };
}

function idNombreONulo(raw: any): { Id: number; Nombre: string; } | null {
    return raw && typeof raw === 'object' && toInt(raw?.Id) > 0 ? idNombre(raw) : null;
}

export function normalizarNombreTraducible(raw: any): NombreTraducible {
    return {
        Id: toInt(raw?.Id),
        Nombre: toText(raw?.Nombre).trim(),
        Nombre_original: toNullableText(raw?.Nombre_original),
        Traducido: toBoolean(raw?.Traducido),
    };
}

function nombreTraducibleONulo(raw: any): NombreTraducible | null {
    return raw && typeof raw === 'object' && toInt(raw?.Id) > 0 ? normalizarNombreTraducible(raw) : null;
}

export function normalizarChakra(raw: any): Chakra {
    const categoria = nombreTraducibleONulo(raw?.Categoria);
    return {
        ...normalizarNombreTraducible(raw),
        Categoria: categoria ? { ...categoria, Orden: toInt(raw?.Categoria?.Orden) } : null,
        Ranura: idNombreONulo(raw?.Ranura),
        Orden: toInt(raw?.Orden),
        Descripcion: toNullableText(raw?.Descripcion),
    };
}

export function normalizarChakraDetalle(raw: any): ChakraDetalle {
    return {
        ...normalizarChakra(raw),
        Fusiones: toArray(raw?.Fusiones).map((fusion: any) => ({
            ...normalizarNombreTraducible(fusion),
            Ocupa: toBoolean(fusion?.Ocupa),
            Vinculo: toBoolean(fusion?.Vinculo),
        })).filter((fusion) => fusion.Id > 0),
        Clases: toArray(raw?.Clases).map((clase: any) => ({ ...idNombre(clase), Nivel: toInt(clase?.Nivel) }))
            .filter((clase) => clase.Id > 0),
    };
}

export function normalizarFusion(raw: any): Fusion {
    const salvacion = raw?.Salvacion && typeof raw.Salvacion === 'object'
        ? { Tipo: toNullableText(raw.Salvacion.Tipo), Efecto: toNullableText(raw.Salvacion.Efecto) }
        : null;
    return {
        ...normalizarNombreTraducible(raw),
        Descripcion: toNullableText(raw?.Descripcion),
        Efecto_basico: toNullableText(raw?.Efecto_basico),
        Efecto_esencia: toNullableText(raw?.Efecto_esencia),
        Origen_descripcion: toNullableText(raw?.Origen_descripcion),
        Salvacion: salvacion && (salvacion.Tipo || salvacion.Efecto) ? salvacion : null,
        Alineado_portador: toBoolean(raw?.Alineado_portador),
        Manual: normalizeManualApi(raw?.Manual),
        Oficial: toBoolean(raw?.Oficial, true),
        Clases: toArray(raw?.Clases).map(idNombre).filter((clase) => clase.Id > 0),
        Descriptores: toArray(raw?.Descriptores).map((descriptor: any) => ({
            ...idNombre(descriptor),
            Actitud: idNombreONulo(descriptor?.Actitud),
        })).filter((descriptor) => descriptor.Id > 0),
        Chakras: toArray(raw?.Chakras).map((chakra: any) => ({
            ...normalizarNombreTraducible(chakra),
            Ocupa: toBoolean(chakra?.Ocupa),
            Vinculo: toBoolean(chakra?.Vinculo),
            Efecto_vinculo: toNullableText(chakra?.Efecto_vinculo),
        })).filter((chakra) => chakra.Id > 0),
    };
}

export function normalizarCapacidadEsencia(raw: any): CapacidadEsencia {
    return {
        Nivel_minimo: toInt(raw?.Nivel_minimo),
        Nivel_maximo: toNumberOrNull(raw?.Nivel_maximo),
        Capacidad: toInt(raw?.Capacidad),
        Incremento_cada: toNumberOrNull(raw?.Incremento_cada),
    };
}

/** `Moldeado` de una clase, o `null` si no moldea fusiones. */
export function normalizarClaseMoldeado(raw: any): ClaseMoldeado | null {
    if (!raw || typeof raw !== 'object')
        return null;
    return {
        Divisor_nivel_moldeador: Math.max(1, toInt(raw?.Divisor_nivel_moldeador, 1)),
        Caracteristica_cd: idNombreONulo(raw?.Caracteristica_cd),
        Caracteristica_fusiones: idNombreONulo(raw?.Caracteristica_fusiones),
        Limitado_por_alineamiento: toBoolean(raw?.Limitado_por_alineamiento),
        Niveles: toArray(raw?.Niveles).map((nivel: any) => ({
            Nivel: toInt(nivel?.Nivel),
            Fusiones: toInt(nivel?.Fusiones),
            Esencia: toInt(nivel?.Esencia),
            Vinculos: toInt(nivel?.Vinculos),
        })).filter((nivel) => nivel.Nivel > 0).sort((a, b) => a.Nivel - b.Nivel),
        Chakras: toArray(raw?.Chakras).map((chakra: any) => ({ ...normalizarNombreTraducible(chakra), Nivel: toInt(chakra?.Nivel) }))
            .filter((chakra) => chakra.Id > 0),
        Capacidad: toArray(raw?.Capacidad).map((fila: any) => ({
            Nivel: toInt(fila?.Nivel),
            Bonificador: toInt(fila?.Bonificador),
            Chakra: nombreTraducibleONulo(fila?.Chakra),
        })).sort((a, b) => a.Nivel - b.Nivel),
        Nivel_moldeador_chakras: toArray(raw?.Nivel_moldeador_chakras).map((fila: any) => ({
            Nivel: toInt(fila?.Nivel),
            Bonificador: toInt(fila?.Bonificador),
            Chakra: nombreTraducibleONulo(fila?.Chakra),
        })).filter((fila): fila is ClaseMoldeado['Nivel_moldeador_chakras'][number] => !!fila.Chakra).sort((a, b) => a.Nivel - b.Nivel),
        Fusiones: toArray(raw?.Fusiones).map(normalizarNombreTraducible).filter((fusion) => fusion.Id > 0),
    };
}

export function normalizarHabilidadesPorAlineamiento(raw: any): ClaseHabilidadPorAlineamiento[] {
    return toArray(raw).map((item: any) => ({
        Id_habilidad: toInt(item?.Id_habilidad),
        Habilidad: toText(item?.Habilidad).trim(),
        Id_extra: toNumberOrNull(item?.Id_extra),
        Extra: toNullableText(item?.Extra),
        Alineamiento: idNombre(item?.Alineamiento),
    })).filter((item) => item.Id_habilidad > 0 && item.Alineamiento.Id > 0);
}

/** `Incarnum` de una dote; sin el bloque (las dotes de una raza, un borrador de la web), nada de incarnum. */
export function normalizarDoteIncarnum(raw: any): DoteIncarnum | null {
    if (!raw || typeof raw !== 'object')
        return null;
    const capacidad = raw?.Capacidad && typeof raw.Capacidad === 'object'
        ? {
            Bono: toInt(raw.Capacidad.Bono),
            Ambito: (toText(raw.Capacidad.Ambito) === 'dotes' ? 'dotes' : 'fusiones') as 'fusiones' | 'dotes',
            Tope_constitucion: toBoolean(raw.Capacidad.Tope_constitucion),
        }
        : null;
    return {
        Esencia_reserva: toInt(raw?.Esencia_reserva),
        Esencia_reserva_moldeador: toNumberOrNull(raw?.Esencia_reserva_moldeador),
        Receptaculo: toBoolean(raw?.Receptaculo),
        Capacidad: capacidad,
        Abre_chakra: toBoolean(raw?.Abre_chakra),
        Divisor_nivel_moldeador: toNumberOrNull(raw?.Divisor_nivel_moldeador),
        Caracteristica_cd_fusion: idNombreONulo(raw?.Caracteristica_cd_fusion),
        Sustituye_caracteristica: idNombreONulo(raw?.Sustituye_caracteristica?.De) && idNombreONulo(raw?.Sustituye_caracteristica?.Por)
            ? { De: idNombre(raw.Sustituye_caracteristica.De), Por: idNombre(raw.Sustituye_caracteristica.Por) }
            : null,
        Pg_por_esencia: toInt(raw?.Pg_por_esencia),
        Pg_por_dote: toInt(raw?.Pg_por_dote?.Valor) !== 0 && idNombreONulo(raw?.Pg_por_dote?.Tipo)
            ? { Valor: toInt(raw.Pg_por_dote.Valor), Tipo: idNombre(raw.Pg_por_dote.Tipo) }
            : null,
        Descriptores_sin_alineamiento: toArray(raw?.Descriptores_sin_alineamiento).map(idNombre).filter((d) => d.Id > 0),
    };
}

/** `Esencia` de un racial o un especial; sin ella (o a cero, sin receptáculo y sin bonos por fusiones), `null`. */
export function normalizarEsenciaRasgo(raw: any): EsenciaRasgo | null {
    if (!raw || typeof raw !== 'object')
        return null;
    const esencia: EsenciaRasgo = {
        Reserva: toInt(raw?.Reserva),
        Receptaculo: toBoolean(raw?.Receptaculo),
        Habilidades_por_fusiones: toArray(raw?.Habilidades_por_fusiones).map((h: any) => ({
            Habilidad: toText(h?.Habilidad).trim(),
            Ids_habilidad: toArray(h?.Ids_habilidad).map((id: any) => toInt(id)).filter((id: number) => id > 0),
            Bono: toInt(h?.Bono),
            Fusiones_por_punto: Math.max(1, toInt(h?.Fusiones_por_punto, 1)),
        })).filter((h) => h.Ids_habilidad.length > 0),
    };
    return esencia.Reserva > 0 || esencia.Receptaculo || esencia.Habilidades_por_fusiones.length > 0 ? esencia : null;
}

function refFicha(raw: any): PersonajeIncarnumRef {
    return {
        id: toInt(raw?.id),
        nombre: toText(raw?.nombre).trim(),
        nombreOriginal: toNullableText(raw?.nombreOriginal),
        traducido: toBoolean(raw?.traducido),
    };
}

function refFichaONula(raw: any): PersonajeIncarnumRef | null {
    return raw && typeof raw === 'object' && toInt(raw?.id) > 0 ? refFicha(raw) : null;
}

function cdFicha(raw: any): { base: number; caracteristica: string; modificador: number; } | null {
    return raw && typeof raw === 'object'
        ? { base: toInt(raw.base), caracteristica: toText(raw.caracteristica).trim(), modificador: toInt(raw.modificador) }
        : null;
}

function idNombreFicha(raw: any): { id: number; nombre: string; } {
    return { id: toInt(raw?.id), nombre: toText(raw?.nombre).trim() };
}

/** `incarnum` de la ficha de la API (`PersonajeIncarnum`), o `null` si el personaje no tiene nada de incarnum. */
export function normalizarPersonajeIncarnum(raw: any): PersonajeIncarnum | null {
    if (!raw || typeof raw !== 'object')
        return null;
    const formacion = raw?.formacion && typeof raw.formacion === 'object'
        ? {
            fusiones: toArray(raw.formacion.fusiones).map((f: any) => ({
                fusion: refFicha(f?.fusion),
                clase: f?.clase && typeof f.clase === 'object' ? idNombreFicha(f.clase) : null,
                chakra: refFicha(f?.chakra),
                vinculo: refFichaONula(f?.vinculo),
                esencia: toInt(f?.esencia),
                capacidad: toInt(f?.capacidad),
                nivelMoldeador: toNumberOrNull(f?.nivelMoldeador),
                cd: toNumberOrNull(f?.cd),
            })),
            esenciaInvertida: toInt(raw.formacion.esenciaInvertida),
        }
        : null;
    return {
        nivelPersonaje: toInt(raw?.nivelPersonaje),
        reserva: {
            total: toInt(raw?.reserva?.total),
            desglose: toArray(raw?.reserva?.desglose).map((p: any) => ({
                tipo: toText(p?.tipo), origen: toText(p?.origen).trim(), valor: toInt(p?.valor),
            })),
        },
        capacidad: {
            basica: toInt(raw?.capacidad?.basica),
            modificadores: toArray(raw?.capacidad?.modificadores).map((m: any) => ({
                origen: toText(m?.origen).trim(),
                ambito: (toText(m?.ambito) === 'dotes' ? 'dotes' : 'fusiones') as 'fusiones' | 'dotes',
                bono: toInt(m?.bono),
                tope: toNumberOrNull(m?.tope),
            })),
        },
        puedeMoldear: toBoolean(raw?.puedeMoldear),
        clases: toArray(raw?.clases).map((c: any) => ({
            id: toInt(c?.id),
            nombre: toText(c?.nombre).trim(),
            nivel: toInt(c?.nivel),
            nivelMoldeador: toInt(c?.nivelMoldeador),
            nivelMoldeadorChakras: toArray(c?.nivelMoldeadorChakras)
                .map((n: any) => ({ chakra: refFicha(n?.chakra), nivelMoldeador: toInt(n?.nivelMoldeador) })),
            fusionesTabla: toInt(c?.fusionesTabla),
            fusionesMaximas: toInt(c?.fusionesMaximas),
            caracteristicaFusiones: toNullableText(c?.caracteristicaFusiones),
            esencia: toInt(c?.esencia),
            vinculos: toInt(c?.vinculos),
            chakrasAbiertos: toArray(c?.chakrasAbiertos).map((ch: any) => ({ ...refFicha(ch), nivel: toInt(ch?.nivel) })),
            capacidadFusiones: toInt(c?.capacidadFusiones),
            capacidadChakras: toArray(c?.capacidadChakras).map((ch: any) => ({ chakra: refFicha(ch?.chakra), capacidad: toInt(ch?.capacidad) })),
            cd: cdFicha(c?.cd),
            limitadoPorAlineamiento: toBoolean(c?.limitadoPorAlineamiento),
        })),
        chakrasDeDotes: toArray(raw?.chakrasDeDotes).map((d: any) => ({ chakra: refFicha(d?.chakra), dote: idNombreFicha(d?.dote) })),
        fusionesDeDotes: toArray(raw?.fusionesDeDotes).map((d: any) => ({
            fusion: refFicha(d?.fusion), dote: idNombreFicha(d?.dote), nivelMoldeador: toNumberOrNull(d?.nivelMoldeador), cd: cdFicha(d?.cd),
        })),
        puntosGolpe: toArray(raw?.puntosGolpe).map((p: any) => ({
            tipo: toText(p?.tipo), origen: toText(p?.origen).trim(), valor: toInt(p?.valor),
        })),
        bonosHabilidad: toArray(raw?.bonosHabilidad).map((b: any) => ({
            origen: toText(b?.origen).trim(),
            habilidad: toText(b?.habilidad).trim(),
            idsHabilidad: toArray(b?.idsHabilidad).map((id: any) => toInt(id)),
            bono: toInt(b?.bono),
            fusiones: toInt(b?.fusiones),
        })),
        receptaculos: toArray(raw?.receptaculos).map((r: any) => ({
            tipo: (['dote', 'racial', 'especial'].includes(toText(r?.tipo)) ? toText(r?.tipo) : 'dote') as 'dote' | 'racial' | 'especial',
            id: toInt(r?.id),
            nombre: toText(r?.nombre).trim(),
            capacidad: toInt(r?.capacidad),
            esencia: toInt(r?.esencia),
        })),
        formacion,
    };
}
