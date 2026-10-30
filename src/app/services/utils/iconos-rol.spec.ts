import { AUTORES_ICONOS_ROL, ICONOS_PROPIOS_ROL, ICONOS_ROL, LISTADOS_ROL, rutaIconoRol, tipoRolDeClase, tipoRolDeConjuro, tipoRolDeEquipo, tipoRolDeListado, tipoRolDeVentaja } from './iconos-rol';

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
        expect(tipoRolDeListado('constructor')).toBeNull();
        expect(LISTADOS_ROL['armaduras']).toEqual({ tipo: 'armadura', titulo: 'armaduras y escudos' });
        expect(Object.values(LISTADOS_ROL).every(l => l.titulo.length > 0)).toBeTrue();
    });

    it('cada icono tiene un solo autor en los créditos (o es propio), y no hay autores de iconos que no se usen', () => {
        const usados = Object.values(ICONOS_ROL).map(i => i.icono).sort();
        const acreditados = [...AUTORES_ICONOS_ROL.flatMap(a => a.iconos), ...ICONOS_PROPIOS_ROL].sort();
        expect(acreditados).toEqual(usados);
    });

    it('los dados de la pestaña Dados: el d6, el d8 y el d20 de Delapouite, el d10 y el d12 de Skoll y el d4 propio', () => {
        expect(ICONOS_ROL['dado-d20']).toEqual({ icono: 'dice-twenty-faces-twenty', grupo: 'equipo', etiqueta: 'd20' });
        const autor = (icono: string) => AUTORES_ICONOS_ROL.find(a => a.iconos.includes(icono))?.nombre ?? null;
        expect(autor(ICONOS_ROL['dado-d6'].icono)).toBe('Delapouite');
        expect(autor(ICONOS_ROL['dado-d8'].icono)).toBe('Delapouite');
        expect(autor(ICONOS_ROL['dado-d20'].icono)).toBe('Delapouite');
        expect(autor(ICONOS_ROL['dado-d10'].icono)).toBe('Skoll');
        expect(autor(ICONOS_ROL['dado-d12'].icono)).toBe('Skoll');
        expect(autor(ICONOS_ROL['dado-d4'].icono)).toBeNull();
        expect(ICONOS_PROPIOS_ROL).toEqual(['dado-d4']);
    });
});
