import { NuevoPersonajeService } from '../nuevo-personaje.service';
import { PersonajeService } from '../personaje.service';
import { normalizeClase } from '../clase.service';
import { Clase } from '../../interfaces/clase';
import { Personaje } from '../../interfaces/personaje';
import { PersonajeCreateRequestDto } from '../../interfaces/personajes-api';
import { Raza } from '../../interfaces/raza';
import { TipoCriatura } from '../../interfaces/tipo_criatura';
import { claveHabilidad } from './habilidad-clave';
import { toInt } from './normalizacion';
import { analizarElNivelParaReciclar, fichaConElReciclaje, reciclajeDelPlan } from './reciclaje';
import {
    aplicarNivelSustitucionAlMotor, destinosDelTraspaso, habilidadesParaLosPuntos, HuecoDeNivelSustitucion, huecosDeNivelSustitucion, motivoDelPlan,
    OpcionDeNivelReciclable, PlanNivelSustitucion,
} from './reciclaje-nivel-sustitucion';
import {
    barbaroConSustitucionApi, guerreroConSustitucionApi, ID_DOTE_ADICIONAL, ID_FIRMEZA_ENANA, ID_FURIA, ID_FURIA_DE_LA_MONTANA,
} from 'src/testing/sustituciones-api';

// El reciclaje de un nivel de sustitución en la web (R8, segunda tanda; contrato: personajes.md, «El reciclaje»,
// `nivel_sustitucion`; MJ II, pág. 197; dictamen del máster de Rol, D4), con el motor de la creación.

const TIPO = {
    Id: 1, Nombre: 'Humanoide', Descripcion: '', Manual: 'Manual', Id_tipo_dado: 1, Tipo_dado: 8, Id_ataque: 1,
    Id_fortaleza: 1, Id_reflejos: 1, Id_voluntad: 1, Id_puntos_habilidad: 1, Come: true, Respira: true, Duerme: true,
    Recibe_criticos: true, Puede_ser_flanqueado: true, Pierde_constitucion: false, Limite_inteligencia: 0,
    Tesoro: 'Normal', Id_alineamiento: 0, Rasgos: [], Oficial: true,
} as unknown as TipoCriatura;

