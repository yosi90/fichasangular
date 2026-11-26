import { CACHE_CONTRACT_MANIFEST } from './cache-contract-manifest';

describe('CACHE_CONTRACT_MANIFEST', () => {
    it('incluye la entrada de extras para el admin cache sync', () => {
        const extraEntry = CACHE_CONTRACT_MANIFEST.find((item) => item.key === 'extras');
        expect(extraEntry).toBeTruthy();
        expect(extraEntry?.label).toBe('Extras');
    });

    it('incluye la entrada de tamaños para el admin cache sync', () => {
        const tamanoEntry = CACHE_CONTRACT_MANIFEST.find((item) => item.key === 'tamanos');
        expect(tamanoEntry).toBeTruthy();
        expect(tamanoEntry?.label).toBe('Tamaños');
    });

    it('incluye entradas de catalogos auxiliares cacheables', () => {
        expect(CACHE_CONTRACT_MANIFEST).toEqual(jasmine.arrayContaining([
            jasmine.objectContaining({ key: 'maniobrabilidades' }),
            jasmine.objectContaining({ key: 'tipos_dado' }),
            jasmine.objectContaining({ key: 'componentes_conjuros' }),
            jasmine.objectContaining({ key: 'tiempos_lanzamiento' }),
            jasmine.objectContaining({ key: 'alcances_conjuros' }),
            jasmine.objectContaining({ key: 'descriptores_conjuros' }),
        ]));
    });

    it('incluye el índice ligero de los monstruos y la versión de la caché de su detalle (la del backend)', () => {
        expect(CACHE_CONTRACT_MANIFEST.find((item) => item.key === 'monstruos_indice')).toEqual({ key: 'monstruos_indice', label: 'Índice de los monstruos', schemaVersion: 1 });
        expect(CACHE_CONTRACT_MANIFEST.find((item) => item.key === 'monstruos')?.schemaVersion).toBe(20);
    });
});
