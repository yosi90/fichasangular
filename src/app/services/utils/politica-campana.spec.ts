import { leerPoliticaCompra, modoHomebrewDeCampana } from './politica-campana';
import { politicaTienda } from './tienda-equipo';

describe('politica-campana', () => {
    describe('modoHomebrewDeCampana (la regla de la creación y de la tienda de una sesión)', () => {
        // La regla del contrato (campanas.md, «Los tres modos de homebrew»), la misma que aplica la API.
        it('sin política (sin campaña o un PNJ) o con homebrew general sin límite, todo', () => {
            expect(modoHomebrewDeCampana(null)).toBe('unrestricted');
            expect(modoHomebrewDeCampana(undefined)).toBe('unrestricted');
            expect(modoHomebrewDeCampana({ permitirHomebrewGeneral: true, maxFuentesHomebrewGeneralesPorPersonaje: null })).toBe('unrestricted');
        });

        it('con homebrew general y un límite, hasta ese número de fuentes; con 0, nada', () => {
            expect(modoHomebrewDeCampana({ permitirHomebrewGeneral: true, maxFuentesHomebrewGeneralesPorPersonaje: 2 })).toBe('limited');
            expect(modoHomebrewDeCampana({ permitirHomebrewGeneral: true, maxFuentesHomebrewGeneralesPorPersonaje: 0 })).toBe('forbidden');
        });

        it('sin homebrew general, nada, traiga lo que traiga el límite', () => {
            expect(modoHomebrewDeCampana({ permitirHomebrewGeneral: false, maxFuentesHomebrewGeneralesPorPersonaje: 0 })).toBe('forbidden');
            expect(modoHomebrewDeCampana({ permitirHomebrewGeneral: false, maxFuentesHomebrewGeneralesPorPersonaje: null })).toBe('forbidden');
            expect(modoHomebrewDeCampana({ permitirHomebrewGeneral: false, maxFuentesHomebrewGeneralesPorPersonaje: 2 })).toBe('forbidden');
        });
    });

    describe('leerPoliticaCompra (`politicaCompra` de GET /personajes/{id})', () => {
        it('sin campaña, null', () => {
            expect(leerPoliticaCompra(null)).toBeNull();
            expect(leerPoliticaCompra(undefined)).toBeNull();
            expect(leerPoliticaCompra('no')).toBeNull();
        });

        it('lee los seis campos y la tienda la entiende como la política de la creación', () => {
            const politica = leerPoliticaCompra({
                permitirHomebrewGeneral: false, maxFuentesHomebrewGeneralesPorPersonaje: 0, permitirObjetosMagicos: false,
                permitirObjetosAMedida: true, precioMaximoPorObjeto: 500, permitirCopiarConjuros: false, nepMaximoPersonajeNuevo: 3,
            });
            expect(politica).toEqual({
                permitirHomebrewGeneral: false, maxFuentesHomebrewGeneralesPorPersonaje: 0, permitirObjetosMagicos: false,
                permitirObjetosAMedida: true, precioMaximoPorObjeto: 500, permitirCopiarConjuros: false,
            });
            expect(politicaTienda(politica)).toEqual({ objetosMagicos: false, aMedida: true, precioMaximo: 500, copiarConjuros: false });
            expect(modoHomebrewDeCampana(politica)).toBe('forbidden');
        });

        it('lo que falta, como la política permisiva', () => {
            expect(leerPoliticaCompra({})).toEqual({
                permitirHomebrewGeneral: true, maxFuentesHomebrewGeneralesPorPersonaje: null, permitirObjetosMagicos: true,
                permitirObjetosAMedida: true, precioMaximoPorObjeto: null, permitirCopiarConjuros: true,
            });
        });
    });
});
