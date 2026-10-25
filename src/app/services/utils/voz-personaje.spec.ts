import { elegirVozAutomatica, ordenarVoces } from './voz-personaje';

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

    it('con voces de ElevenLabs, nunca elige una de OpenAI aunque esa esté en español', () => {
        const conOpenAiEnEspanol = [voz('openai', 'nova', 'es', 'female'), voz('elevenlabs', 'brian', 'en', 'male'), voz('elevenlabs', 'sarah', 'en', 'female')];
        expect(elegirVozAutomatica(conOpenAiEnEspanol, 'Femenino')?.voz.id).toBe('sarah');
        expect(elegirVozAutomatica(conOpenAiEnEspanol, 'Masculino')?.voz.id).toBe('brian');
        expect(elegirVozAutomatica(conOpenAiEnEspanol, null)?.voz.id).toBe('brian');
    });

    it('sin ElevenLabs, las de OpenAI', () => {
        const soloOpenAi = [voz('openai', 'alloy', null, null), voz('openai', 'nova', 'es', 'female')];
        expect(elegirVozAutomatica(soloOpenAi, 'Femenino')?.voz.id).toBe('nova');
        expect(elegirVozAutomatica([voz('openai', 'alloy', null, null)], 'Masculino')?.voz.id).toBe('alloy');
    });

    it('para elegir, las de ElevenLabs van primero', () => {
        expect(ordenarVoces(voces).map(v => v.voz.id)).toEqual(['alice', 'lucia', 'emilio', 'alloy']);
    });

    it('con un proveedor preferido para la voz, empieza por el suyo (kit 1.54)', () => {
        const conNovaEnEspanol = [...voces, voz('openai', 'nova', 'es', 'female')];
        expect(elegirVozAutomatica(conNovaEnEspanol, 'Femenino', 'openai')?.voz.id).toBe('nova');
        expect(ordenarVoces(conNovaEnEspanol, 'openai').map(v => v.voz.id)).toEqual(['alloy', 'nova', 'alice', 'lucia', 'emilio']);
    });

    it('si el preferido no tiene voces, sigue la regla de siempre', () => {
        const soloElevenLabs = voces.filter(v => v.proveedor === 'elevenlabs');
        expect(elegirVozAutomatica(soloElevenLabs, 'Femenino', 'openai')?.voz.id).toBe('lucia');
        expect(elegirVozAutomatica(voces, 'Masculino', null)?.voz.id).toBe('emilio');
    });
});
