import { BehaviorSubject } from 'rxjs';
import { ChatFloatingService } from './chat-floating.service';

describe('ChatFloatingService.abrir', () => {
    let service: ChatFloatingService;
    let platformSessionSvc: { abrirChat: jasmine.Spy };

    beforeEach(() => {
        platformSessionSvc = { abrirChat: jasmine.createSpy('abrirChat').and.resolveTo(true) };
        service = new ChatFloatingService(
            { isLoggedIn$: new BehaviorSubject<boolean>(false), CurrentUserUid: '' } as any,
            { loadSettings: jasmine.createSpy('loadSettings'), saveSettings: jasmine.createSpy('saveSettings') } as any,
            platformSessionSvc as any,
        );
    });

    it('en escritorio abre la ventana «Chats» de Rol', async () => {
        spyOn(ChatFloatingService, 'esEscritorio').and.returnValue(true);
        let abierta = false;
        service.listWindow$.subscribe((ventana) => abierta = ventana?.open === true);

        expect(await service.abrir()).toBeTrue();
        expect(abierta).toBeTrue();
        expect(platformSessionSvc.abrirChat).not.toHaveBeenCalled();
    });

    it('en escritorio abre la conversación en su ventana de Rol', async () => {
        spyOn(ChatFloatingService, 'esEscritorio').and.returnValue(true);
        let ids: number[] = [];
        service.bubbles$.subscribe((burbujas) => ids = burbujas.map((item) => item.conversationId));

        expect(await service.abrir('42')).toBeTrue();
        expect(ids).toEqual([42]);
    });

    it('fuera de escritorio usa el chat de la plataforma', async () => {
        spyOn(ChatFloatingService, 'esEscritorio').and.returnValue(false);

        expect(await service.abrir(7)).toBeTrue();
        expect(platformSessionSvc.abrirChat).toHaveBeenCalledWith(7);
    });

    it('rechaza un identificador de conversación no válido', async () => {
        spyOn(ChatFloatingService, 'esEscritorio').and.returnValue(true);

        expect(await service.abrir('conv-x')).toBeFalse();
        expect(platformSessionSvc.abrirChat).not.toHaveBeenCalled();
    });

    it('decide escritorio con la misma regla que antes de la migración', () => {
        expect(ChatFloatingService.esEscritorio(1366, 768)).toBeTrue();
        expect(ChatFloatingService.esEscritorio(1200, 800)).toBeFalse();
        expect(ChatFloatingService.esEscritorio(1400, 650)).toBeFalse();
        expect(ChatFloatingService.esEscritorio(800, 1400)).toBeFalse();
    });
});
