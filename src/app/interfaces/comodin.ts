/**
 * «Elegir» (falta escoger algo) o «Cualquiera» (vale cualquiera). La API los marca con una sola convención (contrato
 * del 2026-10-24, `docs/publica/SIN_RELLENO_FRONT.md`): `<campo>_comodin` al lado de un campo, `Comodin` en cada fila
 * de un listado de catálogo y `extraComodin`/`espaComodin` en la ficha. `null` (o, en la RTDB, que no esté) es que no
 * es un comodín.
 */
export type Comodin = 'elegir' | 'cualquiera';
