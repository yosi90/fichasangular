import { NuevoPersonajeService } from './nuevo-personaje.service';
import { PersonajeService } from './personaje.service';
import { normalizeClase } from './clase.service';
import { normalizeDominio } from './dominio.service';
import { Clase } from '../interfaces/clase';
import { Conjuro } from '../interfaces/conjuro';
import { DeidadDetalle } from '../interfaces/deidad';
import { Raza } from '../interfaces/raza';
import { TipoCriatura } from '../interfaces/tipo_criatura';
import { calcularNivelesLanzadorPersonaje } from './utils/nivel-lanzador-personaje';
import { libroTienda } from './utils/libro-conjuros';
import { normalizeEscuela } from './escuela-conjuros.service';
import { normalizeTamano } from './tamano.service';
import { conjurosDeAptitudes, listadoConjurosClase, modificadoresCaracteristicaEspecialNivel, nivelesConjuroSinRequisito, pasosTamanoEspecialNivel, textoRequisitoNivelConjuro } from './utils/aptitudes-clase';
import { CONVOCADOR_DIVINO_API, ESCUELAS_API, GUARDAESPALDAS_API, MAGIINGENIERO_API, MAGO_RECORTADO_API, TAMANOS_API } from 'src/testing/clases-propias-api';

// Reglas de la magia de la creación (auditoría de la matriz del 2026-10-26, fallos 3, 6, 7, 12, 13, 15, 17, 18, 30 y
// 31): cada una con el caso del manual y desde los datos de la clase, la escuela, la disciplina o el dominio.

const TIPO: TipoCriatura = {
    Id: 1, Nombre: 'Humanoide', Descripcion: '', Manual: 'Manual', Id_tipo_dado: 1, Tipo_dado: 8, Id_ataque: 1,
    Id_fortaleza: 1, Id_reflejos: 1, Id_voluntad: 1, Id_puntos_habilidad: 1, Come: true, Respira: true, Duerme: true,
    Recibe_criticos: true, Puede_ser_flanqueado: true, Pierde_constitucion: false, Limite_inteligencia: 0,
    Tesoro: 'Normal', Id_alineamiento: 0, Rasgos: [], Oficial: true,
} as TipoCriatura;

function crearRaza(): Raza {
    return {
        Id: 10, Nombre: 'Humano', Ajuste_nivel: 0, Manual: 'Manual', Clase_predilecta: 'Cualquiera',
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
        Armadura_natural: 0, Varios_armadura: 0, Correr: 30, Nadar: 0, Volar: 0, Maniobrabilidad: { Id: 0, Nombre: '-' },
        Trepar: 0, Excavar: 0, Altura_rango_inf: 1.6, Altura_rango_sup: 1.9, Peso_rango_inf: 55, Peso_rango_sup: 95,
        Edad_adulto: 18, Edad_mediana: 40, Edad_viejo: 60, Edad_venerable: 80, Espacio: 5, Alcance: 5, Tipo_criatura: TIPO,
        Subtipos: [], Sortilegas: [], Raciales: [], Habilidades: { Base: [], Custom: [] }, DotesContextuales: [],
    } as unknown as Raza;
}

/** Una fila de conjuros al día: `[cero, uno, …]`, con -1 donde no hay acceso. */
function diarios(...valores: number[]): Record<string, number> {
    const salida: Record<string, number> = {};
    for (let nivel = 0; nivel <= 9; nivel++)
        salida[`Nivel_${nivel}`] = valores[nivel] ?? -1;
    return salida;
}

/** Una clase como la daría la API (`normalizeClase` pone lo demás por defecto). */
function clase(raw: Record<string, any>): Clase {
    return normalizeClase({ Nivel_max_claseo: 20, Conjuros: {}, ...raw });
}

