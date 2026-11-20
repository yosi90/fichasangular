import { NuevoPersonajeService } from './nuevo-personaje.service';
import { PersonajeService } from './personaje.service';
import { normalizeClase } from './clase.service';
import { Clase } from '../interfaces/clase';
import { Conjuro } from '../interfaces/conjuro';
import { Personaje } from '../interfaces/personaje';
import { Plantilla } from '../interfaces/plantilla';
import { PersonajeCreateRequestDto } from '../interfaces/personajes-api';
import { Raza } from '../interfaces/raza';
import { TipoCriatura } from '../interfaces/tipo_criatura';
import { claveDeHabilidad, claveHabilidad } from './utils/habilidad-clave';
import { mismoExtra, toInt, toNumber } from './utils/normalizacion';
import { plantillaApiDeEjemplo } from 'src/testing/plantilla-api';
import { fichaDeLaSubida, modConstitucionDeEntrada, puntosGolpeTrasSubida } from './utils/subida-nivel';
import { fichaDeLaPlantilla } from './utils/adquirir-plantilla';
import { fichaDeLaMutacion, loQuePierdeEnSuHueco } from './utils/adquirir-raza-mutada';
import { fichaDeLaCorreccion } from './utils/correccion-ficha';
import { fichaDeLaConversion } from './utils/conversion-muerto-viviente';
import { idExtraHabilidadParaGuardar } from './utils/habilidad-extra-visible';
import { fichaSinElNivel, sinLoQueDabanLasDotes } from './utils/perder-nivel';
import { MotorDesdeFichaService } from './motor-desde-ficha.service';
import {
    aplicarReciclajeAlMotor, conjurosParaAprender, conocidosParaReciclar, destinosDeRangos, dotesParaReciclar, fichaConElReciclaje,
    filasDelReciclaje, habilidadesConRangos, huecoDeLaDoteReciclada, idiomasParaReciclar, loQueDejariaDeCumplir, PlanReciclaje, rasgosParaReciclar,
    reciclajeDelPlan,
} from './utils/reciclaje';
import {
    aptitudesConElegir, cambiosDelRasgo, huecoDeLaDoteDelRasgo, nombreDeLoQueTiene, nombreDeOpcion, PlanRasgo,
} from './utils/reciclaje-rasgos';

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

/**
 * Un nivel como lo hace la creación (y la subida): la clase, el incremento, los rangos, las dotes y los conjuros. Con
 * `opciones`: lo elegido en los grupos opcionales de la tabla y en sus aptitudes con «Elegir», y las dotes entre las que
 * elegir las pendientes (la primera que se pueda; sin ellas, la primera de `DOTES` que no tenga, o ninguna).
 */
function aplicarNivel(svc: NuevoPersonajeService, c: Clase, incremento: Car = 'Fuerza', antesDeLosRangos?: () => void,
    opciones: { grupos?: Record<number, string>; extras?: Record<string, { idExtra: number; extra: string; }>; dotes?: any[]; } = {}): void {
    const r = svc.aplicarSiguienteNivelClase(c, opciones.grupos ?? null, null, false, null, opciones.extras ?? null);
    expect(r.aplicado).withContext(`${c.Nombre}: ${r.razon}`).toBeTrue();
    const contexto = `${c.Nombre} nivel ${r.nivelAplicado}`;
    svc.registrarDotesPendientesPorEspeciales(r.especialesAplicados ?? [], contexto);
    svc.registrarAumentosPendientesPorProgresion(contexto);
    const aumentos = svc.getAumentosCaracteristicaPendientes();
    if (aumentos.length)
        expect(svc.aplicarAumentosCaracteristica(aumentos.map((a) => ({ idPendiente: a.id, caracteristica: incremento })))).toBeTrue();
    // Con el nombre de su raza, como la creación y la subida (el origen de su hueco).
    svc.registrarDotesPendientesPorRazaExtras(`${svc.RazaSeleccionada?.Nombre ?? 'Raza'}`);
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
        const tiene = (d: any) => (svc.PersonajeCreacion.DotesContextuales ?? []).some((x) => x?.Dote?.Id === d.Id);
        const pendiente = p;
        const aplicada = opciones.dotes
            ? opciones.dotes.some((d) => !tiene(d) && svc.aplicarDotePendiente(pendiente.id, { idDote: d.Id, idExtra: 0, extra: '' }))
            : (() => {
                const libre = DOTES.find((d) => !tiene(d));
                return !!libre && svc.aplicarDotePendiente(pendiente.id, { idDote: libre.Id, idExtra: 0, extra: '' });
            })();
        if (!aplicada)
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

function subir(guardado: { entrada: PersonajeCreateRequestDto; personaje: Personaje; }, raza: Raza, clases: Clase[] = CLASES,
    dotes: any[] = DOTES): NuevoPersonajeService {
    const svc = catalogos(new NuevoPersonajeService());
    svc.setCatalogoClases(clases);
    svc.setCatalogoDotes(dotes);
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

    it('el paladín que se hace hospitalario sigue pudiendo subir de paladín (Clases_multiclase_compatibles); tras otra clase, no', () => {
        const hospitalario = clase({ ...GUERRERO, Id: 189, Nombre: 'Hospitalario' });
        const paladin = clase({ ...PALADIN, Clases_multiclase_compatibles: [{ Id: 189, Nombre: 'Hospitalario' }] });
        const conCompatibles = (svc: NuevoPersonajeService) => {
            catalogos(svc).setCatalogoClases([...CLASES.filter((c) => toInt(c.Id) !== toInt(PALADIN.Id)), paladin, hospitalario]);
            return svc;
        };
        const svc = conCompatibles(new NuevoPersonajeService());
        svc.seleccionarRaza(HUMANO);
        svc.aplicarCaracteristicasGeneradas({ Fuerza: 14, Destreza: 10, Constitucion: 10, Inteligencia: 10, Sabiduria: 10, Carisma: 14 });
        [paladin, paladin, hospitalario].forEach((c) => aplicarNivel(svc, c));
        expect(svc.evaluarClaseParaSeleccion(paladin).estado).toBe('eligible');
        // La subida, con el orden real de la ficha guardada, igual.
        const guardado = guardar(svc);
        const motor = conCompatibles(new NuevoPersonajeService());
        motor.iniciarSubidaDesdeFicha({ personaje: JSON.parse(JSON.stringify(guardado.personaje)), entrada: guardado.entrada, raza: HUMANO });
        expect(motor.evaluarClaseParaSeleccion(paladin).estado).toBe('eligible');
        aplicarNivel(svc, GUERRERO);
        expect(svc.evaluarClaseParaSeleccion(paladin).estado).not.toBe('eligible');
    });

    it('el paladín 3 que perdió su nivel de guerrero tampoco vuelve a paladín (fase 7: MJ pág. 55)', () => {
        const svc = crear(HUMANO, { Fuerza: 14, Carisma: 14 });
        [PALADIN, PALADIN, PALADIN].forEach((c) => aplicarNivel(svc, c));
        const guardado = guardar(svc);
        expect(subir(guardado, HUMANO).evaluarClaseParaSeleccion(PALADIN).estado).toBe('eligible');
        const perdio = (idClase: number, ordenConocido = true) => {
            const motor = catalogos(new NuevoPersonajeService());
            motor.iniciarSubidaDesdeFicha({ personaje: JSON.parse(JSON.stringify(guardado.personaje)), entrada: guardado.entrada, raza: HUMANO,
                nivelesPerdidos: [{ idClase, ordenConocido, clasesAnteriores: [toInt(PALADIN.Id)] }] });
            return motor.evaluarClaseParaSeleccion(PALADIN).estado;
        };
        expect(perdio(toInt(GUERRERO.Id))).not.toBe('eligible');
        // Un nivel de paladín perdido, o uno de otra clase con el orden por conocer, no lo cierra.
        expect(perdio(toInt(PALADIN.Id))).toBe('eligible');
        expect(perdio(toInt(GUERRERO.Id), false)).toBe('eligible');
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
        // La base es la tirada, sin el +2 racial a la Constitución del enano (que el motor no vuelve a calcular).
        expect(corregir.getBaseCaracteristicas().Constitucion).toBe(13);
        expect(corregir.PersonajeCreacion.Constitucion).toBe(15);
        corregir.corregirBaseCaracteristica('Constitucion', 14);
        expect(corregir.PersonajeCreacion.Constitucion).toBe(16);
        expect(corregir.getBaseCaracteristicas().Carisma).toBe(10);
        expect(corregir.PersonajeCreacion.Carisma).toBe(8);
    });

    it('la corrección evalúa cada dote con lo que tenía en el nivel en que la eligió (su registro), no con lo de ahora', () => {
        const svc = crear(HUMANO, { Fuerza: 12 });
        [1, 2, 3, 4].forEach(() => aplicarNivel(svc, GUERRERO, 'Fuerza'));
        const guardado = guardar(svc);
        expect(guardado.personaje.Fuerza).toBe(13);
        const poderoso = { ...dote(60, 'Ataque poderoso'), Prerrequisitos: { caracteristica: [
            { Id_caracteristica: 1, Caracteristica: 'Fuerza', Cantidad: 13, Opcional: 0, Frase: 'Fuerza 13' }] } };
        const conLaDoteEn = (indice: number) => {
            const entrada = JSON.parse(JSON.stringify(guardado.entrada)) as PersonajeCreateRequestDto;
            entrada.niveles![indice].elecciones = [...(entrada.niveles![indice].elecciones ?? []), { tipo: 'dote', idElemento: 60, idExtra: 0 }];
            const corregir = subir({ entrada, personaje: guardado.personaje }, HUMANO);
            corregir.setCatalogoDotes([...DOTES, poderoso]);
            corregir.PersonajeCreacion.DotesContextuales.push({
                Dote: poderoso, Contexto: { Entidad: 'personaje', Id_personaje: 0, Id_extra: 0, Extra: '', Origen: 'Dote de nivel' },
            } as any);
            return corregir;
        };
        // Elegida en el nivel 1, con Fuerza 12 (el +1 llegó en el 4): no la cumplía.
        expect(conLaDoteEn(0).dotesSinSusPrerrequisitos().map((d) => [d.idDote, d.nivel])).toEqual([[60, 1]]);
        // Elegida en el nivel 4, ya con Fuerza 13: sí.
        expect(conLaDoteEn(3).dotesSinSusPrerrequisitos()).toEqual([]);
        // Sin el orden conocido (una ficha de antes), con lo de ahora.
        const deAntes = conLaDoteEn(0);
        (deAntes as any).ordenConocidoNiveles = [false, false, false, false];
        expect(deAntes.dotesSinSusPrerrequisitos()).toEqual([]);
    });

    it('la corrección elige otra dote en el hueco de la quitada: el tipo que admite su hueco y su mismo origen y nivel', () => {
        const svc = crear(HUMANO, {});
        aplicarNivel(svc, GUERRERO);
        const guardado = guardar(svc);
        const corregir = subir(guardado, HUMANO);
        const deGuerrero = { ...dote(70, 'Esquiva'), Tipos: [{ Id: 2, Nombre: 'Guerrero', Usado: 1 }] };
        corregir.setCatalogoDotes([...DOTES, deGuerrero]);
        corregir.setCatalogoClases([clase({ ...GUERRERO, Desglose_niveles: [nivel(1, { Especiales: [
            { Especial: { Id: 900, Nombre: 'Dote adicional', Otorga_dote: true }, Extra: 'Guerrero', Id_extra: 0, Opcional: 0, Id_interno: 1 }] })] }),
            ...CLASES.filter((c) => c.Id !== GUERRERO.Id)]);
        const hueco = corregir.registrarDoteEnLugarDe({ idDote: 50, idExtra: 0, origen: 'Dote adicional: Guerrero nivel 1' }, 0);
        expect(hueco.tipoPermitido).toBe('Guerrero');
        const candidatos = corregir.obtenerCandidatosDotePendiente(hueco.id);
        expect(candidatos.find((c) => c.dote.Id === 70)?.restringidaPorTipo).toBeFalse();
        expect(candidatos.find((c) => c.dote.Id === 51)?.restringidaPorTipo).toBeTrue();
        expect(corregir.aplicarDotePendiente(hueco.id, { idDote: 70, idExtra: 0, extra: '' })).toBeTrue();
        expect(corregir.PersonajeCreacion.DotesContextuales.some((d) => d?.Dote?.Id === 70 && (d.Contexto as any).Origen === 'Dote adicional: Guerrero nivel 1')).toBeTrue();
        expect(corregir.getOrdenNiveles()[0].elecciones).toContain(jasmine.objectContaining({ tipo: 'dote', idElemento: 70, origen: 'Dote adicional: Guerrero nivel 1' }));
        // Un origen que ningún hueco da (una ficha de antes): cualquier dote.
        expect(corregir.registrarDoteEnLugarDe({ idDote: 51, idExtra: 0, origen: 'API' }, null).tipoPermitido).toBeNull();
    });

    it('la corrección reparte otra vez los rangos de todos los niveles con la Inteligencia corregida (x4 en el primero)', () => {
        const svc = crear(HUMANO, { Inteligencia: 10 });
        [1, 2].forEach(() => aplicarNivel(svc, GUERRERO));
        const corregir = subir(guardar(svc), HUMANO);
        corregir.corregirBaseCaracteristica('Inteligencia', 12);
        const pasos = corregir.pasosDelRepartoDeRangos();
        expect(pasos.map((p) => [p.tipo, p.indice, p.nivelPersonaje])).toEqual([['clase', 0, 1], ['clase', 1, 2]]);
        corregir.empezarRepartoDeRangos();
        expect(corregir.PersonajeCreacion.Habilidades.every((h) => toNumber(h.Rangos) === 0)).toBeTrue();
        expect(corregir.abrirPasoDelRepartoDeRangos(pasos[0])).toBeTrue();
        expect(corregir.EstadoFlujo.habilidades.puntosTotales).toBe(12);
        const clave = (id: number) => claveHabilidad(corregir.getHabilidadesSesion().find((h) => h.Id === id)!);
        expect(corregir.obtenerLimiteRangoHabilidad(clave(2))).toBe(4);
        expect(corregir.ajustarRangoHabilidad(clave(2), 4)).toBeTrue();
        for (let i = 0; i < 20 && corregir.puedeSubirRangoHabilidad(clave(3)); i++)
            corregir.ajustarRangoHabilidad(clave(3), 1);
        expect(corregir.cerrarDistribucionHabilidades()).not.toBeNull();
        expect(corregir.abrirPasoDelRepartoDeRangos(pasos[1])).toBeTrue();
        expect(corregir.EstadoFlujo.habilidades.puntosTotales).toBe(3);
        expect(corregir.ajustarRangoHabilidad(clave(2), 1)).toBeTrue();
        expect(corregir.getOrdenNiveles()[0].elecciones).toContain(jasmine.objectContaining({ tipo: 'rangos', idElemento: 2, valor: 4 }));
    });

    it('la corrección de la edad aplica el envejecimiento de la tabla 6-5 a las características', () => {
        const svc = crear(ENANO, { Fuerza: 14, Sabiduria: 12 });
        aplicarNivel(svc, GUERRERO);
        const guardado = guardar(svc);
        guardado.personaje.Edad = 50;
        const corregir = subir(guardado, ENANO);
        const [fuerza, sabiduria] = [corregir.PersonajeCreacion.Fuerza, corregir.PersonajeCreacion.Sabiduria];
        corregir.corregirEdad(130);
        expect(corregir.PersonajeCreacion.Fuerza).toBe(fuerza - 1);
        expect(corregir.PersonajeCreacion.Sabiduria).toBe(sabiduria + 1);
        corregir.corregirEdad(50);
        expect(corregir.PersonajeCreacion.Fuerza).toBe(fuerza);
    });
});

