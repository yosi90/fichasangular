import { PERMISSION_RESOURCES } from 'src/app/interfaces/user-acl';
import { EDICIONES_CATALOGO, INSERCIONES_CATALOGO, TIPOS_EDICION, tieneInsercion, tipoEdicionDeListado } from './catalogos-editables';
import { LISTADOS_ROL } from './iconos-rol';
import { RECURSO_DE_CATALOGO, puedeGestionarCatalogo } from './permisos-catalogo';

const conPermisos = (...recursos: string[]) => ({
    can: jasmine.createSpy('can').and.callFake((recurso: string, accion: string) => accion === 'create' && recursos.includes(recurso)),
});

describe('Permisos de los catálogos (docs/publica/CATALOGOS_ALTA_Y_EDICION_FRONT.md)', () => {

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
        expect(puedeGestionarCatalogo(conPermisos('inventado'), 'inventado')).toBeFalse();
    });

    it('munición, materiales, aptitudes, objetos y conjuntos piden el permiso objetos (hito 7)', () => {
        ['munición', 'materiales especiales', 'aptitudes de armas y armaduras', 'objetos', 'conjuntos de objetos']
            .forEach((lista) => expect(RECURSO_DE_CATALOGO[lista]).withContext(lista).toBe('objetos'));
        expect(puedeGestionarCatalogo(conPermisos('objetos'), 'munición')).toBeTrue();
    });

    it('cada recurso de la tabla existe en el backend y cada catálogo del menú es un listado', () => {
        Object.values(RECURSO_DE_CATALOGO).forEach((recurso) => expect(PERMISSION_RESOURCES).toContain(recurso));
        // Los manuales no están en el menú lateral y las desventajas se listan con las ventajas (con su propio permiso).
        Object.keys(RECURSO_DE_CATALOGO).filter((lista) => !['manuales', 'desventajas'].includes(lista))
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
        expect(tieneInsercion('armas')).toBeTrue();
        expect(tieneInsercion('objetos')).toBeTrue();
        expect(tieneInsercion('deidades')).toBeFalse();
        expect(tipoEdicionDeListado('munición')).toBe('municion');
        expect(tipoEdicionDeListado('conjuntos de objetos')).toBe('conjunto');
        expect(tipoEdicionDeListado('armaduras')).toBe('armadura');
        expect(tipoEdicionDeListado('raciales')).toBe('racial');
        expect(tipoEdicionDeListado('razas')).toBe('raza');
        expect(tipoEdicionDeListado('rasgos')).toBe('rasgo');
        expect(tipoEdicionDeListado('fusiones del alma')).toBe('fusion');
        expect(tipoEdicionDeListado('chakras')).toBe('chakra');
        expect(tipoEdicionDeListado('deidades')).toBeNull();
    });

    it('las ventajas y las desventajas se modifican desde el mismo listado, cada una con su tipo y su permiso', () => {
        expect(tieneInsercion('ventajas')).toBeTrue();
        expect(tipoEdicionDeListado('ventajas')).toBe('ventaja');
        expect(tipoEdicionDeListado('ventajas', { Id: 1, Coste: -4 })).toBe('ventaja');
        expect(tipoEdicionDeListado('ventajas', { Id: 22, Coste: 5 })).toBe('desventaja');
        expect(puedeGestionarCatalogo(conPermisos('desventajas'), 'desventajas')).toBeTrue();
        expect(puedeGestionarCatalogo(conPermisos('desventajas'), 'ventajas')).toBeFalse();
    });
});