function nivel(n: number, extra: Record<string, any> = {}): Record<string, any> {
    return { Nivel: n, Ataque_base: '+0', Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' }, ...extra };
}

function conjuro(id: number, nombre: string, escuela: string, niveles: Record<string, any>): Conjuro {
    return {
        Id: id, Nombre: nombre, Arcano: true, Divino: true, Psionico: true,
        Escuela: { Id: 0, Nombre: escuela }, Disciplina: { Id: 0, Nombre: '' }, Descriptores: [],
        Nivel_clase: [], Nivel_dominio: [], Nivel_disciplinas: [], Oficial: true, ...niveles,
    } as unknown as Conjuro;
}

function crearServicio(caracteristicas: Partial<Record<'Fuerza' | 'Destreza' | 'Constitucion' | 'Inteligencia' | 'Sabiduria' | 'Carisma', number>>): NuevoPersonajeService {
    const service = new NuevoPersonajeService();
    service.setCatalogoTiposCriatura([TIPO]);
    service.seleccionarRaza(crearRaza());
    service.aplicarCaracteristicasGeneradas({
        Fuerza: 10, Destreza: 10, Constitucion: 10, Inteligencia: 10, Sabiduria: 10, Carisma: 10, ...caracteristicas,
    });
    return service;
}

describe('Reglas de la magia: el libro del mago (MJ cap. 3)', () => {
    const LIBRO = { Nivel_cero_completo: true, Iniciales: 3, Iniciales_suman_caracteristica: true, Por_nivel: 2 };
    const mago = clase({
        Id: 9, Nombre: 'Mago', Mod_salv_conjuros: 'Inteligencia',
        Conjuros: { Arcanos: true, puede_elegir_especialidad: true, Libro: LIBRO },
        Desglose_niveles: [nivel(1, { Conjuros_diarios: diarios(3, 1) }), nivel(2, { Conjuros_diarios: diarios(4, 2) }),
            nivel(3, { Conjuros_diarios: diarios(4, 2, 1) })],
    });
    const deMago = (n: number) => ({ Nivel_clase: [{ Id_clase: 9, Clase: 'Mago', Nivel: n, Espontaneo: false }] });
    const catalogo = [
        conjuro(101, 'Detectar magia', 'Adivinación', deMago(0)),
        conjuro(102, 'Luz', 'Evocación', deMago(0)),
        conjuro(103, 'Mano de mago', 'Transmutación', deMago(0)),
        conjuro(104, 'Prestidigitación', 'Universal', deMago(0)),
        ...[111, 112, 113, 114, 115, 116, 117].map((id) => conjuro(id, `Primero ${id}`, 'Conjuración', deMago(1))),
        conjuro(118, 'Proyectil mágico', 'Evocación', deMago(1)),
        conjuro(121, 'Invisibilidad', 'Ilusión', deMago(2)),
    ];
    const escuelas = [
        { Id: 3, Nombre: 'Conjuración', Nombre_especial: 'Conjurador', Prohibible: true, Especializable: true, Prohibidas_al_especializarse: 2 },
        { Id: 5, Nombre: 'Evocación', Nombre_especial: 'Evocador', Prohibible: true, Especializable: true, Prohibidas_al_especializarse: 2 },
        { Id: 6, Nombre: 'Ilusión', Nombre_especial: 'Ilusionista', Prohibible: true, Especializable: true, Prohibidas_al_especializarse: 2 },
        { Id: 8, Nombre: 'Transmutación', Nombre_especial: 'Transmutador', Prohibible: true, Especializable: true, Prohibidas_al_especializarse: 2 },
    ];

    function preparar(inteligencia: number): NuevoPersonajeService {
        const service = crearServicio({ Inteligencia: inteligencia });
        service.setCatalogoClases([mago]);
        service.setCatalogoConjuros(catalogo);
        return service;
    }

    it('mago 1 con Int 16: todos los de nivel 0 y 3 + 3 de nivel 1 a elegir; en cada nivel nuevo, 2', () => {
        const service = preparar(16);
        expect(service.aplicarSiguienteNivelClase(mago).aplicado).toBeTrue();
        let entrada = service.getConjurosSesionActual().entradas[0];
        expect(entrada.autoadicionadosIds.sort()).toEqual([101, 102, 103, 104]);
        expect(entrada.cupoPendiente.total).toBe(6);
        // Solo los de nivel 1: no los de nivel 2, que aún no lanza.
        expect(service.filtrarConjurosDisponibles().map((c) => c.Id).sort()).toEqual([111, 112, 113, 114, 115, 116, 117, 118]);
        [111, 112, 113, 114, 115].forEach((id) => service.seleccionarConjuroSesion(id));
        expect(service.puedeCerrarSesionConjuros()).toBeFalse();
        service.seleccionarConjuroSesion(116);
        expect(service.seleccionarConjuroSesion(117)).toBeFalse();
        service.cerrarSesionConjuros();
        expect(service.PersonajeCreacion.Conjuros.length).toBe(10);

        service.aplicarSiguienteNivelClase(mago);
        entrada = service.getConjurosSesionActual().entradas[0];
        expect(entrada.autoadicionadosIds).toEqual([]);
        expect(entrada.cupoPendiente.total).toBe(2);
        expect(service.filtrarConjurosDisponibles().map((c) => c.Id).sort()).toEqual([117, 118]);
        service.seleccionarConjuroSesion(117);
        service.seleccionarConjuroSesion(118);
        service.cerrarSesionConjuros();

        service.aplicarSiguienteNivelClase(mago);
        // Mago 3: ya lanza los de nivel 2, y elige 2 de cualquier nivel que pueda lanzar.
        expect(service.getConjurosSesionActual().entradas[0].cupoPendiente.total).toBe(1);
        expect(service.filtrarConjurosDisponibles().map((c) => c.Id)).toEqual([121]);
    });

    it('sin escuelas prohibidas en el libro: el especialista en Conjuración que prohíbe Evocación e Ilusión', () => {
        const service = preparar(14);
        service.aplicarSiguienteNivelClase(mago);
        expect(service.aplicarEspecialidadMagicaClase(mago, 1, {
            arcana: { especializar: true, escuelaEspecialistaId: 3, escuelasProhibidasIds: [5, 6] },
        }, escuelas, []).aplicado).toBeTrue();
        service.refrescarSesionConjurosPorEspecialidad();

        const entrada = service.getConjurosSesionActual().entradas[0];
        expect(entrada.autoadicionadosIds.sort()).toEqual([101, 103, 104]);
        expect(entrada.cupoPendiente.total).toBe(5);
        expect(service.filtrarConjurosDisponibles().map((c) => c.Id)).not.toContain(118);
    });

    it('una sola función dice qué puede añadir al libro (para la tienda): lo que lanza, sin prohibidas ni repetidos', () => {
        const service = preparar(16);
        service.aplicarSiguienteNivelClase(mago);
        [111, 112, 113, 114, 115, 116].forEach((id) => service.seleccionarConjuroSesion(id));
        service.cerrarSesionConjuros();

        expect(service.conjurosAniadiblesAlLibro(mago).map(({ conjuro: c, nivel: n }) => [c.Id, n]))
            .toEqual([[117, 1], [118, 1]]);
        expect(service.conjurosAniadiblesAlLibro(clase({ Id: 7, Nombre: 'Guerrero' }))).toEqual([]);
    });

    it('los que ya están en el libro, con su nivel, para contar sus páginas en la tienda', () => {
        const service = preparar(16);
        service.aplicarSiguienteNivelClase(mago);
        [111, 112, 113, 114, 115, 116].forEach((id) => service.seleccionarConjuroSesion(id));
        service.cerrarSesionConjuros();

        const enElLibro = service.conjurosEnElLibro(mago);
        expect(enElLibro.length).toBe(service.PersonajeCreacion.Conjuros.length);
        expect(enElLibro.filter((item) => item.nivel === 1).map((item) => item.conjuro.Id).sort()).toEqual([111, 112, 113, 114, 115, 116]);
        expect(enElLibro.every((item) => item.nivel === 0 || item.nivel === 1)).toBeTrue();
        // Los de nivel 0 y 1 ocupan una página cada uno.
        const libro = libroTienda(mago, service.conjurosAniadiblesAlLibro(mago), enElLibro);
        expect(libro.paginasUsadas).toBe(enElLibro.length);
        expect(libro.conjuros.map((item) => item.conjuro.Id)).toEqual([117, 118]);
        expect(service.conjurosEnElLibro(clase({ Id: 7, Nombre: 'Guerrero' }))).toEqual([]);
    });

    it('los conjuros del libro se guardan con su origen y sin marcar como copiados', () => {
        const service = preparar(10);
        service.aplicarSiguienteNivelClase(mago);
        service.cerrarSesionConjuros();
        service.PersonajeCreacion.Nombre = 'Ilsa';
        service.PersonajeCreacion.Campana = 'Sin campaña';

        const payload = new PersonajeService({ currentUser: null } as any, {} as any)
            .construirPayloadCreacionDesdePersonaje(service.PersonajeCreacion, { idAlineamiento: 1, idGenero: 1, idCarga: 1, idDeidad: 1 } as any);

        expect(payload.colecciones?.conjurosConocidos?.[0]).toEqual(jasmine.objectContaining({
            origen: 'Mago nivel 1 (clase)', copiado: false,
        }));
    });

    it('con Int 10 el libro solo tiene los de nivel 0 (MJ cap. 1: 10 + nivel del conjuro)', () => {
        const service = preparar(10);
        service.aplicarSiguienteNivelClase(mago);
        const entrada = service.getConjurosSesionActual().entradas[0];
        expect(entrada.autoadicionadosIds.length).toBe(4);
        expect(entrada.cupoPendiente.total).toBe(0);
        expect(service.puedeCerrarSesionConjuros()).toBeTrue();
    });
});

describe('Reglas de la magia: el clérigo y sus dominios (MJ cap. 3)', () => {
    const clerigo = clase({
        Id: 4, Nombre: 'Clérigo', Mod_salv_conjuros: 'Sabiduría',
        Conjuros: { Divinos: true, Dependientes_alineamiento: true, Dominio: true, Dominio_cantidad: 2 },
        Desglose_niveles: [nivel(1, { Conjuros_diarios: diarios(3, 1) })],
    });
    const dominios = [
        normalizeDominio({ Id: 5, Nombre: 'Bien', Oficial: true, Alineamientos: [{ Id: 1 }, { Id: 4 }, { Id: 7 }] }),
        normalizeDominio({ Id: 23, Nombre: 'Mal', Oficial: true, Alineamientos: [{ Id: 3 }, { Id: 6 }, { Id: 9 }] }),
        normalizeDominio({
            Id: 18, Nombre: 'Guerra', Oficial: true, Dotes: [
                { Id: 302, Nombre: 'Competencia con arma marcial', Id_extra: null, Extra_arma_deidad: true, Solo_sin_competencia: true },
                { Id: 4, Nombre: 'Soltura con un arma', Id_extra: null, Extra_arma_deidad: true, Solo_sin_competencia: false },
            ],
        }),
        normalizeDominio({
            Id: 33, Nombre: 'Superchería', Oficial: true,
            Habilidades_claseas: [{ Id_habilidad: 13, Habilidad: 'Engañar', Id_extra: -1 }],
        }),
        normalizeDominio({ Id: 12, Nombre: 'Destrucción', Oficial: true, Especiales: [{ Id: 1762, Nombre: 'Castigar' }] }),
    ];
    const heironeous = {
        Id: 1, Nombre: 'Heironeous', Alineamiento: { Id: 3, Id_basico: 1, Nombre: 'Legal bueno' },
        Arma: { Id: 5, Nombre: 'Espada larga' }, Dominios: [], Oficial: true,
    } as unknown as DeidadDetalle;

    function preparar(alineamiento: string, deidad = 'No tener deidad'): NuevoPersonajeService {
        const service = crearServicio({ Sabiduria: 16 });
        service.setCatalogoHabilidades([{
            Id_habilidad: 13, Nombre: 'Engañar', Id_caracteristica: 6, Caracteristica: 'Carisma', Descripcion: '',
            Soporta_extra: false, Entrenada: false, Extras: [],
        }] as any);
        service.setCatalogoClases([clerigo]);
        service.setCatalogoDominios(dominios);
        service.setCatalogoDeidades([heironeous]);
        service.PersonajeCreacion.Alineamiento = alineamiento;
        service.PersonajeCreacion.Deidad = deidad;
        return service;
    }

    it('elige dos dominios, por el dato de la clase', () => {
        expect(preparar('Neutral bueno').obtenerDominiosPendientesSiguienteNivelClase(clerigo)?.cantidad).toBe(2);
    });

    it('un dominio de alineamiento solo si el suyo coincide: un clérigo neutral maligno no elige Bien', () => {
        const nombres = (alineamiento: string) => (preparar(alineamiento).obtenerDominiosPendientesSiguienteNivelClase(clerigo)?.opciones ?? [])
            .map((opcion) => opcion.nombre);
        expect(nombres('Neutral maligno')).toContain('Mal');
        expect(nombres('Neutral maligno')).not.toContain('Bien');
        expect(nombres('Neutral autentico')).not.toContain('Bien');
        expect(nombres('Neutral autentico')).not.toContain('Mal');
        expect(nombres('Legal bueno')).toContain('Bien');
    });

    it('el poder concedido de Guerra: competencia y Soltura con el arma predilecta de la deidad', () => {
        const service = preparar('Legal bueno', 'Heironeous');
        expect(service.aplicarSiguienteNivelClase(clerigo, null, [18, 33]).aplicado).toBeTrue();

        const deGuerra = service.PersonajeCreacion.DotesContextuales
            .filter((dote) => (dote.Contexto as any)?.Origen === 'Dominio: Guerra')
            .map((dote) => [dote.Dote.Id, dote.Contexto.Id_extra, dote.Contexto.Extra]);
        expect(deGuerra).toEqual([[302, 5, 'Espada larga'], [4, 5, 'Espada larga']]);
        // Superchería: Engañar pasa a ser de clase.
        expect(service.PersonajeCreacion.Habilidades.find((h) => h.Nombre === 'Engañar')?.Clasea).toBeTrue();
    });

    it('las aptitudes del dominio pasan al personaje (Destrucción: Castigar)', () => {
        const service = preparar('Neutral autentico');
        service.aplicarSiguienteNivelClase(clerigo, null, [12, 33]);
        expect(service.PersonajeCreacion.Claseas.map((especial) => especial.Nombre)).toContain('Castigar');
    });

    it('un clérigo neutral de una deidad buena tampoco lanza conjuros malignos ni caóticos', () => {
        const service = preparar('Neutral autentico', 'Heironeous');
        const deClerigo = { Nivel_clase: [{ Id_clase: 4, Clase: 'Clérigo', Nivel: 0, Espontaneo: false }] };
        service.setCatalogoConjuros([
            conjuro(201, 'Guía', 'Adivinación', deClerigo),
            { ...conjuro(202, 'Toque maligno', 'Nigromancia', deClerigo), Descriptores: [{ Id: 12, Nombre: 'Maligno' }] } as Conjuro,
            { ...conjuro(203, 'Desorden', 'Encantamiento', deClerigo), Descriptores: [{ Id: 21, Nombre: 'Caótico' }] } as Conjuro,
        ]);
        service.aplicarSiguienteNivelClase(clerigo, null, [33, 12]);
        expect(service.getConjurosSesionActual().entradas[0].elegiblesIds).toEqual([201]);
    });
});

describe('Reglas de la magia: aumento de lanzador de las clases de prestigio (GDM cap. 6)', () => {
    const mago = clase({
        Id: 9, Nombre: 'Mago', Mod_salv_conjuros: 'Inteligencia', Conjuros: { Arcanos: true },
        Desglose_niveles: [nivel(1, { Conjuros_diarios: diarios(3, 1) }), nivel(2, { Conjuros_diarios: diarios(4, 2) })],
    });
    const clerigo = clase({
        Id: 4, Nombre: 'Clérigo', Mod_salv_conjuros: 'Sabiduría', Conjuros: { Divinos: true },
        Desglose_niveles: [nivel(1, { Conjuros_diarios: diarios(3, 1) }), nivel(2, { Conjuros_diarios: diarios(4, 2) })],
    });
    const psionico = clase({
        Id: 22, Nombre: 'Psiónico', Mod_salv_conjuros: 'Inteligencia', Conjuros: { Psionicos: true, Conocidos_total: true },
        Desglose_niveles: [
            nivel(1, { nivel_max_poder_accesible_nivel_lanzadorPsionico: 1, Reserva_psionica: 2, Conjuros_conocidos_total: 3 }),
            nivel(2, { nivel_max_poder_accesible_nivel_lanzadorPsionico: 1, Reserva_psionica: 6, Conjuros_conocidos_total: 5 }),
        ],
    });
    const prestigio = (id: number, aumento: Record<string, any>) => clase({
        Id: id, Nombre: `Prestigio ${id}`, Prestigio: true, Aumenta_clase_lanzadora: true,
        Desglose_niveles: [nivel(1, { Aumentos_clase_lanzadora: [aumento] })],
    });

    function objetivoDelAumento(clases: Clase[], aumento: Record<string, any>): number[] {
        const service = crearServicio({ Inteligencia: 16, Sabiduria: 16 });
        const prestige = prestigio(500, aumento);
        service.setCatalogoClases([...clases, prestige]);
        clases.forEach((c) => {
            service.aplicarSiguienteNivelClase(c);
            service.cerrarSesionConjuros();
        });
        const resultado = service.aplicarSiguienteNivelClase(prestige);
        if (!resultado.aplicado)
            return (resultado.aumentosClaseLanzadoraPendientes?.[0]?.opciones ?? []).map((o) => o.idClase);
        return (service.getProgresionLanzadorPersistible()?.selecciones ?? []).map((s) => s.idClaseObjetivo);
    }

    it('el aumento arcano sube el mago, no el clérigo', () => {
        expect(objetivoDelAumento([mago, clerigo], { Id: 2, Nombre: 'Arcano', Arcanos: true })).toEqual([9]);
    });

    it('el aumento divino sube el clérigo, no el mago', () => {
        expect(objetivoDelAumento([mago, clerigo], { Id: 3, Nombre: 'Divino', Divinos: true })).toEqual([4]);
    });

    it('«cualquier clase lanzadora» deja elegir entre el mago y el clérigo', () => {
        expect(objetivoDelAumento([mago, clerigo], { Id: 1, Nombre: 'Cualquiera', Arcanos: true, Divinos: true }).sort()).toEqual([4, 9]);
    });

    it('el aumento de manifestador sube el psiónico (Manual de psiónica expandido)', () => {
        expect(objetivoDelAumento([mago, psionico], { Id: 4, Nombre: 'Manifestador', Psionicos: true })).toEqual([22]);
    });
});

describe('Reglas de la magia: nivel de lanzador, característica mínima y puntos de poder', () => {
    const paladin = clase({
        Id: 11, Nombre: 'Paladín', Mod_salv_conjuros: 'Sabiduría', Conjuros: { Divinos: true, Nivel_lanzador_divisor: 2 },
        Desglose_niveles: Array.from({ length: 8 }, (_v, i) => nivel(i + 1, { Conjuros_diarios: i < 3 ? diarios() : diarios(-1, i < 5 ? 0 : 1) })),
    });

    function conPaladin(sabiduria: number, nivelClase: number): NuevoPersonajeService {
        const service = crearServicio({ Sabiduria: sabiduria });
        service.setCatalogoClases([paladin]);
        service.PersonajeCreacion.desgloseClases = [{ Id: 11, Nombre: 'Paladín', Nivel: nivelClase }];
        return service;
    }

    it('paladín 4: nivel de lanzador 2 (la mitad de su nivel, MJ cap. 3); paladín 8: 4', () => {
        expect((conPaladin(12, 4) as any).resolverNivelLanzadorMaximoPorTipo('divino')).toBe(2);
        expect((conPaladin(12, 8) as any).resolverNivelLanzadorMaximoPorTipo('divino')).toBe(4);
        expect((conPaladin(12, 3) as any).resolverNivelLanzadorMaximoPorTipo('divino')).toBe(0);
        const resumen = calcularNivelesLanzadorPersonaje(conPaladin(12, 8).PersonajeCreacion, [paladin]);
        expect(resumen[0].nivelLanzador).toBe(4);
    });

    it('paladín 4 con Sab 11 no lanza nada (0 de la tabla y ninguno adicional), así que no cuenta como lanzador', () => {
        expect((conPaladin(11, 4) as any).resolverNivelLanzadorMaximoPorTipo('divino')).toBe(0);
        expect((conPaladin(12, 4) as any).resolverNivelConjuroMaximoPorTipo('divino')).toBe(1);
    });

    it('mago 3 con Int 11 no lanza conjuros de nivel 2 para los prerrequisitos; con Int 12, sí (10 + nivel)', () => {
        const mago = clase({
            Id: 9, Nombre: 'Mago', Mod_salv_conjuros: 'Inteligencia', Conjuros: { Arcanos: true },
            Desglose_niveles: [nivel(1, { Conjuros_diarios: diarios(3, 1) }), nivel(2, { Conjuros_diarios: diarios(4, 2) }),
                nivel(3, { Conjuros_diarios: diarios(4, 2, 1) })],
        });
        const nivelMaximo = (inteligencia: number) => {
            const service = crearServicio({ Inteligencia: inteligencia });
            service.setCatalogoClases([mago]);
            service.PersonajeCreacion.desgloseClases = [{ Id: 9, Nombre: 'Mago', Nivel: 3 }];
            return (service as any).resolverNivelConjuroMaximoPorTipo('arcano');
        };
        expect(nivelMaximo(11)).toBe(1);
        expect(nivelMaximo(12)).toBe(2);
    });

    const psionico = clase({
        Id: 22, Nombre: 'Psiónico', Mod_salv_conjuros: 'Inteligencia', Conjuros: { Psionicos: true, puede_elegir_especialidad: true },
        Desglose_niveles: [
            nivel(1, { nivel_max_poder_accesible_nivel_lanzadorPsionico: 1, Reserva_psionica: 2 }),
            nivel(2, { nivel_max_poder_accesible_nivel_lanzadorPsionico: 1, Reserva_psionica: 6 }),
        ],
    });

    function conPsionico(inteligencia: number, bonus = 0): NuevoPersonajeService {
        const service = crearServicio({ Inteligencia: inteligencia });
        service.setCatalogoClases([psionico]);
        service.PersonajeCreacion.desgloseClases = [{ Id: 22, Nombre: 'Psiónico', Nivel: 1 }];
        if (bonus > 0)
            (service as any).incrementarBonusNivelLanzadorClase('Psiónico', bonus);
        return service;
    }

    it('psiónico 1 con Int 16: 2 de la tabla y 1 adicional (MPE tabla 2-1)', () => {
        expect((conPsionico(16) as any).resolverReservaPsionicaActual()).toBe(3);
    });

    it('con la característica en 9 o menos no manifiesta ni cuenta su reserva', () => {
        expect((conPsionico(9) as any).resolverReservaPsionicaActual()).toBe(0);
        expect((conPsionico(9) as any).resolverNivelPoderPsionicoMaximo()).toBe(0);
    });

    it('la reserva de los prerrequisitos cuenta los aumentos de prestigio: psiónico 1 con un aumento, como uno de nivel 2', () => {
        // 6 de la tabla de nivel 2 y ⌊3 × 2 / 2⌋ = 3 adicionales.
        expect((conPsionico(16, 1) as any).resolverReservaPsionicaActual()).toBe(9);
    });

    it('el psiónico aprende los poderes de su disciplina y los de la lista común, sin disciplina prohibida', () => {
        const service = crearServicio({ Inteligencia: 16 });
        const psionicoConLista = clase({
            ...psionico, Conjuros: { Psionicos: true, puede_elegir_especialidad: true, Conocidos_total: true },
            Desglose_niveles: [nivel(1, { nivel_max_poder_accesible_nivel_lanzadorPsionico: 1, Reserva_psionica: 2, Conjuros_conocidos_total: 3 })],
        });
        service.setCatalogoClases([psionicoConLista]);
        service.setCatalogoConjuros([
            { ...conjuro(301, 'Común de telepatía', '', { Nivel_clase: [{ Id_clase: 22, Clase: 'Psiónico', Nivel: 1, Espontaneo: false }] }), Disciplina: { Id: 6, Nombre: 'Telepatía' } } as Conjuro,
            conjuro(302, 'Del vidente', '', { Nivel_disciplinas: [{ Id_disciplina: 1, Disciplina: 'Psicodetección', Nivel: 1, Espontaneo: false }] }),
            conjuro(303, 'Del telépata', '', { Nivel_disciplinas: [{ Id_disciplina: 6, Disciplina: 'Telepatía', Nivel: 1, Espontaneo: false }] }),
        ]);
        service.aplicarSiguienteNivelClase(psionicoConLista);
        service.aplicarEspecialidadMagicaClase(psionicoConLista, 1, { psionica: { disciplinaEspecialistaId: 1, disciplinaProhibidaId: null } }, [], [
            { Id: 1, Nombre: 'Psicodetección', Nombre_especial: 'Vidente', Subdisciplinas: [], Especializable: true, Prohibidas_al_especializarse: 0 },
        ]);
        service.refrescarSesionConjurosPorEspecialidad();

        expect(service.filtrarConjurosDisponibles().map((c) => c.Id).sort()).toEqual([301, 302]);
    });
});

// Las clases propias (guía `docs/publica/CLASES_PROPIAS_FRONT.md`): escuela fija, aptitudes según el alineamiento, listas
// de conjuros por aptitud, niveles de conjuro con requisito y el cambio de tamaño. Datos inventados: nada va por nombre.
describe('Clases propias: lo que dicen los datos de la clase y de sus aptitudes', () => {
    const LIBRO = { Nivel_cero_completo: false, Iniciales: 3, Iniciales_suman_caracteristica: false, Por_nivel: 2 };
    const BUENO = { Id_actitud: 4, Actitud: 'Bueno', Opcional: 0, Frase: 'Cualquier alineamiento bueno' };

    function especialNivel(id: number, nombre: string, opcional = 0, especial: Record<string, any> = {}): Record<string, any> {
        return { Especial: { Id: id, Nombre: nombre, ...especial }, Opcional: opcional, Id_extra: null, Extra: '', Id_interno: 0 };
    }

    function claseConLibro(raw: Record<string, any>, especiales: Record<string, any>[] = []): Clase {
        return clase({
            Id: 80, Nombre: 'Lanzador de prueba', Mod_salv_conjuros: 'Inteligencia',
            ...raw,
            Conjuros: { Arcanos: true, Libro: LIBRO, ...(raw['Conjuros'] ?? {}) },
            Desglose_niveles: [nivel(1, { Conjuros_diarios: diarios(3, 1, 1), Especiales: especiales })],
        });
    }

    const deLaClase = (n: number) => ({ Nivel_clase: [{ Id_clase: 80, Clase: 'Lanzador de prueba', Nivel: n, Espontaneo: false }] });

    function aniadibles(claseObjetivo: Clase, catalogo: Conjuro[]): number[] {
        const service = crearServicio({ Inteligencia: 16 });
        service.setCatalogoClases([claseObjetivo]);
        service.setCatalogoConjuros(catalogo);
        expect(service.aplicarSiguienteNivelClase(claseObjetivo).aplicado).toBeTrue();
        return service.conjurosAniadiblesAlLibro(claseObjetivo).map((item) => Number(item.conjuro.Id)).sort();
    }

    describe('la escuela fija de la clase (Conjuros.Escuela_especialista)', () => {
        const fija = { Id: 9, Nombre: 'Escuela propia', Nombre_esp: 'Especialista propio' };
        const escuelas = [
            { Id: 3, Nombre: 'Conjuración', Nombre_especial: 'Conjurador', Prohibible: true, Especializable: true, Prohibidas_al_especializarse: 2 },
            { Id: 5, Nombre: 'Evocación', Nombre_especial: 'Evocador', Prohibible: true, Especializable: true, Prohibidas_al_especializarse: 2 },
            { Id: 6, Nombre: 'Ilusión', Nombre_especial: 'Ilusionista', Prohibible: true, Especializable: true, Prohibidas_al_especializarse: 2 },
            { Id: 9, Nombre: 'Escuela propia', Nombre_especial: 'Especialista propio', Prohibible: true, Especializable: true, Prohibidas_al_especializarse: 2, Oficial: false },
        ];
        const conFija = claseConLibro({ Conjuros: { puede_elegir_especialidad: false, Escuela_especialista: fija } });

        it('pide la especialidad aunque la clase no la elija, con la escuela fija', () => {
            const service = crearServicio({ Inteligencia: 16 });
            expect(service.getEspecialidadMagicaPendiente(conFija, 1)).toEqual({ requiereArcano: true, requierePsionico: false, escuelaFija: fija });
            expect(service.getEspecialidadMagicaPendiente(claseConLibro({}), 1)).toBeNull();
        });

        it('guarda la escuela fija como especialidad (para idEspArcana) aunque no se elija, y sus prohibidas', () => {
            const service = crearServicio({ Inteligencia: 16 });
            const resultado = service.aplicarEspecialidadMagicaClase(conFija, 1, {
                arcana: { especializar: false, escuelaEspecialistaId: null, escuelasProhibidasIds: [3, 5] },
            }, escuelas, []);
            expect(resultado.aplicado).toBeTrue();
            expect(service.PersonajeCreacion.Escuela_especialista).toEqual({ Nombre: 'Escuela propia', Calificativo: 'Especialista propio' });
            expect(service.PersonajeCreacion.Escuelas_prohibidas).toEqual([{ Nombre: 'Conjuración' }, { Nombre: 'Evocación' }]);
        });

        it('pide tantas prohibidas como diga la escuela fija y que esté en el catálogo', () => {
            const service = crearServicio({ Inteligencia: 16 });
            expect(service.aplicarEspecialidadMagicaClase(conFija, 1, {
                arcana: { especializar: true, escuelaEspecialistaId: 3, escuelasProhibidasIds: [5] },
            }, escuelas, []).aplicado).toBeFalse();
            expect(service.aplicarEspecialidadMagicaClase(conFija, 1, {
                arcana: { especializar: true, escuelaEspecialistaId: null, escuelasProhibidasIds: [3, 5] },
            }, escuelas.filter((escuela) => escuela.Id !== 9), []).razon).toBe('No se encuentra la escuela Escuela propia en el catálogo de escuelas.');
        });
    });

    describe('las aptitudes opcionales según el alineamiento (Prerrequisitos de actitud)', () => {
        const conSendas = claseConLibro({}, [
            especialNivel(50, 'Senda buena', 1, { Prerrequisitos: { actitud_requerido: [BUENO], actitud_prohibido: [] } }),
            especialNivel(51, 'Senda libre', 1),
        ]);

        it('la que no permite su alineamiento sale bloqueada con su motivo y no se puede elegir', () => {
            const service = crearServicio({ Inteligencia: 16 });
            service.setCatalogoClases([conSendas]);
            service.PersonajeCreacion.Alineamiento = 'Caotico maligno';
            const [grupo] = service.obtenerOpcionalesSiguienteNivelClase(conSendas);
            expect(grupo.opciones.map((opcion) => [opcion.nombre, !!opcion.bloqueada, opcion.motivo ?? ''])).toEqual([
                ['Senda buena', true, 'No cumple: Cualquier alineamiento bueno'],
                ['Senda libre', false, ''],
            ]);
            expect(service.aplicarSiguienteNivelClase(conSendas, { [grupo.grupo]: grupo.opciones[0].clave }).aplicado).toBeFalse();
        });

        it('con el alineamiento que pide, se puede elegir', () => {
            const service = crearServicio({ Inteligencia: 16 });
            service.setCatalogoClases([conSendas]);
            service.PersonajeCreacion.Alineamiento = 'Legal bueno';
            const [grupo] = service.obtenerOpcionalesSiguienteNivelClase(conSendas);
            expect(grupo.opciones.every((opcion) => !opcion.bloqueada)).toBeTrue();
            expect(service.aplicarSiguienteNivelClase(conSendas, { [grupo.grupo]: grupo.opciones[0].clave }).aplicado).toBeTrue();
            expect(service.PersonajeCreacion.Claseas.map((especial) => especial.Nombre)).toEqual(['Senda buena']);
        });
    });

    describe('la lista de conjuros de una aptitud (Conjuros.Listado_por_especial)', () => {
        const catalogo = [
            conjuro(201, 'De la clase', 'Evocación', deLaClase(1)),
            conjuro(202, 'De la senda', 'Evocación', {}),
        ];
        const listas = {
            Conjuros: {
                Listado: [{ Id: 201, Nombre: 'De la clase', Nivel: 1, Espontaneo: false }],
                Listado_por_especial: [{ Id: 202, Nombre: 'De la senda', Nivel: 1, Espontaneo: false, Especial: { Id: 60, Nombre: 'Senda' }, Extra: null }],
            },
        };

        it('sin la aptitud, solo los de la clase; con ella, también los suyos (al subir de nivel y en la tienda del libro)', () => {
            expect(aniadibles(claseConLibro(listas), catalogo)).toEqual([201]);
            expect(aniadibles(claseConLibro(listas, [especialNivel(60, 'Senda')]), catalogo)).toEqual([201, 202]);
        });
    });

    describe('los niveles de conjuro con requisito (Conjuros.Niveles_con_requisito)', () => {
        const catalogo = [
            conjuro(211, 'De primero', 'Evocación', deLaClase(1)),
            conjuro(212, 'De segundo', 'Evocación', deLaClase(2)),
        ];
        const requisito = { Conjuros: { Niveles_con_requisito: [{ Nivel: 2, Especial: { Id: 70, Nombre: 'Implante' }, Dote: null }] } };

        it('sin la aptitud no ofrece conjuros de ese nivel; con ella, sí', () => {
            expect(aniadibles(claseConLibro(requisito), catalogo)).toEqual([211]);
            expect(aniadibles(claseConLibro(requisito, [especialNivel(70, 'Implante')]), catalogo)).toEqual([211, 212]);
        });
    });

    describe('el cambio de tamaño de una aptitud (Modificadores.Tamano_pasos)', () => {
        const tamanos = [
            { Id: 1, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0, Modificador_esconderse: 0, Multiplicador_carga: 1, Espacio: 5, Alcance: 5, Alcance_largo: 5 },
            { Id: 2, Nombre: 'Grande', Modificador: -1, Modificador_presa: 4, Modificador_esconderse: -4, Multiplicador_carga: 2, Espacio: 10, Alcance: 10, Alcance_largo: 5 },
        ];

        it('pasa a Grande: CA, presa, espacio y alcance del tamaño nuevo', () => {
            const service = crearServicio({ Inteligencia: 16 });
            service.setCatalogoTamanos(tamanos);
            const grande = claseConLibro({}, [especialNivel(90, 'Aptitud grande', 0, { Modificadores: { Tamano_pasos: 1 } })]);
            service.setCatalogoClases([grande]);
            expect(service.PersonajeCreacion.Espacio).toBe(5);
            const caAntes = service.PersonajeCreacion.Ca;
            expect(service.aplicarSiguienteNivelClase(grande).aplicado).toBeTrue();
            const pj = service.PersonajeCreacion;
            expect(pj.Tamano_efectivo).toEqual(jasmine.objectContaining({
                nombre: 'Grande', pasos: 1, base: { Id: 1, Nombre: 'Mediano' }, origenes: [{ origen: 'Aptitud grande', pasos: 1 }],
            }));
            expect(pj.Espacio).toBe(10);
            expect(pj.Alcance).toBe(10);
            expect(pj.Ca).toBe(caAntes - 1);
            expect(pj.Presa).toBe(4);
        });

        it('las columnas de características de la aptitud van a las características (Fue +2 y Des −2 al agrandarse)', () => {
            const service = crearServicio({ Inteligencia: 16, Fuerza: 14, Destreza: 12 });
            service.setCatalogoTamanos(tamanos);
            const grande = claseConLibro({}, [especialNivel(92, 'Aptitud grande', 0, {
                Modificadores: { Tamano_pasos: 1, Fuerza: 2, Destreza: -2, Constitucion: 0 },
            })]);
            service.setCatalogoClases([grande]);
            expect(service.aplicarSiguienteNivelClase(grande).aplicado).toBeTrue();

            const pj = service.PersonajeCreacion;
            expect([pj.Fuerza, pj.ModFuerza, pj.Destreza, pj.ModDestreza]).toEqual([16, 3, 10, 0]);
            expect(pj.CaracteristicasVarios.Fuerza).toEqual([{ valor: 2, origen: 'Especial: Aptitud grande' }]);
            // Un recálculo posterior (una ventaja, una plantilla) no la cuenta dos veces.
            service.recalcularEfectosVentajas();
            expect([service.PersonajeCreacion.Fuerza, service.PersonajeCreacion.Destreza]).toEqual([16, 10]);
            // La presa del tamaño nuevo (+4) con la Fuerza nueva (+3).
            expect(service.PersonajeCreacion.Presa).toBe(7);
        });

        it('sin aptitudes que lo cambien, el de la raza', () => {
            const service = crearServicio({ Inteligencia: 16 });
            service.setCatalogoTamanos(tamanos);
            const normal = claseConLibro({}, [especialNivel(91, 'Aptitud normal')]);
            service.setCatalogoClases([normal]);
            service.aplicarSiguienteNivelClase(normal);
            expect(service.PersonajeCreacion.Tamano_efectivo?.nombre).toBe('Mediano');
            expect(service.PersonajeCreacion.Presa).toBe(0);
        });
    });
});

// Las mismas reglas con las respuestas reales de la API de desarrollo (`src/testing/clases-propias-api.ts`): el
// magiingeniero, el convocador divino y el guardaespaldas tal como los devuelve `GET /clases/<id>`.
describe('Clases propias con las respuestas reales de la API', () => {
    const magiingeniero = normalizeClase(MAGIINGENIERO_API);
    const convocador = normalizeClase(CONVOCADOR_DIVINO_API);
    const guardaespaldas = normalizeClase(GUARDAESPALDAS_API);
    const escuelas = (ESCUELAS_API as any[]).map((raw) => normalizeEscuela(raw));
    const tamanos = (TAMANOS_API as any[]).map((raw) => normalizeTamano(raw));
    const MEDIANO = tamanos.find((tamano) => tamano.Nombre === 'Mediano')!;

    describe('el magiingeniero: escuela fija y el 7.º ligado a una dote', () => {
        it('la especialidad viene fija (la de la clase, homebrew) aunque la clase diga también que puede elegirla', () => {
            const service = crearServicio({ Inteligencia: 16 });
            const pendiente = service.getEspecialidadMagicaPendiente(magiingeniero, 1)!;
            expect(pendiente.escuelaFija).toEqual(magiingeniero.Conjuros.Escuela_especialista!);
            expect(pendiente.requierePsionico).toBeFalse();
            const fija = service.escuelaFijaEnCatalogo(pendiente, escuelas)!;
            expect([fija.Nombre, fija.Oficial, fija.Prohibidas_al_especializarse]).toEqual([pendiente.escuelaFija!.Nombre, false, 2]);
        });

        it('solo se eligen las prohibidas que pide la escuela, nunca una que no se puede prohibir', () => {
            const idFija = magiingeniero.Conjuros.Escuela_especialista!.Id;
            const prohibibles = escuelas.filter((escuela) => escuela.Id > 0 && escuela.Prohibible && escuela.Especializable && escuela.Id !== idFija);
            const noProhibible = escuelas.find((escuela) => escuela.Id > 0 && escuela.Especializable && !escuela.Prohibible)!;
            const aplicar = (ids: number[]) => {
                const service = crearServicio({ Inteligencia: 16 });
                const resultado = service.aplicarEspecialidadMagicaClase(magiingeniero, 1, {
                    arcana: { especializar: false, escuelaEspecialistaId: null, escuelasProhibidasIds: ids },
                }, escuelas, []);
                return { resultado, pj: service.PersonajeCreacion };
            };

            const bien = aplicar([prohibibles[0].Id, prohibibles[1].Id]);
            expect(bien.resultado.aplicado).toBeTrue();
            expect(bien.pj.Escuela_especialista.Nombre).toBe(magiingeniero.Conjuros.Escuela_especialista!.Nombre);
            expect(bien.pj.Escuela_especialista.Calificativo).toBe(magiingeniero.Conjuros.Escuela_especialista!.Nombre_esp);
            expect(aplicar([prohibibles[0].Id, noProhibible.Id]).resultado.aplicado).toBeFalse();
        });

        it('sin la dote del implante no tiene el 7.º; con ella, sí', () => {
            const requisito = magiingeniero.Conjuros.Niveles_con_requisito![0];
            expect(requisito.Especial).toBeNull();
            expect(Array.from(nivelesConjuroSinRequisito(magiingeniero, [], []))).toEqual([requisito.Nivel]);
            expect(nivelesConjuroSinRequisito(magiingeniero, [], [requisito.Dote!.Id]).size).toBe(0);
            expect(textoRequisitoNivelConjuro(magiingeniero, requisito.Nivel)).toBe(requisito.Dote!.Nombre);
        });

        it('su lista suma la de su clase de origen (el mago) a la suya', () => {
            const mago = normalizeClase(MAGO_RECORTADO_API);
            expect(magiingeniero.Conjuros.Clase_origen.Id).toBe(mago.Id);
            const lista = listadoConjurosClase(magiingeniero, [], mago).map((ref) => ref.Id);
            expect(lista).toEqual([...magiingeniero.Conjuros.Listado, ...mago.Conjuros.Listado].map((ref) => ref.Id));
        });
    });

    describe('el convocador divino: sendas según el alineamiento y sus listas', () => {
        function sendasPara(alineamiento: string): Array<[string, boolean]> {
            const service = crearServicio({ Carisma: 16 });
            service.setCatalogoClases([convocador]);
            service.PersonajeCreacion.Alineamiento = alineamiento;
            const grupo = service.obtenerOpcionalesSiguienteNivelClase(convocador)
                .find((item) => item.opciones.some((opcion) => opcion.nombre.startsWith('Senda')))!;
            return grupo.opciones.map((opcion) => [opcion.nombre, !opcion.bloqueada]);
        }

        it('cada alineamiento solo puede elegir su senda', () => {
            expect(sendasPara('Legal bueno')).toEqual([['Senda del esandy', true], ['Senda del uzurna', false], ['Senda del asenda', false]]);
            expect(sendasPara('Caotico maligno')).toEqual([['Senda del esandy', false], ['Senda del uzurna', true], ['Senda del asenda', false]]);
            expect(sendasPara('Neutral autentico')).toEqual([['Senda del esandy', false], ['Senda del uzurna', false], ['Senda del asenda', true]]);
        });

        it('la senda elegida da su lista (y la del asenda, la de su elemento)', () => {
            const especiales = convocador.Desglose_niveles[0].Especiales.map((item) => item.Especial as Record<string, any>);
            const id = (nombre: string) => Number(especiales.find((especial) => especial['Nombre'] === nombre)?.['Id']);
            const porSenda = (aptitud: { id: number; idExtra?: number; }) => conjurosDeAptitudes(convocador, [aptitud]).length;
            const delListado = (filtro: (ref: any) => boolean) => convocador.Conjuros.Listado_por_especial!.filter(filtro).length;

            expect(convocador.Conjuros.Listado).toEqual([]);
            expect(porSenda({ id: id('Senda del esandy') })).toBe(delListado((ref) => ref.Especial.Id === id('Senda del esandy')));
            const comunesAsenda = delListado((ref) => ref.Especial.Id === id('Senda del asenda') && ref.Extra === null);
            const elemento = convocador.Conjuros.Listado_por_especial!.find((ref) => ref.Extra !== null)!.Extra!.Id;
            expect(porSenda({ id: id('Senda del asenda') })).toBe(comunesAsenda);
            expect(porSenda({ id: id('Senda del asenda'), idExtra: elemento }))
                .toBe(comunesAsenda + delListado((ref) => ref.Extra?.Id === elemento));
        });

        it('al aplicar el nivel con la senda, el personaje la tiene y su lista cuenta como de la clase', () => {
            const service = crearServicio({ Carisma: 16 });
            service.setCatalogoClases([convocador]);
            service.PersonajeCreacion.Alineamiento = 'Legal bueno';
            const grupo = service.obtenerOpcionalesSiguienteNivelClase(convocador)
                .find((item) => item.opciones.some((opcion) => opcion.nombre === 'Senda del esandy'))!;
            const clave = grupo.opciones.find((opcion) => opcion.nombre === 'Senda del esandy')!.clave;
            const otros = Object.fromEntries(service.obtenerOpcionalesSiguienteNivelClase(convocador)
                .filter((item) => item.grupo !== grupo.grupo)
                .map((item) => [item.grupo, item.opciones.find((opcion) => !opcion.bloqueada)!.clave]));
            expect(service.aplicarSiguienteNivelClase(convocador, { ...otros, [grupo.grupo]: clave }).aplicado).toBeTrue();

            const aptitudes = (service as any).aptitudesDelPersonaje();
            expect(service.PersonajeCreacion.Claseas.map((especial) => especial.Nombre)).toContain('Senda del esandy');
            expect(listadoConjurosClase(convocador, aptitudes).length).toBe(conjurosDeAptitudes(convocador, aptitudes).length);
            expect(listadoConjurosClase(convocador, aptitudes).length).toBeGreaterThan(0);
        });

        describe('el elemento de la senda del asenda (el extra «Elegir» de la aptitud)', () => {
            function neutralConAsenda(): { service: NuevoPersonajeService; selecciones: Record<number, string>; } {
                const service = crearServicio({ Carisma: 16 });
                service.setCatalogoClases([convocador]);
                service.PersonajeCreacion.Alineamiento = 'Neutral autentico';
                const selecciones = Object.fromEntries(service.obtenerOpcionalesSiguienteNivelClase(convocador)
                    .map((item) => [item.grupo, item.opciones.find((opcion) => !opcion.bloqueada)!.clave]));
                return { service, selecciones };
            }

            it('la senda elegida pide su extra; las otras no', () => {
                const { service, selecciones } = neutralConAsenda();
                expect(service.obtenerEspecialesExtraPendientesSiguienteNivelClase(convocador, selecciones))
                    .toEqual([jasmine.objectContaining({ idEspecial: 2595, nombre: 'Senda del asenda' })]);

                const bueno = crearServicio({ Carisma: 16 });
                bueno.setCatalogoClases([convocador]);
                bueno.PersonajeCreacion.Alineamiento = 'Legal bueno';
                const conEsandy = Object.fromEntries(bueno.obtenerOpcionalesSiguienteNivelClase(convocador)
                    .map((item) => [item.grupo, item.opciones.find((opcion) => !opcion.bloqueada)!.clave]));
                expect(bueno.obtenerEspecialesExtraPendientesSiguienteNivelClase(convocador, conEsandy)).toEqual([]);
            });

            it('sin el elemento no aplica el nivel ni cambia nada', () => {
                const { service, selecciones } = neutralConAsenda();
                const resultado = service.aplicarSiguienteNivelClase(convocador, selecciones);

                expect(resultado.aplicado).toBeFalse();
                expect(resultado.razon).toBe('Falta elegir el extra de Senda del asenda');
                expect(resultado.especialesExtraPendientes?.map((pendiente) => pendiente.nombre)).toEqual(['Senda del asenda']);
                expect(service.PersonajeCreacion.Claseas).toEqual([]);
                expect(service.PersonajeCreacion.desgloseClases ?? []).toEqual([]);
            });

            it('con el elemento, el personaje guarda la senda con su extra y su lista suma los conjuros de ese elemento', () => {
                const { service, selecciones } = neutralConAsenda();
                const [pendiente] = service.obtenerEspecialesExtraPendientesSiguienteNivelClase(convocador, selecciones);

                const resultado = service.aplicarSiguienteNivelClase(convocador, selecciones, null, false, null,
                    { [pendiente.clave]: { idExtra: 137, extra: 'Fuego' } });

                expect(resultado.aplicado).toBeTrue();
                expect(service.PersonajeCreacion.Claseas).toContain(jasmine.objectContaining({ Id: 2595, Id_extra: 137, Nombre: 'Senda del asenda', Extra: 'Fuego' }));
                expect(service.idsExtraDeAptitud(2595)).toEqual([137]);
                const lista = listadoConjurosClase(convocador, (service as any).aptitudesDelPersonaje()).map((ref) => ref.Nombre);
                const delElemento = (elemento: string) => convocador.Conjuros.Listado_por_especial!
                    .filter((ref) => ref.Extra?.Nombre === elemento).map((ref) => ref.Nombre);
                expect(delElemento('Fuego').length).toBeGreaterThan(0);
                delElemento('Fuego').forEach((nombre) => expect(lista).toContain(nombre));
                delElemento('Agua').filter((nombre) => !delElemento('Fuego').includes(nombre))
                    .forEach((nombre) => expect(lista).not.toContain(nombre));

                service.cerrarSesionConjuros();
                service.PersonajeCreacion.Nombre = 'Ileas';
                service.PersonajeCreacion.Campana = 'Sin campaña';

                const payload = new PersonajeService({ currentUser: null } as any, {} as any).construirPayloadCreacionDesdePersonaje(
                    service.PersonajeCreacion,
                    { idAlineamiento: 5, idGenero: 1, idDeidad: 1 } as any,
                );
                expect(payload.colecciones?.especiales).toContain({ idEspecial: 2595, idExtra: 137 });
            });
        });
    });

    describe('el guardaespaldas: Tamaño imponente', () => {
        const entrada = guardaespaldas.Desglose_niveles
            .flatMap((nivelClase) => nivelClase.Especiales)
            .find((item) => pasosTamanoEspecialNivel(item) !== 0)!;

        it('la aptitud trae +1 de tamaño y Fue +2, Des −2 en sus columnas', () => {
            expect(pasosTamanoEspecialNivel(entrada)).toBe(1);
            expect(modificadoresCaracteristicaEspecialNivel(entrada)).toEqual(jasmine.objectContaining({ Fuerza: 2, Destreza: -2 }));
        });

        it('un Mediano que la tiene pasa a Grande: CA −1, presa +4, espacio y alcance de 10 y Fue +2, Des −2', () => {
            const service = new NuevoPersonajeService();
            service.setCatalogoTiposCriatura([TIPO]);
            service.seleccionarRaza({ ...crearRaza(), Tamano: MEDIANO } as Raza);
            service.aplicarCaracteristicasGeneradas({ Fuerza: 14, Destreza: 12, Constitucion: 10, Inteligencia: 10, Sabiduria: 10, Carisma: 10 });
            service.setCatalogoTamanos(tamanos);
            // Una clase de prueba que da en su nivel 1 el especial real del guardaespaldas (en la suya llega en el 8.º).
            const conAptitud = clase({ Id: 81, Nombre: 'Clase de prueba', Desglose_niveles: [nivel(1, { Especiales: [{ ...entrada, Nivel: 1, Opcional: 0 }] })] });
            service.setCatalogoClases([conAptitud]);
            const caAntes = service.PersonajeCreacion.Ca;
            expect(service.aplicarSiguienteNivelClase(conAptitud).aplicado).toBeTrue();

            const pj = service.PersonajeCreacion;
            expect(pj.Tamano_efectivo).toEqual(jasmine.objectContaining({ nombre: 'Grande', pasos: 1, espacio: 10, alcance: 10 }));
            expect([pj.Espacio, pj.Alcance]).toEqual([10, 10]);
            expect([pj.Fuerza, pj.Destreza]).toEqual([16, 10]);
            // −1 por el tamaño y −1 por la Destreza que pierde (12 → 10).
            expect(pj.Ca).toBe(caAntes - 2);
            expect(pj.Presa).toBe(4 + 3);
        });
    });
});

describe('Lanzamiento racial (Draconomicón, pág. 24): la raza lanza como una clase y suma sus niveles', () => {
    const hechicero = clase({
        Id: 7, Nombre: 'Hechicero', Mod_salv_conjuros: 'Carisma', Conjuros: { Arcanos: true, Conocidos_total: true },
        Desglose_niveles: [
            nivel(1, { Conjuros_diarios: diarios(5, 3), Conjuros_conocidos_total: 2 }),
            nivel(2, { Conjuros_diarios: diarios(6, 4), Conjuros_conocidos_total: 3 }),
            nivel(3, { Conjuros_diarios: diarios(6, 5), Conjuros_conocidos_total: 4 }),
        ],
    });
    const guerrero = clase({ Id: 1, Nombre: 'Guerrero', Desglose_niveles: [nivel(1)] });
    const deHechicero = (n: number) => ({ Nivel_clase: [{ Id_clase: 7, Clase: 'Hechicero', Nivel: n, Espontaneo: true }] });
    const catalogo = [
        conjuro(201, 'Luz', 'Evocación', deHechicero(0)),
        conjuro(202, 'Proyectil mágico', 'Evocación', deHechicero(1)),
        conjuro(203, 'Escudo', 'Abjuración', deHechicero(1)),
        // Solo de clérigo y divino: lo lanza como arcano por la lista extra de su raza.
        { ...conjuro(301, 'Bendición', 'Encantamiento', { Nivel_clase: [{ Id_clase: 2, Clase: 'Clérigo', Nivel: 1, Espontaneo: false }] }), Arcano: false },
        { ...conjuro(302, 'Nube brumosa', 'Conjuración', { Nivel_dominio: [{ Id_dominio: 5, Dominio: 'Aire', Nivel: 1 }] }), Arcano: false },
    ];

    function preparar(lanzamiento: Raza['Lanzamiento']): NuevoPersonajeService {
        const service = new NuevoPersonajeService();
        service.setCatalogoTiposCriatura([TIPO]);
        service.seleccionarRaza({ ...crearRaza(), Lanzamiento: lanzamiento });
        service.aplicarCaracteristicasGeneradas({ Fuerza: 10, Destreza: 10, Constitucion: 10, Inteligencia: 10, Sabiduria: 10, Carisma: 14 });
        service.setCatalogoClases([hechicero, guerrero]);
        service.setCatalogoConjuros(catalogo);
        return service;
    }

    it('en la primera sesión elige los conjuros del nivel de su raza, aunque su primer nivel sea de otra clase', () => {
        const service = preparar({ Clase: { Id: 7, Nombre: 'Hechicero' }, Nivel: 2, Listas: [] });
        expect(service.aplicarSiguienteNivelClase(guerrero).aplicado).toBeTrue();

        const entradas = service.getConjurosSesionActual().entradas;
        expect(entradas.length).toBe(1);
        expect(entradas[0].claseObjetivo.nombre).toBe('Hechicero');
        expect([entradas[0].nivelLanzadorPrevio, entradas[0].nivelLanzadorActual]).toEqual([0, 2]);
        expect(entradas[0].cupoPendiente.total).toBe(3);
        expect(entradas[0].origen).toContain('Lanzamiento racial');
    });

    it('sus niveles reales de la clase se suman encima del nivel racial, y el racial no se repite', () => {
        const service = preparar({ Clase: { Id: 7, Nombre: 'Hechicero' }, Nivel: 2, Listas: [] });
        service.aplicarSiguienteNivelClase(hechicero);

        const entradas = service.getConjurosSesionActual().entradas;
        expect(entradas.map((e) => [e.nivelLanzadorPrevio, e.nivelLanzadorActual])).toEqual([[0, 2], [2, 3]]);
        expect(entradas[1].cupoPendiente.total).toBe(1);

        service.cerrarSesionConjuros();
        service.aplicarSiguienteNivelClase(guerrero);
        expect(service.getConjurosSesionActual().entradas.length).toBe(0);
    });

    it('las listas extra de su raza (una clase y un dominio) entran como arcanas', () => {
        const service = preparar({
            Clase: { Id: 7, Nombre: 'Hechicero' }, Nivel: 2,
            Listas: [{ Tipo: 'clase', Id: 2, Nombre: 'Clérigo' }, { Tipo: 'dominio', Id: 5, Nombre: 'Aire' }],
        });
        service.aplicarSiguienteNivelClase(guerrero);

        expect(service.getConjurosSesionActual().entradas[0].elegiblesIds.sort()).toEqual([201, 202, 203, 301, 302]);
    });

    it('sin lanzamiento racial (o con nivel 0 a su edad) no hay sesión de conjuros para un guerrero', () => {
        [null, { Clase: { Id: 7, Nombre: 'Hechicero' }, Nivel: 0, Listas: [] }].forEach((lanzamiento) => {
            const service = preparar(lanzamiento);
            service.aplicarSiguienteNivelClase(guerrero);
            expect(service.getConjurosSesionActual().activa).toBeFalse();
        });
    });
});

describe('PJ o PNJ y la edad de una raza por edades, en la creación', () => {
    it('el tipo se elige lo primero, se puede cambiar hasta elegir la raza y un PNJ nace privado', () => {
        const service = new NuevoPersonajeService();
        expect(service.TipoPersonajeCreacion).toBeNull();
        service.PersonajeCreacion.visible_otros_usuarios = true;

        expect(service.elegirTipoPersonaje('pnj')).toBeTrue();
        expect(service.TipoPersonajeCreacion).toBe('pnj');
        expect(service.PersonajeCreacion.visible_otros_usuarios).toBeFalse();
        expect(service.elegirTipoPersonaje('pj')).toBeTrue();

        service.setCatalogoTiposCriatura([TIPO]);
        service.seleccionarRaza(crearRaza());
        expect(service.elegirTipoPersonaje('pnj')).toBeFalse();
        expect(service.TipoPersonajeCreacion).toBe('pj');
    });

    it('una raza resuelta a una edad guarda su paso y empieza con sus años; sin edades, nada', () => {
        const service = new NuevoPersonajeService();
        service.setCatalogoTiposCriatura([TIPO]);
        const paso = { Id: 13, Edad: 16, Categoria: { Id: 3, Nombre: 'Joven' }, Orden: 3, Dgs: 13, Ajuste_nivel: 6, Armadura_natural: 12, Nep_base: 19, Jugable: true, Vd: 7 };
        service.seleccionarRaza({ ...crearRaza(), Paso_edad: paso });

        expect(service.PersonajeCreacion.IdPasoEdad).toBe(13);
        expect(service.PersonajeCreacion.CategoriaEdad?.categoria.Nombre).toBe('Joven');
        expect(service.PersonajeCreacion.Edad).toBe(16);

        service.seleccionarRaza(crearRaza());
        expect(service.PersonajeCreacion.IdPasoEdad).toBeNull();
        expect(service.PersonajeCreacion.CategoriaEdad).toBeNull();
        expect(service.PersonajeCreacion.Edad).toBe(18);
    });
});
