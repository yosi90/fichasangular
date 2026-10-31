import { Alineamiento } from "src/app/interfaces/alineamiento";
import { AptitudSortilega } from "src/app/interfaces/aptitud-sortilega";
import { DoteContextual } from "src/app/interfaces/dote-contextual";
import { IdiomaDetalle } from "src/app/interfaces/idioma";
import { RacialDetalle } from "src/app/interfaces/racial";
import {
    CategoriaEdadRaza, ClaveCaracteristicaRaza, LanzamientoRaza, ListaLanzamientoRaza, MutacionRaza, PasoEdadRaza, Raza, RazaCompetencias,
    RazaHabilidades, RazaPrerrequisitos, RazaPrerrequisitosFlags, ReferenciasEdicionRaza
} from "src/app/interfaces/raza";
import { SubtipoRef } from "src/app/interfaces/subtipo";
import { toDoteContextualArray } from "./dote-mapper";
import { normalizarTexto, toArray, toBoolean, toNullableText, toNumber, toNumberOrNull, toRefIdNombre, toText } from 'src/app/services/utils/normalizacion';
import { normalizeConjuroApi } from './conjuro-mapper';
import { leerComodin } from './comodin';
import { camposEdadRacial } from './racial-mapper';

function toStrictArray<T = any>(value: any): T[] {
    return Array.isArray(value) ? value : [];
}

function normalizeModificadoresApi(raw: any): Raza["Modificadores"] {
    return {
        Fuerza: toNumber(raw?.Fuerza),
        Destreza: toNumber(raw?.Destreza),
        Constitucion: toNumber(raw?.Constitucion),
        Inteligencia: toNumber(raw?.Inteligencia),
        Sabiduria: toNumber(raw?.Sabiduria),
        Carisma: toNumber(raw?.Carisma),
    };
}

function normalizeAlineamientoApi(raw: any): Alineamiento {
    return {
        Id: toNumber(raw?.Id),
        Basico: {
            Id_basico: toNumber(raw?.Basico?.Id_basico),
            Nombre: toText(raw?.Basico?.Nombre).trim(),
        },
        Ley: {
            Id_ley: toNumber(raw?.Ley?.Id_ley),
            Nombre: toText(raw?.Ley?.Nombre).trim(),
        },
        Moral: {
            Id_moral: toNumber(raw?.Moral?.Id_moral),
            Nombre: toText(raw?.Moral?.Nombre).trim(),
        },
        Prioridad: {
            Id_prioridad: toNumber(raw?.Prioridad?.Id_prioridad),
            Nombre: toText(raw?.Prioridad?.Nombre).trim(),
        },
        Descripcion: toText(raw?.Descripcion).trim(),
    };
}

function normalizePrerrequisitosApi(raw: any): RazaPrerrequisitos {
    return {
        actitud_prohibido: toStrictArray(raw?.actitud_prohibido),
        actitud_requerido: toStrictArray(raw?.actitud_requerido),
        alineamiento_prohibido: toStrictArray(raw?.alineamiento_prohibido),
        alineamiento_requerido: toStrictArray(raw?.alineamiento_requerido),
        tipo_criatura: toStrictArray(raw?.tipo_criatura),
    };
}

function normalizePrerrequisitosFlagsApi(raw: any, prer: RazaPrerrequisitos): RazaPrerrequisitosFlags {
    const source = raw ?? {};
    return {
        actitud_prohibido: toBoolean(source?.actitud_prohibido) || (prer?.actitud_prohibido?.length ?? 0) > 0,
        actitud_requerido: toBoolean(source?.actitud_requerido) || (prer?.actitud_requerido?.length ?? 0) > 0,
        alineamiento_prohibido: toBoolean(source?.alineamiento_prohibido) || (prer?.alineamiento_prohibido?.length ?? 0) > 0,
        alineamiento_requerido: toBoolean(source?.alineamiento_requerido) || (prer?.alineamiento_requerido?.length ?? 0) > 0,
        tipo_criatura: toBoolean(source?.tipo_criatura) || (prer?.tipo_criatura?.length ?? 0) > 0,
    };
}