describe('Adquirir una plantilla con el motor de la creación (sesiones, fase 7)', () => {
    const HUMANO = crearRaza('Humano');
    // Un licántropo infectado (adquirida): 2 DG de animal (d8), +2 a la Sabiduría, sin dotes propias ni prerrequisitos.
    const LOBO_INFECTADO = plantillaApiDeEjemplo({
        Id: 9, Nombre: 'Licántropo (lobo) [Infectado]', Nacimiento: false, Ajuste_nivel: 2, Dotes: [], Habilidades: [], Sortilegas: [],
        Raciales: [], Ataques_especiales: [], Subtipos: [], Modificacion_tamano: null,
        Modificadores_caracteristicas: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 2, Carisma: 0 },
        Prerrequisitos: { ...plantillaApiDeEjemplo().Prerrequisitos, caracteristica: [], criaturas_compatibles: [], tamano_minimo: [], subtipo_prohibido: [] },
    }) as Plantilla;
    // Un vampiro: actualiza los DG a d12 (Manual de monstruos, pág. 257).
    const VAMPIRO = { ...LOBO_INFECTADO, Id: 8, Nombre: 'Vampiro', Ajuste_nivel: 8, Actualiza_dg: true, Tipo_dado: { Id_tipo_dado: 5, Nombre: 'd12' },
        Licantronia_dg: null, Modificadores_caracteristicas: { Fuerza: 6, Destreza: 4, Constitucion: 0, Inteligencia: 2, Sabiduria: 2, Carisma: 4 } } as Plantilla;

    it('el guerrero 2 que se vuelve licántropo: +2 a la Sabiduría y sus DG nuevos dan el incremento y la dote de 4 DG y 3 DG', () => {
        const svc = crear(HUMANO, { Fuerza: 15, Sabiduria: 12 });
        [1, 2].forEach(() => aplicarNivel(svc, GUERRERO, 'Fuerza'));
        const guardado = guardar(svc);
        const motor = subir(guardado, HUMANO);
        const sabiduria = motor.PersonajeCreacion.Sabiduria;
        expect(motor.getContextoEvaluacionPlantillas(HUMANO, true).seleccionadas).toEqual([]);
        expect(motor.agregarPlantillaSeleccion(LOBO_INFECTADO)).toBeTrue();
        expect(motor.PersonajeCreacion.Sabiduria).toBe(sabiduria + 2);
        expect(motor.registrarAumentosPendientesPorProgresion('Plantilla').length).toBe(1);
        motor.confirmarSeleccionActualPlantillas();
        expect(motor.iniciarDistribucionHabilidadesPorPlantillasDG([LOBO_INFECTADO])).toBeTrue();
        expect(motor.registrarDotesPendientesPorProgresion('Plantilla').length).toBe(1);
        expect(motor.carasDadoGolpeDeClase(GUERRERO)).toBe(10);
    });

    it('el vampiro pasa a d12 los DG de clase de antes y de después', () => {
        const svc = crear(HUMANO, { Fuerza: 15 });
        aplicarNivel(svc, GUERRERO, 'Fuerza');
        const motor = subir(guardar(svc), HUMANO);
        expect(motor.carasDadoGolpeDeClase(GUERRERO)).toBe(10);
        const fuerza = motor.PersonajeCreacion.Fuerza;
        expect(motor.agregarPlantillaSeleccion(VAMPIRO)).toBeTrue();
        expect(motor.carasDadoGolpeDeClase(GUERRERO)).toBe(12);
        expect(motor.PersonajeCreacion.Fuerza).toBe(fuerza + 6);
        // Sin DG nuevos: ni incremento ni dote.
        expect(motor.registrarAumentosPendientesPorProgresion('Plantilla').length).toBe(0);
        expect(motor.registrarDotesPendientesPorProgresion('Plantilla').length).toBe(0);
    });
});

describe('Las dotes, los subtipos y los requisitos de las plantillas (2026-11-13, dictamen del máster de Rol)', () => {
    const HUMANO = crearRaza('Humano');
    const doteDePlantilla = (id: number, nombre: string, contexto: Record<string, unknown> = {}) =>
        ({ Dote: { ...dote(id, nombre) }, Contexto: { Entidad: 'plantilla', Id_plantilla: 0, Id_extra: 0, Extra: '', Dg: 0, ...contexto } });
    // Esquiva pide Des 13 (MJ, pág. 93); las demás del vampiro, nada.
    const ESQUIVA = { ...dote(60, 'Esquiva'), Prerrequisitos: { caracteristica: [{ Id_caracteristica: 2, Caracteristica: 'Destreza', Cantidad: 13, Opcional: 0 }] } };
    const ALERTA = dote(61, 'Alerta');
    const RASTREAR = dote(62, 'Rastrear');
    const SOLTURA = dote(63, 'Soltura con un arma');
    const VOLUNTAD = dote(64, 'Voluntad de hierro');
    const CON_DOTES = [...DOTES, ESQUIVA, ALERTA, RASTREAR, SOLTURA, VOLUNTAD];
    const conDotes = (svc: NuevoPersonajeService) => { svc.setCatalogoDotes(CON_DOTES); return svc; };

    const BASE = plantillaApiDeEjemplo({
        Dotes: [], Habilidades: [], Sortilegas: [], Raciales: [], Ataques_especiales: [], Subtipos: [], Modificacion_tamano: null,
        Licantronia_dg: null, Nacimiento: false, Ajuste_nivel: 0,
        Modificadores_caracteristicas: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
        Prerrequisitos: { ...plantillaApiDeEjemplo().Prerrequisitos, caracteristica: [], criaturas_compatibles: [], tamano_minimo: [], subtipo_prohibido: [] },
    }) as Plantilla;
    // El vampiro: Des +4 y sus dotes, «siempre y cuando cumpla los prerrequisitos y no las posea de antemano» (MM1, pág. 258).
    const VAMPIRO = { ...BASE, Id: 8, Nombre: 'Vampiro',
        Modificadores_caracteristicas: { ...BASE.Modificadores_caracteristicas, Destreza: 4 },
        Dotes: [doteDePlantilla(60, 'Esquiva', { Solo_si_cumple: true, Adicional: true }), doteDePlantilla(61, 'Alerta', { Solo_si_cumple: true, Adicional: true }),
            doteDePlantilla(50, 'Dote 50', { Solo_si_cumple: true, Adicional: true })] } as unknown as Plantilla;
    // El licántropo lobo infectado: 2 DG de animal; Soltura con un arma (mordisco) llena su hueco; Rastrear (B) y la
    // Voluntad de hierro, adicionales (MM1, págs. 178 y 275).
    const LOBO = { ...BASE, Id: 9, Nombre: 'Licántropo (lobo) [Infectado]', Ajuste_nivel: 2,
        Licantronia_dg: { Id_dado: 3, Dado: 'd8', Multiplicador: 2, Suma: 0, Tipo_criatura: { Id: 2, Nombre: 'Animal', Puntos_habilidad: 2 } },
        Dotes: [doteDePlantilla(63, 'Soltura con un arma', { Adicional: false }), doteDePlantilla(62, 'Rastrear', { Adicional: true }),
            doteDePlantilla(64, 'Voluntad de hierro', { Adicional: true })] } as unknown as Plantilla;
    const dotes = (svc: NuevoPersonajeService) => (svc.PersonajeCreacion.DotesContextuales ?? []).map((d) => d.Dote.Nombre);

    it('el vampiro da Esquiva solo si con su +4 llega a Des 13, y no repite una dote que ya tiene', () => {
        const torpe = conDotes(crear(HUMANO, { Fuerza: 15, Destreza: 8 }));
        aplicarNivel(torpe, GUERRERO, 'Fuerza');
        expect(dotes(torpe)).toContain('Dote 50');
        expect(torpe.agregarPlantillaSeleccion(VAMPIRO)).toBeTrue();
        expect(torpe.PersonajeCreacion.Destreza).toBe(12);
        expect(dotes(torpe)).not.toContain('Esquiva');
        expect(dotes(torpe)).toContain('Alerta');
        expect(dotes(torpe).filter((n) => n === 'Dote 50').length).toBe(1);

        const agil = conDotes(crear(HUMANO, { Fuerza: 15, Destreza: 9 }));
        aplicarNivel(agil, GUERRERO, 'Fuerza');
        expect(agil.agregarPlantillaSeleccion(VAMPIRO)).toBeTrue();
        expect(agil.PersonajeCreacion.Destreza).toBe(13);
        expect(dotes(agil)).toContain('Esquiva');
    });

    it('al adquirir el vampiro se evalúan con el personaje de ahora; las de un vampiro ya guardado no se vuelven a evaluar', () => {
        const svc = conDotes(crear(HUMANO, { Fuerza: 15, Destreza: 9 }));
        aplicarNivel(svc, GUERRERO, 'Fuerza');
        const motor = conDotes(subir(guardar(svc), HUMANO));
        expect(motor.agregarPlantillaSeleccion(VAMPIRO)).toBeTrue();
        expect(dotes(motor)).toContain('Esquiva');

        // Un vampiro guardado con Des 12 (sin Esquiva) que llega después a 13: la subida no se la da (decisión del máster).
        const torpe = conDotes(crear(HUMANO, { Fuerza: 15, Destreza: 8 }));
        expect(torpe.agregarPlantillaSeleccion(VAMPIRO)).toBeTrue();
        aplicarNivel(torpe, GUERRERO, 'Fuerza');
        const guardado = guardar(torpe);
        expect(guardado.personaje.DotesContextuales.map((d) => d.Dote.Nombre)).not.toContain('Esquiva');
        guardado.personaje.Destreza = 13;
        const subida = conDotes(new NuevoPersonajeService());
        catalogos(subida).setCatalogoDotes(CON_DOTES);
        subida.iniciarSubidaDesdeFicha({ personaje: JSON.parse(JSON.stringify(guardado.personaje)), entrada: guardado.entrada, raza: HUMANO, plantillas: [VAMPIRO] });
        expect(dotes(subida)).not.toContain('Esquiva');
    });

    it('el humano guerrero 4 que se vuelve licántropo lobo no elige dote: Soltura con un arma llena el hueco del 6.º DG (MM1, pág. 178)', () => {
        const svc = conDotes(crear(HUMANO, { Fuerza: 15 }));
        [1, 2, 3, 4].forEach(() => aplicarNivel(svc, GUERRERO, 'Fuerza'));
        const motor = conDotes(subir(guardar(svc), HUMANO));
        expect(motor.agregarPlantillaSeleccion(LOBO)).toBeTrue();
        expect(motor.registrarDotesPendientesPorProgresion('Plantilla').length).toBe(0);
        expect(dotes(motor)).toEqual(jasmine.arrayContaining(['Soltura con un arma', 'Rastrear', 'Voluntad de hierro']));

        // Si todas las del animal fueran adicionales, el hueco del 6.º DG se elige.
        const todasAdicionales = { ...LOBO, Id: 10, Dotes: LOBO.Dotes.map((d) => ({ ...d, Contexto: { ...d.Contexto, Adicional: true } })) } as Plantilla;
        const otro = conDotes(subir(guardar(svc), HUMANO));
        expect(otro.agregarPlantillaSeleccion(todasAdicionales)).toBeTrue();
        expect(otro.registrarDotesPendientesPorProgresion('Plantilla').length).toBe(1);
    });

    it('en la creación, el licántropo lobo guerrero 1 (3 DG) elige una dote y la del animal llena la otra', () => {
        const svc = conDotes(crear(HUMANO, { Fuerza: 15 }));
        expect(svc.agregarPlantillaSeleccion(LOBO)).toBeTrue();
        const r = svc.aplicarSiguienteNivelClase(GUERRERO);
        expect(r.aplicado).toBeTrue();
        expect(svc.registrarDotesPendientesPorProgresion('Guerrero nivel 1').length).toBe(1);
    });

    it('el agrandado: lo gana la criatura a la que la plantilla cambia de verdad el tipo, por el dato del subtipo (MM1, pág. 291)', () => {
        const ANIMAL: TipoCriatura = { ...TIPO, Id: 3, Nombre: 'Animal' } as TipoCriatura;
        const BESTIA: TipoCriatura = { ...TIPO, Id: 4, Nombre: 'Bestia mágica' } as TipoCriatura;
        const pareja = (comp: number, nuevo: number, comodin: string | null = null) =>
            ({ Id_tipo_compatible: comp, Tipo_compatible: '', Id_tipo_nuevo: nuevo, Tipo_nuevo: '', Tipo_nuevo_comodin: comodin, Opcional: 1, Frase: '' });
        // Como la criatura de las sombras: el animal pasa a bestia mágica; el humanoide conserva su tipo.
        const SOMBRAS = { ...BASE, Id: 148, Nombre: 'Criatura de las sombras',
            Prerrequisitos: { ...BASE.Prerrequisitos, criaturas_compatibles: [pareja(3, 4), pareja(1, 0, 'cualquiera')] },
            Compatibilidad_tipos: [
                { Id_tipo_comp: 3, Id_tipo_nuevo: 4, Tipo_comp: 'Animal', Tipo_nuevo: 'Bestia mágica', Tipo_nuevo_comodin: null, Opcional: 1 },
                { Id_tipo_comp: 1, Id_tipo_nuevo: 0, Tipo_comp: 'Humanoide', Tipo_nuevo: 'Cualquiera', Tipo_nuevo_comodin: 'cualquiera', Opcional: 1 },
            ] } as unknown as Plantilla;
        const SUBTIPOS = [{ Id: 41, Nombre: 'Agrandado', Al_cambiar_tipo: true }, { Id: 50, Nombre: 'Extraplanario', Al_cambiar_tipo: false }] as any;
        const subtipos = (svc: NuevoPersonajeService) => (svc.PersonajeCreacion.Subtipos ?? []).map((s) => s.Nombre);

        const humano = crear(HUMANO, {});
        humano.setCatalogoSubtipos(SUBTIPOS);
        expect(humano.agregarPlantillaSeleccion(SOMBRAS)).toBeTrue();
        expect(subtipos(humano)).not.toContain('Agrandado');

        const lobo = { ...crearRaza('Lobo'), Tipo_criatura: ANIMAL } as Raza;
        const animal = catalogos(new NuevoPersonajeService());
        animal.setCatalogoTiposCriatura([TIPO, ANIMAL, BESTIA]);
        animal.setCatalogoSubtipos(SUBTIPOS);
        animal.seleccionarRaza(lobo);
        expect(animal.agregarPlantillaSeleccion(SOMBRAS)).toBeTrue();
        expect(animal.PersonajeCreacion.Tipo_criatura.Nombre).toBe('Bestia mágica');
        expect(subtipos(animal)).toEqual(['Agrandado']);
    });

    it('los requisitos nuevos: un psiónico que manifieste poderes de 6.º nivel (el erudito espectral, El psiónico completo, pág. 138)', () => {
        const svc = crear(HUMANO, { Fuerza: 15 });
        aplicarNivel(svc, GUERRERO, 'Fuerza');
        const ctx = svc.getContextoEvaluacionPlantillas(HUMANO, true);
        expect(ctx.clasesConNivel).toEqual([{ id: 7, nombre: 'Guerrero', nivel: 1 }]);
        expect(ctx.nivelPoderPsionicoMaximo).toBe(0);
    });

    it('Control de forma, de clase para el licántropo infectado en su nivel de clase y en los DG del animal, sin bonificador (MM1, pág. 303)', () => {
        const CONTROL = { Id_habilidad: 90, Nombre: 'Control de forma', Id_caracteristica: 5, Caracteristica: 'Sabiduria', Descripcion: '', Soporta_extra: false, Entrenada: false, Extras: [] };
        const contraida = {
            Id: 900, Nombre: 'Licantropía contraída', Descripcion: '', Oficial: true, Opcional: 0, Dotes: [], Caracteristicas: [], Salvaciones: [],
            Sortilegas: [], Ataques: [], Prerrequisitos_flags: {}, Prerrequisitos: {},
            Habilidades: { Base: [], Custom: [{ Id_habilidad: 90, Habilidad: 'Control de forma', Id_caracteristica: 5, Caracteristica: 'Sabiduría', Id_extra: -1, Extra: '', Rangos: 0, Se_considera_clasea: true }] },
        };
        const infectado = { ...LOBO, Raciales: [{ Racial: contraida, Dg: 0 }] } as unknown as Plantilla;
        const nacido = { ...LOBO, Id: 11, Nombre: 'Licántropo (lobo) [Nacido]', Nacimiento: true } as unknown as Plantilla;
        const clave = claveDeHabilidad(90, true);

        const svc = conDotes(crear(HUMANO, { Fuerza: 15, Sabiduria: 12 }));
        svc.setCatalogoHabilidadesCustom([CONTROL] as any);
        expect(svc.agregarPlantillaSeleccion(infectado)).toBeTrue();
        const control = svc.PersonajeCreacion.Habilidades.find((h) => h.Custom && h.Id === 90);
        expect(control?.Clasea).toBeTrue();
        expect(toInt(control?.Rangos_varios)).toBe(0);
        expect(svc.iniciarDistribucionHabilidadesPorPlantillasDG([infectado])).toBeTrue();
        expect(svc.esHabilidadClaseaEfectiva(clave)).toBeTrue();
        expect(svc.obtenerCosteRangoHabilidad(clave)).toBe(1);
        svc.cerrarDistribucionHabilidades();
        svc.iniciarDistribucionHabilidadesPorClase(GUERRERO);
        expect(svc.esHabilidadClaseaEfectiva(clave)).toBeTrue();

        // El nacido no la tiene de clase («no necesita esta habilidad»).
        const otro = conDotes(crear(HUMANO, { Fuerza: 15 }));
        otro.setCatalogoHabilidadesCustom([CONTROL] as any);
        expect(otro.agregarPlantillaSeleccion(nacido)).toBeTrue();
        expect(otro.PersonajeCreacion.Habilidades.find((h) => h.Custom && h.Id === 90)?.Clasea ?? false).toBeFalse();
    });
});

