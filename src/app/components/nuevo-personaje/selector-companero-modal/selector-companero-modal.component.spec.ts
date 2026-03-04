import { CompaneroMonstruoDetalle } from 'src/app/interfaces/monstruo';
import { SelectorCompaneroModalComponent } from './selector-companero-modal.component';

function crearCompanero(
    idCompanero: number,
    nombre: string,
    idPlantilla = 1
): CompaneroMonstruoDetalle {
    return {
        Id: idCompanero + 100,
        Nombre: nombre,
        Id_companero: idCompanero,
        Plantilla: {
            Id: idPlantilla,
            Nombre: `Plantilla ${idPlantilla}`
        },
        Manual: { Id: 1, Nombre: 'Manual', Pagina: 1 },
    } as any;
}

describe('SelectorCompaneroModalComponent', () => {
    let component: SelectorCompaneroModalComponent;

    beforeEach(() => {
        component = new SelectorCompaneroModalComponent();
        component.companerosElegibles = [
            crearCompanero(1, 'Ardilla base', 1),
            crearCompanero(2, 'Cuervo elevado', 2),
            crearCompanero(3, 'Lobo sabandija', 3),
            crearCompanero(4, 'Jabali base', 1),
        ];
        component.nivelesDisponibles = [1, 3, 6];
    });

    it('filtra por texto y distribuye en 3 columnas', () => {
        component.filtroTexto = 'ba';

        expect(component.companerosFiltrados.map((item) => item.Nombre)).toEqual(['Ardilla base', 'Lobo sabandija', 'Jabali base']);
        expect(component.companerosColumnaA.map((item) => item.Nombre)).toEqual(['Ardilla base']);
        expect(component.companerosColumnaB.map((item) => item.Nombre)).toEqual(['Lobo sabandija']);
        expect(component.companerosColumnaC.map((item) => item.Nombre)).toEqual(['Jabali base']);
    });

    it('emite confirmar con companero, plantilla, nombre y nivel', () => {
        const spy = spyOn(component.confirmar, 'emit');
        component.plantillaSeleccionada = 'elevado';
        component.nombreCompanero = 'Compañero de Aramil';
        component.nivelSeleccionado = 3;
        component.onSeleccionarCompanero(component.companerosElegibles[1]);

        component.onConfirmar();

        expect(spy).toHaveBeenCalled();
        const payload = spy.calls.mostRecent()?.args?.[0];
        expect(payload?.companero?.Id_companero).toBe(2);
        expect(payload?.plantilla).toBe('elevado');
        expect(payload?.nombre).toBe('Compañero de Aramil');
        expect(payload?.nivel).toBe(3);
    });

    it('emite detalle y omitir', () => {
        const spyDetalle = spyOn(component.detalle, 'emit');
        const spyOmitir = spyOn(component.omitir, 'emit');

        component.onAbrirDetalle(component.companerosElegibles[0]);
        component.onOmitir();

        expect(spyDetalle).toHaveBeenCalledWith(component.companerosElegibles[0]);
        expect(spyOmitir).toHaveBeenCalled();
    });

    it('al cambiar plantilla emite evento y resetea selección actual', () => {
        const spy = spyOn(component.plantillaChange, 'emit');
        component.onSeleccionarCompanero(component.companerosElegibles[0]);

        component.onCambiarPlantilla('sabandija');

        expect(spy).toHaveBeenCalledWith('sabandija');
        expect(component.idCompaneroSeleccionado).toBe(0);
        expect(component.idPlantillaSeleccionada).toBe(0);
    });

    it('emite cambio de nivel', () => {
        const spy = spyOn(component.nivelChange, 'emit');

        component.onCambiarNivel(6);
        expect(spy).toHaveBeenCalledWith(6);
    });

    it('emite cambios de nombre personalizado del compañero', () => {
        const spy = spyOn(component.nombreCompaneroChange, 'emit');
        component.onCambiarNombreCompanero('Compañero de Tarek');
        expect(spy).toHaveBeenCalledWith('Compañero de Tarek');
    });

    it('muestra bloqueadas con motivos al desactivar solo elegibles', () => {
        const bloqueado = crearCompanero(9, 'Pantera base', 1);
        component.companerosBloqueados = [{
            companero: bloqueado,
            razones: ['No cumple las preferencias de alineamiento para este compañero.'],
            nivelMinimoRequerido: 4,
        }];

        expect(component.companerosFiltrados.some((item) => item.Id_companero === 9)).toBeFalse();
        component.onAlternarSoloElegibles();
        expect(component.companerosFiltrados.some((item) => item.Id_companero === 9)).toBeTrue();
        expect(component.getEtiquetaEstado(bloqueado)).toBe('Bloqueada');
        expect(component.getMotivosBloqueo(bloqueado)).toContain('No cumple las preferencias de alineamiento para este compañero.');
    });

    it('no confirma un compañero bloqueado aunque esté seleccionado', () => {
        const bloqueado = crearCompanero(10, 'Tejón base', 1);
        component.companerosElegibles = [];
        component.companerosBloqueados = [{
            companero: bloqueado,
            razones: ['No tiene niveles de clase compatibles con tus fuentes actuales de compañero.'],
            nivelMinimoRequerido: 6,
        }];
        component.onAlternarSoloElegibles();
        component.onSeleccionarCompanero(bloqueado);
        const spy = spyOn(component.confirmar, 'emit');

        component.onConfirmar();

        expect(spy).not.toHaveBeenCalled();
    });
});
