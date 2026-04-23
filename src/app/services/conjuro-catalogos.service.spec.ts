import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { ConjuroCatalogItem } from '../interfaces/conjuro-catalogos';
import { ConjuroCatalogosService } from './conjuro-catalogos.service';

describe('ConjuroCatalogosService', () => {
    class TestConjuroCatalogosService extends ConjuroCatalogosService {
        snapshotFactory: (path: string) => any = () => snapshot(null, false);
        writes: Array<{ path: string; items: ConjuroCatalogItem[]; }> = [];

        protected override watchCatalogPath(path: string, onNext: (snapshot: any) => void, _onError: (error: any) => void): () => void {
            onNext(this.snapshotFactory(path));
            return () => undefined;
        }

        protected override writeCatalogPath(path: string, items: ConjuroCatalogItem[]): Promise<void> {
            this.writes.push({ path, items });
            return Promise.resolve();
        }
    }

    function snapshot(value: any, exists = true): any {
        return {
            exists: () => exists,
            val: () => value,
        };
    }

    function createService(http: any, reportSvc = jasmine.createSpyObj('CacheCatalogMissReportService', ['reportEmptyCacheFallback'])): TestConjuroCatalogosService {
        reportSvc.reportEmptyCacheFallback.and.resolveTo();
        return new TestConjuroCatalogosService({} as any, http as any, { run: (fn: () => any) => fn() } as any, reportSvc as any);
    }

    it('usa RTDB cuando la cache existe', async () => {
        const httpMock = { get: jasmine.createSpy('get') };
        const service = createService(httpMock);
        service.snapshotFactory = () => snapshot({
            2: { Id: 2, Nombre: 'Verbal' },
            1: { Id: 1, Nombre: 'Somático' },
        });

        const items = await firstValueFrom(service.getComponentes());

        expect(items.map((item) => item.Nombre)).toEqual(['Somático', 'Verbal']);
        expect(httpMock.get).not.toHaveBeenCalled();
    });

    it('usa solo el shape canónico Id/Nombre en fallback REST y reporta miss', async () => {
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(of([
                { i: 1, n: 'Legacy' },
                { Id: 2, Nombre: 'Verbal' },
            ])),
        };
        const reportSvc = jasmine.createSpyObj('CacheCatalogMissReportService', ['reportEmptyCacheFallback']);
        const service = createService(httpMock, reportSvc);
        service.snapshotFactory = () => snapshot(null, false);

        const items = await firstValueFrom(service.getComponentes());

        expect(items).toEqual([{ Id: 2, Nombre: 'Verbal' }]);
        expect(reportSvc.reportEmptyCacheFallback).toHaveBeenCalledWith('componentes_conjuros');
        expect(service.writes).toEqual([]);
    });

    it('RenovarDescriptores escribe el nodo RTDB correcto', async () => {
        spyOn(Swal, 'fire');
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(of([
                { Id: 4, Nombre: 'Fuego' },
            ])),
        };
        const service = createService(httpMock);

        const ok = await service.RenovarDescriptores();

        expect(ok).toBeTrue();
        expect(service.writes).toEqual([
            {
                path: 'DescriptoresConjuros',
                items: [{ Id: 4, Nombre: 'Fuego' }],
            },
        ]);
    });
});
