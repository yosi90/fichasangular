/** Una voz de la lista de la plataforma con su proveedor. */
export interface VozConProveedor {
    proveedor: 'elevenlabs' | 'openai';
    voz: { id: string; nombre: string; idioma: string | null; genero: string | null };
}

/**
 * El proveedor con el que empieza la voz: el preferido de la persona para la voz, si tiene voces (kit 1.54, `preferidos`
 * de `GET /v1/ia/estado`, solo cuando está lista); si no ha elegido, ElevenLabs si la cuenta tiene voces suyas
 * (propietario, 2026-10-23: es la voz por defecto); si no, el que haya.
 */
export function proveedorDeVozInicial<T extends VozConProveedor>(voces: T[], preferido?: VozConProveedor['proveedor'] | null): VozConProveedor['proveedor'] | null {
    if (preferido && voces.some(v => v.proveedor === preferido))
        return preferido;
    if (voces.some(v => v.proveedor === 'elevenlabs'))
        return 'elevenlabs';
    return voces[0]?.proveedor ?? null;
}

/**
 * «Automática»: una voz del proveedor inicial (`proveedorDeVozInicial`). Entre las suyas, una en español del género del
 * personaje; si no, cualquiera en español; si no, una del género; si no, la primera.
 */
export function elegirVozAutomatica<T extends VozConProveedor>(voces: T[], genero: string | null | undefined, preferido?: VozConProveedor['proveedor'] | null): T | null {
    const buscado = /^(f|mujer|femenin)/i.test(`${genero ?? ''}`.trim()) ? 'female' : /^(m|hombre|var)/i.test(`${genero ?? ''}`.trim()) ? 'male' : null;
    const inicial = proveedorDeVozInicial(voces, preferido);
    const candidatas = voces.filter(v => v.proveedor === inicial);
    const enEspanol = candidatas.filter(v => `${v.voz.idioma ?? ''}`.toLowerCase().startsWith('es'));
    const delGenero = (lista: T[]) => buscado ? lista.find(v => v.voz.genero === buscado) : undefined;
    return delGenero(enEspanol) ?? enEspanol[0] ?? delGenero(candidatas) ?? candidatas[0] ?? null;
}

/** Las voces para elegir, con las del proveedor inicial primero (`proveedorDeVozInicial`). */
export function ordenarVoces<T extends VozConProveedor>(voces: T[], preferido?: VozConProveedor['proveedor'] | null): T[] {
    const inicial = proveedorDeVozInicial(voces, preferido);
    return [...voces].sort((a, b) => Number(a.proveedor !== inicial) - Number(b.proveedor !== inicial));
}
