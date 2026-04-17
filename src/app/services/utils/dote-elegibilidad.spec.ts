import { Dote } from 'src/app/interfaces/dote';
import { buildIdentidadPrerrequisitos } from './identidad-prerrequisitos';
import { DoteEvaluacionContexto, evaluarElegibilidadDote } from './dote-elegibilidad';

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
        salvaciones: {
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
                ataque_base: [{ Ataque_base: 3, Opcional: 0 }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({ ataqueBase: 2 }),
        });

        expect(resultado.estado).toBe('blocked_failed');
        expect(resultado.razones.length).toBeGreaterThan(0);
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

    it('exige dote previa con mismo extra cuando Id_extra es 0 y hay extra seleccionado', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                dote: [{
                    Dote_prerrequisito: 'Soltura con un arma',
                    Id_dote_prerrequisito: 4,
                    Id_extra: 0,
                    Opcional: 0,
                    Repetido: 0,
                }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                dotes: [{
                    id: 4,
                    nombre: 'Soltura con un arma',
                    idExtra: 33,
                    extra: 'Lanza',
                }],
            }),
            idExtraSeleccionado: 33,
            extraSeleccionado: 'Lanza',
        });

        expect(resultado.estado).toBe('eligible');
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

    it('acepta aliases legacy para id_extra y repetido en prerrequisito de dote', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                dote: [{
                    Id_dote_prerrequisito: 4,
                    e: 2,
                    r: 1,
                    Opcional: 0,
                }],
            },
        });

        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({
                dotes: [{
                    id: 4,
                    nombre: 'Soltura con un arma',
                    idExtra: 2,
                    extra: 'Lanza',
                }],
            }),
        });

        expect(resultado.estado).toBe('eligible');
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

    it('soporta alineamiento_requerido y alineamiento_prohibido', () => {
        const dote = crearDoteBase({
            Prerrequisitos: {
                alineamiento_requerido: [{ Id_alineamiento: 1, Opcional: 0 }],
                alineamiento_prohibido: [{ Id_alineamiento: 9, Opcional: 0 }],
            },
        });
        const resultado = evaluarElegibilidadDote({
            dote,
            contexto: crearContextoBase({ alineamiento: 'Legal bueno' }),
        });
        expect(resultado.estado).toBe('eligible');
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
});