describe('Los rasgos y los ataques especiales de las plantillas, en la ficha (2026-11-13)', () => {
    const HUMANO = crearRaza('Humano');
    const racial = (id: number, nombre: string) => ({
        Id: id, Nombre: nombre, Descripcion: '', Oficial: true, Opcional: 0, Dotes: [], Caracteristicas: [], Salvaciones: [],
        Sortilegas: [], Ataques: [], Prerrequisitos_flags: {}, Prerrequisitos: {}, Habilidades: { Base: [], Custom: [] },
    });
    const OSCURIDAD = racial(8, 'Visión en la oscuridad 60\'');
    // El celestial (MM1, pág. 30): visión en la oscuridad y castigar al mal desde el principio; uno de ejemplo, a 8 DG.
    const CELESTIAL = plantillaApiDeEjemplo({
        Id: 1, Nombre: 'Celestial', Dotes: [], Habilidades: [], Sortilegas: [], Subtipos: [], Modificacion_tamano: null,
        Licantronia_dg: null, Nacimiento: false, Ajuste_nivel: 2,
        Modificadores_caracteristicas: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
        Prerrequisitos: { ...plantillaApiDeEjemplo().Prerrequisitos, caracteristica: [], criaturas_compatibles: [], tamano_minimo: [], subtipo_prohibido: [] },
        Raciales: [{ Racial: OSCURIDAD, Dg: 0 }, { Racial: racial(130, 'De 8 DG'), Dg: 8 }],
        Ataques_especiales: [{ Racial: racial(128, 'Castigar al mal (celestial)'), Dg: 0 }],
    }) as unknown as Plantilla;
    const raciales = (svc: NuevoPersonajeService) => (svc.PersonajeCreacion.Raciales ?? []).map((r) => [toInt(r.Id), r.Origen]);

    it('la creación los añade con la plantilla como origen, por sus DG, y los quita con ella', () => {
        const svc = crear(HUMANO, { Fuerza: 15 });
        aplicarNivel(svc, GUERRERO, 'Fuerza');
        expect(svc.agregarPlantillaSeleccion(CELESTIAL)).toBeTrue();
        expect(raciales(svc)).toEqual(jasmine.arrayContaining([[8, 'Celestial'], [128, 'Celestial']]));
        expect(raciales(svc).some(([id]) => id === 130)).toBeFalse();
        // El cuerpo del alta los lleva (`personaje_raciales`, que la ficha enseña).
        expect(guardar(svc).entrada.colecciones?.raciales).toEqual(jasmine.arrayContaining([
            jasmine.objectContaining({ idRacial: 8, origen: 'Celestial' }), jasmine.objectContaining({ idRacial: 128, origen: 'Celestial' })]));
        svc.quitarPlantillaSeleccion(1);
        expect(raciales(svc)).toEqual([]);
    });

    it('no repite el que ya tiene por su raza', () => {
        const svc = crear({ ...HUMANO, Nombre: 'Enano', Raciales: [OSCURIDAD] } as unknown as Raza, { Fuerza: 15 });
        expect(svc.agregarPlantillaSeleccion(CELESTIAL)).toBeTrue();
        expect(raciales(svc).filter(([id]) => id === 8)).toEqual([[8, 'Enano']]);
    });

    it('al adquirirla con el personaje creado, y la ficha guardada sin ellos los recibe al cargarla, sin repetirlos', () => {
        const svc = crear(HUMANO, { Fuerza: 15 });
        aplicarNivel(svc, GUERRERO, 'Fuerza');
        const guardado = guardar(svc);
        const motor = subir(guardado, HUMANO);
        const cuerpo = () => new PersonajeService({ currentUser: null } as any, {} as any).construirPayloadCreacionDesdePersonaje(
            { ...motor.PersonajeCreacion, Nombre: 'Tordek', Campana: 'Sin campaña' } as Personaje, { idAlineamiento: 1, idGenero: 1, idDeidad: 0 } as any);
        const antes = cuerpo();
        expect(motor.agregarPlantillaSeleccion(CELESTIAL)).toBeTrue();
        expect(raciales(motor)).toEqual(jasmine.arrayContaining([[8, 'Celestial'], [128, 'Celestial']]));
        // La ficha que manda la adquisición los lleva (`POST /personajes/{id}/plantillas`).
        const ficha = fichaDeLaPlantilla({ entrada: guardado.entrada, antes, despues: cuerpo(), idPlantilla: 1, puntosGolpe: 10, idAlineamiento: null });
        expect(ficha.colecciones?.raciales).toEqual([{ idRacial: 8, origen: 'Celestial' }, { idRacial: 128, origen: 'Celestial' }]);

        // Una ficha con la plantilla guardada antes, sin sus rasgos: el motor (la subida, la corrección) se los da.
        const sinEllos = catalogos(new NuevoPersonajeService());
        sinEllos.iniciarSubidaDesdeFicha({ personaje: JSON.parse(JSON.stringify(guardado.personaje)), entrada: guardado.entrada, raza: HUMANO, plantillas: [CELESTIAL] });
        expect(raciales(sinEllos)).toEqual([[8, 'Celestial'], [128, 'Celestial']]);

        // Y la que ya los tiene no los repite.
        const conEllos = catalogos(new NuevoPersonajeService());
        conEllos.iniciarSubidaDesdeFicha({ personaje: JSON.parse(JSON.stringify(motor.PersonajeCreacion)), entrada: guardado.entrada, raza: HUMANO, plantillas: [CELESTIAL] });
        expect(raciales(conEllos)).toEqual([[8, 'Celestial'], [128, 'Celestial']]);
    });

    it('las dotes de sus rasgos (`racial_dotes`), por sus DG, con el rasgo como origen, y se van con la plantilla', () => {
        const conDote = { ...racial(140, 'Rasgo con dote'), Dotes: [{ Id_dote: 21, Dote: 'Alerta', Id_extra: 0, Extra: '' }] };
        const deMasDg = { ...racial(141, 'Rasgo de 8 DG con dote'), Dotes: [{ Id_dote: 22, Dote: 'Aguante', Id_extra: 0, Extra: '' }] };
        const plantilla = { ...CELESTIAL, Id: 2, Nombre: 'Con dotes', Raciales: [{ Racial: conDote, Dg: 0 }, { Racial: deMasDg, Dg: 8 }], Ataques_especiales: [] } as unknown as Plantilla;
        const svc = crear(HUMANO, { Fuerza: 15 });
        aplicarNivel(svc, GUERRERO, 'Fuerza');
        const dotes = () => (svc.PersonajeCreacion.DotesContextuales ?? []).map((d) => [toInt(d.Dote?.Id), (d.Contexto as any)?.Origen]);
        expect(svc.agregarPlantillaSeleccion(plantilla)).toBeTrue();
        expect(dotes()).toEqual(jasmine.arrayContaining([[21, 'Rasgo con dote']]));
        expect(dotes().some(([id]) => id === 22)).toBeFalse();
        svc.quitarPlantillaSeleccion(2);
        expect(dotes().some(([id]) => id === 21)).toBeFalse();
    });
});

describe('Las dotes que se quedan sin un prerrequisito al perder un nivel (MJ pág. 87)', () => {
    const HUMANO = crearRaza('Humano');

    it('la Constitución perdida a 1.er nivel o el nivel que se pierde: solo las que antes cumplían, y el motor queda como estaba', () => {
        const svc = crear(HUMANO, { Fuerza: 13, Constitucion: 13 });
        aplicarNivel(svc, GUERRERO);
        const guardado = guardar(svc);
        const motor = subir(guardado, HUMANO);
        const conCon = { ...dote(61, 'Dureza mejorada'), Prerrequisitos: { caracteristica: [
            { Id_caracteristica: 3, Caracteristica: 'Constitucion', Cantidad: 13, Opcional: 0, Frase: 'Constitución 13' }] } };
        const conFue = { ...dote(62, 'Ataque poderoso'), Prerrequisitos: { caracteristica: [
            { Id_caracteristica: 1, Caracteristica: 'Fuerza', Cantidad: 13, Opcional: 0, Frase: 'Fuerza 13' }] } };
        motor.setCatalogoDotes([...DOTES, conCon, conFue]);
        [conCon, conFue].forEach((d) => motor.PersonajeCreacion.DotesContextuales.push({
            Dote: d, Contexto: { Entidad: 'personaje', Id_personaje: 0, Id_extra: 0, Extra: '', Origen: 'Dote de nivel 1' },
        } as any));
        const con = motor.PersonajeCreacion.Constitucion;
        expect(motor.dotesSinPrerrequisitosTrasPerder({ caracteristica: { clave: 'Constitucion', menos: 2 } }).map((d) => d.idDote)).toEqual([61]);
        expect(motor.PersonajeCreacion.Constitucion).toBe(con);
        expect(motor.dotesSinSusPrerrequisitos()).toEqual([]);
        // El incremento que se pierde baja la Fuerza: Ataque poderoso.
        expect(motor.dotesSinPrerrequisitosTrasPerder({ caracteristica: { clave: 'Fuerza', menos: 1 } }).map((d) => d.idDote)).toEqual([62]);
        // Una que se va con el nivel no cuenta.
        expect(motor.dotesSinPrerrequisitosTrasPerder({ caracteristica: { clave: 'Fuerza', menos: 1 }, dotesQuitadas: [{ idDote: 62, idExtra: 0 }] })).toEqual([]);
        expect((motor.PersonajeCreacion.DotesContextuales ?? []).some((d) => toInt(d.Dote?.Id) === 62)).toBeTrue();
    });
});

