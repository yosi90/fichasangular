import { CARACTERISTICAS } from 'src/app/interfaces/caracteristica';
import { Clase } from 'src/app/interfaces/clase';
import { Personaje } from 'src/app/interfaces/personaje';
import { PersonajeCreateNivelEleccionDto } from 'src/app/interfaces/personajes-api';
import { NOMBRES_CARACTERISTICAS } from './caracteristicas';
import { textoConSigno } from './equipo-texto';
import { normalizarTexto, toInt } from './normalizacion';
import { PgSubida } from './subida-nivel';
import { tieneTextoVisible } from './texto-visible';

/**
 * Los pasos de la subida, en el orden del MJ (p. 58-59); solo salen los que dispara el nivel. «Reciclar» va antes de todos
 * (*Manual del jugador II*, pág. 194: antes de añadir nada del nivel nuevo), si la campaña lo deja. «Compañero» (los rangos del
 * compañero animal que se recicla, de nuevo, con sus DG adicionales) va al final, antes del resumen.
 */
export type PasoSubida = 'reciclar' | 'clase' | 'incremento' | 'pg' | 'habilidades' | 'dotes' | 'conjuros' | 'intercambio' | 'companero' | 'resumen';

/**
 * Cómo se pinta un paso en la cabecera de pasos: hecho (antes del de ahora), el de ahora o pendiente. La usan la subida, la
 * plantilla y la raza mutada adquiridas.
 */
export function estadoDelPaso<T>(pasos: readonly T[], paso: T, actual: T): 'hecho' | 'actual' | 'pendiente' {
    const i = pasos.indexOf(paso);
    const a = pasos.indexOf(actual);
    return i < a ? 'hecho' : i === a ? 'actual' : 'pendiente';
}

/** Una fila de «Lo que cambia» (lienzo, pantalla 4): qué, antes, ahora y por qué. */
export interface CambioSubida {
    que: string;
    antes: string;
    ahora: string;
    porque: string;
}

function clasesTexto(pj: Personaje): string {
    return (pj?.desgloseClases ?? []).filter((c) => toInt(c?.Nivel) > 0).map((c) => `${c.Nombre} ${toInt(c.Nivel)}`).join(' · ') || '—';
}

function salvacion(pj: Personaje, clave: 'fortaleza' | 'reflejos' | 'voluntad'): number {
    const s: any = (pj?.Salvaciones as any)?.[clave];
    return (s?.modsClaseos ?? []).reduce((acc: number, m: any) => acc + toInt(m?.valor ?? m?.Valor), 0);
}

export interface EntradaCambiosSubida {
    antes: Personaje;
    despues: Personaje;
    clase: Clase | null;
    nivelClase: number;
    nivelNuevo: number;
    pg: PgSubida | null;
    tirada: number | null;
    caras: number;
    elecciones: PersonajeCreateNivelEleccionDto[];
    nombreConjuro: (id: number) => string;
    /**
     * Lo reciclado antes del nivel (sus filas van las primeras) y lo que entra con ello, que no es del nivel: el idioma que
     * aprende, las aptitudes de un rasgo de clase y el dominio que pone.
     */
    reciclado?: {
        filas: CambioSubida[]; idiomaNuevo?: string; aptitudesNuevas?: Array<{ nombre: string; extra: string; }>; dominioNuevo?: string;
    } | null;
}

/**
 * Lo que cambia con la subida, para el resumen antes de guardar: la clase, las características que suben (el
 * incremento), los PG con la tirada (y el retroactivo de Constitución), el ataque base, las salvaciones de clase, los
 * rangos, las dotes, los conjuros (y el intercambio), los idiomas y las aptitudes del nivel.
 */