function normalizeMutacionApi(raw: any, mutada: any, tmd: any, heredada: any, prer: RazaPrerrequisitos): MutacionRaza {
    const source = raw ?? {};
    const tienePrerrequisitos = (prer?.actitud_prohibido?.length ?? 0) > 0
        || (prer?.actitud_requerido?.length ?? 0) > 0
        || (prer?.alineamiento_prohibido?.length ?? 0) > 0
        || (prer?.alineamiento_requerido?.length ?? 0) > 0
        || (prer?.tipo_criatura?.length ?? 0) > 0;
    return {
        Es_mutada: toBoolean(source?.Es_mutada) || toBoolean(mutada),
        Tamano_dependiente: toBoolean(source?.Tamano_dependiente) || toBoolean(tmd),
        Tiene_prerrequisitos: toBoolean(source?.Tiene_prerrequisitos) || tienePrerrequisitos,
        Heredada: toBoolean(source?.Heredada) || toBoolean(heredada),
    };
}

function normalizeDgsAdicionalesApi(raw: any): Raza["Dgs_adicionales"] {
    return {
        Cantidad: toNumber(raw?.Cantidad),
        Dado: toText(raw?.Dado),
        Tipo_criatura: toText(raw?.Tipo_criatura),
        Ataque_base: toNumber(raw?.Ataque_base),
        Dotes_extra: toNumber(raw?.Dotes_extra),
        Puntos_habilidad: toNumber(raw?.Puntos_habilidad),
        Multiplicador_puntos_habilidad: toNumber(raw?.Multiplicador_puntos_habilidad),
        Fortaleza: toNumber(raw?.Fortaleza),
        Reflejos: toNumber(raw?.Reflejos),
        Voluntad: toNumber(raw?.Voluntad),
    };
}

function normalizeSubtiposApi(raw: any): SubtipoRef[] {
    const output: SubtipoRef[] = [];
    const seen = new Set<string>();

    toStrictArray(raw).forEach((item: any) => {
        const id = toNumber(item?.Id);
        const nombre = toText(item?.Nombre).trim();
        if (id <= 0 && nombre.length < 1)
            return;

        const key = id > 0 ? `id:${id}` : `name:${normalizarTexto(nombre)}`;
        if (seen.has(key))
            return;

        seen.add(key);
        output.push({
            Id: id > 0 ? id : 0,
            Nombre: nombre,
        });
    });

    return output;
}

function normalizePlantillasPorSubtipoApi(raw: any): Raza["Plantillas_por_subtipo"] {
    return toStrictArray(raw)
        .map((item: any) => {
            const subtipoRaw = item?.Subtipo ?? item?.subtipo;
            const subtipo = {
                Id: toNumber(subtipoRaw?.Id ?? subtipoRaw?.id),
                Nombre: toText(subtipoRaw?.Nombre ?? subtipoRaw?.nombre).trim(),
            };
            const plantillas = toStrictArray(item?.Plantillas ?? item?.plantillas)
                .map((plantilla: any) => ({
                    Id: toNumber(plantilla?.Id ?? plantilla?.id),
                    Nombre: toText(plantilla?.Nombre ?? plantilla?.nombre).trim(),
                    Descripcion: toText(plantilla?.Descripcion ?? plantilla?.descripcion).trim(),
                }))
                .filter((plantilla) => plantilla.Id > 0 || plantilla.Nombre.length > 0);
            return { Subtipo: subtipo, Plantillas: plantillas };
        })
        .filter((item) => (item.Subtipo.Id > 0 || item.Subtipo.Nombre.length > 0) && item.Plantillas.length > 0);
}

function normalizeIdiomasApi(raw: any): IdiomaDetalle[] {
    return toStrictArray(raw)
        .map((item: any) => ({
            Id: toNumber(item?.Id),
            Nombre: toText(item?.Nombre),
            Descripcion: toText(item?.Descripcion),
            Secreto: toBoolean(item?.Secreto),
            Oficial: toBoolean(item?.Oficial),
        }))
        .filter((item) => item.Nombre.trim().length > 0);
}

