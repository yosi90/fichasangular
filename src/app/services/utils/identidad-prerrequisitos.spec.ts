import {
    buildIdentidadPrerrequisitos,
    coincideClaveEntidad,
    existeCoincidenciaClaveEntidad,
    extraerIdsPositivos,
} from './identidad-prerrequisitos';

describe('identidad-prerrequisitos', () => {
    it('construye identidad basica para raza no mutada', () => {
        const identidad = buildIdentidadPrerrequisitos({
            Id: 10,
            Nombre: 'Humano',
            Tipo_criatura: { Id: 1, Nombre: 'Humanoide' },
            Subtipos: [{ Id: 11, Nombre: 'Humano' }],
        } as any, null);

        expect(identidad.razas.length).toBe(1);
        expect(identidad.razas[0].id).toBe(10);
        expect(identidad.tiposCriatura.length).toBe(1);
        expect(identidad.tiposCriatura[0].id).toBe(1);
        expect(identidad.subtipos.map((s) => s.nombre)).toEqual(['Humano']);
    });

    it('construye identidad dual con mutada + base y une subtipos', () => {
        const identidad = buildIdentidadPrerrequisitos(
            {
                Id: 20,
                Nombre: 'Prole de Bahamut',
                Tipo_criatura: { Id: 9, Nombre: 'Dragon' },
                Subtipos: [{ Id: 50, Nombre: 'Sangre de dragon' }],
            } as any,
            {
                Id: 10,
                Nombre: 'Humano',
                Tipo_criatura: { Id: 1, Nombre: 'Humanoide' },
                Subtipos: [{ Id: 11, Nombre: 'Humano' }],
            } as any,
            [{ Id: 11, Nombre: 'Humano' }, { Id: 51, Nombre: 'Planar' }],
        );

        expect(extraerIdsPositivos(identidad.razas)).toEqual([20, 10]);
        expect(extraerIdsPositivos(identidad.tiposCriatura)).toEqual([9, 1]);
        expect(extraerIdsPositivos(identidad.subtipos)).toEqual([50, 11, 51]);
    });

    it('hace matching por id y por nombre normalizado', () => {
        const claves = [
            { id: 10, nombre: 'Humano' },
            { id: null, nombre: 'Sangre de dragón' },
        ];

        expect(coincideClaveEntidad(claves[0], 10, null)).toBeTrue();
        expect(coincideClaveEntidad(claves[1], null, 'sangre de dragon')).toBeTrue();
        expect(existeCoincidenciaClaveEntidad(claves, null, 'SANGRE DE DRAGON')).toBeTrue();
        expect(existeCoincidenciaClaveEntidad(claves, 77, 'elfo')).toBeFalse();
    });
});
