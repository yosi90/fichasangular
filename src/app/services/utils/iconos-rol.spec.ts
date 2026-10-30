import { ICONOS_ROL, rutaIconoRol, tipoRolDeClase, tipoRolDeConjuro, tipoRolDeEquipo, tipoRolDeListado, tipoRolDeVentaja } from './iconos-rol';

describe('iconos-rol', () => {
    it('cada catálogo tiene su icono y su etiqueta, sin repetir dibujo', () => {
        const iconos = Object.values(ICONOS_ROL).map(i => i.icono);
        expect(new Set(iconos).size).toBe(iconos.length);
        expect(Object.values(ICONOS_ROL).every(i => i.etiqueta.length > 0)).toBeTrue();
    });

    it('los iconos y grupos de Companion, más Personaje y Campaña', () => {
        expect(ICONOS_ROL.raza).toEqual({ icono: 'elf-ear', grupo: 'personaje', etiqueta: 'Raza' });
        expect(ICONOS_ROL.fusion.grupo).toBe('incarnum');
        expect(ICONOS_ROL.personaje.icono).toBe('visored-helm');
        expect(ICONOS_ROL.campana).toEqual({ icono: 'tabletop-players', grupo: 'mundo', etiqueta: 'Campaña' });
        expect(rutaIconoRol('arma')).toBe('assets/iconos/game-icons/crossed-swords.svg');
    });

    it('las variantes salen de los datos', () => {
        expect(tipoRolDeClase({ Prestigio: true })).toBe('clase-prestigio');
        expect(tipoRolDeClase({ Prestigio: false })).toBe('clase');
        expect(tipoRolDeClase(null)).toBe('clase');
        expect(tipoRolDeConjuro({ Psionico: true })).toBe('poder-psionico');
        expect(tipoRolDeConjuro({ Psionico: false })).toBe('conjuro');
        expect(tipoRolDeVentaja({ Coste: 2 })).toBe('desventaja');
        expect(tipoRolDeVentaja({ Coste: -1 })).toBe('ventaja');
        expect(tipoRolDeVentaja({ Coste: 0 })).toBe('ventaja');
        expect(tipoRolDeEquipo('encantamiento')).toBe('aptitud-equipo');
    });

    it('cada listado del menú tiene su tipo', () => {
        expect(tipoRolDeListado('razas')).toBe('raza');
        expect(tipoRolDeListado('munición')).toBe('municion');
        expect(tipoRolDeListado('tipos de criatura')).toBe('tipo-criatura');
        expect(tipoRolDeListado('lo que sea')).toBeNull();
    });
});