/** Los campos de la raza que usan las reglas de la creación, leídos igual en la API y en la caché. */
type CamposCreacionRaza = 'Dotes_adicionales' | 'Puntos_habilidad_extra_primer_nivel' | 'Puntos_habilidad_extra_por_nivel'
    | 'Cuadrupedo' | 'Competencias' | 'Idiomas_adicionales' | 'Idiomas_adicionales_cualquiera';

/**
 * Lo que la raza aporta a las reglas de la creación: su dote adicional y sus puntos de habilidad extra, si carga como un
 * cuadrúpedo, sus competencias y sus idiomas adicionales. Lo usan la lectura de la API y la de la caché (`Razas/{id}`),
 * que guardan estos campos con el mismo nombre: un campo nuevo de este tipo se añade solo aquí (y en `raza-mutacion.ts`
 * si la raza mutada lo cambia).
 */
export function normalizarCamposCreacionRaza(raw: any): Pick<Raza, CamposCreacionRaza> {
    const refs = (valor: any) => (Array.isArray(valor) ? valor : (valor && typeof valor === 'object' ? Object.values(valor) : []))
        .map((item: any) => ({ Id: toNumber(item?.Id), Nombre: toText(item?.Nombre) }))
        .filter((item) => item.Id > 0 || item.Nombre.trim().length > 0);
    const competencias: RazaCompetencias = {
        Armas: refs(raw?.Competencias?.Armas),
        Armaduras: refs(raw?.Competencias?.Armaduras),
        Grupos_arma: refs(raw?.Competencias?.Grupos_arma),
        Grupos_armadura: refs(raw?.Competencias?.Grupos_armadura),
    };
    return {
        Dotes_adicionales: toNumber(raw?.Dotes_adicionales),
        Puntos_habilidad_extra_primer_nivel: toNumber(raw?.Puntos_habilidad_extra_primer_nivel),
        Puntos_habilidad_extra_por_nivel: toNumber(raw?.Puntos_habilidad_extra_por_nivel),
        Cuadrupedo: toBoolean(raw?.Cuadrupedo),
        Competencias: competencias,
        Idiomas_adicionales: normalizeIdiomasApi(Array.isArray(raw?.Idiomas_adicionales) ? raw.Idiomas_adicionales : Object.values(raw?.Idiomas_adicionales ?? {})),
        Idiomas_adicionales_cualquiera: toBoolean(raw?.Idiomas_adicionales_cualquiera ?? true),
    };
}

function caracteristicasDeEdad(raw: any): Record<ClaveCaracteristicaRaza, number | null> {
    return {
        Fuerza: toNumberOrNull(raw?.Fuerza),
        Destreza: toNumberOrNull(raw?.Destreza),
        Constitucion: toNumberOrNull(raw?.Constitucion),
        Inteligencia: toNumberOrNull(raw?.Inteligencia),
        Sabiduria: toNumberOrNull(raw?.Sabiduria),
        Carisma: toNumberOrNull(raw?.Carisma),
    };
}

