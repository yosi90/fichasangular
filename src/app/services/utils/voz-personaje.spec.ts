import { elegirVozAutomatica } from './voz-personaje';

describe('elegirVozAutomatica', () => {
    const voz = (proveedor: 'elevenlabs' | 'openai', id: string, idioma: string | null, genero: string | null) =>
        ({ proveedor, voz: { id, nombre: id, idioma, genero } });
    const voces = [voz('openai', 'alloy', null, null), voz('elevenlabs', 'alice', 'en', 'female'), voz('elevenlabs', 'lucia', 'es', 'female'), voz('elevenlabs', 'emilio', 'es', 'male')];

    it('una en español del género del personaje', () => {
        expect(elegirVozAutomatica(voces, 'Femenino')?.voz.id).toBe('lucia');
        expect(elegirVozAutomatica(voces, 'Masculino')?.voz.id).toBe('emilio');
    });

    it('sin género, la primera en español; sin ninguna en español, la primera de ElevenLabs', () => {
        expect(elegirVozAutomatica(voces, null)?.voz.id).toBe('lucia');
        expect(elegirVozAutomatica([voces[0], voces[1]], 'Masculino')?.voz.id).toBe('alice');
        expect(elegirVozAutomatica([], 'Masculino')).toBeNull();
    });
});
