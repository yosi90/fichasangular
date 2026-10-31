import { normalizeArma } from '../arma.service';
import { normalizeArmadura } from '../armadura.service';
import {
    DANO_VALIDO,
    cuerpoDeArma,
    cuerpoDeArmadura,
    danoNormalizado,
    problemaDeArma,
    problemaDeArmadura,
    propiedadesDeArma,
    valoresDeArma,
    valoresDeArmadura,
    valoresVacios,
} from './equipo-formulario';

describe('equipo-formulario', () => {
    it('el daño: dados, cifras y las dos cabezas de un arma doble, como la API', () => {
        ['1d8', '2d6', '1', '1d8/1d6', '1d10'].forEach((dano) => expect(DANO_VALIDO.test(dano)).withContext(dano).toBeTrue());
        ['d8', '0d6', '1d8/1d6/1d4', 'mucho', '1d'].forEach((dano) => expect(DANO_VALIDO.test(dano)).withContext(dano).toBeFalse());
        expect(danoNormalizado(' 1D8 ')).toBe('1d8');
        expect(danoNormalizado('  ')).toBeNull();
    });

    it('sin multiplicador no manda rango ni segunda cabeza; la segunda cabeza, solo en las dobles', () => {
        const valores = { ...valoresVacios(5), critico_rango: 19, critico_multiplicador_2: 3 };
        expect(cuerpoDeArma(valores, []).arma).toEqual(jasmine.objectContaining({ critico_rango: null, critico_multiplicador_2: null }));
        const doble = { ...valores, critico_multiplicador: 2, doble: true };
        expect(cuerpoDeArma(doble, []).arma).toEqual(jasmine.objectContaining({ critico_rango: 19, critico_multiplicador: 2, critico_multiplicador_2: 3 }));
        expect(cuerpoDeArma({ ...doble, doble: false }, []).arma.critico_multiplicador_2).toBeNull();
    });

    it('las propiedades: sin las filas vacías y avisa de una repetida', () => {
        const filas = [{ uid: 'a', id_propiedad: 2, valor: 2 }, { uid: 'b', id_propiedad: null, valor: null }];
        expect(cuerpoDeArma(valoresVacios(), filas).propiedades).toEqual([{ id_propiedad: 2, valor: 2 }]);
        expect(problemaDeArma({ ...valoresVacios(), id_tipo_arma: 2, id_tipo_dano: 3 }, [...filas, { uid: 'c', id_propiedad: 2, valor: null }])?.campo).toBe('propiedades');
    });

    it('un arma doble con una sola cabeza, o una que no lo es con dos, se avisa en su campo', () => {
        const conTipos = { ...valoresVacios(), id_tipo_arma: 2, id_tipo_dano: 3 };
        expect(problemaDeArma({ ...conTipos, doble: true, dano_mediano: '1d8' }, [])?.campo).toBe('dano_mediano');
        expect(problemaDeArma({ ...conTipos, dano_pequeno: '1d6/1d4' }, [])?.campo).toBe('dano_pequeno');
        const tipos = { id_tipo_arma: 2, id_tipo_dano: 0 };
        expect(problemaDeArma({ ...valoresVacios(), ...tipos, doble: true, dano_mediano: '1d8/1d6' }, [])).toBeNull();
        expect(problemaDeArma({ ...valoresVacios(), id_tipo_dano: 3 }, [])?.campo).toBe('id_tipo_arma');
    });

    it('un arma de la API vuelve a su mismo cuerpo: el material y el manejo nulos siguen nulos', () => {
        const arma = normalizeArma({
            Id: 3, Nombre: 'Rayo', Descripcion: ' ', Origen_descripcion: 'srd', Manual: { Id: 54, Nombre: 'MJ', Pagina: 0 },
            Tipo_dano: { Id: 6, Nombre: 'Mágico' }, Tipo_arma: { Id: 4, Nombre: 'Especial' }, Manejo: null, A_distancia: true,
            Precio: 0, Material: null, Tamano: { Id: 0, Nombre: 'Depende' }, Peso: 0, Incremento_distancia: 0,
            Propiedades: [{ Id: 2, Nombre: 'Desarmar', Valor: 4 }], Oficial: true,
        });
        const cuerpo = cuerpoDeArma(valoresDeArma(arma), propiedadesDeArma(arma, () => 'x'));
        expect(cuerpo.arma).toEqual(jasmine.objectContaining({
            descripcion: '', origen_descripcion: 'srd', id_manejo: null, id_material: null, id_tamano: 0, a_distancia: true,
        }));
        expect(cuerpo.propiedades).toEqual([{ id_propiedad: 2, valor: 4 }]);
    });

    it('un escudo no lleva peso de armadura y una armadura no lleva tipo de escudo', () => {
        const escudo = normalizeArmadura({
            Id: 14, Nombre: 'Rodela', Manual: { Id: 54, Pagina: 123 }, Ca: 1, Bon_des: null, Penalizador: -1, Precio: 15,
            Material: { Id: 4, Nombre: 'Acero' }, Peso_armadura: null, Tipo_escudo: { Id: 1, Nombre: 'Broquel' }, Peso: 5,
            Tamano: { Id: 5, Nombre: 'Mediano' }, Fallo_arcano: 5, Es_escudo: true, Oficial: true,
        });
        const valores = { ...valoresDeArmadura(escudo), id_peso_armadura: 2 };
        expect(cuerpoDeArmadura(valores).armadura).toEqual(jasmine.objectContaining({
            es_escudo: true, id_peso_armadura: null, id_tipo_escudo: 1, bon_des: null, tiempo_poner: null,
        }));
        expect(cuerpoDeArmadura({ ...valores, es_escudo: false }).armadura).toEqual(jasmine.objectContaining({
            id_peso_armadura: 2, id_tipo_escudo: null,
        }));
    });

    it('una armadura pide su peso y un escudo su tipo', () => {
        expect(problemaDeArmadura(valoresVacios())?.campo).toBe('id_peso_armadura');
        expect(problemaDeArmadura({ ...valoresVacios(), es_escudo: true })?.campo).toBe('id_tipo_escudo');
        expect(problemaDeArmadura({ ...valoresVacios(), es_escudo: true, id_tipo_escudo: 1 })).toBeNull();
    });
});
