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
import { toInt } from './utils/normalizacion';
import { fichaDeLaSubida } from './utils/subida-nivel';
import { textoClasePersonaje } from '../components/detalles/ficha/personaje';
import { ID_DOTE_ADICIONAL, ID_FIRMEZA_ENANA, ID_GRUPO_HACHAS, guerreroConSustitucionApi } from 'src/testing/sustituciones-api';

// Los niveles de sustitución en el motor (R8, primera tanda; contrato: catalogos.md y personajes.md, «Los niveles de
// sustitución»; dictamen del máster de Rol, D1-D15): elegirlo al crear y al subir, y lo que cambia del nivel.

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

function diarios(...valores: number[]): Record<string, number> {
    const salida: Record<string, number> = {};
    for (let n = 0; n <= 9; n++)
        salida[`Nivel_${n}`] = valores[n] ?? -1;
    return salida;
}

const GUERRERO: Clase = normalizeClase({ Nivel_max_claseo: 20, ...guerreroConSustitucionApi() });

/** El mago (d4) y su juego «Ilusionista gnomo», que pide ser gnomo y especialista en ilusión (lo comprueba la web). */
const MAGO: Clase = normalizeClase({
    Id: 9, Nombre: 'Mago', Nivel_max_claseo: 20, Mod_salv_conjuros: 'Inteligencia', Tipo_dado: { Id: 1, Nombre: 'd4' },
    Puntos_habilidad: { Id: 1, Valor: 2 }, Conjuros: { Arcanos: true }, Habilidades: { Base: [], Custom: [] },
    Desglose_niveles: [1, 2].map((n) => ({
        Nivel: n, Ataque_base: '+0', Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
        Conjuros_diarios: diarios(3, n), Especiales: [], Dotes: [],
    })),
    Sustituciones: [{
        Id: 5, Nombre: 'Ilusionista gnomo', Nombre_original: 'Gnome illusionist', Traducido: true, Familia: 'racial',
        Titulo: 'Niveles de sustitución racial del ilusionista gnomo', Clase: { Id: 9, Nombre: 'Mago' }, Tipo_dado: null,
        Puntos_habilidad: null, Retroactivo: false, Descripcion: '', Manual: { Id: 40, Nombre: 'Races of Stone', Pagina: 148 }, Oficial: true,
        Prerrequisitos: [
            { Tipo: 'raza', Nivel: null, Opcional: 0, Elemento: { Id: 4, Nombre: 'Gnomo' }, Extra: null, Cantidad: null, Texto: null, Frase: 'Gnomo', Comprueba_la_api: true },
            { Tipo: 'escuela_especialista', Nivel: null, Opcional: 0, Elemento: { Id: 6, Nombre: 'Ilusión' }, Extra: null, Cantidad: null, Texto: null, Frase: 'Especialista en ilusión', Comprueba_la_api: false },
        ],
        Habilidades: [],
        Niveles: [{ Id: 52, Nivel: 2, Ajustes: { Ataque_base: 0, Fortaleza: 0, Reflejos: 0, Voluntad: 0 }, Descripcion: '', Especiales: [], Dotes: [], Quita: [], Conjuros: [] }],
    }],
});

const CONJUROS = [0, 0, 0, 1, 1, 1, 1].map((nivel, i) => ({
    Id: 100 + i, Nombre: `Conjuro ${i}`, Arcano: true, Divino: false, Psionico: false, Escuela: { Id: 0, Nombre: 'Universal' },
    Disciplina: { Id: 0, Nombre: '' }, Descriptores: [], Nivel_dominio: [], Nivel_disciplinas: [], Oficial: true,
    Nivel_clase: [{ Id_clase: 9, Clase: 'Mago', Nivel: nivel, Espontaneo: false }],
})) as unknown as Conjuro[];

function catalogos(svc: NuevoPersonajeService): NuevoPersonajeService {
    svc.setCatalogoTiposCriatura([TIPO]);
    svc.setCatalogoHabilidades(HABILIDADES as any);
    svc.setCatalogoClases([GUERRERO, MAGO]);
    svc.setCatalogoDotes([]);
    svc.setCatalogoConjuros(CONJUROS);
    return svc;
}

function crear(raza: Raza): NuevoPersonajeService {
    const svc = catalogos(new NuevoPersonajeService());
    svc.seleccionarRaza(raza);
    svc.aplicarCaracteristicasGeneradas({ Fuerza: 14, Destreza: 10, Constitucion: 12, Inteligencia: 14, Sabiduria: 10, Carisma: 10 });
    return svc;
}

