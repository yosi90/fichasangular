import { SelectorPuntosGolpeModalComponent } from './selector-puntos-golpe-modal.component';

describe('SelectorPuntosGolpeModalComponent', () => {
    it('emite recalcular solo cuando hay tiradas restantes', () => {
        const component = new SelectorPuntosGolpeModalComponent();
        const recalcularSpy = jasmine.createSpy('recalcular');
        component.recalcular.subscribe(recalcularSpy);
        component.resultado = {
            total: 22,
            maximo: 30,
            detalle: {
                constitucionAplicada: true,
                modificadorConstitucion: 2,
                tiradasAleatorias: 1,
                dgsRaciales: 1,
                nivelesClase: 1,
                bonoPlanoDotes: 0,
                bonoPorDadoClaseDotes: 0,
                flags: {
                    dadosGolpe: true,
                    dgsRacialesExtra: true,
                    plantillasDgsAdicionales: false,
                    plantillasAumentoReduccionDgs: false,
                    plantillasActualizacionDgsRazaClase: false,
                    dotesSumaAdicionalDgs: false,
                },
            },
        };

        component.tiradasRestantes = 0;
        component.onRecalcular();
        expect(recalcularSpy).not.toHaveBeenCalled();

        component.tiradasRestantes = 1;
        component.onRecalcular();
        expect(recalcularSpy).toHaveBeenCalledTimes(1);
    });

    it('emite siguiente cuando hay resultado', () => {
        const component = new SelectorPuntosGolpeModalComponent();
        const siguienteSpy = jasmine.createSpy('siguiente');
        component.siguiente.subscribe(siguienteSpy);

        component.resultado = null;
        component.onSiguiente();
        expect(siguienteSpy).not.toHaveBeenCalled();

        component.resultado = {
            total: 22,
            maximo: 30,
            detalle: {
                constitucionAplicada: true,
                modificadorConstitucion: 2,
                tiradasAleatorias: 1,
                dgsRaciales: 1,
                nivelesClase: 1,
                bonoPlanoDotes: 0,
                bonoPorDadoClaseDotes: 0,
                flags: {
                    dadosGolpe: true,
                    dgsRacialesExtra: true,
                    plantillasDgsAdicionales: false,
                    plantillasAumentoReduccionDgs: false,
                    plantillasActualizacionDgsRazaClase: false,
                    dotesSumaAdicionalDgs: false,
                },
            },
        };

        component.onSiguiente();
        expect(siguienteSpy).toHaveBeenCalledTimes(1);
    });

    it('deshabilita recalcular cuando no hay tiradas aleatorias', () => {
        const component = new SelectorPuntosGolpeModalComponent();
        component.tiradasRestantes = 2;
        component.resultado = {
            total: 18,
            maximo: 18,
            detalle: {
                constitucionAplicada: true,
                modificadorConstitucion: 0,
                tiradasAleatorias: 0,
                dgsRaciales: 0,
                nivelesClase: 1,
                bonoPlanoDotes: 0,
                bonoPorDadoClaseDotes: 0,
                flags: {
                    dadosGolpe: true,
                    dgsRacialesExtra: false,
                    plantillasDgsAdicionales: false,
                    plantillasAumentoReduccionDgs: false,
                    plantillasActualizacionDgsRazaClase: false,
                    dotesSumaAdicionalDgs: false,
                },
            },
        };

        expect(component.puedeRecalcular).toBeFalse();
        expect(component.textoRecalcular).toContain('Sin tiradas');
    });
});