function categoriaEdad(raw: any): CategoriaEdadRaza {
    const tamano = raw?.Tamano && typeof raw.Tamano === 'object' ? raw.Tamano : null;
    return {
        Orden: toNumber(raw?.Orden),
        Categoria: toRefIdNombre(raw?.Categoria) ?? { Id: 0, Nombre: '' },
        Edad_desde: toNumber(raw?.Edad_desde),
        Edad_hasta: toNumberOrNull(raw?.Edad_hasta),
        Tamano: tamano,
        Espacio: toNumber(raw?.Espacio),
        Alcance: toNumber(raw?.Alcance),
        Dgs: toNumber(raw?.Dgs),
        Ajuste_nivel: toNumberOrNull(raw?.Ajuste_nivel),
        Vd: toNumberOrNull(raw?.Vd),
        Caracteristicas: caracteristicasDeEdad(raw?.Caracteristicas),
        Modificadores: caracteristicasDeEdad(raw?.Modificadores),
        Armadura_natural: toNumber(raw?.Armadura_natural),
        Velocidades: {
            Correr: toNumber(raw?.Velocidades?.Correr),
            Nadar: toNumber(raw?.Velocidades?.Nadar),
            Volar: toNumber(raw?.Velocidades?.Volar),
            Trepar: toNumber(raw?.Velocidades?.Trepar),
            Excavar: toNumber(raw?.Velocidades?.Excavar),
        },
        Maniobrabilidad: toRefIdNombre(raw?.Maniobrabilidad),
        Ataques_naturales: toNullableText(raw?.Ataques_naturales),
        Rd: toNullableText(raw?.Rd),
        Rc: toNullableText(raw?.Rc),
        Re: toNullableText(raw?.Re),
        Nivel_lanzamiento: toNumber(raw?.Nivel_lanzamiento),
        Nivel_lanzador_sortilegas: toNumber(raw?.Nivel_lanzador_sortilegas),
        Raciales: toArray(raw?.Raciales).map((racial: any) => ({
            Id: toNumber(racial?.Id),
            Nombre: toText(racial?.Nombre).trim(),
            Valor: toNullableText(racial?.Valor),
            Caracteristica_cd: toRefIdNombre(racial?.Caracteristica_cd),
        })).filter((racial) => racial.Nombre.length > 0),
        Sortilegas: toArray(raw?.Sortilegas).map((sortilega: any) => ({
            Conjuro: toRefIdNombre(sortilega?.Conjuro) ?? { Id: 0, Nombre: '' },
            Usos_diarios: toText(sortilega?.Usos_diarios).trim(),
            Descripcion: toText(sortilega?.Descripcion).trim(),
        })).filter((sortilega) => sortilega.Conjuro.Nombre.length > 0),
    };
}

function pasoEdad(raw: any): PasoEdadRaza {
    return {
        Id: toNumber(raw?.Id),
        Edad: toNumber(raw?.Edad),
        Categoria: toRefIdNombre(raw?.Categoria) ?? { Id: 0, Nombre: '' },
        Orden: toNumber(raw?.Orden),
        Dgs: toNumber(raw?.Dgs),
        Ajuste_nivel: toNumberOrNull(raw?.Ajuste_nivel),
        Armadura_natural: toNumber(raw?.Armadura_natural),
        Nep_base: toNumberOrNull(raw?.Nep_base),
        Jugable: toBoolean(raw?.Jugable),
        Vd: toNumberOrNull(raw?.Vd),
    };
}

/**
 * Las listas que se lanzan además como arcanas con el lanzamiento racial (`Lanzamiento.Listas` de la raza y `listas` del
 * `lanzamientoRacial` de la ficha, con la misma forma): `clase` o `dominio`, su id y su nombre.
 */
export function normalizarListasLanzamiento(raw: any): ListaLanzamientoRaza[] {
    return toArray(raw)
        .map((lista: any) => ({
            Tipo: (toText(lista?.Tipo).trim().toLowerCase() === 'dominio' ? 'dominio' : 'clase') as ListaLanzamientoRaza['Tipo'],
            Id: toNumber(lista?.Id),
            Nombre: toText(lista?.Nombre).trim(),
        }))
        .filter((lista) => lista.Id > 0 || lista.Nombre.length > 0);
}

function lanzamientoRaza(raw: any): LanzamientoRaza | null {
    const clase = toRefIdNombre(raw?.Clase);
    if (!clase)
        return null;
    return {
        Clase: clase,
        Nivel: toNumber(raw?.Nivel),
        Listas: normalizarListasLanzamiento(raw?.Listas),
    };
}

/** Lo que una raza tiene por edades (dragones jugables). */
type CamposEdadRaza = 'Categorias_edad' | 'Pasos_edad' | 'Lanzamiento' | 'Paso_edad' | 'Categoria_edad';

