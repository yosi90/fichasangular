import { etiquetaManual } from './manual-mapper';

describe('manual-mapper', () => {
    it('enseña el manual con su página, sin página si no la dice, y el texto de «sin manual» si falta', () => {
        expect(etiquetaManual({ Id: 1, Nombre: 'Manual del jugador 1', Pagina: 118 })).toBe('Manual del jugador 1 (p. 118)');
        expect(etiquetaManual({ Id: 1, Nombre: ' Manual ', Pagina: 0 })).toBe('Manual');
        expect(etiquetaManual(null)).toBe('Sin manual');
        expect(etiquetaManual({ Id: 0, Nombre: '', Pagina: 4 }, 'No disponible')).toBe('No disponible');
    });
});
