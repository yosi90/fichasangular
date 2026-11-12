import { AppToastService } from 'src/app/services/app-toast.service';
import { toArray, toText } from 'src/app/services/utils/normalizacion';

/**
 * Una regla de la política de la campaña que una escritura no ha tenido que cumplir, porque la hace el máster con
 * `overrideReglasCampana` o es un PNJ (`reglasIgnoradas` de la API, desde el 2026-11-12; `docs/publica/endpoints/personajes.md`,
 * «Las reglas que se salta el máster o un PNJ»). `mensaje` es la frase del error que habría dado.
 */
export interface ReglaIgnorada {
    code: string | null;
    mensaje: string;
    field: string | null;
}

/** La cabecera del aviso (propietario, 2026-11-12). */
export const AVISO_REGLAS_IGNORADAS = 'Con esa decisión el personaje ha ignorado las restricciones de tu campaña:';

/** Lo que se lee para leerlo con calma: más que un aviso corto. */
const DURACION_AVISO_MS = 10000;

/** `reglasIgnoradas` de una respuesta: las que traen frase; sin el campo (una API anterior), ninguna. */
export function leerReglasIgnoradas(valor: unknown): ReglaIgnorada[] {
    return toArray(valor)
        .map((regla: any) => ({
            code: toText(regla?.code).trim() || null,
            mensaje: toText(regla?.mensaje).trim(),
            field: toText(regla?.field).trim() || null,
        }))
        .filter((regla) => regla.mensaje.length > 0);
}

/**
 * Tras una escritura que se ha saltado reglas de la campaña, el aviso: la cabecera y las razones en lista. Sin reglas, nada.
 * Lo llaman los clientes de esas rutas (`PersonajeService` y `SesionesService`), así que vale para cualquier pantalla.
 */
export function avisarReglasIgnoradas(toasts: AppToastService | null | undefined, reglas: readonly ReglaIgnorada[]): void {
    if (!toasts || reglas.length < 1)
        return;
    const lista = reglas.map((regla) => regla.mensaje);
    toasts.showInfo(AVISO_REGLAS_IGNORADAS, {
        category: 'campanas',
        lista,
        durationMs: DURACION_AVISO_MS,
        dedupeKey: `reglas-ignoradas:${lista.join('|')}`,
    });
}
