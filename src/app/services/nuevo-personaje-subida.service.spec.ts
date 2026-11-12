import { NuevoPersonajeService } from './nuevo-personaje.service';
import { PersonajeService } from './personaje.service';
import { normalizeClase } from './clase.service';
import { Clase } from '../interfaces/clase';
import { Conjuro } from '../interfaces/conjuro';
import { Personaje } from '../interfaces/personaje';
import { PersonajeCreateRequestDto } from '../interfaces/personajes-api';
import { Raza } from '../interfaces/raza';
import { TipoCriatura } from '../interfaces/tipo_criatura';
import { claveHabilidad } from './utils/habilidad-clave';
import { fichaDeLaSubida, modConstitucionDeEntrada, puntosGolpeTrasSubida } from './utils/subida-nivel';

// La subida de nivel con el motor de la creación (roadmap de sesiones, fase 4; estudio de reglas, apartado 1): personajes
// de referencia de los manuales creados nivel a nivel, guardados como el cuerpo del alta (con sus `niveles` y las
// elecciones de cada uno) y subidos un nivel en otra instancia del motor hidratada desde ellos (`iniciarSubidaDesdeFicha`).

type Car = 'Fuerza' | 'Destreza' | 'Constitucion' | 'Inteligencia' | 'Sabiduria' | 'Carisma';

const TIPO: TipoCriatura = {
    Id: 1, Nombre: 'Humanoide', Descripcion: '', Manual: 'Manual', Id_tipo_dado: 1, Tipo_dado: 8, Id_ataque: 1,
    Id_fortaleza: 1, Id_reflejos: 1, Id_voluntad: 1, Id_puntos_habilidad: 1, Come: true, Respira: true, Duerme: true,
    Recibe_criticos: true, Puede_ser_flanqueado: true, Pierde_constitucion: false, Limite_inteligencia: 0,
    Tesoro: 'Normal', Id_alineamiento: 0, Rasgos: [], Oficial: true,
} as TipoCriatura;

