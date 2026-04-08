import Swal from 'sweetalert2';
import { CacheSyncMetadataService } from './cache-sync-metadata.service';
import { ManualFlagConsistencyNoticeService } from './manual-flag-consistency-notice.service';
import { UserProfileNavigationService } from './user-profile-navigation.service';

describe('ManualFlagConsistencyNoticeService', () => {
    let service: ManualFlagConsistencyNoticeService;
    let userProfileNavSvcMock: jasmine.SpyObj<UserProfileNavigationService>;
    let cacheSyncMetadataSvcMock: jasmine.SpyObj<CacheSyncMetadataService>;

    const manual = {
        Id: 7,
        Nombre: 'Psiónica expandida',
        Incluye_dotes: false,
        Incluye_conjuros: false,
        Incluye_plantillas: false,
        Incluye_monstruos: false,
        Incluye_razas: false,
        Incluye_clases: false,
        Incluye_tipos: false,
        Incluye_subtipos: false,
        Oficial: true,
        Asociados: {
            Dotes: [],
            Conjuros: [],
            Plantillas: [],
            Monstruos: [],
            Razas: [{ Id: 11, Nombre: 'Thri-kreen', Descripcion: '' }],
            Clases: [],
            Tipos: [],
            Subtipos: [],
        }
    } as any;

    beforeEach(() => {
        userProfileNavSvcMock = jasmine.createSpyObj<UserProfileNavigationService>('UserProfileNavigationService', ['openAdminPanel']);
        cacheSyncMetadataSvcMock = jasmine.createSpyObj<CacheSyncMetadataService>('CacheSyncMetadataService', ['markStale']);
        cacheSyncMetadataSvcMock.markStale.and.resolveTo();
        service = new ManualFlagConsistencyNoticeService(userProfileNavSvcMock, cacheSyncMetadataSvcMock);
    });

    it('no repite el aviso para el mismo manual dentro de la sesión', () => {
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        service.notifyAdminIfNeeded(manual, true);
        service.notifyAdminIfNeeded(manual, true);

        expect(swalSpy).toHaveBeenCalledTimes(1);
    });

    it('abre el admin panel cuando se confirma la alerta', async () => {
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        service.notifyAdminIfNeeded(manual, true);
        await Promise.resolve();
        await Promise.resolve();

        expect((Swal.fire as jasmine.Spy).calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({
            sessionNotification: jasmine.objectContaining({
                include: true,
                actionLabel: 'Ir al admin panel',
            }),
        }));
        expect(userProfileNavSvcMock.openAdminPanel).toHaveBeenCalled();
    });
});
