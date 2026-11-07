import {
    PrerequisiteCatalogContext,
    PrerequisiteCatalogItem,
    PrerequisiteRowModel,
} from './prerrequisito-editor.models';
import { registrarTiposPrerrequisito } from 'src/app/services/utils/prerrequisito-frase';
import {
    TIPOS_PRERREQUISITO_SOLO_PLANTILLA, buildPrerequisitePayload, claveDeMutacion, esTipoDeMutacion, getPrerequisiteDefinition,
    getPrerequisiteTypeOptions, registrarTiposDeMutacion, tipoDeMutacion, updatePrerequisiteRow,
} from './prerrequisito-editor.registry';

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

    it('serializa los extras pedidos de una habilidad solo con requiere_extra', () => {
        const conExtras = buildPrerequisitePayload([row({ tipo: 'habilidad', id: 7, valor: 5, requiere_extra: true, extras: [12, 3, 12] })], context);
        expect(conExtras['habilidad'][0]).toEqual({ Id_habilidad: 7, Habilidad: 'Acrobacias', Cantidad: 5, Requiere_extra: true, Extras: [3, 12] });
        const sinRequerir = buildPrerequisitePayload([row({ tipo: 'habilidad', id: 7, valor: 5, requiere_extra: false, extras: [3] })], context);
        expect(sinRequerir['habilidad'][0]['Extras']).toBeUndefined();
    });

    it('quitar «requiere extra» o cambiar de habilidad vacía los extras pedidos', () => {
        const filas = [row({ uid: 'h', tipo: 'habilidad', id: 7, valor: 5, requiere_extra: true, extras: [3] })];
        expect(updatePrerequisiteRow(filas, 'h', { requiere_extra: false }, context)[0].extras).toEqual([]);
        expect(updatePrerequisiteRow(filas, 'h', { id: 9 }, context)[0].extras).toEqual([]);
        expect(updatePrerequisiteRow(filas, 'h', { valor: 6 }, context)[0].extras).toEqual([3]);
    });

    it('la competencia con un arma admite su comodín: el arma elegida (id 0)', () => {
        const definicion = getPrerequisiteDefinition('competencia_arma');
        expect(definicion.comodinLabel).toBe('El arma elegida');
        expect(definicion.isComplete(row({ tipo: 'competencia_arma', id: 0 }))).toBeFalse();
        expect(definicion.isComplete(row({ tipo: 'competencia_arma', id: 0, comodin: true }))).toBeTrue();
        expect(buildPrerequisitePayload([row({ tipo: 'competencia_arma', id: 0, comodin: true })], context)['competencia_arma'][0])
            .toEqual(jasmine.objectContaining({ Id_arma: 0 }));
        const filas = [row({ uid: 'a', tipo: 'competencia_arma', id: 0, comodin: true })];
        expect(updatePrerequisiteRow(filas, 'a', { id: 4 }, context)[0].comodin).toBeFalse();
        expect(getPrerequisiteDefinition('competencia_armadura').comodinLabel).toBeUndefined();
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

    it('nombra cada tipo con el nombre de GET /prerrequisitos/tipos, también en las opciones ya construidas', () => {
        const opciones = getPrerequisiteTypeOptions((type) => type === 'caracteristica' || type === 'raza');
        expect(opciones.map((opcion) => opcion.key)).toEqual(['caracteristica', 'raza']);

        registrarTiposPrerrequisito([
            { Clave: 'caracteristica', Nombre: 'Característica mínima', Ejemplo: 'Fuerza 13', Entidades: ['dote'] },
            { Clave: 'raza', Nombre: 'Raza', Ejemplo: 'Kobold', Entidades: ['dote'] },
        ]);

        expect(getPrerequisiteDefinition('caracteristica').label).toBe('Característica mínima');
        expect(opciones.map((opcion) => opcion.label)).toEqual(['Característica mínima', 'Raza']);
    });
});

