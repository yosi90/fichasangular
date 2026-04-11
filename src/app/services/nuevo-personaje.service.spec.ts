import { GeneradorAutoCuestionario, NuevoPersonajeService } from './nuevo-personaje.service';
import { Clase } from '../interfaces/clase';
import { DeidadDetalle } from '../interfaces/deidad';
import { DominioDetalle } from '../interfaces/dominio';
import { VentajaDetalle } from '../interfaces/ventaja';
import { HabilidadBasicaDetalle } from '../interfaces/habilidad';
import { IdiomaDetalle } from '../interfaces/idioma';
import { createRacialPlaceholder } from './utils/racial-mapper';
import { Plantilla } from '../interfaces/plantilla';
import { Raza } from '../interfaces/raza';
import { TipoCriatura } from '../interfaces/tipo_criatura';
import { createDefaultUserSettings } from '../interfaces/user-settings';
import { UserSettingsService } from './user-settings.service';

const GENERADOR_CONFIG_STORAGE_KEY = 'fichas35.nuevoPersonaje.generador.config.v1';

function crearVentajaBase(partial: Partial<VentajaDetalle>): VentajaDetalle {
    return {
        Id: 0,
        Nombre: 'Mock',
        Descripcion: '',
        Disipable: false,
        Coste: -1,
        Mejora: 0,
        Caracteristica: false,
        Fuerza: false,
        Destreza: false,
        Constitucion: false,
        Inteligencia: false,
        Sabiduria: false,
        Carisma: false,
        Fortaleza: false,
        Reflejos: false,
        Voluntad: false,
        Iniciativa: false,
        Duplica_oro: false,
        Aumenta_oro: false,
        Idioma_extra: false,
        Manual: { Id: 0, Nombre: '', Pagina: 0 },
        Rasgo: { Id: 0, Nombre: '', Descripcion: '' },
        Idioma: { Id: 0, Nombre: '', Descripcion: '' },
        Habilidad: { Id: 0, Nombre: '', Descripcion: '' },
        Oficial: true,
        ...partial,
    };
}

