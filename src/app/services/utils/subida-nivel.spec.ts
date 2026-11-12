import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { ENTRADA_ENANO_CLERIGO_1 } from 'src/testing/subida-nivel-api';
import { claveBorradorSubida, fichaDeLaSubida, modConstitucionDeEntrada, puntosGolpeTrasSubida, tocaIntercambioConjuros } from './subida-nivel';
import { campoDelErrorASubida, PasoSubida } from './subida-nivel-vista';

const copia = <T>(x: T): T => JSON.parse(JSON.stringify(x));

describe('subida-nivel (la subida de nivel: PG, intercambio y la ficha que se manda)', () => {
    it('el borrador va por cuenta y personaje, sin pisar el de la creación', () => {
        expect(claveBorradorSubida('uid-a', 7)).toBe('fichas35.subidaNivel.draft.v1.uid-a.7');
        expect(claveBorradorSubida('uid-b', 7)).not.toBe(claveBorradorSubida('uid-a', 7));
        expect(claveBorradorSubida('uid-a', 7).startsWith('fichas35.nuevoPersonaje.')).toBeFalse();
    });

    it('el intercambio, desde el dato de la clase: el bardo en 5, 8, 11…; el hechicero en 4 y cada par', () => {
        const bardo = { Desde: 5, Cada: 3, Margen: 2 };
        const hechicero = { Desde: 4, Cada: 2, Margen: 2 };
        expect([4, 5, 6, 7, 8, 11, 14].filter((n) => tocaIntercambioConjuros(bardo, n))).toEqual([5, 8, 11, 14]);
        expect([3, 4, 5, 6, 7, 8, 20].filter((n) => tocaIntercambioConjuros(hechicero, n))).toEqual([4, 6, 8, 20]);
        expect(tocaIntercambioConjuros(null, 4)).toBeFalse();
    });

    it('PG del DG nuevo: tirada + Con, al menos 1, sin máximo (MJ p. 23)', () => {
        expect(puntosGolpeTrasSubida({ pgAntes: 28, modConAntes: 2, modConDespues: 2, tiradasAnteriores: [10, 6, 8], dgsSinTirada: 0, tirada: 7 }))
            .toEqual({ total: 37, delNivel: 9, retroactivo: 0, exacto: true });
        expect(puntosGolpeTrasSubida({ pgAntes: 10, modConAntes: -2, modConDespues: -2, tiradasAnteriores: [6], dgsSinTirada: 0, tirada: 1 }).delNivel).toBe(1);
        // Un nivel sin DG (una clase de monstruo) no suma.
        expect(puntosGolpeTrasSubida({ pgAntes: 10, modConAntes: 0, modConDespues: 0, tiradasAnteriores: [], dgsSinTirada: 0, tirada: null }).total).toBe(10);
    });

    it('una subida de Con suma a los niveles de antes con sus tiradas guardadas, sin bajar de 1 por DG (MJ p. 58)', () => {
        // Guerrero 3 con Con 13 (+1) que en el 4 sube a 14 (+2): 10 (máximo) + 1 + 6, cada uno con +1 más.
        const pg = puntosGolpeTrasSubida({ pgAntes: 10 + 1 + 2 + 7, modConAntes: 1, modConDespues: 2, tiradasAnteriores: [10, 1, 6], dgsSinTirada: 0, tirada: 5 });
        expect(pg).toEqual({ total: 20 + 3 + 7, delNivel: 7, retroactivo: 3, exacto: true });
        // Con −1 → 0: el dado de 1 ya contaba 1 (el mínimo), así que no gana nada; los demás, +1.
        const minimo = puntosGolpeTrasSubida({ pgAntes: 10, modConAntes: -1, modConDespues: 0, tiradasAnteriores: [8, 1], dgsSinTirada: 0, tirada: 4 });
        expect(minimo.retroactivo).toBe(1);
        // Sin las tiradas de antes (una ficha de antes del historial), la diferencia entera, y se avisa.
        const sinTiradas = puntosGolpeTrasSubida({ pgAntes: 30, modConAntes: 1, modConDespues: 2, tiradasAnteriores: [], dgsSinTirada: 3, tirada: 5 });
        expect(sinTiradas).toEqual({ total: 30 + 3 + 7, delNivel: 7, retroactivo: 3, exacto: false });
    });

    it('la ficha de la subida, sobre la entrada real de rol_dev: lo guardado se queda y solo cambia lo del nivel', () => {
        const entrada = copia(ENTRADA_ENANO_CLERIGO_1);
        expect(modConstitucionDeEntrada(entrada)).toBe(4);
        // Lo que arma el motor antes y después del nivel: Fuerza +1, una dote, un rango, la salvación de clase.
        const antes: PersonajeCreateRequestDto = copia(entrada);
        const despues: PersonajeCreateRequestDto = copia(entrada);
        despues.caracteristicas.fuerza.valor += 1;
        despues.personaje.ataqueBase = '+1';
        despues.colecciones!.dotes = [...(despues.colecciones!.dotes ?? []), { idDote: 999, idExtra: 0, origen: 'Dote por nivel: Clérigo nivel 2' }];
        despues.colecciones!.habilidades!.base![0].rangos = (despues.colecciones!.habilidades!.base![0].rangos ?? 0) + 2;
        despues.modificadores!.salvaciones!.fortaleza!.claseos = [{ valor: 3, origen: 'Clérigo nivel 2' }];
        // El motor no sabe leer lo de la mascota ni los orígenes: lo de antes, aunque no lo traiga, se queda.
        delete (antes as any).decisionesHomebrew;
        delete (despues as any).decisionesHomebrew;

        const ficha = fichaDeLaSubida({
            entrada, antes, despues, idClase: 4,
            nivel: { idClase: 4, nivelClase: 2, elecciones: [{ tipo: 'dote', idElemento: 999, idExtra: 0 }] },
            puntosGolpe: 20,
        });
        expect(ficha.colecciones?.clases).toEqual([{ idClase: 4, nivel: 2 }]);
        expect(ficha.caracteristicas.fuerza).toEqual({ ...entrada.caracteristicas.fuerza, valor: entrada.caracteristicas.fuerza.valor + 1 });
        expect(ficha.caracteristicas.constitucion).toEqual(entrada.caracteristicas.constitucion);
        expect(ficha.personaje.puntosGolpe).toBe(20);
        expect(ficha.personaje.ataqueBase).toBe('+1');
        expect(ficha.personaje.nombre).toBe(entrada.personaje.nombre);
        expect(ficha.colecciones?.dotes?.length).toBe((entrada.colecciones?.dotes?.length ?? 0) + 1);
        expect(ficha.colecciones?.habilidades?.base?.[0].rangos).toBe((entrada.colecciones?.habilidades?.base?.[0].rangos ?? 0) + 2);
        expect(ficha.modificadores?.salvaciones?.fortaleza?.claseos).toEqual([{ valor: 3, origen: 'Clérigo nivel 2' }]);
        expect(ficha.modificadores?.salvaciones?.fortaleza?.varios).toEqual(entrada.modificadores?.salvaciones?.fortaleza?.varios);
        expect(ficha.colecciones?.idiomas).toEqual(entrada.colecciones?.idiomas);
        expect(ficha.colecciones?.conjurosConocidos).toEqual(entrada.colecciones?.conjurosConocidos);
        expect((ficha as any).decisionesHomebrew).toEqual((entrada as any).decisionesHomebrew);
        // Los niveles guardados tal cual (con su orden por conocer) y el nuevo al final.
        expect(ficha.niveles?.length).toBe((entrada.niveles?.length ?? 0) + 1);
        expect(ficha.niveles?.[0]).toEqual(entrada.niveles![0]);
        expect(ficha.niveles?.[1]).toEqual({ idClase: 4, nivelClase: 2, elecciones: [{ tipo: 'dote', idElemento: 999, idExtra: 0 }] });
        // La entrada no cambia.
        expect(entrada).toEqual(ENTRADA_ENANO_CLERIGO_1);
    });

    it('el intercambio quita el conocido que se olvida y deja los copiados al libro', () => {
        const entrada = copia(ENTRADA_ENANO_CLERIGO_1);
        entrada.colecciones!.conjurosConocidos = [
            { idConjuro: 1, idClase: 8, copiado: false }, { idConjuro: 2, idClase: 8, copiado: false }, { idConjuro: 1, idClase: 9, copiado: true },
        ];
        const antes = copia(entrada);
        const despues = copia(entrada);
        const [, segundo, copiadoAlLibro] = antes.colecciones!.conjurosConocidos!;
        despues.colecciones!.conjurosConocidos = [segundo, copiadoAlLibro, { idConjuro: 3, idClase: 8, origen: 'Hechicero nivel 4 (intercambio)' }];
        const ficha = fichaDeLaSubida({
            entrada, antes, despues, idClase: 8, nivel: { idClase: 8, nivelClase: 1 }, puntosGolpe: 10,
            olvidados: [{ idConjuro: 1, idClase: 8 }],
        });
        expect(ficha.colecciones?.conjurosConocidos).toEqual([
            { idConjuro: 2, idClase: 8, copiado: false }, { idConjuro: 1, idClase: 9, copiado: true },
            { idConjuro: 3, idClase: 8, origen: 'Hechicero nivel 4 (intercambio)' },
        ]);
    });

    it('cada error de la API, en su paso (y lo demás, en el resumen)', () => {
        const pasos: PasoSubida[] = ['clase', 'incremento', 'pg', 'habilidades', 'conjuros', 'intercambio', 'resumen'];
        expect(campoDelErrorASubida('tirada_no_valida', 'pg.tiradas', pasos)).toBe('pg');
        expect(campoDelErrorASubida('multiclase_restringida', 'idClase', pasos)).toBe('clase');
        expect(campoDelErrorASubida('intercambio_conjuro_no_valido', 'ficha.niveles[4].elecciones[0]', pasos)).toBe('intercambio');
        expect(campoDelErrorASubida('subida_cambio_no_permitido', 'ficha.colecciones.conjurosConocidos', pasos)).toBe('conjuros');
        expect(campoDelErrorASubida('subida_cambio_no_permitido', 'ficha.personaje.nombre', pasos)).toBe('resumen');
        expect(campoDelErrorASubida('tirada_no_valida', 'pg.tirada', ['clase', 'resumen'])).toBe('resumen');
    });
});
