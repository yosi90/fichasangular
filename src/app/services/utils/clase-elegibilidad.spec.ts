import { Clase } from 'src/app/interfaces/clase';
import { ClaseEvaluacionContexto, evaluarElegibilidadClase } from './clase-elegibilidad';

function crearClaseBase(partial?: Partial<Clase>): Clase {
    return {
        Id: 1,
        Nombre: 'Clase test',
        Descripcion: '',
        Manual: { Id: 1, Nombre: 'Manual', Pagina: 1 },
        Tipo_dado: { Id: 1, Nombre: 'd8' },
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
            Escuela: false,
            Lanzamiento_espontaneo: false,
            Clase_origen: { Id: 0, Nombre: '' },
            Listado: [],
        },
        Roles: { Dps: false, Tanque: false, Support: false, Utilidad: false },
        Aumenta_clase_lanzadora: false,
        Es_predilecta: false,
        Prestigio: false,
        Tiene_prerrequisitos: true,
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
        Habilidades: { Base: [], Custom: [] },
        Idiomas: [],
        Desglose_niveles: [],
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

function crearContextoBase(): ClaseEvaluacionContexto {
    return {
        identidad: {
            razas: [{ id: 10, nombre: 'Humano' }],
            tiposCriatura: [{ id: 1, nombre: 'Humanoide' }],
            subtipos: [{ id: 20, nombre: 'Fuego' }],
        },
        caracteristicas: {
            Fuerza: 16,
            Destreza: 14,
            Constitucion: 12,
            Inteligencia: 13,
            Sabiduria: 10,
            Carisma: 8,
        },
        ataqueBase: 6,
        alineamiento: 'Legal bueno',
        genero: 'Macho',
        dotes: [{ id: 100, nombre: 'Ataque poderoso' }],
        idiomas: [{ id: 200, nombre: 'Dracónico' }],
        dominios: [{ id: 300, nombre: 'Guerra' }],
    };
}

describe('clase-elegibilidad', () => {
    it('retorna eligible cuando cumple prerrequisitos soportados', () => {
        const clase = crearClaseBase({
            Prerrequisitos_flags: {
                raza: true,
                caracteristica: true,
                ataque_base: true,
                alineamiento_requerido: true,
                genero: true,
                dote_elegida: true,
                idioma: true,
                subtipo: true,
            },
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
                raza: [{ Id_raza: 10, opcional: 0 }],
                caracteristica: [{ Id_caracteristica: 1, Cantidad: 13, opcional: 0 }],
                ataque_base: [{ Cantidad: 5, opcional: 0 }],
                alineamiento_requerido: [{ Id_alineamiento: 1, opcional: 0 }],
                genero: [{ Genero: 'Macho', opcional: 0 }],
                dote_elegida: [{ Id_dote: 100, opcional: 0 }],
                idioma: [{ Id_idioma: 200, opcional: 0 }],
                subtipo: [{ Id_subtipo: 20, opcional: 0 }],
            },
        });

        const res = evaluarElegibilidadClase(clase, crearContextoBase());
        expect(res.estado).toBe('eligible');
    });

    it('retorna blocked_failed cuando falla un prerrequisito soportado', () => {
        const clase = crearClaseBase({
            Prerrequisitos_flags: {
                caracteristica: true,
            },
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
                caracteristica: [{ Id_caracteristica: 1, Cantidad: 18, opcional: 0 }],
            },
        });

        const res = evaluarElegibilidadClase(clase, crearContextoBase());
        expect(res.estado).toBe('blocked_failed');
    });

    it('retorna blocked_unknown cuando hay familia activa no soportada', () => {
        const clase = crearClaseBase({
            Prerrequisitos_flags: {
                competencia_arma: true,
            },
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
                competencia_arma: [{ Id_arma: 1, opcional: 0 }],
            },
        });

        const res = evaluarElegibilidadClase(clase, crearContextoBase());
        expect(res.estado).toBe('blocked_unknown');
    });

    it('soporta no_raza, alineamiento prohibido y actitud requerida/prohibida', () => {
        const clase = crearClaseBase({
            Prerrequisitos_flags: {
                no_raza: true,
                alineamiento_prohibido: true,
                actitud_requerido: true,
                actitud_prohibido: true,
            },
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
                no_raza: [{ Id_raza: 99, opcional: 0 }],
                alineamiento_prohibido: [{ Id_alineamiento: 9, opcional: 0 }],
                actitud_requerido: [{ Id_actitud: 1, opcional: 0 }],
                actitud_prohibido: [{ Id_actitud: 3, opcional: 0 }],
            },
        });

        const res = evaluarElegibilidadClase(clase, crearContextoBase());
        expect(res.estado).toBe('eligible');
    });

    it('bloquea grupos opcionales cuando ninguno cumple', () => {
        const clase = crearClaseBase({
            Prerrequisitos_flags: {
                idioma: true,
            },
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
                idioma: [
                    { Id_idioma: 999, opcional: 1 },
                    { Id_idioma: 998, opcional: 1 },
                ],
            },
        });

        const res = evaluarElegibilidadClase(clase, crearContextoBase());
        expect(res.estado).toBe('blocked_failed');
    });

    it('evalúa prerrequisito de dominio cuando está soportado', () => {
        const clase = crearClaseBase({
            Prerrequisitos_flags: {
                dominio: true,
            },
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
                dominio: [{ Id_dominio: 300, opcional: 0 }],
            },
        });

        const ok = evaluarElegibilidadClase(clase, crearContextoBase());
        expect(ok.estado).toBe('eligible');

        const fallo = evaluarElegibilidadClase(clase, {
            ...crearContextoBase(),
            dominios: [{ id: 301, nombre: 'Ley' }],
        });
        expect(fallo.estado).toBe('blocked_failed');
    });
});
