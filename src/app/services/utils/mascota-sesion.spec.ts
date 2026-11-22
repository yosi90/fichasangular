import { PersonajeCreateRequestDto } from 'src/app/interfaces/personajes-api';
import { leerCostesDeLasMascotas, leerMascotasPerdidas } from 'src/app/services/sesiones.service';
import { bajaDeNivel } from './experiencia-nivel';
import { fichaSinLaMascota } from './mascota-al-dia';
import { CosteDeLaMascota } from 'src/app/interfaces/sesiones';
import {
    costeDeLaMascota, mascotaDeLaFicha, perdidaDeLaMascota, pxTrasLaSalvacion, sinMascotaNueva, tirarFortaleza,
} from './mascota-sesion';

// La mascota fuera del reciclaje (contrato: personajes.md, «La mascota fuera del reciclaje»; dictamen del máster de Rol del
// 2026-11-22: Manual del jugador, págs. 35 y 44-45).
describe('mascota-sesion', () => {
    it('el coste es el de la API (`mascotas` de la sesión; la regla, `utils/mascota_perdida.coste`); los PX con la salvación', () => {
        const deLaApi: CosteDeLaMascota = {
            mascota: 'familiar', tiene: true, cd: 15, pxAntes: 3230, pxSiFalla: 2630, pxSiSupera: 2930, bajaSiFalla: true, bajaSiSupera: true,
            poObtener: 100, horasObtener: 24, esperaReemplazo: 'un año y un día', tarifaPorClase: [],
        };
        expect(costeDeLaMascota([deLaApi], 'familiar')).toBe(deLaApi);
        expect(costeDeLaMascota([deLaApi], 'companero')).toBeNull();
        expect(costeDeLaMascota(undefined, 'familiar')).toBeNull();
        // El ejemplo del libro: Hennet supera la salvación y queda con 2.930, en 2.º nivel; sin salvación (o sin coste), los de ahora.
        expect(pxTrasLaSalvacion(deLaApi, 3230, 'superada')).toEqual({ px: 2930, baja: true });
        expect(pxTrasLaSalvacion(deLaApi, 3230, 'fallada')).toEqual({ px: 2630, baja: true });
        expect(pxTrasLaSalvacion(deLaApi, 3230, null)).toEqual({ px: 3230, baja: false });
        expect(pxTrasLaSalvacion(null, 3230, 'fallada')).toEqual({ px: 3230, baja: false });
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

    it('lee el coste de la sesión (`mascotas`): la CD del familiar, `null` en el compañero; lo que no es una mascota, fuera', () => {
        const costes = leerCostesDeLasMascotas([
            { mascota: 'familiar', tiene: true, cd: 15, pxAntes: 3230, pxSiFalla: 2630, pxSiSupera: 2930, bajaSiFalla: true, bajaSiSupera: true,
                poObtener: 100, horasObtener: 24, esperaReemplazo: 'un año y un día', tarifaPorClase: [{ idClase: 8, clase: 'Hechicero', nivel: 3, px: 600 }] },
            { mascota: 'companero', tiene: false, cd: null, pxAntes: 3230, pxSiFalla: 3230, pxSiSupera: 3230, poObtener: 0, horasObtener: 24, esperaReemplazo: '' },
            { mascota: 'montura' },
        ]);
        expect(costes.map((c) => [c.mascota, c.cd, c.pxSiFalla, c.esperaReemplazo])).toEqual([['familiar', 15, 2630, 'un año y un día'], ['companero', null, 3230, null]]);
        expect(costes[0].tarifaPorClase).toEqual([{ idClase: 8, clase: 'Hechicero', nivel: 3, px: 600 }]);
        expect(leerCostesDeLasMascotas(undefined)).toEqual([]);
    });
});
