import { Clase } from 'src/app/interfaces/clase';
import { ClaseEvaluacionContexto, esClaseCompatibleConRestringida, evaluarElegibilidadClase, incumpleDeidadTutelar } from './clase-elegibilidad';

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
                // Como los da la API: `Id_alineamiento` es la combinación (el LB «siempre», la 3) y el básico va aparte.
                alineamiento_requerido: [{ Id_alineamiento: 3, Id_alineamiento_basico: 1, Alineamiento_basico: 'Legal bueno', opcional: 0 }],
                genero: [{ Genero: 1, Genero_nombre: 'Macho', opcional: 0 }],
                dote_elegida: [{ Id_dote_prerrequisito: 100, Id_extra: -1, Extra_comodin: null, Opcional: 0 }],
                idioma: [{ Id_idioma: 200, opcional: 0 }],
                subtipo: [{ Id_subtipo: 20, opcional: 0 }],
            },
        });

        const res = evaluarElegibilidadClase(clase, crearContextoBase());
        expect(res.estado).toBe('eligible');
    });

    it('el alineamiento de una clase de prestigio se compara con el básico, no con la combinación (Caballero protector: LB o LN)', () => {
        const caballeroProtector = crearClaseBase({
            Prerrequisitos_flags: { alineamiento_requerido: true },
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
                alineamiento_requerido: [
                    { Id_alineamiento: 3, Id_alineamiento_basico: 1, Alineamiento_basico: 'Legal bueno', Opcional: 1, Frase: 'Legal bueno' },
                    { Id_alineamiento: 73, Id_alineamiento_basico: 2, Alineamiento_basico: 'Legal neutral', Opcional: 1, Frase: 'Legal neutral' },
                ],
            },
        });

        expect(evaluarElegibilidadClase(caballeroProtector, { ...crearContextoBase(), alineamiento: 'Legal bueno' }).estado).toBe('eligible');
        expect(evaluarElegibilidadClase(caballeroProtector, { ...crearContextoBase(), alineamiento: 'Legal neutral' }).estado).toBe('eligible');
        // Antes, el 3 de la combinación se leía como el básico 3 y la clase se abría al legal maligno.
        expect(evaluarElegibilidadClase(caballeroProtector, { ...crearContextoBase(), alineamiento: 'Legal maligno' }).estado).toBe('blocked_failed');
    });

    it('el género que pide una clase se compara por el nombre que da la API (`Genero_nombre`)', () => {
        const clase = crearClaseBase({
            Prerrequisitos_flags: { genero: true },
            Prerrequisitos: { ...crearClaseBase().Prerrequisitos, genero: [{ Genero: 2, Genero_nombre: 'Hembra', Opcional: 0, Frase: 'Género hembra' }] },
        });

        expect(evaluarElegibilidadClase(clase, { ...crearContextoBase(), genero: 'Hembra' }).estado).toBe('eligible');
        expect(evaluarElegibilidadClase(clase, { ...crearContextoBase(), genero: 'Macho' }).estado).toBe('blocked_failed');
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
                alineamiento_prohibido: [{ Id_alineamiento: 25, Id_alineamiento_basico: 9, Alineamiento_basico: 'Caótico maligno', opcional: 0 }],
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
                rangos_habilidad: [{ Id_habilidad: 600, Rangos: 8, Requiere_extra: 1, Extras: [{ Id_extra: 9, Extra: 'Saltos', Extra_comodin: null }], Opcional: 0 }],
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
                    Especiales: [], Plantillas: [], Dotes: [], Opcional: 0, Frase: 'Alas',
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

    describe('rangos_habilidad con especialidad (Saber, Artesanía…)', () => {
        // Los cinco huecos de Saber de `GET /habilidades` admiten las mismas especialidades: son una familia.
        const ESPECIALIDADES_SABER = [51, 55, 59, 60];
        const saber = (id: number, rangos: number, idExtra: number | null, extra: string) => ({
            id, nombre: `Saber ${id - 31}`, rangos, idExtra, extra, idsExtras: ESPECIALIDADES_SABER,
        });
        const pedido = (idHabilidad: number, rangos: number, extras: Array<[number, string]>, requiereExtra = extras.length > 0, opcional = 0) => ({
            Id_habilidad: idHabilidad,
            Habilidad: `Saber ${idHabilidad - 31}`,
            Rangos: rangos,
            Requiere_extra: requiereExtra ? 1 : 0,
            Extras: extras.map(([Id_extra, Extra]) => ({ Id_extra, Extra, Extra_comodin: null })),
            Opcional: opcional,
            Frase: `Saber${extras.length > 0 ? ` (${extras.map(([, extra]) => extra.toLowerCase()).join(' o ')})` : ''} ${rangos} rangos`,
        });
        const claseConRangos = (rangos: Record<string, any>[]) => crearClaseBase({
            Prerrequisitos_flags: { rangos_habilidad: true },
            Prerrequisitos: { ...crearClaseBase().Prerrequisitos, rangos_habilidad: rangos as any },
        });
        // Como en la creación, el personaje tiene todos los huecos del catálogo, aunque sea sin rangos.
        const conTodosLosHuecos = (habilidades: NonNullable<ClaseEvaluacionContexto['habilidades']>) => [
            ...habilidades,
            ...[32, 33, 34, 35, 36].filter((id) => !habilidades.some((h) => h.id === id)).map((id) => saber(id, 0, null, '')),
        ];
        const evaluar = (rangos: Record<string, any>[], habilidades: NonNullable<ClaseEvaluacionContexto['habilidades']>) =>
            evaluarElegibilidadClase(claseConRangos(rangos), { ...crearContextoBase(), habilidades: conTodosLosHuecos(habilidades) });

        // Demonologista (Libro de oscuridad vil, pág. 57): Saber (arcano) 4 en el hueco Saber 1 y Saber (los planos) 8 en Saber 2.
        const demonologista = [pedido(32, 4, [[51, 'Arcano']]), pedido(33, 8, [[59, 'Los planos']])];

        it('demonologista: cumple con Saber (los planos) en otro hueco', () => {
            const res = evaluar(demonologista, [saber(32, 8, 59, 'Los planos'), saber(33, 2, 60, 'Religión'), saber(35, 4, 51, 'Arcano')]);
            expect(res.estado).toBe('eligible');
        });

        it('demonologista: Saber (religión) en el hueco pedido no cumple Saber (los planos)', () => {
            const res = evaluar(demonologista, [saber(32, 4, 51, 'Arcano'), saber(33, 8, 60, 'Religión')]);
            expect(res.estado).toBe('blocked_failed');
            expect(res.razones).toEqual(['No cumple: Saber (los planos) 8 rangos']);
        });

        it('demonologista: la especialidad sin los rangos no cumple', () => {
            const res = evaluar(demonologista, [saber(32, 4, 51, 'Arcano'), saber(34, 7, 59, 'Los planos')]);
            expect(res.estado).toBe('blocked_failed');
        });

        it('Saber (cualquiera): vale cualquier hueco con su especialidad', () => {
            const cualquiera = [pedido(32, 4, [], true)];
            expect(evaluar(cualquiera, [saber(32, 0, null, ''), saber(36, 4, 55, 'Historia')]).estado).toBe('eligible');
            expect(evaluar(cualquiera, [saber(32, 3, 51, 'Arcano'), saber(36, 2, 55, 'Historia')]).estado).toBe('blocked_failed');
        });

        it('Saber (arcano o religión): vale cualquiera de las dos', () => {
            const unaDeDos = [pedido(32, 5, [[51, 'Arcano'], [60, 'Religión']])];
            expect(evaluar(unaDeDos, [saber(34, 5, 60, 'Religión')]).estado).toBe('eligible');
            expect(evaluar(unaDeDos, [saber(34, 5, 59, 'Los planos')]).estado).toBe('blocked_failed');
        });

        it('siervo de Demogorgon: el Saber sin especialidad es otro distinto de los que ya pide', () => {
            const siervo = [pedido(32, 2, [[51, 'Arcano']]), pedido(33, 2, [[60, 'Religión']]), pedido(34, 2, [], false)];
            const arcanoYReligion = [saber(32, 2, 51, 'Arcano'), saber(33, 2, 60, 'Religión'), saber(34, 0, null, '')];
            expect(evaluar(siervo, arcanoYReligion).estado).toBe('blocked_failed');
            expect(evaluar(siervo, [...arcanoYReligion, saber(36, 2, 59, 'Los planos')]).estado).toBe('eligible');
        });

        it('dos Saber (cualquiera) necesitan dos especialidades', () => {
            const dos = [pedido(32, 10, [], true), pedido(33, 4, [], true)];
            expect(evaluar(dos, [saber(32, 10, 51, 'Arcano')]).estado).toBe('blocked_failed');
            expect(evaluar(dos, [saber(32, 10, 51, 'Arcano'), saber(34, 4, 55, 'Historia')]).estado).toBe('eligible');
        });

        it('una habilidad sin familia se busca por su hueco', () => {
            const piruetas = [{ Id_habilidad: 30, Habilidad: 'Piruetas', Rangos: 4, Requiere_extra: 0, Extras: [], Opcional: 0 }];
            expect(evaluar(piruetas, [{ id: 30, nombre: 'Piruetas', rangos: 4, idExtra: null, extra: '' }]).estado).toBe('eligible');
            expect(evaluar(piruetas, [{ id: 31, nombre: 'Saltar', rangos: 9, idExtra: null, extra: '' }]).estado).toBe('blocked_failed');
        });
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
            Plantillas: [{ Id: 6, Nombre: 'Semidragón' }], Dotes: [],
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
                Id_aptitud_especial: 11, Aptitud_especial: 'Cuerpo o ataque flexible', Raciales: [], Especiales: [], Plantillas: [], Dotes: [],
                Opcional: 0, Frase: 'Cuerpo o ataque flexible',
            }), crearContextoBase());
            expect(res.estado).toBe('eligible');
            expect(res.razones).toEqual([]);
            expect(res.advertencias).toEqual(['La web no puede comprobar este requisito: Cuerpo o ataque flexible']);
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
                { alineamiento_requerido: [{ Id_alineamiento: 23, Id_alineamiento_basico: 4, Alineamiento_basico: 'Neutral bueno', Opcional: 0, Frase: 'Neutral bueno' }] },
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
                        { Id_alineamiento: 23, Id_alineamiento_basico: 4, Alineamiento_basico: 'Neutral bueno', Opcional: 1, Frase: 'Neutral bueno' },
                        { Id_alineamiento: 22, Id_alineamiento_basico: 7, Alineamiento_basico: 'Caótico bueno', Opcional: 1, Frase: 'Caótico bueno' },
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
                    alineamiento_prohibido: [{ Id_alineamiento: 3, Id_alineamiento_basico: 1, Alineamiento_basico: 'Legal bueno', Opcional: 0, Frase: 'No legal bueno' }],
                    ataque_base: [{ Cantidad: 10, Opcional: 0, Frase: 'Ataque base +10' }],
                },
            ), crearContextoBase());
            expect(res.estado).toBe('blocked_failed');
            expect(res.soloPorAlineamiento).toBeFalse();
        });
    });

    it('evalúa los prerrequisitos de Magic of Incarnum con su bandera (nivel de moldeador, sin lanzador arcano)', () => {
        const clase = crearClaseBase({
            Prerrequisitos_flags: { nivel_moldeador: true, sin_lanzador_arcano: true },
            Prerrequisitos: {
                ...crearClaseBase().Prerrequisitos,
                nivel_moldeador: [{ Nivel: 5, Opcional: 0, Frase: 'Moldeador de nivel 5' }],
                sin_lanzador_arcano: [{ Opcional: 0, Frase: 'No tener niveles de lanzador arcano' }],
            },
        });
        const contexto = crearContextoBase();
        const sinIncarnum = evaluarElegibilidadClase(clase, { ...contexto, lanzador: { arcano: 0, divino: 0, psionico: 0 } });
        expect(sinIncarnum.estado).toBe('blocked_failed');
        expect(sinIncarnum.razones).toEqual(['No cumple: Moldeador de nivel 5']);
        const moldeador = { reserva: 5, nivelMoldeador: 5, fusiones: 4, vinculos: 1, chakrasVinculables: [34] };
        expect(evaluarElegibilidadClase(clase, { ...contexto, incarnum: moldeador, lanzador: { arcano: 0, divino: 0, psionico: 0 } }).estado)
            .toBe('eligible');
        expect(evaluarElegibilidadClase(clase, { ...contexto, incarnum: moldeador, lanzador: { arcano: 1, divino: 0, psionico: 0 } }).razones)
            .toEqual(['No cumple: No tener niveles de lanzador arcano']);
    });

    describe('la deidad tutelar (la Hoja brillante de Heironeous, El divino completo, pág. 46)', () => {
        const hoja = crearClaseBase({
            Prerrequisitos_flags: { deidad: true } as any,
            Prerrequisitos: { deidad: [{ Id_deidad: 9, Deidad: 'Heironeous', Opcional: 0, Frase: 'Deidad tutelar: Heironeous' }] } as any,
        });

        it('solo con esa deidad, por su id o por su nombre', () => {
            expect(evaluarElegibilidadClase(hoja, { ...crearContextoBase(), deidad: { id: 9, nombre: 'Heironeous' } }).estado).toBe('eligible');
            expect(evaluarElegibilidadClase(hoja, { ...crearContextoBase(), deidad: { id: null, nombre: 'heironeous' } }).estado).toBe('eligible');
            const otra = evaluarElegibilidadClase(hoja, { ...crearContextoBase(), deidad: { id: 18, nombre: 'Pelor' } });
            expect(otra.estado).toBe('blocked_failed');
            expect(otra.razones).toEqual(['No cumple: Deidad tutelar: Heironeous']);
            expect(evaluarElegibilidadClase(hoja, crearContextoBase()).estado).toBe('blocked_failed');
        });

        it('lo que la corrección no deja quitar', () => {
            expect(incumpleDeidadTutelar(hoja, { id: 9, nombre: 'Heironeous' })).toEqual([]);
            expect(incumpleDeidadTutelar(hoja, null)).toEqual(['No cumple: Deidad tutelar: Heironeous']);
            expect(incumpleDeidadTutelar(crearClaseBase(), null)).toEqual([]);
        });
    });

    it('las clases compatibles con una restringida, por su id (el paladín y el hospitalario)', () => {
        const paladin = crearClaseBase({ Multiclase_restringida: true, Clases_multiclase_compatibles: [{ Id: 189, Nombre: 'Hospitalario' }] });
        expect(esClaseCompatibleConRestringida(paladin, 189)).toBeTrue();
        expect(esClaseCompatibleConRestringida(paladin, 7)).toBeFalse();
        expect(esClaseCompatibleConRestringida(crearClaseBase(), 189)).toBeFalse();
    });
});