/**
 * Las categorías de edad, los pasos y el lanzamiento racial de la raza (`docs/publica/DRAGONES_FRONT.md`), y, en la raza
 * resuelta a una edad (`GET /razas/{id}/pasos-edad/{idPaso}`), su paso y su categoría. La API y la caché (`Razas/{id}`,
 * versión 19) los guardan con el mismo nombre; en la caché, las listas pueden llegar como objetos.
 */
export function normalizarCamposEdadRaza(raw: any): Pick<Raza, CamposEdadRaza> {
    const paso = raw?.Paso_edad && typeof raw.Paso_edad === 'object' ? pasoEdad(raw.Paso_edad) : null;
    const categoria = raw?.Categoria_edad && typeof raw.Categoria_edad === 'object' ? categoriaEdad(raw.Categoria_edad) : null;
    return {
        Categorias_edad: toArray(raw?.Categorias_edad).map(categoriaEdad).sort((a, b) => a.Orden - b.Orden),
        Pasos_edad: toArray(raw?.Pasos_edad).map(pasoEdad).filter((p) => p.Id > 0).sort((a, b) => a.Edad - b.Edad),
        Lanzamiento: lanzamientoRaza(raw?.Lanzamiento),
        Paso_edad: paso,
        Categoria_edad: categoria,
    };
}

/**
 * Lo que necesita «Modificar raza» y el resto de la raza no da con su id (`Manual`, `Clase_predilecta` y `Dgs_raciales`
 * de `GET /razas/{id}`). Solo lo trae la API: sin ello (la caché), `null`.
 */
function referenciasEdicionRaza(raw: any): ReferenciasEdicionRaza | null {
    const manual = raw?.Manual;
    if (!manual || typeof manual !== 'object')
        return null;
    const dgs = raw?.Dgs_raciales;
    return {
        Manual: { Id: toNumber(manual?.Id), Nombre: toText(manual?.Nombre).trim(), Pagina: toNumber(manual?.Pagina) },
        Clase_predilecta: toRefIdNombre(raw?.Clase_predilecta) ?? { Id: 0, Nombre: '' },
        Dgs_raciales: {
            Cantidad: toNumber(dgs?.Cantidad),
            Id_dado: toNumber(dgs?.Id_dado),
            Id_tipo_criatura: toNumber(dgs?.Id_tipo_criatura),
            Ataque_base: toNumber(dgs?.Ataque_base),
            Fortaleza: toNumber(dgs?.Fortaleza),
            Reflejos: toNumber(dgs?.Reflejos),
            Voluntad: toNumber(dgs?.Voluntad),
            Dotes_extra: toNumber(dgs?.Dotes_extra),
            Puntos_habilidad: toNumber(dgs?.Puntos_habilidad),
            Multiplicador_puntos_habilidad: toNumber(dgs?.Multiplicador_puntos_habilidad),
        },
    };
}

/** Los textos de la raza: su descripción y, si la hemos traducido de un libro en inglés, su nombre original. */
type TextosRaza = 'Descripcion' | 'Nombre_original' | 'Traducido';

/**
 * La descripción, el nombre original y la marca de traducida de la raza. La API y la caché (`Razas/{id}`) los guardan con
 * el mismo nombre; en la caché, sin nombre original, la clave no está.
 */
export function normalizarTextosRaza(raw: any): Pick<Raza, TextosRaza> {
    return {
        Descripcion: toText(raw?.Descripcion).trim(),
        Nombre_original: toNullableText(raw?.Nombre_original),
        Traducido: toBoolean(raw?.Traducido),
    };
}

