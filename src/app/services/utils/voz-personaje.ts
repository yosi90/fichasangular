/** Una voz de la lista de la plataforma con su proveedor. */
export interface VozConProveedor {
    proveedor: 'elevenlabs' | 'openai';
    voz: { id: string; nombre: string; idioma: string | null; genero: string | null };
}

/**
 * «Automática»: una voz en español del género del personaje, si la hay; si no, cualquiera en español; si no, la
 * primera. Las de ElevenLabs van antes, porque son las de la cuenta de la persona.
 */
export function elegirVozAutomatica<T extends VozConProveedor>(voces: T[], genero: string | null | undefined): T | null {
    const buscado = /^(f|mujer|femenin)/i.test(`${genero ?? ''}`.trim()) ? 'female' : /^(m|hombre|var)/i.test(`${genero ?? ''}`.trim()) ? 'male' : null;
    const ordenadas = [...voces].sort((a, b) => Number(a.proveedor !== 'elevenlabs') - Number(b.proveedor !== 'elevenlabs'));
    const enEspanol = ordenadas.filter(v => `${v.voz.idioma ?? ''}`.toLowerCase().startsWith('es'));
    return enEspanol.find(v => buscado && v.voz.genero === buscado) ?? enEspanol[0] ?? ordenadas[0] ?? null;
}
