import { Dote } from 'src/app/interfaces/dote';
import { buildIdentidadPrerrequisitos } from './identidad-prerrequisitos';
import { DoteEvaluacionContexto, dotesConCuentaComo, evaluarElegibilidadDote } from './dote-elegibilidad';

function crearDoteBase(partial?: Partial<Dote>): Dote {
    return {
        Id: 1,
        Nombre: 'Dote de prueba',
        Descripcion: '',
        Beneficio: '',
        Normal: '',
        Especial: '',
        Manual: { Id: 1, Nombre: 'Manual', Pagina: 1 },
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
        Extras_de_todo_el_catalogo: { Armas: false, Armaduras: false, Escuelas: false, Habilidades: false },
        Modificadores: {},
        Prerrequisitos: {},
        ...partial,
    };
}

function crearContextoBase(parcial?: Partial<DoteEvaluacionContexto>): DoteEvaluacionContexto {
    return {
        identidad: buildIdentidadPrerrequisitos(
            { Id: 10, Nombre: 'Humano', Tipo_criatura: { Id: 1, Nombre: 'Humanoide' } as any } as any,
            null,
            []
        ),
        caracteristicas: {
            Fuerza: 10,
            Destreza: 10,
            Constitucion: 10,
            Inteligencia: 10,
            Sabiduria: 10,
            Carisma: 10,
        },
        ataqueBase: 0,
        nivelesClase: [],
        dotes: [],
        idiomas: [],
        habilidades: [],
        conjuros: [],
        competenciasArmas: [],
        lanzador: {
            arcano: 0,
            divino: 0,
            psionico: 0,
        },
        salvacionesBase: {
            fortaleza: 0,
            reflejos: 0,
            voluntad: 0,
        },
        alineamiento: 'Neutral autentico',
        puedeSeleccionarCompanero: false,
        puedeSeleccionarFamiliar: false,
        ...parcial,
    };
}

