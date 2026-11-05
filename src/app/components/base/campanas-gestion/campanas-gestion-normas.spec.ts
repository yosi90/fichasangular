import { Subject } from 'rxjs';
import { CampanasGestionEstado } from './campanas-gestion.estado';

// Crear o cambiar campañas, tramas y subtramas pide antes las normas de Rol si faltan (decisión 5 de la ronda de
// noviembre); la limitación de creación de la moderación sigue bloqueando sin preguntar nada.
describe('CampanasGestionEstado con las normas de Rol pendientes', () => {
    let estado: CampanasGestionEstado;
    let userSvc: any;
    let campanaSvc: any;
    let toast: any;

    beforeEach(() => {
        userSvc = {
            getCurrentRole: () => 'master',
            can: () => true,
            canProceed: () => true,
            CurrentUserUid: 'uid-1',
            getAccessRestrictionMessage: jasmine.createSpy('getAccessRestrictionMessage').and.returnValue(''),
            getComplianceErrorMessage: () => '',
            normasDeCreacionPendientes: true,
            asegurarNormasDeCreacion: jasmine.createSpy('asegurarNormasDeCreacion').and.resolveTo(true),
        };
        campanaSvc = jasmine.createSpyObj('CampanaService', ['createTrama', 'getCampaignDetail', 'listProfileCampaigns', 'watchCampaignSummaries']);
        campanaSvc.createTrama.and.resolveTo({});
        campanaSvc.getCampaignDetail.and.resolveTo(null);
        toast = jasmine.createSpyObj('AppToastService', ['showSuccess', 'showError', 'showInfo']);
        estado = new CampanasGestionEstado(
            userSvc,
            campanaSvc,
            { events$: new Subject() } as any,
            {} as any,
            toast,
            { shouldAllow: () => ({ status: 'allowed' }) } as any,
            {} as any,
            {} as any,
        );
        estado.uidActual = 'uid-1';
        estado.campaigns = [{ id: 7, nombre: 'El paso gris', campaignRole: 'master', membershipStatus: 'activo' } as any];
        estado.selectedCampaignId = 7;
        estado.tramaCreateDraft = 'La caravana';
    });

    it('«Nueva campaña» pide las normas y, aceptadas, abre el editor de crear', async () => {
        estado.seleccionarNuevaCampana();
        expect(estado.isCreatingCampaign).toBeFalse();
        await Promise.resolve();
        await Promise.resolve();

        expect(userSvc.asegurarNormasDeCreacion).toHaveBeenCalled();
        expect(estado.isCreatingCampaign).toBeTrue();
    });

    it('con «Ahora no» no abre el editor', async () => {
        userSvc.asegurarNormasDeCreacion.and.resolveTo(false);

        estado.seleccionarNuevaCampana();
        await Promise.resolve();
        await Promise.resolve();

        expect(estado.isCreatingCampaign).toBeFalse();
    });

    it('crear una trama pasa por la ventana y solo llama a la API si se aceptan', async () => {
        userSvc.asegurarNormasDeCreacion.and.resolveTo(false);
        await estado.crearTrama();
        expect(campanaSvc.createTrama).not.toHaveBeenCalled();

        userSvc.asegurarNormasDeCreacion.and.resolveTo(true);
        await estado.crearTrama();
        expect(campanaSvc.createTrama).toHaveBeenCalledTimes(1);
    });

    it('la limitación de creación bloquea sin abrir la ventana', async () => {
        userSvc.getAccessRestrictionMessage.and.returnValue('Tu cuenta tiene limitada la creación de contenido de forma indefinida.');

        await estado.crearTrama();

        expect(userSvc.asegurarNormasDeCreacion).not.toHaveBeenCalled();
        expect(campanaSvc.createTrama).not.toHaveBeenCalled();
        expect(toast.showError).toHaveBeenCalledWith('Tu cuenta tiene limitada la creación de contenido de forma indefinida.');
    });
});