function crearRaza(id: number, nombre: string): Raza {
    return {
        Id: id, Nombre: nombre, Ajuste_nivel: 0, Manual: 'Manual', Clase_predilecta: 'Cualquiera',
        Modificadores: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
        Alineamiento: {
            Id: 0, Basico: { Id_basico: 0, Nombre: 'No aplica' }, Ley: { Id_ley: 0, Nombre: 'No aplica' },
            Moral: { Id_moral: 0, Nombre: 'No aplica' }, Prioridad: { Id_prioridad: 0, Nombre: 'No aplica' }, Descripcion: '',
        },
        Oficial: true, Ataques_naturales: '', Tamano: { Id: 1, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
        Dgs_adicionales: {
            Cantidad: 0, Dado: 'd8', Tipo_criatura: 'Humanoide', Ataque_base: 0, Dotes_extra: 0, Puntos_habilidad: 0,
            Multiplicador_puntos_habilidad: 1, Fortaleza: 0, Reflejos: 0, Voluntad: 0,
        },
        Reduccion_dano: '', Resistencia_magica: '', Resistencia_energia: '', Heredada: false, Mutada: false,
        Tamano_mutacion_dependiente: false,
        Prerrequisitos: { actitud_prohibido: [], actitud_requerido: [], alineamiento_prohibido: [], alineamiento_requerido: [], tipo_criatura: [] },
        Armadura_natural: 0, Varios_armadura: 0, Correr: 20, Nadar: 0, Volar: 0, Maniobrabilidad: { Id: 0, Nombre: '-' },
        Trepar: 0, Excavar: 0, Altura_rango_inf: 1.2, Altura_rango_sup: 1.4, Peso_rango_inf: 50, Peso_rango_sup: 80,
        Edad_adulto: 40, Edad_mediana: 125, Edad_viejo: 188, Edad_venerable: 250, Espacio: 5, Alcance: 5, Tipo_criatura: TIPO,
        Subtipos: [], Sortilegas: [], Raciales: [], Habilidades: { Base: [], Custom: [] }, DotesContextuales: [],
    } as unknown as Raza;
}

const HABILIDADES = [
    { Id_habilidad: 10, Nombre: 'Trepar', Id_caracteristica: 1, Caracteristica: 'Fuerza', Descripcion: '', Soporta_extra: false, Entrenada: false, Extras: [] },
    {
        Id_habilidad: 21, Nombre: 'Saber', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: true, Entrenada: true,
        Extras: [{ Id_extra: 4, Extra: 'Dungeons', Descripcion: '' }],
    },
];

const GUERRERO: Clase = normalizeClase({ Nivel_max_claseo: 20, ...guerreroConSustitucionApi() });
const BARBARO: Clase = normalizeClase({ Nivel_max_claseo: 20, ...barbaroConSustitucionApi() });
const ENANO = crearRaza(2, 'Enano');
const HUMANO = crearRaza(1, 'Humano');

function catalogos(svc: NuevoPersonajeService): NuevoPersonajeService {
    svc.setCatalogoTiposCriatura([TIPO]);
    svc.setCatalogoHabilidades(HABILIDADES as any);
    svc.setCatalogoClases([GUERRERO, BARBARO]);
    svc.setCatalogoDotes([]);
    svc.setCatalogoConjuros([]);
    return svc;
}

/** Crea el personaje de 1.er nivel de `clase` (de sustitución con `idNivelSustitucion`) y lo guarda: la ficha de la API. */
function crearYGuardar(raza: Raza, clase: Clase, idNivelSustitucion: number | null)
    : { entrada: PersonajeCreateRequestDto; personaje: Personaje; } {
    const svc = catalogos(new NuevoPersonajeService());
    svc.seleccionarRaza(raza);
    svc.aplicarCaracteristicasGeneradas({ Fuerza: 14, Destreza: 10, Constitucion: 12, Inteligencia: 14, Sabiduria: 10, Carisma: 10 });
    expect(svc.elegirSustitucionSiguienteNivel(clase, idNivelSustitucion)).toBeTrue();
    const r = svc.aplicarSiguienteNivelClase(clase, null, null, false, null, null);
    expect(r.aplicado).withContext(`${r.razon}`).toBeTrue();
    svc.iniciarDistribucionHabilidadesPorClase(clase);
    for (const habilidad of svc.getHabilidadesSesion()) {
        for (let i = 0; i < 20 && svc.puedeSubirRangoHabilidad(claveHabilidad(habilidad)); i++)
            svc.ajustarRangoHabilidad(claveHabilidad(habilidad), 1);
        if (svc.esExtraHabilidadPendienteParaSesion(habilidad))
            svc.setExtraHabilidad(claveHabilidad(habilidad), 'Dungeons');
    }
    svc.cerrarDistribucionHabilidades();
    for (let p = svc.getSiguienteDotePendiente(), i = 0; p && i < 10; p = svc.getSiguienteDotePendiente(), i++)
        svc.omitirDotePendiente(p.id);
    const pj = svc.PersonajeCreacion;
    pj.Nombre = 'Tordek';
    pj.Campana = 'Sin campaña';
    const vida = svc.calcularVidaFinalAleatoria();
    pj.Vida = vida.total;
    const entrada = cuerpo(svc);
    entrada.personaje.puntosGolpe = vida.total;
    entrada.niveles = (svc.getNivelesParaGuardar(entrada.progresionLanzador, vida.detalle?.dados) ?? []).map((n) => ({ ...n, ordenConocido: true } as any));
    return { entrada, personaje: JSON.parse(JSON.stringify(pj)) };
}

function cuerpo(svc: NuevoPersonajeService): PersonajeCreateRequestDto {
    return new PersonajeService({ currentUser: null } as any, {} as any).construirPayloadCreacionDesdePersonaje(svc.PersonajeCreacion,
        { idAlineamiento: 1, idGenero: 1, idDeidad: 0, catalogos: { clases: [GUERRERO, BARBARO].map((c) => ({ id: c.Id, nombre: c.Nombre })) } } as any,
        null, svc.getProgresionLanzadorPersistible());
}

/** La ficha guardada con `rangos` en la habilidad `idHabilidad` (en la entrada y en el personaje). */
function conRangos(guardado: { entrada: PersonajeCreateRequestDto; personaje: Personaje; }, idHabilidad: number, rangos: number) {
    (guardado.entrada.colecciones?.habilidades?.base ?? []).filter((h: any) => toInt(h.idHabilidad) === idHabilidad).forEach((h: any) => h.rangos = rangos);
    (guardado.personaje.Habilidades ?? []).filter((h) => toInt(h.Id) === idHabilidad).forEach((h) => h.Rangos = rangos);
    return guardado;
}

/** El motor de la subida, hidratado con la ficha guardada (el personaje de antes de subir). */
function subir(guardado: { entrada: PersonajeCreateRequestDto; personaje: Personaje; }, raza: Raza): NuevoPersonajeService {
    const svc = catalogos(new NuevoPersonajeService());
    svc.iniciarSubidaDesdeFicha({ personaje: JSON.parse(JSON.stringify(guardado.personaje)), entrada: guardado.entrada, raza });
    return svc;
}

function plan(svc: NuevoPersonajeService, entrada: PersonajeCreateRequestDto, hueco: HuecoDeNivelSustitucion, pone: OpcionDeNivelReciclable): PlanNivelSustitucion {
    const analisis = analizarElNivelParaReciclar(svc, entrada, hueco, pone, 1);
    return { tipo: 'nivel_sustitucion', hueco, pone, analisis, doteElegida: null, rangos: [], traspaso: null, olvidados: [] };
}

const idsClaseas = (svc: NuevoPersonajeService) => (svc.PersonajeCreacion.Claseas ?? []).map((e: any) => toInt(e?.Id));
const idsEspeciales = (ficha: PersonajeCreateRequestDto) => (ficha.colecciones?.especiales ?? []).map((e: any) => toInt(e?.idEspecial));

describe('El reciclaje de un nivel de sustitución (R8, tanda 2)', () => {
    it('el enano guerrero 1 estándar pasa a guerrero enano: d12 (+2 PG), Firmeza enana por la dote adicional y Saber (dungeons) en el traspaso', () => {
        // Con 2 rangos en Trepar, que el nivel nuevo no tiene de clase (con 4, se bloquea: abajo).
        const guardado = conRangos(crearYGuardar(ENANO, GUERRERO, null), 10, 2);
        const svc = subir(guardado, ENANO);
        const huecos = huecosDeNivelSustitucion(svc, true);
        expect(huecos.map((h) => h.clave)).toEqual([`${GUERRERO.Id}:1`]);
        const hueco = huecos[0];
        expect(hueco.tiene).toBeNull();
        expect(hueco.indiceNivel).toBe(0);
        expect(hueco.opciones.map((o) => [o.idNivelSustitucion, o.motivo])).toEqual([[11, null]]);

        const p = plan(svc, guardado.entrada, hueco, hueco.opciones[0]);
        expect(p.analisis.motivo).toBeNull();
        expect(p.analisis.cambios.map((c) => [c.quita?.id ?? null, c.pone?.id ?? null])).toEqual([[ID_DOTE_ADICIONAL, null], [null, ID_FIRMEZA_ENANA]]);
        // El 1.er nivel del personaje, al máximo: del d10 al d12, +2 (2 por paso en el 1.er nivel de la clase).
        expect(p.analisis.pg).toEqual(jasmine.objectContaining({ carasAntes: 10, carasDespues: 12, pasos: 1, tiradaDespues: 12, delta: 2 }));
        expect(p.analisis.puntos).toBe(0);
        expect(p.analisis.habilidadesAnadidas.map((h) => [h.idHabilidad, h.idExtra])).toEqual([[21, 4]]);
        expect(p.analisis.habilidadesQuitadas.map((h) => h.idHabilidad)).toEqual([10]);
        // El traspaso: a Saber (dungeons), con el tope de su nivel + 3.
        const saber = svc.PersonajeCreacion.Habilidades.find((h) => toInt(h.Id) === 21)!;
        const destinos = destinosDelTraspaso(svc, p.analisis, 1, 1);
        expect(destinos.map((d) => d.idHabilidad)).toEqual([21]);
        expect(destinos[0].motivo === null).toBe(toInt(saber.Rangos) + 1 <= 4);
        expect(motivoDelPlan(p, [])).toBeNull();

        const conTraspaso: PlanNivelSustitucion = {
            ...p, traspaso: { quita: { idHabilidad: 10, idExtra: 0, nombre: 'Trepar' }, pone: { idHabilidad: 21, idExtra: 4, nombre: 'Saber (Dungeons)' }, rangos: 1 },
        };
        expect(reciclajeDelPlan(conTraspaso)).toEqual({
            tipo: 'nivel_sustitucion', hueco: { idClase: GUERRERO.Id, nivelClase: 1 }, quita: { idNivelSustitucion: null }, pone: { idNivelSustitucion: 11 },
            traspaso: { quita: { idHabilidad: 10, idExtra: 0 }, pone: { idHabilidad: 21, idExtra: 4 }, rangos: 1 },
        });

        // En el motor y en la ficha.
        const antes = cuerpo(svc);
        const trepar = toInt(svc.PersonajeCreacion.Habilidades.find((h) => toInt(h.Id) === 10)!.Rangos);
        expect(aplicarNivelSustitucionAlMotor(svc, conTraspaso)).toBeTrue();
        expect(svc.getOrdenNiveles()[0].idNivelSustitucion).toBe(11);
        expect(idsClaseas(svc)).toContain(ID_FIRMEZA_ENANA);
        expect(idsClaseas(svc)).not.toContain(ID_DOTE_ADICIONAL);
        expect(svc.carasDadoGolpeDeClase(GUERRERO, 1)).toBe(12);
        expect(toInt(svc.PersonajeCreacion.Habilidades.find((h) => toInt(h.Id) === 10)!.Rangos)).toBe(trepar - 1);
        const ficha = fichaConElReciclaje(guardado.entrada, reciclajeDelPlan(conTraspaso), { nivel: conTraspaso, motor: { antes, despues: cuerpo(svc) } });
        expect(ficha.niveles?.[0].idNivelSustitucion).toBe(11);
        expect(ficha.personaje.puntosGolpe).toBe(toInt(guardado.entrada.personaje.puntosGolpe) + 2);
        expect(idsEspeciales(ficha)).toContain(ID_FIRMEZA_ENANA);
        expect(idsEspeciales(ficha)).not.toContain(ID_DOTE_ADICIONAL);
        // Las elecciones del nivel del hueco: la aptitud nueva en lugar de la que se va (los rangos los apunta la API).
        expect((ficha.niveles?.[0].elecciones ?? []).some((e) => e.tipo === 'especial' && toInt(e.idElemento) === ID_FIRMEZA_ENANA)).toBeTrue();
        const rangos = (id: number) => toInt((ficha.colecciones?.habilidades?.base ?? []).find((h: any) => toInt(h.idHabilidad) === id)?.rangos);
        expect(rangos(10)).toBe(toInt((guardado.entrada.colecciones?.habilidades?.base ?? []).find((h: any) => toInt(h.idHabilidad) === 10)?.rangos) - 1);
    });

    it('el guerrero enano 1 que vuelve al estándar: −2 PG, la dote adicional de vuelta y el cuerpo con pone null', () => {
        const guardado = conRangos(crearYGuardar(ENANO, GUERRERO, 11), 21, 2);
        const svc = subir(guardado, ENANO);
        const [hueco] = huecosDeNivelSustitucion(svc, true);
        expect(hueco.tiene?.nivel.Id).toBe(11);
        expect(hueco.opciones.map((o) => o.idNivelSustitucion)).toEqual([null]);
        const p = plan(svc, guardado.entrada, hueco, hueco.opciones[0]);
        expect(p.analisis.motivo).toBeNull();
        expect(p.analisis.pg.delta).toBe(-2);
        expect(p.analisis.cambios.map((c) => [c.quita?.id ?? null, c.pone?.id ?? null])).toEqual([[ID_FIRMEZA_ENANA, null], [null, ID_DOTE_ADICIONAL]]);
        // Vuelve Trepar a la lista: el estándar añade lo que el juego quitaba.
        expect(p.analisis.habilidadesAnadidas.map((h) => h.idHabilidad)).toEqual([10]);
        expect(reciclajeDelPlan(p)).toEqual({ tipo: 'nivel_sustitucion', hueco: { idClase: GUERRERO.Id, nivelClase: 1 }, quita: { idNivelSustitucion: 11 }, pone: { idNivelSustitucion: null } });
        expect(aplicarNivelSustitucionAlMotor(svc, p)).toBeTrue();
        expect(svc.getOrdenNiveles()[0].idNivelSustitucion ?? null).toBeNull();
        expect(svc.carasDadoGolpeDeClase(GUERRERO, 1)).toBe(10);
        expect(idsClaseas(svc)).toContain(ID_DOTE_ADICIONAL);
        expect(idsClaseas(svc)).not.toContain(ID_FIRMEZA_ENANA);
    });

    it('con más rangos que el tope de una transclásea en una habilidad que el nivel nuevo no tiene de clase, se bloquea (D4)', () => {
        const guardado = conRangos(crearYGuardar(ENANO, GUERRERO, null), 10, 4);
        const svc = subir(guardado, ENANO);
        const [hueco] = huecosDeNivelSustitucion(svc, true);
        expect(plan(svc, guardado.entrada, hueco, hueco.opciones[0]).analisis.motivo)
            .toBe('El nivel nuevo no tiene de clase Trepar, y tiene más rangos que el tope de una transclásea.');
    });

    it('el humano guerrero no cumple el juego del enano: la opción, bloqueada con su motivo', () => {
        const svc = subir(crearYGuardar(HUMANO, GUERRERO, null), HUMANO);
        const [hueco] = huecosDeNivelSustitucion(svc, true);
        expect(hueco.opciones[0].motivo).toBe('No cumple: Enano');
        expect(hueco.motivo).toBe('No hay otro nivel que pueda poner en su lugar.');
    });

    it('la campaña que apaga los niveles de sustitución: no se pone uno, pero se vuelve al estándar', () => {
        const estandar = huecosDeNivelSustitucion(subir(crearYGuardar(ENANO, GUERRERO, null), ENANO), false)[0];
        expect(estandar.opciones[0].motivo).toBe('La campaña no deja tomar niveles de sustitución.');
        expect(estandar.motivo).not.toBeNull();
        const sustitucion = huecosDeNivelSustitucion(subir(crearYGuardar(ENANO, GUERRERO, 11), ENANO), false)[0];
        expect(sustitucion.opciones.map((o) => [o.idNivelSustitucion, o.motivo])).toEqual([[null, null]]);
    });

    it('el bárbaro de la montaña: la furia pasa a furia de la montaña y los 2 puntos más por nivel (×4 en el 1.º) se gastan', () => {
        const guardado = crearYGuardar(ENANO, BARBARO, null);
        const svc = subir(guardado, ENANO);
        const [hueco] = huecosDeNivelSustitucion(svc, true);
        const opcion = hueco.opciones[0];
        expect(opcion.motivo).toBeNull();
        expect(opcion.avisos.length).toBe(1);
        const p = plan(svc, guardado.entrada, hueco, opcion);
        expect(p.analisis.motivo).toBeNull();
        expect(p.analisis.cambios.map((c) => [c.quita?.id ?? null, c.pone?.id ?? null])).toEqual([[ID_FURIA, null], [null, ID_FURIA_DE_LA_MONTANA]]);
        expect(p.analisis.pg.delta).toBe(0);
        expect(p.analisis.puntos).toBe(8);
        // Sus transcláseas ya están en el tope de su nivel: no caben más; los puntos que no gasta se pierden.
        const habilidades = habilidadesParaLosPuntos(svc, guardado.entrada, hueco, opcion, p.analisis.puntos, 1);
        expect(habilidades).toEqual([]);
        expect(motivoDelPlan(p, habilidades)).toBeNull();
        expect(motivoDelPlan({ ...p, rangos: [{ idHabilidad: 10, idExtra: 0, nombre: 'Trepar', rangos: 1 }] }, habilidades)).toContain('no caben');
        // Y al revés: con 8 puntos menos, quita 8 rangos o, si tiene menos comprados, todos.
        const montana = crearYGuardar(ENANO, BARBARO, 21);
        const svc2 = subir(montana, ENANO);
        const [hueco2] = huecosDeNivelSustitucion(svc2, true);
        const p2 = plan(svc2, montana.entrada, hueco2, hueco2.opciones[0]);
        expect(p2.analisis.puntos).toBe(-8);
        const quitables = habilidadesParaLosPuntos(svc2, montana.entrada, hueco2, hueco2.opciones[0], -8, 1);
        const tiene = quitables.reduce((suma, h) => suma + h.rangos, 0);
        expect(tiene).toBeLessThan(8);
        expect(motivoDelPlan(p2, quitables)).toContain(`quita ${Math.min(8, tiene)} rangos`);
        const todos = quitables.map((h) => ({ idHabilidad: h.idHabilidad, idExtra: h.idExtra, nombre: h.nombre, rangos: -h.maximo }));
        expect(motivoDelPlan({ ...p2, rangos: todos }, quitables)).withContext(`${tiene} rangos`).toBeNull();
    });
});