function crearClaseBase(partial?: Partial<Clase>): Clase {
    return {
        Id: 1,
        Nombre: 'Guerrero',
        Descripcion: 'Clase de combate',
        Manual: { Id: 1, Nombre: 'Manual base', Pagina: 30 },
        Tipo_dado: { Id: 1, Nombre: 'd10' },
        Puntos_habilidad: { Id: 1, Valor: 2 },
        Nivel_max_claseo: 20,
        Mod_salv_conjuros: '',
        Conjuros: {
            Dependientes_alineamiento: false,
            Divinos: false,
            Arcanos: false,
            Psionicos: false,
            Alma: false,
            Conocidos_total: false,
            Conocidos_nivel_a_nivel: false,
            Dominio: false,
            puede_elegir_especialidad: false,
            Lanzamiento_espontaneo: false,
            Clase_origen: { Id: 0, Nombre: '' },
            Listado: [],
        },
        Roles: { Dps: true, Tanque: false, Support: false, Utilidad: false },
        Aumenta_clase_lanzadora: false,
        Es_predilecta: false,
        Prestigio: false,
        Tiene_prerrequisitos: false,
        Alineamiento: {
            Id: 0,
            Basico: { Id_basico: 0, Nombre: 'No aplica' },
            Ley: { Id_ley: 0, Nombre: 'No aplica' },
            Moral: { Id_moral: 0, Nombre: 'No aplica' },
            Prioridad: { Id_prioridad: 0, Nombre: 'No aplica' },
            Descripcion: '',
        },
        Oficial: true,
        Competencias: { Armas: [], Armaduras: [], Grupos_arma: [], Grupos_armadura: [] },
        Habilidades: {
            Base: [],
            Custom: [],
        },
        Idiomas: [],
        Desglose_niveles: [
            {
                Nivel: 1,
                Ataque_base: '+1',
                Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+0' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock(),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            },
            {
                Nivel: 2,
                Ataque_base: '+2',
                Salvaciones: { Fortaleza: '+3', Reflejos: '+0', Voluntad: '+0' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock(),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            },
        ],
        Prerrequisitos_flags: {},
        Prerrequisitos: {
            subtipo: [],
            caracteristica: [],
            dg: [],
            dominio: [],
            nivel_escuela: [],
            ataque_base: [],
            reserva_psionica: [],
            lanzar_poder_psionico_nivel: [],
            conocer_poder_psionico: [],
            genero: [],
            competencia_arma: [],
            competencia_armadura: [],
            competencia_grupo_arma: [],
            competencia_grupo_armadura: [],
            dote_elegida: [],
            rangos_habilidad: [],
            idioma: [],
            alineamiento_requerido: [],
            alineamiento_prohibido: [],
            actitud_requerido: [],
            actitud_prohibido: [],
            lanzador_arcano: [],
            lanzador_divino: [],
            lanzar_conjuros_arcanos_nivel: [],
            lanzar_conjuros_divinos_nivel: [],
            conjuro_conocido: [],
            inherente: [],
            clase_especial: [],
            tamano_maximo: [],
            tamano_minimo: [],
            raza: [],
            no_raza: [],
        },
        ...partial,
    };
}

function crearConjurosDiariosMock(nivelesAccesibles: number[] = []): Record<string, number> {
    const diarios: Record<string, number> = {};
    for (let nivel = 0; nivel <= 9; nivel++) {
        diarios[`Nivel_${nivel}`] = -1;
    }
    (nivelesAccesibles ?? [])
        .map((nivel) => Number(nivel))
        .filter((nivel) => Number.isFinite(nivel) && nivel >= 0 && nivel <= 9)
        .forEach((nivel) => {
            diarios[`Nivel_${Math.trunc(nivel)}`] = 0;
        });
    return diarios;
}

describe('NuevoPersonajeService (generador)', () => {
    function setTiradasTabla(service: NuevoPersonajeService, tabla: number, valores: number[]): void {
        const estado = service.EstadoFlujo.generador;
        const fila = estado.tiradasCache[estado.indiceMinimo];
        const inicio = (tabla - 1) * 6;
        for (let i = 0; i < 6; i++) {
            fila[inicio + i] = Number(valores[i] ?? 3);
        }
    }

    function autoCuestionario(parcial?: Partial<GeneradorAutoCuestionario>): GeneradorAutoCuestionario {
        return {
            q1: 'acero_musculo',
            q2: 'primera_segunda_linea',
            q3: 'social',
            ...parcial,
        };
    }

    it('usa defaults cuando no hay configuración persistida', () => {
        const service = new NuevoPersonajeService();
        const estado = service.EstadoFlujo.generador;

        expect(estado.minimoSeleccionado).toBe(13);
        expect(estado.tablasPermitidas).toBe(3);
    });

    it('sincroniza mínimo y tablas desde settings remotos cuando son válidos', async () => {
        const userSettingsSvc = jasmine.createSpyObj<UserSettingsService>('UserSettingsService', [
            'loadGeneradorConfig',
            'loadProfileSettings',
            'saveGeneradorConfig',
            'migrateLegacyLocalConfigOnce',
        ]);
        userSettingsSvc.loadProfileSettings.and.resolveTo({
            ...createDefaultUserSettings().perfil,
        });
        userSettingsSvc.loadGeneradorConfig.and.resolveTo({
            minimoSeleccionado: 8,
            tablasPermitidas: 5,
            updatedAt: Date.now(),
        });
        userSettingsSvc.saveGeneradorConfig.and.resolveTo();
        userSettingsSvc.migrateLegacyLocalConfigOnce.and.resolveTo();

        const service = new NuevoPersonajeService(userSettingsSvc);
        await service.sincronizarConfigGeneradorDesdeCuenta();

        const estado = service.EstadoFlujo.generador;

        expect(estado.minimoSeleccionado).toBe(8);
        expect(estado.tablasPermitidas).toBe(5);
        expect(userSettingsSvc.migrateLegacyLocalConfigOnce).toHaveBeenCalledWith(GENERADOR_CONFIG_STORAGE_KEY);
    });

    it('evaluarClaseParaSeleccion considera competencias directas persistidas en el personaje', () => {
        const service = new NuevoPersonajeService();
        service.PersonajeCreacion.competencia_arma = [{ Id: 7, Nombre: 'Espada larga' }];

        const base = crearClaseBase();
        const clase = crearClaseBase({
            Prerrequisitos_flags: { competencia_arma: true },
            Prerrequisitos: {
                ...base.Prerrequisitos,
                competencia_arma: [{ Id_arma: 7, opcional: 0 }],
            },
        });

        const evaluacion = service.evaluarClaseParaSeleccion(clase);

        expect(evaluacion.estado).toBe('eligible');
    });

    it('si no hay configuración remota mantiene defaults', async () => {
        const userSettingsSvc = jasmine.createSpyObj<UserSettingsService>('UserSettingsService', [
            'loadGeneradorConfig',
            'loadProfileSettings',
            'saveGeneradorConfig',
            'migrateLegacyLocalConfigOnce',
        ]);
        userSettingsSvc.loadProfileSettings.and.resolveTo({
            ...createDefaultUserSettings().perfil,
        });
        userSettingsSvc.loadGeneradorConfig.and.resolveTo(null);
        userSettingsSvc.saveGeneradorConfig.and.resolveTo();
        userSettingsSvc.migrateLegacyLocalConfigOnce.and.resolveTo();

        const service = new NuevoPersonajeService(userSettingsSvc);
        await service.sincronizarConfigGeneradorDesdeCuenta();
        const estado = service.EstadoFlujo.generador;

        expect(estado.minimoSeleccionado).toBe(13);
        expect(estado.tablasPermitidas).toBe(3);
    });

    it('normaliza configuración remota inválida hacia límites válidos', async () => {
        const userSettingsSvc = jasmine.createSpyObj<UserSettingsService>('UserSettingsService', [
            'loadGeneradorConfig',
            'loadProfileSettings',
            'saveGeneradorConfig',
            'migrateLegacyLocalConfigOnce',
        ]);
        userSettingsSvc.loadProfileSettings.and.resolveTo({
            ...createDefaultUserSettings().perfil,
        });
        userSettingsSvc.loadGeneradorConfig.and.resolveTo({
            minimoSeleccionado: 50,
            tablasPermitidas: 0,
            updatedAt: Date.now(),
        });
        userSettingsSvc.saveGeneradorConfig.and.resolveTo();
        userSettingsSvc.migrateLegacyLocalConfigOnce.and.resolveTo();

        const service = new NuevoPersonajeService(userSettingsSvc);
        await service.sincronizarConfigGeneradorDesdeCuenta();
        const estado = service.EstadoFlujo.generador;

        expect(estado.minimoSeleccionado).toBe(13);
        expect(estado.tablasPermitidas).toBe(1);
    });

    it('seleccionar tabla activa la pool y cambiar a otra resetea asignaciones', () => {
        const service = new NuevoPersonajeService();
        service.seleccionarTablaGenerador(1);
        service.asignarDesdePoolACaracteristica('Fuerza', 0);

        const cambio = service.seleccionarTablaGenerador(2);

        expect(cambio).toBeTrue();
        expect(service.EstadoFlujo.generador.tablaSeleccionada).toBe(2);
        expect(service.EstadoFlujo.generador.asignaciones.Fuerza).toBeNull();
        expect(service.EstadoFlujo.generador.poolDisponible.length).toBe(6);
    });

    it('setMinimoGenerador persiste y resetea estado del generador', () => {
        const service = new NuevoPersonajeService();
        service.seleccionarTablaGenerador(1);
        service.asignarDesdePoolACaracteristica('Fuerza', 0);

        service.setMinimoGenerador(9);

        const estado = service.EstadoFlujo.generador;
        expect(estado.minimoSeleccionado).toBe(9);
        expect(estado.tablaSeleccionada).toBeNull();
        expect(estado.poolDisponible.length).toBe(0);
        expect(estado.asignaciones.Fuerza).toBeNull();
    });

    it('setTablasPermitidasGenerador persiste y resetea estado del generador', () => {
        const service = new NuevoPersonajeService();
        service.seleccionarTablaGenerador(1);
        service.asignarDesdePoolACaracteristica('Fuerza', 0);

        service.setTablasPermitidasGenerador(4);

        const estado = service.EstadoFlujo.generador;
        expect(estado.tablasPermitidas).toBe(4);
        expect(estado.tablaSeleccionada).toBeNull();
        expect(estado.poolDisponible.length).toBe(0);
        expect(estado.asignaciones.Fuerza).toBeNull();
    });

    it('aplica restricción temporal de campaña al generador sin perder la preferencia base', async () => {
        const userSettingsSvc = jasmine.createSpyObj<UserSettingsService>('UserSettingsService', [
            'loadGeneradorConfig',
            'loadProfileSettings',
            'saveGeneradorConfig',
            'migrateLegacyLocalConfigOnce',
        ]);
        userSettingsSvc.loadProfileSettings.and.resolveTo({
            ...createDefaultUserSettings().perfil,
        });
        userSettingsSvc.loadGeneradorConfig.and.resolveTo({
            minimoSeleccionado: 8,
            tablasPermitidas: 5,
            updatedAt: Date.now(),
        });
        userSettingsSvc.saveGeneradorConfig.and.resolveTo();
        userSettingsSvc.migrateLegacyLocalConfigOnce.and.resolveTo();

        const service = new NuevoPersonajeService(userSettingsSvc);
        await service.sincronizarConfigGeneradorDesdeCuenta();

        service.aplicarRestriccionCampanaGenerador({
            tiradaMinimaCaracteristica: 3,
            maxTablasDadosCaracteristicas: 1,
        });

        expect(service.EstadoFlujo.generador.minimoSeleccionado).toBe(3);
        expect(service.EstadoFlujo.generador.tablasPermitidas).toBe(1);

        service.aplicarRestriccionCampanaGenerador(null);

        expect(service.EstadoFlujo.generador.minimoSeleccionado).toBe(8);
        expect(service.EstadoFlujo.generador.tablasPermitidas).toBe(5);
    });

    it('usa fallback conservador 3/1 cuando la campaña no aporta política completa', () => {
        const service = new NuevoPersonajeService();

        service.aplicarRestriccionCampanaGenerador({});

        expect(service.EstadoFlujo.generador.minimoSeleccionado).toBe(3);
        expect(service.EstadoFlujo.generador.tablasPermitidas).toBe(1);
    });

    it('evaluarCuestionarioAuto aplica suelo de constitución y activa Q4 cuando hay empate cercano', () => {
        const service = new NuevoPersonajeService();
        const diagnostico = service.evaluarCuestionarioAuto(autoCuestionario({
            q1: 'acero_musculo',
            q2: 'evitar_contacto',
            q3: 'explorar',
        }));

        expect(diagnostico.score.Constitucion).toBeGreaterThan(0);
        expect(diagnostico.requierePregunta4).toBeTrue();
        expect(diagnostico.recomendacion).not.toBeNull();
    });

    it('evaluarCuestionarioAuto recomienda clases por combinaciones representativas', () => {
        const service = new NuevoPersonajeService();

        const desInt = service.evaluarCuestionarioAuto(autoCuestionario({
            q1: 'rapidez_precision',
            q2: 'evitar_contacto',
            q3: 'manitas',
        }));
        expect(desInt.recomendacion?.clases).toEqual(['Pícaro', 'Mago']);

        const intCon = service.evaluarCuestionarioAuto(autoCuestionario({
            q1: 'magia_arcana',
            q2: 'delante',
            q3: 'investigar',
        }));
        expect(intCon.recomendacion?.clases).toEqual(['Mago', 'Guerrero psíquico']);
    });

    it('evaluarCuestionarioAuto usa fallback por top1 cuando no hay combinación exacta', () => {
        const service = new NuevoPersonajeService();
        const diagnostico = service.evaluarCuestionarioAuto(autoCuestionario({
            q1: 'rapidez_precision',
            q2: 'delante',
            q3: 'explorar',
        }));

        expect(diagnostico.recomendacion?.top1).toBe('Constitucion');
        expect(diagnostico.recomendacion?.clases).toEqual(['Guerrero', 'Clérigo']);
    });

    it('evaluarCuestionarioAuto afina orden por top3 cuando top2 y top3 están muy cerca', () => {
        const service = new NuevoPersonajeService();
        const diagnostico = service.evaluarCuestionarioAuto(autoCuestionario({
            q1: 'labia_presencia',
            q2: 'atras_control_apoyo',
            q3: 'manitas',
        }));

        expect(diagnostico.recomendacion?.top1).toBe('Carisma');
        expect(diagnostico.recomendacion?.top2).toBe('Inteligencia');
        expect(diagnostico.recomendacion?.top3).toBe('Destreza');
        expect(diagnostico.recomendacion?.afinadaPorTop3).toBeTrue();
        expect(diagnostico.recomendacion?.clases).toEqual(['Bardo', 'Hechicero']);
    });

    it('autoRepartirGenerador exige Q4 cuando el score queda en zona de desempate', () => {
        const service = new NuevoPersonajeService();
        service.setTablasPermitidasGenerador(1);
        setTiradasTabla(service, 1, [18, 17, 16, 15, 14, 13]);

        const resultado = service.autoRepartirGenerador(autoCuestionario({
            q1: 'acero_musculo',
            q2: 'evitar_contacto',
            q3: 'explorar',
        }));

        expect(resultado.aplicado).toBeFalse();
    });

    it('autoRepartirGenerador elige la tabla con mayor total', () => {
        const service = new NuevoPersonajeService();
        service.setTablasPermitidasGenerador(3);
        setTiradasTabla(service, 1, [10, 10, 10, 10, 10, 10]);
        setTiradasTabla(service, 2, [15, 15, 15, 15, 15, 15]);
        setTiradasTabla(service, 3, [13, 13, 13, 13, 13, 13]);

        const resultado = service.autoRepartirGenerador(autoCuestionario({
            q1: 'fe_naturaleza_espiritu',
            q2: 'delante',
            q3: 'social',
        }));

        expect(resultado.aplicado).toBeTrue();
        expect(resultado.tablaSeleccionada).toBe(2);
    });

    it('autoRepartirGenerador desempata por mayor valor máximo y luego por menor número de tabla', () => {
        const service = new NuevoPersonajeService();
        service.setTablasPermitidasGenerador(2);
        setTiradasTabla(service, 1, [18, 12, 12, 12, 12, 12]);
        setTiradasTabla(service, 2, [17, 13, 12, 12, 12, 12]);

        let resultado = service.autoRepartirGenerador(autoCuestionario({
            q1: 'fe_naturaleza_espiritu',
            q2: 'delante',
            q3: 'social',
        }));
        expect(resultado.tablaSeleccionada).toBe(1);

        service.resetearGeneradorCaracteristicas();
        setTiradasTabla(service, 1, [16, 16, 16, 14, 14, 14]);
        setTiradasTabla(service, 2, [16, 16, 16, 14, 14, 14]);
        resultado = service.autoRepartirGenerador(autoCuestionario({
            q1: 'fe_naturaleza_espiritu',
            q2: 'delante',
            q3: 'social',
        }));
        expect(resultado.tablaSeleccionada).toBe(1);
    });

    it('autoRepartirGenerador asigna según scoring del cuestionario', () => {
        const service = new NuevoPersonajeService();
        service.setTablasPermitidasGenerador(1);
        setTiradasTabla(service, 1, [18, 17, 16, 15, 14, 13]);

        service.autoRepartirGenerador(autoCuestionario({
            q1: 'fe_naturaleza_espiritu',
            q2: 'delante',
            q3: 'social',
        }));

        const asigs = service.EstadoFlujo.generador.asignaciones;
        expect(asigs.Constitucion).toBe(18);
        expect(asigs.Sabiduria).toBe(17);
        expect(asigs.Carisma).toBe(16);
        expect(asigs.Fuerza).toBe(15);
        expect(asigs.Destreza).toBe(14);
        expect(asigs.Inteligencia).toBe(13);
    });

    it('autoRepartirGenerador ajusta prioridad por modificadores raciales', () => {
        const service = new NuevoPersonajeService();
        service.setTablasPermitidasGenerador(1);
        service.PersonajeCreacion.Raza = {
            Modificadores: {
                Fuerza: 0,
                Destreza: 4,
                Constitucion: 0,
                Inteligencia: 0,
                Sabiduria: 0,
                Carisma: 0,
            },
        } as any;
        setTiradasTabla(service, 1, [18, 17, 16, 15, 14, 13]);

        service.autoRepartirGenerador(autoCuestionario({
            q1: 'acero_musculo',
            q2: 'evitar_contacto',
            q3: 'explorar',
            q4: 'percepcion',
        }));

        const asigs = service.EstadoFlujo.generador.asignaciones;
        expect((asigs.Destreza ?? 0)).toBeGreaterThan(asigs.Fuerza ?? 0);
    });

    it('autoRepartirGenerador respeta características perdidas', () => {
        const service = new NuevoPersonajeService();
        service.setTablasPermitidasGenerador(1);
        service.PersonajeCreacion.Caracteristicas_perdidas = {
            ...service.PersonajeCreacion.Caracteristicas_perdidas,
            Constitucion: true,
        };
        service.PersonajeCreacion.Constitucion_perdida = true;
        setTiradasTabla(service, 1, [18, 17, 16, 15, 14, 13]);

        service.autoRepartirGenerador(autoCuestionario({
            q1: 'fe_naturaleza_espiritu',
            q2: 'delante',
            q3: 'social',
        }));

        const asigs = service.EstadoFlujo.generador.asignaciones;
        expect(asigs.Constitucion).toBe(0);
        expect(asigs.Sabiduria).toBe(18);
    });

    it('autoRepartirGenerador guarda progreso de Auto_reparto en personaje', () => {
        const service = new NuevoPersonajeService();
        const respuestas = autoCuestionario({
            q1: 'rapidez_precision',
            q2: 'primera_segunda_linea',
            q3: 'manitas',
        });

        service.setAutoRepartoGuardado(respuestas);
        const guardado = service.getAutoRepartoGuardado();

        expect(guardado).not.toBeNull();
        expect(guardado?.respuestas.q1).toBe('rapidez_precision');
        expect(guardado?.aplicadoAutomaticamente).toBeFalse();
        expect(guardado?.recomendacion).not.toBeNull();
    });

    it('autoRepartirGenerador deja el estado listo para finalizar', () => {
        const service = new NuevoPersonajeService();
        service.setTablasPermitidasGenerador(1);
        setTiradasTabla(service, 1, [18, 17, 16, 15, 14, 13]);

        const resultado = service.autoRepartirGenerador(autoCuestionario({
            q1: 'magia_arcana',
            q2: 'atras_control_apoyo',
            q3: 'investigar',
        }));

        expect(resultado.aplicado).toBeTrue();
        expect(service.puedeFinalizarGenerador()).toBeTrue();
        expect(service.getAutoRepartoGuardado()?.aplicadoAutomaticamente).toBeTrue();
    });
});

describe('NuevoPersonajeService (borrador local)', () => {
    const uid = 'uid-borrador-test';
    const storageKey = `fichas35.nuevoPersonaje.draft.v1.${uid}`;

    function crearTipoBase(): TipoCriatura {
        return {
            Id: 1,
            Nombre: 'Humanoide',
            Descripcion: 'Mock',
            Manual: 'Mock',
            Id_tipo_dado: 1,
            Tipo_dado: 8,
            Id_ataque: 1,
            Id_fortaleza: 1,
            Id_reflejos: 1,
            Id_voluntad: 1,
            Id_puntos_habilidad: 1,
            Come: true,
            Respira: true,
            Duerme: true,
            Recibe_criticos: true,
            Puede_ser_flanqueado: true,
            Pierde_constitucion: false,
            Limite_inteligencia: 0,
            Tesoro: 'Normal',
            Id_alineamiento: 0,
            Rasgos: [],
            Oficial: true,
        };
    }

    function crearRazaDraft(): Raza {
        const tipo = crearTipoBase();
        return {
            Id: 10,
            Nombre: 'Humano',
            Ajuste_nivel: 1,
            Manual: 'Manual base',
            Clase_predilecta: 'Guerrero',
            Modificadores: {
                Fuerza: 0,
                Destreza: 0,
                Constitucion: 0,
                Inteligencia: 0,
                Sabiduria: 0,
                Carisma: 0,
            },
            Alineamiento: {
                Id: 1,
                Basico: { Id_basico: 1, Nombre: 'Legal bueno' },
                Ley: { Id_ley: 1, Nombre: 'Siempre legal' },
                Moral: { Id_moral: 1, Nombre: 'Siempre bueno' },
                Prioridad: { Id_prioridad: 1, Nombre: 'Moral' },
                Descripcion: '',
            },
            Oficial: true,
            Ataques_naturales: '',
            Tamano: { Id: 1, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
            Dgs_adicionales: {
                Cantidad: 0,
                Dado: 'd8',
                Tipo_criatura: 'Humanoide',
                Ataque_base: 0,
                Dotes_extra: 0,
                Puntos_habilidad: 0,
                Multiplicador_puntos_habilidad: 1,
                Fortaleza: 0,
                Reflejos: 0,
                Voluntad: 0,
            },
            Reduccion_dano: '',
            Resistencia_magica: '',
            Resistencia_energia: '',
            Heredada: false,
            Mutada: false,
            Tamano_mutacion_dependiente: false,
            Prerrequisitos: {
                actitud_prohibido: [],
                actitud_requerido: [],
                alineamiento_prohibido: [],
                alineamiento_requerido: [],
                tipo_criatura: [],
            },
            Armadura_natural: 0,
            Varios_armadura: 0,
            Correr: 30,
            Nadar: 0,
            Volar: 0,
            Maniobrabilidad: {
                Id: 0,
                Nombre: '-',
                Velocidad_avance: '',
                Flotar: 0,
                Volar_atras: 0,
                Contramarcha: 0,
                Giro: '',
                Rotacion: '',
                Giro_max: '',
                Angulo_ascenso: '',
                Velocidad_ascenso: '',
                Angulo_descenso: '',
                Descenso_ascenso: 0,
            },
            Trepar: 0,
            Escalar: 0,
            Altura_rango_inf: 1.5,
            Altura_rango_sup: 1.9,
            Peso_rango_inf: 55,
            Peso_rango_sup: 85,
            Edad_adulto: 20,
            Edad_mediana: 40,
            Edad_viejo: 60,
            Edad_venerable: 80,
            Espacio: 5,
            Alcance: 5,
            Tipo_criatura: tipo,
            Subtipos: [],
            Sortilegas: [],
            Raciales: [createRacialPlaceholder('Sentidos agudos')],
            Habilidades: { Base: [], Custom: [] },
            DotesContextuales: [],
        };
    }

    beforeEach(() => {
        localStorage.removeItem(storageKey);
    });

    afterEach(() => {
        localStorage.removeItem(storageKey);
    });

    it('serializa y rehidrata un borrador valido', () => {
        const service = new NuevoPersonajeService();
        const raza = crearRazaDraft();
        service.seleccionarRaza(raza);
        service.PersonajeCreacion.Nombre = 'Aldric';
        service.actualizarPasoActual('basicos');
        service.activarPersistenciaBorradorLocal(uid);
        service.persistirBorradorLocalAhora();

        const restaurado = new NuevoPersonajeService();
        expect(restaurado.restaurarBorradorLocal(uid)).toBeTrue();
        expect(restaurado.PersonajeCreacion.Nombre).toBe('Aldric');
        expect(restaurado.RazaSeleccionada?.Nombre).toBe('Humano');
        expect(restaurado.EstadoFlujo.pasoActual).toBe('basicos');
    });

    it('ignora borradores corruptos o de otro uid', () => {
        localStorage.setItem(storageKey, '{mal json');
        const service = new NuevoPersonajeService();
        expect(service.restaurarBorradorLocal(uid)).toBeFalse();

        localStorage.setItem(storageKey, JSON.stringify({
            version: 1,
            uid: 'otro-uid',
            updatedAt: Date.now(),
            personaje: { Nombre: 'Intruso' },
            estadoFlujoPersistible: { pasoActual: 'basicos' },
        }));
        expect(service.restaurarBorradorLocal(uid)).toBeFalse();
    });

    it('descarta y elimina borradores caducados de mas de 24 horas', () => {
        localStorage.setItem(storageKey, JSON.stringify({
            version: 1,
            uid,
            updatedAt: Date.now() - (24 * 60 * 60 * 1000) - 1,
            personaje: { Nombre: 'Aldric' },
            estadoFlujoPersistible: { pasoActual: 'basicos' },
        }));

        const service = new NuevoPersonajeService();

        expect(service.puedeOfrecerRestauracionBorrador(uid)).toBeFalse();
        expect(service.restaurarBorradorLocal(uid)).toBeFalse();
        expect(localStorage.getItem(storageKey)).toBeNull();
    });

    it('limpia el borrador cuando se reinicia y se persiste de nuevo', () => {
        const service = new NuevoPersonajeService();
        service.seleccionarRaza(crearRazaDraft());
        service.PersonajeCreacion.Nombre = 'Aldric';
        service.activarPersistenciaBorradorLocal(uid);
        service.persistirBorradorLocalAhora();
        expect(localStorage.getItem(storageKey)).not.toBeNull();

        service.reiniciar();
        service.persistirBorradorLocalAhora();
        expect(localStorage.getItem(storageKey)).toBeNull();
    });

    it('degrada a un paso valido si el borrador restaurado ya no es compatible', () => {
        const base = new NuevoPersonajeService();
        base.seleccionarRaza(crearRazaDraft());
        base.PersonajeCreacion.Nombre = 'Aldric';
        base.activarPersistenciaBorradorLocal(uid);
        base.persistirBorradorLocalAhora();
        base.desactivarPersistenciaBorradorLocal();

        const raw = localStorage.getItem(storageKey) as string;
        const borrador = JSON.parse(raw);
        borrador.estadoFlujoPersistible.pasoActual = 'clases';
        borrador.estadoFlujoPersistible.caracteristicasGeneradas = false;
        localStorage.setItem(storageKey, JSON.stringify(borrador));

        const service = new NuevoPersonajeService();
        expect(service.restaurarBorradorLocal(uid)).toBeTrue();
        expect(service.EstadoFlujo.pasoActual).toBe('basicos');
    });

    it('restaura el paso avanzado cuando el borrador sí tenía características generadas', () => {
        const base = new NuevoPersonajeService();
        base.seleccionarRaza(crearRazaDraft());
        base.PersonajeCreacion.Nombre = 'Aldric';
        base.activarPersistenciaBorradorLocal(uid);
        base.persistirBorradorLocalAhora();
        base.desactivarPersistenciaBorradorLocal();

        const raw = localStorage.getItem(storageKey) as string;
        const borrador = JSON.parse(raw);
        borrador.estadoFlujoPersistible.pasoActual = 'clases';
        borrador.estadoFlujoPersistible.caracteristicasGeneradas = true;
        localStorage.setItem(storageKey, JSON.stringify(borrador));

        const service = new NuevoPersonajeService();
        expect(service.restaurarBorradorLocal(uid)).toBeTrue();
        expect(service.EstadoFlujo.pasoActual).toBe('clases');
        expect(service.EstadoFlujo.caracteristicasGeneradas).toBeTrue();
    });

    it('expone un resumen del borrador local con id de personaje persistido', () => {
        const base = new NuevoPersonajeService();
        base.seleccionarRaza(crearRazaDraft());
        base.PersonajeCreacion.Id = 123;
        base.PersonajeCreacion.Nombre = 'Aldric';
        base.actualizarPasoActual('conjuros');
        base.activarPersistenciaBorradorLocal(uid);
        base.persistirBorradorLocalAhora();
        base.desactivarPersistenciaBorradorLocal();

        const raw = localStorage.getItem(storageKey) as string;
        const borrador = JSON.parse(raw);
        borrador.estadoFlujoPersistible.caracteristicasGeneradas = true;
        localStorage.setItem(storageKey, JSON.stringify(borrador));

        const service = new NuevoPersonajeService();
        expect(service.getResumenBorradorLocal(uid)).toEqual(jasmine.objectContaining({
            personajeId: 123,
            nombre: 'Aldric',
            pasoActual: 'conjuros',
            caracteristicasGeneradas: true,
        }));
    });
});

describe('NuevoPersonajeService (ventajas/desventajas)', () => {
    let service: NuevoPersonajeService;
    let ventajaFuerza: VentajaDetalle;
    let ventajaSalvacion: VentajaDetalle;
    let ventajaHabilidad: VentajaDetalle;
    let ventajaIdioma: VentajaDetalle;
    let ventajaRasgo: VentajaDetalle;
    let ventajaOro: VentajaDetalle;
    let desventajaPuntos: VentajaDetalle;
    let habilidadAvistar: HabilidadBasicaDetalle;
    let idiomaComun: IdiomaDetalle;

    beforeEach(() => {
        service = new NuevoPersonajeService();

        habilidadAvistar = {
            Id_habilidad: 1,
            Nombre: 'Avistar',
            Id_caracteristica: 5,
            Caracteristica: 'Sabiduria',
            Descripcion: '',
            Soporta_extra: false,
            Entrenada: false,
            Extras: [],
        };
        service.setCatalogoHabilidades([habilidadAvistar]);

        idiomaComun = {
            Id: 1,
            Nombre: 'Comun',
            Descripcion: 'Idioma comun',
            Secreto: false,
            Oficial: true,
        };
        service.setCatalogoIdiomas([idiomaComun]);

        ventajaFuerza = crearVentajaBase({
            Id: 101,
            Nombre: 'Fuerza brutal',
            Coste: -2,
            Mejora: 2,
            Fuerza: true,
        });
        ventajaSalvacion = crearVentajaBase({
            Id: 102,
            Nombre: 'Voluntad firme',
            Coste: -1,
            Mejora: 1,
            Voluntad: true,
            Iniciativa: true,
        });
        ventajaHabilidad = crearVentajaBase({
            Id: 103,
            Nombre: 'Ojo agudo',
            Coste: -1,
            Mejora: 2,
            Habilidad: { Id: 1, Nombre: 'Avistar', Descripcion: '' },
        });
        ventajaIdioma = crearVentajaBase({
            Id: 104,
            Nombre: 'Linguista',
            Coste: -1,
            Mejora: 0,
            Idioma_extra: true,
        });
        ventajaRasgo = crearVentajaBase({
            Id: 105,
            Nombre: 'Rasgo raro',
            Coste: -1,
            Mejora: 0,
            Rasgo: { Id: 7, Nombre: 'Sangre antigua', Descripcion: '' },
        });
        ventajaOro = crearVentajaBase({
            Id: 106,
            Nombre: 'Avaro',
            Coste: -1,
            Mejora: 0,
            Duplica_oro: true,
            Aumenta_oro: true,
        });
        desventajaPuntos = crearVentajaBase({
            Id: 201,
            Nombre: 'Miope',
            Coste: 2,
            Mejora: 0,
        });

        service.setCatalogosVentajas(
            [ventajaFuerza, ventajaSalvacion, ventajaHabilidad, ventajaIdioma, ventajaRasgo, ventajaOro],
            [desventajaPuntos]
        );
    });

    it('selección de desventaja aumenta puntos disponibles', () => {
        service.toggleDesventaja(desventajaPuntos.Id);
        expect(service.EstadoFlujo.ventajas.puntosDisponibles).toBe(2);
    });

    it('selección de ventaja consume puntos y respeta límite de 3', () => {
        service.toggleDesventaja(desventajaPuntos.Id);
        service.toggleVentaja(ventajaFuerza.Id);
        service.toggleVentaja(ventajaSalvacion.Id);
        service.toggleVentaja(ventajaHabilidad.Id);
        const cuarto = service.toggleVentaja(ventajaRasgo.Id);

        expect(service.EstadoFlujo.ventajas.seleccionVentajas.length).toBe(3);
        expect(service.EstadoFlujo.ventajas.puntosGastados).toBe(4);
        expect(cuarto.toggled).toBeFalse();
        expect(cuarto.reason).toBe('max_reached');
    });

    it('déficit permite edición pero bloquea continuar', () => {
        service.toggleVentaja(ventajaFuerza.Id);
        expect(service.EstadoFlujo.ventajas.hayDeficit).toBeTrue();
        expect(service.puedeContinuarDesdeVentajas()).toBeFalse();
    });

    it('seleccionar y deseleccionar revierte características con origen', () => {
        const base = service.PersonajeCreacion.Fuerza;
        service.toggleDesventaja(desventajaPuntos.Id);
        service.toggleVentaja(ventajaFuerza.Id);
        expect(service.PersonajeCreacion.Fuerza).toBe(base + 2);
        expect(service.PersonajeCreacion.CaracteristicasVarios.Fuerza.length).toBe(1);

        service.toggleVentaja(ventajaFuerza.Id);
        expect(service.PersonajeCreacion.Fuerza).toBe(base);
        expect(service.PersonajeCreacion.CaracteristicasVarios.Fuerza.length).toBe(0);
    });

    it('seleccionar y deseleccionar revierte salvaciones, iniciativa y habilidades', () => {
        service.toggleDesventaja(desventajaPuntos.Id);
        service.toggleVentaja(ventajaSalvacion.Id);
        service.toggleVentaja(ventajaHabilidad.Id);
        expect(service.PersonajeCreacion.Salvaciones.voluntad.modsVarios.length).toBe(1);
        expect(service.PersonajeCreacion.Iniciativa_varios.length).toBe(1);
        expect(service.PersonajeCreacion.Habilidades.find(h => h.Id === 1)?.Rangos_varios).toBe(2);

        service.toggleVentaja(ventajaSalvacion.Id);
        service.toggleVentaja(ventajaHabilidad.Id);
        expect(service.PersonajeCreacion.Salvaciones.voluntad.modsVarios.length).toBe(0);
        expect(service.PersonajeCreacion.Iniciativa_varios.length).toBe(0);
        expect(service.PersonajeCreacion.Habilidades.find(h => h.Id === 1)?.Rangos_varios).toBe(0);
    });

    it('Rasgo se añade deduplicado', () => {
        service.toggleDesventaja(desventajaPuntos.Id);
        service.toggleVentaja(ventajaRasgo.Id);
        service.toggleVentaja(ventajaRasgo.Id);
        service.toggleVentaja(ventajaRasgo.Id);
        expect(service.PersonajeCreacion.Raciales.filter(r => r.Nombre === 'Sangre antigua').length).toBe(1);
    });

    it('seleccionarRaza precarga raciales desde la raza', () => {
        const svc = new NuevoPersonajeService();
        const racialBase = createRacialPlaceholder('Sangre antigua', 5);
        const sortilegaBase = {
            Conjuro: { Id: 9, Nombre: 'Detectar pensamientos' },
            Nivel_lanzador: 8,
            Usos_diarios: 'A voluntad',
            Descripcion: 'Innata',
            Dgs_necesarios: 0,
            Origen: '',
        };
        const razaMock = {
            Id: 1,
            Nombre: 'Elfo',
            Alineamiento: {
                Basico: { Nombre: 'Neutral autentico' },
            },
            Tipo_criatura: { Id: 1, Nombre: 'Humanoide' },
            Correr: 30,
            Nadar: 0,
            Volar: 0,
            Trepar: 0,
            Escalar: 0,
            Edad_adulto: 20,
            Altura_rango_inf: 1.7,
            Peso_rango_inf: 65,
            Heredada: false,
            Raciales: [racialBase],
            Sortilegas: [sortilegaBase],
        } as unknown as Raza;

        svc.seleccionarRaza(razaMock);

        expect(svc.PersonajeCreacion.Raciales.length).toBe(1);
        expect(svc.PersonajeCreacion.Raciales[0].Id).toBe(5);
        expect(svc.PersonajeCreacion.Raciales[0].Nombre).toBe('Sangre antigua');
        expect(svc.PersonajeCreacion.Raciales[0].Origen).toBe('Elfo');
        expect(svc.PersonajeCreacion.Sortilegas.length).toBe(1);
        expect(svc.PersonajeCreacion.Sortilegas[0].Conjuro.Nombre).toBe('Detectar pensamientos');
        expect(svc.PersonajeCreacion.Sortilegas[0].Origen).toBe('Elfo');
    });

    it('seleccionarRaza reemplaza sortilegas previas cuando la nueva raza no aporta', () => {
        const svc = new NuevoPersonajeService();
        svc.PersonajeCreacion.Sortilegas = [{
            Conjuro: { Id: 5, Nombre: 'Imagen silenciosa' } as any,
            Nivel_lanzador: 3,
            Usos_diarios: '1/dia',
            Descripcion: '',
            Dgs_necesarios: 0,
            Origen: 'Raza vieja',
        }];

        const razaSinSortilegas = {
            Id: 1,
            Nombre: 'Humano',
            Alineamiento: { Basico: { Nombre: 'Neutral autentico' } },
            Tipo_criatura: { Id: 1, Nombre: 'Humanoide' },
            Correr: 30,
            Nadar: 0,
            Volar: 0,
            Trepar: 0,
            Escalar: 0,
            Edad_adulto: 20,
            Altura_rango_inf: 1.7,
            Peso_rango_inf: 65,
            Heredada: false,
            Raciales: [],
            Sortilegas: [],
        } as unknown as Raza;

        svc.seleccionarRaza(razaSinSortilegas);

        expect(svc.PersonajeCreacion.Sortilegas.length).toBe(0);
    });

    it('seleccionarRaza aplica habilidades otorgadas como Rangos_varios y las marca claseas', () => {
        const svc = new NuevoPersonajeService();
        svc.setCatalogoHabilidades([{
            Id_habilidad: 1,
            Nombre: 'Avistar',
            Id_caracteristica: 5,
            Caracteristica: 'Sabiduria',
            Descripcion: '',
            Soporta_extra: false,
            Entrenada: false,
            Extras: [],
        }]);
        const razaConHabilidades = {
            Id: 1,
            Nombre: 'Elfo',
            Alineamiento: { Basico: { Nombre: 'Neutral autentico' } },
            Tipo_criatura: { Id: 1, Nombre: 'Humanoide' },
            Correr: 30,
            Nadar: 0,
            Volar: 0,
            Trepar: 0,
            Escalar: 0,
            Edad_adulto: 20,
            Altura_rango_inf: 1.7,
            Peso_rango_inf: 65,
            Heredada: false,
            Raciales: [],
            Sortilegas: [],
            Habilidades: {
                Base: [{ Id_habilidad: 1, Habilidad: 'Avistar', Cantidad: 2, Varios: '+2 racial' }],
                Custom: [],
            },
        } as unknown as Raza;

        svc.seleccionarRaza(razaConHabilidades);

        const avistar = svc.PersonajeCreacion.Habilidades.find((h) => h.Id === 1);
        expect(avistar?.Clasea).toBeTrue();
        expect(avistar?.Rangos_varios).toBe(2);
        expect(`${avistar?.Varios ?? ''}`).toContain('Elfo');
    });

    it('seleccionarRaza suma duplicados de habilidades y custom prevalece en flag', () => {
        const svc = new NuevoPersonajeService();
        svc.setCatalogoHabilidades([]);
        const razaConDuplicadas = {
            Id: 1,
            Nombre: 'Elfo',
            Alineamiento: { Basico: { Nombre: 'Neutral autentico' } },
            Tipo_criatura: { Id: 1, Nombre: 'Humanoide' },
            Correr: 30,
            Nadar: 0,
            Volar: 0,
            Trepar: 0,
            Escalar: 0,
            Edad_adulto: 20,
            Altura_rango_inf: 1.7,
            Peso_rango_inf: 65,
            Heredada: false,
            Raciales: [],
            Sortilegas: [],
            Habilidades: {
                Base: [{ Id_habilidad: 90, Habilidad: 'Navegar astral', Cantidad: 1, Varios: '' }],
                Custom: [{ Id_habilidad: 90, Habilidad: 'Navegar astral', Cantidad: 2 }],
            },
        } as unknown as Raza;

        svc.seleccionarRaza(razaConDuplicadas);

        const habilidad = svc.PersonajeCreacion.Habilidades.find((h) => h.Id === 90);
        expect(svc.PersonajeCreacion.Habilidades.filter((h) => h.Id === 90).length).toBe(1);
        expect(habilidad?.Clasea).toBeTrue();
        expect(habilidad?.Custom).toBeTrue();
        expect(habilidad?.Rangos_varios).toBe(3);
    });

    it('Rasgo no duplica una racial ya presente en la base', () => {
        const svc = new NuevoPersonajeService();
        const baseRacial = createRacialPlaceholder('Sangre antigua', 7);
        svc.PersonajeCreacion.Raciales = [baseRacial];
        svc.setCatalogoHabilidades([habilidadAvistar]);
        svc.setCatalogosVentajas([ventajaRasgo], []);

        svc.toggleVentaja(ventajaRasgo.Id);

        expect(svc.PersonajeCreacion.Raciales.filter(r => r.Nombre === 'Sangre antigua').length).toBe(1);
    });

    it('Idioma_extra requiere idioma elegido para continuar', () => {
        service.toggleDesventaja(desventajaPuntos.Id);
        const result = service.toggleVentaja(ventajaIdioma.Id);
        expect(result.requiresIdiomaSelection).toBeTrue();
        expect(service.puedeContinuarDesdeVentajas()).toBeFalse();

        const assigned = service.seleccionarIdiomaParaVentaja(ventajaIdioma.Id, idiomaComun);
        expect(assigned).toBeTrue();
        expect(service.puedeContinuarDesdeVentajas()).toBeTrue();
    });

    it('guarda origen en rasgos obtenidos, idiomas y lista de ventajas', () => {
        service.toggleDesventaja(desventajaPuntos.Id);
        service.toggleVentaja(ventajaRasgo.Id);
        service.toggleVentaja(ventajaIdioma.Id);
        service.seleccionarIdiomaParaVentaja(ventajaIdioma.Id, idiomaComun);

        const rasgo = service.PersonajeCreacion.Raciales.find((r) => r.Nombre === 'Sangre antigua');
        const idioma = service.PersonajeCreacion.Idiomas.find((i) => i.Nombre === 'Comun');
        const ventajaIdiomaGuardada = service.PersonajeCreacion.Ventajas
            .find((v) => typeof v !== 'string' && v.Nombre === 'Linguista');
        const desventajaGuardada = service.PersonajeCreacion.Ventajas
            .find((v) => typeof v !== 'string' && v.Nombre === 'Miope');

        expect(rasgo?.Origen).toBe('Rasgo raro');
        expect(idioma?.Origen).toBe('Linguista');
        expect(idioma?.Descripcion).toBe('Idioma comun');
        expect(typeof ventajaIdiomaGuardada !== 'string' ? ventajaIdiomaGuardada?.Origen : '').toBe('Ventaja');
        expect(typeof desventajaGuardada !== 'string' ? desventajaGuardada?.Origen : '').toBe('Desventaja');
    });

    it('pendientesOro se acumula y no altera Oro_inicial', () => {
        const oroBase = service.PersonajeCreacion.Oro_inicial;
        service.toggleDesventaja(desventajaPuntos.Id);
        service.toggleVentaja(ventajaOro.Id);

        expect(service.EstadoFlujo.ventajas.pendientesOro.length).toBe(2);
        expect(service.PersonajeCreacion.Oro_inicial).toBe(oroBase);
    });
});

describe('NuevoPersonajeService (clases)', () => {
    let service: NuevoPersonajeService;
    let claseBase: Clase;

    function crearTipoBase(): TipoCriatura {
        return {
            Id: 1,
            Nombre: 'Humanoide',
            Descripcion: 'Tipo base',
            Manual: 'Manual',
            Id_tipo_dado: 1,
            Tipo_dado: 8,
            Id_ataque: 1,
            Id_fortaleza: 1,
            Id_reflejos: 1,
            Id_voluntad: 1,
            Id_puntos_habilidad: 1,
            Come: true,
            Respira: true,
            Duerme: true,
            Recibe_criticos: true,
            Puede_ser_flanqueado: true,
            Pierde_constitucion: false,
            Limite_inteligencia: 0,
            Tesoro: 'Normal',
            Id_alineamiento: 0,
            Rasgos: [],
            Oficial: true,
        };
    }

    function crearRazaBase(tipo: TipoCriatura): Raza {
        return {
            Id: 10,
            Nombre: 'Humano',
            Ajuste_nivel: 1,
            Manual: 'Manual base',
            Clase_predilecta: 'Guerrero',
            Modificadores: {
                Fuerza: 0,
                Destreza: 0,
                Constitucion: 0,
                Inteligencia: 0,
                Sabiduria: 0,
                Carisma: 0,
            },
            Alineamiento: {
                Id: 1,
                Basico: { Id_basico: 1, Nombre: 'Legal bueno' },
                Ley: { Id_ley: 1, Nombre: 'Siempre legal' },
                Moral: { Id_moral: 1, Nombre: 'Siempre bueno' },
                Prioridad: { Id_prioridad: 1, Nombre: 'Moral' },
                Descripcion: '',
            },
            Oficial: true,
            Ataques_naturales: '',
            Tamano: { Id: 1, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 },
            Dgs_adicionales: {
                Cantidad: 1,
                Dado: 'd8',
                Tipo_criatura: 'Humanoide',
                Ataque_base: 0,
                Dotes_extra: 0,
                Puntos_habilidad: 0,
                Multiplicador_puntos_habilidad: 1,
                Fortaleza: 0,
                Reflejos: 0,
                Voluntad: 0,
            },
            Reduccion_dano: '',
            Resistencia_magica: '',
            Resistencia_energia: '',
            Heredada: false,
            Mutada: false,
            Tamano_mutacion_dependiente: false,
            Prerrequisitos: {
                actitud_prohibido: [],
                actitud_requerido: [],
                alineamiento_prohibido: [],
                alineamiento_requerido: [],
                tipo_criatura: [],
            },
            Armadura_natural: 0,
            Varios_armadura: 0,
            Correr: 30,
            Nadar: 0,
            Volar: 0,
            Maniobrabilidad: {
                Id: 0,
                Nombre: '-',
                Velocidad_avance: '',
                Flotar: 0,
                Volar_atras: 0,
                Contramarcha: 0,
                Giro: '',
                Rotacion: '',
                Giro_max: '',
                Angulo_ascenso: '',
                Velocidad_ascenso: '',
                Angulo_descenso: '',
                Descenso_ascenso: 0,
            },
            Trepar: 0,
            Escalar: 0,
            Altura_rango_inf: 1.6,
            Altura_rango_sup: 1.9,
            Peso_rango_inf: 55,
            Peso_rango_sup: 95,
            Edad_adulto: 18,
            Edad_mediana: 40,
            Edad_viejo: 60,
            Edad_venerable: 80,
            Espacio: 5,
            Alcance: 5,
            Tipo_criatura: tipo,
            Subtipos: [],
            Sortilegas: [],
            Raciales: [],
            Habilidades: { Base: [], Custom: [] },
            DotesContextuales: [],
        } as unknown as Raza;
    }

    beforeEach(() => {
        service = new NuevoPersonajeService();
        const tipo = crearTipoBase();
        service.setCatalogoTiposCriatura([tipo]);
        service.seleccionarRaza(crearRazaBase(tipo));
        service.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });
        claseBase = crearClaseBase();
        service.setCatalogoClases([claseBase]);
        service.setCatalogoDominios([
            { Id: 1, Nombre: 'Bien', Oficial: true } as DominioDetalle,
            { Id: 2, Nombre: 'Guerra', Oficial: true } as DominioDetalle,
        ]);
        service.setCatalogoDeidades([
            {
                Id: 1,
                Nombre: 'Heironeous',
                Descripcion: '',
                Manual: { Id: 1, Nombre: 'Manual', Pagina: 1 },
                Alineamiento: { Id: 1, Id_basico: 1, Nombre: 'Legal bueno' },
                Arma: { Id: 1, Nombre: 'Espada larga' },
                Pabellon: { Id: 1, Nombre: 'Guerra' },
                Genero: { Id: 1, Nombre: 'Masculino' },
                Ambitos: [{ Id: 1, Nombre: 'Guerra' }],
                Dominios: [{ Id: 2, Nombre: 'Guerra', Oficial: true }],
                Oficial: true,
            } as DeidadDetalle,
        ]);
        service.PersonajeCreacion.Deidad = 'Heironeous';
    });

    it('aplicarSiguienteNivelClase crea entrada de clase a nivel 1', () => {
        const res = service.aplicarSiguienteNivelClase(claseBase);
        expect(res.aplicado).toBeTrue();
        expect(service.PersonajeCreacion.desgloseClases).toEqual([{ Nombre: 'Guerrero', Nivel: 1 }]);
        expect(service.PersonajeCreacion.Clases).toContain('Guerrero (1)');
    });

    it('repetir clase incrementa al nivel 2', () => {
        service.aplicarSiguienteNivelClase(claseBase);
        const res = service.aplicarSiguienteNivelClase(claseBase);
        expect(res.aplicado).toBeTrue();
        expect(service.PersonajeCreacion.desgloseClases[0].Nivel).toBe(2);
        expect(service.PersonajeCreacion.Clases).toContain('Guerrero (2)');
    });

    it('seleccionarRaza aplica idiomas automáticos de raza sin duplicados', () => {
        const tipo = crearTipoBase();
        const razaConIdiomas = crearRazaBase(tipo);
        (razaConIdiomas as any).Idiomas = [
            { Id: 1, Nombre: 'Común', Descripcion: 'Base', Secreto: false, Oficial: true },
            { Id: 2, Nombre: 'Común', Descripcion: 'Duplicado', Secreto: false, Oficial: true },
            { Id: 3, Nombre: 'Dracónico', Descripcion: 'Arcano', Secreto: false, Oficial: true },
        ];

        service.seleccionarRaza(razaConIdiomas);

        expect(service.PersonajeCreacion.Idiomas.length).toBe(2);
        expect(service.PersonajeCreacion.Idiomas.some((i) => i.Nombre === 'Común')).toBeTrue();
        expect(service.PersonajeCreacion.Idiomas.some((i) => i.Nombre === 'Dracónico')).toBeTrue();
        expect(service.PersonajeCreacion.Idiomas.find((i) => i.Nombre === 'Común')?.Origen).toBe('Humano');
    });

    it('bloquea aplicación al alcanzar Nivel_max_claseo', () => {
        const claseLimitada = crearClaseBase({ Id: 22, Nombre: 'Monje', Nivel_max_claseo: 1 });
        service.setCatalogoClases([claseLimitada]);
        expect(service.aplicarSiguienteNivelClase(claseLimitada).aplicado).toBeTrue();

        const segunda = service.aplicarSiguienteNivelClase(claseLimitada);
        expect(segunda.aplicado).toBeFalse();
        expect(segunda.evaluacion?.estado).toBe('blocked_failed');
    });

    it('aplica delta de ataque base y salvaciones por nivel', () => {
        service.aplicarSiguienteNivelClase(claseBase);
        expect(service.PersonajeCreacion.Ataque_base).toBe('1');
        expect(service.PersonajeCreacion.Salvaciones.fortaleza.modsClaseos[0].valor).toBe(2);

        service.aplicarSiguienteNivelClase(claseBase);
        expect(service.PersonajeCreacion.Ataque_base).toBe('2');
        expect(service.PersonajeCreacion.Salvaciones.fortaleza.modsClaseos[1].valor).toBe(1);
    });

    it('agrega salvaciones de raza desde DG y raciales', () => {
        const tipo = crearTipoBase();
        const razaConSalvaciones = crearRazaBase(tipo);
        razaConSalvaciones.Dgs_adicionales.Fortaleza = 1;
        razaConSalvaciones.Dgs_adicionales.Reflejos = 2;
        razaConSalvaciones.Dgs_adicionales.Voluntad = -1;
        razaConSalvaciones.Raciales = [
            {
                Id: 501,
                Nombre: 'Sangre antigua',
                Descripcion: '',
                Origen: '',
                Opcional: 0,
                Dotes: [],
                Habilidades: { Base: [], Custom: [] },
                Caracteristicas: [],
                Salvaciones: [
                    { Salvacion: 'Fortaleza', Valor: 2 },
                    { salvacion: 'Reflejos', cantidad: 1 },
                    { Nombre: 'Voluntad', modificador: '-2' },
                ],
                Sortilegas: [],
                Ataques: [],
                Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
                Prerrequisitos: { raza: [], caracteristica: [] },
            } as any,
        ];

        service.seleccionarRaza(razaConSalvaciones);
        service.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        const fortTotal = service.PersonajeCreacion.Salvaciones.fortaleza.modsVarios.reduce((acc, item) => acc + item.valor, 0);
        const refTotal = service.PersonajeCreacion.Salvaciones.reflejos.modsVarios.reduce((acc, item) => acc + item.valor, 0);
        const volTotal = service.PersonajeCreacion.Salvaciones.voluntad.modsVarios.reduce((acc, item) => acc + item.valor, 0);
        expect(fortTotal).toBe(3);
        expect(refTotal).toBe(3);
        expect(volTotal).toBe(-3);
        expect(service.PersonajeCreacion.Salvaciones.fortaleza.modsVarios.some((item) => item.origen === 'Humano DG racial')).toBeTrue();
        expect(service.PersonajeCreacion.Salvaciones.fortaleza.modsVarios.some((item) => item.origen === 'Humano - Sangre antigua')).toBeTrue();
    });

    it('ignora entradas raciales de salvaciones malformadas o no numéricas', () => {
        const tipo = crearTipoBase();
        const razaConSalvacionesInvalidas = crearRazaBase(tipo);
        razaConSalvacionesInvalidas.Dgs_adicionales.Fortaleza = 0;
        razaConSalvacionesInvalidas.Dgs_adicionales.Reflejos = 0;
        razaConSalvacionesInvalidas.Dgs_adicionales.Voluntad = 0;
        razaConSalvacionesInvalidas.Raciales = [
            {
                Id: 601,
                Nombre: 'Herencia extraña',
                Descripcion: '',
                Origen: '',
                Opcional: 0,
                Dotes: [],
                Habilidades: { Base: [], Custom: [] },
                Caracteristicas: [],
                Salvaciones: [
                    { Salvacion: 'Fortaleza', Valor: 'abc' },
                    { Salvacion: 'Desconocida', Valor: 2 },
                    { Nombre: 'Voluntad', Valor: '+2' },
                ],
                Sortilegas: [],
                Ataques: [],
                Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
                Prerrequisitos: { raza: [], caracteristica: [] },
            } as any,
        ];

        service.seleccionarRaza(razaConSalvacionesInvalidas);
        service.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        expect(service.PersonajeCreacion.Salvaciones.fortaleza.modsVarios.length).toBe(0);
        expect(service.PersonajeCreacion.Salvaciones.reflejos.modsVarios.length).toBe(0);
        expect(service.PersonajeCreacion.Salvaciones.voluntad.modsVarios.length).toBe(1);
        expect(service.PersonajeCreacion.Salvaciones.voluntad.modsVarios[0].valor).toBe(2);
    });

    it('recalcula NEP, experiencia y oro tras aplicar clase', () => {
        service.aplicarSiguienteNivelClase(claseBase);
        expect(service.PersonajeCreacion.NEP).toBe(3);
        expect(service.PersonajeCreacion.Experiencia).toBe(1000);
        expect(service.PersonajeCreacion.Oro_inicial).toBe(2700);
    });

    it('recalcula capacidad de carga base con fuerza 14 en tamaño mediano', () => {
        expect(service.PersonajeCreacion.Capacidad_carga).toEqual({
            Ligera: 19,
            Media: 38,
            Pesada: 58,
        });
    });

    it('recalcula presa al cambiar ataque base por subida de clase', () => {
        expect(service.PersonajeCreacion.Presa).toBe(2);

        service.aplicarSiguienteNivelClase(claseBase);

        expect(service.PersonajeCreacion.Ataque_base).toBe('1');
        expect(service.PersonajeCreacion.Presa).toBe(3);
    });

    it('recalcula CA al cambiar ModDestreza por aumentos de característica', () => {
        expect(service.PersonajeCreacion.Ca).toBe(11);

        (service as any).aumentosPendientesCaracteristica = [
            { id: 901, valor: 2, origen: 'Test', descripcion: 'Destreza +2' },
        ];
        const aplicado = service.aplicarAumentosCaracteristica([
            { idPendiente: 901, caracteristica: 'Destreza' },
        ]);

        expect(aplicado).toBeTrue();
        expect(service.PersonajeCreacion.Destreza).toBe(14);
        expect(service.PersonajeCreacion.ModDestreza).toBe(2);
        expect(service.PersonajeCreacion.Ca).toBe(12);
    });

    it('recalcula carga y presa al cambiar ModFuerza por aumentos de característica', () => {
        expect(service.PersonajeCreacion.Presa).toBe(2);

        (service as any).aumentosPendientesCaracteristica = [
            { id: 902, valor: 2, origen: 'Test', descripcion: 'Fuerza +2' },
        ];
        const aplicado = service.aplicarAumentosCaracteristica([
            { idPendiente: 902, caracteristica: 'Fuerza' },
        ]);

        expect(aplicado).toBeTrue();
        expect(service.PersonajeCreacion.Fuerza).toBe(16);
        expect(service.PersonajeCreacion.ModFuerza).toBe(3);
        expect(service.PersonajeCreacion.Presa).toBe(3);
        expect(service.PersonajeCreacion.Capacidad_carga).toEqual({
            Ligera: 25,
            Media: 50,
            Pesada: 76,
        });
    });

    it('aplica multiplicador de carga por tamaño pequeño y grande', () => {
        const tipo = crearTipoBase();

        const svcSmall = new NuevoPersonajeService();
        svcSmall.setCatalogoTiposCriatura([tipo]);
        const razaSmall = crearRazaBase(tipo);
        razaSmall.Ajuste_nivel = 0;
        razaSmall.Dgs_adicionales.Cantidad = 0;
        razaSmall.Tamano = { Id: 0, Nombre: 'Pequeno', Modificador: 1, Modificador_presa: -4 } as any;
        svcSmall.seleccionarRaza(razaSmall);
        svcSmall.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });
        expect(svcSmall.PersonajeCreacion.Capacidad_carga).toEqual({
            Ligera: 14,
            Media: 28,
            Pesada: 43,
        });

        const svcLarge = new NuevoPersonajeService();
        svcLarge.setCatalogoTiposCriatura([tipo]);
        const razaLarge = crearRazaBase(tipo);
        razaLarge.Ajuste_nivel = 0;
        razaLarge.Dgs_adicionales.Cantidad = 0;
        razaLarge.Tamano = { Id: 0, Nombre: 'Grande', Modificador: -1, Modificador_presa: 4 } as any;
        svcLarge.seleccionarRaza(razaLarge);
        svcLarge.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });
        expect(svcLarge.PersonajeCreacion.Capacidad_carga).toEqual({
            Ligera: 38,
            Media: 77,
            Pesada: 116,
        });
    });

    it('calcula carga oficial para fuerza alta (30)', () => {
        const tipo = crearTipoBase();
        const svc = new NuevoPersonajeService();
        const raza = crearRazaBase(tipo);
        raza.Ajuste_nivel = 0;
        raza.Dgs_adicionales.Cantidad = 0;
        svc.setCatalogoTiposCriatura([tipo]);
        svc.seleccionarRaza(raza);
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 30,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        expect(svc.PersonajeCreacion.Capacidad_carga).toEqual({
            Ligera: 177,
            Media: 355,
            Pesada: 533,
        });
    });

    it('getIdiomasPendientesPostClase calcula por ModInt solo en primer nivel global', () => {
        service.PersonajeCreacion.ModInteligencia = 2;

        service.aplicarSiguienteNivelClase(claseBase);
        const primerNivel = service.getIdiomasPendientesPostClase();
        expect(primerNivel.cantidad).toBe(2);

        service.aplicarSiguienteNivelClase(claseBase);
        const segundoNivel = service.getIdiomasPendientesPostClase();
        expect(segundoNivel.cantidad).toBe(0);
    });

    it('no vuelve a conceder por progresion las dotes ya dadas por DGs raciales', () => {
        const tipo = crearTipoBase();
        const raza = crearRazaBase(tipo);
        raza.Dgs_adicionales.Cantidad = 6;
        raza.Dgs_adicionales.Dotes_extra = 2;
        service.seleccionarRaza(raza);
        service.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        const dotesRaza = service.registrarDotesPendientesPorRazaExtras('Humano');
        expect(dotesRaza.length).toBe(2);

        service.aplicarSiguienteNivelClase(claseBase);
        const dotesProgresion = service.registrarDotesPendientesPorProgresion('Guerrero nivel 1');
        expect(dotesProgresion.length).toBe(0);
    });

    it('concede dote de progresión en nivel 1 cuando no hay DGs adicionales', () => {
        const tipo = crearTipoBase();
        const raza = crearRazaBase(tipo);
        raza.Dgs_adicionales.Cantidad = 0;
        raza.Dgs_adicionales.Dotes_extra = 0;
        service.seleccionarRaza(raza);
        service.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        service.aplicarSiguienteNivelClase(claseBase);
        const dotesProgresion = service.registrarDotesPendientesPorProgresion('Guerrero nivel 1');
        expect(dotesProgresion.length).toBe(1);
        expect(dotesProgresion[0].fuente).toBe('nivel');
    });

    it('la progresion de dotes sigue funcionando por niveles de clase aunque haya DGs raciales', () => {
        const tipo = crearTipoBase();
        const raza = crearRazaBase(tipo);
        raza.Dgs_adicionales.Cantidad = 6;
        raza.Dgs_adicionales.Dotes_extra = 2;
        service.seleccionarRaza(raza);
        service.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        service.registrarDotesPendientesPorRazaExtras('Humano');

        const claseConNivel3 = crearClaseBase({
            Id: 777,
            Nombre: 'Guerrero de prueba',
            Desglose_niveles: [
                ...(claseBase.Desglose_niveles ?? []),
                {
                    Nivel: 3,
                    Ataque_base: '+3',
                    Salvaciones: { Fortaleza: '+3', Reflejos: '+1', Voluntad: '+1' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock(),
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 0,
                    Dotes: [],
                    Especiales: [],
                },
            ],
        });
        service.setCatalogoClases([claseConNivel3]);

        service.aplicarSiguienteNivelClase(claseConNivel3);
        expect(service.registrarDotesPendientesPorProgresion('Guerrero nivel 1').length).toBe(0);
        service.aplicarSiguienteNivelClase(claseConNivel3);
        expect(service.registrarDotesPendientesPorProgresion('Guerrero nivel 2').length).toBe(0);
        service.aplicarSiguienteNivelClase(claseConNivel3);
        expect(service.registrarDotesPendientesPorProgresion('Guerrero nivel 3').length).toBe(1);
    });

    it('con DGs raciales altos concede dote de progresion al cruzar el siguiente multiplo de 3', () => {
        const tipo = crearTipoBase();
        const raza = crearRazaBase(tipo);
        raza.Dgs_adicionales.Cantidad = 8;
        raza.Dgs_adicionales.Dotes_extra = 3;
        service.seleccionarRaza(raza);
        service.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        expect(service.registrarDotesPendientesPorRazaExtras('Azotamentes').length).toBe(3);
        service.aplicarSiguienteNivelClase(claseBase);
        expect(service.registrarDotesPendientesPorProgresion('Guerrero nivel 1').length).toBe(1);
    });

    it('DGs raciales 4/8/12 generan 1/2/3 aumentos por progresion', () => {
        const casos = [
            { dgs: 4, esperado: 1 },
            { dgs: 8, esperado: 2 },
            { dgs: 12, esperado: 3 },
        ];

        casos.forEach(({ dgs, esperado }) => {
            const tipo = crearTipoBase();
            const raza = crearRazaBase(tipo);
            raza.Dgs_adicionales.Cantidad = dgs;
            service.seleccionarRaza(raza);
            service.aplicarCaracteristicasGeneradas({
                Fuerza: 14,
                Destreza: 12,
                Constitucion: 13,
                Inteligencia: 10,
                Sabiduria: 11,
                Carisma: 9,
            });

            const creados = service.registrarAumentosPendientesPorProgresion('Prueba DGs');
            expect(creados.length).withContext(`DGs ${dgs}`).toBe(esperado);
            expect(service.getAumentosCaracteristicaPendientes().length).withContext(`DGs ${dgs}`).toBe(esperado);
        });
    });

    it('DGs raciales 2 y dos niveles de clase generan aumento al cruzar 4', () => {
        const tipo = crearTipoBase();
        const raza = crearRazaBase(tipo);
        raza.Dgs_adicionales.Cantidad = 2;
        service.seleccionarRaza(raza);
        service.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        expect(service.registrarAumentosPendientesPorProgresion('Inicio').length).toBe(0);
        service.aplicarSiguienteNivelClase(claseBase);
        expect(service.registrarAumentosPendientesPorProgresion('Clase 1').length).toBe(0);
        service.aplicarSiguienteNivelClase(claseBase);
        expect(service.registrarAumentosPendientesPorProgresion('Clase 2').length).toBe(1);
    });

    it('DGs de plantilla (multiplicador) cuentan para la progresion de aumentos', () => {
        const casos = [
            { dgsPlantilla: 3, esperado: 1 },
            { dgsPlantilla: 6, esperado: 2 },
        ];

        casos.forEach(({ dgsPlantilla, esperado }, index) => {
            const tipo = crearTipoBase();
            const raza = crearRazaBase(tipo);
            raza.Dgs_adicionales.Cantidad = 2;
            service.seleccionarRaza(raza);
            service.aplicarCaracteristicasGeneradas({
                Fuerza: 14,
                Destreza: 12,
                Constitucion: 13,
                Inteligencia: 10,
                Sabiduria: 11,
                Carisma: 9,
            });
            service.agregarPlantillaSeleccion({
                Id: 950 + index,
                Nombre: `Lic test ${index + 1}`,
                Licantronia_dg: {
                    Id_dado: 3,
                    Dado: 'D8',
                    Multiplicador: dgsPlantilla,
                    Suma: 99,
                },
            } as any);

            const creados = service.registrarAumentosPendientesPorProgresion('Plantillas');
            expect(creados.length).withContext(`DGs plantilla ${dgsPlantilla}`).toBe(esperado);
        });
    });

    it('NEP incluye DGs adicionales por multiplicador de plantillas', () => {
        const tipo = crearTipoBase();
        const raza = crearRazaBase(tipo);
        raza.Ajuste_nivel = 0;
        raza.Dgs_adicionales.Cantidad = 2;
        service.seleccionarRaza(raza);
        service.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });
        service.agregarPlantillaSeleccion({
            Id: 981,
            Nombre: 'Lic de NEP',
            Licantronia_dg: { Id_dado: 3, Dado: 'D8', Multiplicador: 3, Suma: 4 },
        } as any);

        service.aplicarSiguienteNivelClase(claseBase);
        expect(service.PersonajeCreacion.NEP).toBe(6);
    });

    it('suma licantrópica aporta PGs y no DGs para progresion', () => {
        const tipo = crearTipoBase();
        const raza = crearRazaBase(tipo);
        raza.Dgs_adicionales.Cantidad = 2;
        service.seleccionarRaza(raza);
        service.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });
        service.agregarPlantillaSeleccion({
            Id: 982,
            Nombre: 'Lic de PGs',
            Licantronia_dg: { Id_dado: 3, Dado: 'D8', Multiplicador: 1, Suma: 15 },
        } as any);

        const creados = service.registrarAumentosPendientesPorProgresion('Plantillas');
        expect(creados.length).toBe(0);
        expect(service.PersonajeCreacion.Pgs_lic).toBe(15);
    });

    it('el ajuste de nivel racial y de plantillas no afecta la progresion de aumentos', () => {
        const tipo = crearTipoBase();
        const raza = crearRazaBase(tipo);
        raza.Dgs_adicionales.Cantidad = 0;
        raza.Ajuste_nivel = 3;
        service.seleccionarRaza(raza);
        service.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });
        (service.EstadoFlujo.plantillas as any).seleccionadas = [{ Ajuste_nivel: 10 }];

        service.aplicarSiguienteNivelClase(claseBase);
        const creados = service.registrarAumentosPendientesPorProgresion('Clase 1');
        expect(creados.length).toBe(0);
    });

    it('especial con Modificadores.Caracteristica = N genera aumento de valor N', () => {
        const creados = service.registrarAumentosPendientesPorEspeciales([{
            Especial: {
                Nombre: 'Caracteristica +3',
                Modificadores: { Caracteristica: 3 },
            },
            Nivel: 1,
            Id_extra: 0,
            Extra: '',
            Opcional: 0,
            Id_interno: 0,
            Id_especial_requerido: 0,
            Id_dote_requerida: 0,
        } as any], 'Especial de prueba');

        expect(creados.length).toBe(1);
        expect(creados[0].valor).toBe(3);
    });

    it('aplicarAumentosCaracteristica incrementa estadisticas y modificadores', () => {
        const creados = service.registrarAumentosPendientesPorEspeciales([
            {
                Especial: { Nombre: 'Caracteristica +2', Modificadores: { Caracteristica: 2 } },
                Nivel: 1,
                Id_extra: 0,
                Extra: '',
                Opcional: 0,
                Id_interno: 0,
                Id_especial_requerido: 0,
                Id_dote_requerida: 0,
            } as any,
            {
                Especial: { Nombre: 'Caracteristica +1', Modificadores: { Caracteristica: 1 } },
                Nivel: 1,
                Id_extra: 0,
                Extra: '',
                Opcional: 0,
                Id_interno: 0,
                Id_especial_requerido: 0,
                Id_dote_requerida: 0,
            } as any,
        ], 'Especiales');

        const aplicado = service.aplicarAumentosCaracteristica(
            creados.map((pendiente) => ({
                idPendiente: pendiente.id,
                caracteristica: 'Fuerza',
            }))
        );

        expect(aplicado).toBeTrue();
        expect(service.PersonajeCreacion.Fuerza).toBe(17);
        expect(service.PersonajeCreacion.ModFuerza).toBe(3);
        expect(service.getAumentosCaracteristicaPendientes().length).toBe(0);
    });

    it('bloquea aumentos en caracteristicas perdidas', () => {
        service.PersonajeCreacion.Caracteristicas_perdidas = {
            ...service.PersonajeCreacion.Caracteristicas_perdidas,
            Constitucion: true,
        };
        service.PersonajeCreacion.Constitucion_perdida = true;

        const creados = service.registrarAumentosPendientesPorEspeciales([{
            Especial: { Nombre: 'Caracteristica +1', Modificadores: { Caracteristica: 1 } },
            Nivel: 1,
            Id_extra: 0,
            Extra: '',
            Opcional: 0,
            Id_interno: 0,
            Id_especial_requerido: 0,
            Id_dote_requerida: 0,
        } as any], 'Especiales');

        const aplicado = service.aplicarAumentosCaracteristica([{
            idPendiente: creados[0].id,
            caracteristica: 'Constitucion',
        }]);
        expect(aplicado).toBeFalse();
    });

    it('en nivel 1 marca habilidades de clase y añade idiomas fijos', () => {
        service.setCatalogoHabilidades([{
            Id_habilidad: 99,
            Nombre: 'Saber arcano',
            Id_caracteristica: 4,
            Caracteristica: 'Inteligencia',
            Descripcion: '',
            Soporta_extra: false,
            Entrenada: false,
            Extras: [],
        }]);
        const claseConHabilidades = crearClaseBase({
            Id: 50,
            Nombre: 'Mago',
            Habilidades: {
                Base: [{ Id_habilidad: 99, Habilidad: 'Saber arcano', Id_caracteristica: 4, Caracteristica: 'Inteligencia' }],
                Custom: [],
            },
            Idiomas: [{ Id: 1, Nombre: 'Dracónico', Descripcion: 'Idioma dracónico', Secreto: false, Oficial: true }],
        });
        service.setCatalogoClases([claseConHabilidades]);

        service.aplicarSiguienteNivelClase(claseConHabilidades);

        expect(service.PersonajeCreacion.Habilidades.find((h) => h.Id === 99)?.Clasea).toBeTrue();
        expect(service.PersonajeCreacion.Idiomas.some((i) => i.Nombre === 'Dracónico')).toBeTrue();
        expect(service.PersonajeCreacion.Idiomas.find((i) => i.Nombre === 'Dracónico')?.Origen).toBe('Mago nivel 1');
    });

    it('en nivel 1 marca habilidades custom de clase como Custom=true aunque el raw no lo indique', () => {
        service.setCatalogoHabilidades([]);
        service.setCatalogoHabilidadesCustom([{
            Id_habilidad: 199,
            Nombre: 'Saber prohibido',
            Id_caracteristica: 4,
            Caracteristica: 'Inteligencia',
            Descripcion: '',
            Soporta_extra: true,
            Entrenada: false,
            Extras: [{ Id_extra: 1, Extra: 'Abismo', Descripcion: '' }],
        }]);
        const claseConCustom = crearClaseBase({
            Id: 55,
            Nombre: 'Ocultista',
            Habilidades: {
                Base: [],
                Custom: [{ Id_habilidad: 199, Habilidad: 'Saber prohibido' }],
            },
        });
        service.setCatalogoClases([claseConCustom]);

        service.aplicarSiguienteNivelClase(claseConCustom);

        const habilidad = service.PersonajeCreacion.Habilidades.find((h) => h.Id === 199);
        expect(habilidad?.Clasea).toBeTrue();
        expect(habilidad?.Custom).toBeTrue();
        expect(habilidad?.Car).toBe('Inteligencia');
        expect(habilidad?.Soporta_extra).toBeTrue();
        expect((habilidad?.Extras ?? []).length).toBe(1);
    });

    it('añade por nivel solo dotes y especiales no opcionales', () => {
        const claseConExtras = crearClaseBase({
            Id: 60,
            Nombre: 'Pícaro',
            Desglose_niveles: [
                {
                    Nivel: 1,
                    Ataque_base: '+0',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+2', Voluntad: '+0' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock([0]),
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 0,
                    Dotes: [
                        { Dote: { Id: 801, Nombre: 'Arma sutil', Descripcion: '', Beneficio: '', Manual: { Pagina: 1 } } as any, Nivel: 1, Id_extra: -1, Extra: '', Opcional: 0, Id_interno: 0, Id_especial_requerido: 0, Id_dote_requerida: 0 },
                        { Dote: { Id: 802, Nombre: 'Opcional', Descripcion: '', Beneficio: '', Manual: { Pagina: 1 } } as any, Nivel: 1, Id_extra: -1, Extra: '', Opcional: 1, Id_interno: 0, Id_especial_requerido: 0, Id_dote_requerida: 0 },
                    ],
                    Especiales: [
                        { Especial: { Nombre: 'Ataque furtivo' }, Nivel: 1, Id_extra: -1, Extra: '', Opcional: 0, Id_interno: 0, Id_especial_requerido: 0, Id_dote_requerida: 0 },
                        { Especial: { Nombre: 'Especial opcional' }, Nivel: 1, Id_extra: -1, Extra: '', Opcional: 1, Id_interno: 0, Id_especial_requerido: 0, Id_dote_requerida: 0 },
                    ],
                },
                {
                    Nivel: 2,
                    Ataque_base: '+1',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+3', Voluntad: '+0' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock([0]),
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 0,
                    Dotes: [
                        { Dote: { Id: 803, Nombre: 'Evasión mejorada', Descripcion: '', Beneficio: '', Manual: { Pagina: 1 } } as any, Nivel: 2, Id_extra: -1, Extra: '', Opcional: 0, Id_interno: 0, Id_especial_requerido: 0, Id_dote_requerida: 0 },
                    ],
                    Especiales: [
                        { Especial: { Nombre: 'Esquiva asombrosa' }, Nivel: 2, Id_extra: -1, Extra: '', Opcional: 0, Id_interno: 0, Id_especial_requerido: 0, Id_dote_requerida: 0 },
                    ],
                },
            ],
        });
        service.setCatalogoClases([claseConExtras]);

        service.aplicarSiguienteNivelClase(claseConExtras);
        service.aplicarSiguienteNivelClase(claseConExtras);

        const nombresDotes = service.PersonajeCreacion.Dotes.map((d) => d.Nombre);
        const nombresEspeciales = service.PersonajeCreacion.Claseas.map((e) => e.Nombre);
        expect(nombresDotes).toContain('Arma sutil');
        expect(nombresDotes).toContain('Evasión mejorada');
        expect(nombresDotes).not.toContain('Opcional');
        expect(nombresEspeciales).toContain('Ataque furtivo');
        expect(nombresEspeciales).toContain('Esquiva asombrosa');
        expect(nombresEspeciales).not.toContain('Especial opcional');
    });

    it('aplica elecciones opcionales internas de clase cuando se seleccionan', () => {
        const claseOpcional = crearClaseBase({
            Id: 70,
            Nombre: 'Adepto',
            Desglose_niveles: [
                {
                    Nivel: 1,
                    Ataque_base: '+0',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock([0]),
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 0,
                    Dotes: [
                        { Dote: { Id: 901, Nombre: 'Talento A', Descripcion: '', Beneficio: '', Manual: { Pagina: 1 } } as any, Nivel: 1, Id_extra: -1, Extra: '', Opcional: 1, Id_interno: 101, Id_especial_requerido: 0, Id_dote_requerida: 0 },
                        { Dote: { Id: 902, Nombre: 'Talento B', Descripcion: '', Beneficio: '', Manual: { Pagina: 1 } } as any, Nivel: 1, Id_extra: -1, Extra: '', Opcional: 1, Id_interno: 102, Id_especial_requerido: 0, Id_dote_requerida: 0 },
                    ],
                    Especiales: [],
                },
            ],
        });
        service.setCatalogoClases([claseOpcional]);

        const grupos = service.obtenerOpcionalesSiguienteNivelClase(claseOpcional);
        expect(grupos.length).toBe(1);
        expect(grupos[0].opciones.length).toBe(2);
        const claveTalentoB = grupos[0].opciones.find((opcion) => opcion.nombre === 'Talento B')?.clave;
        expect(claveTalentoB).toBeTruthy();

        const res = service.aplicarSiguienteNivelClase(claseOpcional, { 1: `${claveTalentoB}` });
        expect(res.aplicado).toBeTrue();
        expect(service.PersonajeCreacion.Dotes.some((d) => d.Nombre === 'Talento B')).toBeTrue();
        expect(service.PersonajeCreacion.Dotes.some((d) => d.Nombre === 'Talento A')).toBeFalse();
    });

    it('sesión de conjuros usa delta de Conjuros_conocidos_total al subir niveles de clase', () => {
        const claseConConjuros = crearClaseBase({
            Id: 80,
            Nombre: 'Hechicero',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                Conocidos_total: true,
                Conocidos_nivel_a_nivel: false,
                Listado: [
                    { Id: 1001, Nombre: 'Luz', Nivel: 0, Espontaneo: true },
                    { Id: 1002, Nombre: 'Armadura de mago', Nivel: 1, Espontaneo: true },
                    { Id: 1003, Nombre: 'Proyectil mágico', Nivel: 1, Espontaneo: true },
                ],
            },
            Desglose_niveles: [
                {
                    Nivel: 1,
                    Ataque_base: '+0',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock([0, 1]),
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 1,
                    Dotes: [],
                    Especiales: [],
                },
                {
                    Nivel: 2,
                    Ataque_base: '+1',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+3' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock([0, 1]),
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 3,
                    Dotes: [],
                    Especiales: [],
                },
            ],
        });
        service.setCatalogoClases([claseConConjuros]);
        service.setCatalogoConjuros([
            {
                Id: 1001,
                Nombre: 'Luz',
                Arcano: true,
                Divino: false,
                Psionico: false,
                Alma: false,
                Escuela: { Id: 1, Nombre: 'Evocacion' } as any,
                Disciplina: { Id: 0, Nombre: '' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 80, Clase: 'Hechicero', Nivel: 0, Espontaneo: true }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
            {
                Id: 1002,
                Nombre: 'Armadura de mago',
                Arcano: true,
                Divino: false,
                Psionico: false,
                Alma: false,
                Escuela: { Id: 1, Nombre: 'Abjuracion' } as any,
                Disciplina: { Id: 0, Nombre: '' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 80, Clase: 'Hechicero', Nivel: 1, Espontaneo: true }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
            {
                Id: 1003,
                Nombre: 'Proyectil mágico',
                Arcano: true,
                Divino: false,
                Psionico: false,
                Alma: false,
                Escuela: { Id: 1, Nombre: 'Evocacion' } as any,
                Disciplina: { Id: 0, Nombre: '' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 80, Clase: 'Hechicero', Nivel: 1, Espontaneo: true }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
        ]);

        service.aplicarSiguienteNivelClase(claseConConjuros);
        let sesion = service.getConjurosSesionActual();
        expect(sesion.activa).toBeTrue();
        expect(sesion.entradas[0].cupoPendiente.total).toBe(1);
        expect(service.puedeCerrarSesionConjuros()).toBeFalse();
        expect(service.seleccionarConjuroSesion(1001)).toBeTrue();
        expect(service.puedeCerrarSesionConjuros()).toBeTrue();
        expect(service.cerrarSesionConjuros()).toBe('dotes');
        expect(service.PersonajeCreacion.Conjuros.map((c) => c.Nombre)).toEqual(['Luz']);

        service.aplicarSiguienteNivelClase(claseConConjuros);
        sesion = service.getConjurosSesionActual();
        expect(sesion.entradas[0].cupoPendiente.total).toBe(2);
        expect(service.seleccionarConjuroSesion(1002)).toBeTrue();
        expect(service.seleccionarConjuroSesion(1003)).toBeTrue();
        expect(service.cerrarSesionConjuros()).toBe('dotes');
        const nombres = service.PersonajeCreacion.Conjuros.map((c) => c.Nombre);
        expect(nombres).toContain('Luz');
        expect(nombres).toContain('Armadura de mago');
        expect(nombres).toContain('Proyectil mágico');
        expect(service.PersonajeCreacion.Conjuros.length).toBe(3);
    });

    it('sesión de conjuros usa delta por nivel cuando la clase usa Conjuros_conocidos_nivel_a_nivel', () => {
        const clasePorNivel = crearClaseBase({
            Id: 81,
            Nombre: 'Mago',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                Conocidos_total: false,
                Conocidos_nivel_a_nivel: true,
                Listado: [
                    { Id: 1101, Nombre: 'Detectar magia', Nivel: 0, Espontaneo: false },
                    { Id: 1102, Nombre: 'Mano de mago', Nivel: 0, Espontaneo: false },
                    { Id: 1103, Nombre: 'Escudo', Nivel: 1, Espontaneo: false },
                ],
            },
            Desglose_niveles: [
                {
                    Nivel: 1,
                    Ataque_base: '+0',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock([0]),
                    Conjuros_conocidos_nivel_a_nivel: { 0: 2, 1: 0 },
                    Conjuros_conocidos_total: 0,
                    Dotes: [],
                    Especiales: [],
                },
                {
                    Nivel: 2,
                    Ataque_base: '+1',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+3' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock([0, 1]),
                    Conjuros_conocidos_nivel_a_nivel: { 0: 2, 1: 1 },
                    Conjuros_conocidos_total: 0,
                    Dotes: [],
                    Especiales: [],
                },
            ],
        });
        service.setCatalogoClases([clasePorNivel]);
        service.setCatalogoConjuros([
            {
                Id: 1101,
                Nombre: 'Detectar magia',
                Arcano: true,
                Divino: false,
                Psionico: false,
                Alma: false,
                Escuela: { Id: 1, Nombre: 'Adivinacion' } as any,
                Disciplina: { Id: 0, Nombre: '' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 81, Clase: 'Mago', Nivel: 0, Espontaneo: false }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
            {
                Id: 1102,
                Nombre: 'Mano de mago',
                Arcano: true,
                Divino: false,
                Psionico: false,
                Alma: false,
                Escuela: { Id: 1, Nombre: 'Transmutacion' } as any,
                Disciplina: { Id: 0, Nombre: '' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 81, Clase: 'Mago', Nivel: 0, Espontaneo: false }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
            {
                Id: 1103,
                Nombre: 'Escudo',
                Arcano: true,
                Divino: false,
                Psionico: false,
                Alma: false,
                Escuela: { Id: 1, Nombre: 'Abjuracion' } as any,
                Disciplina: { Id: 0, Nombre: '' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 81, Clase: 'Mago', Nivel: 1, Espontaneo: false }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
        ]);

        service.aplicarSiguienteNivelClase(clasePorNivel);
        let sesion = service.getConjurosSesionActual();
        expect(sesion.activa).toBeTrue();
        expect(sesion.entradas[0].cupoPendiente.porNivel[0]).toBe(2);
        expect(service.seleccionarConjuroSesion(1101)).toBeTrue();
        expect(service.seleccionarConjuroSesion(1102)).toBeTrue();
        expect(service.cerrarSesionConjuros()).toBe('dotes');
        expect(service.PersonajeCreacion.Conjuros.map((c) => c.Nombre)).toEqual(['Detectar magia', 'Mano de mago']);

        service.aplicarSiguienteNivelClase(clasePorNivel);
        sesion = service.getConjurosSesionActual();
        expect(sesion.entradas[0].cupoPendiente.porNivel[1]).toBe(1);
        expect(service.seleccionarConjuroSesion(1103)).toBeTrue();
        expect(service.cerrarSesionConjuros()).toBe('dotes');
        expect(service.PersonajeCreacion.Conjuros.map((c) => c.Nombre)).toEqual(['Detectar magia', 'Mano de mago', 'Escudo']);
    });

    it('interpreta claves Nivel_X en Conjuros_conocidos_nivel_a_nivel', () => {
        const clasePorNivel = crearClaseBase({
            Id: 811,
            Nombre: 'Mago Clave Nivel',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                Conocidos_total: false,
                Conocidos_nivel_a_nivel: true,
                Listado: [{ Id: 1111, Nombre: 'Detectar magia', Nivel: 0, Espontaneo: false }],
            },
            Desglose_niveles: [
                {
                    Nivel: 1,
                    Ataque_base: '+0',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock([0]),
                    Conjuros_conocidos_nivel_a_nivel: { Nivel_0: 1 } as any,
                    Conjuros_conocidos_total: 0,
                    Dotes: [],
                    Especiales: [],
                },
            ],
        });
        service.setCatalogoClases([clasePorNivel]);
        service.setCatalogoConjuros([{
            Id: 1111,
            Nombre: 'Detectar magia',
            Arcano: true,
            Divino: false,
            Psionico: false,
            Alma: false,
            Escuela: { Id: 1, Nombre: 'Adivinacion' } as any,
            Disciplina: { Id: 0, Nombre: '' } as any,
            Descriptores: [],
            Nivel_clase: [{ Id_clase: 811, Clase: 'Mago Clave Nivel', Nivel: 0, Espontaneo: false }],
            Nivel_dominio: [],
            Nivel_disciplinas: [],
            Oficial: true,
        } as any]);

        const res = service.aplicarSiguienteNivelClase(clasePorNivel);
        expect(res.aplicado).toBeTrue();
        const sesion = service.getConjurosSesionActual();
        expect(sesion.activa).toBeTrue();
        expect(sesion.entradas[0].seleccionManual).toBeTrue();
        expect(sesion.entradas[0].cupoPendiente.porNivel[0]).toBe(1);
    });

    it('si usa conocidos nivel a nivel pero delta es 0, no marca autoadicion', () => {
        const claseSinDelta = crearClaseBase({
            Id: 812,
            Nombre: 'Mago sin delta',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                Conocidos_total: false,
                Conocidos_nivel_a_nivel: true,
                Listado: [{ Id: 1112, Nombre: 'Luz', Nivel: 0, Espontaneo: false }],
            },
            Desglose_niveles: [
                {
                    Nivel: 1,
                    Ataque_base: '+0',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock([0]),
                    Conjuros_conocidos_nivel_a_nivel: { Nivel_0: 0 } as any,
                    Conjuros_conocidos_total: 0,
                    Dotes: [],
                    Especiales: [],
                },
            ],
        });
        service.setCatalogoClases([claseSinDelta]);
        service.setCatalogoConjuros([{
            Id: 1112,
            Nombre: 'Luz',
            Arcano: true,
            Divino: false,
            Psionico: false,
            Alma: false,
            Escuela: { Id: 1, Nombre: 'Evocacion' } as any,
            Disciplina: { Id: 0, Nombre: '' } as any,
            Descriptores: [],
            Nivel_clase: [{ Id_clase: 812, Clase: 'Mago sin delta', Nivel: 0, Espontaneo: false }],
            Nivel_dominio: [],
            Nivel_disciplinas: [],
            Oficial: true,
        } as any]);

        service.aplicarSiguienteNivelClase(claseSinDelta);
        const sesion = service.getConjurosSesionActual();
        expect(sesion.entradas[0].seleccionManual).toBeFalse();
        expect(sesion.entradas[0].autoadicion).toBeFalse();
        expect(sesion.entradas[0].autoadicionadosIds.length).toBe(0);
    });

    it('autoadicion: si la clase no limita conocidos, añade todos los elegibles al cerrar sesión', () => {
        const claseAuto = crearClaseBase({
            Id: 82,
            Nombre: 'Invocador',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                Conocidos_total: false,
                Conocidos_nivel_a_nivel: false,
                Listado: [
                    { Id: 1201, Nombre: 'Prestidigitación', Nivel: 0, Espontaneo: true },
                    { Id: 1202, Nombre: 'Escudo', Nivel: 1, Espontaneo: true },
                ],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock([0, 1]),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        service.setCatalogoClases([claseAuto]);
        service.setCatalogoConjuros([
            {
                Id: 1201,
                Nombre: 'Prestidigitación',
                Arcano: true,
                Escuela: { Id: 1, Nombre: 'Universal' } as any,
                Disciplina: { Id: 0, Nombre: '' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 82, Clase: 'Invocador', Nivel: 0, Espontaneo: true }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
            {
                Id: 1202,
                Nombre: 'Escudo',
                Arcano: true,
                Escuela: { Id: 1, Nombre: 'Abjuracion' } as any,
                Disciplina: { Id: 0, Nombre: '' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 82, Clase: 'Invocador', Nivel: 1, Espontaneo: true }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
        ]);

        service.aplicarSiguienteNivelClase(claseAuto);
        const sesion = service.getConjurosSesionActual();
        expect(sesion.activa).toBeTrue();
        expect(sesion.entradas[0].autoadicion).toBeTrue();
        expect(service.puedeCerrarSesionConjuros()).toBeTrue();
        expect(service.cerrarSesionConjuros()).toBe('dotes');
        expect(service.PersonajeCreacion.Conjuros.length).toBe(2);
    });

    it('sin elegibles: permite continuar sin bloquear la sesión', () => {
        const claseSinElegibles = crearClaseBase({
            Id: 83,
            Nombre: 'Conjurador vacío',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                Conocidos_total: true,
                Listado: [],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 1,
                Dotes: [],
                Especiales: [],
            }],
        });
        service.setCatalogoClases([claseSinElegibles]);
        service.setCatalogoConjuros([]);

        service.aplicarSiguienteNivelClase(claseSinElegibles);
        const sesion = service.getConjurosSesionActual();
        expect(sesion.activa).toBeTrue();
        expect(sesion.entradas[0].sinElegibles).toBeTrue();
        expect(service.puedeCerrarSesionConjuros()).toBeTrue();
        expect(service.cerrarSesionConjuros()).toBe('dotes');
    });

    it('aplica aumento de clase lanzadora sobre clase previa', () => {
        const claseBaseLanzadora = crearClaseBase({
            Id: 84,
            Nombre: 'Mago base',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                Conocidos_total: true,
                Listado: [
                    { Id: 1301, Nombre: 'Leer magia', Nivel: 0, Espontaneo: false },
                    { Id: 1302, Nombre: 'Escudo', Nivel: 1, Espontaneo: false },
                ],
            },
            Desglose_niveles: [
                {
                    Nivel: 1,
                    Ataque_base: '+0',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock([0]),
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 1,
                    Dotes: [],
                    Especiales: [],
                },
                {
                    Nivel: 2,
                    Ataque_base: '+1',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+3' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock([0, 1]),
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 2,
                    Dotes: [],
                    Especiales: [],
                },
            ],
        });
        const clasePrestigio = crearClaseBase({
            Id: 85,
            Nombre: 'Teurgo',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: false,
                Divinos: false,
                Psionicos: false,
                Alma: false,
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [{ Id: 0, Nombre: '' }],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        service.setCatalogoClases([claseBaseLanzadora, clasePrestigio]);
        service.setCatalogoConjuros([
            {
                Id: 1301,
                Nombre: 'Leer magia',
                Arcano: true,
                Escuela: { Id: 1, Nombre: 'Universal' } as any,
                Disciplina: { Id: 0, Nombre: '' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 84, Clase: 'Mago base', Nivel: 0, Espontaneo: false }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
            {
                Id: 1302,
                Nombre: 'Escudo',
                Arcano: true,
                Escuela: { Id: 1, Nombre: 'Abjuracion' } as any,
                Disciplina: { Id: 0, Nombre: '' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 84, Clase: 'Mago base', Nivel: 1, Espontaneo: false }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
        ]);

        service.aplicarSiguienteNivelClase(claseBaseLanzadora);
        service.seleccionarConjuroSesion(1301);
        service.cerrarSesionConjuros();

        const res = service.aplicarSiguienteNivelClase(clasePrestigio);
        expect(res.aplicado).toBeTrue();
        const sesion = service.getConjurosSesionActual();
        expect(sesion.activa).toBeTrue();
        expect(sesion.entradas[0].claseObjetivo.nombre).toBe('Mago base');
        expect(sesion.entradas[0].nivelLanzadorActual).toBe(2);
    });

    it('si hay varias clases lanzadoras previas, devuelve aumento de lanzador pendiente de selección', () => {
        const arcano = crearClaseBase({
            Id: 87,
            Nombre: 'Arcano',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                Conocidos_total: true,
                Listado: [{ Id: 1501, Nombre: 'Luz', Nivel: 0, Espontaneo: true }],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 1,
                Dotes: [],
                Especiales: [],
            }],
        });
        const divino = crearClaseBase({
            Id: 88,
            Nombre: 'Divino',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Divinos: true,
                Conocidos_total: true,
                Listado: [{ Id: 1502, Nombre: 'Oración menor', Nivel: 0, Espontaneo: true }],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 1,
                Dotes: [],
                Especiales: [],
            }],
        });
        const prestige = crearClaseBase({
            Id: 89,
            Nombre: 'Teurgo dual',
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [{ Id: 0, Nombre: '' }],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        service.setCatalogoClases([arcano, divino, prestige]);
        service.setCatalogoConjuros([
            {
                Id: 1501,
                Nombre: 'Luz',
                Arcano: true,
                Escuela: { Id: 1, Nombre: 'Evocacion' } as any,
                Disciplina: { Id: 0, Nombre: '' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 87, Clase: 'Arcano', Nivel: 0, Espontaneo: true }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
            {
                Id: 1502,
                Nombre: 'Oración menor',
                Divino: true,
                Escuela: { Id: 1, Nombre: 'Abjuracion' } as any,
                Disciplina: { Id: 0, Nombre: '' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 88, Clase: 'Divino', Nivel: 0, Espontaneo: true }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
        ]);

        service.aplicarSiguienteNivelClase(arcano);
        service.seleccionarConjuroSesion(1501);
        service.cerrarSesionConjuros();
        service.aplicarSiguienteNivelClase(divino);
        service.seleccionarConjuroSesion(1502);
        service.cerrarSesionConjuros();

        const res = service.aplicarSiguienteNivelClase(prestige);
        expect(res.aplicado).toBeFalse();
        expect((res.aumentosClaseLanzadoraPendientes ?? []).length).toBe(1);
        expect((res.aumentosClaseLanzadoraPendientes?.[0]?.opciones ?? []).length).toBe(2);
    });

    it('arcano/divino válido: permite aplicar nivel cuando Conjuros_diarios está informado', () => {
        const claseArcana = crearClaseBase({
            Id: 890,
            Nombre: 'Arcano válido',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                Conocidos_total: false,
                Conocidos_nivel_a_nivel: false,
                Listado: [{ Id: 1591, Nombre: 'Luz', Nivel: 0, Espontaneo: true }],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        service.setCatalogoClases([claseArcana]);
        service.setCatalogoConjuros([{
            Id: 1591,
            Nombre: 'Luz',
            Arcano: true,
            Divino: false,
            Psionico: false,
            Alma: false,
            Escuela: { Id: 1, Nombre: 'Evocacion' } as any,
            Disciplina: { Id: 0, Nombre: '' } as any,
            Descriptores: [],
            Nivel_clase: [{ Id_clase: 890, Clase: 'Arcano válido', Nivel: 0, Espontaneo: true }],
            Nivel_dominio: [],
            Nivel_disciplinas: [],
            Oficial: true,
        } as any]);

        const res = service.aplicarSiguienteNivelClase(claseArcana);
        expect(res.aplicado).toBeTrue();
    });

    it('arcano/divino inválido sin Conjuros_diarios: bloquea con error de integridad', () => {
        const claseArcanaInvalida = crearClaseBase({
            Id: 891,
            Nombre: 'Arcano sin diarios',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                Conocidos_total: false,
                Conocidos_nivel_a_nivel: false,
                Listado: [{ Id: 1592, Nombre: 'Luz', Nivel: 0, Espontaneo: true }],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: {},
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        service.setCatalogoClases([claseArcanaInvalida]);
        service.setCatalogoConjuros([]);

        const res = service.aplicarSiguienteNivelClase(claseArcanaInvalida);
        expect(res.aplicado).toBeFalse();
        expect(`${res.razon ?? ''}`).toContain('sin Conjuros_diarios');
    });

    it('arcano/divino inválido con nivel psiónico informado: bloquea con error de integridad', () => {
        const claseArcanaInvalida = crearClaseBase({
            Id: 892,
            Nombre: 'Arcano con campo psiónico',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                Conocidos_total: false,
                Conocidos_nivel_a_nivel: false,
                Listado: [{ Id: 1593, Nombre: 'Luz', Nivel: 0, Espontaneo: true }],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: 0,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        service.setCatalogoClases([claseArcanaInvalida]);
        service.setCatalogoConjuros([]);

        const res = service.aplicarSiguienteNivelClase(claseArcanaInvalida);
        expect(res.aplicado).toBeFalse();
        expect(`${res.razon ?? ''}`).toContain('no debe informarse en lanzadores arcanos/divinos');
    });

    it('psiónico válido: usa nivel_max_poder_accesible_nivel_lanzadorPsionico sin Conjuros_diarios', () => {
        const clasePsionica = crearClaseBase({
            Id: 893,
            Nombre: 'Psiónico válido',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: false,
                Divinos: false,
                Psionicos: true,
                Conocidos_total: false,
                Conocidos_nivel_a_nivel: false,
                Listado: [{ Id: 1594, Nombre: 'Rayo mental', Nivel: 0, Espontaneo: true }],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: 0,
                Reserva_psionica: 2,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: {},
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        service.setCatalogoClases([clasePsionica]);
        service.setCatalogoConjuros([{
            Id: 1594,
            Nombre: 'Rayo mental',
            Arcano: false,
            Divino: false,
            Psionico: true,
            Alma: false,
            Escuela: { Id: 1, Nombre: 'Psionica' } as any,
            Disciplina: { Id: 1, Nombre: 'Telepatia' } as any,
            Descriptores: [],
            Nivel_clase: [{ Id_clase: 893, Clase: 'Psiónico válido', Nivel: 0, Espontaneo: true }],
            Nivel_dominio: [],
            Nivel_disciplinas: [],
            Oficial: true,
        } as any]);

        const res = service.aplicarSiguienteNivelClase(clasePsionica);
        expect(res.aplicado).toBeTrue();
        const sesion = service.getConjurosSesionActual();
        expect(sesion.entradas[0].tipoLanzamiento).toBe('psionico');
        expect(sesion.entradas[0].nivelMaxPoderAccesiblePsionico).toBe(0);
    });

    it('psiónico inválido sin nivel máximo de poder: bloquea con error de integridad', () => {
        const clasePsionicaInvalida = crearClaseBase({
            Id: 894,
            Nombre: 'Psiónico sin nivel máximo',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: false,
                Divinos: false,
                Psionicos: true,
                Conocidos_total: false,
                Conocidos_nivel_a_nivel: false,
                Listado: [{ Id: 1595, Nombre: 'Empuje', Nivel: 0, Espontaneo: true }],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 2,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: {},
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        service.setCatalogoClases([clasePsionicaInvalida]);
        service.setCatalogoConjuros([]);

        const res = service.aplicarSiguienteNivelClase(clasePsionicaInvalida);
        expect(res.aplicado).toBeFalse();
        expect(`${res.razon ?? ''}`).toContain('falta nivel_max_poder_accesible_nivel_lanzadorPsionico');
    });

    it('psiónico inválido con Conjuros_diarios informado: bloquea con error de integridad', () => {
        const clasePsionicaInvalida = crearClaseBase({
            Id: 895,
            Nombre: 'Psiónico con diarios',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: false,
                Divinos: false,
                Psionicos: true,
                Conocidos_total: false,
                Conocidos_nivel_a_nivel: false,
                Listado: [{ Id: 1596, Nombre: 'Empuje', Nivel: 0, Espontaneo: true }],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: 0,
                Reserva_psionica: 2,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [],
            }],
        });
        service.setCatalogoClases([clasePsionicaInvalida]);
        service.setCatalogoConjuros([]);

        const res = service.aplicarSiguienteNivelClase(clasePsionicaInvalida);
        expect(res.aplicado).toBeFalse();
        expect(`${res.razon ?? ''}`).toContain('Conjuros_diarios no debe informarse en clases psiónicas');
    });

    it('autoadición psiónica usa solo niveles recién desbloqueados por nivel máximo de poder', () => {
        const clasePsionica = crearClaseBase({
            Id: 896,
            Nombre: 'Psiónico progresivo',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: false,
                Divinos: false,
                Psionicos: true,
                Conocidos_total: false,
                Conocidos_nivel_a_nivel: false,
                Listado: [
                    { Id: 1597, Nombre: 'Toque mental', Nivel: 0, Espontaneo: true },
                    { Id: 1598, Nombre: 'Arremetida mental', Nivel: 1, Espontaneo: true },
                ],
            },
            Desglose_niveles: [
                {
                    Nivel: 1,
                    Ataque_base: '+0',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: 0,
                    Reserva_psionica: 2,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: {},
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 0,
                    Dotes: [],
                    Especiales: [],
                },
                {
                    Nivel: 2,
                    Ataque_base: '+1',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+3' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: 1,
                    Reserva_psionica: 4,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: {},
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 0,
                    Dotes: [],
                    Especiales: [],
                },
            ],
        });
        service.setCatalogoClases([clasePsionica]);
        service.setCatalogoConjuros([
            {
                Id: 1597,
                Nombre: 'Toque mental',
                Arcano: false,
                Divino: false,
                Psionico: true,
                Alma: false,
                Escuela: { Id: 1, Nombre: 'Psionica' } as any,
                Disciplina: { Id: 1, Nombre: 'Psicometabolismo' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 896, Clase: 'Psiónico progresivo', Nivel: 0, Espontaneo: true }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
            {
                Id: 1598,
                Nombre: 'Arremetida mental',
                Arcano: false,
                Divino: false,
                Psionico: true,
                Alma: false,
                Escuela: { Id: 1, Nombre: 'Psionica' } as any,
                Disciplina: { Id: 1, Nombre: 'Psicoquinesis' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 896, Clase: 'Psiónico progresivo', Nivel: 1, Espontaneo: true }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
        ]);

        service.aplicarSiguienteNivelClase(clasePsionica);
        let sesion = service.getConjurosSesionActual();
        expect(sesion.entradas[0].autoadicion).toBeTrue();
        expect(sesion.entradas[0].autoadicionadosIds).toEqual([1597]);
        expect(service.cerrarSesionConjuros()).toBe('dotes');
        expect(service.PersonajeCreacion.Conjuros.map((c) => c.Id)).toEqual([1597]);

        service.aplicarSiguienteNivelClase(clasePsionica);
        sesion = service.getConjurosSesionActual();
        expect(sesion.entradas[0].autoadicion).toBeTrue();
        expect(sesion.entradas[0].autoadicionadosIds).toEqual([1598]);
        expect(service.cerrarSesionConjuros()).toBe('dotes');
        expect(service.PersonajeCreacion.Conjuros.map((c) => c.Id)).toEqual([1597, 1598]);
    });

    it('filtros de conjuros aplican oficialidad, alineamiento, escuela y disciplina prohibida', () => {
        service.PersonajeCreacion.Oficial = true;
        service.PersonajeCreacion.Alineamiento = 'Legal bueno';
        service.PersonajeCreacion.Escuelas_prohibidas = [{ Nombre: 'Evocacion' }];
        service.PersonajeCreacion.Disciplina_prohibida = 'Telepatia';

        const claseFiltrada = crearClaseBase({
            Id: 86,
            Nombre: 'Teúrgo arcano',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                Dependientes_alineamiento: true,
                Conocidos_total: true,
                Listado: [
                    { Id: 1401, Nombre: 'Valido', Nivel: 0, Espontaneo: false },
                    { Id: 1402, Nombre: 'No oficial', Nivel: 0, Espontaneo: false },
                    { Id: 1403, Nombre: 'Maligno', Nivel: 0, Espontaneo: false },
                    { Id: 1404, Nombre: 'Escuela prohibida', Nivel: 0, Espontaneo: false },
                    { Id: 1405, Nombre: 'Disciplina prohibida', Nivel: 0, Espontaneo: false },
                ],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 1,
                Dotes: [],
                Especiales: [],
            }],
        });
        service.setCatalogoClases([claseFiltrada]);
        service.setCatalogoConjuros([
            {
                Id: 1401,
                Nombre: 'Valido',
                Arcano: true,
                Escuela: { Id: 1, Nombre: 'Abjuracion' } as any,
                Disciplina: { Id: 1, Nombre: 'Metacreatividad' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 86, Clase: 'Teúrgo arcano', Nivel: 0, Espontaneo: false }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
            {
                Id: 1402,
                Nombre: 'No oficial',
                Arcano: true,
                Escuela: { Id: 1, Nombre: 'Abjuracion' } as any,
                Disciplina: { Id: 1, Nombre: 'Metacreatividad' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 86, Clase: 'Teúrgo arcano', Nivel: 0, Espontaneo: false }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: false,
            } as any,
            {
                Id: 1403,
                Nombre: 'Maligno',
                Arcano: true,
                Escuela: { Id: 1, Nombre: 'Abjuracion' } as any,
                Disciplina: { Id: 1, Nombre: 'Metacreatividad' } as any,
                Descriptores: [{ Id: 1, Nombre: 'Maligno' }],
                Nivel_clase: [{ Id_clase: 86, Clase: 'Teúrgo arcano', Nivel: 0, Espontaneo: false }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
            {
                Id: 1404,
                Nombre: 'Escuela prohibida',
                Arcano: true,
                Escuela: { Id: 2, Nombre: 'Evocacion' } as any,
                Disciplina: { Id: 1, Nombre: 'Metacreatividad' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 86, Clase: 'Teúrgo arcano', Nivel: 0, Espontaneo: false }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
            {
                Id: 1405,
                Nombre: 'Disciplina prohibida',
                Arcano: true,
                Escuela: { Id: 1, Nombre: 'Abjuracion' } as any,
                Disciplina: { Id: 9, Nombre: 'Telepatia' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 86, Clase: 'Teúrgo arcano', Nivel: 0, Espontaneo: false }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
        ]);

        service.aplicarSiguienteNivelClase(claseFiltrada);
        const disponibles = service.filtrarConjurosDisponibles();
        expect(disponibles.map((c) => c.Nombre)).toEqual(['Valido']);
    });

    it('getEspecialidadMagicaPendiente solo dispara con flag, tipo válido y nivel 1', () => {
        const claseArcana = crearClaseBase({
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                puede_elegir_especialidad: true,
            },
        });
        const claseSinFlag = crearClaseBase({
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                puede_elegir_especialidad: false,
            },
        });
        const claseSinTipo = crearClaseBase({
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: false,
                Psionicos: false,
                puede_elegir_especialidad: true,
            },
        });

        expect(service.getEspecialidadMagicaPendiente(claseArcana, 1)).toEqual({
            requiereArcano: true,
            requierePsionico: false,
        });
        expect(service.getEspecialidadMagicaPendiente(claseArcana, 2)).toBeNull();
        expect(service.getEspecialidadMagicaPendiente(claseSinFlag, 1)).toBeNull();
        expect(service.getEspecialidadMagicaPendiente(claseSinTipo, 1)).toBeNull();
    });

    it('arcano permite no especializarse y limpia prohibidas', () => {
        const claseArcana = crearClaseBase({
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                puede_elegir_especialidad: true,
            },
        });
        service.PersonajeCreacion.Escuela_especialista = { Nombre: 'Abjuracion', Calificativo: 'Abjurador' };
        service.PersonajeCreacion.Escuelas_prohibidas = [{ Nombre: 'Evocacion' }];

        const res = service.aplicarEspecialidadMagicaClase(
            claseArcana,
            1,
            {
                arcana: {
                    especializar: false,
                    escuelaEspecialistaId: null,
                    escuelasProhibidasIds: [],
                },
            },
            [],
            []
        );

        expect(res.aplicado).toBeTrue();
        expect(service.PersonajeCreacion.Escuela_especialista).toEqual({
            Nombre: 'Cualquiera',
            Calificativo: 'Cualquiera',
        });
        expect(service.PersonajeCreacion.Escuelas_prohibidas).toEqual([]);
    });

    it('arcano especializado valida escuela (>0), conteo de prohibidas y regla de Adivinación', () => {
        const claseArcana = crearClaseBase({
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                puede_elegir_especialidad: true,
            },
        });
        const escuelasCatalogo = [
            { Id: -1, Nombre: 'Universal', Nombre_especial: '', Prohibible: false },
            { Id: 0, Nombre: 'Placeholder', Nombre_especial: '', Prohibible: false },
            { Id: 1, Nombre: 'Adivinacion', Nombre_especial: 'Adivino', Prohibible: false },
            { Id: 2, Nombre: 'Abjuracion', Nombre_especial: 'Abjurador', Prohibible: true },
            { Id: 3, Nombre: 'Evocacion', Nombre_especial: 'Evocador', Prohibible: true },
            { Id: 4, Nombre: 'Nigromancia', Nombre_especial: 'Nigromante', Prohibible: true },
        ] as any;

        const invalida = service.aplicarEspecialidadMagicaClase(
            claseArcana,
            1,
            {
                arcana: {
                    especializar: true,
                    escuelaEspecialistaId: 0,
                    escuelasProhibidasIds: [3, 4],
                },
            },
            escuelasCatalogo,
            []
        );
        expect(invalida.aplicado).toBeFalse();

        const generalOk = service.aplicarEspecialidadMagicaClase(
            claseArcana,
            1,
            {
                arcana: {
                    especializar: true,
                    escuelaEspecialistaId: 2,
                    escuelasProhibidasIds: [3, 4],
                },
            },
            escuelasCatalogo,
            []
        );
        expect(generalOk.aplicado).toBeTrue();
        expect(service.PersonajeCreacion.Escuela_especialista.Nombre).toBe('Abjuracion');
        expect(service.PersonajeCreacion.Escuelas_prohibidas).toEqual([{ Nombre: 'Evocacion' }, { Nombre: 'Nigromancia' }]);

        const adivinacionNuncaProhibida = service.aplicarEspecialidadMagicaClase(
            claseArcana,
            1,
            {
                arcana: {
                    especializar: true,
                    escuelaEspecialistaId: 2,
                    escuelasProhibidasIds: [1, 3],
                },
            },
            escuelasCatalogo,
            []
        );
        expect(adivinacionNuncaProhibida.aplicado).toBeFalse();

        const adivinacionEspecialistaOk = service.aplicarEspecialidadMagicaClase(
            claseArcana,
            1,
            {
                arcana: {
                    especializar: true,
                    escuelaEspecialistaId: 1,
                    escuelasProhibidasIds: [2],
                },
            },
            escuelasCatalogo,
            []
        );
        expect(adivinacionEspecialistaOk.aplicado).toBeTrue();
        expect(service.PersonajeCreacion.Escuela_especialista.Nombre).toBe('Adivinacion');
        expect(service.PersonajeCreacion.Escuelas_prohibidas).toEqual([{ Nombre: 'Abjuracion' }]);
    });

    it('psiónico exige disciplina especialista y una prohibida distinta', () => {
        const clasePsionica = crearClaseBase({
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Psionicos: true,
                puede_elegir_especialidad: true,
            },
        });
        const disciplinasCatalogo = [
            { Id: 1, Nombre: 'Metacreatividad', Nombre_especial: 'Metacreador', Subdisciplinas: [] },
            { Id: 2, Nombre: 'Psicoquinesis', Nombre_especial: 'Psicoquineta', Subdisciplinas: [] },
        ] as any;

        const invalida = service.aplicarEspecialidadMagicaClase(
            clasePsionica,
            1,
            {
                psionica: {
                    disciplinaEspecialistaId: 1,
                    disciplinaProhibidaId: 1,
                },
            },
            [],
            disciplinasCatalogo
        );
        expect(invalida.aplicado).toBeFalse();

        const valida = service.aplicarEspecialidadMagicaClase(
            clasePsionica,
            1,
            {
                psionica: {
                    disciplinaEspecialistaId: 1,
                    disciplinaProhibidaId: 2,
                },
            },
            [],
            disciplinasCatalogo
        );
        expect(valida.aplicado).toBeTrue();
        expect(service.PersonajeCreacion.Disciplina_especialista.Nombre).toBe('Metacreatividad');
        expect(service.PersonajeCreacion.Disciplina_prohibida).toBe('Psicoquinesis');
    });

    it('mixto requiere completar bloque arcano y psiónico', () => {
        const claseMixta = crearClaseBase({
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                Psionicos: true,
                puede_elegir_especialidad: true,
            },
        });
        const escuelasCatalogo = [
            { Id: 1, Nombre: 'Adivinacion', Nombre_especial: 'Adivino', Prohibible: false },
            { Id: 2, Nombre: 'Abjuracion', Nombre_especial: 'Abjurador', Prohibible: true },
            { Id: 3, Nombre: 'Evocacion', Nombre_especial: 'Evocador', Prohibible: true },
            { Id: 4, Nombre: 'Nigromancia', Nombre_especial: 'Nigromante', Prohibible: true },
        ] as any;
        const disciplinasCatalogo = [
            { Id: 1, Nombre: 'Metacreatividad', Nombre_especial: 'Metacreador', Subdisciplinas: [] },
            { Id: 2, Nombre: 'Psicoquinesis', Nombre_especial: 'Psicoquineta', Subdisciplinas: [] },
        ] as any;

        const incompleta = service.aplicarEspecialidadMagicaClase(
            claseMixta,
            1,
            {
                arcana: {
                    especializar: false,
                    escuelaEspecialistaId: null,
                    escuelasProhibidasIds: [],
                },
            },
            escuelasCatalogo,
            disciplinasCatalogo
        );
        expect(incompleta.aplicado).toBeFalse();

        const completa = service.aplicarEspecialidadMagicaClase(
            claseMixta,
            1,
            {
                arcana: {
                    especializar: true,
                    escuelaEspecialistaId: 2,
                    escuelasProhibidasIds: [3, 4],
                },
                psionica: {
                    disciplinaEspecialistaId: 1,
                    disciplinaProhibidaId: 2,
                },
            },
            escuelasCatalogo,
            disciplinasCatalogo
        );
        expect(completa.aplicado).toBeTrue();
    });

    it('refrescarSesionConjurosPorEspecialidad recalcula elegibles con prohibidas nuevas', () => {
        const claseArcana = crearClaseBase({
            Id: 920,
            Nombre: 'Especialista arcano',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                Conocidos_total: true,
                puede_elegir_especialidad: true,
                Listado: [
                    { Id: 5001, Nombre: 'Escudo', Nivel: 0, Espontaneo: false },
                    { Id: 5002, Nombre: 'Proyectil mágico', Nivel: 0, Espontaneo: false },
                ],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 1,
                Dotes: [],
                Especiales: [],
            }],
        });
        service.setCatalogoClases([claseArcana]);
        service.setCatalogoConjuros([
            {
                Id: 5001,
                Nombre: 'Escudo',
                Arcano: true,
                Divino: false,
                Psionico: false,
                Alma: false,
                Escuela: { Id: 2, Nombre: 'Abjuracion' } as any,
                Disciplina: { Id: 0, Nombre: '' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 920, Clase: 'Especialista arcano', Nivel: 0, Espontaneo: false }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
            {
                Id: 5002,
                Nombre: 'Proyectil mágico',
                Arcano: true,
                Divino: false,
                Psionico: false,
                Alma: false,
                Escuela: { Id: 3, Nombre: 'Evocacion' } as any,
                Disciplina: { Id: 0, Nombre: '' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 920, Clase: 'Especialista arcano', Nivel: 0, Espontaneo: false }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
        ]);

        const aplicadoNivel = service.aplicarSiguienteNivelClase(claseArcana);
        expect(aplicadoNivel.aplicado).toBeTrue();
        expect(service.getConjurosSesionActual().activa).toBeTrue();
        expect(service.filtrarConjurosDisponibles().map((c) => c.Nombre).sort()).toEqual(['Escudo', 'Proyectil mágico']);

        const escuelasCatalogo = [
            { Id: 1, Nombre: 'Adivinacion', Nombre_especial: 'Adivino', Prohibible: false },
            { Id: 2, Nombre: 'Abjuracion', Nombre_especial: 'Abjurador', Prohibible: true },
            { Id: 3, Nombre: 'Evocacion', Nombre_especial: 'Evocador', Prohibible: true },
            { Id: 4, Nombre: 'Nigromancia', Nombre_especial: 'Nigromante', Prohibible: true },
        ] as any;

        const aplicadoEspecialidad = service.aplicarEspecialidadMagicaClase(
            claseArcana,
            1,
            {
                arcana: {
                    especializar: true,
                    escuelaEspecialistaId: 2,
                    escuelasProhibidasIds: [3, 4],
                },
            },
            escuelasCatalogo,
            []
        );
        expect(aplicadoEspecialidad.aplicado).toBeTrue();

        service.refrescarSesionConjurosPorEspecialidad();
        expect(service.filtrarConjurosDisponibles().map((c) => c.Nombre)).toEqual(['Escudo']);
    });

    it('filtro de conjuros interpreta Escuelas_prohibidas como string[]', () => {
        service.PersonajeCreacion.Escuelas_prohibidas = ['Evocacion'];

        const claseArcana = crearClaseBase({
            Id: 921,
            Nombre: 'Filtrado por string',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                Conocidos_total: true,
                Listado: [
                    { Id: 5011, Nombre: 'Armadura de mago', Nivel: 0, Espontaneo: false },
                    { Id: 5012, Nombre: 'Manos ardientes', Nivel: 0, Espontaneo: false },
                ],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 1,
                Dotes: [],
                Especiales: [],
            }],
        });
        service.setCatalogoClases([claseArcana]);
        service.setCatalogoConjuros([
            {
                Id: 5011,
                Nombre: 'Armadura de mago',
                Arcano: true,
                Escuela: { Id: 2, Nombre: 'Abjuracion' } as any,
                Disciplina: { Id: 0, Nombre: '' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 921, Clase: 'Filtrado por string', Nivel: 0, Espontaneo: false }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
            {
                Id: 5012,
                Nombre: 'Manos ardientes',
                Arcano: true,
                Escuela: { Id: 3, Nombre: 'Evocacion' } as any,
                Disciplina: { Id: 0, Nombre: '' } as any,
                Descriptores: [],
                Nivel_clase: [{ Id_clase: 921, Clase: 'Filtrado por string', Nivel: 0, Espontaneo: false }],
                Nivel_dominio: [],
                Nivel_disciplinas: [],
                Oficial: true,
            } as any,
        ]);

        service.aplicarSiguienteNivelClase(claseArcana);
        expect(service.filtrarConjurosDisponibles().map((c) => c.Nombre)).toEqual(['Armadura de mago']);
    });

    it('solicita y aplica dominios al subir primer nivel de clase con dominio', () => {
        const claseConDominio = crearClaseBase({
            Id: 90,
            Nombre: 'Clérigo',
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Divinos: true,
                Dominio: true,
                Dominio_cantidad: 1,
            },
        });
        service.setCatalogoClases([claseConDominio]);

        const pendiente = service.obtenerDominiosPendientesSiguienteNivelClase(claseConDominio);
        expect(pendiente).toBeTruthy();
        expect(pendiente?.cantidad).toBe(1);
        expect((pendiente?.opciones ?? []).some((op) => op.nombre === 'Guerra')).toBeTrue();

        const res = service.aplicarSiguienteNivelClase(claseConDominio, null, [2]);
        expect(res.aplicado).toBeTrue();
        expect(service.PersonajeCreacion.Dominios.some((dom) => dom.Nombre === 'Guerra')).toBeTrue();
    });

    it('evalúa prerrequisito de dominio en elegibilidad de clase', () => {
        const claseConPrereqDominio = crearClaseBase({
            Id: 91,
            Nombre: 'Sacerdote de guerra',
            Prerrequisitos_flags: {
                dominio: true,
            },
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
                dominio: [{ Id_dominio: 2, opcional: 0 }],
            },
        });
        service.setCatalogoClases([claseConPrereqDominio]);

        const antes = service.evaluarClaseParaSeleccion(claseConPrereqDominio);
        expect(antes.estado).toBe('blocked_failed');

        service.PersonajeCreacion.Dominios.push({ Nombre: 'Guerra' });
        const despues = service.evaluarClaseParaSeleccion(claseConPrereqDominio);
        expect(despues.estado).toBe('eligible');
    });
});

describe('NuevoPersonajeService (familiar)', () => {
    function crearEspecialNivel(idEspecial: number, nombre: string) {
        return {
            Especial: { Id: idEspecial, Nombre: nombre },
            Nivel: 1,
            Id_extra: -1,
            Extra: '',
            Opcional: 0,
            Id_interno: idEspecial,
            Id_especial_requerido: 0,
            Id_dote_requerida: 0,
        };
    }

    function crearFamiliarSeleccionable(idFamiliar: number, nombre = 'Cuervo'): any {
        return {
            Id: idFamiliar + 500,
            Id_familiar: idFamiliar,
            Nombre: nombre,
            Plantilla: { Id: 1, Nombre: 'Basica' },
            Manual: { Id: 1, Nombre: 'Manual base', Pagina: 20 },
            Niveles_clase: [],
            Alineamientos_requeridos: { Familiar: [], Companero: [] },
            Oficial: true,
        };
    }

    function crearCompaneroSeleccionable(idCompanero: number, nombre = 'Lobo', plantilla = 1): any {
        return {
            Id: idCompanero + 700,
            Id_companero: idCompanero,
            Nombre: nombre,
            Plantilla: { Id: plantilla, Nombre: plantilla === 2 ? 'Elevado' : (plantilla === 3 ? 'Sabandija' : 'Base') },
            Manual: { Id: 1, Nombre: 'Manual base', Pagina: 20 },
            Niveles_clase: [],
            Alineamientos_requeridos: { Familiar: [], Companero: [] },
            Oficial: true,
            Caracteristicas: {
                Fuerza: 12,
                Destreza: 14,
                Constitucion: 10,
                Inteligencia: 2,
                Sabiduria: 10,
                Carisma: 6,
            },
            Defensa: {
                Ca: 14,
                Toque: 12,
                Desprevenido: 12,
                Armadura_natural: 2,
                Reduccion_dano: '',
                Resistencia_conjuros: '',
                Resistencia_elemental: '',
            },
            Dotes: [],
            Especiales: [],
        };
    }

    it('getEstadoCuposFamiliarEspecial47 calcula fuentes, cupos y nivel lanzador', () => {
        const svc = new NuevoPersonajeService();
        const claseMago = crearClaseBase({
            Id: 10,
            Nombre: 'Mago',
            Desglose_niveles: [
                {
                    Nivel: 1,
                    Ataque_base: '+0',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock(),
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 0,
                    Dotes: [],
                    Especiales: [crearEspecialNivel(47, 'Convocar a un familiar')],
                },
            ],
        });
        const claseGuerrero = crearClaseBase({ Id: 11, Nombre: 'Guerrero' });

        svc.setCatalogoClases([claseMago, claseGuerrero]);
        svc.PersonajeCreacion.desgloseClases = [
            { Nombre: 'Mago', Nivel: 5 } as any,
            { Nombre: 'Guerrero', Nivel: 3 } as any,
        ];
        svc.PersonajeCreacion.Familiares = [crearFamiliarSeleccionable(900)];

        const estado = svc.getEstadoCuposFamiliarEspecial47();
        expect(estado.fuentesClaseIds).toEqual([10]);
        expect(estado.fuentesTotales).toBe(1);
        expect(estado.cuposConsumidos).toBe(1);
        expect(estado.cuposDisponibles).toBe(0);
        expect(estado.nivelLanzadorFamiliar).toBe(5);
    });

    it('registrarFamiliarSeleccionado agrega familiar y aplica 17, 81, 82 y 83 si corresponde', () => {
        const svc = new NuevoPersonajeService();
        const claseMago = crearClaseBase({
            Id: 10,
            Nombre: 'Mago',
            Desglose_niveles: [
                {
                    Nivel: 1,
                    Ataque_base: '+0',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock(),
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 0,
                    Dotes: [],
                    Especiales: [crearEspecialNivel(47, 'Convocar a un familiar')],
                },
            ],
        });
        svc.setCatalogoClases([claseMago]);
        svc.PersonajeCreacion.desgloseClases = [{ Nombre: 'Mago', Nivel: 4 } as any];

        const resultado = svc.registrarFamiliarSeleccionado(
            crearFamiliarSeleccionable(1001, 'Cuervo'),
            1,
            {
                81: 'Empatia vinculada',
                82: 'Vinculo de alerta',
                83: 'Mensajero',
                87: 'Transferencia de hechizo',
            },
            'Familiar de Aldric'
        );

        expect(resultado.registrado).toBeTrue();
        expect(resultado.dote17Agregada).toBeTrue();
        expect(resultado.especialesAgregadosIds).toContain(81);
        expect(resultado.especialesAgregadosIds).toContain(82);
        expect(resultado.especialesAgregadosIds).toContain(83);
        expect(resultado.especialesAgregadosIds).not.toContain(87);
        expect(svc.PersonajeCreacion.Familiares.length).toBe(1);
        expect(svc.PersonajeCreacion.Familiares[0].Plantilla.Id).toBe(1);
        expect(svc.PersonajeCreacion.Familiares[0].Nombre).toBe('Familiar de Aldric');
        expect(svc.PersonajeCreacion.DotesContextuales.some((d) => d.Dote?.Id === 17)).toBeTrue();
    });

    it('registrarFamiliarSeleccionado respeta umbrales de plantilla draconica', () => {
        const svc = new NuevoPersonajeService();
        const claseMago = crearClaseBase({
            Id: 10,
            Nombre: 'Mago',
            Desglose_niveles: [
                {
                    Nivel: 1,
                    Ataque_base: '+0',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock(),
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 0,
                    Dotes: [],
                    Especiales: [crearEspecialNivel(47, 'Convocar a un familiar')],
                },
            ],
        });
        svc.setCatalogoClases([claseMago]);
        svc.PersonajeCreacion.desgloseClases = [{ Nombre: 'Mago', Nivel: 9 } as any];

        const resultado = svc.registrarFamiliarSeleccionado(
            crearFamiliarSeleccionable(1002, 'Pseudodragon'),
            2,
            { 81: 'E81', 82: 'E82', 83: 'E83', 87: 'E87' }
        );

        expect(resultado.registrado).toBeTrue();
        expect(resultado.especialesAgregadosIds).toContain(83);
        expect(resultado.especialesAgregadosIds).not.toContain(87);
    });

    it('registrarFamiliarSeleccionado rechaza duplicados y falta de cupo', () => {
        const svc = new NuevoPersonajeService();
        const claseMago = crearClaseBase({
            Id: 10,
            Nombre: 'Mago',
            Desglose_niveles: [
                {
                    Nivel: 1,
                    Ataque_base: '+0',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock(),
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 0,
                    Dotes: [],
                    Especiales: [crearEspecialNivel(47, 'Convocar a un familiar')],
                },
            ],
        });
        const claseBrujo = crearClaseBase({
            Id: 11,
            Nombre: 'Brujo',
            Desglose_niveles: [
                {
                    Nivel: 1,
                    Ataque_base: '+0',
                    Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                    Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                    Reserva_psionica: 0,
                    Aumentos_clase_lanzadora: [],
                    Conjuros_diarios: crearConjurosDiariosMock(),
                    Conjuros_conocidos_nivel_a_nivel: {},
                    Conjuros_conocidos_total: 0,
                    Dotes: [],
                    Especiales: [crearEspecialNivel(47, 'Convocar a un familiar')],
                },
            ],
        });
        svc.setCatalogoClases([claseMago, claseBrujo]);
        svc.PersonajeCreacion.desgloseClases = [{ Nombre: 'Mago', Nivel: 5 } as any];
        svc.PersonajeCreacion.desgloseClases.push({ Nombre: 'Brujo', Nivel: 1 } as any);
        const familiar = crearFamiliarSeleccionable(1003, 'Huron');

        const primera = svc.registrarFamiliarSeleccionado(familiar, 1, {});
        const segunda = svc.registrarFamiliarSeleccionado(familiar, 1, {});

        expect(primera.registrado).toBeTrue();
        expect(segunda.registrado).toBeFalse();
        expect((segunda.razon ?? '').toLowerCase()).toContain('misma plantilla');

        const svcSinFuente = new NuevoPersonajeService();
        const sinCupo = svcSinFuente.registrarFamiliarSeleccionado(
            crearFamiliarSeleccionable(1004, 'Sapo'),
            1,
            {}
        );
        expect(sinCupo.registrado).toBeFalse();
        expect((sinCupo.razon ?? '').toLowerCase()).toContain('cupos');
    });

    it('tieneCompaneroPendienteSinSelector depende de cupos reales', () => {
        const svc = new NuevoPersonajeService();
        const claseDruida = crearClaseBase({
            Id: 5,
            Nombre: 'Druida',
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock(),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [crearEspecialNivel(29, 'Compañero animal')],
            }],
        });
        svc.setCatalogoClases([claseDruida]);
        svc.PersonajeCreacion.desgloseClases = [{ Nombre: 'Druida', Nivel: 1 } as any];
        svc.PersonajeCreacion.Companeros = [];

        expect(svc.tieneCompaneroPendienteSinSelector()).toBeTrue();

        svc.PersonajeCreacion.Companeros = [crearCompaneroSeleccionable(1, 'Lobo')];
        expect(svc.tieneCompaneroPendienteSinSelector()).toBeFalse();
    });

    it('getEstadoCuposCompaneroEspecial29 calcula fuentes, cupos y nivel efectivo', () => {
        const svc = new NuevoPersonajeService();
        const druida = crearClaseBase({
            Id: 5,
            Nombre: 'Druida',
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock(),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [crearEspecialNivel(29, 'Compañero animal')],
            }],
        });
        const ranger = crearClaseBase({
            Id: 6,
            Nombre: 'Ranger',
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+1',
                Salvaciones: { Fortaleza: '+2', Reflejos: '+2', Voluntad: '+0' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock(),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [crearEspecialNivel(29, 'Compañero animal')],
            }],
        });
        svc.setCatalogoClases([druida, ranger]);
        svc.PersonajeCreacion.desgloseClases = [
            { Nombre: 'Druida', Nivel: 4 } as any,
            { Nombre: 'Ranger', Nivel: 5 } as any,
        ];

        const estado = svc.getEstadoCuposCompaneroEspecial29();
        expect(estado.fuentesClaseIds.sort((a, b) => a - b)).toEqual([5, 6]);
        expect(estado.fuentesTotales).toBe(2);
        expect(estado.cuposDisponibles).toBe(2);
        expect(estado.nivelEfectivoCompanero).toBe(6); // 4 + floor(5/2)
    });

    it('registrarCompaneroSeleccionado aplica beneficios y rechaza duplicados', () => {
        const svc = new NuevoPersonajeService();
        const druida = crearClaseBase({
            Id: 5,
            Nombre: 'Druida',
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+2', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock(),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [crearEspecialNivel(29, 'Compañero animal')],
            }],
        });
        const bestiario = crearClaseBase({
            Id: 30,
            Nombre: 'Bestiario',
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock(),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 0,
                Dotes: [],
                Especiales: [crearEspecialNivel(29, 'Compañero animal')],
            }],
        });
        svc.setCatalogoClases([druida, bestiario]);
        svc.PersonajeCreacion.desgloseClases = [
            { Nombre: 'Druida', Nivel: 15 } as any,
            { Nombre: 'Bestiario', Nivel: 1 } as any,
        ];
        svc.setCatalogoDotes([{
            Id: 49,
            Nombre: 'Evasión mejorada',
            Descripcion: '',
            Beneficio: '',
            Normal: '',
            Especial: '',
            Manual: { Id: 0, Nombre: '', Pagina: 0 },
            Tipos: [],
            Repetible: 0,
            Repetible_distinto_extra: 0,
            Repetible_comb: 0,
            Comp_arma: 0,
            Oficial: true,
            Extras_soportados: {
                Extra_arma: 0,
                Extra_armadura: 0,
                Extra_escuela: 0,
                Extra_habilidad: 0,
            },
            Extras_disponibles: {
                Armas: [],
                Armaduras: [],
                Escuelas: [],
                Habilidades: [],
            },
            Modificadores: {},
            Prerrequisitos: {},
        } as any]);

        const primero = svc.registrarCompaneroSeleccionado(
            crearCompaneroSeleccionable(100, 'Lobo', 1),
            'base',
            { 157: 'Compañero animal', 158: 'Vínculo con compañero', 159: 'Devoción', 57: 'Vínculo maestro' },
            'Compañero de Aldric'
        );
        const segundo = svc.registrarCompaneroSeleccionado(
            crearCompaneroSeleccionable(100, 'Lobo', 1),
            'base',
            {}
        );

        expect(primero.registrado).toBeTrue();
        expect(primero.dote49Agregada).toBeTrue();
        expect(primero.especialesAgregadosIds).toContain(157);
        expect(primero.especialesAgregadosIds).toContain(158);
        expect(primero.especialesAgregadosIds).toContain(159);
        expect(primero.especialesAgregadosIds).toContain(57);
        expect(primero.bonosAplicados.dgAdi).toBe(10);
        expect(primero.bonosAplicados.trucosAdi).toBe(6);
        expect(svc.PersonajeCreacion.Companeros.length).toBe(1);
        expect(svc.PersonajeCreacion.Companeros[0].Nombre).toBe('Compañero de Aldric');
        expect(segundo.registrado).toBeFalse();
        expect((segundo.razon ?? '').toLowerCase()).toContain('misma plantilla');
    });
});

