import { MismaCuenta } from './misma-cuenta';

describe('MismaCuenta (las pantallas de las sesiones tras un cambio de cuenta)', () => {
    it('sigue con la cuenta fijada y deja de seguir al cambiar de cuenta, al salir o al cerrar la pantalla', () => {
        const auth: { currentUser: { uid: string } | null } = { currentUser: { uid: ' cuenta-a ' } };
        const cuenta = new MismaCuenta(auth as any);
        expect(cuenta.sigue()).toBeFalse();
        cuenta.fijar();
        expect(cuenta.uid).toBe('cuenta-a');
        expect(cuenta.sigue()).toBeTrue();
        auth.currentUser = { uid: 'cuenta-b' };
        expect(cuenta.sigue()).toBeFalse();
        auth.currentUser = { uid: 'cuenta-a' };
        expect(cuenta.sigue()).toBeTrue();
        auth.currentUser = null;
        expect(cuenta.sigue()).toBeFalse();
        auth.currentUser = { uid: 'cuenta-a' };
        cuenta.destruir();
        expect(cuenta.sigue()).toBeFalse();
    });

    it('sin sesión al cargar no sigue nunca', () => {
        const auth: { currentUser: { uid: string } | null } = { currentUser: null };
        const cuenta = new MismaCuenta(auth as any);
        cuenta.fijar();
        expect(cuenta.uid).toBe('');
        expect(cuenta.sigue()).toBeFalse();
    });
});
