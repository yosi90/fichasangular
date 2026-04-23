import { AdminPanelComponent } from './admin-panel.component';
import { CACHE_CONTRACT_MANIFEST } from 'src/app/config/cache-contract-manifest';
import { fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';

function createComponent(overrides: {
    adminUsersSvc?: any;
    userProfileApiSvc?: any;
} = {}): AdminPanelComponent {
    const deps = Array.from({ length: 42 }, () => ({} as any));
    deps[36] = overrides.adminUsersSvc ?? jasmine.createSpyObj('AdminUsersService', ['assertAdminAccess']);
    deps[38] = overrides.userProfileApiSvc ?? jasmine.createSpyObj('UserProfileApiService', ['listRoleRequests']);
    return new AdminPanelComponent(...deps as ConstructorParameters<typeof AdminPanelComponent>);
}

describe('AdminPanelComponent feedback navigation', () => {
    let component: AdminPanelComponent;

    beforeEach(() => {
        component = createComponent();
    });

    it('expone secciones separadas para bugs y funcionalidades', () => {
        expect(component.sectionItems).toEqual(jasmine.arrayContaining([
            jasmine.objectContaining({
                id: 'feedback-bugs',
                label: 'Informes de bugs',
                icon: 'bug_report',
            }),
            jasmine.objectContaining({
                id: 'feedback-features',
                label: 'Peticiones de funcionalidad',
                icon: 'lightbulb',
            }),
        ]));
    });

    it('configura acciones rápidas distintas para funcionalidades', () => {
        expect(component.bugFeedbackQuickActions.map((action) => action.status)).toEqual([
            'resolved',
            'closed',
            'rejected',
            'triaged',
        ]);
        expect(component.featureFeedbackQuickActions.map((action) => action.status)).toEqual([
            'planned',
            'in_progress',
            'resolved',
            'closed',
            'rejected',
            'triaged',
        ]);
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

    it('acepta openRequest directo a sincronizacion', () => {
        component.ngOnChanges({
            openRequest: {
                currentValue: { section: 'sync', requestId: 101 },
            },
        } as any);

        expect(component.currentSection).toBe('sync');
    });

    it('carga solicitudes de rol pendientes si el openRequest llega antes de confirmar admin', async () => {
        const adminUsersSvc = jasmine.createSpyObj('AdminUsersService', ['assertAdminAccess']);
        adminUsersSvc.assertAdminAccess.and.resolveTo();
        const userProfileApiSvc = jasmine.createSpyObj('UserProfileApiService', ['listRoleRequests']);
        userProfileApiSvc.listRoleRequests.and.callFake((filters: any) => {
            if (filters?.status === 'pending')
                return Promise.resolve([
                    { requestId: 17, requestedRole: 'master' },
                ]);
            return Promise.resolve([]);
        });
        component = createComponent({ adminUsersSvc, userProfileApiSvc });

        component.ngOnChanges({
            openRequest: {
                currentValue: { section: 'role-requests', pendingOnly: true, requestId: 202 },
            },
        } as any);

        expect(component.currentSection).toBe('role-requests');
        expect(userProfileApiSvc.listRoleRequests).not.toHaveBeenCalled();

        await (component as any).onAdminStateChanged(true);

        expect(adminUsersSvc.assertAdminAccess).toHaveBeenCalled();
        expect(userProfileApiSvc.listRoleRequests).toHaveBeenCalledWith({ status: 'pending' });
        expect(component.solicitudesMasterPendientes.map((item) => item.requestId)).toEqual([17]);
    });

    it('reintenta una vez si la alerta de solicitudes llega antes de que la API liste pendientes', fakeAsync(() => {
        const userProfileApiSvc = jasmine.createSpyObj('UserProfileApiService', ['listRoleRequests']);
        let pendingReads = 0;
        userProfileApiSvc.listRoleRequests.and.callFake((filters: any) => {
            if (filters?.status !== 'pending')
                return Promise.resolve([]);
            pendingReads++;
            return Promise.resolve(pendingReads > 1
                ? [{ requestId: 23, requestedRole: 'colaborador' }]
                : []);
        });
        component = createComponent({ userProfileApiSvc });
        component.esAdmin = true;
        component.currentSection = 'role-requests';
        component.resaltarSolicitudesPendientes = true;

        void component.cargarSolicitudesRolPendientes({ retryOnceIfEmpty: true });
        flushMicrotasks();

        expect(component.haySolicitudesRolPendientes).toBeFalse();
        expect(pendingReads).toBe(1);

        tick(900);
        flushMicrotasks();

        expect(pendingReads).toBe(2);
        expect(component.solicitudesColaboradorPendientes.map((item) => item.requestId)).toEqual([23]);
    }));
});
