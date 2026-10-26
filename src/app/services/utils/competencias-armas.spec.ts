import { armasDeGrupos, competenciasDeDotes } from './competencias-armas';
import { clavesDeEntidades } from './identidad-prerrequisitos';

const ARMAS = [
    { Id: 30, Nombre: 'Espada larga', Id_tipo_arma: 2 },
    { Id: 12, Nombre: 'Maza ligera', Id_tipo_arma: 1 },
    { Id: 70, Nombre: 'Espada bastarda', Id_tipo_arma: 3 },
];
const GRUPOS = [
    { Id: 1, Nombre: 'Todas las armas sencillas', Id_tipo_arma: 1 },
    { Id: 2, Nombre: 'Todas las armas marciales', Id_tipo_arma: 2 },
    { Id: 4, Nombre: 'Armas naturales propias', Id_tipo_arma: null },
];

describe('competencias-armas (MJ cap. 5)', () => {
    it('la competencia con todas las armas marciales da competencia con cada arma marcial (el guerrero, con la espada larga)', () => {
        const armas = armasDeGrupos([{ id: 2, nombre: 'Todas las armas marciales' }], GRUPOS, ARMAS);

        expect(armas).toEqual([{ id: 30, nombre: 'Espada larga' }]);
    });

    it('un grupo se reconoce también por su nombre y un grupo sin tipo de arma no da ninguna', () => {
        expect(armasDeGrupos([{ id: null, nombre: 'todas las armas sencillas' }], GRUPOS, ARMAS)).toEqual([{ id: 12, nombre: 'Maza ligera' }]);
        expect(armasDeGrupos([{ id: 4, nombre: 'Armas naturales propias' }], GRUPOS, ARMAS)).toEqual([]);
    });

    it('Competencia con arma exótica da competencia con el arma elegida como extra; con arma sencilla, el grupo', () => {
        const exotica: any = {
            Dote: { Id: 301, Nombre: 'Competencia con arma exótica', Competencias_otorgadas: { Armas: [{ Id: 0, Nombre: 'Elegir', Arma_comodin: 'elegir' }], Grupos_arma: [] } },
            Contexto: { Entidad: 'personaje', Id_personaje: 0, Id_extra: 70, Extra: 'Espada bastarda' },
        };
        const sencilla: any = {
            Dote: { Id: 303, Nombre: 'Competencia con arma sencilla', Competencias_otorgadas: { Armas: [], Grupos_arma: [{ Id: 1, Nombre: 'Todas las armas sencillas' }] } },
            Contexto: { Entidad: 'personaje', Id_personaje: 0, Id_extra: 0, Extra: '' },
        };

        const resultado = competenciasDeDotes([exotica, sencilla]);

        expect(resultado.armas).toEqual([{ id: 70, nombre: 'Espada bastarda' }]);
        expect(resultado.grupos).toEqual([{ id: 1, nombre: 'Todas las armas sencillas' }]);
    });

    it('las competencias de la raza se comparan por su clave: { Id, Nombre } pasa a { id, nombre }', () => {
        expect(clavesDeEntidades([{ Id: 30, Nombre: 'Espada larga' }, { Id: 0, Nombre: '' }])).toEqual([{ id: 30, nombre: 'Espada larga' }]);
    });
});