function normalizeHabilidadesApi(raw: any): RazaHabilidades {
    const base = toStrictArray(raw?.Base)
        .map((item: any) => ({
            Id_habilidad: toNumber(item?.Id_habilidad),
            Habilidad: toText(item?.Habilidad).trim(),
            Id_caracteristica: toNumber(item?.Id_caracteristica),
            Caracteristica: toText(item?.Caracteristica).trim(),
            Descripcion: toText(item?.Descripcion).trim(),
            Entrenada: toBoolean(item?.Entrenada),
            Id_extra: item?.Id_extra === undefined || item?.Id_extra === null || `${item?.Id_extra}`.trim() === "" ? -1 : toNumber(item?.Id_extra),
            Extra: toText(item?.Extra).trim(),
            Extra_comodin: leerComodin(item?.Extra_comodin),
            Cantidad: toNumber(item?.Cantidad),
            Varios: toText(item?.Varios).trim(),
            Soporta_extra: item?.Soporta_extra === undefined ? undefined : toBoolean(item?.Soporta_extra),
            Custom: toBoolean(item?.Custom),
            Clasea: toBoolean(item?.Clasea),
            Clase: toBoolean(item?.Clase),
            classSkill: toBoolean(item?.classSkill),
        }))
        .filter((item) => item.Id_habilidad > 0 || item.Habilidad.length > 0);

    const custom = toStrictArray(raw?.Custom)
        .map((item: any) => ({
            Id_habilidad: toNumber(item?.Id_habilidad),
            Habilidad: toText(item?.Habilidad).trim(),
            Id_caracteristica: toNumber(item?.Id_caracteristica),
            Caracteristica: toText(item?.Caracteristica).trim(),
            Id_extra: item?.Id_extra === undefined || item?.Id_extra === null || `${item?.Id_extra}`.trim() === "" ? -1 : toNumber(item?.Id_extra),
            Extra: toText(item?.Extra).trim(),
            Extra_comodin: leerComodin(item?.Extra_comodin),
            Cantidad: toNumber(item?.Cantidad),
            Soporta_extra
: item?.Soporta_extra === undefined ? undefined : toBoolean(item?.Soporta_extra),
            Custom: true,
            Clasea: toBoolean(item?.Clasea),
            Clase: toBoolean(item?.Clase),
            classSkill: toBoolean(item?.classSkill),
        }))
        .filter((item) => item.Id_habilidad > 0 || item.Habilidad.length > 0);

    return {
        Base: base,
        Custom: custom,
    };
}

function normalizeSortilegasApi(raw: any): AptitudSortilega[] {
    return toStrictArray(raw).map((item: any) => ({
        Conjuro: normalizeConjuroApi(item?.Conjuro),
        Nivel_lanzador: toNumber(item?.Nivel_lanzador),
        Usos_diarios: toText(item?.Usos_diarios),
        Descripcion: toText(item?.Descripcion),
        Dgs_necesarios: toNumber(item?.Dgs_necesarios),
        Origen: toText(item?.Origen),
    }));
}

function normalizeRacialesApi(raw: any): RacialDetalle[] {
    return toStrictArray(raw).map((item: any) => ({
        Id: toNumber(item?.Id),
        Nombre: toText(item?.Nombre),
        Descripcion: toText(item?.Descripcion),
        Oficial: item?.Oficial === undefined ? true : toBoolean(item?.Oficial),
        Origen: toText(item?.Origen).trim(),
        Opcional: toNumber(item?.Opcional),
        Dotes: toStrictArray(item?.Dotes).map((dote: any) => ({
            Id_dote: toNumber(dote?.Id_dote),
            Dote: toText(dote?.Dote),
            Id_extra: toNumber(dote?.Id_extra),
            Extra: toText(dote?.Extra),
        })),
        Habilidades: {
            Base: toStrictArray(item?.Habilidades?.Base),
            Custom: toStrictArray(item?.Habilidades?.Custom),
        },
        Caracteristicas: toStrictArray(item?.Caracteristicas),
        Salvaciones: toStrictArray(item?.Salvaciones),
        Sortilegas: toStrictArray(item?.Sortilegas).map((sortilega: any) => ({
            Conjuro: normalizeConjuroApi(sortilega?.Conjuro),
            Nivel_lanzador: toText(sortilega?.Nivel_lanzador),
            Usos_diarios: toText(sortilega?.Usos_diarios),
        })),
        Ataques: toStrictArray(item?.Ataques).map((ataque: any) => ({
            Descripcion: toText(ataque?.Descripcion),
        })),
        ...camposEdadRacial(item),
        Prerrequisitos_flags: {
            raza: toBoolean(item?.Prerrequisitos_flags?.raza),
            caracteristica_minima: toBoolean(item?.Prerrequisitos_flags?.caracteristica_minima),
        },
        Prerrequisitos: {
            raza: toStrictArray(item?.Prerrequisitos?.raza),
            caracteristica: toStrictArray(item?.Prerrequisitos?.caracteristica),
        },
    }));
}