describe('NuevoPersonajeService (habilidades flujo)', () => {
    function crearRazaConDgs(partial?: Partial<Raza>): Raza {
        return {
            Id: 1,
            Nombre: 'Raza base',
            Ajuste_nivel: 0,
            Manual: 'Manual',
            Clase_predilecta: '',
            Modificadores: {
                Fuerza: 0,
                Destreza: 0,
                Constitucion: 0,
                Inteligencia: 0,
                Sabiduria: 0,
                Carisma: 0,
            },
            Alineamiento: {
                Id: 0,
                Basico: { Id_basico: 0, Nombre: 'No aplica' },
                Ley: { Id_ley: 0, Nombre: 'No aplica' },
                Moral: { Id_moral: 0, Nombre: 'No aplica' },
                Prioridad: { Id_prioridad: 0, Nombre: 'No aplica' },
                Descripcion: '',
            },
            Oficial: true,
            Ataques_naturales: '',
            Tamano: { Id: 1, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 } as any,
            Dgs_adicionales: {
                Cantidad: 2,
                Dado: 'd8',
                Tipo_criatura: 'Humanoide',
                Ataque_base: 0,
                Dotes_extra: 0,
                Puntos_habilidad: 2,
                Multiplicador_puntos_habilidad: 1,
                Fortaleza: 0,
                Reflejos: 0,
                Voluntad: 0,
            },
            Reduccion_dano: '',
            Resistencia_magica: '',
            Resistencia_energia: '',
            Heredada: false,
            Mutada: false,
            Tamano_mutacion_dependiente: false,
            Prerrequisitos: {
                actitud_prohibido: [],
                actitud_requerido: [],
                alineamiento_prohibido: [],
                alineamiento_requerido: [],
                tipo_criatura: [],
            },
            Armadura_natural: 0,
            Varios_armadura: 0,
            Correr: 30,
            Nadar: 0,
            Volar: 0,
            Maniobrabilidad: {
                Id: 0, Nombre: '-', Velocidad_avance: '-', Flotar: 0, Volar_atras: 0, Contramarcha: 0, Giro: '-', Rotacion: '-', Giro_max: '-', Angulo_ascenso: '-', Velocidad_ascenso: '-', Angulo_descenso: '-', Descenso_ascenso: 0,
            } as any,
            Trepar: 0,
            Escalar: 0,
            Altura_rango_inf: 1.7,
            Altura_rango_sup: 1.9,
            Peso_rango_inf: 60,
            Peso_rango_sup: 90,
            Edad_adulto: 20,
            Edad_mediana: 40,
            Edad_viejo: 60,
            Edad_venerable: 80,
            Espacio: 5,
            Alcance: 5,
            Tipo_criatura: {
                Id: 1,
                Nombre: 'Humanoide',
                Descripcion: '',
                Manual: '',
                Id_tipo_dado: 1,
                Tipo_dado: 8,
                Id_ataque: 1,
                Id_fortaleza: 1,
                Id_reflejos: 1,
                Id_voluntad: 1,
                Id_puntos_habilidad: 1,
                Come: true,
                Respira: true,
                Duerme: true,
                Recibe_criticos: true,
                Puede_ser_flanqueado: true,
                Pierde_constitucion: false,
                Limite_inteligencia: 0,
                Tesoro: '',
                Id_alineamiento: 0,
                Rasgos: [],
                Oficial: true,
            },
            Subtipos: [],
            Sortilegas: [],
            Raciales: [],
            Habilidades: { Base: [], Custom: [] },
            DotesContextuales: [],
            ...partial,
        } as unknown as Raza;
    }

    it('raza: calcula puntos con ModInt positivo y negativo', () => {
        const svc = new NuevoPersonajeService();
        const raza = crearRazaConDgs({
            Dgs_adicionales: {
                Cantidad: 2,
                Dado: 'd8',
                Tipo_criatura: 'Humanoide',
                Ataque_base: 0,
                Dotes_extra: 0,
                Puntos_habilidad: 2,
                Multiplicador_puntos_habilidad: 1,
                Fortaleza: 0,
                Reflejos: 0,
                Voluntad: 0,
            },
        } as any);
        svc.seleccionarRaza(raza);

        svc.PersonajeCreacion.ModInteligencia = 2;
        expect(svc.iniciarDistribucionHabilidadesPorRazaDG()).toBeTrue();
        expect(svc.EstadoFlujo.habilidades.puntosTotales).toBe(6);

        svc.cerrarDistribucionHabilidades();
        svc.PersonajeCreacion.ModInteligencia = -2;
        expect(svc.iniciarDistribucionHabilidadesPorRazaDG()).toBeTrue();
        expect(svc.EstadoFlujo.habilidades.puntosTotales).toBe(2);
    });

    it('plantillas: usa Suma_fija con mínimo 1 por plantilla con DG extra', () => {
        const svc = new NuevoPersonajeService();
        svc.seleccionarRaza(crearRazaConDgs());
        svc.agregarPlantillaSeleccion({
            Id: 100,
            Nombre: 'Plantilla A',
            Licantronia_dg: { Id_dado: 3, Dado: 'd8', Multiplicador: 1, Suma: 0 },
            Puntos_habilidad: { Suma: 0, Suma_fija: 0 },
            Habilidades: [],
        } as any);
        svc.agregarPlantillaSeleccion({
            Id: 101,
            Nombre: 'Plantilla B',
            Licantronia_dg: { Id_dado: 3, Dado: 'd8', Multiplicador: 2, Suma: 0 },
            Puntos_habilidad: { Suma: 0, Suma_fija: 2 },
            Habilidades: [],
        } as any);

        expect(svc.iniciarDistribucionHabilidadesPorPlantillasDG()).toBeTrue();
        expect(svc.EstadoFlujo.habilidades.puntosTotales).toBe(3);
    });

    it('clase: aplica x4 en nivel 1 y no en nivel > 1', () => {
        const svc = new NuevoPersonajeService();
        svc.seleccionarRaza(crearRazaConDgs());

        const clase = crearClaseBase({
            Id: 80,
            Nombre: 'Explorador',
            Puntos_habilidad: { Id: 1, Valor: 2 },
        });
        svc.setCatalogoClases([clase]);

        svc.iniciarDistribucionHabilidadesPorClase(clase, 1);
        expect(svc.EstadoFlujo.habilidades.puntosTotales).toBe(8);

        svc.cerrarDistribucionHabilidades();
        svc.iniciarDistribucionHabilidadesPorClase(clase, 2);
        expect(svc.EstadoFlujo.habilidades.puntosTotales).toBe(2);
    });

    it('clase sin lanzamiento: habilidades vuelve a dotes', () => {
        const svc = new NuevoPersonajeService();
        svc.seleccionarRaza(crearRazaConDgs());
        const clase = crearClaseBase({ Id: 82, Nombre: 'Guerrero', Puntos_habilidad: { Id: 1, Valor: 0 } });
        svc.setCatalogoClases([clase]);

        svc.aplicarSiguienteNivelClase(clase);
        svc.iniciarDistribucionHabilidadesPorClase(clase, 1);

        expect(svc.EstadoFlujo.habilidades.returnStep).toBe('dotes');
    });

    it('clase lanzadora: habilidades vuelve a conjuros cuando hay sesión activa', () => {
        const svc = new NuevoPersonajeService();
        svc.seleccionarRaza(crearRazaConDgs());
        const clase = crearClaseBase({
            Id: 83,
            Nombre: 'Aprendiz',
            Puntos_habilidad: { Id: 1, Valor: 0 },
            Conjuros: {
                ...crearClaseBase().Conjuros,
                Arcanos: true,
                Conocidos_total: true,
                Listado: [{ Id: 9001, Nombre: 'Luz', Nivel: 0, Espontaneo: true }],
            },
            Desglose_niveles: [{
                Nivel: 1,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Aumentos_clase_lanzadora: [],
                Conjuros_diarios: crearConjurosDiariosMock([0]),
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 1,
                Dotes: [],
                Especiales: [],
            }],
        });
        svc.setCatalogoClases([clase]);
        svc.setCatalogoConjuros([{
            Id: 9001,
            Nombre: 'Luz',
            Arcano: true,
            Escuela: { Id: 1, Nombre: 'Evocacion' } as any,
            Disciplina: { Id: 0, Nombre: '' } as any,
            Descriptores: [],
            Nivel_clase: [{ Id_clase: 83, Clase: 'Aprendiz', Nivel: 0, Espontaneo: true }],
            Nivel_dominio: [],
            Nivel_disciplinas: [],
            Oficial: true,
        } as any]);

        svc.aplicarSiguienteNivelClase(clase);
        svc.iniciarDistribucionHabilidadesPorClase(clase, 1);

        expect(svc.EstadoFlujo.habilidades.returnStep).toBe('conjuros');
    });

    it('límites de rangos: class skill = 3+nivelRef y no class = nivelRef+1', () => {
        const svc = new NuevoPersonajeService();
        svc.setCatalogoHabilidades([
            { Id_habilidad: 6, Nombre: 'Avistar', Id_caracteristica: 5, Caracteristica: 'Sabiduria', Descripcion: '', Soporta_extra: false, Entrenada: false, Extras: [] },
            { Id_habilidad: 7, Nombre: 'Nadar', Id_caracteristica: 2, Caracteristica: 'Destreza', Descripcion: '', Soporta_extra: false, Entrenada: false, Extras: [] },
        ]);
        const raza = crearRazaConDgs({
            Habilidades: {
                Base: [{ Id_habilidad: 6, Habilidad: 'Avistar', Cantidad: 1 }],
                Custom: [],
            },
        } as any);
        svc.seleccionarRaza(raza);

        expect(svc.iniciarDistribucionHabilidadesPorRazaDG()).toBeTrue();
        expect(svc.obtenerLimiteRangoHabilidad(6)).toBe(5);
        expect(svc.obtenerLimiteRangoHabilidad(7)).toBe(3);
    });

    it('habilidades entrenadas no cláseas no permiten subir rangos, pero sí si son cláseas', () => {
        const svcNoClasea = new NuevoPersonajeService();
        svcNoClasea.setCatalogoHabilidades([
            { Id_habilidad: 6, Nombre: 'Avistar', Id_caracteristica: 5, Caracteristica: 'Sabiduria', Descripcion: '', Soporta_extra: false, Entrenada: true, Extras: [] },
        ]);
        svcNoClasea.seleccionarRaza(crearRazaConDgs());
        svcNoClasea.iniciarDistribucionHabilidadesPorRazaDG();

        expect(svcNoClasea.ajustarRangoHabilidad(6, 1)).toBeFalse();

        const svcClasea = new NuevoPersonajeService();
        svcClasea.setCatalogoHabilidades([
            { Id_habilidad: 6, Nombre: 'Avistar', Id_caracteristica: 5, Caracteristica: 'Sabiduria', Descripcion: '', Soporta_extra: false, Entrenada: true, Extras: [] },
        ]);
        svcClasea.seleccionarRaza(crearRazaConDgs({
            Habilidades: {
                Base: [{ Id_habilidad: 6, Habilidad: 'Avistar', Cantidad: 1 }],
                Custom: [],
            },
        } as any));
        svcClasea.iniciarDistribucionHabilidadesPorRazaDG();

        expect(svcClasea.ajustarRangoHabilidad(6, 1)).toBeTrue();
    });

    it('no permite cerrar distribución si quedan puntos', () => {
        const svc = new NuevoPersonajeService();
        svc.seleccionarRaza(crearRazaConDgs());
        svc.iniciarDistribucionHabilidadesPorRazaDG();
        expect(svc.puedeCerrarDistribucionHabilidades()).toBeFalse();
        expect(svc.cerrarDistribucionHabilidades()).toBeNull();
    });

    it('bloquea cierre si una habilidad clásea con soporte de extra no tiene extra seleccionado', () => {
        const svc = new NuevoPersonajeService();
        svc.setCatalogoHabilidades([
            {
                Id_habilidad: 6,
                Nombre: 'Conocimiento arcano',
                Id_caracteristica: 4,
                Caracteristica: 'Inteligencia',
                Descripcion: '',
                Soporta_extra: true,
                Entrenada: false,
                Extras: [{ Id_extra: 1, Extra: 'Planos', Descripcion: '' }],
            },
        ]);
        svc.seleccionarRaza(crearRazaConDgs({
            Habilidades: {
                Base: [{ Id_habilidad: 6, Habilidad: 'Conocimiento arcano', Cantidad: 1 }],
                Custom: [],
            },
        } as any));
        svc.iniciarDistribucionHabilidadesPorRazaDG();
        svc.EstadoFlujo.habilidades.puntosRestantes = 0;

        expect(svc.puedeCerrarDistribucionHabilidades()).toBeFalse();
        expect(svc.setExtraHabilidad(6, 'Planos')).toBeTrue();
        expect(svc.puedeCerrarDistribucionHabilidades()).toBeTrue();
    });

    it('no bloquea cierre por extra pendiente en habilidades no cláseas', () => {
        const svc = new NuevoPersonajeService();
        svc.setCatalogoHabilidades([
            {
                Id_habilidad: 7,
                Nombre: 'Oficio',
                Id_caracteristica: 4,
                Caracteristica: 'Inteligencia',
                Descripcion: '',
                Soporta_extra: true,
                Entrenada: false,
                Extras: [{ Id_extra: 2, Extra: 'Alquimia', Descripcion: '' }],
            },
        ]);
        svc.seleccionarRaza(crearRazaConDgs());
        svc.iniciarDistribucionHabilidadesPorRazaDG();
        svc.EstadoFlujo.habilidades.puntosRestantes = 0;

        expect(svc.puedeCerrarDistribucionHabilidades()).toBeTrue();
    });

    it('no permite seleccionar extra en habilidades no cláseas', () => {
        const svc = new NuevoPersonajeService();
        svc.setCatalogoHabilidades([
            {
                Id_habilidad: 7,
                Nombre: 'Oficio',
                Id_caracteristica: 4,
                Caracteristica: 'Inteligencia',
                Descripcion: '',
                Soporta_extra: true,
                Entrenada: false,
                Extras: [{ Id_extra: 2, Extra: 'Alquimia', Descripcion: '' }],
            },
        ]);
        svc.seleccionarRaza(crearRazaConDgs());
        svc.iniciarDistribucionHabilidadesPorRazaDG();

        expect(svc.setExtraHabilidad(7, 'Alquimia')).toBeFalse();
    });

    it('bloquea edición de extra cuando la fuente lo trae predefinido', () => {
        const svc = new NuevoPersonajeService();
        svc.setCatalogoHabilidades([
            {
                Id_habilidad: 32,
                Nombre: 'Saber 1',
                Id_caracteristica: 4,
                Caracteristica: 'Inteligencia',
                Descripcion: '',
                Soporta_extra: true,
                Entrenada: false,
                Extras: [
                    { Id_extra: 1, Extra: 'Planos', Descripcion: '' },
                    { Id_extra: 2, Extra: 'Religion', Descripcion: '' },
                ],
            },
        ]);
        svc.seleccionarRaza(crearRazaConDgs({
            Habilidades: {
                Base: [{ Id_habilidad: 32, Habilidad: 'Saber 1', Extra: 'Religion', Cantidad: 1 }],
                Custom: [],
            },
        } as any));

        const habilidad = svc.PersonajeCreacion.Habilidades.find((h) => Number(h.Id) === 32);
        expect(habilidad?.Extra).toBe('Religion');
        expect(habilidad?.Extra_bloqueado).toBeTrue();

        svc.iniciarDistribucionHabilidadesPorRazaDG();
        expect(svc.setExtraHabilidad(32, 'Planos')).toBeFalse();
        expect(svc.PersonajeCreacion.Habilidades.find((h) => Number(h.Id) === 32)?.Extra).toBe('Religion');
    });

    it('prohíbe repetir extra en habilidades cláseas de la misma familia', () => {
        const svc = new NuevoPersonajeService();
        svc.setCatalogoHabilidades([
            {
                Id_habilidad: 2,
                Nombre: 'Artesania 1',
                Id_caracteristica: 4,
                Caracteristica: 'Inteligencia',
                Descripcion: '',
                Soporta_extra: true,
                Entrenada: false,
                Extras: [
                    { Id_extra: 1, Extra: 'Alquimia', Descripcion: '' },
                    { Id_extra: 2, Extra: 'Carpinteria', Descripcion: '' },
                ],
            },
            {
                Id_habilidad: 3,
                Nombre: 'Artesania 2',
                Id_caracteristica: 4,
                Caracteristica: 'Inteligencia',
                Descripcion: '',
                Soporta_extra: true,
                Entrenada: false,
                Extras: [
                    { Id_extra: 1, Extra: 'Alquimia', Descripcion: '' },
                    { Id_extra: 2, Extra: 'Carpinteria', Descripcion: '' },
                ],
            },
        ]);
        svc.seleccionarRaza(crearRazaConDgs({
            Habilidades: {
                Base: [
                    { Id_habilidad: 2, Habilidad: 'Artesania 1', Cantidad: 1 },
                    { Id_habilidad: 3, Habilidad: 'Artesania 2', Cantidad: 1 },
                ],
                Custom: [],
            },
        } as any));
        svc.iniciarDistribucionHabilidadesPorRazaDG();
        svc.EstadoFlujo.habilidades.puntosRestantes = 0;

        expect(svc.setExtraHabilidad(2, 'Alquimia')).toBeTrue();
        expect(svc.setExtraHabilidad(3, 'Alquimia')).toBeFalse();
        expect(svc.setExtraHabilidad(3, 'Carpinteria')).toBeTrue();
        expect(svc.puedeCerrarDistribucionHabilidades()).toBeTrue();
    });

    it('permite reutilizar extra entre Conocimiento y Saber porque no comparten familia', () => {
        const svc = new NuevoPersonajeService();
        svc.setCatalogoHabilidades([
            {
                Id_habilidad: 6,
                Nombre: 'Conocimiento de conjuros',
                Id_caracteristica: 4,
                Caracteristica: 'Inteligencia',
                Descripcion: '',
                Soporta_extra: true,
                Entrenada: false,
                Extras: [{ Id_extra: 1, Extra: 'Planos', Descripcion: '' }],
            },
            {
                Id_habilidad: 32,
                Nombre: 'Saber 1',
                Id_caracteristica: 4,
                Caracteristica: 'Inteligencia',
                Descripcion: '',
                Soporta_extra: true,
                Entrenada: false,
                Extras: [{ Id_extra: 1, Extra: 'Planos', Descripcion: '' }],
            },
        ]);
        svc.seleccionarRaza(crearRazaConDgs({
            Habilidades: {
                Base: [
                    { Id_habilidad: 6, Habilidad: 'Conocimiento de conjuros', Cantidad: 1 },
                    { Id_habilidad: 32, Habilidad: 'Saber 1', Cantidad: 1 },
                ],
                Custom: [],
            },
        } as any));
        svc.iniciarDistribucionHabilidadesPorRazaDG();
        svc.EstadoFlujo.habilidades.puntosRestantes = 0;

        expect(svc.setExtraHabilidad(32, 'Planos')).toBeTrue();
        expect(svc.setExtraHabilidad(6, 'Planos')).toBeTrue();
        expect(svc.puedeCerrarDistribucionHabilidades()).toBeTrue();
    });

    it('reparto manual actualiza Rangos y no Rangos_varios', () => {
        const svc = new NuevoPersonajeService();
        svc.setCatalogoHabilidades([
            { Id_habilidad: 6, Nombre: 'Avistar', Id_caracteristica: 5, Caracteristica: 'Sabiduria', Descripcion: '', Soporta_extra: false, Entrenada: false, Extras: [] },
        ]);
        svc.seleccionarRaza(crearRazaConDgs());
        svc.iniciarDistribucionHabilidadesPorRazaDG();

        expect(svc.ajustarRangoHabilidad(6, 1)).toBeTrue();
        const avistar = svc.PersonajeCreacion.Habilidades.find((h) => h.Id === 6);
        expect(avistar?.Rangos).toBe(1);
        expect(avistar?.Rangos_varios).toBe(0);
    });

    it('familias repetibles: artesanía reparte slots y pierde exceso sobre 3', () => {
        const svc = new NuevoPersonajeService();
        svc.setCatalogoHabilidades([
            { Id_habilidad: 2, Nombre: 'Artesania 1', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: true, Entrenada: false, Extras: [] },
            { Id_habilidad: 3, Nombre: 'Artesania 2', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: true, Entrenada: false, Extras: [] },
            { Id_habilidad: 4, Nombre: 'Artesania 3', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: true, Entrenada: false, Extras: [] },
        ]);
        svc.seleccionarRaza(crearRazaConDgs({
            Habilidades: {
                Base: [{ Id_habilidad: 2, Habilidad: 'Artesania 1', Cantidad: 1 }],
                Custom: [],
            },
        } as any));

        const clase = crearClaseBase({
            Id: 81,
            Nombre: 'Artesano',
            Habilidades: {
                Base: [
                    { Id_habilidad: 2, Habilidad: 'Artesania 1' },
                    { Id_habilidad: 2, Habilidad: 'Artesania 1' },
                    { Id_habilidad: 2, Habilidad: 'Artesania 1' },
                ],
                Custom: [],
            },
        });
        svc.setCatalogoClases([clase]);
        svc.aplicarSiguienteNivelClase(clase);

        const claseas = svc.PersonajeCreacion.Habilidades
            .filter((h) => [2, 3, 4].includes(Number(h.Id)) && h.Clasea);
        expect(claseas.length).toBe(3);
    });

    it('familia saberes ocupa Saber 1..5 aunque exista un Conocimiento de conjuros', () => {
        const svc = new NuevoPersonajeService();
        svc.setCatalogoHabilidades([
            { Id_habilidad: 6, Nombre: 'Conocimiento de conjuros', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: true, Entrenada: false, Extras: [] },
            { Id_habilidad: 32, Nombre: 'Saber 1', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: true, Entrenada: false, Extras: [] },
            { Id_habilidad: 33, Nombre: 'Saber 2', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: true, Entrenada: false, Extras: [] },
            { Id_habilidad: 34, Nombre: 'Saber 3', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: true, Entrenada: false, Extras: [] },
            { Id_habilidad: 35, Nombre: 'Saber 4', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: true, Entrenada: false, Extras: [] },
            { Id_habilidad: 36, Nombre: 'Saber 5', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: true, Entrenada: false, Extras: [] },
        ]);
        svc.seleccionarRaza(crearRazaConDgs({
            Habilidades: {
                Base: [{ Id_habilidad: 6, Habilidad: 'Conocimiento de conjuros', Cantidad: 1 }],
                Custom: [],
            },
        } as any));

        const clase = crearClaseBase({
            Id: 82,
            Nombre: 'Cazador de secretos',
            Habilidades: {
                Base: [
                    { Id_habilidad: 32, Habilidad: 'Saber 1' },
                    { Id_habilidad: 32, Habilidad: 'Saber 1' },
                    { Id_habilidad: 32, Habilidad: 'Saber 1' },
                    { Id_habilidad: 32, Habilidad: 'Saber 1' },
                    { Id_habilidad: 32, Habilidad: 'Saber 1' },
                ],
                Custom: [],
            },
        });

        const resultado = svc.aplicarSiguienteNivelClase(clase);
        expect(resultado.aplicado).toBeTrue();

        const saberesClaseos = svc.PersonajeCreacion.Habilidades
            .filter((h) => [32, 33, 34, 35, 36].includes(Number(h.Id)) && h.Clasea);
        expect(saberesClaseos.length).toBe(5);
        expect(saberesClaseos.some((h) => Number(h.Id) === 36)).toBeTrue();
    });

    it('raza no duplica slots de saberes cuando la misma referencia se repite', () => {
        const svc = new NuevoPersonajeService();
        svc.setCatalogoHabilidades([
            { Id_habilidad: 32, Nombre: 'Saber 1', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: true, Entrenada: false, Extras: [] },
            { Id_habilidad: 33, Nombre: 'Saber 2', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: true, Entrenada: false, Extras: [] },
            { Id_habilidad: 34, Nombre: 'Saber 3', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: true, Entrenada: false, Extras: [] },
            { Id_habilidad: 35, Nombre: 'Saber 4', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: true, Entrenada: false, Extras: [] },
            { Id_habilidad: 36, Nombre: 'Saber 5', Id_caracteristica: 4, Caracteristica: 'Inteligencia', Descripcion: '', Soporta_extra: true, Entrenada: false, Extras: [] },
        ]);
        svc.seleccionarRaza(crearRazaConDgs({
            Habilidades: {
                Base: [
                    { Id_habilidad: 32, Habilidad: 'Saber 1', Cantidad: 1 },
                    { Id_habilidad: 32, Habilidad: 'Saber 1', Cantidad: 2 },
                ],
                Custom: [],
            },
        } as any));

        const saberesClaseos = svc.PersonajeCreacion.Habilidades
            .filter((h) => [32, 33, 34, 35, 36].includes(Number(h.Id)) && h.Clasea);
        expect(saberesClaseos.length).toBe(1);
        expect(saberesClaseos[0].Id).toBe(32);
        expect(saberesClaseos[0].Rangos_varios).toBe(3);
    });
});

