import { extraConTipoArma, extraDeArmadura, extraDeDote } from './extras-dotes';

describe('extras-dotes', () => {
    it('un grupo de armas lleva el tipo que cubre (las competencias por grupo lo necesitan, también en la subida)', () => {
        expect(extraConTipoArma({ Id: 2, Nombre: ' Todas las armas marciales ', Tipo_arma: { Id: 2 } }))
            .toEqual({ Id: 2, Nombre: 'Todas las armas marciales', Id_tipo_arma: 2 });
        expect(extraConTipoArma({ Id: 9, Nombre: 'Armas naturales', Tipo_arma: null }))
            .toEqual({ Id: 9, Nombre: 'Armas naturales', Id_tipo_arma: null });
    });

    it('una armadura dice si es un escudo (las dotes de escudo solo ofrecen escudos, también en la creación)', () => {
        expect(extraDeArmadura({ Id: 30, Nombre: 'Escudo grande de acero', Es_escudo: true }))
            .toEqual({ Id: 30, Nombre: 'Escudo grande de acero', Es_escudo: true });
        expect(extraDeArmadura({ Id: 3, Nombre: 'Cota de mallas' }).Es_escudo).toBeFalse();
    });

    it('lo demás, su id y su nombre', () => {
        expect(extraDeDote({ Id: 4, Nombre: 'Evocación' })).toEqual({ Id: 4, Nombre: 'Evocación' });
        expect(extraDeDote(null)).toEqual({ Id: 0, Nombre: '' });
    });
});
