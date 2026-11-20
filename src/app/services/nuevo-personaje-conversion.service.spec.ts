import { NuevoPersonajeService } from './nuevo-personaje.service';
import { Clase } from '../interfaces/clase';
import { Raza } from '../interfaces/raza';
import { normalizeClase } from './clase.service';
import { normalizeRazaApi } from './utils/raza-mapper';
import { baseApi, claseDeMonstruoApi, ENGENDRO_VAMPIRICO, guerreroApi, razaDeMonstruoSobreApi } from 'src/testing/clases-de-monstruo-api';
import { PROLE_SOBRE_API, RAZAS_API } from 'src/testing/razas-mutadas-api';

/**
 * El motor de la creación en la conversión en muerto viviente (*Libris Mortis*, pág. 34; contrato en `personajes.md`,
 * «Convertirse en muerto viviente») y lo que trae de paso a la creación: el nivel que pierde (`perderNivelEnElMotor`), la
 * raza mutada (`adquirirRazaMutada`) y el 1.er nivel de su clase de monstruo; el agrandado de una mutación que cambia el
 * tipo; las aptitudes que sustituye la raza (`Especiales_sustituidos`); y los incrementos sin Constitución.
 */

const CARACTERISTICAS = { Fuerza: 14, Destreza: 12, Constitucion: 13, Inteligencia: 10, Sabiduria: 11, Carisma: 9 };
const EXPULSAR = { Id: 31, Nombre: 'Expulsar muertos vivientes' };
const REPRENDER = { Id: 32, Nombre: 'Reprender muertos vivientes' };
/** El subtipo que da cambiar de tipo (`subtipos.al_cambiar_tipo`, el agrandado: Manual de monstruos, pág. 311). */
const AGRANDADO = { Id: 50, Nombre: 'Agrandado', Al_cambiar_tipo: true } as any;

/** Un clérigo que expulsa muertos vivientes a 1.er nivel (la aptitud de su tabla). */
function clerigo(): Clase {
    return normalizeClase(guerreroApi(2, 'Clérigo', {
        1: [{ Especial: { ...EXPULSAR }, Id_extra: 0, Extra: '', Id_interno: 7001, Nivel: 1 }],
    }));
}

/** El engendro vampírico sobre una base (como `GET /razas/1009/sobre/{idBase}`), con lo que sustituye. */
function engendroSobre(base: 'gnoll' | 'humano' | 'enano', conSustitucion = true): { raza: Raza; base: Raza; } {
    const baseRaw = baseApi(base);
    const extra = conSustitucion ? { Especiales_sustituidos: [{ Especial: { ...EXPULSAR }, Especial_nuevo: { ...REPRENDER } }] } : {};
    return {
        raza: normalizeRazaApi(razaDeMonstruoSobreApi(ENGENDRO_VAMPIRICO, baseRaw, { Fuerza: 2, Carisma: 2 }, extra)),
        base: normalizeRazaApi(baseRaw),
    };
}

interface Personaje {
    svc: NuevoPersonajeService;
    engendro: Clase;
    clase: Clase;
}

/** Crea un personaje de `base` con `niveles` de `clase` y deja sus elecciones pendientes resueltas (omitidas). */
function crear(base: 'gnoll' | 'humano' | 'enano', clase: Clase, niveles: number): Personaje {
    const svc = new NuevoPersonajeService();
    const engendro = normalizeClase(claseDeMonstruoApi(ENGENDRO_VAMPIRICO));
    svc.setCatalogoClases([engendro, clase]);
    svc.setCatalogoSubtipos([AGRANDADO]);
    expect(svc.seleccionarRaza(normalizeRazaApi(baseApi(base)))).toBeTrue();
    svc.aplicarCaracteristicasGeneradas(CARACTERISTICAS);
    for (let i = 0; i < niveles; i++) {
        const r = svc.aplicarSiguienteNivelClase(clase);
        expect(r.aplicado).withContext(r.razon ?? '').toBeTrue();
        svc.registrarDotesPendientesPorProgresion(`${clase.Nombre} nivel ${i + 1}`);
        svc.registrarAumentosPendientesPorProgresion(`${clase.Nombre} nivel ${i + 1}`);
    }
    svc.getDotesPendientes().forEach((d) => svc.omitirDotePendiente(d.id));
    (svc as any).aumentosPendientesCaracteristica = [];
    return { svc, engendro, clase };
}

