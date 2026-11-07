import { NuevoPersonajeService } from './nuevo-personaje.service';
import { Clase } from '../interfaces/clase';
import { Raza } from '../interfaces/raza';
import { normalizeClase } from './clase.service';
import { normalizeRazaApi } from './utils/raza-mapper';
import {
    baseApi,
    claseDeMonstruoApi,
    ENGENDRO_VAMPIRICO,
    MOMIA,
    razaDeMonstruoSobreApi,
    TablaClaseDeMonstruo,
} from 'src/testing/clases-de-monstruo-api';

/**
 * La creación con una clase de monstruo muerto viviente de *Libris Mortis* (fase 5.2 del roadmap `ACTIVO_razas-mutadas`;
 * estudio, apartado 3.4): la clase obligada desde el 1.er nivel y hasta terminarla; los PG, los puntos de habilidad, las
 * dotes y la armadura natural por la tabla de la clase; los PX. Con los datos del contrato simulados
 * (`src/testing/clases-de-monstruo-api.ts`): aún no hay datos de las cinco clases en `rol_dev`.
 */

/** Un guerrero del Manual del jugador (d10, 2 puntos, dote a 1.º y cada 2), con la forma de `GET /clases`. */
function guerreroApi(): Record<string, any> {
    const base = claseDeMonstruoApi({ ...ENGENDRO_VAMPIRICO, id: 9, nombre: 'Guerrero', mutacion: { Id: 0, Nombre: '' } });
    return {
        ...base,
        Tipo_dado: { Id: 4, Nombre: 'd10' },
        Puntos_habilidad: { Id: 1, Valor: 2 },
        Nivel_max_claseo: 20,
        Progresion_obligatoria: false,
        Sin_penalizacion_multiclase: false,
        Mutacion: null,
        Desglose_niveles: Array.from({ length: 20 }, (_, i) => ({
            ...base['Desglose_niveles'][0],
            Nivel: i + 1,
            Ataque_base: `+${i + 1}`,
            Dg: true,
            Dote: null,
            Armadura_natural: 0,
        })),
    };
}

const CARACTERISTICAS = { Fuerza: 14, Destreza: 12, Constitucion: 13, Inteligencia: 10, Sabiduria: 11, Carisma: 9 };

interface Creacion {
    svc: NuevoPersonajeService;
    claseMonstruo: Clase;
    guerrero: Clase;
}

function crear(tabla: TablaClaseDeMonstruo, raza: Raza, base: Raza | null): Creacion {
    const svc = new NuevoPersonajeService();
    const claseMonstruo = normalizeClase(claseDeMonstruoApi(tabla));
    const guerrero = normalizeClase(guerreroApi());
    svc.setCatalogoClases([claseMonstruo, guerrero]);
    expect(svc.seleccionarRaza(raza, base)).toBeTrue();
    svc.aplicarCaracteristicasGeneradas(CARACTERISTICAS);
    return { svc, claseMonstruo, guerrero };
}

/** Aplica `veces` niveles de la clase y devuelve los puntos de habilidad de cada uno. */
function subir(svc: NuevoPersonajeService, clase: Clase, veces: number): number[] {
    const puntos: number[] = [];
    for (let i = 0; i < veces; i++) {
        const resultado = svc.aplicarSiguienteNivelClase(clase);
        expect(resultado.aplicado).withContext(`${clase.Nombre} ${i + 1}: ${resultado.razon ?? ''}`).toBeTrue();
        svc.registrarDotesPendientesPorProgresion(`${clase.Nombre} nivel ${i + 1}`);
        svc.iniciarDistribucionHabilidadesPorClase(clase);
        puntos.push(svc.EstadoFlujo.habilidades.puntosTotales);
    }
    return puntos;
}

function dotesDeNivel(svc: NuevoPersonajeService): number[] {
    return svc.getDotesPendientes().filter((dote) => dote.fuente === 'nivel').map((dote) => Number(dote.nivelProgresion));
}

function engendroSobre(base: 'gnoll' | 'humano' | 'enano', cambios: Record<string, any> = {}): { raza: Raza; base: Raza; } {
    const baseRaw = baseApi(base);
    return {
        raza: normalizeRazaApi(razaDeMonstruoSobreApi(ENGENDRO_VAMPIRICO, baseRaw, { Fuerza: 2, Carisma: 2 }, cambios)),
        base: normalizeRazaApi(baseRaw),
    };
}