describe('Los rangos del nivel que se pierde, también los de una habilidad sin extra (-1 en el motor, 0 en la elección)', () => {
    const HUMANO = crearRaza('Humano');

    it('el motor los quita al perder el nivel (y los cuenta al ver qué dotes se quedan sin sus prerrequisitos)', () => {
        const svc = crear(HUMANO, { Fuerza: 13, Constitucion: 13 });
        aplicarNivel(svc, GUERRERO);
        const guardado = guardar(svc);
        const motor = subir(guardado, HUMANO);
        const trepar = () => motor.PersonajeCreacion.Habilidades.find((h) => toInt(h.Id) === 2)!;
        const antes = toInt(trepar().Rangos);
        expect(antes).toBeGreaterThan(0);
        expect(idExtraHabilidadParaGuardar(trepar())).toBe(-1);
        // La ficha sin el nivel quita sus rangos con el extra de la elección (sin él, 0).
        const sinElNivel = fichaSinElNivel({ entrada: guardado.entrada, indice: 0, clase: GUERRERO, caras: 10, dgsAntes: 1 });
        const deTrepar = sinElNivel.quitado.rangos.find((r) => r.idHabilidad === 2)!;
        expect(deTrepar).toEqual({ idHabilidad: 2, idExtra: 0, rangos: antes });
        motor.perderNivelEnElMotor({ idClase: GUERRERO.Id, rangos: sinElNivel.quitado.rangos, indiceNivel: 0 });
        expect(toInt(trepar().Rangos)).toBe(0);
    });

    it('mismoExtra: -1 (sin extra), 0 («Elegir») y sin él son el mismo; un extra elegido, solo el suyo', () => {
        expect([mismoExtra(-1, 0), mismoExtra(-1, undefined), mismoExtra(0, null)]).toEqual([true, true, true]);
        expect([mismoExtra(4, 4), mismoExtra(4, 0), mismoExtra(-1, 4)]).toEqual([true, false, false]);
    });
});

describe('El reciclaje del Manual del jugador II con el motor de la creación (págs. 194-196)', () => {
    const HUMANO = crearRaza('Humano');
    const GUERRERO_6 = clase({ ...GUERRERO, Id: 17, Nombre: 'Guerrero veterano', Desglose_niveles: [1, 2, 3, 4, 5, 6].map((n) => nivel(n)) });
    const ESQUIVA = dote(50, 'Esquiva');
    const MOVILIDAD = { ...dote(51, 'Movilidad'), Prerrequisitos: { dote: [
        { Id_dote_prerrequisito: 50, Dote_prerrequisito: 'Esquiva', Opcional: 0, Frase: 'Esquiva' }] } };
    const DE_ATAQUE_6 = { ...dote(60, 'Golpe de veterano'), Prerrequisitos: { ataque_base: [{ Ataque_base: 6, Opcional: 0, Frase: 'Ataque base +6' }] } };

    /** Un humano creado nivel a nivel (sus dotes, 50, 51… por orden) y su subida, con el catálogo de dotes dado. */
    function subidaDe(niveles: number, catalogo: any[], deClase: Clase = GUERRERO): NuevoPersonajeService {
        const svc = crear(HUMANO, { Fuerza: 13, Destreza: 13 });
        if (deClase !== GUERRERO)
            svc.setCatalogoClases([...CLASES, deClase]);
        Array.from({ length: niveles }).forEach(() => aplicarNivel(svc, deClase));
        const motor = subir(guardar(svc), HUMANO, deClase !== GUERRERO ? [...CLASES, deClase] : CLASES);
        motor.setCatalogoDotes(catalogo);
        return motor;
    }

    it('Esquiva no se recicla si tiene Movilidad (la pide), y Movilidad sí; el motor se queda como estaba', () => {
        const motor = subidaDe(3, [ESQUIVA, MOVILIDAD, ...DOTES.slice(2)]);
        const dotes = dotesParaReciclar(motor);
        expect(dotes.map((d) => [d.idDote, d.indiceNivel])).toEqual([[50, 0], [51, 2]]);
        expect(dotes[0].motivo).toBe('La necesita lo que tiene: Movilidad (No cumple: Esquiva).');
        expect(dotes[1].motivo).toBeNull();
        expect(motor.PersonajeCreacion.DotesContextuales.map((d) => toInt(d.Dote?.Id))).toEqual([50, 51]);
        expect(motor.dotesSinSusPrerrequisitos()).toEqual([]);
    });

    it('Esquiva no se cambia por Movilidad: sin la que se va, Movilidad no cumple sus prerrequisitos', () => {
        const motor = subidaDe(1, [ESQUIVA, MOVILIDAD, ...DOTES.slice(2)]);
        const [esquiva] = dotesParaReciclar(motor);
        expect(esquiva.motivo).toBeNull();
        const hueco = huecoDeLaDoteReciclada(motor, esquiva, false)!;
        expect(hueco.candidatos.some((c) => c.dote.Id === 50)).toBeFalse();
        expect(hueco.candidatos.find((c) => c.dote.Id === 51)?.evaluacion.estado).not.toBe('eligible');
        expect(hueco.candidatos.find((c) => c.dote.Id === 52)?.evaluacion.estado).toBe('eligible');
        expect(motor.aplicarDotePendiente(hueco.pendiente.id, { idDote: 51, idExtra: 0, extra: '' })).toBeFalse();
    });

    it('una dote de nivel 3 no se cambia por una que pide ataque base +6, aunque ahora lo tenga; la de nivel 6, sí', () => {
        const motor = subidaDe(6, [...DOTES, DE_ATAQUE_6], GUERRERO_6);
        expect(motor.PersonajeCreacion.Ataque_base).toContain('6');
        const dotes = dotesParaReciclar(motor);
        expect(dotes.map((d) => d.indiceNivel)).toEqual([0, 2, 5]);
        const estado = motor.exportarEstadoSubida();
        const deNivel3 = huecoDeLaDoteReciclada(motor, dotes[1], false)!;
        expect(deNivel3.candidatos.find((c) => c.dote.Id === 60)?.evaluacion.estado).not.toBe('eligible');
        expect(motor.restaurarEstadoSubida(estado)).toBeTrue();
        const deNivel6 = huecoDeLaDoteReciclada(motor, dotes[2], false)!;
        expect(deNivel6.candidatos.find((c) => c.dote.Id === 60)?.evaluacion.estado).toBe('eligible');
    });

    it('la dote en el motor: la nueva en el hueco de la antigua; y la ficha que se manda, con el cambio y el nivel nuevo', () => {
        const svc = crear(HUMANO, {});
        [1, 2].forEach(() => aplicarNivel(svc, GUERRERO));
        const guardado = guardar(svc);
        const motor = subir(guardado, HUMANO);
        const [quita] = dotesParaReciclar(motor);
        expect(quita.motivo).toBeNull();
        const plan: PlanReciclaje = { tipo: 'dote', quita, seleccion: { idDote: 53, idExtra: 0, extra: '' }, pone: { idDote: 53, idExtra: 0, nombre: 'Dote 53', extra: '' } };
        expect(aplicarReciclajeAlMotor(motor, plan)).toBeTrue();
        const contextuales = motor.PersonajeCreacion.DotesContextuales;
        expect(contextuales.some((d) => toInt(d.Dote?.Id) === quita.idDote)).toBeFalse();
        expect((contextuales.find((d) => toInt(d.Dote?.Id) === 53)?.Contexto as any)?.Origen).toBe(quita.origen);
        expect(reciclajeDelPlan(plan)).toEqual({ tipo: 'dote', quita: { idDote: quita.idDote, idExtra: 0, orden: 1 }, pone: { idDote: 53, idExtra: 0 } });

        const entrada = fichaConElReciclaje(guardado.entrada, reciclajeDelPlan(plan), { origenDote: quita.origen });
        const conNivel = JSON.parse(JSON.stringify(entrada)) as PersonajeCreateRequestDto;
        conNivel.colecciones!.dotes = [...(conNivel.colecciones!.dotes ?? []), { idDote: 54, idExtra: 0, origen: 'Dote por nivel 3' }];
        const ficha = fichaDeLaSubida({
            entrada, antes: entrada, despues: conNivel, idClase: 7, puntosGolpe: 20,
            nivel: { idClase: 7, nivelClase: 3, elecciones: [{ tipo: 'dote', idElemento: 54, idExtra: 0 }] },
        });
        expect((ficha.colecciones?.dotes ?? []).map((d) => toInt(d.idDote)).sort()).toEqual([53, 54]);
        expect((ficha.colecciones?.dotes ?? []).find((d) => d.idDote === 53)?.origen).toBe(quita.origen);
        expect(ficha.niveles?.slice(0, 2)).toEqual(guardado.entrada.niveles as any);
        expect(ficha.niveles?.length).toBe(3);
    });

    it('los rangos, también a una de clase por su raza o un dominio, como en la ficha (Esconderse, con el dominio de la Superchería)', () => {
        const svc = crear(HUMANO, { Inteligencia: 10 });
        [1, 2].forEach(() => aplicarNivel(svc, GUERRERO));
        const destinoEsconderse = (deClase: boolean) => {
            const guardado = guardar(svc);
            // La ficha de la API la da de clase (`deClase`) por su dominio (`dominio_habilidades`) o un racial «siempre de
            // clase» (`se_considera_clasea`), aunque no sea de guerrero.
            const fila = guardado.personaje.Habilidades.find((h) => toInt(h.Id) === 2)!;
            guardado.personaje.Habilidades.push({ ...fila, Id: 4, Nombre: 'Esconderse', Clasea: deClase, Rangos: 0, Rangos_varios: 0 });
            const motor = subir(guardado, HUMANO);
            const trepar = habilidadesConRangos(motor, guardado.entrada).find((h) => h.idHabilidad === 2)!;
            return destinosDeRangos(motor, guardado.entrada, trepar, 1, 2, [GUERRERO]).find((d) => d.idHabilidad === 4)!;
        };
        const deClase = destinoEsconderse(true);
        expect(deClase.motivo).toBeNull();
        // Es de las suyas: la subida no tiene que ser de otra clase.
        expect(deClase.clases).toBeNull();
        expect(destinoEsconderse(false).motivo).toContain('No es de clase');
    });

    it('los rangos, a una de clase para alguna de sus clases o la que sube, sin pasar del nivel + 3; y no los que pide algo que tiene', () => {
        const svc = crear(HUMANO, { Inteligencia: 10 });
        [1, 2].forEach(() => aplicarNivel(svc, GUERRERO));
        const guardado = guardar(svc);
        const motor = subir(guardado, HUMANO);
        const trepar = habilidadesConRangos(motor, guardado.entrada).find((h) => h.idHabilidad === 2)!;
        expect(trepar.rangos).toBeGreaterThan(0);
        const concentracion = (destinos: ReturnType<typeof destinosDeRangos>) => destinos.find((d) => d.idHabilidad === 3)!;
        // Concentración no es de guerrero: vale si puede subir de paladín, y entonces la subida tiene que ser de paladín.
        expect(concentracion(destinosDeRangos(motor, guardado.entrada, trepar, 1, 2, [GUERRERO])).motivo).toContain('No es de clase');
        const conPaladin = concentracion(destinosDeRangos(motor, guardado.entrada, trepar, 1, 2, [GUERRERO, PALADIN]));
        expect(conPaladin.motivo).toBeNull();
        expect(conPaladin.clases).toEqual([{ id: 11, nombre: 'Paladín' }]);
        expect(concentracion(destinosDeRangos(motor, guardado.entrada, trepar, 4, 0, [PALADIN])).motivo).toContain('pasaría de 3 rangos');

        const trepador = { ...dote(63, 'Trepador'), Prerrequisitos: { habilidad: [
            { Id_habilidad: 2, Habilidad: 'Trepar', Cantidad: trepar.rangos, Requiere_extra: 0, Extras: [], Opcional: 0, Frase: `Trepar ${trepar.rangos} rangos` }] } };
        motor.setCatalogoDotes([...DOTES, trepador]);
        motor.PersonajeCreacion.DotesContextuales.push({
            Dote: trepador, Contexto: { Entidad: 'personaje', Id_personaje: 0, Id_extra: 0, Extra: '', Origen: 'Dote de nivel 1' },
        } as any);
        expect(motor.dotesSinSusPrerrequisitos()).toEqual([]);
        expect(loQueDejariaDeCumplir(motor, { rangos: { idHabilidad: 2, idExtra: 0, rangos: 1 } })).toEqual([`Trepador (No cumple: Trepar ${trepar.rangos} rangos)`]);
        expect(motor.PersonajeCreacion.Habilidades.find((h) => h.Id === 2)?.Rangos).toBe(trepar.rangos);
    });

    it('una clase en su nivel máximo: con soloPrerrequisitos se miran sus prerrequisitos, no que ya no pueda subirla', () => {
        const svc = crear(HUMANO, { Inteligencia: 10 });
        [1, 2].forEach(() => aplicarNivel(svc, GUERRERO));
        const terminada = { ...GUERRERO, Nivel_max_claseo: 2 };
        expect(svc.evaluarClaseParaSeleccion(terminada).razones).toContain('Nivel máximo alcanzado para esta clase');
        // Así el reciclaje ve qué deja de cumplir una de prestigio terminada (y la vuelta a la vida y la raza mutada lo avisan).
        const prerrequisitos = svc.evaluarClaseParaSeleccion(terminada, { soloPrerrequisitos: true });
        expect(prerrequisitos.razones ?? []).not.toContain('Nivel máximo alcanzado para esta clase');
        expect(prerrequisitos.estado).toBe('eligible');
    });

    it('los conjuros: solo las clases con tabla de conocidos, y otro del mismo nivel que no conozca', () => {
        const svc = crear(HUMANO, { Carisma: 16 });
        aplicarNivel(svc, HECHICERO);
        svc.PersonajeCreacion.Conjuros = CONJUROS.filter((c) => [201, 202, 211].includes(c.Id))
            .map((c) => ({ ...c, Clase_origen: 'Hechicero', Origen_clase: 'Hechicero' } as Conjuro));
        const guardado = guardar(svc);
        const motor = subir(guardado, HUMANO);
        // El hechicero de estas pruebas no trae su tabla de conocidos: sin ella, no recicla (el mago, por su libro, tampoco).
        expect(conocidosParaReciclar(motor, guardado.entrada)).toEqual([]);
        const conTabla = clase({ ...HECHICERO, Conjuros: { ...HECHICERO.Conjuros, Conocidos_nivel_a_nivel: true } });
        motor.setCatalogoClases([GUERRERO, PALADIN, MAGO, conTabla]);
        const [hechicero] = conocidosParaReciclar(motor, guardado.entrada);
        expect(hechicero.id).toBe(8);
        expect(hechicero.conocidos.map((c) => [c.idConjuro, c.nivel, c.motivo])).toEqual([[201, 0, null], [202, 0, null], [211, 1, null]]);
        expect(conjurosParaAprender(motor, guardado.entrada, hechicero, 0, false).map((c) => c.Id)).toEqual([203]);
        expect(conjurosParaAprender(motor, guardado.entrada, hechicero, 0, false, [203])).toEqual([]);
        expect(conjurosParaAprender(motor, guardado.entrada, hechicero, 2, false).map((c) => c.Id)).toEqual([221]);
    });

    it('el idioma y los conjuros, en el motor: el que entra en lugar del que sale', () => {
        const svc = crear(HUMANO, { Carisma: 16 });
        aplicarNivel(svc, HECHICERO);
        svc.PersonajeCreacion.Conjuros = CONJUROS.filter((c) => [201, 202].includes(c.Id))
            .map((c) => ({ ...c, Clase_origen: 'Hechicero', Origen_clase: 'Hechicero' } as Conjuro));
        const motor = subir(guardar(svc), HUMANO);
        expect(aplicarReciclajeAlMotor(motor, { tipo: 'conjuros', cambios: [
            { idClase: 8, clase: 'Hechicero', olvida: { id: 201, nombre: 'Luz' }, aprende: { id: 203, nombre: 'Detectar magia' } }] })).toBeTrue();
        expect(motor.PersonajeCreacion.Conjuros.map((c) => c.Id).sort()).toEqual([202, 203]);
        motor.setCatalogoIdiomas([
            { Id: 1, Nombre: 'Común', Descripcion: '', Secreto: false, Oficial: true },
            { Id: 2, Nombre: 'Élfico', Descripcion: '', Secreto: false, Oficial: true },
            { Id: 3, Nombre: 'Druídico', Descripcion: '', Secreto: true, Oficial: true },
        ]);
        motor.PersonajeCreacion.Idiomas = [
            { Nombre: 'Común', Descripcion: '', Secreto: false, Oficial: true, Origen: 'Humano' },
            { Nombre: 'Druídico', Descripcion: '', Secreto: true, Oficial: true, Origen: 'Druida nivel 1' },
        ];
        const entrada = { colecciones: { idiomas: [{ idIdioma: 1, origen: 'Humano' }, { idIdioma: 3, origen: 'Druida nivel 1' }] } } as PersonajeCreateRequestDto;
        const { quitables, aprendibles } = idiomasParaReciclar(motor, entrada, false);
        expect(quitables.map((i) => [i.nombre, i.motivo])).toEqual([['Común', null], ['Druídico', 'Es un idioma secreto: no se recicla.']]);
        expect(aprendibles.map((i) => i.nombre)).toEqual(['Élfico']);
        expect(aplicarReciclajeAlMotor(motor, { tipo: 'idioma', quita: { idIdioma: 1, nombre: 'Común' }, pone: { idIdioma: 2, nombre: 'Élfico' } })).toBeTrue();
        expect(motor.PersonajeCreacion.Idiomas.map((i) => [i.Nombre, i.Origen])).toEqual([['Druídico', 'Druida nivel 1'], ['Élfico', 'Humano']]);
    });
});

