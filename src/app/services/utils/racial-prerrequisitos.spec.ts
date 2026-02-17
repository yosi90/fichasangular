import { RacialDetalle } from 'src/app/interfaces/racial';
import { buildIdentidadPrerrequisitos } from './identidad-prerrequisitos';
import { evaluarRacialParaSeleccion } from './racial-prerrequisitos';

function crearRacialBase(): RacialDetalle {
    return {
        Id: 1,
        Nombre: 'Racial de prueba',
        Descripcion: '',
        Opcional: 1,
        Dotes: [],
        Habilidades: { Base: [], Custom: [] },
        Caracteristicas: [],
        Salvaciones: [],
        Sortilegas: [],
        Ataques: [],
        Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
        Prerrequisitos: { raza: [], caracteristica: [] },
    };
}

function crearIdentidadDual() {
    return buildIdentidadPrerrequisitos(
        {
            Id: 20,
            Nombre: 'Prole de Bahamut',
            Tipo_criatura: { Id: 9, Nombre: 'Dragon' },
            Subtipos: [{ Id: 50, Nombre: 'Sangre de dragon' }],
        } as any,
        {
            Id: 10,
            Nombre: 'Elfo',
            Tipo_criatura: { Id: 1, Nombre: 'Humanoide' },
            Subtipos: [{ Id: 11, Nombre: 'Elfo' }],
        } as any,
        [{ Id: 51, Nombre: 'Planar' }],
    );
}

describe('racial-prerrequisitos', () => {
    it('cumple por raza mutada', () => {
        const racial = crearRacialBase();
        racial.Prerrequisitos_flags.raza = true;
        racial.Prerrequisitos.raza = [{ id_raza: 20 }];

        const resultado = evaluarRacialParaSeleccion(racial, crearIdentidadDual());
        expect(resultado.estado).toBe('eligible');
    });

    it('cumple por raza base aunque no cumpla la mutada', () => {
        const racial = crearRacialBase();
        racial.Prerrequisitos_flags.raza = true;
        racial.Prerrequisitos.raza = [{ id_raza: 10 }];

        const resultado = evaluarRacialParaSeleccion(racial, crearIdentidadDual());
        expect(resultado.estado).toBe('eligible');
    });

    it('falla cuando no coincide ni raza mutada ni base', () => {
        const racial = crearRacialBase();
        racial.Prerrequisitos_flags.raza = true;
        racial.Prerrequisitos.raza = [{ id_raza: 999 }];

        const resultado = evaluarRacialParaSeleccion(racial, crearIdentidadDual());
        expect(resultado.estado).toBe('blocked');
        expect(resultado.razones.length).toBeGreaterThan(0);
    });

    it('cumple por tipo base o tipo mutado', () => {
        const porTipoBase = crearRacialBase();
        porTipoBase.Prerrequisitos_flags.raza = true;
        porTipoBase.Prerrequisitos.raza = [{ id_tipo_criatura: 1 }];

        const porTipoMutado = crearRacialBase();
        porTipoMutado.Prerrequisitos_flags.raza = true;
        porTipoMutado.Prerrequisitos.raza = [{ id_tipo_criatura: 9 }];

        expect(evaluarRacialParaSeleccion(porTipoBase, crearIdentidadDual()).estado).toBe('eligible');
        expect(evaluarRacialParaSeleccion(porTipoMutado, crearIdentidadDual()).estado).toBe('eligible');
    });

    it('cumple por subtipo acumulado', () => {
        const racial = crearRacialBase();
        racial.Prerrequisitos_flags.raza = true;
        racial.Prerrequisitos.raza = [{ id_subtipo: 51 }];

        const resultado = evaluarRacialParaSeleccion(racial, crearIdentidadDual());
        expect(resultado.estado).toBe('eligible');
    });

    it('marca eligible_with_warning cuando no puede interpretar un prerequisito', () => {
        const racial = crearRacialBase();
        racial.Prerrequisitos_flags.raza = true;
        racial.Prerrequisitos.raza = [{ campo_desconocido: 'x' }];

        const resultado = evaluarRacialParaSeleccion(racial, crearIdentidadDual());
        expect(resultado.estado).toBe('eligible_with_warning');
        expect(resultado.advertencias.length).toBeGreaterThan(0);
    });
});
