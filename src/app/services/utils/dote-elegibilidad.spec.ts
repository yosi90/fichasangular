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
});
