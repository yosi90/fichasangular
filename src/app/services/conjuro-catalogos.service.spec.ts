import { of } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { ConjuroCatalogosService } from './conjuro-catalogos.service';

describe('ConjuroCatalogosService', () => {
    it('usa solo el shape canónico Id/Nombre en catálogos simples', async () => {
        const httpMock = {
            get: jasmine.createSpy('get').and.returnValue(of([
                { i: 1, n: 'Legacy' },
                { Id: 2, Nombre: 'Verbal' },
            ])),
        };
        const service = new ConjuroCatalogosService(httpMock as any);

        const items = await firstValueFrom(service.getComponentes());

        expect(items).toEqual([{ Id: 2, Nombre: 'Verbal' }]);
    });
});