describe('Lo que da una dote, al quitarla y al poner otra en su hueco (el reciclaje y la corrección; la API no lo recalcula)', () => {
    const HUMANO = crearRaza('Humano');
    // Esquiva no tiene modificadores en los datos (su +1 de esquiva es contra un oponente: no va a la CA), así que la de
    // estas pruebas es una con un modificador que la creación aplica: la iniciativa.
    const INICIATIVA_MEJORADA = { ...dote(50, 'Iniciativa mejorada'), Modificadores: { Iniciativa: 4 } };
    const REFLEJOS_RAPIDOS = { ...dote(52, 'Reflejos rápidos'), Modificadores: { Reflejos: 2 } };
    const CATALOGO = [INICIATIVA_MEJORADA, DOTES[1], REFLEJOS_RAPIDOS, ...DOTES.slice(3)];
    const cuerpo = (motor: NuevoPersonajeService) => new PersonajeService({ currentUser: null } as any, {} as any).construirPayloadCreacionDesdePersonaje(
        { ...motor.PersonajeCreacion, Nombre: 'Tordek', Campana: 'Sin campaña' } as Personaje, { idAlineamiento: 1, idGenero: 1, idDeidad: 0 } as any);
    const deLaDote = (lista: any[] | undefined, nombre: string) => (lista ?? []).filter((m) => `${m?.origen ?? m?.Origen ?? ''}` === `Dote: ${nombre}`);

    function guardado() {
        const svc = crear(HUMANO, {});
        svc.setCatalogoDotes(CATALOGO);
        aplicarNivel(svc, GUERRERO);
        const g = guardar(svc);
        expect(deLaDote(g.entrada.modificadores?.iniciativa, 'Iniciativa mejorada').map((m) => m.valor)).toEqual([4]);
        return g;
    }

    it('al reciclarla: el motor quita la iniciativa de la que se va y pone los Reflejos de la nueva, y la ficha que se manda también', () => {
        const g = guardado();
        const motor = subir(g, HUMANO, CLASES, CATALOGO);
        expect(deLaDote(motor.PersonajeCreacion.Iniciativa_varios, 'Iniciativa mejorada').length).toBe(1);
        const antes = cuerpo(motor);
        const [quita] = dotesParaReciclar(motor);
        expect(quita.idDote).toBe(50);
        const plan: PlanReciclaje = { tipo: 'dote', quita, seleccion: { idDote: 52, idExtra: 0, extra: '' }, pone: { idDote: 52, idExtra: 0, nombre: 'Reflejos rápidos', extra: '' } };
        expect(aplicarReciclajeAlMotor(motor, plan)).toBeTrue();
        expect(deLaDote(motor.PersonajeCreacion.Iniciativa_varios, 'Iniciativa mejorada')).toEqual([]);
        expect(deLaDote(motor.PersonajeCreacion.Salvaciones.reflejos.modsVarios, 'Reflejos rápidos').map((m) => m.valor)).toEqual([2]);

        const ficha = fichaConElReciclaje(g.entrada, reciclajeDelPlan(plan), { origenDote: quita.origen, motor: { antes, despues: cuerpo(motor) } });
        expect(deLaDote(ficha.modificadores?.iniciativa, 'Iniciativa mejorada')).toEqual([]);
        expect(deLaDote(ficha.modificadores?.salvaciones?.reflejos?.varios, 'Reflejos rápidos').map((m) => m.valor)).toEqual([2]);
        expect(ficha.colecciones?.dotes?.map((d) => [d.idDote, d.origen])).toEqual([[52, quita.origen]]);
        // Sin el cuerpo del motor, solo cambia la dote (como antes del arreglo): lo que daba se quedaba.
        expect(deLaDote(fichaConElReciclaje(g.entrada, reciclajeDelPlan(plan)).modificadores?.iniciativa, 'Iniciativa mejorada').length).toBe(1);
    });

    it('en la corrección: quitar la dote quita su iniciativa, y la que entra en su hueco pone lo suyo', () => {
        const g = guardado();
        const motor = subir(g, HUMANO, CLASES, CATALOGO);
        const antes = cuerpo(motor);
        const [d] = motor.dotesDelPersonaje();
        const origen = `${(d.Contexto as any).Origen}`;
        expect(motor.quitarDoteDeLaFicha(50, 0, origen)).toBeTrue();
        expect(deLaDote(motor.PersonajeCreacion.Iniciativa_varios, 'Iniciativa mejorada')).toEqual([]);
        const hueco = motor.registrarDoteEnLugarDe({ idDote: 50, idExtra: 0, origen }, 0);
        expect(motor.aplicarDotePendiente(hueco.id, { idDote: 52, idExtra: 0, extra: '' })).toBeTrue();

        const ficha = fichaDeLaCorreccion(g.entrada, {
            caracteristicas: {}, puntosGolpe: null, dotesQuitadas: [{ idDote: 50, idExtra: 0, origen }], dotesMantenidas: [],
            dotesNuevas: [{ idDote: 52, idExtra: 0, origen, indiceNivel: 0 }], idiomasQuitados: [], conjurosQuitados: [],
            motor: { antes, despues: cuerpo(motor) },
        });
        expect(deLaDote(ficha.modificadores?.iniciativa, 'Iniciativa mejorada')).toEqual([]);
        expect(deLaDote(ficha.modificadores?.salvaciones?.reflejos?.varios, 'Reflejos rápidos').map((m) => m.valor)).toEqual([2]);
        expect(ficha.colecciones?.dotes?.map((x) => x.idDote)).toEqual([52]);
    });
});

describe('Lo que da una dote que se va con el nivel perdido (perder un nivel y convertirse en muerto viviente)', () => {
    const HUMANO = crearRaza('Humano');
    const INICIATIVA_MEJORADA = { ...dote(50, 'Iniciativa mejorada'), Modificadores: { Iniciativa: 4 } };
    const CATALOGO = [INICIATIVA_MEJORADA, ...DOTES.slice(1)];
    const cuerpo = (motor: NuevoPersonajeService) => new PersonajeService({ currentUser: null } as any, {} as any).construirPayloadCreacionDesdePersonaje(
        { ...motor.PersonajeCreacion, Nombre: 'Tordek', Campana: 'Sin campaña' } as Personaje, { idAlineamiento: 1, idGenero: 1, idDeidad: 0 } as any);
    const deLaDote = (lista: any[] | undefined) => (lista ?? []).filter((m) => `${m?.origen ?? m?.Origen ?? ''}` === 'Dote: Iniciativa mejorada');
    /** `MotorDesdeFichaService.loQueDabanLasDotes` con el cuerpo del motor de estas pruebas. */
    const loQueDaban = (motor: NuevoPersonajeService, entrada: PersonajeCreateRequestDto, dotes: Array<{ idDote: number; idExtra: number; }>, dgs: number) =>
        MotorDesdeFichaService.prototype.loQueDabanLasDotes.call({ cuerpoDelMotor: (m: NuevoPersonajeService) => cuerpo(m) } as any, motor, entrada, dotes, dgs);

    function perdida() {
        const svc = crear(HUMANO, {});
        svc.setCatalogoDotes(CATALOGO);
        aplicarNivel(svc, GUERRERO);
        const g = guardar(svc);
        const motor = subir(g, HUMANO, CLASES, CATALOGO);
        const sinElNivel = fichaSinElNivel({ entrada: g.entrada, indice: 0, clase: GUERRERO, caras: 10, dgsAntes: 1 });
        return { g, motor, sinElNivel };
    }

    it('al perder el nivel, la ficha que se manda se queda sin la iniciativa de Iniciativa mejorada; el motor, como estaba', () => {
        const { g, motor, sinElNivel } = perdida();
        expect(sinElNivel.quitado.dotes.map((d) => d.idDote)).toContain(50);
        // Sin el arreglo, la dote se iba y su iniciativa se quedaba.
        expect(deLaDote(sinElNivel.ficha.modificadores?.iniciativa).map((m) => m.valor)).toEqual([4]);

        const resultado = sinLoQueDabanLasDotes(sinElNivel, loQueDaban(motor, g.entrada, sinElNivel.quitado.dotes, 0));

        expect(deLaDote(resultado.ficha.modificadores?.iniciativa)).toEqual([]);
        expect(resultado.ficha.colecciones?.dotes?.map((d) => d.idDote)).not.toContain(50);
        expect(deLaDote(motor.PersonajeCreacion.Iniciativa_varios).length).toBe(1);
        expect(motor.PersonajeCreacion.DotesContextuales.some((d) => d.Dote.Id === 50)).toBeTrue();
    });

    it('en la conversión, tampoco: ni en la ficha sin el nivel ni en lo que compara el motor', () => {
        const { g, motor, sinElNivel } = perdida();
        const resultado = sinLoQueDabanLasDotes(sinElNivel, loQueDaban(motor, g.entrada, sinElNivel.quitado.dotes, 0));
        motor.perderNivelEnElMotor({ idClase: GUERRERO.Id, dotesQuitadas: resultado.quitado.dotes, indiceNivel: 0 });
        const antes = cuerpo(motor);
        expect(deLaDote(antes.modificadores?.iniciativa)).toEqual([]);

        const ficha = fichaDeLaConversion({
            entrada: resultado.ficha, antes, despues: antes, idRaza: 1009, idRazaBase: HUMANO.Id, puntosGolpe: 12,
            idClaseDeMonstruo: 482, nivel: { idClase: 482, nivelClase: 1, elecciones: [] }, sustituidos: [], sinPrerrequisitos: [],
        });
        expect(deLaDote(ficha.modificadores?.iniciativa)).toEqual([]);
        expect(ficha.colecciones?.dotes?.map((d) => d.idDote)).not.toContain(50);
    });
});

