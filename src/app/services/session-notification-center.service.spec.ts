import { SessionNotificationCenterService } from './session-notification-center.service';

describe('SessionNotificationCenterService', () => {
    let service: SessionNotificationCenterService;

    beforeEach(() => {
        localStorage.clear();
        service = new SessionNotificationCenterService();
    });

    afterEach(() => {
        localStorage.clear();
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

    it('markSeen no vuelve a emitir cuando todas las entradas objetivo ya estaban vistas', () => {
        const entryId = service.add({
            source: 'toast',
            level: 'info',
            title: 'Primera',
            message: 'A',
        });

        let emissions = 0;
        service.entries$.subscribe(() => emissions += 1);

        service.markSeen([entryId]);
        const emissionsAfterFirstMark = emissions;

        service.markSeen([entryId]);

        expect(emissionsAfterFirstMark).toBeGreaterThan(1);
        expect(emissions).toBe(emissionsAfterFirstMark);
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

    it('restaura notificaciones persistidas y poda las más antiguas de 24h', () => {
        const now = Date.now();
        localStorage.setItem('fichas3.5.session-notifications.v1', JSON.stringify([
            {
                id: 'fresh',
                dedupeKey: 'guard.uid-1',
                source: 'toast',
                level: 'warning',
                title: 'Reciente',
                message: 'Sigue visible',
                createdAt: now - 60_000,
                seenAt: null,
                countdownUntil: now + 30_000,
                countdownLabel: 'Fin del bloqueo',
                actionLabel: null,
            },
            {
                id: 'stale',
                dedupeKey: null,
                source: 'toast',
                level: 'info',
                title: 'Vieja',
                message: 'Debe podarse',
                createdAt: now - (24 * 60 * 60 * 1000 + 1),
                seenAt: null,
                countdownUntil: null,
                countdownLabel: null,
                actionLabel: null,
            },
        ]));

        service = new SessionNotificationCenterService();

        let entries = [] as any[];
        service.entries$.subscribe((value) => entries = value);

        expect(entries.length).toBe(1);
        expect(entries[0].id).toBe('fresh');
        expect(entries[0].countdownLabel).toBe('Fin del bloqueo');
    });

    it('reutiliza la misma entrada persistida cuando llega otra con el mismo dedupeKey', () => {
        const firstId = service.add({
            dedupeKey: 'guard.uid-1',
            source: 'toast',
            level: 'warning',
            title: 'Bloqueo',
            message: 'Inicial',
            countdownUntil: Date.now() + 60_000,
            countdownLabel: 'Fin del cooldown',
        });

        const secondId = service.add({
            dedupeKey: 'guard.uid-1',
            source: 'toast',
            level: 'error',
            title: 'Bloqueo actualizado',
            message: 'Backend confirmado',
            countdownUntil: Date.now() + 120_000,
            countdownLabel: 'Fin de la restricción',
        });

        let entries = [] as any[];
        service.entries$.subscribe((value) => entries = value);

        expect(firstId).toBe(secondId);
        expect(entries.length).toBe(1);
        expect(entries[0].title).toBe('Bloqueo actualizado');
        expect(entries[0].level).toBe('error');
    });

    it('incrementa el contador cuando una entrada deduplicada explícitamente cambia de texto', () => {
        service.add({
            dedupeKey: 'guard.uid-1',
            source: 'toast',
            level: 'warning',
            title: 'Protección temporal activada',
            message: 'Primer aviso',
        });

        service.add({
            dedupeKey: 'guard.uid-1',
            source: 'toast',
            level: 'warning',
            title: 'Protección temporal activada',
            message: 'Primer aviso actualizado',
        });

        let entries = [] as any[];
        service.entries$.subscribe((value) => entries = value);

        expect(entries.length).toBe(1);
        expect(entries[0].message).toBe('Primer aviso actualizado');
        expect(entries[0].repeatCount).toBe(2);
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