export function normalizeRazaApi(raw: any): Raza {
    const prerrequisitos = normalizePrerrequisitosApi(raw?.pr);
    const prerrequisitosFlags = normalizePrerrequisitosFlagsApi(
        raw?.prf ?? raw?.Prerrequisitos_flags,
        prerrequisitos
    );
    const mutacion = normalizeMutacionApi(
        raw?.Mutacion,
        raw?.Mutada ?? raw?.mu,
        raw?.tmd,
        raw?.he,
        prerrequisitos
    );
    const dotesContextuales: DoteContextual[] = toDoteContextualArray(raw?.dotes);

    return {
        Id: toNumber(raw?.i),
        Nombre: toText(raw?.n),
        ...normalizarTextosRaza(raw),
        Modificadores: normalizeModificadoresApi(raw?.m),
        Alineamiento: normalizeAlineamientoApi(raw?.ali),
        Manual: toText(raw?.ma),
        Ajuste_nivel: toNumber(raw?.aju),
        Clase_predilecta: toText(raw?.c),
        Oficial: toBoolean(raw?.o, true),
        Ataques_naturales: toText(raw?.an),
        Tamano: raw?.t ?? {} as any,
        Dgs_adicionales: normalizeDgsAdicionalesApi(raw?.dg),
        ...normalizarCamposCreacionRaza(raw),
        Reduccion_dano: toText(raw?.rd),
        Resistencia_magica: toText(raw?.rc),
        Resistencia_energia: toText(raw?.re),
        Heredada: toBoolean(raw?.he),
        Mutada: mutacion.Es_mutada === true,
        Tamano_mutacion_dependiente: mutacion.Tamano_dependiente === true,
        Prerrequisitos: prerrequisitos,
        Prerrequisitos_flags: prerrequisitosFlags,
        Mutacion: mutacion,
        Armadura_natural: toNumber(raw?.ant),
        Varios_armadura: toNumber(raw?.va),
        Correr: toNumber(raw?.co),
        Nadar: toNumber(raw?.na),
        Volar: toNumber(raw?.vo),
        Maniobrabilidad: raw?.man ?? {} as any,
        Trepar: toNumber(raw?.tr),
        Excavar: toNumber(raw?.ex),
        Altura_rango_inf: toNumber(raw?.ari),
        Altura_rango_sup: toNumber(raw?.ars),
        Peso_rango_inf: toNumber(raw?.pri),
        Peso_rango_sup: toNumber(raw?.prs),
        Edad_adulto: toNumber(raw?.ea),
        Edad_mediana: toNumber(raw?.em),
        Edad_viejo: toNumber(raw?.ev),
        Edad_venerable: toNumber(raw?.eve),
        Espacio: toNumber(raw?.esp),
        Alcance: toNumber(raw?.alc),
        Tipo_criatura: raw?.tc ?? {} as any,
        Subtipos: normalizeSubtiposApi(raw?.subtipos),
        Sortilegas: normalizeSortilegasApi(raw?.sor),
        Raciales: normalizeRacialesApi(raw?.rac),
        Habilidades: normalizeHabilidadesApi(raw?.Habilidades),
        DotesContextuales: dotesContextuales,
        Idiomas: normalizeIdiomasApi(raw?.Idiomas),
        Plantillas_por_subtipo: normalizePlantillasPorSubtipoApi(raw?.Plantillas_por_subtipo),
        ...normalizarCamposEdadRaza(raw),
        Edicion: referenciasEdicionRaza(raw),
    };
}