describe('NuevoPersonajeService (tipo y subtipos derivados)', () => {
    function crearTipo(id: number, nombre: string): TipoCriatura {
        return {
            Id: id,
            Nombre: nombre,
            Descripcion: `Tipo ${nombre}`,
            Manual: 'Manual test',
            Id_tipo_dado: 1,
            Tipo_dado: 8,
            Id_ataque: 1,
            Id_fortaleza: 1,
            Id_reflejos: 1,
            Id_voluntad: 1,
            Id_puntos_habilidad: 1,
            Come: true,
            Respira: true,
            Duerme: true,
            Recibe_criticos: true,
            Puede_ser_flanqueado: true,
            Pierde_constitucion: false,
            Limite_inteligencia: 0,
            Tesoro: 'Normal',
            Id_alineamiento: 0,
            Rasgos: [],
            Oficial: true,
        };
    }

    function crearRazaMock(tipo: TipoCriatura, subtipos: { Id: number; Nombre: string; }[]): Raza {
        return {
            Id: 1,
            Nombre: 'Raza base',
            Alineamiento: {
                Basico: { Nombre: 'Neutral autentico' },
            },
            Tipo_criatura: tipo,
            Subtipos: subtipos,
            Correr: 30,
            Nadar: 0,
            Volar: 0,
            Trepar: 0,
            Escalar: 0,
            Edad_adulto: 20,
            Altura_rango_inf: 1.7,
            Peso_rango_inf: 65,
            Heredada: false,
            Raciales: [],
            Habilidades: { Base: [], Custom: [] },
        } as unknown as Raza;
    }

    function crearPlantillaMock(partial?: Partial<Plantilla>): Plantilla {
        return {
            Id: 100,
            Nombre: 'Plantilla test',
            Descripcion: '',
            Manual: { Id: 1, Nombre: 'Manual', Pagina: 1 },
            Tamano: { Id: 0, Nombre: '-', Modificador: 0, Modificador_presa: 0 },
            Tipo_dado: { Id_tipo_dado: 0, Nombre: '' },
            Actualiza_dg: false,
            Modificacion_dg: { Id_paso_modificacion: 0, Nombre: '' },
            Modificacion_tamano: { Id_paso_modificacion: 0, Nombre: '' },
            Iniciativa: 0,
            Velocidades: '',
            Ca: '',
            Ataque_base: 0,
            Presa: 0,
            Ataques: '',
            Ataque_completo: '',
            Reduccion_dano: '',
            Resistencia_conjuros: '',
            Resistencia_elemental: '',
            Fortaleza: 0,
            Reflejos: 0,
            Voluntad: 0,
            Modificadores_caracteristicas: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
            Minimos_caracteristicas: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
            Ajuste_nivel: 0,
            Licantronia_dg: { Id_dado: 0, Dado: '', Multiplicador: 0, Suma: 0 },
            Cd: 0,
            Puntos_habilidad: { Suma: 0, Suma_fija: 0 },
            Nacimiento: false,
            Movimientos: { Correr: 0, Nadar: 0, Volar: 0, Trepar: 0, Escalar: 0 },
            Maniobrabilidad: {
                Id: 0,
                Nombre: '',
                Velocidad_avance: '',
                Flotar: 0,
                Volar_atras: 0,
                Contramarcha: 0,
                Giro: '',
                Rotacion: '',
                Giro_max: '',
                Angulo_ascenso: '',
                Velocidad_ascenso: '',
                Angulo_descenso: '',
                Descenso_ascenso: 0,
            },
            Alineamiento: {
                Id: 0,
                Basico: { Id_basico: 0, Nombre: '' },
                Ley: { Id_ley: 0, Nombre: '' },
                Moral: { Id_moral: 0, Nombre: '' },
                Prioridad: { Id_prioridad: 0, Nombre: '' },
                Descripcion: '',
            },
            Oficial: true,
            Dotes: [],
            Subtipos: [],
            Habilidades: [],
            Sortilegas: [],
            Prerrequisitos_flags: {
                actitud_requerido: false,
                actitud_prohibido: false,
                alineamiento_requerido: false,
                caracteristica: false,
                criaturas_compatibles: false,
            },
            Prerrequisitos: {
                actitud_requerido: [],
                actitud_prohibido: [],
                alineamiento_requerido: [],
                caracteristica: [],
                criaturas_compatibles: [],
            },
            Compatibilidad_tipos: [],
            ...partial,
        };
    }

    it('seleccionarRaza fija tipo y subtipos base', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, [{ Id: 11, Nombre: 'Humano' }]));

        expect(svc.PersonajeCreacion.Tipo_criatura.Id).toBe(1);
        expect(svc.PersonajeCreacion.Tipo_criatura.Nombre).toBe('Humanoide');
        expect(svc.PersonajeCreacion.Subtipos).toEqual([{ Id: 11, Nombre: 'Humano' }]);
    });

    it('seleccionarRaza mutada sin base no aplica cambios', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        const mutada = {
            ...crearRazaMock(tipoHumanoide, [{ Id: 11, Nombre: 'Humano' }]),
            Id: 77,
            Nombre: 'Mutada',
            Mutada: true,
            Mutacion: { Es_mutada: true },
        } as unknown as Raza;

        const aplicado = svc.seleccionarRaza(mutada);

        expect(aplicado).toBeFalse();
        expect(svc.RazaSeleccionada).toBeNull();
        expect(svc.PersonajeCreacion.Raza.Id).toBe(0);
        expect(svc.PersonajeCreacion.RazaBase).toBeNull();
    });

    it('seleccionarRaza mutada con base guarda RazaBase y aplica raza efectiva', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        const base = {
            ...crearRazaMock(tipoHumanoide, [{ Id: 11, Nombre: 'Humano' }]),
            Id: 10,
            Nombre: 'Humano base',
            Correr: 30,
            Modificadores: { Fuerza: 0, Destreza: 0, Constitucion: 0, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
            Dgs_adicionales: {
                Cantidad: 1,
                Dado: 'd8',
                Tipo_criatura: 'Humanoide',
                Ataque_base: 0,
                Dotes_extra: 0,
                Puntos_habilidad: 0,
                Multiplicador_puntos_habilidad: 1,
                Fortaleza: 0,
                Reflejos: 0,
                Voluntad: 0,
            },
        } as unknown as Raza;
        const mutada = {
            ...crearRazaMock(tipoHumanoide, [{ Id: 12, Nombre: 'Celestial' }]),
            Id: 20,
            Nombre: 'Mutada',
            Mutada: true,
            Mutacion: { Es_mutada: true },
            Correr: 40,
            Modificadores: { Fuerza: 4, Destreza: 0, Constitucion: 2, Inteligencia: 0, Sabiduria: 0, Carisma: 0 },
            Dgs_adicionales: {
                Cantidad: 2,
                Dado: 'd10',
                Tipo_criatura: 'Ajeno',
                Ataque_base: 0,
                Dotes_extra: 0,
                Puntos_habilidad: 0,
                Multiplicador_puntos_habilidad: 1,
                Fortaleza: 0,
                Reflejos: 0,
                Voluntad: 0,
            },
        } as unknown as Raza;

        const aplicado = svc.seleccionarRaza(mutada, base);

        expect(aplicado).toBeTrue();
        expect(svc.PersonajeCreacion.RazaBase?.Id).toBe(10);
        expect(svc.PersonajeCreacion.Raza.Id).toBe(20);
        expect(svc.PersonajeCreacion.Raza.Modificadores.Fuerza).toBe(4);
        expect(svc.PersonajeCreacion.Correr).toBe(40);
        expect(svc.PersonajeCreacion.Raza.Dgs_adicionales.Cantidad).toBe(3);
    });

    it('seleccionarRaza requiere resolver grupos de raciales opcionales', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        const raza = {
            ...crearRazaMock(tipoHumanoide, []),
            Id: 40,
            Nombre: 'Prole de bahamut',
            Raciales: [
                createRacialPlaceholder('Vision en la oscuridad', 1),
                {
                    ...createRacialPlaceholder('Linaje de cobre', 2),
                    Opcional: 1,
                },
                {
                    ...createRacialPlaceholder('Linaje de plata', 3),
                    Opcional: 1,
                },
            ],
        } as unknown as Raza;

        const sinSeleccion = svc.seleccionarRaza(raza);
        expect(sinSeleccion).toBeFalse();
        expect(svc.RazaSeleccionada).toBeNull();

        const aplicado = svc.seleccionarRaza(raza, null, { 1: 'id:3' });
        expect(aplicado).toBeTrue();
        expect(svc.PersonajeCreacion.Raciales.map((r) => r.Id)).toEqual([1, 3]);
    });

    it('seleccionar una raza no mutada limpia RazaBase tras una mutada', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);

        const base = {
            ...crearRazaMock(tipoHumanoide, [{ Id: 11, Nombre: 'Humano' }]),
            Id: 10,
            Nombre: 'Humano base',
        } as unknown as Raza;
        const mutada = {
            ...crearRazaMock(tipoHumanoide, [{ Id: 12, Nombre: 'Celestial' }]),
            Id: 20,
            Nombre: 'Mutada',
            Mutada: true,
            Mutacion: { Es_mutada: true },
        } as unknown as Raza;
        const noMutada = {
            ...crearRazaMock(tipoHumanoide, [{ Id: 13, Nombre: 'Terrestre' }]),
            Id: 30,
            Nombre: 'Enano',
            Mutada: false,
            Mutacion: { Es_mutada: false },
        } as unknown as Raza;

        svc.seleccionarRaza(mutada, base);
        expect(svc.PersonajeCreacion.RazaBase?.Id).toBe(10);

        svc.seleccionarRaza(noMutada);
        expect(svc.PersonajeCreacion.Raza.Id).toBe(30);
        expect(svc.PersonajeCreacion.RazaBase).toBeNull();
    });

    it('mutada + base + opcionales aplica raza efectiva y conserva RazaBase', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);

        const base = {
            ...crearRazaMock(tipoHumanoide, [{ Id: 11, Nombre: 'Humano' }]),
            Id: 10,
            Nombre: 'Humano base',
            Raciales: [createRacialPlaceholder('Base obligatoria', 1)],
        } as unknown as Raza;
        const mutada = {
            ...crearRazaMock(tipoHumanoide, [{ Id: 12, Nombre: 'Sangre de dragon' }]),
            Id: 20,
            Nombre: 'Prole de bahamut',
            Mutada: true,
            Mutacion: { Es_mutada: true },
            Raciales: [
                { ...createRacialPlaceholder('Linaje de cobre', 2), Opcional: 1 },
                { ...createRacialPlaceholder('Linaje de plata', 3), Opcional: 1 },
            ],
        } as unknown as Raza;

        const aplicado = svc.seleccionarRaza(mutada, base, { 1: 'id:2' });

        expect(aplicado).toBeTrue();
        expect(svc.PersonajeCreacion.RazaBase?.Id).toBe(10);
        expect(svc.PersonajeCreacion.Raza.Id).toBe(20);
        expect(svc.PersonajeCreacion.Raciales.map((r) => r.Id)).toEqual([1, 2]);
    });

    it('agregar plantilla que cambia tipo actualiza Personaje.Tipo_criatura', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        const tipoExterno = crearTipo(5, 'Extraplanar');
        svc.setCatalogoTiposCriatura([tipoHumanoide, tipoExterno]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, [{ Id: 11, Nombre: 'Humano' }]));

        svc.agregarPlantillaSeleccion(crearPlantillaMock({
            Id: 201,
            Nombre: 'Medio celestial',
            Compatibilidad_tipos: [{
                Id_tipo_comp: 1,
                Id_tipo_nuevo: 5,
                Tipo_comp: 'Humanoide',
                Tipo_nuevo: 'Extraplanar',
                Opcional: 0,
            }],
        }));

        expect(svc.PersonajeCreacion.Tipo_criatura.Id).toBe(5);
        expect(svc.PersonajeCreacion.Tipo_criatura.Nombre).toBe('Extraplanar');
        expect(svc.EstadoFlujo.plantillas.tipoCriaturaSimulada.Id).toBe(5);
    });

    it('subtipos: acumulativos con union deduplicada y restauracion al quitar', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, [{ Id: 11, Nombre: 'Humano' }]));

        const plantillaA = crearPlantillaMock({
            Id: 301,
            Nombre: 'Tocada por fuego',
            Subtipos: [{ Id: 21, Nombre: 'Fuego' }],
        });
        const plantillaB = crearPlantillaMock({
            Id: 302,
            Nombre: 'Tocada por frio',
            Subtipos: [{ Id: 22, Nombre: 'Frio' }],
        });

        svc.agregarPlantillaSeleccion(plantillaA);
        expect(svc.PersonajeCreacion.Subtipos).toEqual([
            { Id: 11, Nombre: 'Humano' },
            { Id: 21, Nombre: 'Fuego' },
        ]);

        svc.agregarPlantillaSeleccion(plantillaB);
        expect(svc.PersonajeCreacion.Subtipos).toEqual([
            { Id: 11, Nombre: 'Humano' },
            { Id: 21, Nombre: 'Fuego' },
            { Id: 22, Nombre: 'Frio' },
        ]);

        svc.quitarPlantillaSeleccion(302);
        expect(svc.PersonajeCreacion.Subtipos).toEqual([
            { Id: 11, Nombre: 'Humano' },
            { Id: 21, Nombre: 'Fuego' },
        ]);
    });

    it('plantillas confirmadas no se pueden quitar', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, [{ Id: 11, Nombre: 'Humano' }]));

        const plantilla = crearPlantillaMock({
            Id: 333,
            Nombre: 'Fijada',
        });
        svc.agregarPlantillaSeleccion(plantilla);
        svc.confirmarSeleccionActualPlantillas();

        svc.quitarPlantillaSeleccion(plantilla.Id);
        expect(svc.PersonajeCreacion.Plantillas.some((p) => p.Id === plantilla.Id)).toBeTrue();
        expect(svc.esPlantillaConfirmada(plantilla.Id)).toBeTrue();
    });

    it('retornoFinNivelPendiente de plantillas se consume una sola vez', () => {
        const svc = new NuevoPersonajeService();

        expect(svc.EstadoFlujo.plantillas.retornoFinNivelPendiente).toBeFalse();

        svc.setRetornoFinNivelPendientePlantillas(true);
        expect(svc.EstadoFlujo.plantillas.retornoFinNivelPendiente).toBeTrue();
        expect(svc.consumirRetornoFinNivelPendientePlantillas()).toBeTrue();
        expect(svc.EstadoFlujo.plantillas.retornoFinNivelPendiente).toBeFalse();
        expect(svc.consumirRetornoFinNivelPendientePlantillas()).toBeFalse();
    });

    it('limpiar selección elimina solo plantillas no confirmadas', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, [{ Id: 11, Nombre: 'Humano' }]));

        const plantillaFijada = crearPlantillaMock({
            Id: 334,
            Nombre: 'Fijada',
        });
        const plantillaTemporal = crearPlantillaMock({
            Id: 335,
            Nombre: 'Temporal',
        });

        svc.agregarPlantillaSeleccion(plantillaFijada);
        svc.confirmarSeleccionActualPlantillas();
        svc.agregarPlantillaSeleccion(plantillaTemporal);

        svc.limpiarPlantillasSeleccion();
        const idsRestantes = svc.PersonajeCreacion.Plantillas.map((p) => p.Id);
        expect(idsRestantes).toContain(plantillaFijada.Id);
        expect(idsRestantes).not.toContain(plantillaTemporal.Id);
    });

    it('limpiar plantillas restaura tipo y subtipos de la raza', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        const tipoExterno = crearTipo(5, 'Extraplanar');
        svc.setCatalogoTiposCriatura([tipoHumanoide, tipoExterno]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, [{ Id: 11, Nombre: 'Humano' }]));

        svc.agregarPlantillaSeleccion(crearPlantillaMock({
            Id: 401,
            Nombre: 'Medio celestial',
            Compatibilidad_tipos: [{
                Id_tipo_comp: 1,
                Id_tipo_nuevo: 5,
                Tipo_comp: 'Humanoide',
                Tipo_nuevo: 'Extraplanar',
                Opcional: 0,
            }],
            Subtipos: [{ Id: 41, Nombre: 'Celestial' }],
        }));

        expect(svc.PersonajeCreacion.Tipo_criatura.Id).toBe(5);
        expect(svc.PersonajeCreacion.Subtipos).toEqual([
            { Id: 11, Nombre: 'Humano' },
            { Id: 41, Nombre: 'Celestial' },
        ]);

        svc.limpiarPlantillasSeleccion();
        expect(svc.PersonajeCreacion.Tipo_criatura.Id).toBe(1);
        expect(svc.PersonajeCreacion.Tipo_criatura.Nombre).toBe('Humanoide');
        expect(svc.PersonajeCreacion.Subtipos).toEqual([{ Id: 11, Nombre: 'Humano' }]);
    });

    it('pierde Constitución al cambiar el tipo resultante a no-muerto', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        const tipoNoMuerto = crearTipo(6, 'Muerto viviente');
        tipoNoMuerto.Pierde_constitucion = true;

        svc.setCatalogoTiposCriatura([tipoHumanoide, tipoNoMuerto]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, []));
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        svc.agregarPlantillaSeleccion(crearPlantillaMock({
            Id: 501,
            Nombre: 'Plantilla no-muerta',
            Compatibilidad_tipos: [{
                Id_tipo_comp: 1,
                Id_tipo_nuevo: 6,
                Tipo_comp: 'Humanoide',
                Tipo_nuevo: 'Muerto viviente',
                Opcional: 0,
            }],
        }));

        expect(svc.PersonajeCreacion.Constitucion_perdida).toBeTrue();
        expect(svc.PersonajeCreacion.Caracteristicas_perdidas?.Constitucion).toBeTrue();
        expect(svc.PersonajeCreacion.Constitucion).toBe(0);
        expect(svc.PersonajeCreacion.ModConstitucion).toBe(0);
    });

    it('restaura Constitución al quitar plantilla que causaba pérdida', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        const tipoNoMuerto = crearTipo(6, 'Muerto viviente');
        tipoNoMuerto.Pierde_constitucion = true;

        svc.setCatalogoTiposCriatura([tipoHumanoide, tipoNoMuerto]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, []));
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        const plantillaNoMuerta = crearPlantillaMock({
            Id: 502,
            Nombre: 'Plantilla no-muerta',
            Compatibilidad_tipos: [{
                Id_tipo_comp: 1,
                Id_tipo_nuevo: 6,
                Tipo_comp: 'Humanoide',
                Tipo_nuevo: 'Muerto viviente',
                Opcional: 0,
            }],
        });

        svc.agregarPlantillaSeleccion(plantillaNoMuerta);
        expect(svc.PersonajeCreacion.Constitucion).toBe(0);
        expect(svc.PersonajeCreacion.Constitucion_perdida).toBeTrue();
        expect(svc.PersonajeCreacion.Caracteristicas_perdidas?.Constitucion).toBeTrue();

        svc.quitarPlantillaSeleccion(plantillaNoMuerta.Id);
        expect(svc.PersonajeCreacion.Constitucion_perdida).toBeFalse();
        expect(svc.PersonajeCreacion.Caracteristicas_perdidas?.Constitucion).toBeFalse();
        expect(svc.PersonajeCreacion.Constitucion).toBe(13);
        expect(svc.PersonajeCreacion.ModConstitucion).toBe(1);
    });

    it('interpreta Pierde_constitucion=1 como activo', () => {
        const svc = new NuevoPersonajeService();
        const tipoNoMuerto = {
            ...crearTipo(6, 'Muerto viviente'),
            Pierde_constitucion: 1 as unknown as boolean,
        };

        svc.setCatalogoTiposCriatura([tipoNoMuerto as unknown as TipoCriatura]);
        svc.seleccionarRaza(crearRazaMock(tipoNoMuerto as unknown as TipoCriatura, []));
        const aplicado = svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: null,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        expect(aplicado).toBeTrue();
        expect(svc.PersonajeCreacion.Constitucion_perdida).toBeTrue();
        expect(svc.PersonajeCreacion.Caracteristicas_perdidas?.Constitucion).toBeTrue();
        expect(svc.PersonajeCreacion.Constitucion).toBe(0);
        expect(svc.PersonajeCreacion.ModConstitucion).toBe(0);
    });

    it('ignora modificadores de CON mientras está perdida', () => {
        const svc = new NuevoPersonajeService();
        const tipoNoMuerto = crearTipo(6, 'Muerto viviente');
        tipoNoMuerto.Pierde_constitucion = true;
        const ventajaCon = crearVentajaBase({
            Id: 901,
            Nombre: 'Fortaleza antinatural',
            Coste: -1,
            Mejora: 2,
            Constitucion: true,
        });

        svc.setCatalogoTiposCriatura([tipoNoMuerto]);
        svc.seleccionarRaza(crearRazaMock(tipoNoMuerto, []));
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: null,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });
        svc.setCatalogosVentajas([ventajaCon], []);
        svc.toggleVentaja(ventajaCon.Id);

        expect(svc.PersonajeCreacion.CaracteristicasVarios.Constitucion.length).toBe(1);
        expect(svc.PersonajeCreacion.Constitucion_perdida).toBeTrue();
        expect(svc.PersonajeCreacion.Caracteristicas_perdidas?.Constitucion).toBeTrue();
        expect(svc.PersonajeCreacion.Constitucion).toBe(0);
        expect(svc.PersonajeCreacion.ModConstitucion).toBe(0);
    });

    it('mecanismo de perdida por clave funciona en una caracteristica distinta de CON', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, []));
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        (svc as any).setCaracteristicaPerdida('Fuerza', true, 'test');
        (svc as any).aplicarCaracteristicasFinalesDesdeBase();

        expect(svc.PersonajeCreacion.Caracteristicas_perdidas?.Fuerza).toBeTrue();
        expect(svc.PersonajeCreacion.Fuerza).toBe(0);
        expect(svc.PersonajeCreacion.ModFuerza).toBe(0);

        (svc as any).setCaracteristicaPerdida('Fuerza', false, 'test');
        (svc as any).aplicarCaracteristicasFinalesDesdeBase();

        expect(svc.PersonajeCreacion.Caracteristicas_perdidas?.Fuerza).toBeFalse();
        expect(svc.PersonajeCreacion.Fuerza).toBe(14);
        expect(svc.PersonajeCreacion.ModFuerza).toBe(2);
    });

    it('fase 2: aplica modificadores/minimos de plantilla y defensas', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        const raza = crearRazaMock(tipoHumanoide, []);
        (raza as any).Armadura_natural = 1;
        (raza as any).Varios_armadura = 0;
        (raza as any).Reduccion_dano = '5/frio';
        svc.seleccionarRaza(raza);
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        svc.agregarPlantillaSeleccion(crearPlantillaMock({
            Id: 810,
            Nombre: 'Liche',
            Ataque_base: 1,
            Ca: '+5 armadura natural',
            Iniciativa: 2,
            Presa: 4,
            Reduccion_dano: '15/contundente y magia',
            Resistencia_conjuros: '32',
            Resistencia_elemental: 'Frio 10',
            Modificadores_caracteristicas: {
                Fuerza: 2,
                Destreza: 0,
                Constitucion: 0,
                Inteligencia: 0,
                Sabiduria: 0,
                Carisma: 0,
            },
            Minimos_caracteristicas: {
                Fuerza: 18,
                Destreza: 0,
                Constitucion: 0,
                Inteligencia: 0,
                Sabiduria: 0,
                Carisma: 0,
            },
        }));

        expect(svc.PersonajeCreacion.Fuerza).toBe(18);
        expect(svc.PersonajeCreacion.ModFuerza).toBe(4);
        expect(svc.PersonajeCreacion.Armadura_natural).toBe(6);
        expect(svc.PersonajeCreacion.Ca).toBe(17);
        expect(svc.PersonajeCreacion.Ataque_base).toBe('1');
        expect(svc.PersonajeCreacion.Rds.length).toBe(2);
        expect(svc.PersonajeCreacion.Rcs.length).toBe(1);
        expect(svc.PersonajeCreacion.Res.length).toBe(1);
    });

    it('fase 2: aplica NEP/experiencia/oro con ajuste de nivel de plantilla', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, []));
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        svc.agregarPlantillaSeleccion(crearPlantillaMock({
            Id: 811,
            Nombre: 'Liche',
            Ajuste_nivel: 4,
        }));

        expect(svc.PersonajeCreacion.NEP).toBe(4);
        expect(svc.PersonajeCreacion.Experiencia).toBe(6000);
        expect(svc.PersonajeCreacion.Oro_inicial).toBe(5400);
    });

    it('fase 2: aplica alineamiento por prioridad de plantilla', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        const raza = crearRazaMock(tipoHumanoide, []);
        (raza as any).Alineamiento = {
            Basico: { Nombre: 'Legal bueno' },
        };
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        svc.seleccionarRaza(raza);
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        svc.agregarPlantillaSeleccion(crearPlantillaMock({
            Id: 812,
            Nombre: 'Liche',
            Alineamiento: {
                Id: 32,
                Basico: { Id_basico: 0, Nombre: 'No aplica' },
                Ley: { Id_ley: 10, Nombre: 'Ninguna preferencia' },
                Moral: { Id_moral: 6, Nombre: 'Siempre maligno' },
                Prioridad: { Id_prioridad: 3, Nombre: 'Siempre' },
                Descripcion: 'Se debe respetar a raja tabla.',
            },
        }));

        expect(svc.PersonajeCreacion.Alineamiento).toBe('Legal maligno');
    });

    it('fase 2: aplica habilidades/ataques/dado de golpe de plantilla', () => {
        const svc = new NuevoPersonajeService();
        const tipoHumanoide = crearTipo(1, 'Humanoide');
        svc.setCatalogoTiposCriatura([tipoHumanoide]);
        svc.setCatalogoHabilidades([{
            Id_habilidad: 6,
            Nombre: 'Avistar',
            Id_caracteristica: 5,
            Caracteristica: 'Sabiduria',
            Descripcion: '',
            Soporta_extra: false,
            Entrenada: false,
            Extras: [],
        }]);
        svc.seleccionarRaza(crearRazaMock(tipoHumanoide, []));
        svc.aplicarCaracteristicasGeneradas({
            Fuerza: 14,
            Destreza: 12,
            Constitucion: 13,
            Inteligencia: 10,
            Sabiduria: 11,
            Carisma: 9,
        });

        svc.agregarPlantillaSeleccion(crearPlantillaMock({
            Id: 813,
            Nombre: 'Liche',
            Tipo_dado: {
                Id_tipo_dado: 5,
                Nombre: 'd12',
            },
            Habilidades: [{
                Id_habilidad: 6,
                Habilidad: 'Avistar',
                Id_caracteristica: 5,
                Caracteristica: 'Sabiduria',
                Descripcion: '',
                Soporta_extra: false,
                Entrenada: false,
                Id_extra: -1,
                Extra: '-',
                Rangos: 8,
                Varios: 'No especifica',
            }],
            Ataques: 'Toque corruptor',
        }));

        const avistar = svc.PersonajeCreacion.Habilidades.find((h) => h.Id === 6);
        expect(avistar?.Rangos_varios).toBe(8);
        expect(svc.PersonajeCreacion.Dados_golpe).toBe(12);
        const ataqueRacial = svc.PersonajeCreacion.Raciales.find((r) => r.Nombre.includes('Toque corruptor'));
        expect(ataqueRacial?.Origen).toBe('Liche');
    });

    it('contarSeleccionesEnemigoPredilectoPorEspeciales detecta ocurrencias del especial', () => {
        const svc = new NuevoPersonajeService();
        const total = svc.contarSeleccionesEnemigoPredilectoPorEspeciales([
            {
                Especial: { Nombre: 'Enemigo predilecto' },
                Nivel: 1,
                Id_extra: -1,
                Extra: '',
                Opcional: 0,
                Id_interno: 1,
                Id_especial_requerido: 0,
                Id_dote_requerida: 0,
            },
            {
                Especial: { Nombre: 'Rastreo' },
                Nivel: 1,
                Id_extra: -1,
                Extra: '',
                Opcional: 0,
                Id_interno: 2,
                Id_especial_requerido: 0,
                Id_dote_requerida: 0,
            },
            {
                Especial: { Nombre: 'Enemigo Predilecto superior' },
                Nivel: 5,
                Id_extra: -1,
                Extra: '',
                Opcional: 0,
                Id_interno: 3,
                Id_especial_requerido: 0,
                Id_dote_requerida: 0,
            },
        ]);

        expect(total).toBe(2);
    });

    it('aplicarSeleccionEnemigoPredilecto acumula +2 al repetir el mismo enemigo', () => {
        const svc = new NuevoPersonajeService();
        expect(svc.aplicarSeleccionEnemigoPredilecto({ Id: 7, Nombre: 'No muerto' })).toBeTrue();
        expect(svc.aplicarSeleccionEnemigoPredilecto({ Id: 7, Nombre: 'No muerto' })).toBeTrue();

        const enemigos = svc.getEnemigosPredilectos();
        expect(enemigos.length).toBe(1);
        expect(enemigos[0].id).toBe(7);
        expect(enemigos[0].bono).toBe(4);
        expect(enemigos[0].veces).toBe(2);
    });
});

