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
});
