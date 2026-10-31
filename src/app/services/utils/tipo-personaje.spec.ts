import { leerTipoPersonaje, leerTipoYNivelPersonaje, nombreTipoPersonaje, textoNivelPersonaje, textoVd, tituloNuevoPersonaje } from './tipo-personaje';

describe('tipo-personaje', () => {
    it('lee el tipo del contrato y descarta lo demás', () => {
        expect(leerTipoPersonaje('pnj')).toBe('pnj');
        expect(leerTipoPersonaje(' PJ ')).toBe('pj');
        expect(leerTipoPersonaje('master')).toBeNull();
        expect(leerTipoPersonaje(null)).toBeNull();
    });

    it('el título de la creación dice qué se crea', () => {
        expect(tituloNuevoPersonaje(null)).toBe('Nuevo personaje');
        expect(tituloNuevoPersonaje('pj')).toBe('Nuevo personaje jugador');
        expect(tituloNuevoPersonaje('pnj')).toBe('Nuevo PNJ');
        expect(nombreTipoPersonaje(undefined)).toBe('Personaje jugador');
    });

    it('el nivel es el NEP de un PJ y el VD de un PNJ', () => {
        expect(textoNivelPersonaje({ tipo: 'pj', nep: 5, vd: null })).toBe('NEP 5');
        expect(textoNivelPersonaje({ tipo: 'pnj', nep: 11, vd: 18 })).toBe('VD 18');
        expect(textoNivelPersonaje({ tipo: 'pj', nep: null })).toBeNull();
        expect(textoNivelPersonaje({ tipo: 'pnj', vd: null })).toBeNull();
    });

    it('escribe los VD fraccionarios como en el Manual de monstruos', () => {
        expect(textoVd(0.5)).toBe('1/2');
        expect(textoVd(0.33)).toBe('1/3');
        expect(textoVd(18)).toBe('18');
        expect(textoVd(7.5)).toBe('7,5');
    });

    it('lee el tipo y el nivel de Firestore, de listado-personajes y de la ficha', () => {
        expect(leerTipoYNivelPersonaje({ tipo: 'pnj', nep: null, vd: 18 })).toEqual({ tipo: 'pnj', nep: null, vd: 18 });
        expect(leerTipoYNivelPersonaje({ Tipo: 'pj', Nep: 5 })).toEqual({ tipo: 'pj', nep: 5, vd: null });
        expect(leerTipoYNivelPersonaje({ nivelEfectivo: 7 })).toEqual({ tipo: 'pj', nep: 7, vd: null });
    });
});
