import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { leerMascotasPerdidas } from 'src/app/services/sesiones.service';
import { bajaDeNivel } from './experiencia-nivel';
import { FuenteMascota } from './mascota-cupos';
import {
    costeDeLaMascota, fichaSinLaMascota, mascotaDeLaFicha, perdidaDeLaMascota, pxTrasPerderLaMascota, sinMascotaNueva,
    tirarFortaleza,
} from './mascota-sesion';

// La mascota fuera del reciclaje (contrato: personajes.md, «La mascota fuera del reciclaje»; dictamen del máster de Rol del
// 2026-11-22: Manual del jugador, págs. 35 y 44-45).
describe('mascota-sesion', () => {
    const fuente = (idClase: number, nivel: number, px: number | null, po: number | null = 100): FuenteMascota => ({
        idClase, nombreClase: `Clase ${idClase}`, nivelActual: nivel, idEspecial: 10 + idClase, divisor: 1, ajuste: 0, aporta: nivel,
        lista: { id: idClase, nombre: '' },
        coste: { pxPerdidaPorNivel: px, cdPerdida: px === null ? null : 15, poObtener: po, horasObtener: 24, esperaReemplazo: px === null ? null : 'un año y un día' },
    });

    it('lo que cuesta: 200 PX por cada nivel de las clases que dan el familiar, sumados (hechicero 3 / mago 2: 1.000), una vez por clase', () => {
        const coste = costeDeLaMascota([fuente(1, 3, 200), fuente(2, 2, 200), fuente(2, 2, 200)]);
        expect(coste.tarifa).toBe(1000);
        expect(coste.cd).toBe(15);
        expect(coste.po).toBe(100);
        expect(coste.espera).toBe('un año y un día');
        // El compañero no cuesta PX ni po; sin dato (una caché de antes), nada.
        expect(costeDeLaMascota([fuente(3, 4, null, 0)])).toEqual({ tarifa: 0, cd: null, po: 0, horas: 24, espera: null });
        expect(costeDeLaMascota([{ ...fuente(4, 2, 200), coste: undefined }]).tarifa).toBe(0);
    });

    it('los PX: la tarifa, la mitad si supera la salvación, sin bajar de 0; y si le bajan del nivel que le dan sus PX', () => {
        // El ejemplo del libro: Hennet, hechicero 3 con 3.230 PX, supera la salvación y queda con 2.930, en 2.º nivel.
        expect(pxTrasPerderLaMascota(3230, 600, 'superada')).toBe(2930);
        expect(bajaDeNivel(3230, 2930)).toBeTrue();
        expect(pxTrasPerderLaMascota(3230, 600, 'fallada')).toBe(2630);
        expect(pxTrasPerderLaMascota(100, 600, 'fallada')).toBe(0);
        expect(pxTrasPerderLaMascota(0, 200, 'fallada')).toBe(0);
        expect(bajaDeNivel(4500, 4300)).toBeFalse();
    });

    it('«Tirar» es una ayuda: d20 + su Fortaleza contra la CD', () => {
        expect(tirarFortaleza(4, 15, 11)).toEqual({ d20: 11, total: 15, salvacion: 'superada' });
        expect(tirarFortaleza(4, 15, 10)).toEqual({ d20: 10, total: 14, salvacion: 'fallada' });
    });

    it('la ficha sin la mascota y sin lo que daba al amo (Alerta del familiar, sus aptitudes de amo); lo demás se queda', () => {
        const ficha = {
            familiar: { idMonstruo: 7 }, companero: { idMonstruo: 9 },
            colecciones: {
                dotes: [{ idDote: 1, idExtra: 0, origen: 'Familiar' }, { idDote: 1, idExtra: 0, origen: 'Nivel 1' }, { idDote: 2, idExtra: 0, origen: 'Nivel 3' }],
                especiales: [{ idEspecial: 50, idExtra: 3 }, { idEspecial: 60, idExtra: 0 }],
            },
        } as unknown as PersonajeCreateRequestDto;
        const conMascota = { colecciones: { dotes: ficha.colecciones!.dotes, especiales: ficha.colecciones!.especiales } } as unknown as PersonajeCreateRequestDto;
        const sinMascota = { colecciones: { dotes: [ficha.colecciones!.dotes![1], ficha.colecciones!.dotes![2]], especiales: [ficha.colecciones!.especiales![1]] } } as unknown as PersonajeCreateRequestDto;
        const sin = fichaSinLaMascota(ficha, conMascota, sinMascota, 'familiar');
        expect(sin.familiar).toBeUndefined();
        expect(sin.companero).toEqual({ idMonstruo: 9 } as any);
        expect((sin.colecciones?.dotes ?? []).map((d) => d.origen)).toEqual(['Nivel 1', 'Nivel 3']);
        expect((sin.colecciones?.especiales ?? []).map((e) => e.idEspecial)).toEqual([60]);
    });

    it('la subida no trae una mascota que no tenía: se obtiene después', () => {
        const ficha = { companero: { idMonstruo: 9 }, familiar: { idMonstruo: 7 } } as unknown as PersonajeCreateRequestDto;
        const sin = sinMascotaNueva(ficha, { familiar: { idMonstruo: 7 } } as unknown as PersonajeCreateRequestDto);
        expect(sin.companero).toBeUndefined();
        expect(sin.familiar).toEqual({ idMonstruo: 7 } as any);
    });

    it('las mascotas perdidas de la sesión (con su causa, si se puede revivir y su espera) y la de cada tipo', () => {
        const perdidas = leerMascotasPerdidas([
            { idEvento: 4, mascota: 'familiar', nombre: ' Ceniza ', idMonstruo: 7, idPlantilla: 0, causa: 'muerte', revivible: true, esperaReemplazo: 'un año y un día' },
            { idEvento: 5, mascota: 'companero', nombre: 'Risco', causa: 'liberacion', revivible: false, esperaReemplazo: null },
            { idEvento: 6, mascota: 'otra' },
        ]);
        expect(perdidas.length).toBe(2);
        expect(perdidas[0]).toEqual({ idEvento: 4, mascota: 'familiar', nombre: 'Ceniza', idMonstruo: 7, idPlantilla: 0, causa: 'muerte', revivible: true, esperaReemplazo: 'un año y un día' });
        expect(perdidaDeLaMascota(perdidas, 'companero')?.revivible).toBeFalse();
        expect(leerMascotasPerdidas(undefined)).toEqual([]);
        expect(mascotaDeLaFicha({ Companeros: [], Familiares: [{ Nombre: 'Mur' }] } as any, 'familiar')?.Nombre).toBe('Mur');
    });
});
