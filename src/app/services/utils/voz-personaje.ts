/**
 * La voz de los personajes la pone el navegador (Web Speech API, `speechSynthesis`): no pasa nada por la plataforma
 * ni por la API de Rol, y sin `speechSynthesis` la web enseña solo el texto. El tono y la velocidad cambian un poco
 * según la raza y el género, sin exagerar.
 */

export interface AjustesVoz {
    tono: number;
    velocidad: number;
}

const TONO_MIN = 0.75;
const TONO_MAX = 1.3;
const VELOCIDAD_MIN = 0.85;
const VELOCIDAD_MAX = 1.15;

// Por palabras del nombre de la raza (sin tildes y en minúsculas): grave y pausada, aguda y viva…
const RAZAS: { palabras: string[]; tono: number; velocidad: number }[] = [
    { palabras: ['enano', 'enana', 'duergar'], tono: -0.15, velocidad: -0.05 },
    { palabras: ['orco', 'orca', 'semiorco', 'semiorca', 'goliat', 'gigante', 'ogro', 'troll', 'minotauro', 'draco', 'dracon'], tono: -0.2, velocidad: -0.05 },
    { palabras: ['mediano', 'mediana', 'gnomo', 'gnoma', 'kobold', 'trasgo', 'goblin', 'duende', 'hada', 'pixie'], tono: 0.15, velocidad: 0.07 },
    { palabras: ['elfo', 'elfa', 'semielfo', 'semielfa', 'drow', 'aasimar'], tono: 0.05, velocidad: -0.04 },
    { palabras: ['tiefling', 'yuan-ti', 'liche', 'no muerto'], tono: -0.08, velocidad: -0.06 },
];

function normalizar(texto: string | null | undefined): string {
    return `${texto ?? ''}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function acotar(valor: number, minimo: number, maximo: number): number {
    return Math.round(Math.min(maximo, Math.max(minimo, valor)) * 100) / 100;
}

export function ajustesVoz(raza: string | null | undefined, genero: string | null | undefined): AjustesVoz {
    let tono = 1;
    let velocidad = 1;
    const nombreRaza = normalizar(raza);
    const ajusteRaza = RAZAS.find(r => r.palabras.some(p => nombreRaza.split(/[\s,()/-]+/).includes(p) || nombreRaza.startsWith(p)));
    if (ajusteRaza) {
        tono += ajusteRaza.tono;
        velocidad += ajusteRaza.velocidad;
    }
    const g = normalizar(genero);
    if (g.startsWith('femen') || g.startsWith('mujer') || g === 'f')
        tono += 0.1;
    else if (g.startsWith('mascul') || g.startsWith('hombre') || g === 'm')
        tono -= 0.05;
    return { tono: acotar(tono, TONO_MIN, TONO_MAX), velocidad: acotar(velocidad, VELOCIDAD_MIN, VELOCIDAD_MAX) };
}

/** La voz en español de España si la hay; si no, otra en español; si no, la del navegador (`null`). */
export function elegirVoz(voces: readonly SpeechSynthesisVoice[] | null | undefined): SpeechSynthesisVoice | null {
    const lista = Array.from(voces ?? []);
    const idioma = (v: SpeechSynthesisVoice) => `${v?.lang ?? ''}`.replace('_', '-').toLowerCase();
    return lista.find(v => idioma(v) === 'es-es' && v.localService)
        ?? lista.find(v => idioma(v) === 'es-es')
        ?? lista.find(v => idioma(v).startsWith('es'))
        ?? null;
}

/** El texto tal cual se lee: sin asteriscos de Markdown ni comillas de cita alrededor. */
export function textoParaLeer(frase: string | null | undefined): string {
    return `${frase ?? ''}`
        .replace(/[*_#`]/g, '')
        .replace(/^[\s«"“'‘]+|[\s»"”'’]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function sintesisDisponible(): boolean {
    return typeof window !== 'undefined'
        && 'speechSynthesis' in window
        && typeof (window as any).SpeechSynthesisUtterance === 'function';
}