describe('NuevoPersonajeService (clases de monstruo de Libris Mortis)', () => {
    it('lee la tabla por nivel, la mutación y las dos marcas de la clase (contrato de la fase 1)', () => {
        const clase = normalizeClase(claseDeMonstruoApi(ENGENDRO_VAMPIRICO));

        expect(clase.Mutacion).toEqual({ Id: 801, Nombre: 'Engendro vampírico' });
        expect(clase.Progresion_obligatoria).toBeTrue();
        expect(clase.Sin_penalizacion_multiclase).toBeTrue();
        expect(clase.Desglose_niveles.map((fila) => fila.Dg)).toEqual([true, false, true, false, true, false, true, false]);
        expect(clase.Desglose_niveles.map((fila) => fila.Dote)).toEqual([true, false, false, false, false, true, false, false]);
        expect(clase.Desglose_niveles.map((fila) => fila.Armadura_natural)).toEqual([0, 1, 1, 2, 2, 2, 3, 3]);
    });

    it('una clase sin tabla (y la caché, que no escribe los null) da lo de siempre', () => {
        const raw = guerreroApi();
        delete raw['Mutacion'];
        raw['Desglose_niveles'].forEach((fila: Record<string, any>) => { delete fila['Dote']; delete fila['Dg']; delete fila['Armadura_natural']; });

        const clase = normalizeClase(raw);

        expect(clase.Mutacion).toBeNull();
        expect(clase.Progresion_obligatoria).toBeFalse();
        expect(clase.Desglose_niveles[0]).toEqual(jasmine.objectContaining({ Dg: true, Dote: null, Armadura_natural: 0 }));
    });

    describe('qué clases se pueden elegir', () => {
        it('una raza que no es la mutación no puede tomar la clase de monstruo', () => {
            const svc = new NuevoPersonajeService();
            const engendro = normalizeClase(claseDeMonstruoApi(ENGENDRO_VAMPIRICO));
            const guerrero = normalizeClase(guerreroApi());
            svc.setCatalogoClases([engendro, guerrero]);
            svc.seleccionarRaza(normalizeRazaApi(baseApi('humano')));

            const evaluacion = svc.evaluarClaseParaSeleccion(engendro);
            expect(evaluacion.estado).toBe('blocked_failed');
            expect(evaluacion.razones).toEqual(['«Engendro vampírico» solo la puede tomar un personaje de la raza «Engendro vampírico».']);
            expect(svc.evaluarClaseParaSeleccion(guerrero).estado).toBe('eligible');
            expect(svc.claseObligadaActual()).toBeNull();
        });

        it('el engendro vampírico humano empieza con su clase y no toma otra hasta terminarla (8 niveles)', () => {
            const { raza, base } = engendroSobre('humano');
            const { svc, claseMonstruo, guerrero } = crear(ENGENDRO_VAMPIRICO, raza, base);

            expect(svc.claseDeMonstruoDeRaza(raza.Id)?.Nombre).toBe('Engendro vampírico');
            expect(svc.evaluarClaseParaSeleccion(claseMonstruo).estado).toBe('eligible');
            expect(svc.evaluarClaseParaSeleccion(guerrero).razones)
                .toEqual(['Un personaje de la raza «Engendro vampírico» empieza con su clase, «Engendro vampírico», desde el 1.er nivel.']);
            expect(svc.claseObligadaActual()?.clase.Id).toBe(901);

            subir(svc, claseMonstruo, 1);
            expect(svc.evaluarClaseParaSeleccion(guerrero).razones)
                .toEqual(['Hay que terminar «Engendro vampírico» (8 niveles) antes de tomar otra clase.']);
            expect(svc.aplicarSiguienteNivelClase(guerrero).aplicado).toBeFalse();

            subir(svc, claseMonstruo, 7);
            expect(svc.evaluarClaseParaSeleccion(guerrero).estado).toBe('eligible');
            expect(svc.evaluarClaseParaSeleccion(claseMonstruo).razones).toEqual(['Nivel máximo alcanzado para esta clase']);
            expect(svc.claseObligadaActual()).toBeNull();
        });
    });

    describe('humano engendro vampírico 8 (Libris Mortis, tabla 2-3)', () => {
        let creacion: Creacion;
        let puntos: number[];

        beforeEach(() => {
            // Una base con armadura natural +1 (en la combinación, la de la base): la de la clase se apila con ella.
            const { raza, base } = engendroSobre('humano', { ant: 1 });
            creacion = crear(ENGENDRO_VAMPIRICO, raza, base);
            puntos = subir(creacion.svc, creacion.claseMonstruo, 8);
        });

        it('sin Constitución, 4 DG de d12: el primero al máximo y tres tiradas', () => {
            const svc = creacion.svc;
            expect(svc.PersonajeCreacion.Constitucion_perdida).toBeTrue();
            const tiradas = spyOn<any>(svc, 'randomInt').and.returnValues(5, 6, 7);

            const vida = svc.calcularVidaFinalAleatoria();

            expect(tiradas).toHaveBeenCalledTimes(3);
            expect(vida.maximo).toBe(48);
            expect(vida.total).toBe(12 + 5 + 6 + 7);
            expect(vida.detalle.nivelesClase).toBe(4);
        });

        it('puntos de habilidad solo en los niveles con DG: (4 + Int) × 4 y los 4 del humano a 1.º; 4 + 1 a 3.º, 5.º y 7.º', () => {
            expect(puntos).toEqual([20, 0, 5, 0, 5, 0, 5, 0]);
        });

        it('dotes a 1.º y 6.º de su tabla (no a 3.º), y la del humano aparte', () => {
            expect(dotesDeNivel(creacion.svc)).toEqual([1, 6]);
        });

        it('la armadura natural de su tabla a 8.º (+3, no la suma de las filas) más la de la raza', () => {
            expect(creacion.svc.PersonajeCreacion.Armadura_natural).toBe(3 + 1);
        });

        it('el nivel de personaje sigue siendo 8 (NEP y aumentos a 4.º y 8.º); los DG de los prerrequisitos, 4', () => {
            const svc = creacion.svc as any;
            expect(svc.getNivelEfectivoParaAumentos()).toBe(8);
            expect(creacion.svc.PersonajeCreacion.NEP).toBe(8);
            expect(svc.resolverDgTotalActual()).toBe(4);
        });

        it('engendro 8 / guerrero 1: la dote del 9.º nivel de personaje, 5 DG y sin penalización de PX', () => {
            const svc = creacion.svc;
            expect(svc.penalizacionExperiencia(creacion.guerrero).porcentaje).toBe(0);
            const puntosGuerrero = subir(svc, creacion.guerrero, 1);

            expect(dotesDeNivel(svc)).toEqual([1, 6, 9]);
            expect(puntosGuerrero).toEqual([2 + 1]);
            expect((svc as any).resolverDgTotalActual()).toBe(5);
            spyOn<any>(svc, 'randomInt').and.returnValue(1);
            expect(svc.calcularVidaFinalAleatoria().maximo).toBe(48 + 10);
            expect(svc.PersonajeCreacion.Penalizacion_experiencia?.porcentaje).toBe(0);
        });
    });

    it('sin la marca, el engendro 8 / guerrero 1 sí penalizaría la multiclase (el gnoll: su predilecta es el explorador)', () => {
        const { raza, base } = engendroSobre('gnoll');
        const conMarca = crear(ENGENDRO_VAMPIRICO, raza, base);
        subir(conMarca.svc, conMarca.claseMonstruo, 8);
        expect(conMarca.svc.penalizacionExperiencia(conMarca.guerrero).porcentaje).toBe(0);

        const sinMarca = { ...conMarca.claseMonstruo, Sin_penalizacion_multiclase: false };
        conMarca.svc.setCatalogoClases([sinMarca, conMarca.guerrero]);
        expect(conMarca.svc.penalizacionExperiencia(conMarca.guerrero).porcentaje).toBe(20);
    });

    it('gnoll engendro vampírico 1: los 2 DG raciales (d8) y uno de la clase (d12); la dote de su tabla en el 3.er nivel de personaje', () => {
        const { raza, base } = engendroSobre('gnoll');
        const { svc, claseMonstruo } = crear(ENGENDRO_VAMPIRICO, raza, base);
        subir(svc, claseMonstruo, 1);

        expect(dotesDeNivel(svc)).toEqual([3]);
        expect((svc as any).resolverDgTotalActual()).toBe(3);
        spyOn<any>(svc, 'randomInt').and.returnValue(1);
        expect(svc.calcularVidaFinalAleatoria().maximo).toBe(8 + 8 + 12);
        // Gnoll: 2 DG + ajuste +1 + 1 nivel de la clase.
        expect(svc.PersonajeCreacion.NEP).toBe(4);
    });

    it('enano momia 13 / guerrero 1: 8 DG de la momia, dotes a 1.º, 4.º y 10.º, AN +10 y 10 pies (Libris Mortis, tabla 2-5)', () => {
        const baseRaw = baseApi('enano');
        // La combinación de la momia: Fue +2, Int −4 y «10 pies menos que la raza base» (el enano, de 20 a 10).
        const raza = normalizeRazaApi(razaDeMonstruoSobreApi(MOMIA, baseRaw, { Fuerza: 2, Inteligencia: -4 }, { co: 10 }));
        const { svc, claseMonstruo, guerrero } = crear(MOMIA, raza, normalizeRazaApi(baseRaw));
        const puntos = subir(svc, claseMonstruo, 13);
        subir(svc, guerrero, 1);

        expect(puntos.filter((valor) => valor > 0).length).toBe(8);
        expect(dotesDeNivel(svc)).toEqual([1, 4, 10]);
        expect(svc.PersonajeCreacion.Armadura_natural).toBe(10);
        expect(svc.PersonajeCreacion.Correr).toBe(10);
        expect((svc as any).resolverDgTotalActual()).toBe(9);
        expect((svc as any).getNivelEfectivoParaAumentos()).toBe(14);
        spyOn<any>(svc, 'randomInt').and.returnValue(1);
        expect(svc.calcularVidaFinalAleatoria().maximo).toBe(8 * 12 + 10);
    });
});
