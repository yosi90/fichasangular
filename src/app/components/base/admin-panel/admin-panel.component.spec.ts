import { AdminPanelComponent } from './admin-panel.component';
import { CACHE_CONTRACT_MANIFEST } from 'src/app/config/cache-contract-manifest';

function createComponent(): AdminPanelComponent {
    const deps = Array.from({ length: AdminPanelComponent.length }, () => ({} as any));
    return new AdminPanelComponent(...deps as ConstructorParameters<typeof AdminPanelComponent>);
}

describe('AdminPanelComponent', () => {
    let component: AdminPanelComponent;

    beforeEach(() => {
        component = createComponent();
    });

    it('ya no sincroniza la caché de usuarios y ACL, que es del backend', () => {
        expect(CACHE_CONTRACT_MANIFEST.map((entry) => entry.key as string)).not.toContain('usuarios_acl_cache');
    });


    it('incluye actitudes en el manifiesto de sincronizacion', () => {
        expect(CACHE_CONTRACT_MANIFEST).toContain(jasmine.objectContaining({
            key: 'actitudes',
            label: 'Actitudes',
        }));
    });

    it('incluye catalogos auxiliares pequenos en el manifiesto de sincronizacion', () => {
        expect(CACHE_CONTRACT_MANIFEST).toEqual(jasmine.arrayContaining([
            jasmine.objectContaining({ key: 'maniobrabilidades', label: 'Maniobrabilidades' }),
            jasmine.objectContaining({ key: 'tipos_dado', label: 'Tipos de dado' }),
            jasmine.objectContaining({ key: 'componentes_conjuros', label: 'Componentes de conjuros' }),
            jasmine.objectContaining({ key: 'descriptores_conjuros', label: 'Descriptores de conjuros' }),
        ]));
    });

    it('filtra sincronizaciones por texto', () => {
        component.syncItemsOrdenados = [
            { key: 'actitudes', label: 'Actitudes', schemaVersion: 1, run: async () => true, lastSuccessAt: null, lastSuccessIso: null, isPrimary: true, lastSuccessTexto: 'Sin cacheo' },
            { key: 'razas', label: 'Razas', schemaVersion: 5, run: async () => true, lastSuccessAt: 1, lastSuccessIso: '', isPrimary: false, lastSuccessTexto: '20/04/2026 10:00' },
        ] as any;
        component.syncFiltroTexto = 'acti';

        expect(component.syncItemsVisibles.map((item) => item.key)).toEqual(['actitudes']);
    });

    it('filtra sincronizaciones pendientes con chip', () => {
        component.syncItemsOrdenados = [
            { key: 'actitudes', label: 'Actitudes', schemaVersion: 1, run: async () => true, lastSuccessAt: null, lastSuccessIso: null, isPrimary: true, lastSuccessTexto: 'Sin cacheo' },
            { key: 'razas', label: 'Razas', schemaVersion: 5, run: async () => true, lastSuccessAt: 1, lastSuccessIso: '', isPrimary: false, lastSuccessTexto: '20/04/2026 10:00' },
        ] as any;

        expect(component.syncPendientesCount).toBe(1);
        component.toggleSyncSoloPendientes();

        expect(component.syncSoloPendientes).toBeTrue();
        expect(component.syncItemsVisibles.map((item) => item.key)).toEqual(['actitudes']);
    });

    it('no ejecuta una sincronización sin rol de administración', async () => {
        const run = jasmine.createSpy('run').and.resolveTo(true);
        component.esAdmin = false;

        await component.ejecutarSync({ key: 'razas', label: 'Razas', schemaVersion: 5, run } as any);

        expect(run).not.toHaveBeenCalled();
    });
});