describe('Adquirir una raza mutada con el motor de la creación (sesiones, fase 7; Races of the Dragon, pág. 10)', () => {
    // Un humano con su dote adicional y sus puntos de habilidad extra (Manual del jugador, pág. 13) y su idioma.
    const HUMANO = {
        ...crearRaza('Humano'), Id: 25, Dotes_adicionales: 1, Puntos_habilidad_extra_primer_nivel: 4, Puntos_habilidad_extra_por_nivel: 1,
        Idiomas: [{ Nombre: 'Común' }],
    } as unknown as Raza;
    // La prole de Bahamut sobre el humano, como la combina la API: los ajustes de la base más +2 Con y −2 Des, sin la dote ni
    // los puntos del humano, y el Dracónico.
    const PROLE = {
        ...HUMANO, Id: 21, Nombre: 'Prole de Bahamut', Mutada: true, Dotes_adicionales: 0, Puntos_habilidad_extra_primer_nivel: 0,
        Puntos_habilidad_extra_por_nivel: 0, Modificadores: { ...HUMANO.Modificadores, Constitucion: 2, Destreza: -2 },
        Idiomas: [{ Nombre: 'Común' }, { Nombre: 'Dracónico' }],
    } as unknown as Raza;
    const IDIOMAS = [{ id: 1, nombre: 'Común' }, { id: 7, nombre: 'Dracónico' }];
    const cuerpo = (motor: NuevoPersonajeService) => new PersonajeService({ currentUser: null } as any, {} as any).construirPayloadCreacionDesdePersonaje(
        { ...motor.PersonajeCreacion, Nombre: 'Tordek', Campana: 'Sin campaña' } as Personaje,
        { idAlineamiento: 1, idGenero: 1, idDeidad: 0, catalogos: { clases: CLASES.map((c) => ({ id: c.Id, nombre: c.Nombre })), idiomas: IDIOMAS } } as any);

    it('la prole sobre un humano guerrero 2: Con +2 y Des −2, pierde la dote del humano que elige y sus puntos, y aprende el Dracónico', () => {
        const svc = crear(HUMANO, { Fuerza: 15, Constitucion: 14, Destreza: 12 });
        [1, 2].forEach(() => aplicarNivel(svc, GUERRERO));
        const g = guardar(svc);
        const motor = subir(g, HUMANO);
        const antes = cuerpo(motor);
        const { Constitucion: con, Destreza: des } = motor.PersonajeCreacion;
        expect(loQuePierdeEnSuHueco(HUMANO, PROLE, 2)).toEqual({ dotes: 1, puntos: 5 });
        // La dote que pierde se elige con su raza de ahora: con la prole, el hueco del humano ya no está.
        const perderibles = dotesParaReciclar(motor).filter((d) => !d.motivo);
        expect(perderibles.length).toBe(2);

        expect(motor.adquirirRazaMutada(PROLE)).toBeTrue();
        expect(motor.PersonajeCreacion.Constitucion).toBe(con + 2);
        expect(motor.PersonajeCreacion.Destreza).toBe(des - 2);
        expect(motor.PersonajeCreacion.RazaBase?.Nombre).toBe('Humano');
        expect(motor.RazaSeleccionada?.Nombre).toBe('Prole de Bahamut');
        expect((motor.PersonajeCreacion.Idiomas ?? []).map((i) => i.Nombre)).toContain('Dracónico');
        // No se pone una mutación sobre otra.
        expect(motor.adquirirRazaMutada(PROLE)).toBeFalse();
        const [laDelHumano] = perderibles;
        expect(motor.quitarDoteDeLaFicha(laDelHumano.idDote, laDelHumano.idExtra, laDelHumano.origen)).toBeTrue();

        const ficha = fichaDeLaMutacion({ entrada: g.entrada, antes, despues: cuerpo(motor), idRaza: 21, idRazaBase: 25, puntosGolpe: 20 });
        expect([ficha.personaje.idRaza, ficha.personaje.idRazaBase]).toEqual([21, 25]);
        expect(ficha.caracteristicas.constitucion.valor).toBe(g.entrada.caracteristicas.constitucion.valor + 2);
        expect(ficha.caracteristicas.destreza.valor).toBe(g.entrada.caracteristicas.destreza.valor - 2);
        expect(ficha.caracteristicas.fuerza.valor).toBe(g.entrada.caracteristicas.fuerza.valor);
        expect((ficha.colecciones?.dotes ?? []).length).toBe((g.entrada.colecciones?.dotes ?? []).length - 1);
        expect((ficha.colecciones?.dotes ?? []).some((d) => d.idDote === laDelHumano.idDote)).toBeFalse();
        expect(ficha.colecciones?.idiomas).toContain(jasmine.objectContaining({ idIdioma: 7 }));
        expect(ficha.personaje.puntosGolpe).toBe(20);
        expect(ficha.niveles).toEqual(g.entrada.niveles!);
    });

    it('una dote que deja de cumplirse (Des 13, con la Des −2 de la prole) se cambia por otra en su mismo hueco', () => {
        const svc = crear(HUMANO, { Fuerza: 15, Destreza: 13 });
        aplicarNivel(svc, GUERRERO);
        const g = guardar(svc);
        const conDes = [{ ...DOTES[0], Prerrequisitos: { caracteristica: [{ Id_caracteristica: 2, Caracteristica: 'Destreza', Cantidad: 13, Opcional: 0 }] } },
            ...DOTES.slice(1)];
        const motor = subir(g, HUMANO, CLASES, conDes);
        expect(motor.dotesSinSusPrerrequisitos()).toEqual([]);
        const antes = cuerpo(motor);
        expect(motor.adquirirRazaMutada(PROLE)).toBeTrue();
        const [rota, ...otras] = motor.dotesSinSusPrerrequisitos();
        expect([rota?.idDote, otras.length]).toEqual([50, 0]);
        expect(motor.quitarDoteDeLaFicha(rota.idDote, rota.idExtra, rota.origen)).toBeTrue();
        const hueco = motor.registrarDoteEnLugarDe(rota, rota.nivel === null ? null : rota.nivel - 1);
        expect(motor.aplicarDotePendiente(hueco.id, { idDote: 53, idExtra: 0, extra: '' })).toBeTrue();
        expect(motor.dotesSinSusPrerrequisitos()).toEqual([]);

        const ficha = fichaDeLaMutacion({ entrada: g.entrada, antes, despues: cuerpo(motor), idRaza: 21, idRazaBase: 25, puntosGolpe: 12 });
        const dotes = (ficha.colecciones?.dotes ?? []).map((d) => [d.idDote, d.origen]);
        expect(dotes).toContain([53, rota.origen]);
        expect(dotes.some(([id]) => id === 50)).toBeFalse();
        expect(dotes.length).toBe((g.entrada.colecciones?.dotes ?? []).length);
    });
});

