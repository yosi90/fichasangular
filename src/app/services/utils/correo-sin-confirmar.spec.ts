import { conCorreoConfirmado, esCorreoSinConfirmar } from './correo-sin-confirmar';

describe('correo-sin-confirmar', () => {
    const sinConfirmar = Object.assign(new Error('Confirma tu correo'), { code: 'correo_sin_confirmar' });

    it('reconoce el error por su code', () => {
        expect(esCorreoSinConfirmar(sinConfirmar)).toBeTrue();
        expect(esCorreoSinConfirmar({ code: 'solo_entre_amistades' })).toBeFalse();
        expect(esCorreoSinConfirmar(null)).toBeFalse();
    });

    it('si se confirma el correo, repite la petición una vez', async () => {
        const confirmador = { ofrecerConfirmarCorreo: jasmine.createSpy().and.resolveTo(true) };
        const intento = jasmine.createSpy().and.returnValues(Promise.reject(sinConfirmar), Promise.resolve('hecho'));
        await expectAsync(conCorreoConfirmado(confirmador, true, intento)).toBeResolvedTo('hecho');
        expect(confirmador.ofrecerConfirmarCorreo).toHaveBeenCalledOnceWith(true);
        expect(intento).toHaveBeenCalledTimes(2);
    });

    it('si no se confirma, deja pasar el error sin repetir', async () => {
        const confirmador = { ofrecerConfirmarCorreo: jasmine.createSpy().and.resolveTo(false) };
        const intento = jasmine.createSpy().and.returnValue(Promise.reject(sinConfirmar));
        await expectAsync(conCorreoConfirmado(confirmador, false, intento)).toBeRejectedWith(sinConfirmar);
        expect(confirmador.ofrecerConfirmarCorreo).toHaveBeenCalledOnceWith(false);
        expect(intento).toHaveBeenCalledTimes(1);
    });

    it('los demás errores no abren nada', async () => {
        const otro = Object.assign(new Error('x'), { code: 'persona_bloqueada' });
        const confirmador = { ofrecerConfirmarCorreo: jasmine.createSpy() };
        await expectAsync(conCorreoConfirmado(confirmador, true, () => Promise.reject(otro))).toBeRejectedWith(otro);
        expect(confirmador.ofrecerConfirmarCorreo).not.toHaveBeenCalled();
    });
});
