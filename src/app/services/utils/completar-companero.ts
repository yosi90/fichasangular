import { unirLista } from 'src/app/components/detalles/ficha/ficha';
import { PersonajeCreateHabilidadMascotaDto, PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { FilaDeLaMascota, NombresDeLaMascota, tituloDeLaMascota } from './mascota-al-dia';
import { toInt } from './normalizacion';
import { compararTexto } from './orden-texto';
import { companeroConLoDelMotor } from './subida-nivel';

/*
 * «Completar el compañero» (contrato: SESIONES_FRONT, «Lo que la mascota tiene pendiente, fuera de una subida»): lo que le
 * falta, la ficha que se guarda como corrección (solo cambia el compañero) y lo que cambia en sus rangos.
 */

/** El motivo de la corrección que lo guarda. */
export const MOTIVO_COMPLETAR_COMPANERO = 'lo que le faltaba al compañero';

/** Lo que le falta (`NuevoPersonajeService.loQueLeFaltaAlCompanero`), en frases: «2 puntos de habilidad», «1 dote (la de su 6.º DG)». */
export function frasesDeLoQueLeFalta(falta: { puntos: number; dotes: number[]; mejoras: number[]; trucos: number; } | null): string[] {
    if (!falta)
        return [];
    const dgs = (lista: number[]) => unirLista(lista.map((dg) => `${dg}.º`), 'y');
    const frases: string[] = [];
    if (falta.puntos > 0)
        frases.push(`${falta.puntos} ${falta.puntos === 1 ? 'punto' : 'puntos'} de habilidad`);
    if (falta.dotes.length > 0)
        frases.push(`${falta.dotes.length} ${falta.dotes.length === 1 ? 'dote' : 'dotes'} (${falta.dotes.length === 1 ? 'la' : 'las'} de su ${dgs(falta.dotes)} DG)`);
    if (falta.mejoras.length > 0)
        frases.push(`${falta.mejoras.length} ${falta.mejoras.length === 1 ? 'mejora' : 'mejoras'} de característica (${falta.mejoras.length === 1 ? 'la' : 'las'} de su ${dgs(falta.mejoras)} DG)`);
    if (falta.trucos > 0)
        frases.push(`${falta.trucos} ${falta.trucos === 1 ? 'truco adicional' : 'trucos adicionales'}`);
    return frases;
}

/**
 * La ficha que se guarda: la `entrada` con el compañero como lo deja el motor entre `antes` y `despues`
 * (`companeroConLoDelMotor`, también con sus rangos aunque no cambien sus DG). Nada más cambia.
 */
export function companeroCompletado(entrada: PersonajeCreateRequestDto, antes: PersonajeCreateRequestDto,
    despues: PersonajeCreateRequestDto): PersonajeCreateRequestDto {
    const ficha: PersonajeCreateRequestDto = JSON.parse(JSON.stringify(entrada));
    if (ficha.companero && despues.companero)
        ficha.companero = companeroConLoDelMotor(ficha.companero, antes.companero, despues.companero, { conSusRangos: true });
    return ficha;
}

/**
 * Los rangos del compañero que cambian entre la `entrada` y la `ficha`, en una fila de «Lo que cambia» («Avistar 4 → 5»),
 * con el título de las demás filas de la mascota (`tituloDeLaMascota`) y los nombres del motor (`nombresDeLoQueEligeLaMascota`).
 */
export function rangosQueCambian(entrada: PersonajeCreateRequestDto, ficha: PersonajeCreateRequestDto,
    nombres: Pick<NombresDeLaMascota, 'habilidad'>): FilaDeLaMascota[] {
    const nombre = (id: number) => nombres.habilidad(id);
    if (!entrada.companero || !ficha.companero)
        return [];
    const clave = (h: PersonajeCreateHabilidadMascotaDto) => `${toInt(h.idHabilidad)}|${toInt(h.idExtra)}`;
    const antes = new Map((entrada.companero.habilidades ?? []).map((h) => [clave(h), h] as const));
    const ahora = new Map((ficha.companero.habilidades ?? []).map((h) => [clave(h), h] as const));
    const cambios = [...new Set([...antes.keys(), ...ahora.keys()])]
        .map((k) => ({ k, a: toInt(antes.get(k)?.rangos), d: toInt(ahora.get(k)?.rangos), h: ahora.get(k) ?? antes.get(k)! }))
        .filter((c) => c.a !== c.d)
        .sort((x, y) => compararTexto(nombre(toInt(x.h.idHabilidad)), nombre(toInt(y.h.idHabilidad))));
    if (cambios.length < 1)
        return [];
    const titulo = `${tituloDeLaMascota('Compañero animal', ficha.companero)}: rangos`;
    return [{
        que: titulo,
        antes: cambios.map((c) => `${nombre(toInt(c.h.idHabilidad))} ${c.a}`).join(', '),
        ahora: cambios.map((c) => `${nombre(toInt(c.h.idHabilidad))} ${c.d}`).join(', '),
    }];
}