export function cambiosDeLaSubida(e: EntradaCambiosSubida): CambioSubida[] {
    const filas: CambioSubida[] = (e.reciclado?.filas ?? []).map((f) => ({ ...f }));
    const nombreClase = e.clase?.Nombre ?? '';
    filas.push({ que: 'Clase', antes: clasesTexto(e.antes), ahora: clasesTexto(e.despues), porque: `Nivel ${e.nivelNuevo} del personaje` });

    CARACTERISTICAS.forEach((k) => {
        const a = toInt((e.antes as any)?.[k]);
        const d = toInt((e.despues as any)?.[k]);
        if (a !== d)
            filas.push({ que: NOMBRES_CARACTERISTICAS[k], antes: `${a}`, ahora: `${d}`, porque: `Incremento del nivel ${e.nivelNuevo}` });
    });

    if (e.pg) {
        const partes = e.tirada !== null
            ? [`Tirada ${e.tirada} de 1d${e.caras} ${textoConSigno(toInt(e.despues?.ModConstitucion))} Con`]
            : ['Este nivel no da DG'];
        if (e.pg.retroactivo !== 0)
            partes.push(`${textoConSigno(e.pg.retroactivo)} por la Constitución en los niveles de antes${e.pg.exacto ? '' : ' (sin las tiradas de antes, aproximado)'}`);
        filas.push({ que: 'Puntos de golpe', antes: `${toInt(e.antes?.Vida)}`, ahora: `${e.pg.total}`, porque: partes.join('; ') });
    }

    const ataqueA = `${e.antes?.Ataque_base ?? ''}`.trim();
    const ataqueD = `${e.despues?.Ataque_base ?? ''}`.trim();
    filas.push({ que: 'Ataque base', antes: ataqueA || '—', ahora: ataqueD || '—', porque: ataqueA === ataqueD ? `${nombreClase} ${e.nivelClase} no lo sube` : `${nombreClase} ${e.nivelClase}` });
    ([['fortaleza', 'Fortaleza'], ['reflejos', 'Reflejos'], ['voluntad', 'Voluntad']] as const).forEach(([k, nombre]) => {
        const a = salvacion(e.antes, k);
        const d = salvacion(e.despues, k);
        if (a !== d)
            filas.push({ que: `${nombre} (de clase)`, antes: textoConSigno(a), ahora: textoConSigno(d), porque: `${nombreClase} ${e.nivelClase}` });
    });

    const nombreHabilidad = (id: number) => (e.despues?.Habilidades ?? []).find((h) => toInt(h?.Id) === id && !(h as any)?.Custom)?.Nombre ?? `#${id}`;
    const rangos = e.elecciones.filter((x) => x.tipo === 'rangos');
    const puntos = rangos.reduce((acc, x) => acc + toInt(x.valor), 0);
    filas.push({
        que: 'Habilidades',
        antes: '—',
        ahora: rangos.length ? rangos.map((x) => `${nombreHabilidad(toInt(x.idElemento))} +${toInt(x.valor)}`).join(', ') : 'Ningún rango',
        porque: rangos.length ? `${puntos} rangos de ${nombreClase.toLowerCase()}` : 'No le quedan puntos de habilidad',
    });

    const dotes = e.elecciones.filter((x) => x.tipo === 'dote');
    const nombreDote = (id: number) => (e.despues?.DotesContextuales ?? []).find((d) => toInt(d?.Dote?.Id) === id)?.Dote?.Nombre ?? `#${id}`;
    filas.push({
        que: 'Dotes',
        antes: '—',
        ahora: dotes.length ? dotes.map((x) => nombreDote(toInt(x.idElemento))).join(', ') : 'Ninguna nueva',
        porque: dotes.length ? dotes.map((x) => `${x.origen ?? ''}`.trim()).filter((o) => o).join(', ') || `Nivel ${e.nivelNuevo}` : 'Este nivel no da dote',
    });

    const olvidado = e.elecciones.find((x) => x.tipo === 'conjuro_olvidado');
    const conjuros = e.elecciones.filter((x) => x.tipo === 'conjuro' && toInt(x.idElemento) !== toInt(olvidado?.valor));
    if (conjuros.length)
        filas.push({ que: 'Conjuros', antes: '—', ahora: conjuros.map((x) => e.nombreConjuro(toInt(x.idElemento))).join(', '), porque: `${nombreClase} ${e.nivelClase}` });
    if (olvidado)
        filas.push({
            que: 'Conjuro cambiado', antes: e.nombreConjuro(toInt(olvidado.idElemento)), ahora: e.nombreConjuro(toInt(olvidado.valor)),
            porque: `Intercambio de ${nombreClase.toLowerCase()} en su nivel ${e.nivelClase}`,
        });

    const nuevos = (tipo: string) => e.elecciones.filter((x) => x.tipo === tipo).length;
    const mismaAptitud = (x: { Nombre?: string; Extra?: string; }, y: { Nombre?: string; Extra?: string; }) =>
        normalizarTexto(y?.Nombre ?? '') === normalizarTexto(x?.Nombre ?? '') && normalizarTexto(y?.Extra ?? '') === normalizarTexto(x?.Extra ?? '');
    const delReciclaje = (e.reciclado?.aptitudesNuevas ?? []).map((a) => ({ Nombre: a.nombre, Extra: a.extra }));
    const especialesNuevos = (e.despues?.Claseas ?? []).filter((x) => ![...(e.antes?.Claseas ?? []), ...delReciclaje].some((y) => mismaAptitud(x, y)));
    if (especialesNuevos.length || nuevos('especial'))
        filas.push({ que: 'Aptitudes', antes: '—', ahora: especialesNuevos.map((x) => tieneTextoVisible(x.Extra) ? `${x.Nombre} (${x.Extra})` : x.Nombre).join(', '), porque: `${nombreClase} ${e.nivelClase}` });
    const idiomasNuevos = (e.despues?.Idiomas ?? []).filter((x) => !(e.antes?.Idiomas ?? []).some((y) => normalizarTexto(y?.Nombre ?? '') === normalizarTexto(x?.Nombre ?? ''))
        && normalizarTexto(x?.Nombre ?? '') !== normalizarTexto(e.reciclado?.idiomaNuevo ?? ''));
    if (idiomasNuevos.length)
        filas.push({ que: 'Idiomas', antes: '—', ahora: idiomasNuevos.map((x) => x.Nombre).join(', '), porque: `${nombreClase} ${e.nivelClase}` });
    const dominiosNuevos = (e.despues?.Dominios ?? []).filter((x) => !(e.antes?.Dominios ?? []).some((y) => normalizarTexto(y?.Nombre ?? '') === normalizarTexto(x?.Nombre ?? ''))
        && normalizarTexto(x?.Nombre ?? '') !== normalizarTexto(e.reciclado?.dominioNuevo ?? ''));
    if (dominiosNuevos.length)
        filas.push({ que: 'Dominios', antes: '—', ahora: dominiosNuevos.map((x) => x.Nombre).join(', '), porque: `${nombreClase} ${e.nivelClase}` });
    return filas;
}

