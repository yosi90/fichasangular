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
            aptitud_especial: [],
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
                dote_elegida: [{ Id_dote_prerrequisito: 100, Id_extra: -1, Extra_comodin: null, Opcional: 0 }],
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
                caracteristica: [{ Id_caracteristica: 1, Cantidad: 18, opcional: 0, Frase: 'Fuerza 18' }],
            },
        });

        const res = evaluarElegibilidadClase(clase, crearContextoBase());
        expect(res.estado).toBe('blocked_failed');
        expect(res.razones).toEqual(['No cumple: Fuerza 18']);
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
                    { Id_idioma: 999, opcional: 1, Frase: 'Hablar dracónico' },
                    { Id_idioma: 998, opcional: 1, Frase: 'Hablar infernal' },
                ],
            },
        });

        const res = evaluarElegibilidadClase(clase, crearContextoBase());
        expect(res.estado).toBe('blocked_failed');
        expect(res.razones).toEqual(['No cumple: Hablar dracónico o Hablar infernal']);
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
                dote_elegida: [{ Id_dote_prerrequisito: 100, Id_extra: -1, Extra_comodin: null, Opcional: 1 }],
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
                dote_elegida: [{ Id_dote_prerrequisito: 100, Id_extra: -1, Extra_comodin: null, Repetido: 2, Opcional: 0 }],
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

    it('dote_elegida con Extra_comodin «cualquiera» vale con la dote y cualquier extra', () => {
        const clase = crearClaseBase({
            Prerrequisitos_flags: {
                dote_elegida: true,
            },
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
                dote_elegida: [{
                    Id_dote_prerrequisito: 100, Dote_prerrequisito: 'Soltura con una escuela de magia', Id_extra: 0, Extra: null,
                    Extra_comodin: 'cualquiera', Repetido: 0, Opcional: 0, Frase: 'Soltura con una escuela de magia (cualquier escuela)',
                }],
            },
        });

        const ok = evaluarElegibilidadClase(clase, {
            ...crearContextoBase(),
            dotes: [{ id: 100, nombre: 'Soltura con una escuela de magia', idExtra: 7, extra: 'Conjuración' }],
        });
        expect(ok.estado).toBe('eligible');

        const sinDote = evaluarElegibilidadClase(clase, { ...crearContextoBase(), dotes: [] });
        expect(sinDote.estado).toBe('blocked_failed');
        expect(sinDote.razones).toEqual(['No cumple: Soltura con una escuela de magia (cualquier escuela)']);
    });

    it('dote_elegida con un extra concreto exige ese extra', () => {
        const clase = crearClaseBase({
            Prerrequisitos_flags: {
                dote_elegida: true,
            },
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
                dote_elegida: [{
                    Id_dote_prerrequisito: 4, Dote_prerrequisito: 'Soltura con un arma', Id_extra: 48, Extra: 'Arco corto',
                    Extra_comodin: null, Repetido: 0, Opcional: 0, Frase: 'Soltura con un arma (arco corto)',
                }],
            },
        });

        const ok = evaluarElegibilidadClase(clase, {
            ...crearContextoBase(),
            dotes: [{ id: 4, nombre: 'Soltura con un arma', idExtra: 48, extra: 'Arco corto' }],
        });
        expect(ok.estado).toBe('eligible');

        const otraArma = evaluarElegibilidadClase(clase, {
            ...crearContextoBase(),
            dotes: [{ id: 4, nombre: 'Soltura con un arma', idExtra: 50, extra: 'Arco largo' }],
        });
        expect(otraArma.estado).toBe('blocked_failed');
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
                aptitud_especial: true,
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
                aptitud_especial: [{
                    Id_aptitud_especial: 10, Aptitud_especial: 'Alas', Raciales: [{ Id: 41, Nombre: 'Aspecto de dragón (Alas)' }],
                    Especiales: [], Plantillas: [], Opcional: 0, Frase: 'Alas',
                }],
            },
        });

        const res = evaluarElegibilidadClase(clase, { ...crearContextoBase(), raciales: [{ id: 41, nombre: 'Aspecto de dragón (Alas)' }] });
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

    describe('aptitud_especial', () => {
        const claseConAptitud = (aptitud: Record<string, any>) => crearClaseBase({
            Prerrequisitos_flags: { aptitud_especial: true },
            Prerrequisitos: { ...crearClaseBase().Prerrequisitos, aptitud_especial: [aptitud as any] },
        });
        const armaDeAliento = {
            Id_aptitud_especial: 13, Aptitud_especial: 'Arma de aliento',
            Raciales: [{ Id: 74, Nombre: 'Arma de aliento (dragón azul)' }],
            Especiales: [{ Id: 2388, Nombre: 'Arma de aliento' }],
            Plantillas: [{ Id: 6, Nombre: 'Semidragón' }],
            Opcional: 0, Frase: 'Arma de aliento',
        };

        it('se cumple con un especial de clase que la otorga', () => {
            const ctx = { ...crearContextoBase(), claseas: [{ id: 2388, nombre: 'Arma de aliento', idExtra: null, extra: '' }] };
            expect(evaluarElegibilidadClase(claseConAptitud(armaDeAliento), ctx).estado).toBe('eligible');
        });

        it('se cumple con una plantilla que la otorga', () => {
            const ctx = { ...crearContextoBase(), plantillas: [{ id: 6, nombre: 'Semidragón' }] };
            expect(evaluarElegibilidadClase(claseConAptitud(armaDeAliento), ctx).estado).toBe('eligible');
        });

        it('no se cumple sin ninguno de los que la otorgan', () => {
            const res = evaluarElegibilidadClase(claseConAptitud(armaDeAliento), crearContextoBase());
            expect(res.estado).toBe('blocked_failed');
            expect(res.razones).toEqual(['No cumple: Arma de aliento']);
        });

        it('sin equivalencias se deja elegir con un aviso', () => {
            const res = evaluarElegibilidadClase(claseConAptitud({
                Id_aptitud_especial: 11, Aptitud_especial: 'Cuerpo flexible', Raciales: [], Especiales: [], Plantillas: [],
                Opcional: 0, Frase: 'Cuerpo flexible',
            }), crearContextoBase());
            expect(res.estado).toBe('eligible');
            expect(res.razones).toEqual([]);
            expect(res.advertencias).toEqual(['La web no puede comprobar este requisito: Cuerpo flexible']);
        });
    });

    describe('solo por alineamiento (por el tipo, no por el texto de la frase)', () => {
        const clase = (flags: Record<string, boolean>, prerrequisitos: Record<string, any[]>) => crearClaseBase({
            Prerrequisitos_flags: flags as any,
            Prerrequisitos: { ...crearClaseBase().Prerrequisitos, ...prerrequisitos } as any,
        });

        it('un alineamiento requerido con la frase corta («No cumple: Neutral bueno») cuenta como solo por alineamiento', () => {
            const res = evaluarElegibilidadClase(clase(
                { alineamiento_requerido: true },
                { alineamiento_requerido: [{ Alineamiento: 'Neutral bueno', Opcional: 0, Frase: 'Neutral bueno' }] },
            ), crearContextoBase());
            expect(res.estado).toBe('blocked_failed');
            expect(res.razones).toEqual(['No cumple: Neutral bueno']);
            expect(res.soloPorAlineamiento).toBeTrue();
        });

        it('una actitud («No cumple: Cualquier alineamiento caótico») también', () => {
            const res = evaluarElegibilidadClase(clase(
                { actitud_requerido: true },
                { actitud_requerido: [{ Id_actitud: 3, Opcional: 0, Frase: 'Cualquier alineamiento caótico' }] },
            ), crearContextoBase());
            expect(res.razones).toEqual(['No cumple: Cualquier alineamiento caótico']);
            expect(res.soloPorAlineamiento).toBeTrue();
        });

        it('un grupo de alineamientos alternativos que no se cumple también', () => {
            const res = evaluarElegibilidadClase(clase(
                { alineamiento_requerido: true },
                {
                    alineamiento_requerido: [
                        { Alineamiento: 'Neutral bueno', Opcional: 1, Frase: 'Neutral bueno' },
                        { Alineamiento: 'Caótico bueno', Opcional: 1, Frase: 'Caótico bueno' },
                    ],
                },
            ), crearContextoBase());
            expect(res.razones).toEqual(['No cumple: Neutral bueno o Caótico bueno']);
            expect(res.soloPorAlineamiento).toBeTrue();
        });

        it('si además falla otro prerrequisito, no es solo por alineamiento', () => {
            const res = evaluarElegibilidadClase(clase(
                { alineamiento_prohibido: true, ataque_base: true },
                {
                    alineamiento_prohibido: [{ Alineamiento: 'Legal bueno', Opcional: 0, Frase: 'No legal bueno' }],
                    ataque_base: [{ Cantidad: 10, Opcional: 0, Frase: 'Ataque base +10' }],
                },
            ), crearContextoBase());
            expect(res.estado).toBe('blocked_failed');
            expect(res.soloPorAlineamiento).toBeFalse();
        });
    });
});
