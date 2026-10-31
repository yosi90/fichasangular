import { IDA_Y_VUELTA_MONSTRUOS } from 'src/testing/ida-y-vuelta-monstruos';
import { normalizeMonstruoDetalle } from './monstruo-mapper';
import {
    CAMPOS_MONSTRUO,
    PASOS_MONSTRUO,
    camposCambiadosMonstruo,
    construirMonstruoRequest,
    listasDesdeMonstruo,
    listasMonstruoVacias,
    valorDesdeMonstruo,
    valorMonstruoNuevo,
} from './monstruo-formulario';

describe('monstruo-formulario', () => {
    const uid = (() => { let n = 0; return () => `f${++n}`; })();
    const cuerpoDe = (id: number) => {
        const monstruo = normalizeMonstruoDetalle(IDA_Y_VUELTA_MONSTRUOS.find((item) => item.id === id)!.get, 1);
        return construirMonstruoRequest(valorDesdeMonstruo(monstruo), listasDesdeMonstruo(monstruo, uid));
    };

    it('cada campo está en uno de los seis pasos', () => {
        Object.values(CAMPOS_MONSTRUO).forEach((campo) => expect(campo.paso).toBeLessThan(PASOS_MONSTRUO.length));
    });

    it('cada escalar del alta tiene su campo (para llevar el error de la API a su paso)', () => {
        Object.keys(valorMonstruoNuevo()).forEach((campo) => expect(CAMPOS_MONSTRUO[campo]).withContext(campo).toBeDefined());
    });

    it('la característica sin valor (el «—») va como null y el resto como entero', () => {
        const horror = cuerpoDe(58);
        expect(horror.monstruo.constitucion).toBeNull();
        expect(horror.monstruo.sabiduria).toBe(20);
        expect(horror.monstruo.resistencia_conjuros).toBe('20');
        expect(horror.monstruo.reduccion_dano).toBe('');
    });

    it('los textos vacíos o de relleno van vacíos y el espacio con medios', () => {
        const valor = { ...valorMonstruoNuevo(), ataques: '  Mordisco +4 ', tesoro: null, espacio: '2.5' as unknown as number };
        const cuerpo = construirMonstruoRequest(valor, listasMonstruoVacias());
        expect(cuerpo.monstruo.ataques).toBe('Mordisco +4');
        expect(cuerpo.monstruo.tesoro).toBe('');
        expect(cuerpo.monstruo.espacio).toBe(2.5);
        expect(cuerpo.monstruo.id_maniobrabilidad).toBeNull();
    });

    it('lee los niveles de clase y los alineamientos que pide, con null donde la lectura no da nada', () => {
        const oropel = cuerpoDe(27);
        expect(oropel.alineamientos_requeridos.familiar.length).toBeGreaterThan(0);
        expect(oropel.niveles_clase.every((nivel) => nivel.id_clase > 0)).toBeTrue();
        expect(oropel.niveles_clase.every((nivel) => (nivel.id_dote ?? 0) > 0 && (nivel.id_plantilla ?? 0) > 0)).toBeTrue();
        expect(oropel.sortilegas.length).toBe(1);
        // El lobo es compañero del druida sin dote ni plantilla: van como null.
        const lobo = cuerpoDe(48);
        expect(lobo.niveles_clase.some((nivel) => nivel.id_dote === null && nivel.id_plantilla === null)).toBeTrue();
    });

    it('dice qué campos cambian, sin contar el orden de las listas', () => {
        const antes = cuerpoDe(4);
        const ahora = JSON.parse(JSON.stringify(antes));
        ahora.dotes.reverse();
        expect(camposCambiadosMonstruo(antes, ahora)).toEqual([]);
        ahora.monstruo.tesoro = 'Ninguno';
        ahora.alineamientos_requeridos.companero = [1];
        ahora.niveles_clase = [];
        expect(camposCambiadosMonstruo(antes, ahora)).toEqual(['tesoro', 'alineamientos_requeridos', 'niveles_clase']);
    });
});