describe('prerrequisito-editor.registry, los tipos de las plantillas', () => {
    const nombres = new Map<number, string>([[5, 'Humanoide'], [7, 'Bestia mágica'], [14, 'Incorporal']]);
    const context = {
        getCatalog: () => [],
        getCatalogName: (_: any, id: number) => nombres.get(id) ?? '',
        getDoteExtraOptions: () => [],
        dotePermiteExtra: () => false,
        getGlobalExtraOptions: () => [],
        habilidadPermiteExtra: () => false,
        especialPermiteExtra: () => false,
    };
    const fila = (tipo: any, cambios: any) => ({ ...getPrerequisiteDefinition(tipo).createDefaultRow(), ...cambios });

    it('nivel_lanzador es un valor (el nivel mínimo) y está completo con un nivel mayor que 0', () => {
        const definicion = getPrerequisiteDefinition('nivel_lanzador');
        expect(definicion.editorKind).toBe('value-only');
        expect(definicion.isComplete(fila('nivel_lanzador', { valor: 0 }))).toBeFalse();
        expect(buildPrerequisitePayload([fila('nivel_lanzador', { valor: 11 })], context)['nivel_lanzador']).toEqual([{ Nivel: 11 }]);
    });

    it('subtipo_prohibido elige un subtipo del catálogo de subtipos', () => {
        const definicion = getPrerequisiteDefinition('subtipo_prohibido');
        expect(definicion.editorKind).toBe('catalog-only');
        expect(definicion.requiredCatalogs).toEqual(['subtipos']);
        expect(buildPrerequisitePayload([fila('subtipo_prohibido', { id: 14, opcional: 2 })], context)['subtipo_prohibido'])
            .toEqual([{ Opcional: 2, Id_subtipo: 14, Subtipo: 'Incorporal' }]);
    });

    it('criaturas_compatibles es un par de tipos de criatura: el que se pide y en qué se convierte', () => {
        const definicion = getPrerequisiteDefinition('criaturas_compatibles');
        expect(definicion.editorKind).toBe('catalog-pair');
        expect(definicion.createDefaultRow().id_destino).toBe(0);
        expect(definicion.isComplete(fila('criaturas_compatibles', { id: 5, id_destino: 0 }))).toBeTrue();
        expect(buildPrerequisitePayload([fila('criaturas_compatibles', { id: 5, id_destino: 7 })], context)['criaturas_compatibles'])
            .toEqual([{ Id_tipo_compatible: 5, Tipo_compatible: 'Humanoide', Id_tipo_nuevo: 7, Tipo_nuevo: 'Bestia mágica' }]);
    });

    it('los tres solo los ofrecen las plantillas', () => {
        expect(Array.from(TIPOS_PRERREQUISITO_SOLO_PLANTILLA).sort()).toEqual(['criaturas_compatibles', 'nivel_lanzador', 'subtipo_prohibido']);
    });
    describe('los tipos de las razas mutadas (datos de la API, fase 3)', () => {
        const tipo = (Clave: string, pide: { referencia?: boolean; cantidad?: boolean; texto?: boolean; }) => ({
            Clave, Nombre: `Nombre de ${Clave}`, Ejemplo: '', Sujeto: 'raza_base' as const, Dato: Clave, Comparador: 'es',
            Catalogo: pide.referencia ? 'tipos_criatura' : null, Pide_referencia: pide.referencia === true,
            Pide_cantidad: pide.cantidad === true, Pide_texto: pide.texto === true,
        });

        it('genera su editor según lo que pide, con un prefijo que no choca con los de dotes y clases', () => {
            const claves = registrarTiposDeMutacion([
                tipo('tipo_criatura', { referencia: true }),
                tipo('caracteristica', { referencia: true, cantidad: true }),
                tipo('dgs_raciales_maximos', { cantidad: true }),
                tipo('condicion_master', { texto: true }),
            ]);

            expect(claves).toEqual(['mutacion.tipo_criatura', 'mutacion.caracteristica', 'mutacion.dgs_raciales_maximos',
                'mutacion.condicion_master']);
            expect(claves.map((clave) => getPrerequisiteDefinition(clave).editorKind))
                .toEqual(['catalog-only', 'catalog-plus-value', 'value-only', 'text-only']);
            expect(getPrerequisiteDefinition('mutacion.tipo_criatura').label).toBe('Nombre de tipo_criatura');
            // El de las dotes sigue siendo el suyo.
            expect(getPrerequisiteDefinition('tipo_criatura').editorKind).toBe('catalog-only');
            expect(esTipoDeMutacion('mutacion.x')).toBeTrue();
            expect(esTipoDeMutacion('tipo_criatura')).toBeFalse();
            expect(claveDeMutacion('mutacion.caracteristica')).toBe('caracteristica');
            expect(tipoDeMutacion('mutacion.dgs_raciales_maximos')?.Pide_cantidad).toBeTrue();
            expect(tipoDeMutacion('tipo_criatura')).toBeNull();
        });

        it('completa y manda cada fila con lo que pide su tipo', () => {
            registrarTiposDeMutacion([tipo('caracteristica', { referencia: true, cantidad: true }), tipo('condicion_master', { texto: true }),
                tipo('dgs_raciales_maximos', { cantidad: true })]);
            const fila = (clave: string, cambios: Partial<PrerequisiteRowModel>): PrerequisiteRowModel =>
                ({ ...getPrerequisiteDefinition(`mutacion.${clave}`).createDefaultRow(), ...cambios });
            const caracteristica = getPrerequisiteDefinition('mutacion.caracteristica');
            const condicion = getPrerequisiteDefinition('mutacion.condicion_master');
            const dgs = getPrerequisiteDefinition('mutacion.dgs_raciales_maximos');

            expect(caracteristica.isComplete(fila('caracteristica', { id: 0, valor: 3 }))).toBeFalse();
            expect(caracteristica.toPayload(fila('caracteristica', { id: 4, valor: 3, opcional: 2 }), context))
                .toEqual({ tipo: 'caracteristica', id_referencia: 4, cantidad: 3, opcional: 2 });
            expect(condicion.isComplete(fila('condicion_master', { texto: '  ' }))).toBeFalse();
            expect(condicion.toPayload(fila('condicion_master', { texto: ' El rito ' }), context))
                .toEqual({ tipo: 'condicion_master', texto: 'El rito' });
            // Una cantidad de 0 vale (sin DG raciales).
            expect(dgs.isComplete(fila('dgs_raciales_maximos', { valor: 0 }))).toBeTrue();
            expect(dgs.toPayload(fila('dgs_raciales_maximos', { valor: 0 }), context)).toEqual({ tipo: 'dgs_raciales_maximos', cantidad: 0 });
        });
    });
});
