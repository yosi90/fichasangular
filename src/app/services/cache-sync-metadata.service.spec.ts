import { CacheSyncMetadataService } from './cache-sync-metadata.service';

describe('CacheSyncMetadataService', () => {
    class TestCacheSyncMetadataService extends CacheSyncMetadataService {
        state = new Map<string, any>();
        writes: Array<{ path: string; value: any; }> = [];
        failReportsRead = false;
        failReportsWrite = false;

        protected override getPath(path: string): Promise<any> {
            if (this.failReportsRead && path === 'CacheSyncReports/CatalogMisses')
                return Promise.reject(new Error('permission_denied'));
            return Promise.resolve(snapshot(this.state.get(path)));
        }

        protected override setPath(path: string, value: any): Promise<void> {
            if (this.failReportsWrite && path.startsWith('CacheSyncReports/CatalogMisses/'))
                return Promise.reject(new Error('permission_denied'));
            this.writes.push({ path, value });
            this.state.set(path, value);
            return Promise.resolve();
        }
    }

    function snapshot(value: any): any {
        return {
            exists: () => value !== null && value !== undefined,
            val: () => value,
            forEach: (callback: (child: any) => void) => {
                Object.entries(value ?? {}).forEach(([key, childValue]) => {
                    callback({
                        key,
                        val: () => childValue,
                        forEach: (childCallback: (child: any) => void) => {
                            Object.entries((childValue as any) ?? {}).forEach(([childKey, grandChildValue]) => {
                                childCallback({
                                    key: childKey,
                                    val: () => grandChildValue,
                                });
                            });
                        },
                    });
                });
            },
        };
    }

    function createService(): TestCacheSyncMetadataService {
        return new TestCacheSyncMetadataService({} as any, { run: (fn: () => any) => fn() } as any);
    }

    it('convierte un reporte de miss en sincronizacion pendiente para admin', async () => {
        const service = createService();
        service.state.set('CacheSyncReports/CatalogMisses', {
            maniobrabilidades: {
                'uid-1': {
                    cacheKey: 'maniobrabilidades',
                    uid: 'uid-1',
                    reportedAt: 1000,
                    reportedAtIso: '2026-04-22T10:00:00.000Z',
                    reason: 'rtdb_empty_fallback_rest',
                },
            },
        });

        const record = await service.getSnapshotOnce();
        const uiState = service.buildUiState(record);
        const item = uiState.find((state) => state.key === 'maniobrabilidades');

        expect(record.maniobrabilidades?.staleReason).toBe('rtdb_empty_fallback_rest');
        expect(item?.isPrimary).toBeTrue();
    });

    it('ignora reportes anteriores a un success vigente', async () => {
        const service = createService();
        service.state.set('CacheSyncMeta/AdminPanel', {
            maniobrabilidades: {
                lastSuccessAt: 2000,
                lastSuccessIso: '2026-04-22T10:10:00.000Z',
                schemaVersionApplied: 1,
                staleReason: null,
            },
        });
        service.state.set('CacheSyncReports/CatalogMisses', {
            maniobrabilidades: {
                'uid-1': {
                    cacheKey: 'maniobrabilidades',
                    uid: 'uid-1',
                    reportedAt: 1000,
                    reportedAtIso: '2026-04-22T10:00:00.000Z',
                    reason: 'rtdb_empty_fallback_rest',
                },
            },
        });

        const record = await service.getSnapshotOnce();
        const item = service.buildUiState(record).find((state) => state.key === 'maniobrabilidades');

        expect(record.maniobrabilidades?.staleReason).toBeNull();
        expect(item?.isPrimary).toBeFalse();
    });

    it('markSuccess limpia reports de la clave', async () => {
        const service = createService();

        await service.markSuccess('maniobrabilidades', 1);

        expect(service.writes).toEqual(jasmine.arrayContaining([
            jasmine.objectContaining({ path: 'CacheSyncMeta/AdminPanel/maniobrabilidades' }),
            { path: 'CacheSyncReports/CatalogMisses/maniobrabilidades', value: null },
        ]));
    });

    it('mantiene pendientes del manifiesto aunque falle la lectura de reports', async () => {
        const service = createService();
        service.failReportsRead = true;

        const record = await service.getSnapshotOnce();
        const item = service.buildUiState(record).find((state) => state.key === 'maniobrabilidades');

        expect(item?.isPrimary).toBeTrue();
    });

    it('markSuccess no falla si no puede limpiar reports', async () => {
        const service = createService();
        service.failReportsWrite = true;

        await expectAsync(service.markSuccess('maniobrabilidades', 1)).toBeResolved();
        expect(service.writes).toEqual(jasmine.arrayContaining([
            jasmine.objectContaining({ path: 'CacheSyncMeta/AdminPanel/maniobrabilidades' }),
        ]));
    });
});
