import Swal from 'sweetalert2';
import { of, throwError } from 'rxjs';
import { ManualAsociadoDetalle } from '../interfaces/manual-asociado';
import { ManualDetalleNavigationService } from './manual-detalle-navigation.service';
import { ManualesAsociadosService } from './manuales-asociados.service';
import { ManualVistaNavigationService } from './manual-vista-navigation.service';

describe('ManualDetalleNavigationService', () => {
    let service: ManualDetalleNavigationService;
    let manualesAsociadosSvcMock: jasmine.SpyObj<ManualesAsociadosService>;
    let manualVistaNavSvcMock: jasmine.SpyObj<ManualVistaNavigationService>;

    const manuales: ManualAsociadoDetalle[] = [
        {
            Id: 1,
            Nombre: 'Manual del jugador',
            Incluye_dotes: true,
            Incluye_conjuros: true,
            Incluye_plantillas: false,
            Incluye_monstruos: false,
            Incluye_razas: true,
            Incluye_clases: true,
            Incluye_tipos: true,
            Incluye_subtipos: true,
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
            }
        },
        {
            Id: 2,
            Nombre: 'Guia de monstruos avanzada',
            Incluye_dotes: false,
            Incluye_conjuros: false,
            Incluye_plantillas: false,
            Incluye_monstruos: true,
            Incluye_razas: false,
            Incluye_clases: false,
            Incluye_tipos: true,
            Incluye_subtipos: true,
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
            }
        },
    ];

    beforeEach(() => {
        manualesAsociadosSvcMock = jasmine.createSpyObj<ManualesAsociadosService>('ManualesAsociadosService', ['getManualesAsociados']);
        manualVistaNavSvcMock = jasmine.createSpyObj<ManualVistaNavigationService>('ManualVistaNavigationService', ['emitirApertura']);

        service = new ManualDetalleNavigationService(
            manualesAsociadosSvcMock,
            manualVistaNavSvcMock,
        );
    });

    it('resuelve por id', () => {
        manualesAsociadosSvcMock.getManualesAsociados.and.returnValue(of(manuales));

        service.abrirDetalleManual({ id: 2, nombre: 'x' });

        expect(manualVistaNavSvcMock.emitirApertura).toHaveBeenCalledWith(manuales[1]);
    });

    it('resuelve por nombre exacto normalizado', () => {
        manualesAsociadosSvcMock.getManualesAsociados.and.returnValue(of(manuales));

        service.abrirDetalleManual('MANUAL DEL JUGADOR');

        expect(manualVistaNavSvcMock.emitirApertura).toHaveBeenCalledWith(manuales[0]);
    });

    it('resuelve por inclusión priorizando manual más largo', () => {
        manualesAsociadosSvcMock.getManualesAsociados.and.returnValue(of(manuales));

        service.abrirDetalleManual('Guía de monstruos avanzada, capítulo I');

        expect(manualVistaNavSvcMock.emitirApertura).toHaveBeenCalledWith(manuales[1]);
    });

    it('no intenta abrir cuando referencia no válida', () => {
        manualesAsociadosSvcMock.getManualesAsociados.and.returnValue(of(manuales));

        service.abrirDetalleManual('No aplica');

        expect(manualesAsociadosSvcMock.getManualesAsociados).not.toHaveBeenCalled();
        expect(manualVistaNavSvcMock.emitirApertura).not.toHaveBeenCalled();
    });

    it('muestra aviso cuando no encuentra manual', () => {
        manualesAsociadosSvcMock.getManualesAsociados.and.returnValue(of(manuales));
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        service.abrirDetalleManual('Manual inventado');

        expect(manualVistaNavSvcMock.emitirApertura).not.toHaveBeenCalled();
        expect(swalSpy).toHaveBeenCalled();
    });

    it('muestra aviso cuando falla la carga', () => {
        manualesAsociadosSvcMock.getManualesAsociados.and.returnValue(throwError(() => new Error('fallo')));
        const swalSpy = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);

        service.abrirDetalleManual({ id: 1 });

        expect(manualVistaNavSvcMock.emitirApertura).not.toHaveBeenCalled();
        expect(swalSpy).toHaveBeenCalled();
    });
});
