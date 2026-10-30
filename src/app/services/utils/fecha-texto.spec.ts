import { textoFecha, textoFechaHora } from './fecha-texto';

describe('textoFecha', () => {
    it('escribe el día, el mes y el año en español', () => {
        expect(textoFecha('2026-10-30T12:00:00', 'Sin dato')).toBe('30 de octubre de 2026');
    });

    it('da el texto de reserva sin fecha o con una que no lo es', () => {
        for (const valor of [null, undefined, '', '  ', 'mañana'])
            expect(textoFecha(valor, 'Sin dato')).withContext(JSON.stringify(valor)).toBe('Sin dato');
    });
});

describe('textoFechaHora', () => {
    it('añade la hora en 24 horas, sin coma', () => {
        const texto = textoFechaHora('2026-10-30T18:05:00', 'Sin fecha');
        expect(texto).toMatch(/^30 de octubre de 2026 .*18:05$/);
        expect(texto).not.toContain(',');
    });

    it('da el texto de reserva sin fecha o con una que no lo es', () => {
        for (const valor of [null, undefined, '', 'x'])
            expect(textoFechaHora(valor, 'Sin fecha')).withContext(JSON.stringify(valor)).toBe('Sin fecha');
    });
});
