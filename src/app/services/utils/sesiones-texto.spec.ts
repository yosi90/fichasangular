import { leerHistorial, leerRespuestaSesion } from 'src/app/services/sesiones.service';
import { SubidaNivelPuertaService } from 'src/app/services/subida-nivel-puerta.service';
import { respuestaSesiones } from 'src/testing/sesiones-api';
import { barraExperiencia, cambiosSesion, fechaSesion, pxConPenalizacion, tituloSesion } from './sesiones-texto';

describe('sesiones-texto', () => {
    it('la barra de PX: lo que lleva del nivel actual al siguiente', () => {
        const barra = barraExperiencia({ px: 2640, nivel: 3, pxNivelActual: 3000 - 1000, pxSiguienteNivel: 3000, puedeSubir: false, nivelesPorSubir: 0, sesionAbierta: null });
        expect(barra.texto).toBe('2.640 / 3.000 PX');
        expect(barra.niveles).toBe('nivel 3 → 4');
        expect(barra.porcentaje).toBe(64);
        expect(barra.puedeSubir).toBeFalse();
        expect(barra.varios).toBe('');
    });

    it('con PX para subir: llena, «Subir a nivel N» y cuántos niveles si son varios (respuesta real)', () => {
        const venta = leerRespuestaSesion(respuestaSesiones('venta'));
        const barra = barraExperiencia(venta.experiencia!);
        expect(barra.texto).toBe('1.000 / 1.000 PX');
        expect(barra.porcentaje).toBe(100);
        expect(barra.boton).toBe('Subir a nivel 2');
        expect(barraExperiencia({ ...venta.experiencia!, px: 6100, nivelesPorSubir: 2 }).varios).toBe('(2 niveles)');
    });

    it('la penalización por multiclase, como la API: el neto hacia abajo', () => {
        expect(pxConPenalizacion(5000, 20)).toBe(4000);
        expect(pxConPenalizacion(1199, 20)).toBe(959);
        expect(pxConPenalizacion(1200, 0)).toBe(1200);
    });

    it('la fecha (la de juego o la de abrirla), el título y lo que cambió, de su resumen', () => {
        const [cero, primera, segunda] = leerHistorial(respuestaSesiones('historial_con_abierta')).sesiones;
        expect(fechaSesion(primera)).toBe('12 nov 2026');
        expect(fechaSesion({ fechaJuego: null, abiertaUtc: null })).toBe('');
        expect(tituloSesion(primera)).toBe('Sesión 1 · El camino de Zorvintal');
        expect(tituloSesion(segunda)).toBe('Sesión 2');
        expect(tituloSesion(cero)).toBe('Sesión 0 · Creación');
        expect(cambiosSesion(primera.resumen)).toBe('+1.000 PX · +47 po · NEP 1 → 2');
        expect(cambiosSesion(segunda.resumen)).toBe('');
        expect(cambiosSesion({ pxInicio: 100, pxFin: 0, poInicio: 10, poFin: 5.5, nepInicio: 1, nepFin: 1 })).toBe('−100 PX · −4,5 po');
    });
});

describe('SubidaNivelPuertaService', () => {
    it('lleva el id del personaje de quien pide la subida a quien la abre, y el aviso de vuelta', () => {
        const puerta = new SubidaNivelPuertaService();
        const pedidas: number[] = [];
        const hechas: number[] = [];
        puerta.solicitudes$.subscribe((id) => pedidas.push(id));
        puerta.subidasHechas$.subscribe((id) => hechas.push(id));

        puerta.solicitar(129);
        puerta.solicitar(0);
        puerta.subidaHecha(129);

        expect(pedidas).toEqual([129]);
        expect(hechas).toEqual([129]);
    });
});