function crearRaza(nombre: string, modificadores: Partial<Record<Car, number>> = {}): Raza {
    return {
        Id: 10, Nombre: nombre, Ajuste_nivel: 0, Manual: 'Manual', Clase_predilecta: 'Cualquiera',
        Modificadores: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0, ...modificadores },
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

function diarios(...valores: number[]): Record<string, number> {
    const salida: Record<string, number> = {};
    for (let n = 0; n <= 9; n++)
        salida[`Nivel_${n}`] = valores[n] ?? -1;
    return salida;
}

function clase(raw: Record<string, any>): Clase {
    return normalizeClase({ Nivel_max_claseo: 20, Conjuros: {}, ...raw });
}

function nivel(n: number, extra: Record<string, any> = {}): Record<string, any> {
    return { Nivel: n, Ataque_base: `+${n}`, Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+0' }, ...extra };
}

function conjuro(id: number, nombre: string, idClase: number, nombreClase: string, nivelConjuro: number): Conjuro {
    return {
        Id: id, Nombre: nombre, Arcano: true, Divino: false, Psionico: false, Escuela: { Id: 0, Nombre: 'Universal' },
        Disciplina: { Id: 0, Nombre: '' }, Descriptores: [], Nivel_dominio: [], Nivel_disciplinas: [], Oficial: true,
        Nivel_clase: [{ Id_clase: idClase, Clase: nombreClase, Nivel: nivelConjuro, Espontaneo: false }],
    } as unknown as Conjuro;
}

function dote(id: number, nombre: string): any {
    return {
        Id: id, Nombre: nombre, Descripcion: '', Beneficio: '', Normal: '', Especial: '', Manual: { Id: 1, Nombre: 'MJ', Pagina: 1 },
        Tipos: [{ Id: 1, Nombre: 'General', Usado: 1 }], Repetible: 0, Repetible_distinto_extra: 0, Repetible_comb: 0, Comp_arma: 0,
        Oficial: true, Extras_soportados: { Extra_arma: 0, Extra_armadura_armaduras: 0, Extra_armadura_escudos: 0, Extra_armadura: 0, Extra_escuela: 0, Extra_habilidad: 0 },
        Extras_disponibles: { Armas: [], Armaduras: [], Escuelas: [], Habilidades: [] }, Modificadores: {}, Prerrequisitos: {},
    };
}

const HABILIDADES = [
    { Id_habilidad: 2, Nombre: 'Trepar', Id_caracteristica: 1, Caracteristica: 'Fuerza', Descripcion: '', Soporta_extra: false, Entrenada: false, Extras: [] },
    { Id_habilidad: 3, Nombre: 'Concentración', Id_caracteristica: 3, Caracteristica: 'Constitucion', Descripcion: '', Soporta_extra: false, Entrenada: false, Extras: [] },
];
const DOTES = [50, 51, 52, 53, 54, 55, 56].map((id) => dote(id, `Dote ${id}`));
const ref = (id: number, nombre: string) => ({ Id_habilidad: id, Nombre: nombre });

const GUERRERO = clase({
    Id: 7, Nombre: 'Guerrero', Tipo_dado: { Id: 4, Nombre: 'd10' }, Puntos_habilidad: { Id: 1, Valor: 2 },
    Habilidades: { Base: [ref(2, 'Trepar')], Custom: [] }, Desglose_niveles: [1, 2, 3, 4, 5].map((n) => nivel(n)),
});
const PALADIN = clase({
    Id: 11, Nombre: 'Paladín', Tipo_dado: { Id: 4, Nombre: 'd10' }, Puntos_habilidad: { Id: 1, Valor: 2 }, Multiclase_restringida: true,
    Habilidades: { Base: [ref(3, 'Concentración')], Custom: [] }, Desglose_niveles: [1, 2, 3, 4].map((n) => nivel(n)),
});
const LIBRO = { Nivel_cero_completo: true, Iniciales: 3, Iniciales_suman_caracteristica: true, Por_nivel: 2 };
const MAGO = clase({
    Id: 9, Nombre: 'Mago', Mod_salv_conjuros: 'Inteligencia', Tipo_dado: { Id: 1, Nombre: 'd4' }, Puntos_habilidad: { Id: 1, Valor: 2 },
    Conjuros: { Arcanos: true, puede_elegir_especialidad: true, Libro: LIBRO },
    Habilidades: { Base: [ref(3, 'Concentración')], Custom: [] },
    Desglose_niveles: [nivel(1, { Conjuros_diarios: diarios(3, 1) }), nivel(2, { Conjuros_diarios: diarios(4, 2) }),
        nivel(3, { Conjuros_diarios: diarios(4, 2, 1) }), nivel(4, { Conjuros_diarios: diarios(4, 3, 2) })],
});
const HECHICERO = clase({
    Id: 8, Nombre: 'Hechicero', Mod_salv_conjuros: 'Carisma', Tipo_dado: { Id: 1, Nombre: 'd4' }, Puntos_habilidad: { Id: 1, Valor: 2 },
    Conjuros: { Arcanos: true, Lanzamiento_espontaneo: true, Intercambio: { Desde: 4, Cada: 2, Margen: 2 } },
    Habilidades: { Base: [ref(3, 'Concentración')], Custom: [] },
    Desglose_niveles: [nivel(1, { Conjuros_diarios: diarios(5, 3) }), nivel(2, { Conjuros_diarios: diarios(6, 4) }),
        nivel(3, { Conjuros_diarios: diarios(6, 5) }), nivel(4, { Conjuros_diarios: diarios(6, 6, 3) }), nivel(5, { Conjuros_diarios: diarios(6, 6, 4) })],
});
const CONJUROS = [
    conjuro(101, 'Detectar magia', 9, 'Mago', 0), conjuro(102, 'Luz', 9, 'Mago', 0), conjuro(103, 'Mano de mago', 9, 'Mago', 0),
    ...[111, 112, 113, 114, 115, 116, 117, 118].map((id) => conjuro(id, `Primero ${id}`, 9, 'Mago', 1)),
    conjuro(121, 'Invisibilidad', 9, 'Mago', 2),
    conjuro(201, 'Luz', 8, 'Hechicero', 0), conjuro(202, 'Mano de mago', 8, 'Hechicero', 0), conjuro(203, 'Detectar magia', 8, 'Hechicero', 0),
    conjuro(211, 'Proyectil mágico', 8, 'Hechicero', 1), conjuro(221, 'Invisibilidad', 8, 'Hechicero', 2),
];
const CLASES = [GUERRERO, PALADIN, MAGO, HECHICERO];

function catalogos(svc: NuevoPersonajeService): NuevoPersonajeService {
    svc.setCatalogoTiposCriatura([TIPO]);
    svc.setCatalogoHabilidades(HABILIDADES as any);
    svc.setCatalogoClases(CLASES);
    svc.setCatalogoDotes(DOTES);
    svc.setCatalogoConjuros(CONJUROS);
    return svc;
}

function crear(raza: Raza, caracteristicas: Partial<Record<Car, number>>): NuevoPersonajeService {
    const svc = catalogos(new NuevoPersonajeService());
    svc.seleccionarRaza(raza);
    svc.aplicarCaracteristicasGeneradas({ Fuerza: 10, Destreza: 10, Constitucion: 10, Inteligencia: 10, Sabiduria: 10, Carisma: 10, ...caracteristicas });
    return svc;
}

/** Un nivel como lo hace la creación (y la subida): la clase, el incremento, los rangos, las dotes y los conjuros. */
function aplicarNivel(svc: NuevoPersonajeService, c: Clase, incremento: Car = 'Fuerza', antesDeLosRangos?: () => void): void {
    const r = svc.aplicarSiguienteNivelClase(c);
    expect(r.aplicado).withContext(`${c.Nombre}: ${r.razon}`).toBeTrue();
    const contexto = `${c.Nombre} nivel ${r.nivelAplicado}`;
    svc.registrarAumentosPendientesPorProgresion(contexto);
    const aumentos = svc.getAumentosCaracteristicaPendientes();
    if (aumentos.length)
        expect(svc.aplicarAumentosCaracteristica(aumentos.map((a) => ({ idPendiente: a.id, caracteristica: incremento })))).toBeTrue();
    svc.registrarDotesPendientesPorRazaExtras('Raza');
    svc.registrarDotesPendientesPorProgresion(contexto);
    antesDeLosRangos?.();
    svc.iniciarDistribucionHabilidadesPorClase(c);
    // Primero las de clase y, con lo que sobre, las demás (el reparto no se cierra con puntos que se pueden gastar).
    const enOrden = [...svc.getHabilidadesSesion()].sort((a, b) =>
        Number(svc.esHabilidadClaseaEfectiva(claveHabilidad(b))) - Number(svc.esHabilidadClaseaEfectiva(claveHabilidad(a))));
    for (const habilidad of enOrden)
        for (let i = 0; i < 20 && svc.puedeSubirRangoHabilidad(claveHabilidad(habilidad)); i++)
            svc.ajustarRangoHabilidad(claveHabilidad(habilidad), 1);
    expect(svc.cerrarDistribucionHabilidades()).not.toBeNull();
    for (let p = svc.getSiguienteDotePendiente(), i = 0; p && i < 10; p = svc.getSiguienteDotePendiente(), i++) {
        const libre = DOTES.find((d) => !(svc.PersonajeCreacion.DotesContextuales ?? []).some((x) => x?.Dote?.Id === d.Id));
        if (!libre || !svc.aplicarDotePendiente(p.id, { idDote: libre.Id, idExtra: 0, extra: '' }))
            svc.omitirDotePendiente(p.id);
    }
    if (svc.getConjurosSesionActual().activa) {
        for (let i = 0; i < 20 && !svc.puedeCerrarSesionConjuros(); i++) {
            const libre = svc.filtrarConjurosDisponibles('', null, false)[0];
            if (!libre || !svc.seleccionarConjuroSesion(libre.Id))
                break;
        }
        svc.cerrarSesionConjuros();
    }
}

/** Lo que guardaría el alta: el cuerpo del motor con sus niveles (en el orden y con lo elegido en cada uno). */
function guardar(svc: NuevoPersonajeService): { entrada: PersonajeCreateRequestDto; personaje: Personaje; } {
    const pj = svc.PersonajeCreacion;
    pj.Nombre = 'Tordek';
    pj.Campana = 'Sin campaña';
    const vida = svc.calcularVidaFinalAleatoria();
    pj.Vida = vida.total;
    const entrada = new PersonajeService({ currentUser: null } as any, {} as any).construirPayloadCreacionDesdePersonaje(pj,
        { idAlineamiento: 1, idGenero: 1, idDeidad: 0, catalogos: { clases: CLASES.map((c) => ({ id: c.Id, nombre: c.Nombre })) } } as any,
        null, svc.getProgresionLanzadorPersistible());
    entrada.niveles = (svc.getNivelesParaGuardar(entrada.progresionLanzador, vida.detalle?.dados) ?? [])
        .map((n) => ({ ...n, ordenConocido: true } as any));
    return { entrada, personaje: JSON.parse(JSON.stringify(pj)) };
}

function subir(guardado: { entrada: PersonajeCreateRequestDto; personaje: Personaje; }, raza: Raza): NuevoPersonajeService {
    const svc = catalogos(new NuevoPersonajeService());
    svc.iniciarSubidaDesdeFicha({ personaje: JSON.parse(JSON.stringify(guardado.personaje)), entrada: guardado.entrada, raza });
    return svc;
}

describe('Subida de nivel con el motor de la creación (personajes de referencia)', () => {
    const ENANO = crearRaza('Enano', { Constitucion: 2, Carisma: -2 });
    const HUMANO = crearRaza('Humano');

    it('la creación apunta en cada nivel lo que se elige en él: dotes, rangos e incrementos (sin leer frases)', () => {
        const svc = crear(ENANO, { Fuerza: 15, Constitucion: 13 });
        [1, 2, 3, 4].forEach(() => aplicarNivel(svc, GUERRERO, 'Fuerza'));
        const niveles = guardar(svc).entrada.niveles!;
        const tipos = (i: number) => (niveles[i].elecciones ?? []).map((e) => e.tipo);
        expect(niveles.map((n) => [n.idClase, n.nivelClase])).toEqual([[7, 1], [7, 2], [7, 3], [7, 4]]);
        expect(tipos(0)).toContain('dote');
        expect(tipos(0)).toContain('rangos');
        expect(tipos(1)).not.toContain('dote');
        expect(tipos(2)).toContain('dote');
        expect(niveles[3].elecciones).toContain(jasmine.objectContaining({ tipo: 'incremento', idElemento: 1, valor: 1 }));
        expect(niveles[0].pg?.maximo).toBeTrue();
    });

    it('un guerrero enano que sube de 1 a 4: los niveles 2 y 3 no piden incremento; el 4, sí, y sin dote (MJ p. 22)', () => {
        const svc = crear(ENANO, { Fuerza: 15, Constitucion: 13 });
        aplicarNivel(svc, GUERRERO);
        let guardado = guardar(svc);
        const fuerzaInicial = guardado.personaje.Fuerza;
        for (const nivelPersonaje of [2, 3, 4]) {
            const subida = subir(guardado, ENANO);
            // Lo ya concedido no se vuelve a pedir; la base sale con la puntuación de antes.
            expect(subida.getDotesPendientes()).toEqual([]);
            expect(subida.PersonajeCreacion.Fuerza).toBe(guardado.personaje.Fuerza);
            expect(subida.PersonajeCreacion.Constitucion).toBe(guardado.personaje.Constitucion);
            const antes = subida.PersonajeCreacion.Fuerza;
            const r = subida.aplicarSiguienteNivelClase(GUERRERO);
            expect(r.aplicado).toBeTrue();
            subida.registrarAumentosPendientesPorProgresion(`Guerrero nivel ${nivelPersonaje}`);
            subida.registrarDotesPendientesPorProgresion(`Guerrero nivel ${nivelPersonaje}`);
            expect(subida.getAumentosCaracteristicaPendientes().length).toBe(nivelPersonaje === 4 ? 1 : 0);
            expect(subida.getDotesPendientes().length).toBe(nivelPersonaje === 3 ? 1 : 0);
            if (nivelPersonaje === 4) {
                const [pendiente] = subida.getAumentosCaracteristicaPendientes();
                expect(subida.aplicarAumentosCaracteristica([{ idPendiente: pendiente.id, caracteristica: 'Fuerza' }])).toBeTrue();
                expect(subida.PersonajeCreacion.Fuerza).toBe(antes + 1);
                expect(subida.getEleccionesDelNivelEnCurso()).toContain(jasmine.objectContaining({ tipo: 'incremento', idElemento: 1, valor: 1 }));
            }
            // La siguiente vuelta sube desde lo que guardaría esta subida.
            subida.getDotesPendientes().filter((d) => d.estado === 'pendiente').forEach((d) => subida.aplicarDotePendiente(d.id, { idDote: 55, idExtra: 0, extra: '' }));
            guardado = guardar(subida);
        }
        expect(guardado.personaje.Fuerza).toBe(fuerzaInicial + 1);
        expect((guardado.personaje.desgloseClases ?? []).map((c) => [c.Nombre, c.Nivel])).toEqual([['Guerrero', 4]]);
    });

    it('la ficha que se manda: la entrada con el nivel nuevo, el incremento y los rangos, y los niveles de antes tal cual', () => {
        const svc = crear(ENANO, { Fuerza: 15, Constitucion: 13 });
        [1, 2, 3].forEach(() => aplicarNivel(svc, GUERRERO));
        const guardado = guardar(svc);
        const subida = subir(guardado, ENANO);
        const cuerpoAntes = new PersonajeService({ currentUser: null } as any, {} as any).construirPayloadCreacionDesdePersonaje(
            { ...subida.PersonajeCreacion, Nombre: 'Tordek', Campana: 'Sin campaña' } as Personaje, { idAlineamiento: 1, idGenero: 1, idDeidad: 0 } as any);
        aplicarNivel(subida, GUERRERO, 'Constitucion');
        const cuerpoDespues = new PersonajeService({ currentUser: null } as any, {} as any).construirPayloadCreacionDesdePersonaje(
            { ...subida.PersonajeCreacion, Nombre: 'Tordek', Campana: 'Sin campaña' } as Personaje, { idAlineamiento: 1, idGenero: 1, idDeidad: 0 } as any);
        const tiradas = (guardado.entrada.niveles ?? []).map((n) => n.pg?.tirada).filter((t): t is number => !!t);
        expect(tiradas.length).toBe(3);
        // Con 13 + 2 (enano) = 15 (+2) → 16 (+3): +1 retroactivo en cada uno de los 3 DG de antes.
        const pg = puntosGolpeTrasSubida({
            pgAntes: guardado.entrada.personaje.puntosGolpe ?? 0, modConAntes: modConstitucionDeEntrada(guardado.entrada),
            modConDespues: subida.PersonajeCreacion.ModConstitucion, tiradasAnteriores: tiradas, dgsSinTirada: 0, tirada: 6,
        });
        expect(modConstitucionDeEntrada(guardado.entrada)).toBe(2);
        expect(subida.PersonajeCreacion.ModConstitucion).toBe(3);
        expect(pg).toEqual(jasmine.objectContaining({ retroactivo: 3, delNivel: 9, exacto: true }));
        const ficha = fichaDeLaSubida({
            entrada: guardado.entrada, antes: cuerpoAntes, despues: cuerpoDespues, idClase: 7,
            nivel: { idClase: 7, nivelClase: 4, elecciones: subida.getEleccionesDelNivelEnCurso() }, puntosGolpe: pg.total,
        });
        expect(ficha.colecciones?.clases).toEqual([{ idClase: 7, nivel: 4 }]);
        expect(ficha.caracteristicas.constitucion.valor).toBe(guardado.entrada.caracteristicas.constitucion.valor + 1);
        expect(ficha.caracteristicas.fuerza.valor).toBe(guardado.entrada.caracteristicas.fuerza.valor);
        expect(ficha.personaje.puntosGolpe).toBe((guardado.entrada.personaje.puntosGolpe ?? 0) + 12);
        expect(ficha.niveles?.slice(0, 3)).toEqual(guardado.entrada.niveles!);
        expect(ficha.niveles?.[3].elecciones).toContain(jasmine.objectContaining({ tipo: 'incremento', idElemento: 3 }));
        expect(ficha.niveles?.[3].elecciones).toContain(jasmine.objectContaining({ tipo: 'rangos', idElemento: 2 }));
    });

    it('un mago 3 con Int 11 que sube a 4 con Int 12: el nivel 2 de conjuros se abre y los puntos de este nivel suben (MJ p. 10)', () => {
        const svc = crear(HUMANO, { Inteligencia: 11 });
        [1, 2, 3].forEach(() => aplicarNivel(svc, MAGO, 'Inteligencia'));
        const subida = subir(guardar(svc), HUMANO);
        expect(subida.PersonajeCreacion.Inteligencia).toBe(11);
        expect(subida.aplicarSiguienteNivelClase(MAGO).aplicado).toBeTrue();
        subida.registrarAumentosPendientesPorProgresion('Mago nivel 4');
        const segundo = () => subida.getConjurosSesionActual().entradas
            .some((e) => Object.values(e.nivelesPorConjuro ?? {}).some((n) => Number(n) === 2));
        expect(segundo()).toBeFalse();
        const [pendiente] = subida.getAumentosCaracteristicaPendientes();
        expect(subida.aplicarAumentosCaracteristica([{ idPendiente: pendiente.id, caracteristica: 'Inteligencia' }])).toBeTrue();
        expect(subida.PersonajeCreacion.Inteligencia).toBe(12);
        expect(segundo()).toBeTrue();
        subida.iniciarDistribucionHabilidadesPorClase(MAGO);
        expect(subida.EstadoFlujo.habilidades.puntosTotales).toBe(3);
    });

    it('un hechicero que cambia un conjuro en su nivel 4: uno solo, del mismo nivel y dos por debajo del más alto (MJ p. 43-44)', () => {
        const svc = crear(HUMANO, { Carisma: 16 });
        [1, 2, 3].forEach(() => aplicarNivel(svc, HECHICERO, 'Carisma'));
        const conocidos = CONJUROS.filter((c) => [201, 202, 211].includes(c.Id))
            .map((c) => ({ ...c, Clase_origen: 'Hechicero', Origen_clase: 'Hechicero' } as Conjuro));
        svc.PersonajeCreacion.Conjuros = conocidos;
        const guardado = guardar(svc);
        expect(guardado.entrada.colecciones?.conjurosConocidos?.map((c) => [c.idConjuro, c.idClase])).toEqual([[201, 8], [202, 8], [211, 8]]);
        const subida = subir(guardado, HUMANO);
        expect(subida.getIntercambioConjurosDelNivel()).toBeNull();
        expect(subida.aplicarSiguienteNivelClase(HECHICERO).aplicado).toBeTrue();
        const intercambio = subida.getIntercambioConjurosDelNivel()!;
        expect(intercambio.nivelMaximo).toBe(2);
        // Solo los de nivel 0 (2 − 2): no proyectil mágico.
        expect(intercambio.olvidables.map((o) => o.conjuro.Id).sort()).toEqual([201, 202]);
        expect(intercambio.candidatos(0).map((c) => c.Id)).toEqual([203]);
        expect(subida.aplicarIntercambioConjuro(201, 221)).toBeFalse();
        expect(subida.aplicarIntercambioConjuro(201, 203)).toBeTrue();
        expect(subida.aplicarIntercambioConjuro(202, 203)).toBeFalse();
        expect(subida.getEleccionesDelNivelEnCurso()).toEqual(jasmine.arrayContaining([
            jasmine.objectContaining({ tipo: 'conjuro_olvidado', idElemento: 201, idExtra: 8, valor: 203 }),
            jasmine.objectContaining({ tipo: 'conjuro', idElemento: 203, idExtra: 8 }),
        ]));
        expect(subida.PersonajeCreacion.Conjuros.map((c) => c.Id).sort()).toEqual([202, 203, 211]);
    });

    it('un paladín 3 / guerrero 1 no vuelve a paladín; con el orden por conocer (una ficha de antes), sí', () => {
        const svc = crear(HUMANO, { Fuerza: 14, Carisma: 14 });
        [PALADIN, PALADIN, PALADIN, GUERRERO].forEach((c) => aplicarNivel(svc, c));
        const guardado = guardar(svc);
        expect(subir(guardado, HUMANO).evaluarClaseParaSeleccion(PALADIN).estado).not.toBe('eligible');
        expect(subir(guardado, HUMANO).evaluarClaseParaSeleccion(GUERRERO).estado).toBe('eligible');
        const deAntes = { ...guardado, entrada: { ...guardado.entrada, niveles: guardado.entrada.niveles!.map((n) => ({ ...n, ordenConocido: false } as any)) } };
        expect(subir(deAntes, HUMANO).evaluarClaseParaSeleccion(PALADIN).estado).toBe('eligible');
    });

    it('la corrección (fase 6): la base corregida recalcula la puntuación, y la dote que deja de cumplirse se ve y se quita', () => {
        const svc = crear(ENANO, { Fuerza: 15, Constitucion: 13 });
        aplicarNivel(svc, GUERRERO);
        const guardado = guardar(svc);
        const corregir = subir(guardado, ENANO);
        const poderoso = { ...dote(60, 'Ataque poderoso'), Prerrequisitos: { caracteristica: [
            { Id_caracteristica: 1, Caracteristica: 'Fuerza', Cantidad: 13, Opcional: 0, Frase: 'Fuerza 13' }] } };
        corregir.setCatalogoDotes([...DOTES, poderoso]);
        corregir.PersonajeCreacion.DotesContextuales.push({
            Dote: poderoso, Contexto: { Entidad: 'personaje', Id_personaje: 0, Id_extra: 0, Extra: '', Origen: 'Dote de nivel 1' },
        } as any);
        expect(corregir.getBaseCaracteristicas().Fuerza).toBe(15);
        expect(corregir.dotesSinSusPrerrequisitos()).toEqual([]);
        corregir.corregirBaseCaracteristica('Fuerza', 11);
        expect(corregir.PersonajeCreacion.Fuerza).toBe(11);
        expect(corregir.dotesSinSusPrerrequisitos().map((d) => [d.idDote, d.origen])).toEqual([[60, 'Dote de nivel 1']]);
        expect(corregir.quitarDoteDeLaFicha(60, 0, 'Dote de nivel 1')).toBeTrue();
        expect(corregir.dotesSinSusPrerrequisitos()).toEqual([]);
        // Lo que suma lo que el motor vuelve a calcular se queda: la puntuación cambia lo mismo que la base.
        const con = corregir.PersonajeCreacion.Constitucion;
        corregir.corregirBaseCaracteristica('Constitucion', corregir.getBaseCaracteristicas().Constitucion + 1);
        expect(corregir.PersonajeCreacion.Constitucion).toBe(con + 1);
    });
});
