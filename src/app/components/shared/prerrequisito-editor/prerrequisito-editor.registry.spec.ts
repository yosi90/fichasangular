import {
    PrerequisiteCatalogContext,
    PrerequisiteCatalogItem,
    PrerequisiteRowModel,
} from './prerrequisito-editor.models';
import { buildPrerequisitePayload } from './prerrequisito-editor.registry';

describe('prerrequisito-editor.registry', () => {
    const catalogosPorTipo = new Map<string, PrerequisiteCatalogItem[]>([
        ['dote', [{ id: 1, nombre: 'Ataque poderoso' }]],
        ['clase_especial', [{ id: 8, nombre: 'Musica de bardo' }]],
        ['habilidad', [{ id: 7, nombre: 'Acrobacias' }]],
    ]);

    const context: PrerequisiteCatalogContext = {
        getCatalog: (type) => catalogosPorTipo.get(type) ?? [],
        getCatalogName: (type, id) => (catalogosPorTipo.get(type) ?? []).find((item) => item.id === id)?.nombre ?? '',
        getDoteExtraOptions: () => [{ id: 101, nombre: 'Espada larga' }],
        dotePermiteExtra: (idDote) => idDote === 1,
        getGlobalExtraOptions: () => [{ id: 55, nombre: 'Planos' }],
        habilidadPermiteExtra: (idHabilidad) => idHabilidad === 7,
        especialPermiteExtra: (idEspecial) => idEspecial === 8,
    };

    function row(partial: Partial<PrerequisiteRowModel>): PrerequisiteRowModel {
        return {
            uid: 'pre',
            tipo: 'dote',
            id: 0,
            valor: 1,
            opcional: 0,
            id_extra: null,
            repetido: 1,
            requiere_extra: false,
            salvacion_tipo: 'fortaleza',
            ...partial,
        };
    }

    it('serializa dote con repetido e id_extra', () => {
        const payload = buildPrerequisitePayload([
            row({ tipo: 'dote', id: 1, repetido: 3, id_extra: 101 }),
        ], context);

        expect(payload['dote'][0]).toEqual({
            Id_dote_prerrequisito: 1,
            Dote_prerrequisito: 'Ataque poderoso',
            Repetido: 3,
            Id_extra: 101,
        });
    });

    it('serializa clase_especial con id_extra', () => {
        const payload = buildPrerequisitePayload([
            row({ tipo: 'clase_especial', id: 8, id_extra: 0 }),
        ], context);

        expect(payload['clase_especial'][0]).toEqual({
            Id_especial: 8,
            Clase_especial: 'Musica de bardo',
            Id_extra: 0,
        });
    });

    it('serializa habilidad con requiere_extra', () => {
        const payload = buildPrerequisitePayload([
            row({ tipo: 'habilidad', id: 7, valor: 5, requiere_extra: true }),
        ], context);

        expect(payload['habilidad'][0]).toEqual({
            Id_habilidad: 7,
            Habilidad: 'Acrobacias',
            Cantidad: 5,
            Requiere_extra: true,
        });
    });

    it('serializa salvacion_minimo segun la salvacion elegida', () => {
        const payload = buildPrerequisitePayload([
            row({ tipo: 'salvacion_minimo', valor: 6, salvacion_tipo: 'reflejos' }),
        ], context);

        expect(payload['salvacion_minimo'][0]).toEqual({
            Fortaleza: 0,
            Reflejos: 6,
            Voluntad: 0,
        });
    });
});
