import { leerPoliticaCompra, modoHomebrewDeCampana } from './politica-campana';
import { politicaTienda } from './tienda-equipo';

describe('politica-campana', () => {
    describe('modoHomebrewDeCampana (la regla de la creación y de la tienda de una sesión)', () => {
        it('sin política o con homebrew general, todo', () => {
            expect(modoHomebrewDeCampana(null)).toBe('unrestricted');
            expect(modoHomebrewDeCampana(undefined)).toBe('unrestricted');
            expect(modoHomebrewDeCampana({ permitirHomebrewGeneral: true, maxFuentesHomebrewGeneralesPorPersonaje: 0 })).toBe('unrestricted');
        });

        it('sin homebrew general: nada con el límite a 0 o sin él, y hasta el límite con uno mayor', () => {
            expect(modoHomebrewDeCampana({ permitirHomebrewGeneral: false, maxFuentesHomebrewGeneralesPorPersonaje: 0 })).toBe('forbidden');
            expect(modoHomebrewDeCampana({ permitirHomebrewGeneral: false, maxFuentesHomebrewGeneralesPorPersonaje: null })).toBe('forbidden');
            expect(modoHomebrewDeCampana({ permitirHomebrewGeneral: false, maxFuentesHomebrewGeneralesPorPersonaje: 2 })).toBe('limited');
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
