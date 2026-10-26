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
        Trepar: 0, Escalar: 0, Altura_rango_inf: 1.6, Altura_rango_sup: 1.9, Peso_rango_inf: 55, Peso_rango_sup: 95,
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
        Id: id, Nombre: nombre, Arcano: true, Divino: true, Psionico: true, Alma: false,
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
