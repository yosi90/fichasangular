import { CacheCatalogMissReport, CacheCatalogMissReportService } from './cache-catalog-miss-report.service';

describe('CacheCatalogMissReportService', () => {
    class TestCacheCatalogMissReportService extends CacheCatalogMissReportService {
        uid = 'uid-1';
        writes: Array<{ path: string; payload: CacheCatalogMissReport; }> = [];

        protected override getCurrentUid(): string {
            return this.uid;
        }

        protected override writeReport(path: string, payload: CacheCatalogMissReport): Promise<void> {
            this.writes.push({ path, payload });
            return Promise.resolve();
        }
    }

    function createService(): TestCacheCatalogMissReportService {
        return new TestCacheCatalogMissReportService({} as any, {} as any, { run: (fn: () => any) => fn() } as any);
    }

    it('registra miss para usuario autenticado', async () => {
        const service = createService();

        await service.reportEmptyCacheFallback('maniobrabilidades');

        expect(service.writes.length).toBe(1);
        expect(service.writes[0].path).toBe('CacheSyncReports/CatalogMisses/maniobrabilidades/uid-1');
        expect(service.writes[0].payload).toEqual(jasmine.objectContaining({
            cacheKey: 'maniobrabilidades',
            uid: 'uid-1',
            reason: 'rtdb_empty_fallback_rest',
        }));
    });

    it('ignora usuario anonimo', async () => {
        const service = createService();
        service.uid = '';

        await service.reportEmptyCacheFallback('maniobrabilidades');

        expect(service.writes).toEqual([]);
    });

    it('deduplica por clave durante la sesion', async () => {
        const service = createService();

        await service.reportEmptyCacheFallback('maniobrabilidades');
        await service.reportEmptyCacheFallback('maniobrabilidades');

        expect(service.writes.length).toBe(1);
    });

    it('ignora claves no reportables aunque existan en el manifiesto', async () => {
        const service = createService();

        await service.reportEmptyCacheFallback('conjuros');

        expect(service.writes).toEqual([]);
    });
});
