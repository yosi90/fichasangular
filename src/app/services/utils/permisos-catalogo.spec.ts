import { PERMISSION_RESOURCES } from 'src/app/interfaces/user-acl';
import { EDICIONES_CATALOGO, INSERCIONES_CATALOGO, TIPOS_EDICION, tieneInsercion, tipoEdicionDeListado } from './catalogos-editables';
import { LISTADOS_ROL } from './iconos-rol';
import { RECURSO_DE_CATALOGO, puedeGestionarCatalogo } from './permisos-catalogo';

describe('Permisos de los catálogos (docs/publica/CATALOGOS_ALTA_Y_EDICION_FRONT.md)', () => {
    const conPermisos = (...recursos: string[]) => ({
        can: jasmine.createSpy('can').and.callFake((recurso: string, accion: string) => accion === 'create' && recursos.includes(recurso)),
    });

    it('insertar y modificar miran el permiso de creación del recurso de su catálogo', () => {
        const usuario = conPermisos('razas');
        expect(puedeGestionarCatalogo(usuario, 'raciales')).toBeTrue();
        expect(puedeGestionarCatalogo(usuario, 'idiomas')).toBeTrue();
        expect(puedeGestionarCatalogo(usuario, 'clases')).toBeFalse();
        expect(usuario.can).not.toHaveBeenCalledWith(jasmine.anything(), 'update');
    });

    it('los monstruos, las armas, las armaduras y las deidades tienen su propio permiso', () => {
        expect(RECURSO_DE_CATALOGO['monstruos']).toBe('monstruos');
        expect(puedeGestionarCatalogo(conPermisos('tipos_criatura'), 'monstruos')).toBeFalse();
        expect(['armas', 'armaduras', 'deidades'].every((lista) => RECURSO_DE_CATALOGO[lista] === lista)).toBeTrue();
    });

    it('un catálogo sin permiso en la tabla no se puede gestionar', () => {
        expect(puedeGestionarCatalogo(conPermisos('objetos'), 'objetos')).toBeFalse();
    });

    it('cada recurso de la tabla existe en el backend y cada catálogo del menú es un listado', () => {
        Object.values(RECURSO_DE_CATALOGO).forEach((recurso) => expect(PERMISSION_RESOURCES).toContain(recurso));
        Object.keys(RECURSO_DE_CATALOGO).filter((lista) => lista !== 'manuales')
            .forEach((lista) => expect(LISTADOS_ROL[lista]).withContext(lista).toBeDefined());
    });
});

describe('Catálogos con pantalla de insertar o modificar', () => {
    it('cada uno tiene su permiso', () => {
        Object.keys(INSERCIONES_CATALOGO).forEach((lista) => expect(RECURSO_DE_CATALOGO[lista]).withContext(lista).toBeDefined());
        TIPOS_EDICION.forEach((tipo) => expect(RECURSO_DE_CATALOGO[EDICIONES_CATALOGO[tipo].listado]).withContext(tipo).toBeDefined());
    });

    it('sabe qué listado abre cada pantalla', () => {
        expect(tieneInsercion('razas')).toBeTrue();
        expect(tieneInsercion('armas')).toBeFalse();
        expect(tipoEdicionDeListado('raciales')).toBe('racial');
        expect(tipoEdicionDeListado('razas')).toBe('raza');
        expect(tipoEdicionDeListado('rasgos')).toBeNull();
    });
});