describe('dote-elegibilidad', () => {
    it('permite una dote cuando cumple ataque base', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                ataque_base: [{ Ataque_base: 1, Opcional: 0 }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({ ataqueBase: 2 }),
        });

        expect(resultado.estado).toBe('eligible');
    });

    it('evalua poder seleccionar compañero con el cupo calculado por el contexto', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                poder_seleccionar_companero: [{ Activo: true }],
            },
        });

        const bloqueado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({ puedeSeleccionarCompanero: false }),
        });
        const permitido = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({ puedeSeleccionarCompanero: true }),
        });

        expect(bloqueado.estado).toBe('blocked_failed');
        expect(permitido.estado).toBe('eligible');
    });

    it('evalua poder seleccionar familiar con el cupo calculado por el contexto', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                poder_seleccionar_familiar: [{ Activo: true }],
            },
        });

        const bloqueado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({ puedeSeleccionarFamiliar: false }),
        });
        const permitido = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({ puedeSeleccionarFamiliar: true }),
        });

        expect(bloqueado.estado).toBe('blocked_failed');
        expect(permitido.estado).toBe('eligible');
    });

    it('bloquea por fallo si no cumple ataque base', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                ataque_base: [{ Ataque_base: 3, Opcional: 0, Frase: 'Ataque base +3' }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({ ataqueBase: 2 }),
        });

        expect(resultado.estado).toBe('blocked_failed');
        expect(resultado.razones).toEqual(['No cumple: Ataque base +3']);
    });

    it('un grupo de alternativas sin ninguna cumplida da sus frases unidas con «o»', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                caracteristica: [
                    { Id_caracteristica: 1, Caracteristica: 'Fuerza', Cantidad: 13, Opcional: 1, Frase: 'Fuerza 13' },
                    { Id_caracteristica: 2, Caracteristica: 'Destreza', Cantidad: 13, Opcional: 1, Frase: 'Destreza 13' },
                ],
            },
        });
        const resultado = evaluarElegibilidadDote({ dote, contexto: crearContextoBase() });

        expect(resultado.estado).toBe('blocked_failed');
        expect(resultado.razones).toEqual(['No cumple: Fuerza 13 o Destreza 13']);
    });

    it('sin frase (una caché anterior) el motivo nombra el tipo', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                dg: [{ Cantidad: 4, Opcional: 0 }],
            },
        });
        const resultado = evaluarElegibilidadDote({ dote, contexto: crearContextoBase({ dgTotal: 1 }) });

        expect(resultado.razones).toEqual(['No cumple: Dg']);
    });

    it('salvacion_minimo se compara con la salvación base de clase, no con el total', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                salvacion_minimo: [{ Fortaleza: 2, Reflejos: 0, Voluntad: 0, Opcional: 0, Frase: 'Salvación base de Fortaleza +2' }],
            },
        });

        const sinBase = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({ salvacionesBase: { fortaleza: 1, reflejos: 0, voluntad: 0 } }),
        });
        expect(sinBase.estado).toBe('blocked_failed');
        expect(sinBase.razones).toEqual(['No cumple: Salvación base de Fortaleza +2']);

        const conBase = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({ salvacionesBase: { fortaleza: 2, reflejos: 0, voluntad: 0 } }),
        });
        expect(conBase.estado).toBe('eligible');
    });

    it('resuelve grupo opcional global entre familias distintas', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                lanzador_arcano: [{ Nivel: 5, Opcional: 1 }],
                lanzador_divino: [{ Nivel: 5, Opcional: 1 }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                lanzador: { arcano: 0, divino: 5, psionico: 0 },
            }),
        });

        expect(resultado.estado).toBe('eligible');
    });

    it('Extra_comodin «elegir» exige la dote pedida con el mismo extra que se elige', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                dote: [{
                    Dote_prerrequisito: 'Soltura con un arma',
                    Id_dote_prerrequisito: 4,
                    Id_extra: 0,
                    Extra: null,
                    Extra_comodin: 'elegir',
                    Opcional: 0,
                    Repetido: 0,
                    Frase: 'Soltura con un arma (el arma elegida)',
                }],
            },
        });
        const contexto = crearContextoBase({
            dotes: [{ id: 4, nombre: 'Soltura con un arma', idExtra: 33, extra: 'Lanza' }],
        });

        expect(evaluarElegibilidadDote({ dote, contexto, idExtraSeleccionado: 33, extraSeleccionado: 'Lanza' }).estado).toBe('eligible');
        const otraArma = evaluarElegibilidadDote({ dote, contexto, idExtraSeleccionado: 7, extraSeleccionado: 'Daga' });
        expect(otraArma.estado).toBe('blocked_failed');
        expect(otraArma.razones).toEqual(['No cumple: Soltura con un arma (el arma elegida)']);
    });

    it('Extra_comodin «cualquiera» vale con la dote pedida y cualquier extra', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                dote: [{
                    Dote_prerrequisito: 'Soltura con un arma',
                    Id_dote_prerrequisito: 4,
                    Id_extra: 0,
                    Extra: null,
                    Extra_comodin: 'cualquiera',
                    Opcional: 0,
                    Repetido: 0,
                    Frase: 'Soltura con un arma (cualquier arma)',
                }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({ dotes: [{ id: 4, nombre: 'Soltura con un arma', idExtra: 12, extra: 'Alabarda' }] }),
            idExtraSeleccionado: 3,
            extraSeleccionado: 'Otra',
        });

        expect(resultado.estado).toBe('eligible');
    });

    it('el 0 sin marca de comodín (la dote pedida no admite extras) no exige el extra elegido', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                dote: [{
                    Dote_prerrequisito: 'Ataque poderoso',
                    Id_dote_prerrequisito: 2,
                    Id_extra: 0,
                    Extra: null,
                    Extra_comodin: null,
                    Opcional: 0,
                    Repetido: 0,
                    Frase: 'Ataque poderoso',
                }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({ dotes: [{ id: 2, nombre: 'Ataque poderoso', idExtra: 0, extra: '' }] }),
            idExtraSeleccionado: 33,
            extraSeleccionado: 'Lanza',
        });

        expect(resultado.estado).toBe('eligible');
    });

    it('un extra concreto exige ese extra', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                dote: [{
                    Dote_prerrequisito: 'Soltura con un arma',
                    Id_dote_prerrequisito: 4,
                    Id_extra: 5,
                    Extra: 'Daga',
                    Extra_comodin: null,
                    Opcional: 0,
                    Repetido: 0,
                    Frase: 'Soltura con un arma (daga)',
                }],
            },
        });
        const conDaga = crearContextoBase({ dotes: [{ id: 4, nombre: 'Soltura con un arma', idExtra: 5, extra: 'Daga' }] });
        const conLanza = crearContextoBase({ dotes: [{ id: 4, nombre: 'Soltura con un arma', idExtra: 33, extra: 'Lanza' }] });

        expect(evaluarElegibilidadDote({ dote, contexto: conDaga }).estado).toBe('eligible');
        expect(evaluarElegibilidadDote({ dote, contexto: conLanza }).estado).toBe('blocked_failed');
    });

    it('evalúa repetido para prerrequisito de dote', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                dote: [{
                    Id_dote_prerrequisito: 4,
                    Id_extra: -1,
                    Repetido: 2,
                    Opcional: 0,
                }],
            },
        });

        const fallo = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                dotes: [{
                    id: 4,
                    nombre: 'Soltura con un arma',
                    idExtra: -1,
                    extra: '',
                }],
            }),
        });
        expect(fallo.estado).toBe('blocked_failed');

        const ok = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                dotes: [
                    { id: 4, nombre: 'Soltura con un arma', idExtra: -1, extra: '' },
                    { id: 4, nombre: 'Soltura con un arma', idExtra: -1, extra: '' },
                ],
            }),
        });
        expect(ok.estado).toBe('eligible');
    });

    it('conjuros_escuela cuenta conjuros accesibles efectivos y no solo conjuros seleccionados', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                conjuros_escuela: [{ Escuela: 'Nigromancia', Cantidad: 3 }],
            },
        });

        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                conjuros: [
                    { id: 1, nombre: 'Toque macabro', idEscuela: null, escuela: 'Nigromancia' },
                    { id: 2, nombre: 'Rayo debilitador', idEscuela: null, escuela: 'Nigromancia' },
                    { id: 3, nombre: 'Causar miedo', idEscuela: null, escuela: 'Nigromancia' },
                ],
                conjurosAccesibles: [],
            }),
        });

        expect(resultado.estado).toBe('blocked_failed');
    });

    it('conjuros_escuela exige la cantidad minima en la lista accesible efectiva', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                conjuros_escuela: [{ Escuela: 'Nigromancia', Cantidad: 3 }],
            },
        });

        const insuficiente = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                conjurosAccesibles: [
                    { id: 1, nombre: 'Toque macabro', idEscuela: null, escuela: 'Nigromancia' },
                    { id: 2, nombre: 'Rayo debilitador', idEscuela: null, escuela: 'Nigromancia' },
                ],
            }),
        });
        const suficiente = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                conjurosAccesibles: [
                    { id: 1, nombre: 'Toque macabro', idEscuela: null, escuela: 'Nigromancia' },
                    { id: 2, nombre: 'Rayo debilitador', idEscuela: null, escuela: 'Nigromancia' },
                    { id: 3, nombre: 'Causar miedo', idEscuela: null, escuela: 'Nigromancia' },
                ],
            }),
        });

        expect(insuficiente.estado).toBe('blocked_failed');
        expect(suficiente.estado).toBe('eligible');
    });

    it('id_extra negativo exige dote sin extra', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                dote: [{
                    Id_dote_prerrequisito: 4,
                    Id_extra: -1,
                    Opcional: 0,
                }],
            },
        });

        const ok = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                dotes: [{
                    id: 4,
                    nombre: 'Soltura con un arma',
                    idExtra: 0,
                    extra: '',
                }],
            }),
        });
        expect(ok.estado).toBe('eligible');

        const fallo = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                dotes: [{
                    id: 4,
                    nombre: 'Soltura con un arma',
                    idExtra: 9,
                    extra: 'Lanza',
                }],
            }),
        });
        expect(fallo.estado).toBe('blocked_failed');
    });

    it('soporta alineamiento_requerido y alineamiento_prohibido, con el básico y no la combinación', () => {
        // Como los da la API: `Id_alineamiento` es la combinación de `alineamientos` (el LB «siempre», la 3).
        const dote = crearDoteBase({
            Prerrequisitos: {
                alineamiento_requerido: [{ Id_alineamiento: 3, Id_alineamiento_basico: 1, Alineamiento_basico: 'Legal bueno', Opcional: 0 }],
                alineamiento_prohibido: [{ Id_alineamiento: 25, Id_alineamiento_basico: 9, Alineamiento_basico: 'Caótico maligno', Opcional: 0 }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({ alineamiento: 'Legal bueno' }),
        });
        expect(resultado.estado).toBe('eligible');
        expect(evaluarElegibilidadDote({ dote, contexto: crearContextoBase({ alineamiento: 'Legal maligno' }) }).estado).toBe('blocked_failed');
    });

    it('soporta competencia_armadura y competencia_grupo_arma', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                competencia_armadura: [{ Id_armadura: 2, Opcional: 0 }],
                competencia_grupo_arma: [{ Id_grupo: 7, Opcional: 0 }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                competenciasArmaduras: [{ id: 2, nombre: 'Escudos' }],
                competenciasGrupoArmas: [{ id: 7, nombre: 'Armas exóticas' }],
            }),
        });
        expect(resultado.estado).toBe('eligible');
    });

    it('soporta dg, nivel y nivel_max', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                dg: [{ Cantidad: 4, Opcional: 0 }],
                nivel: [{ Nivel: 3, Opcional: 0 }],
                nivel_max: [{ Nivel: 5, Opcional: 0 }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                dgTotal: 4,
                nivelTotal: 5,
            }),
        });
        expect(resultado.estado).toBe('eligible');
    });

    it('soporta dominio y tipo_criatura', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                dominio: [{ Id_dominio: 3, Opcional: 0 }],
                tipo_criatura: [{ Id_tipo: 1, Opcional: 0 }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                dominios: [{ id: 3, nombre: 'Ley' }],
                tipoCriaturaId: 1,
            }),
        });
        expect(resultado.estado).toBe('eligible');
    });

    it('soporta escuela_nivel y lanzar_conjuros_arcanos_nivel', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                escuela_nivel: [{ Id_escuela: 4, Nivel: 5, Opcional: 0 }],
                lanzar_conjuros_arcanos_nivel: [{ Nivel: 3, Opcional: 0 }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                lanzador: { arcano: 6, divino: 0, psionico: 0 },
                escuelaEspecialista: { id: 4, nombre: 'Evocación', nivelArcano: 6 },
                nivelesConjuroMaximos: { arcano: 3, divino: 0 },
            }),
        });
        expect(resultado.estado).toBe('eligible');
    });

    it('soporta tamano_maximo/tamano_minimo y tipo_dote', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                tamano_maximo: [{ Id_tamano: 5, Opcional: 0 }],
                tamano_minimo: [{ Id_tamano: 3, Opcional: 0 }],
                tipo_dote: [{ Id_tipo: 8, Opcional: 0 }],
                limite_tipo_dote: [{ Id_tipo: 8, Opcional: 0 }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                tamanoId: 4,
                tiposDote: [{ id: 8, nombre: 'Metamágica' }],
            }),
        });
        expect(resultado.estado).toBe('eligible');
    });

    it('soporta clase_especial con Id_extra 0 como comodin', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                clase_especial: [{ Id_especial: 99, Id_extra: 0, Opcional: 0 }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                claseas: [{ id: 99, nombre: 'Forma salvaje', idExtra: 3, extra: 'Lobo' }],
            }),
        });
        expect(resultado.estado).toBe('eligible');
    });

    it('clase_especial sin Id_extra (null, antes el extra 0 «Nada») vale con cualquier extra', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                clase_especial: [{ Id_especial: 99, Id_extra: null, Extra: null, Opcional: 0 }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                claseas: [{ id: 99, nombre: 'Forma salvaje', idExtra: 3, extra: 'Lobo' }],
            }),
        });
        expect(resultado.estado).toBe('eligible');
    });

    it('competencia_arma con Arma_comodin «elegir» pide la competencia con el arma elegida como extra', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                competencia_arma: [{ Id_arma: 0, Arma: 'Elegir', Arma_comodin: 'elegir', Opcional: 0 }],
            },
        });
        const contexto = crearContextoBase({ competenciasArmas: [{ id: 17, nombre: 'Espada larga' }] });
        expect(evaluarElegibilidadDote({ dote, contexto, idExtraSeleccionado: 17, extraSeleccionado: 'Espada larga' }).estado)
            .toBe('eligible');
        expect(evaluarElegibilidadDote({ dote, contexto, idExtraSeleccionado: 18, extraSeleccionado: 'Hacha' }).estado)
            .toBe('blocked_failed');
    });

    it('competencia_arma sin la marca de comodín no compara el nombre «Elegir»', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                competencia_arma: [{ Id_arma: 0, Arma: 'Elegir', Arma_comodin: null, Opcional: 0 }],
            },
        });
        const contexto = crearContextoBase({ competenciasArmas: [{ id: 17, nombre: 'Espada larga' }] });
        expect(evaluarElegibilidadDote({ dote, contexto, idExtraSeleccionado: 17, extraSeleccionado: 'Espada larga' }).estado)
            .not.toBe('eligible');
    });

    it('region queda en unknown cuando no hay contexto suficiente', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                region: [{ Id_region: 2, Opcional: 0 }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase(),
        });
        expect(resultado.estado).toBe('blocked_unknown');
    });

    it('region se valida por catalogo cuando solo hay nombre actual e id requerido', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                region: [{ Id_region: 2, Opcional: 0 }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                region: { id: null, nombre: 'Costa de la espada' },
                catalogoRegiones: [{ id: 2, nombre: 'Costa de la espada' }],
            }),
        });
        expect(resultado.estado).toBe('eligible');
    });

    it('region con id actual 0 falla cuando la dote requiere una region concreta', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                region: [{ Id_region: 2, Opcional: 0 }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                region: { id: 0, nombre: 'Sin región' },
            }),
        });
        expect(resultado.estado).toBe('blocked_failed');
    });

    describe('aptitud_especial', () => {
        const alas = {
            Id_aptitud_especial: 10,
            Aptitud_especial: 'Alas',
            Raciales: [{ Id: 41, Nombre: 'Aspecto de dragón (Alas)' }],
            Especiales: [{ Id: 1631, Nombre: 'Alas' }, { Id: 1752, Nombre: 'Desarrollar alas' }],
            Plantillas: [], Dotes: [],
            Opcional: 0,
            Frase: 'Alas',
        };
        const armaDeAliento = {
            Id_aptitud_especial: 13,
            Aptitud_especial: 'Arma de aliento',
            Raciales: [{ Id: 74, Nombre: 'Arma de aliento (dragón azul)' }],
            Especiales: [{ Id: 2388, Nombre: 'Arma de aliento' }],
            Plantillas: [{ Id: 6, Nombre: 'Semidragón' }], Dotes: [],
            Opcional: 0,
            Frase: 'Arma de aliento',
        };
        const evaluar = (aptitud: Record<string, any>, contexto: Partial<DoteEvaluacionContexto>) => evaluarElegibilidadDote({
            dote: crearDoteBase({ Prerrequisitos: { aptitud_especial: [aptitud] } }),
            contexto: crearContextoBase(contexto),
        });

        it('se cumple con uno de los raciales que la otorgan', () => {
            expect(evaluar(alas, { raciales: [{ id: 41, nombre: 'Aspecto de dragón (Alas)' }] }).estado).toBe('eligible');
        });

        it('se cumple con uno de los especiales de clase que la otorgan', () => {
            const resultado = evaluar(alas, { claseas: [{ id: 1752, nombre: 'Desarrollar alas', idExtra: null, extra: '' }] });
            expect(resultado.estado).toBe('eligible');
        });

        it('se cumple con una de las plantillas que la otorgan', () => {
            expect(evaluar(armaDeAliento, { plantillas: [{ id: 6, nombre: 'Semidragón' }] }).estado).toBe('eligible');
        });

        it('se cumple con una de las dotes que la otorgan', () => {
            const conDote = { ...armaDeAliento, Dotes: [{ Id: 296, Nombre: 'Aliento dragonil' }] };
            const resultado = evaluar(conDote, { dotes: [{ id: 296, nombre: 'Aliento dragonil', idExtra: 0, extra: '' }] });
            expect(resultado.estado).toBe('eligible');
        });

        it('sin el id, se reconoce el racial por su nombre', () => {
            expect(evaluar(armaDeAliento, { raciales: [{ id: null, nombre: 'Arma de aliento (dragón azul)' }] }).estado).toBe('eligible');
        });

        it('no se cumple sin ninguno de los que la otorgan: «No cumple: {Frase}»', () => {
            const resultado = evaluar(alas, {
                raciales: [{ id: 74, nombre: 'Arma de aliento (dragón azul)' }],
                plantillas: [{ id: 6, nombre: 'Semidragón' }],
            });
            expect(resultado.estado).toBe('blocked_failed');
            expect(resultado.razones).toEqual(['No cumple: Alas']);
        });

        const ampliasZancadas = {
            Id_aptitud_especial: 14, Aptitud_especial: 'Amplias zancadas', Raciales: [], Especiales: [], Plantillas: [], Dotes: [],
            Opcional: 0, Frase: 'Amplias zancadas',
        };

        it('sin equivalencias la web no puede comprobarla: se deja elegir con un aviso', () => {
            const resultado = evaluar(ampliasZancadas, { raciales: [{ id: 41, nombre: 'Aspecto de dragón (Alas)' }] });
            expect(resultado.estado).toBe('eligible');
            expect(resultado.razones).toEqual([]);
            expect(resultado.advertencias).toEqual(['La web no puede comprobar este requisito: Amplias zancadas']);
        });

        it('el aviso acompaña a la dote aunque otro prerrequisito la bloquee', () => {
            const resultado = evaluarElegibilidadDote({
                dote: crearDoteBase({
                    Prerrequisitos: { aptitud_especial: [ampliasZancadas], ataque_base: [{ Ataque_base: 4, Opcional: 0, Frase: 'Ataque base +4' }] },
                }),
                contexto: crearContextoBase({ ataqueBase: 1 }),
            });
            expect(resultado.estado).toBe('blocked_failed');
            expect(resultado.razones).toEqual(['No cumple: Ataque base +4']);
            expect(resultado.advertencias).toEqual(['La web no puede comprobar este requisito: Amplias zancadas']);
        });

        it('en un grupo de alternativas, sin otra que se cumpla, avisa y deja elegir', () => {
            const resultado = evaluarElegibilidadDote({
                dote: crearDoteBase({
                    Prerrequisitos: { aptitud_especial: [{ ...alas, Opcional: 1 }, { ...ampliasZancadas, Opcional: 1 }] },
                }),
                contexto: crearContextoBase(),
            });
            expect(resultado.estado).toBe('eligible');
            expect(resultado.advertencias).toEqual(['La web no puede comprobar este requisito: Amplias zancadas']);
        });

        it('en un grupo de alternativas, si otra se cumple de verdad, no avisa', () => {
            const resultado = evaluarElegibilidadDote({
                dote: crearDoteBase({
                    Prerrequisitos: { aptitud_especial: [{ ...alas, Opcional: 1 }, { ...ampliasZancadas, Opcional: 1 }] },
                }),
                contexto: crearContextoBase({ raciales: [{ id: 41, nombre: 'Aspecto de dragón (Alas)' }] }),
            });
            expect(resultado.estado).toBe('eligible');
            expect(resultado.advertencias).toEqual([]);
        });

        it('como alternativa, basta con que se cumpla otra del grupo', () => {
            const resultado = evaluarElegibilidadDote({
                dote: crearDoteBase({
                    Prerrequisitos: {
                        aptitud_especial: [{ ...alas, Opcional: 1 }, { ...armaDeAliento, Opcional: 1 }],
                    },
                }),
                contexto: crearContextoBase({ plantillas: [{ id: 6, nombre: 'Semidragón' }] }),
            });
            expect(resultado.estado).toBe('eligible');
        });
    });

    describe('Magic of Incarnum', () => {
        const incarnum = { reserva: 2, nivelMoldeador: 4, fusiones: 3, vinculos: 1, chakrasVinculables: [34] };

        it('evalúa los prerrequisitos nuevos con la frase de la API', () => {
            const dote = crearDoteBase({
                Prerrequisitos: {
                    esencia_minima: [{ Cantidad: 1, Opcional: 0, Frase: 'Tener reserva de esencia' }],
                    vinculo_chakra: [{ Id_chakra: 42, Chakra: 'Corazón', Opcional: 0, Frase: 'Poder vincular fusiones al chakra Corazón' }],
                },
            });
            const resultado = evaluarElegibilidadDote({ dote, contexto: crearContextoBase({ incarnum }) });
            expect(resultado.estado).toBe('blocked_failed');
            expect(resultado.razones).toEqual(['No cumple: Poder vincular fusiones al chakra Corazón']);
            expect(evaluarElegibilidadDote({
                dote,
                contexto: crearContextoBase({ incarnum: { ...incarnum, chakrasVinculables: [34, 42] } }),
            }).estado).toBe('eligible');
        });

        it('sin incarnum no se cumplen los que piden moldear, y sí `sin_esencia`', () => {
            const pide = crearDoteBase({ Prerrequisitos: { fusiones_minimas: [{ Cantidad: 1, Opcional: 0, Frase: 'Poder moldear fusiones' }] } });
            const prohibe = crearDoteBase({ Prerrequisitos: { sin_esencia: [{ Opcional: 0, Frase: 'No tener reserva de esencia' }] } });
            expect(evaluarElegibilidadDote({ dote: pide, contexto: crearContextoBase() }).estado).toBe('blocked_failed');
            expect(evaluarElegibilidadDote({ dote: prohibe, contexto: crearContextoBase() }).estado).toBe('eligible');
        });

        it('la reserva psiónica y el nivel de poder psiónico también en las dotes', () => {
            const dote = crearDoteBase({ Prerrequisitos: {
                reserva_psionica: [{ Cantidad: 3, Opcional: 0, Frase: 'Reserva psiónica de 3 o más' }],
                lanzar_poder_psionico_nivel: [{ Nivel: 1, Opcional: 0, Frase: 'Manifestar poderes de nivel 1' }],
            } });
            expect(evaluarElegibilidadDote({ dote, contexto: crearContextoBase({ reservaPsionica: 3, nivelPoderPsionicoMaximo: 1 }) }).estado).toBe('eligible');
            expect(evaluarElegibilidadDote({ dote, contexto: crearContextoBase({ reservaPsionica: 2, nivelPoderPsionicoMaximo: 1 }) }).estado).toBe('blocked_failed');
        });

        it('una dote que «cuenta como» otra la sustituye en los prerrequisitos', () => {
            const catalogo: Record<number, Dote> = { 1087: crearDoteBase({ Id: 1087, Nombre: 'Dureza azur', Cuenta_como: [{ Id: 43, Nombre: 'Dureza' }] }) };
            const dotes = dotesConCuentaComo([{ id: 1087, nombre: 'Dureza azur', idExtra: 0, extra: '' }], (id) => catalogo[id]);
            expect(dotes.map((d) => d.nombre)).toEqual(['Dureza azur', 'Dureza']);
            const pideDureza = crearDoteBase({ Prerrequisitos: { dote: [{ Id_dote_prerrequisito: 43, Dote_prerrequisito: 'Dureza', Opcional: 0, Frase: 'Dureza' }] } });
            expect(evaluarElegibilidadDote({ dote: pideDureza, contexto: crearContextoBase({ dotes }) }).estado).toBe('eligible');
        });
    });
});
