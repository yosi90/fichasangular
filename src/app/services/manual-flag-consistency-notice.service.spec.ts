import Swal from 'sweetalert2';
import { ManualFlagConsistencyNoticeService } from './manual-flag-consistency-notice.service';

describe('ManualFlagConsistencyNoticeService', () => {
    let service: ManualFlagConsistencyNoticeService;

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
        service = new ManualFlagConsistencyNoticeService();
    });

    it('no repite el aviso para el mismo manual dentro de la sesión', () => {
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        service.notifyAdminIfNeeded(manual, true);
        service.notifyAdminIfNeeded(manual, true);

        expect(swalSpy).toHaveBeenCalledTimes(1);
    });

});