/** Aplica el nivel (con el de sustitución si se da), reparte los rangos que pueda y cierra lo pendiente. */
function aplicarNivel(svc: NuevoPersonajeService, c: Clase, idNivelSustitucion: number | null = null): void {
    expect(svc.elegirSustitucionSiguienteNivel(c, idNivelSustitucion)).withContext('elegir el nivel').toBeTrue();
    const r = svc.aplicarSiguienteNivelClase(c, null, null, false, null, null);
    expect(r.aplicado).withContext(`${c.Nombre}: ${r.razon}`).toBeTrue();
    svc.registrarDotesPendientesPorProgresion(`${c.Nombre} nivel ${r.nivelAplicado}`);
    svc.iniciarDistribucionHabilidadesPorClase(c);
    gastarRangos(svc);
    for (let p = svc.getSiguienteDotePendiente(), i = 0; p && i < 10; p = svc.getSiguienteDotePendiente(), i++)
        svc.omitirDotePendiente(p.id);
    if (svc.getConjurosSesionActual().activa) {
        for (let i = 0; i < 20 && !svc.puedeCerrarSesionConjuros(); i++) {
            const libre = svc.filtrarConjurosDisponibles('', null, false)[0];
            if (!libre || !svc.seleccionarConjuroSesion(libre.Id))
                break;
        }
        svc.cerrarSesionConjuros();
    }
}

/** Gasta los puntos del reparto (el reparto no se cierra con puntos que se pueden gastar) y lo cierra. */
function gastarRangos(svc: NuevoPersonajeService): void {
    for (const habilidad of svc.getHabilidadesSesion()) {
        for (let i = 0; i < 20 && svc.puedeSubirRangoHabilidad(claveHabilidad(habilidad)); i++)
            svc.ajustarRangoHabilidad(claveHabilidad(habilidad), 1);
        // Un Saber con rangos y sin especialidad: los dungeons.
        if (svc.esExtraHabilidadPendienteParaSesion(habilidad))
            svc.setExtraHabilidad(claveHabilidad(habilidad), 'Dungeons');
    }
    expect(svc.cerrarDistribucionHabilidades()).not.toBeNull();
}