describe('NuevoPersonajeService (vida final)', () => {
    function crearTipoVida(pierdeConstitucion = false): TipoCriatura {
        return {
            Id: 1,
            Nombre: 'Humanoide',
            Descripcion: '',
            Manual: 'Manual',
            Id_tipo_dado: 1,
            Tipo_dado: 8,
            Id_ataque: 1,
            Id_fortaleza: 1,
            Id_reflejos: 1,
            Id_voluntad: 1,
            Id_puntos_habilidad: 1,
            Come: true,
            Respira: true,
            Duerme: true,
            Recibe_criticos: true,
            Puede_ser_flanqueado: true,
            Pierde_constitucion: pierdeConstitucion,
            Limite_inteligencia: 0,
            Tesoro: 'Normal',
            Id_alineamiento: 0,
            Rasgos: [],
            Oficial: true,
        };
    }

    function crearRazaVida(tipo: TipoCriatura, dgs = 1): Raza {
        return {
            Id: 1,
            Nombre: 'Raza vida',
            Ajuste_nivel: 0,
            Manual: 'Manual',
            Clase_predilecta: '',
            Modificadores: {
                Fuerza: 0,
                Destreza: 0,
                Constitucion: 0,
                Inteligencia: 0,
                Sabiduria: 0,
                Carisma: 0,
            },
            Alineamiento: {
                Id: 0,
                Basico: { Id_basico: 0, Nombre: 'Neutral autentico' },
                Ley: { Id_ley: 0, Nombre: 'No aplica' },
                Moral: { Id_moral: 0, Nombre: 'No aplica' },
                Prioridad: { Id_prioridad: 0, Nombre: 'No aplica' },
                Descripcion: '',
            },
            Oficial: true,
            Ataques_naturales: '',
            Tamano: { Id: 1, Nombre: 'Mediano', Modificador: 0, Modificador_presa: 0 } as any,
            Dgs_adicionales: {
                Cantidad: dgs,
                Dado: 'd8',
                Tipo_criatura: 'Humanoide',
                Ataque_base: 0,
                Dotes_extra: 0,
                Puntos_habilidad: 0,
                Multiplicador_puntos_habilidad: 1,
                Fortaleza: 0,
                Reflejos: 0,
                Voluntad: 0,
            },
            Reduccion_dano: '',
            Resistencia_magica: '',
            Resistencia_energia: '',
            Heredada: false,
            Mutada: false,
            Tamano_mutacion_dependiente: false,
            Prerrequisitos: {
                actitud_prohibido: [],
                actitud_requerido: [],
                alineamiento_prohibido: [],
                alineamiento_requerido: [],
                tipo_criatura: [],
            },
            Armadura_natural: 0,
            Varios_armadura: 0,
            Correr: 30,
            Nadar: 0,
            Volar: 0,
            Maniobrabilidad: {
                Id: 0,
                Nombre: '-',
                Velocidad_avance: '',
                Flotar: 0,
                Volar_atras: 0,
                Contramarcha: 0,
                Giro: '',
                Rotacion: '',
                Giro_max: '',
                Angulo_ascenso: '',
                Velocidad_ascenso: '',
                Angulo_descenso: '',
                Descenso_ascenso: 0,
            },
            Trepar: 0,
            Escalar: 0,
            Altura_rango_inf: 1.6,
            Altura_rango_sup: 1.9,
            Peso_rango_inf: 50,
            Peso_rango_sup: 80,
            Edad_adulto: 20,
            Edad_mediana: 40,
            Edad_viejo: 60,
            Edad_venerable: 80,
            Espacio: 5,
            Alcance: 5,
            Tipo_criatura: tipo,
            Subtipos: [],
            Sortilegas: [],
            Raciales: [],
            Habilidades: { Base: [], Custom: [] },
            DotesContextuales: [],
            Idiomas: [],
        };
    }

    it('calcula vida con DG racial, clases y bonos de dote Pg_a/Pg_a_n', () => {
        const svc = new NuevoPersonajeService();
        const tipo = crearTipoVida(false);
        const raza = crearRazaVida(tipo, 1);
        const clase = crearClaseBase({
            Id: 10,
            Nombre: 'Guerrero',
            Tipo_dado: { Id: 4, Nombre: 'd10' },
        });
        const randomSpy = spyOn<any>(svc, 'randomInt').and.returnValues(5, 7);

        svc.setCatalogoClases([clase]);
        svc.seleccionarRaza(raza);
        svc.PersonajeCreacion.ModConstitucion = 2;
        svc.PersonajeCreacion.desgloseClases = [{ Nombre: 'Guerrero', Nivel: 2 } as any];
        svc.PersonajeCreacion.DotesContextuales = [{
            Dote: { Modificadores: { Pg_a: 3, Pg_a_n: 1 } } as any,
            Contexto: { Entidad: 'personaje', Id_personaje: 1, Id_extra: 0, Extra: 'No aplica', Origen: 'test' } as any,
        }];

        const resultado = svc.calcularVidaFinalAleatoria();

        expect(randomSpy).toHaveBeenCalledTimes(2);
        expect(resultado.total).toBe(45);
        expect(resultado.maximo).toBe(73);
        expect(resultado.detalle.bonoPlanoDotes).toBe(3);
        expect(resultado.detalle.bonoPorDadoClaseDotes).toBe(1);
    });

    it('no aplica CON cuando el tipo pierde constitucion', () => {
        const svc = new NuevoPersonajeService();
        const tipo = crearTipoVida(true);
        const raza = crearRazaVida(tipo, 0);
        const clase = crearClaseBase({
            Id: 11,
            Nombre: 'Monje',
            Tipo_dado: { Id: 3, Nombre: 'd8' },
        });

        svc.setCatalogoClases([clase]);
        svc.seleccionarRaza(raza);
        svc.PersonajeCreacion.ModConstitucion = 5;
        svc.PersonajeCreacion.desgloseClases = [{ Nombre: 'Monje', Nivel: 1 } as any];

        const resultado = svc.calcularVidaFinalAleatoria();

        expect(resultado.total).toBe(18);
        expect(resultado.maximo).toBe(18);
        expect(resultado.detalle.constitucionAplicada).toBeFalse();
        expect(resultado.detalle.modificadorConstitucion).toBe(0);
    });

    it('aplica clamp minimo de 1 a total y maximo', () => {
        const svc = new NuevoPersonajeService();
        const tipo = crearTipoVida(false);
        const raza = crearRazaVida(tipo, 0);
        const clase = crearClaseBase({
            Id: 12,
            Nombre: 'Mago',
            Tipo_dado: { Id: 1, Nombre: 'd4' },
        });

        svc.setCatalogoClases([clase]);
        svc.seleccionarRaza(raza);
        svc.PersonajeCreacion.ModConstitucion = -10;
        svc.PersonajeCreacion.desgloseClases = [{ Nombre: 'Mago', Nivel: 1 } as any];
        svc.PersonajeCreacion.DotesContextuales = [{
            Dote: { Modificadores: { Pg_a: -5 } } as any,
            Contexto: { Entidad: 'personaje', Id_personaje: 1, Id_extra: 0, Extra: 'No aplica', Origen: 'test' } as any,
        }];

        const resultado = svc.calcularVidaFinalAleatoria();

        expect(resultado.total).toBe(1);
        expect(resultado.maximo).toBe(1);
    });
});

