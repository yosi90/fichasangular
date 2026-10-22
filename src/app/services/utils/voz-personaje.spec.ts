import { ajustesVoz, elegirVoz, textoParaLeer } from './voz-personaje';

describe('voz-personaje', () => {
    it('cambia un poco el tono y la velocidad según la raza y el género, sin salirse de los límites', () => {
        expect(ajustesVoz('Humano', null)).toEqual({ tono: 1, velocidad: 1 });
        expect(ajustesVoz('Enano de las colinas', 'Masculino')).toEqual({ tono: 0.8, velocidad: 0.95 });
        expect(ajustesVoz('Mediano piesligeros', 'Femenino')).toEqual({ tono: 1.25, velocidad: 1.07 });
        expect(ajustesVoz('Semiorco', 'femenino').tono).toBe(0.9);
        const extremo = ajustesVoz('Gnomo', 'Femenino');
        expect(extremo.tono).toBeLessThanOrEqual(1.3);
        expect(extremo.velocidad).toBeLessThanOrEqual(1.15);
    });

    it('elige la voz de España, si no otra en español, si no ninguna', () => {
        const voz = (lang: string, localService = false) => ({ lang, localService, name: lang } as SpeechSynthesisVoice);
        expect(elegirVoz([voz('en-US'), voz('es-MX'), voz('es-ES'), voz('es-ES', true)])?.localService).toBeTrue();
        expect(elegirVoz([voz('en-US'), voz('es_MX')])?.lang).toBe('es_MX');
        expect(elegirVoz([voz('en-US')])).toBeNull();
        expect(elegirVoz(null)).toBeNull();
    });

    it('lee el texto sin Markdown ni comillas alrededor', () => {
        expect(textoParaLeer('«¡Por **Moradin**!»')).toBe('¡Por Moradin!');
        expect(textoParaLeer('"Hola,\n  forastero."')).toBe('Hola, forastero.');
        expect(textoParaLeer(null)).toBe('');
    });
});
