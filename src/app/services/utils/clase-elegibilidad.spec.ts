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
            puede_elegir_especialidad: false,
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
        claseas: [{ id: 700, nombre: 'Furia', idExtra: 5, extra: 'Basica' }],
        habilidades: [{ id: 600, nombre: 'Acrobacias', rangos: 8, idExtra: 9, extra: 'Saltos' }],
        conjuros: [{ id: 500, nombre: 'Misil magico', idEscuela: 11, escuela: 'Evocacion' }],
        dotes: [{ id: 100, nombre: 'Ataque poderoso', idExtra: 0, extra: '' }],
        idiomas: [{ id: 200, nombre: 'Dracónico' }],
        dominios: [{ id: 300, nombre: 'Guerra' }],
        competenciasArmas: [{ id: 1, nombre: 'Espada larga' }],
        competenciasArmaduras: [{ id: 2, nombre: 'Armadura ligera' }],
        competenciasGrupoArmas: [{ id: 3, nombre: 'Armas marciales' }],
        competenciasGrupoArmaduras: [{ id: 4, nombre: 'Escudos' }],
        lanzador: { arcano: 6, divino: 4, psionico: 3 },
        nivelesConjuroMaximos: { arcano: 3, divino: 2, psionico: 2 },
        dgTotal: 7,
        reservaPsionica: 12,
        escuelaEspecialista: { id: 11, nombre: 'Evocacion', nivelArcano: 6 },
        tamanoId: 5,
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

    it('retorna blocked_unknown cuando hay una flag desconocida activa', () => {
        const clase = crearClaseBase({
            Prerrequisitos_flags: { foo_no_soportado: true } as any,
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
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

    it('resuelve grupo opcional global entre familias distintas', () => {
        const clase = crearClaseBase({
            Prerrequisitos_flags: {
                idioma: true,
                dote_elegida: true,
            },
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
                idioma: [{ Id_idioma: 999, opcional: 1 }],
                dote_elegida: [{ Id_dote: 100, opcional: 1 }],
            },
        });

        const res = evaluarElegibilidadClase(clase, crearContextoBase());
        expect(res.estado).toBe('eligible');
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

    it('evalúa repetido en dote_elegida', () => {
        const clase = crearClaseBase({
            Prerrequisitos_flags: {
                dote_elegida: true,
            },
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
                dote_elegida: [{ Id_dote: 100, Repetido: 2, opcional: 0 }],
            },
        });

        const fallo = evaluarElegibilidadClase(clase, crearContextoBase());
        expect(fallo.estado).toBe('blocked_failed');

        const ok = evaluarElegibilidadClase(clase, {
            ...crearContextoBase(),
            dotes: [
                { id: 100, nombre: 'Ataque poderoso', idExtra: 0, extra: '' },
                { id: 100, nombre: 'Ataque poderoso', idExtra: 0, extra: '' },
            ],
        });
        expect(ok.estado).toBe('eligible');
    });

    it('evalúa id_extra en dote_elegida', () => {
        const clase = crearClaseBase({
            Prerrequisitos_flags: {
                dote_elegida: true,
            },
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
                dote_elegida: [{ Id_dote: 100, Id_extra: 0, opcional: 0 }],
            },
        });

        const okConExtra = evaluarElegibilidadClase(clase, {
            ...crearContextoBase(),
            dotes: [{ id: 100, nombre: 'Ataque poderoso', idExtra: 7, extra: 'Espada larga' }],
        });
        expect(okConExtra.estado).toBe('eligible');

        const falloSinExtra = evaluarElegibilidadClase(clase, {
            ...crearContextoBase(),
            dotes: [{ id: 100, nombre: 'Ataque poderoso', idExtra: 0, extra: '' }],
        });
        expect(falloSinExtra.estado).toBe('blocked_failed');
    });

    it('evalua familias extendidas de prerrequisitos de clase', () => {
        const clase = crearClaseBase({
            Prerrequisitos_flags: {
                habilidad_clase: true,
                clase_especial: true as any,
                competencia_arma: true,
                competencia_armadura: true,
                competencia_grupo_arma: true,
                competencia_grupo_armadura: true,
                conjuro_conocido: true,
                conocer_poder_psionico: true,
                dg: true,
                nivel_escuela: true,
                rangos_habilidad: true,
                lanzador_arcano: true,
                lanzador_divino: true,
                lanzar_conjuros_arcanos_nivel: true,
                lanzar_conjuros_divinos_nivel: true,
                lanzar_poder_psionico_nivel: true,
                reserva_psionica: true,
                tamano_maximo: true,
                tamano_minimo: true,
                inherente: true,
            } as any,
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
                clase_especial: [{ Id_especial: 700, Id_extra: 5, opcional: 0 }],
                competencia_arma: [{ Id_arma: 1, opcional: 0 }],
                competencia_armadura: [{ Id_armadura: 2, opcional: 0 }],
                competencia_grupo_arma: [{ Id_grupo: 3, opcional: 0 }],
                competencia_grupo_armadura: [{ Id_grupo: 4, opcional: 0 }],
                conjuro_conocido: [{ Id_conjuro: 500, opcional: 0 }],
                conocer_poder_psionico: [{ Id_conjuro: 500, opcional: 0 }],
                dg: [{ Cantidad: 7, opcional: 0 }],
                nivel_escuela: [{ Id_escuela: 11, Cantidad: 6, opcional: 0 }],
                rangos_habilidad: [{ Id_habilidad: 600, Rangos: 8, Id_extra: 9, opcional: 0 }],
                lanzador_arcano: [{ Nivel: 6, opcional: 0 }],
                lanzador_divino: [{ Nivel: 4, opcional: 0 }],
                lanzar_conjuros_arcanos_nivel: [{ Nivel: 3, opcional: 0 }],
                lanzar_conjuros_divinos_nivel: [{ Nivel: 2, opcional: 0 }],
                lanzar_poder_psionico_nivel: [{ Nivel: 2, opcional: 0 }],
                reserva_psionica: [{ Cantidad: 12, opcional: 0 }],
                tamano_maximo: [{ Id_tamano: 5, opcional: 0 }],
                tamano_minimo: [{ Id_tamano: 4, opcional: 0 }],
                inherente: [],
            },
        });

        const res = evaluarElegibilidadClase(clase, crearContextoBase());
        expect(res.estado).toBe('eligible');
    });

    it('bloquea por tamano_maximo cuando no cumple el limite', () => {
        const clase = crearClaseBase({
            Prerrequisitos_flags: {
                tamano_maximo: true,
            },
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
                tamano_maximo: [{ Id_tamano: 4, opcional: 0 }],
            },
        });

        const res = evaluarElegibilidadClase(clase, crearContextoBase());
        expect(res.estado).toBe('blocked_failed');
    });
});