describe('NuevoPersonajeService (dotes repetibles con extra)', () => {
    function crearDoteRepetibleConExtras(): any {
        return {
            Id: 77,
            Nombre: 'Enfoque de arma',
            Descripcion: '',
            Beneficio: '',
            Normal: '',
            Especial: '',
            Manual: { Id: 1, Nombre: 'PHB', Pagina: 101 },
            Tipos: [{ Id: 1, Nombre: 'General', Usado: 1 }],
            Repetible: 1,
            Repetible_distinto_extra: 1,
            Repetible_comb: 0,
            Comp_arma: 0,
            Oficial: true,
            Extras_soportados: {
                Extra_arma: 1,
                Extra_armadura_armaduras: 0,
                Extra_armadura_escudos: 0,
                Extra_armadura: 0,
                Extra_escuela: 0,
                Extra_habilidad: 0,
            },
            Extras_disponibles: {
                Armas: [
                    { Id: 10, Nombre: 'Espada larga' },
                    { Id: 11, Nombre: 'Hacha de batalla' },
                ],
                Armaduras: [],
                Escuelas: [],
                Habilidades: [],
            },
            Modificadores: {},
            Prerrequisitos: {},
        };
    }

    it('no permite repetir el mismo extra cuando la dote exige repeticion con extra distinto', () => {
        const svc = new NuevoPersonajeService();
        const dote = crearDoteRepetibleConExtras();

        svc.setCatalogoDotes([dote]);
        (svc as any).dotesPendientes = [{
            id: 1,
            fuente: 'nivel',
            origen: 'Nivel 3',
            tipoPermitido: null,
            estado: 'pendiente',
        }];
        svc.PersonajeCreacion.Dotes = [{
            Nombre: 'Enfoque de arma',
            Descripcion: '',
            Beneficio: '',
            Pagina: 101,
            Extra: 'Espada larga',
            Origen: 'Nivel 1',
        }] as any;
        svc.PersonajeCreacion.DotesContextuales = [{
            Dote: dote,
            Contexto: {
                Entidad: 'personaje',
                Id_personaje: 1,
                Id_extra: 10,
                Extra: 'Espada larga',
                Origen: 'Nivel 1',
            },
        }] as any;

        expect(svc.aplicarDotePendiente(1, {
            idDote: 77,
            idExtra: 10,
            extra: 'Espada larga',
        })).toBeFalse();

        expect(svc.aplicarDotePendiente(1, {
            idDote: 77,
            idExtra: 11,
            extra: 'Hacha de batalla',
        })).toBeTrue();
    });
});
