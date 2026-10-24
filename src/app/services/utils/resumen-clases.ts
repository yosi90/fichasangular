import { toNumber } from 'src/app/services/utils/normalizacion';

/** Las clases de un personaje en una línea para enseñar: «Clérigo (5), Mago (3)». Omite las que no tienen nombre o nivel. */
export function resumenClases(clases: { Nombre?: string | null; Nivel?: number | null; }[] | null | undefined): string {
    return (clases ?? [])
        .map((clase) => {
            const nombre = `${clase?.Nombre ?? ''}`.trim();
            const nivel = toNumber(clase?.Nivel);
            return nombre.length > 0 && nivel > 0 ? `${nombre} (${nivel})` : '';
        })
        .filter((item) => item.length > 0)
        .join(', ');
}
