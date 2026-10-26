import { DeidadDetalle } from 'src/app/interfaces/deidad';
import { incumpleAlineamientoDeidad } from './alineamiento-deidad';

function deidad(nombre: string, idBasico: number, alineamiento: string, devotos: { Id: number; Nombre: string; }[] = []): DeidadDetalle {
    return {
        Id: idBasico,
        Nombre: nombre,
        Descripcion: '',
        Manual: { Id: 54, Nombre: 'Manual del jugador 1', Pagina: 106 },
        Alineamiento: { Id: idBasico, Id_basico: idBasico, Nombre: alineamiento },
        Arma: { Id: 0, Nombre: '' },
        Pabellon: { Id: 0, Nombre: '' } as any,
        Genero: { Id: 0, Nombre: '' },
        Ambitos: [],
        Dominios: [],
        Alineamientos_devotos: devotos,
        Oficial: true,
    };
}

describe('alineamiento-deidad (MJ cap. 3, clérigo)', () => {
    const heironeous = deidad('Heironeous', 1, 'Legal bueno');
    const pelor = deidad('Pelor', 4, 'Neutral bueno');
    const obadHai = deidad('Obad-Hai', 5, 'Neutral auténtico');
    const sanCuthbert = deidad('San Cuthbert', 2, 'Legal neutral', [{ Id: 1, Nombre: 'Legal bueno' }, { Id: 2, Nombre: 'Legal neutral' }]);

    it('a un paso de su deidad en un eje vale; en los dos, no', () => {
        expect(incumpleAlineamientoDeidad('Legal bueno', heironeous)).toBeNull();
        expect(incumpleAlineamientoDeidad('Legal neutral', heironeous)).toBeNull();
        expect(incumpleAlineamientoDeidad('Neutral bueno', heironeous)).toBeNull();
        expect(incumpleAlineamientoDeidad('Neutral autentico', heironeous)).toContain('a un paso');
    });

    it('un clérigo neutral solo si su deidad también lo es (un clérigo N de Pelor no; de Obad-Hai sí)', () => {
        expect(incumpleAlineamientoDeidad('Neutral autentico', pelor)).toContain('neutral');
        expect(incumpleAlineamientoDeidad('Neutral autentico', obadHai)).toBeNull();
    });

    it('los clérigos de San Cuthbert solo pueden ser legales buenos o legales neutrales', () => {
        expect(incumpleAlineamientoDeidad('Legal bueno', sanCuthbert)).toBeNull();
        expect(incumpleAlineamientoDeidad('Legal maligno', sanCuthbert)).toContain('San Cuthbert');
        expect(incumpleAlineamientoDeidad('Neutral autentico', sanCuthbert)).toContain('San Cuthbert');
    });

    it('sin deidad no hay regla', () => {
        expect(incumpleAlineamientoDeidad('Caotico maligno', null)).toBeNull();
    });
});