function guardar(svc: NuevoPersonajeService): { entrada: PersonajeCreateRequestDto; personaje: Personaje; } {
    const pj = svc.PersonajeCreacion;
    pj.Nombre = 'Tordek';
    pj.Campana = 'Sin campaña';
    const vida = svc.calcularVidaFinalAleatoria();
    pj.Vida = vida.total;
    const entrada = new PersonajeService({ currentUser: null } as any, {} as any).construirPayloadCreacionDesdePersonaje(pj,
        { idAlineamiento: 1, idGenero: 1, idDeidad: 0, catalogos: { clases: [GUERRERO, MAGO].map((c) => ({ id: c.Id, nombre: c.Nombre })) } } as any,
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

const idsClaseas = (svc: NuevoPersonajeService) => (svc.PersonajeCreacion.Claseas ?? []).map((e: any) => toInt(e?.Id));
const trepar = (svc: NuevoPersonajeService) => claveHabilidad(svc.PersonajeCreacion.Habilidades.find((h) => toInt(h.Id) === 10)!);

describe('Los niveles de sustitución en el motor (R8)', () => {
    const ENANO = crearRaza(2, 'Enano');
    const HUMANO = crearRaza(1, 'Humano');
    const GNOMO = crearRaza(4, 'Gnomo');

    it('un humano guerrero ve el juego del enano bloqueado y no puede tomarlo', () => {
        const svc = crear(HUMANO);
        const opciones = svc.opcionesDeSustitucionSiguienteNivel(GUERRERO);
        expect(opciones.map((o) => o.nivel.Id)).toEqual([11]);
        expect(opciones[0].cumple).toBeFalse();
        expect(opciones[0].motivos).toEqual(['No cumple: Enano']);
        expect(svc.elegirSustitucionSiguienteNivel(GUERRERO, 11)).toBeFalse();
        expect(svc.getSustitucionPendiente()).toBeNull();
        // Y el estándar sigue: su dote adicional.
        aplicarNivel(svc, GUERRERO);
        expect(idsClaseas(svc)).toContain(ID_DOTE_ADICIONAL);
        expect(svc.getOrdenNiveles()[0].idNivelSustitucion).toBeUndefined();
    });

    it('el enano guerrero 1 de sustitución: su DG, sus rasgos, sin la dote adicional ni las hachas, y lo que se manda', () => {
        const svc = crear(ENANO);
        expect(svc.elegirSustitucionSiguienteNivel(GUERRERO, 11)).toBeTrue();
        // El reparto de este nivel ya lee el juego: Trepar sale de la lista de clase, así que cuesta 2.
        aplicarNivelSinCerrar(svc);
        expect(svc.obtenerCosteRangoHabilidad(trepar(svc))).toBe(2);
        gastarRangos(svc);
        expect(idsClaseas(svc)).toContain(ID_FIRMEZA_ENANA);
        expect(idsClaseas(svc)).not.toContain(ID_DOTE_ADICIONAL);
        expect(svc.carasDadoGolpeDeClase(GUERRERO, 1)).toBe(12);
        // Las hachas de la clase, no (su nivel de sustitución las quita).
        expect(((svc as any).resolverCompetenciasGrupoArmasActuales() as Array<{ id: number; }>).map((c) => c.id)).not.toContain(ID_GRUPO_HACHAS);
        // Saber (dungeons), de clase para el máximo de rangos (D14).
        const saber = svc.PersonajeCreacion.Habilidades.find((h) => toInt(h.Id) === 21)!;
        expect(saber).withContext('la habilidad que añade el juego').toBeTruthy();
        expect(svc.esHabilidadDeClaseEnAlguna(saber)).toBeTrue();
        // El 1.er DG, al máximo de su dado: un d12.
        const vida = svc.calcularVidaFinalAleatoria();
        expect(vida.detalle?.dados?.[0]?.caras).toBe(12);
        // Lo que manda el alta y lo que enseña la ficha.
        const { entrada } = guardar(svc);
        expect(entrada.niveles?.[0].idNivelSustitucion).toBe(11);
        expect(textoClasePersonaje(svc.PersonajeCreacion.desgloseClases[0])).toBe('Guerrero 1 (sustitución: guerrero enano 1.º)');

        // El 2.º estándar: Trepar vuelve a ser de clase y la dote adicional, a su tabla.
        aplicarNivel(svc, GUERRERO);
        expect(idsClaseas(svc)).toContain(ID_DOTE_ADICIONAL);
        expect(svc.carasDadoGolpeDeClase(GUERRERO, 2)).toBe(10);
        expect(guardar(svc).entrada.niveles?.map((n) => n.idNivelSustitucion ?? null)).toEqual([11, null]);

        function aplicarNivelSinCerrar(s: NuevoPersonajeService): void {
            const r = s.aplicarSiguienteNivelClase(GUERRERO, null, null, false, null, null);
            expect(r.aplicado).withContext(`${r.razon}`).toBeTrue();
            s.iniciarDistribucionHabilidadesPorClase(GUERRERO);
        }
    });

    it('la campaña que los apaga: solo el estándar', () => {
        const svc = crear(ENANO);
        svc.setPermiteNivelesSustitucion(false);
        expect(svc.opcionesDeSustitucionSiguienteNivel(GUERRERO)).toEqual([]);
        expect(svc.elegirSustitucionSiguienteNivel(GUERRERO, 11)).toBeFalse();
        svc.setPermiteNivelesSustitucion(true);
        expect(svc.opcionesDeSustitucionSiguienteNivel(GUERRERO).length).toBe(1);
    });

    it('al subir: el enano guerrero 1 toma el 2.º de sustitución con su d12, y la subida lo manda', () => {
        const creacion = crear(ENANO);
        aplicarNivel(creacion, GUERRERO, 11);
        const guardado = guardar(creacion);
        const svc = subir(guardado, ENANO);
        // El 1.º guardado sigue siendo de sustitución.
        expect(svc.getOrdenNiveles()[0].idNivelSustitucion).toBe(11);
        expect(svc.opcionesDeSustitucionSiguienteNivel(GUERRERO).map((o) => o.nivel.Id)).toEqual([12]);
        aplicarNivel(svc, GUERRERO, 12);
        expect(svc.carasDadoGolpeDeClase(GUERRERO, 2)).toBe(12);
        expect(idsClaseas(svc).filter((id) => id === ID_DOTE_ADICIONAL)).toEqual([]);
        const ficha = fichaDeLaSubida({
            entrada: guardado.entrada, antes: guardado.entrada, despues: guardado.entrada, idClase: GUERRERO.Id, puntosGolpe: 20,
            nivel: { idClase: GUERRERO.Id, nivelClase: 2, idNivelSustitucion: svc.sustitucionDelNivelDeClase(GUERRERO, 2)?.nivel.Id ?? null, elecciones: [] },
        });
        expect(ficha.niveles?.map((n) => n.idNivelSustitucion ?? null)).toEqual([11, 12]);
    });

    it('un gnomo ilusionista que sube ve el juego del ilusionista gnomo; un gnomo evocador, bloqueado por su escuela', () => {
        const preparar = (escuela: string) => {
            const creacion = crear(GNOMO);
            creacion.PersonajeCreacion.Escuela_especialista = { Nombre: escuela } as any;
            aplicarNivel(creacion, MAGO);
            const guardado = guardar(creacion);
            guardado.personaje.Escuela_especialista = { Nombre: escuela } as any;
            return subir(guardado, GNOMO);
        };
        const ilusionista = preparar('Ilusión');
        const opcion = ilusionista.opcionesDeSustitucionSiguienteNivel(MAGO)[0];
        expect(opcion.nivel.Id).toBe(52);
        expect(opcion.cumple).withContext(opcion.motivos.join(' · ')).toBeTrue();
        aplicarNivel(ilusionista, MAGO, 52);
        expect(ilusionista.getOrdenNiveles()[1].idNivelSustitucion).toBe(52);
        const evocador = preparar('Evocación');
        const bloqueada = evocador.opcionesDeSustitucionSiguienteNivel(MAGO)[0];
        expect(bloqueada.cumple).toBeFalse();
        expect(bloqueada.motivos).toEqual(['No cumple: Especialista en ilusión']);
    });
});