/**
 * El paso donde enseñar un error de la API de la subida (`docs/publica/ERRORES.md`, «Sesiones y subida de nivel»), por su
 * `field` (y su `code`): la tirada, en los PG; la clase, en la clase; los conjuros y el intercambio, en el suyo; el
 * reciclaje (`reciclaje_no_valido`, `reciclaje_no_permitido`, `field` dentro de `reciclaje`), en «Reciclar»; lo demás (y lo
 * que no es de un paso de esta subida), en el resumen.
 */
export function campoDelErrorASubida(code: unknown, field: unknown, pasos: PasoSubida[]): PasoSubida {
    const campo = `${field ?? ''}`;
    const codigo = `${code ?? ''}`;
    const elegir = (paso: PasoSubida): PasoSubida => pasos.includes(paso) ? paso : 'resumen';
    if (codigo.startsWith('reciclaje_') || campo === 'reciclaje' || campo.startsWith('reciclaje.'))
        return elegir('reciclar');
    if (campo.startsWith('pg') || codigo === 'tirada_no_valida')
        return elegir('pg');
    if (codigo === 'intercambio_conjuro_no_valido')
        return elegir(pasos.includes('intercambio') ? 'intercambio' : 'conjuros');
    if (campo === 'ficha.colecciones.conjurosConocidos')
        return elegir('conjuros');
    if (campo === 'idClase' || campo === 'ficha.colecciones.clases' || ['multiclase_restringida', 'progresion_obligatoria_incompleta', 'clase_requiere_mutacion', 'subida_nivel_no_cuadra'].includes(codigo))
        return 'clase';
    return 'resumen';
}
