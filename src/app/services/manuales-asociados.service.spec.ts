import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { ManualAsociadoDetalle } from '../interfaces/manual-asociado';
import { ManualFlagsPatchPayload } from './manual.service';
import { ManualesAsociadosService } from './manuales-asociados.service';

function createManual(overrides: Partial<ManualAsociadoDetalle> = {}): ManualAsociadoDetalle {
    return {
        Id: 1,
        Nombre: 'Manual',
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
            Razas: [],
            Clases: [],
            Tipos: [],
            Subtipos: [],
        },
        ...overrides,
    };
}

describe('ManualesAsociadosService', () => {
    let service: ManualesAsociadosService;
    let httpMock: jasmine.SpyObj<any>;
    let manualSvcMock: jasmine.SpyObj<any>;

    beforeEach(() => {
        httpMock = jasmine.createSpyObj('HttpClient', ['get']);
        manualSvcMock = jasmine.createSpyObj('ManualService', ['patchManualFlags', 'RenovarManuales']);
        manualSvcMock.RenovarManuales.and.resolveTo(true);
        spyOn(Swal, 'fire').and.resolveTo({} as any);
        spyOn(Swal, 'close');

        service = new ManualesAsociadosService(
            {} as any,
            httpMock,
            manualSvcMock,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            {} as any,
            { run: (fn: any) => fn() } as any,
        );
    });

    it('reconcilia flags bidireccionalmente y refresca la caché de manuales', async () => {
        const manual = createManual({
            Id: 7,
            Nombre: 'Psiónica expandida',
            Incluye_clases: true,
            Asociados: {
                Dotes: [],
                Conjuros: [],
                Plantillas: [],
                Monstruos: [],
                Razas: [{ Id: 11, Nombre: 'Thri-kreen', Descripcion: '' }],
                Clases: [],
                Tipos: [],
                Subtipos: [],
            },
        });
        httpMock.get.and.returnValue(of([manual]));
        manualSvcMock.patchManualFlags.and.callFake(async (_id: number, payload: ManualFlagsPatchPayload) => ({
            ...manual,
            ...payload,
        }));
        const persistSpy = spyOn<any>(service, 'persistirCacheManualesAsociados').and.resolveTo();

        const ok = await service.RenovarManualesAsociados();

        expect(manualSvcMock.patchManualFlags).toHaveBeenCalledOnceWith(7, {
            Incluye_razas: true,
            Incluye_clases: false,
        });
        expect(persistSpy).toHaveBeenCalledWith([
            jasmine.objectContaining({
                Id: 7,
                Incluye_razas: true,
                Incluye_clases: false,
            }),
        ]);
        expect(manualSvcMock.RenovarManuales).toHaveBeenCalledOnceWith(false);
        expect(ok).toBeTrue();
    });

    it('no llama al patch si el manual ya está alineado', async () => {
        const manual = createManual({
            Id: 8,
            Incluye_razas: true,
            Asociados: {
                Dotes: [],
                Conjuros: [],
                Plantillas: [],
                Monstruos: [],
                Razas: [{ Id: 11, Nombre: 'Thri-kreen', Descripcion: '' }],
                Clases: [],
                Tipos: [],
                Subtipos: [],
            },
        });
        httpMock.get.and.returnValue(of([manual]));
        spyOn<any>(service, 'persistirCacheManualesAsociados').and.resolveTo();

        const ok = await service.RenovarManualesAsociados();

        expect(manualSvcMock.patchManualFlags).not.toHaveBeenCalled();
        expect(manualSvcMock.RenovarManuales).toHaveBeenCalledOnceWith(false);
        expect(ok).toBeTrue();
    });

    it('continúa si un patch falla y devuelve false al final', async () => {
        const manualFallido = createManual({
            Id: 9,
            Nombre: 'Manual fallido',
            Asociados: {
                Dotes: [],
                Conjuros: [],
                Plantillas: [],
                Monstruos: [],
                Razas: [{ Id: 21, Nombre: 'Raza fallida', Descripcion: '' }],
                Clases: [],
                Tipos: [],
                Subtipos: [],
            },
        });
        const manualOk = createManual({
            Id: 10,
            Nombre: 'Manual ok',
            Asociados: {
                Dotes: [{ Id: 31, Nombre: 'Dote ok', Descripcion: '' }],
                Conjuros: [],
                Plantillas: [],
                Monstruos: [],
                Razas: [],
                Clases: [],
                Tipos: [],
                Subtipos: [],
            },
        });
        httpMock.get.and.returnValue(of([manualFallido, manualOk]));
        manualSvcMock.patchManualFlags.and.callFake(async (id: number, payload: ManualFlagsPatchPayload) => {
            if (id === 9)
                throw new Error('fallo');
            return {
                ...manualOk,
                ...payload,
            };
        });
        const persistSpy = spyOn<any>(service, 'persistirCacheManualesAsociados').and.resolveTo();

        const ok = await service.RenovarManualesAsociados();

        expect(manualSvcMock.patchManualFlags).toHaveBeenCalledTimes(2);
        expect(persistSpy).toHaveBeenCalledWith([
            jasmine.objectContaining({ Id: 9, Incluye_razas: false }),
            jasmine.objectContaining({ Id: 10, Incluye_dotes: true }),
        ]);
        expect(manualSvcMock.RenovarManuales).toHaveBeenCalledOnceWith(false);
        expect(ok).toBeFalse();
    });

    it('descarta respuestas abreviadas legacy al normalizar manuales asociados', async () => {
        const manualCanonico = createManual({
            Id: 12,
            Nombre: 'Manual canónico',
        });
        httpMock.get.and.returnValue(of([
            { i: 99, n: 'Legacy', Asociados: { Dotes: [{ i: 1, n: 'Legacy dote', d: 'legacy' }] } },
            manualCanonico,
        ]));
        const persistSpy = spyOn<any>(service, 'persistirCacheManualesAsociados').and.resolveTo();

        const ok = await service.RenovarManualesAsociados();

        expect(persistSpy).toHaveBeenCalledWith([
            jasmine.objectContaining({ Id: 12, Nombre: 'Manual canónico' }),
        ]);
        expect(ok).toBeTrue();
    });
});
