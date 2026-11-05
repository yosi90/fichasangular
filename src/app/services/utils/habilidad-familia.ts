import { toInt } from 'src/app/services/utils/normalizacion';

/**
 * Las familias de huecos de las habilidades con especialidad (Saber 1 a 5, Artesanía 1 a 3, Interpretar 1 a 3, Oficio 1
 * y 2) salen de los datos: son los huecos que admiten las mismas especialidades (`Extras` de `GET /habilidades`; cada
 * especialidad es de una sola familia). Sin especialidades, la habilidad no tiene familia. Lo usan los prerrequisitos de
 * rangos (`compararRangosHabilidad`) y el reparto de huecos y extras de la creación.
 */

/** Las especialidades que admite un hueco: los ids de sus `Extras` mayores que 0 (sin el «Elegir»). */
export function especialidadesDelHueco(extras: readonly { Id_extra?: unknown; }[] | null | undefined): number[] {
    return (extras ?? []).map((extra) => toInt(extra?.Id_extra, 0)).filter((id) => id > 0);
}

/** Si dos huecos son de la misma familia: admiten alguna especialidad en común. */
export function sonDeLaMismaFamilia(a: readonly number[] | null | undefined, b: readonly number[] | null | undefined): boolean {
    const otras = b ?? [];
    return (a ?? []).some((id) => id > 0 && otras.includes(id));
}