/**
 * La conversión en el motor, como la hace la pantalla: pierde el último nivel de `clase` (si tiene), pasa a la raza del
 * engendro vampírico sobre su base y toma el 1.er nivel de la clase de monstruo (su alineamiento no se fuerza).
 */
function convertir(p: Personaje, base: 'gnoll' | 'humano' | 'enano', pierde: boolean): void {
    const svc = p.svc;
    if (pierde)
        svc.perderNivelEnElMotor({ idClase: p.clase.Id, indiceNivel: (svc.PersonajeCreacion.Orden_niveles ?? []).length - 1 });
    expect(svc.adquirirRazaMutada(engendroSobre(base).raza, {})).toBeTrue();
    const r = svc.aplicarSiguienteNivelClase(p.engendro, null, null, true);
    expect(r.aplicado).withContext(r.razon ?? '').toBeTrue();
    svc.registrarAumentosPendientesPorProgresion('Engendro vampírico nivel 1');
    svc.registrarDotesPendientesPorProgresion('Engendro vampírico nivel 1');
    svc.iniciarDistribucionHabilidadesPorClase(p.engendro);
}

const nombres = (lista: Array<{ Nombre?: string; }> | undefined) => (lista ?? []).map((x) => `${x?.Nombre ?? ''}`);

describe('NuevoPersonajeService (convertirse en muerto viviente)', () => {
    it('el humano guerrero 1 pierde su único nivel: el del engendro es su primer DG (al máximo) y lleva los puntos ×4', () => {
        const p = crear('humano', normalizeClase(guerreroApi()), 1);
        convertir(p, 'humano', true);
        const pj = p.svc.PersonajeCreacion;

        expect((pj.desgloseClases ?? []).map((c) => [c.Nombre, c.Nivel])).toEqual([['Engendro vampírico', 1]]);
        expect(p.svc.esPrimerNivelDelPersonaje()).toBeTrue();
        // (4 + Int 0) × 4 y los 4 del humano a 1.er nivel.
        expect(p.svc.EstadoFlujo.habilidades.puntosTotales).toBe(16 + 4);
        expect(pj.Tipo_criatura?.Nombre).toBe('Muerto viviente');
        expect(pj.Constitucion_perdida).toBeTrue();
    });

    it('el guerrero enano 5 pasa a guerrero 4 / engendro vampírico 1: 4 + Int sin ×4 y la dote de la tabla del engendro', () => {
        const p = crear('enano', normalizeClase(guerreroApi()), 5);
        convertir(p, 'enano', true);
        const pj = p.svc.PersonajeCreacion;

        expect((pj.desgloseClases ?? []).map((c) => [c.Nombre, c.Nivel])).toEqual([['Guerrero', 4], ['Engendro vampírico', 1]]);
        expect((pj.Orden_niveles ?? []).map((n) => n.idClase)).toEqual([9, 9, 9, 9, ENGENDRO_VAMPIRICO.id]);
        expect(p.svc.esPrimerNivelDelPersonaje()).toBeFalse();
        expect(p.svc.EstadoFlujo.habilidades.puntosTotales).toBe(4);
        // La dote de la tabla del engendro a 1.º (el 5.º nivel de personaje), no la de cada 3.
        expect(p.svc.getDotesPendientes().filter((d) => d.estado === 'pendiente').map((d) => d.nivelProgresion)).toEqual([5]);
    });

    it('el gnoll (solo DG raciales) no pierde nada: gana el nivel con sus 2 DG de antes', () => {
        const p = crear('gnoll', normalizeClase(guerreroApi()), 0);
        convertir(p, 'gnoll', false);

        expect((p.svc.PersonajeCreacion.desgloseClases ?? []).map((c) => [c.Nombre, c.Nivel])).toEqual([['Engendro vampírico', 1]]);
        expect(p.svc.esPrimerNivelDelPersonaje()).toBeFalse();
        expect(p.svc.PersonajeCreacion.NEP).toBe(4);
    });

    it('el tipo pasa a muerto viviente, conserva los subtipos de su base y gana el agrandado', () => {
        const p = crear('humano', normalizeClase(guerreroApi()), 2);
        const deLaBase = nombres(p.svc.PersonajeCreacion.Subtipos);
        expect(deLaBase).not.toContain('Agrandado');
        convertir(p, 'humano', true);

        expect(nombres(p.svc.PersonajeCreacion.Subtipos)).toEqual(jasmine.arrayContaining([...deLaBase, 'Agrandado']));
    });

    it('el guerrero 4 que pasa a guerrero 3 / engendro 1 vuelve a tener el incremento del 4.º nivel, pero no a la Constitución', () => {
        const p = crear('humano', normalizeClase(guerreroApi()), 4);
        convertir(p, 'humano', true);
        const pendientes = p.svc.getAumentosCaracteristicaPendientes();

        expect(pendientes.length).toBe(1);
        expect(p.svc.aplicarAumentosCaracteristica([{ idPendiente: pendientes[0].id, caracteristica: 'Constitucion' }])).toBeFalse();
        expect(p.svc.aplicarAumentosCaracteristica([{ idPendiente: pendientes[0].id, caracteristica: 'Fuerza' }])).toBeTrue();
    });

    it('el clérigo 2 que pasa a clérigo 1 / engendro 1 reprende en lugar de expulsar (Especiales_sustituidos)', () => {
        const p = crear('humano', clerigo(), 2);
        expect(nombres(p.svc.PersonajeCreacion.Claseas)).toContain(EXPULSAR.Nombre);
        convertir(p, 'humano', true);
        const aptitudes = p.svc.PersonajeCreacion.Claseas ?? [];

        expect(nombres(aptitudes)).toContain(REPRENDER.Nombre);
        expect(nombres(aptitudes)).not.toContain(EXPULSAR.Nombre);
        expect(aptitudes.find((a) => a.Nombre === REPRENDER.Nombre)?.Id).toBe(REPRENDER.Id);
    });

    describe('devolverle la vida (Libris Mortis, pág. 35): `devolverLaRazaBase`', () => {
        /** Quita del motor el nivel del engendro y le devuelve la raza de antes con su Constitución. */
        function devolver(p: Personaje, base: 'gnoll' | 'humano' | 'enano', constitucion: number): void {
            const svc = p.svc;
            svc.perderNivelEnElMotor({ idClase: p.engendro.Id, indiceNivel: (svc.PersonajeCreacion.Orden_niveles ?? []).length - 1 });
            expect(svc.devolverLaRazaBase(engendroSobre(base).raza, constitucion)).toBeTrue();
        }

        it('el clérigo 2 / engendro 1 vuelve a ser humano clérigo 2: tipo humanoide, sin agrandado, con su Constitución y expulsando', () => {
            const p = crear('humano', clerigo(), 3);
            convertir(p, 'humano', true);
            devolver(p, 'humano', 13);
            const pj = p.svc.PersonajeCreacion;

            expect(p.svc.RazaSeleccionada?.Nombre).toBe('Humano');
            expect(p.svc.RazaBaseSeleccionadaCompleta).toBeNull();
            expect(pj.RazaBase).toBeNull();
            expect((pj.desgloseClases ?? []).map((c) => [c.Nombre, c.Nivel])).toEqual([['Clérigo', 2]]);
            expect(pj.Tipo_criatura?.Nombre).not.toBe('Muerto viviente');
            expect(nombres(pj.Subtipos)).not.toContain('Agrandado');
            expect(pj.Constitucion_perdida).toBeFalse();
            expect(pj.Constitucion).toBe(13);
            // Los ajustes del engendro (Fue +2, Car +2) se van.
            expect([pj.Fuerza, pj.Carisma]).toEqual([CARACTERISTICAS.Fuerza, CARACTERISTICAS.Carisma]);
            expect(nombres(pj.Claseas)).toContain(EXPULSAR.Nombre);
            expect(nombres(pj.Claseas)).not.toContain(REPRENDER.Nombre);
        });

        it('el enano vuelve con la Constitución que se le da y los ajustes de su raza', () => {
            const p = crear('enano', normalizeClase(guerreroApi()), 3);
            convertir(p, 'enano', true);
            devolver(p, 'enano', 13);
            const pj = p.svc.PersonajeCreacion;

            expect(pj.Constitucion).toBe(13);
            expect(pj.Carisma).toBe(CARACTERISTICAS.Carisma - 2);
            expect(pj.NEP).toBe(2);
        });

        it('sin una raza mutada sobre una base, no hace nada', () => {
            const p = crear('humano', normalizeClase(guerreroApi()), 1);
            expect(p.svc.devolverLaRazaBase(null, 12)).toBeFalse();
        });
    });

    describe('de paso, en la creación', () => {
        it('una raza mutada que sustituye una aptitud la cambia en el nivel de clase que la da', () => {
            const svc = new NuevoPersonajeService();
            const cl = clerigo();
            // Sin la clase de monstruo en el catálogo: la raza no obliga a tomarla y el clérigo se puede elegir.
            svc.setCatalogoClases([cl]);
            const { raza, base } = engendroSobre('humano');
            expect(svc.seleccionarRaza(raza, base)).toBeTrue();
            svc.aplicarCaracteristicasGeneradas(CARACTERISTICAS);
            expect(svc.aplicarSiguienteNivelClase(cl, null, null, true).aplicado).toBeTrue();

            expect(nombres(svc.PersonajeCreacion.Claseas)).toEqual([REPRENDER.Nombre]);
            expect(svc.getEleccionesDelNivelEnCurso().filter((e) => e.tipo === 'especial').map((e) => e.idElemento)).toEqual([REPRENDER.Id]);
        });

        it('sin sustituciones (una caché anterior), la de siempre', () => {
            const svc = new NuevoPersonajeService();
            const cl = clerigo();
            svc.setCatalogoClases([cl]);
            const { raza, base } = engendroSobre('humano', false);
            svc.seleccionarRaza(raza, base);
            svc.aplicarCaracteristicasGeneradas(CARACTERISTICAS);
            svc.aplicarSiguienteNivelClase(cl, null, null, true);

            expect(nombres(svc.PersonajeCreacion.Claseas)).toEqual([EXPULSAR.Nombre]);
        });

        it('una mutación que cambia el tipo da el agrandado; una que no lo cambia (la prole sobre el mediano), no', () => {
            const conCambio = new NuevoPersonajeService();
            conCambio.setCatalogoSubtipos([AGRANDADO]);
            const engendro = engendroSobre('humano');
            conCambio.seleccionarRaza(engendro.raza, engendro.base);
            expect(nombres(conCambio.PersonajeCreacion.Subtipos)).toContain('Agrandado');

            const sinCambio = new NuevoPersonajeService();
            sinCambio.setCatalogoSubtipos([AGRANDADO]);
            sinCambio.seleccionarRaza(normalizeRazaApi(PROLE_SOBRE_API['5']), normalizeRazaApi(RAZAS_API['5']));
            expect(nombres(sinCambio.PersonajeCreacion.Subtipos)).not.toContain('Agrandado');
        });
    });
});