describe('El reciclaje de un rasgo de clase (R3; Manual del jugador II, págs. 194-195: los grupos de su tabla y «Elegir»)', () => {
    const HUMANO = crearRaza('Humano');
    const requisitos = { Id_especial_requerido: -1, Id_dote_requerida: -1 };
    const filaDote = (d: any, opcional: number, idInterno: number, extra: Record<string, any> = {}) => ({
        Dote: d, Nivel: 0, Id_extra: null, Extra: '', Opcional: opcional, Id_interno: idInterno, ...requisitos, ...extra });
    const filaEspecial = (especial: Record<string, any>, opcional: number, idInterno: number, extra: Record<string, any> = {}) => ({
        Especial: especial, Nivel: 0, Id_extra: null, Extra: '', Opcional: opcional, Id_interno: idInterno, ...requisitos, ...extra });
    const deTipo = (d: any, tipo: string) => ({ ...d, Tipos: [{ Id: 9, Nombre: tipo, Usado: 1 }] });
    const pide = (id: number, nombre: string) => ({ dote: [{ Id_dote_prerrequisito: id, Dote_prerrequisito: nombre, Opcional: 0, Frase: nombre }] });
    const ataque = (n: number) => ({ ataque_base: [{ Ataque_base: n, Opcional: 0, Frase: `Ataque base +${n}` }] });
    const DOTE_ADICIONAL = { Id: 5, Nombre: 'Dote adicional', Otorga_dote: true };
    const dotesDe = (motor: NuevoPersonajeService) => motor.PersonajeCreacion.DotesContextuales.map((d) => [toInt(d.Dote?.Id), `${(d.Contexto as any)?.Origen ?? ''}`]);
    const aptitudesDe = (motor: NuevoPersonajeService) => motor.PersonajeCreacion.Claseas.map((e) => [toInt(e.Id), Math.max(0, toInt(e.Id_extra))]);
    type OpcionesDeNivel = Parameters<typeof aplicarNivel>[4];

    /** Crea el personaje nivel a nivel (con lo que elige en cada nivel de su clase) y lo prepara para subir. */
    function crearYSubir(c: Clase, niveles: number, catalogo: any[], porNivel: Record<number, OpcionesDeNivel> = {}) {
        const svc = crear(HUMANO, { Destreza: 15 });
        svc.setCatalogoClases([...CLASES, c]);
        svc.setCatalogoDotes(catalogo);
        for (let n = 1; n <= niveles; n++)
            aplicarNivel(svc, c, 'Destreza', undefined, porNivel[n] ?? {});
        const guardado = guardar(svc);
        return { guardado, motor: subir(guardado, HUMANO, [...CLASES, c], catalogo) };
    }

    describe('el estilo de combate del explorador (MJ pág. 40)', () => {
        const CDA = dote(11, 'Combate con dos armas');
        const DR = dote(52, 'Disparo rápido');
        const CDAM = dote(12, 'Combate con dos armas mejorado');
        const DM = dote(323, 'Disparos múltiples');
        const DEFENSA = { ...dote(70, 'Defensa con dos armas'), Prerrequisitos: pide(11, 'Combate con dos armas') };
        const CATALOGO = [...DOTES, CDA, DR, CDAM, DM, DEFENSA];
        // Los datos de rol_dev: el estilo es el grupo 1 de su nivel 2 y sus dotes, de los grupos que piden su `id_interno`.
        const EXPLORADOR = clase({
            Id: 6, Nombre: 'Explorador', Tipo_dado: { Id: 3, Nombre: 'd8' }, Puntos_habilidad: { Id: 1, Valor: 6 },
            Habilidades: { Base: [ref(2, 'Trepar')], Custom: [] },
            Desglose_niveles: [1, 2, 3, 4, 5, 6].map((n) => nivel(n, n === 2 ? {
                Dotes: [filaDote(CDA, 2, 3, { Id_especial_requerido: 2 }), filaDote(DR, 2, 2, { Id_especial_requerido: 3 })],
                Especiales: [filaEspecial({ Id: 39, Nombre: 'Estilo de combate (Combate con dos armas)' }, 1, 2),
                    filaEspecial({ Id: 156, Nombre: 'Estilo de combate (Tiro con arco)' }, 1, 3)],
            } : n === 6 ? {
                Dotes: [filaDote(CDAM, 1, 5, { Id_especial_requerido: 2 }), filaDote(DM, 1, 4, { Id_especial_requerido: 3 })],
            } : {})),
        });
        // En su nivel 2: dote:0 y dote:1 (sus dotes), especial:2 (dos armas) y especial:3 (tiro con arco).
        const conDosArmas = (niveles: number) => crearYSubir(EXPLORADOR, niveles, CATALOGO, { 2: { grupos: { 1: 'especial:2' } } });

        it('el explorador 6 pasa del combate con dos armas al tiro con arco: Combate con dos armas pasa a Disparo rápido y la mejorada a Disparos múltiples', () => {
            const { guardado, motor } = conDosArmas(6);
            expect(dotesDe(motor)).toContain([11, 'Explorador nivel 2']);
            expect(dotesDe(motor)).toContain([12, 'Explorador nivel 6']);
            // Las dotes del estilo no son huecos: con un estilo solo hay una posible (la da la tabla).
            const huecos = rasgosParaReciclar(motor);
            expect(huecos.length).toBe(1);
            const [hueco] = huecos;
            expect(hueco).toEqual(jasmine.objectContaining({ idClase: 6, nivelClase: 2, grupo: 1, motivo: null, indiceNivel: 1 }));
            expect(nombreDeLoQueTiene(hueco)).toBe('Estilo de combate (Combate con dos armas)');
            expect(hueco.opciones.map((o) => [nombreDeOpcion(o), o.motivo])).toEqual([['Estilo de combate (Tiro con arco)', null]]);

            const pone = hueco.opciones[0];
            const plan: PlanRasgo = { tipo: 'rasgo', hueco, pone, doteElegida: null, cambios: cambiosDelRasgo(motor, hueco, pone) };
            expect(plan.cambios.filter((c) => c.derivado).map((c) => [c.nivelClase, c.nombreQuita, c.nombrePone, c.pone?.origen]))
                .toEqual([[2, 'Combate con dos armas', 'Disparo rápido', 'Explorador nivel 2'], [6, 'Combate con dos armas mejorado', 'Disparos múltiples', 'Explorador nivel 6']]);
            expect(reciclajeDelPlan(plan)).toEqual({
                tipo: 'rasgo', hueco: { idClase: 6, nivelClase: 2, grupo: 1 },
                quita: { especial: { id: 39, idExtra: 0 }, dote: null }, pone: { especial: { id: 156, idExtra: 0 }, dote: null },
            });
            expect(filasDelReciclaje(plan)).toEqual([
                jasmine.objectContaining({ que: 'Reciclaje: rasgo de clase', antes: 'Estilo de combate (Combate con dos armas)', ahora: 'Estilo de combate (Tiro con arco)' }),
                jasmine.objectContaining({ que: 'Reciclaje: lo que cambia solo', antes: 'Combate con dos armas, Combate con dos armas mejorado', ahora: 'Disparo rápido, Disparos múltiples' }),
            ]);

            expect(aplicarReciclajeAlMotor(motor, plan)).toBeTrue();
            expect(aptitudesDe(motor)).toContain([156, 0]);
            expect(aptitudesDe(motor)).not.toContain([39, 0]);
            expect(dotesDe(motor)).toContain([52, 'Explorador nivel 2']);
            expect(dotesDe(motor)).toContain([323, 'Explorador nivel 6']);
            expect(dotesDe(motor).some(([id]) => id === 11 || id === 12)).toBeFalse();
            const elecciones = (i: number) => motor.getOrdenNiveles()[i].elecciones.map((e) => [e.tipo, toInt(e.idElemento)]);
            expect(elecciones(1)).toContain(['especial', 156]);
            expect(elecciones(1)).toContain(['dote', 52]);
            expect(elecciones(1)).not.toContain(['especial', 39]);
            expect(elecciones(1)).not.toContain(['dote', 11]);
            expect(elecciones(5)).toContain(['dote', 323]);

            const ficha = fichaConElReciclaje(guardado.entrada, reciclajeDelPlan(plan), { rasgo: plan });
            const especiales = (ficha.colecciones?.especiales ?? []).map((e) => e.idEspecial);
            expect(especiales).toContain(156);
            expect(especiales).not.toContain(39);
            const dotes = (ficha.colecciones?.dotes ?? []).map((d) => [d.idDote, d.origen]);
            expect(dotes).toContain([52, 'Explorador nivel 2']);
            expect(dotes).toContain([323, 'Explorador nivel 6']);
            expect(dotes.some(([id]) => id === 11 || id === 12)).toBeFalse();
            expect(ficha.niveles?.[1].elecciones?.map((e) => [e.tipo, e.idElemento])).toContain(['dote', 52]);
            expect(ficha.niveles?.[5].elecciones?.map((e) => [e.tipo, e.idElemento])).toContain(['dote', 323]);
            expect(ficha.niveles?.length).toBe(guardado.entrada.niveles?.length);
        });

        it('con Defensa con dos armas, elegida después, no cambia de estilo (MJ II, pág. 195); el motor se queda como estaba', () => {
            const { motor } = conDosArmas(3);
            motor.PersonajeCreacion.DotesContextuales.push({
                Dote: DEFENSA, Contexto: { Entidad: 'personaje', Id_personaje: 0, Id_extra: 0, Extra: '', Origen: 'Dote de nivel 3' },
            } as any);
            expect(motor.dotesSinSusPrerrequisitos()).toEqual([]);
            const [hueco] = rasgosParaReciclar(motor);
            expect(hueco.motivo).toBe('Lo necesita lo que tiene: Defensa con dos armas (No cumple: Combate con dos armas).');
            expect(aptitudesDe(motor)).toContain([39, 0]);
            expect(dotesDe(motor)).toContain([11, 'Explorador nivel 2']);
            // Las dotes del estilo no se reciclan como dote: las da la tabla.
            expect(dotesParaReciclar(motor, [hueco]).find((d) => d.idDote === 11)?.motivo).toBe('No se eligió: la da Explorador nivel 2.');
        });
    });

    describe('las dotes adicionales del monje (MJ pág. 51)', () => {
        const ISAM = dote(19, 'Impacto sin arma mejorado');
        const PRESA = dote(32, 'Presa mejorada');
        const PUNETAZO = { ...dote(33, 'Puñetazo aturdidor'), Prerrequisitos: ataque(8) };
        const LLAVE = { ...dote(71, 'Llave de presa'), Prerrequisitos: pide(32, 'Presa mejorada') };
        const CATALOGO = [...DOTES, ISAM, PRESA, PUNETAZO, LLAVE];
        const MONJE = clase({
            Id: 10, Nombre: 'Monje', Tipo_dado: { Id: 3, Nombre: 'd8' }, Puntos_habilidad: { Id: 1, Valor: 4 },
            Habilidades: { Base: [ref(2, 'Trepar')], Custom: [] },
            Desglose_niveles: [nivel(1, { Dotes: [filaDote(ISAM, 0, 2), filaDote(PRESA, 1, 0), filaDote(PUNETAZO, 1, 1)] }), nivel(2)],
        });
        const conPresa = () => crearYSubir(MONJE, 1, CATALOGO, { 1: { grupos: { 1: 'dote:1' } } });

        it('cambia la de su grupo por la otra, sin sus prerrequisitos; no se recicla como dote', () => {
            const { guardado, motor } = conPresa();
            const [hueco] = rasgosParaReciclar(motor);
            expect(hueco).toEqual(jasmine.objectContaining({ idClase: 10, nivelClase: 1, grupo: 1, motivo: null }));
            expect(hueco.doteQueTiene).toEqual(jasmine.objectContaining({ id: 32, origen: 'Monje nivel 1' }));
            // Puñetazo aturdidor pide ataque base +8, pero el monje no necesita sus prerrequisitos.
            expect(hueco.opciones.map((o) => [o.dote?.id, o.motivo])).toEqual([[33, null]]);
            expect(dotesParaReciclar(motor, [hueco]).find((d) => d.idDote === 32)?.motivo)
                .toBe('Es de un rasgo de clase (monje, nivel 1): se recicla con «Reciclar un rasgo de clase».');

            const pone = hueco.opciones[0];
            const plan: PlanRasgo = { tipo: 'rasgo', hueco, pone, doteElegida: null, cambios: cambiosDelRasgo(motor, hueco, pone) };
            expect(reciclajeDelPlan(plan)).toEqual({
                tipo: 'rasgo', hueco: { idClase: 10, nivelClase: 1, grupo: 1 },
                quita: { especial: null, dote: { id: 32, idExtra: 0 } }, pone: { especial: null, dote: { id: 33, idExtra: 0 } },
            });
            expect(aplicarReciclajeAlMotor(motor, plan)).toBeTrue();
            expect(dotesDe(motor)).toContain([33, 'Monje nivel 1']);
            expect(dotesDe(motor)).toContain([19, 'Monje nivel 1']);
            expect(dotesDe(motor).some(([id]) => id === 32)).toBeFalse();
            const ficha = fichaConElReciclaje(guardado.entrada, reciclajeDelPlan(plan), { rasgo: plan });
            const dotes = (ficha.colecciones?.dotes ?? []).map((d) => [d.idDote, d.origen]);
            expect(dotes).toContain([33, 'Monje nivel 1']);
            expect(dotes.some(([id]) => id === 32)).toBeFalse();
            expect(ficha.niveles?.[0].elecciones?.map((e) => [e.tipo, e.idElemento])).toContain(['dote', 33]);
        });

        it('si una dote que eligió después pide la de su grupo, no la cambia', () => {
            const { motor } = conPresa();
            motor.PersonajeCreacion.DotesContextuales.push({
                Dote: LLAVE, Contexto: { Entidad: 'personaje', Id_personaje: 0, Id_extra: 0, Extra: '', Origen: 'Dote de nivel 1' },
            } as any);
            expect(rasgosParaReciclar(motor)[0].motivo).toBe('Lo necesita lo que tiene: Llave de presa (No cumple: Presa mejorada).');
        });
    });

    describe('la dote adicional del mago (MJ pág. 48): cualquiera de sus opciones', () => {
        const POTENCIAR = deTipo(dote(80, 'Potenciar conjuro'), 'Metamágica');
        const MAXIMIZAR = deTipo(dote(81, 'Maximizar conjuro'), 'Metamágica');
        const VARITA = deTipo(dote(90, 'Crear varita'), 'Creación de objetos');
        const ANILLO = { ...deTipo(dote(91, 'Forjar anillo'), 'Creación de objetos'), Prerrequisitos: ataque(6) };
        const MAESTRIA = dote(31, 'Maestría en conjuros');
        const CATALOGO = [...DOTES, POTENCIAR, MAXIMIZAR, VARITA, ANILLO, MAESTRIA];
        // Como en rol_dev: el grupo de su nivel 5 junta Maestría en conjuros y la «Dote adicional» metamágica o de creación.
        const MAGO_5 = clase({
            Id: 9, Nombre: 'Mago', Tipo_dado: { Id: 1, Nombre: 'd4' }, Puntos_habilidad: { Id: 1, Valor: 2 },
            Habilidades: { Base: [ref(3, 'Concentración')], Custom: [] },
            Desglose_niveles: [1, 2, 3, 4, 5, 6].map((n) => nivel(n, n === 5 ? {
                Dotes: [filaDote(MAESTRIA, 1, 1)],
                Especiales: [filaEspecial(DOTE_ADICIONAL, 1, 1, { Id_extra: 12, Extra: 'Metamágica' }),
                    filaEspecial(DOTE_ADICIONAL, 1, 2, { Id_extra: 111, Extra: 'Creación de objetos' })],
            } : {})),
        });
        /** Un mago 6 que eligió a 5 la dote adicional metamágica, con Potenciar conjuro (sin el mago de verdad del catálogo). */
        function mago() {
            const svc = crear(HUMANO, {});
            svc.setCatalogoClases([GUERRERO, MAGO_5]);
            svc.setCatalogoDotes(CATALOGO);
            for (let n = 1; n <= 6; n++)
                aplicarNivel(svc, MAGO_5, 'Inteligencia', undefined, n === 5 ? { grupos: { 1: 'especial:1' }, dotes: [POTENCIAR] } : {});
            const guardado = guardar(svc);
            return { guardado, motor: subir(guardado, HUMANO, [GUERRERO, MAGO_5], CATALOGO) };
        }

        it('lo que tiene: la aptitud y la dote que eligió con ella, y sus opciones (Maestría, otra metamágica o una de creación)', () => {
            const { motor } = mago();
            const [hueco] = rasgosParaReciclar(motor);
            expect(hueco).toEqual(jasmine.objectContaining({ idClase: 9, nivelClase: 5, grupo: 1, motivo: null, indiceNivel: 4 }));
            expect(nombreDeLoQueTiene(hueco)).toBe('Dote adicional (Potenciar conjuro)');
            expect(hueco.doteQueTiene?.origen).toBe('Dote adicional: Mago nivel 5');
            expect(hueco.opciones.map((o) => [nombreDeOpcion(o), o.daDote?.tipo ?? null, o.motivo]))
                .toEqual([['Maestría en conjuros', null, null], ['Dote adicional (Metamágica)', 'Metamágica', null], ['Dote adicional (Creación de objetos)', 'Creación de objetos', null]]);
            // La de la dote adicional también se recicla como dote (otra de su lista).
            expect(dotesParaReciclar(motor, [hueco]).find((d) => d.idDote === 80)?.motivo).toBeNull();
        });

        it('pasa a una de creación: las de su tipo, con el personaje del nivel 5 (Forjar anillo pide ataque base +6, que no tenía)', () => {
            const { guardado, motor } = mago();
            const [hueco] = rasgosParaReciclar(motor);
            const creacion = hueco.opciones.find((o) => o.especial?.idExtra === 111)!;
            const estado = motor.exportarEstadoSubida();
            const delHueco = huecoDeLaDoteDelRasgo(motor, hueco, creacion)!;
            expect(delHueco.pendiente.tipoPermitido).toBe('Creación de objetos');
            const candidata = (id: number) => delHueco.candidatos.find((c) => toInt(c.dote?.Id) === id);
            expect(candidata(90)?.evaluacion.estado).toBe('eligible');
            expect(candidata(90)?.restringidaPorTipo).toBeFalse();
            expect(candidata(91)?.evaluacion.estado).not.toBe('eligible');
            expect(candidata(81)?.restringidaPorTipo).toBeTrue();
            expect(motor.restaurarEstadoSubida(estado)).toBeTrue();
            expect(motor.PersonajeCreacion.Ataque_base).toContain('6');

            const plan: PlanRasgo = {
                tipo: 'rasgo', hueco, pone: creacion, cambios: cambiosDelRasgo(motor, hueco, creacion),
                doteElegida: { seleccion: { idDote: 90, idExtra: 0, extra: '' }, dote: { id: 90, idExtra: 0, nombre: 'Crear varita', extra: '', origen: 'Dote adicional: Mago nivel 5' } },
            };
            expect(reciclajeDelPlan(plan)).toEqual({
                tipo: 'rasgo', hueco: { idClase: 9, nivelClase: 5, grupo: 1 },
                quita: { especial: { id: 5, idExtra: 12 }, dote: { id: 80, idExtra: 0 } }, pone: { especial: { id: 5, idExtra: 111 }, dote: { id: 90, idExtra: 0 } },
            });
            expect(aplicarReciclajeAlMotor(motor, plan)).toBeTrue();
            expect(aptitudesDe(motor)).toContain([5, 111]);
            expect(aptitudesDe(motor)).not.toContain([5, 12]);
            expect(dotesDe(motor)).toContain([90, 'Dote adicional: Mago nivel 5']);
            expect(dotesDe(motor).some(([id]) => id === 80)).toBeFalse();
            const quinto = motor.getOrdenNiveles()[4].elecciones.map((e) => [e.tipo, toInt(e.idElemento), Math.max(0, toInt(e.idExtra))]);
            expect(quinto).toContain(['especial', 5, 111]);
            expect(quinto).toContain(['dote', 90, 0]);
            expect(quinto).not.toContain(['dote', 80, 0]);

            const ficha = fichaConElReciclaje(guardado.entrada, reciclajeDelPlan(plan), { rasgo: plan });
            expect(ficha.colecciones?.especiales).toContain({ idEspecial: 5, idExtra: 111 });
            expect(ficha.colecciones?.especiales).not.toContain({ idEspecial: 5, idExtra: 12 });
            expect((ficha.colecciones?.dotes ?? []).map((d) => [d.idDote, d.origen])).toContain([90, 'Dote adicional: Mago nivel 5']);
            expect((ficha.colecciones?.dotes ?? []).some((d) => d.idDote === 80)).toBeFalse();
        });

        it('pasa a Maestría en conjuros (la dote de su tabla) o a otra metamágica (en el selector, sin la que tenía)', () => {
            const { motor } = mago();
            const [hueco] = rasgosParaReciclar(motor);
            const maestria = hueco.opciones.find((o) => o.dote?.id === 31)!;
            const plan: PlanRasgo = { tipo: 'rasgo', hueco, pone: maestria, doteElegida: null, cambios: cambiosDelRasgo(motor, hueco, maestria) };
            expect(reciclajeDelPlan(plan)).toEqual(jasmine.objectContaining({
                quita: { especial: { id: 5, idExtra: 12 }, dote: { id: 80, idExtra: 0 } }, pone: { especial: null, dote: { id: 31, idExtra: 0 } },
            }));
            const estado = motor.exportarEstadoSubida();
            expect(aplicarReciclajeAlMotor(motor, plan)).toBeTrue();
            expect(dotesDe(motor)).toContain([31, 'Mago nivel 5']);
            expect(dotesDe(motor).some(([id]) => id === 80)).toBeFalse();
            expect(aptitudesDe(motor)).not.toContain([5, 12]);
            expect(motor.restaurarEstadoSubida(estado)).toBeTrue();

            const metamagica = hueco.opciones.find((o) => o.especial?.idExtra === 12)!;
            const delHueco = huecoDeLaDoteDelRasgo(motor, hueco, metamagica)!;
            expect(delHueco.candidatos.some((c) => toInt(c.dote?.Id) === 80)).toBeFalse();
            expect(delHueco.candidatos.find((c) => toInt(c.dote?.Id) === 81)?.evaluacion.estado).toBe('eligible');
            expect(motor.restaurarEstadoSubida(estado)).toBeTrue();
            const otra: PlanRasgo = {
                tipo: 'rasgo', hueco, pone: metamagica, cambios: cambiosDelRasgo(motor, hueco, metamagica),
                doteElegida: { seleccion: { idDote: 81, idExtra: 0, extra: '' }, dote: { id: 81, idExtra: 0, nombre: 'Maximizar conjuro', extra: '', origen: 'Dote adicional: Mago nivel 5' } },
            };
            expect(reciclajeDelPlan(otra)).toEqual(jasmine.objectContaining({
                quita: { especial: { id: 5, idExtra: 12 }, dote: { id: 80, idExtra: 0 } }, pone: { especial: { id: 5, idExtra: 12 }, dote: { id: 81, idExtra: 0 } },
            }));
            expect(aplicarReciclajeAlMotor(motor, otra)).toBeTrue();
            expect(aptitudesDe(motor)).toContain([5, 12]);
            expect(dotesDe(motor)).toContain([81, 'Dote adicional: Mago nivel 5']);
        });
        it('con la misma dote adicional a 5 y a 10, la aptitud se queda al cambiar la de 5 (la ficha la tiene una vez)', () => {
            const delGrupo = (n: number, grupo: number) => ({
                Dotes: [filaDote(MAESTRIA, grupo, grupo)],
                Especiales: [filaEspecial(DOTE_ADICIONAL, grupo, 2 * grupo - 1, { Id_extra: 12, Extra: 'Metamágica' }),
                    filaEspecial(DOTE_ADICIONAL, grupo, 2 * grupo, { Id_extra: 111, Extra: 'Creación de objetos' })],
                Nivel: n,
            });
            const MAGO_10 = clase({
                ...MAGO_5, Desglose_niveles: Array.from({ length: 10 }, (_, i) => nivel(i + 1, i + 1 === 5 ? delGrupo(5, 1) : i + 1 === 10 ? delGrupo(10, 2) : {})),
            });
            const svc = crear(HUMANO, {});
            svc.setCatalogoClases([GUERRERO, MAGO_10]);
            svc.setCatalogoDotes(CATALOGO);
            for (let n = 1; n <= 10; n++)
                aplicarNivel(svc, MAGO_10, 'Inteligencia', undefined, n === 5 ? { grupos: { 1: 'especial:1' }, dotes: [POTENCIAR] }
                    : n === 10 ? { grupos: { 2: 'especial:1' }, dotes: [MAXIMIZAR] } : {});
            const guardado = guardar(svc);
            const motor = subir(guardado, HUMANO, [GUERRERO, MAGO_10], CATALOGO);
            const huecos = rasgosParaReciclar(motor);
            expect(huecos.map((h) => [h.nivelClase, nombreDeLoQueTiene(h), h.aptitudCompartida]))
                .toEqual([[5, 'Dote adicional (Potenciar conjuro)', true], [10, 'Dote adicional (Maximizar conjuro)', true]]);
            const [quinto] = huecos;
            const maestria = quinto.opciones.find((o) => o.dote?.id === 31)!;
            const plan: PlanRasgo = { tipo: 'rasgo', hueco: quinto, pone: maestria, doteElegida: null, cambios: cambiosDelRasgo(motor, quinto, maestria) };
            expect(aplicarReciclajeAlMotor(motor, plan)).toBeTrue();
            expect(aptitudesDe(motor)).toContain([5, 12]);
            expect(dotesDe(motor)).toContain([81, 'Dote adicional: Mago nivel 10']);
            expect(dotesDe(motor)).toContain([31, 'Mago nivel 5']);
            expect(dotesDe(motor).some(([id]) => id === 80)).toBeFalse();
            const ficha = fichaConElReciclaje(guardado.entrada, reciclajeDelPlan(plan), { rasgo: plan });
            expect(ficha.colecciones?.especiales).toContain({ idEspecial: 5, idExtra: 12 });
            // En el registro, la del nivel 5 sale de su nivel y la del 10 se queda en el suyo.
            expect(ficha.niveles?.[4].elecciones).not.toContain(jasmine.objectContaining({ tipo: 'especial', idElemento: 5 }));
            expect(ficha.niveles?.[9].elecciones).toContain(jasmine.objectContaining({ tipo: 'especial', idElemento: 5, idExtra: 12 }));
        });
    });

    describe('la aptitud especial del pícaro, como grupo opcional de su tabla (MJ págs. 57-58; datos simulados)', () => {
        const PICARO = clase({
            Id: 12, Nombre: 'Pícaro', Tipo_dado: { Id: 2, Nombre: 'd6' }, Puntos_habilidad: { Id: 1, Valor: 8 },
            Habilidades: { Base: [ref(2, 'Trepar')], Custom: [] },
            Desglose_niveles: Array.from({ length: 10 }, (_, i) => nivel(i + 1, i + 1 === 10 ? {
                Especiales: [filaEspecial({ Id: 57, Nombre: 'Evasión mejorada' }, 1, 12), filaEspecial({ Id: 2247, Nombre: 'Oportunismo' }, 1, 13),
                    filaEspecial({ Id: 2265, Nombre: 'Rodar a la defensiva' }, 1, 14),
                    filaEspecial(DOTE_ADICIONAL, 1, 15, { Id_extra: 300, Extra: 'Cualquiera', Extra_comodin: 'cualquiera' })],
            } : {})),
        });

        it('el pícaro 10 cambia evasión mejorada por oportunismo; con la dote adicional, una de cualquier tipo', () => {
            const { guardado, motor } = crearYSubir(PICARO, 10, DOTES, { 10: { grupos: { 1: 'especial:0' } } });
            const [hueco] = rasgosParaReciclar(motor);
            expect(hueco).toEqual(jasmine.objectContaining({ idClase: 12, nivelClase: 10, grupo: 1, motivo: null }));
            expect(nombreDeLoQueTiene(hueco)).toBe('Evasión mejorada');
            expect(hueco.opciones.map((o) => [nombreDeOpcion(o), o.daDote, o.motivo]))
                .toEqual([['Oportunismo', null, null], ['Rodar a la defensiva', null, null], ['Dote adicional (Cualquiera)', { tipo: null }, null]]);
            const estado = motor.exportarEstadoSubida();
            expect(huecoDeLaDoteDelRasgo(motor, hueco, hueco.opciones[2])?.pendiente.tipoPermitido).toBeNull();
            expect(motor.restaurarEstadoSubida(estado)).toBeTrue();

            const pone = hueco.opciones[0];
            const plan: PlanRasgo = { tipo: 'rasgo', hueco, pone, doteElegida: null, cambios: cambiosDelRasgo(motor, hueco, pone) };
            expect(reciclajeDelPlan(plan)).toEqual({
                tipo: 'rasgo', hueco: { idClase: 12, nivelClase: 10, grupo: 1 },
                quita: { especial: { id: 57, idExtra: 0 }, dote: null }, pone: { especial: { id: 2247, idExtra: 0 }, dote: null },
            });
            expect(aplicarReciclajeAlMotor(motor, plan)).toBeTrue();
            expect(aptitudesDe(motor)).toContain([2247, 0]);
            expect(aptitudesDe(motor)).not.toContain([57, 0]);
            const ficha = fichaConElReciclaje(guardado.entrada, reciclajeDelPlan(plan), { rasgo: plan });
            expect(ficha.colecciones?.especiales).toContain({ idEspecial: 2247, idExtra: 0 });
            expect(ficha.niveles?.[9].elecciones?.map((e) => [e.tipo, e.idElemento])).toContain(['especial', 2247]);
            expect(ficha.niveles?.[9].elecciones?.map((e) => [e.tipo, e.idElemento])).not.toContain(['especial', 57]);
        });

        it('al crearlo, la dote adicional con el comodín «Cualquiera» deja elegir cualquier dote, también una de dos tipos', () => {
            const ESQUIVA = { ...dote(60, 'Esquiva'), Tipos: [{ Id: 1, Nombre: 'General', Usado: 1 }, { Id: 4, Nombre: 'Guerrero', Usado: 1 }] };
            const svc = crear(HUMANO, { Destreza: 13 });
            svc.setCatalogoDotes([...DOTES, ESQUIVA]);
            const [pendiente] = svc.registrarDotesPendientesPorEspeciales(PICARO.Desglose_niveles[9].Especiales.slice(3), 'Pícaro nivel 10');
            expect(pendiente.tipoPermitido).toBeNull();
            expect(svc.obtenerCandidatosDotePendiente(pendiente.id).find((c) => toInt(c.dote?.Id) === 60)?.restringidaPorTipo).toBeFalse();
            expect(svc.aplicarDotePendiente(pendiente.id, { idDote: 60, idExtra: 0, extra: '' })).toBeTrue();
            // Con el mismo texto sin la marca del comodín, sí es un tipo (el dato manda, no el texto).
            const [conTipo] = svc.registrarDotesPendientesPorEspeciales([{ ...PICARO.Desglose_niveles[9].Especiales[3], Extra_comodin: null }], 'Pícaro nivel 10');
            expect(conTipo.tipoPermitido).toBe('Cualquiera');
        });
    });

    describe('lo que su tabla da por la opción, también aptitudes y en cadena (el convocador divino; datos simulados)', () => {
        const SENDA_A = { Id: 2593, Nombre: 'Senda del esandy' };
        const SENDA_B = { Id: 2594, Nombre: 'Senda del uzurna' };
        const CONVOCADOR = clase({
            Id: 419, Nombre: 'Convocador divino', Tipo_dado: { Id: 3, Nombre: 'd8' }, Puntos_habilidad: { Id: 1, Valor: 2 },
            Habilidades: { Base: [ref(3, 'Concentración')], Custom: [] },
            Desglose_niveles: [
                nivel(1, { Especiales: [filaEspecial(SENDA_A, 1, 18), filaEspecial(SENDA_B, 1, 1)] }),
                nivel(2, { Especiales: [filaEspecial({ Id: 2598, Nombre: 'Plegaria del deva astral' }, 2, 5, { Id_especial_requerido: 18 }),
                    filaEspecial({ Id: 2599, Nombre: 'Contrato del babau' }, 2, 6, { Id_especial_requerido: 1 })] }),
                nivel(3, { Especiales: [filaEspecial({ Id: 2700, Nombre: 'Plegaria mayor' }, 0, 7, { Id_especial_requerido: 5 }),
                    filaEspecial({ Id: 2701, Nombre: 'Contrato mayor' }, 0, 8, { Id_especial_requerido: 6 })] }),
            ],
        });

        it('al cambiar de senda, sus plegarias pasan a contratos en su nivel, también la que pide la plegaria', () => {
            const { guardado, motor } = crearYSubir(CONVOCADOR, 3, DOTES, { 1: { grupos: { 1: 'especial:0' } } });
            expect(aptitudesDe(motor)).toEqual(jasmine.arrayWithExactContents([[2593, 0], [2598, 0], [2700, 0]]));
            const huecos = rasgosParaReciclar(motor);
            expect(huecos.map((h) => [h.nivelClase, h.grupo, nombreDeLoQueTiene(h)])).toEqual([[1, 1, 'Senda del esandy']]);
            const [hueco] = huecos;
            const pone = hueco.opciones[0];
            const plan: PlanRasgo = { tipo: 'rasgo', hueco, pone, doteElegida: null, cambios: cambiosDelRasgo(motor, hueco, pone) };
            expect(plan.cambios.filter((c) => c.derivado).map((c) => [c.nivelClase, c.tipo, c.nombreQuita, c.nombrePone]))
                .toEqual([[2, 'especial', 'Plegaria del deva astral', 'Contrato del babau'], [3, 'especial', 'Plegaria mayor', 'Contrato mayor']]);
            expect(aplicarReciclajeAlMotor(motor, plan)).toBeTrue();
            expect(aptitudesDe(motor)).toEqual(jasmine.arrayWithExactContents([[2594, 0], [2599, 0], [2701, 0]]));
            const ficha = fichaConElReciclaje(guardado.entrada, reciclajeDelPlan(plan), { rasgo: plan });
            expect((ficha.colecciones?.especiales ?? []).map((e) => e.idEspecial)).toEqual(jasmine.arrayWithExactContents([2594, 2599, 2701]));
            expect(ficha.niveles?.[2].elecciones).toContain(jasmine.objectContaining({ tipo: 'especial', idElemento: 2701 }));
        });
    });

    describe('una aptitud con «Elegir» (el gran arcano del archimago)', () => {
        const GRAN_ARCANO = { Id: 107, Nombre: 'Gran arcano' };
        const ARCHIMAGO = clase({
            Id: 15, Nombre: 'Archimago', Tipo_dado: { Id: 1, Nombre: 'd4' }, Puntos_habilidad: { Id: 1, Valor: 2 },
            Habilidades: { Base: [ref(3, 'Concentración')], Custom: [] },
            Desglose_niveles: [1, 2].map((n) => nivel(n, {
                Especiales: [filaEspecial(GRAN_ARCANO, 0, n - 1, { Id_extra: 110, Extra: 'Elegir', Extra_comodin: 'elegir' })],
            })),
        });
        const DETALLE = {
            Id: 107, Nombre: 'Gran arcano', Extras: [
                { Id_extra: 110, Extra: 'Elegir', Extra_comodin: 'elegir', Orden: 0 }, { Id_extra: 201, Extra: 'Dominio de los elementos', Orden: 1 },
                { Id_extra: 202, Extra: 'Conjuro poderoso', Orden: 2 }, { Id_extra: 203, Extra: 'Maestría arcana', Orden: 3 },
            ],
        } as any;
        const elegido = (idExtra: number, extra: string): OpcionesDeNivel => ({ extras: { 'especial:0': { idExtra, extra } } });

        it('cambia el extra elegido por otro que no tenga, en el nivel de su hueco', () => {
            const { guardado, motor } = crearYSubir(ARCHIMAGO, 2, DOTES, { 1: elegido(201, 'Dominio de los elementos'), 2: elegido(202, 'Conjuro poderoso') });
            expect(aptitudesConElegir(motor)).toEqual([107]);
            expect(rasgosParaReciclar(motor)[0].motivo).toBe('No se han podido leer las opciones de Gran arcano.');
            const huecos = rasgosParaReciclar(motor, new Map([[107, DETALLE]]));
            expect(huecos.map((h) => [h.nivelClase, h.idEspecial, nombreDeLoQueTiene(h)]))
                .toEqual([[1, 107, 'Gran arcano (Dominio de los elementos)'], [2, 107, 'Gran arcano (Conjuro poderoso)']]);
            const [hueco] = huecos;
            expect(hueco.opciones.map((o) => nombreDeOpcion(o))).toEqual(['Gran arcano (Maestría arcana)']);

            const pone = hueco.opciones[0];
            const plan: PlanRasgo = { tipo: 'rasgo', hueco, pone, doteElegida: null, cambios: cambiosDelRasgo(motor, hueco, pone) };
            expect(reciclajeDelPlan(plan)).toEqual({
                tipo: 'rasgo', hueco: { idClase: 15, nivelClase: 1, idEspecial: 107 },
                quita: { especial: { id: 107, idExtra: 201 }, dote: null }, pone: { especial: { id: 107, idExtra: 203 }, dote: null },
            });
            expect(aplicarReciclajeAlMotor(motor, plan)).toBeTrue();
            expect(aptitudesDe(motor)).toEqual(jasmine.arrayWithExactContents([[107, 202], [107, 203]]));
            const ficha = fichaConElReciclaje(guardado.entrada, reciclajeDelPlan(plan), { rasgo: plan });
            expect(ficha.colecciones?.especiales).toEqual(jasmine.arrayWithExactContents([{ idEspecial: 107, idExtra: 202 }, { idEspecial: 107, idExtra: 203 }]));
            expect(ficha.niveles?.[0].elecciones).toContain(jasmine.objectContaining({ tipo: 'especial', idElemento: 107, idExtra: 203 }));
            expect(ficha.niveles?.[0].elecciones).not.toContain(jasmine.objectContaining({ tipo: 'especial', idElemento: 107, idExtra: 201 }));
        });
    });
});
