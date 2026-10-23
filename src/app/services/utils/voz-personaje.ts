/** Una voz de la lista de la plataforma con su proveedor. */
export interface VozConProveedor {
    proveedor: 'elevenlabs' | 'openai';
    voz: { id: string; nombre: string; idioma: string | null; genero: string | null };
}

/**
 * «Automática»: ElevenLabs si la cuenta tiene voces suyas (propietario, 2026-10-23: es la voz por defecto); si no, las
 * de OpenAI. Entre las del proveedor, una en español del género del personaje; si no, cualquiera en español; si no, una
 * del género; si no, la primera.
 */
export function elegirVozAutomatica<T extends VozConProveedor>(voces: T[], genero: string | null | undefined): T | null {
    const buscado = /^(f|mujer|femenin)/i.test(`${genero ?? ''}`.trim()) ? 'female' : /^(m|hombre|var)/i.test(`${genero ?? ''}`.trim()) ? 'male' : null;
    const deElevenLabs = voces.filter(v => v.proveedor === 'elevenlabs');
    const candidatas = deElevenLabs.length ? deElevenLabs : voces;
    const enEspanol = candidatas.filter(v => `${v.voz.idioma ?? ''}`.toLowerCase().startsWith('es'));
    const delGenero = (lista: T[]) => buscado ? lista.find(v => v.voz.genero === buscado) : undefined;
    return delGenero(enEspanol) ?? enEspanol[0] ?? delGenero(candidatas) ?? candidatas[0] ?? null;
}

/** Las voces para elegir, con las de ElevenLabs primero (la voz por defecto). */
export function ordenarVoces<T extends VozConProveedor>(voces: T[]): T[] {
    return [...voces].sort((a, b) => Number(a.proveedor !== 'elevenlabs') - Number(b.proveedor !== 'elevenlabs'));
}
