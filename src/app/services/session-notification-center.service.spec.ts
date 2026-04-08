import { SessionNotificationCenterService } from './session-notification-center.service';

describe('SessionNotificationCenterService', () => {
    let service: SessionNotificationCenterService;

    beforeEach(() => {
        service = new SessionNotificationCenterService();
    });

    it('añade entradas en orden descendente de creación', () => {
        service.add({
            source: 'toast',
            level: 'info',
            title: 'Primera',
            message: 'A',
        });
        service.add({
            source: 'swal',
            level: 'warning',
            title: 'Segunda',
            message: 'B',
        });

        let entries = [] as any[];
        service.entries$.subscribe((value) => entries = value);

        expect(entries.length).toBe(2);
        expect(entries[0].title).toBe('Segunda');
        expect(entries[1].title).toBe('Primera');
    });

    it('calcula si hay entradas no vistas y permite marcarlas de forma selectiva', () => {
        service.add({
            source: 'toast',
            level: 'info',
            title: 'Primera',
            message: 'A',
        });
        service.add({
            source: 'toast',
            level: 'success',
            title: 'Segunda',
            message: 'B',
        });

        let entries = [] as any[];
        let hasUnread = false;
        service.entries$.subscribe((value) => entries = value);
        service.hasUnread$.subscribe((value) => hasUnread = value);

        service.markSeen([entries[0].id]);

        expect(entries[0].seenAt).not.toBeNull();
        expect(entries[1].seenAt).toBeNull();
        expect(hasUnread).toBeTrue();

        service.markSeen([entries[1].id]);
        expect(hasUnread).toBeFalse();
    });

    it('borra entradas individuales sin tocar el resto', () => {
        service.add({
            source: 'toast',
            level: 'info',
            title: 'Primera',
            message: 'A',
        });
        service.add({
            source: 'swal',
            level: 'error',
            title: 'Segunda',
            message: 'B',
        });

        let entries = [] as any[];
        service.entries$.subscribe((value) => entries = value);
        const removedId = entries[0].id;

        service.remove(removedId);

        expect(entries.length).toBe(1);
        expect(entries[0].title).toBe('Primera');
    });

    it('archiva automáticamente swal simples de resultado', () => {
        const result = service.prepareSwalInvocation([{
            icon: 'success',
            title: 'Guardado',
            text: 'Perfil actualizado',
        }]);

        let entries = [] as any[];
        service.entries$.subscribe((value) => entries = value);

        expect(result[0]['sessionNotification']).toBeUndefined();
        expect(entries.length).toBe(1);
        expect(entries[0].source).toBe('swal');
        expect(entries[0].level).toBe('success');
        expect(entries[0].title).toBe('Guardado');
    });

    it('excluye prompts y confirmaciones operativas de la captura automática', () => {
        service.prepareSwalInvocation([{
            icon: 'warning',
            title: '¿Borrar?',
            text: 'Esto no se puede deshacer',
            showCancelButton: true,
        }]);
        service.prepareSwalInvocation([{
            icon: 'info',
            title: 'Introduce un nombre',
            input: 'text',
        }]);

        let entries = [] as any[];
        service.entries$.subscribe((value) => entries = value);

        expect(entries.length).toBe(0);
    });

    it('respeta metadata explícita de sessionNotification', () => {
        const action = jasmine.createSpy('action');

        const result = service.prepareSwalInvocation([{
            icon: 'warning',
            title: 'Revisión pendiente',
            text: 'Tienes una tarea pendiente',
            showCancelButton: true,
            sessionNotification: {
                include: true,
                level: 'warning',
                actionLabel: 'Abrir',
                action,
            },
        }]);

        let entries = [] as any[];
        service.entries$.subscribe((value) => entries = value);

        expect(result[0]['sessionNotification']).toBeUndefined();
        expect(entries.length).toBe(1);
        expect(entries[0].level).toBe('warning');
        expect(entries[0].actionLabel).toBe('Abrir');
        expect(entries[0].action).toBe(action);
    });

    it('permite excluir explícitamente un swal del histórico', () => {
        service.prepareSwalInvocation([{
            icon: 'success',
            title: 'Guardado',
            sessionNotification: false,
        }]);

        let entries = [] as any[];
        service.entries$.subscribe((value) => entries = value);

        expect(entries.length).toBe(0);
    });
});
