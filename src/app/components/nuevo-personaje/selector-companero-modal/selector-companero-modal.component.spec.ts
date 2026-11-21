import { CompaneroMonstruoDetalle } from 'src/app/interfaces/monstruo';
import { SelectorCompaneroModalComponent } from './selector-companero-modal.component';

function crearCompanero(
    idCompanero: number,
    nombre: string,
    idPlantilla = 0
): CompaneroMonstruoDetalle {
    return {
        Id: idCompanero + 100,
        Nombre: nombre,
        Id_companero: idCompanero,
        Plantilla: {
            Id: idPlantilla,
            Nombre: idPlantilla > 0 ? `Plantilla ${idPlantilla}` : ''
        },
        Manual: { Id: 1, Nombre: 'Manual', Pagina: 1 },
    } as any;
}

describe('SelectorCompaneroModalComponent', () => {
    let component: SelectorCompaneroModalComponent;

    beforeEach(() => {
        component = new SelectorCompaneroModalComponent();
        component.companerosElegibles = [
            crearCompanero(1, 'Ardilla base'),
            crearCompanero(2, 'Cuervo celestial', 3),
            crearCompanero(3, 'Lobo base'),
            crearCompanero(4, 'Jabali base'),
        ];
        component.nivelesDisponibles = [1, 3, 6];
    });

    it('filtra por texto y distribuye en 3 columnas', () => {
        component.filtroTexto = 'ba';

        expect(component.companerosFiltrados.map((item) => item.Nombre)).toEqual(['Ardilla base', 'Lobo base', 'Jabali base']);
        expect(component.companerosColumnaA.map((item) => item.Nombre)).toEqual(['Ardilla base']);
        expect(component.companerosColumnaB.map((item) => item.Nombre)).toEqual(['Lobo base']);
        expect(component.companerosColumnaC.map((item) => item.Nombre)).toEqual(['Jabali base']);
    });

    it('emite confirmar con el compañero (con la plantilla de su fila), el nombre y el nivel', () => {
        const spy = spyOn(component.confirmar, 'emit');
        component.nombreCompanero = 'Compañero de Aramil';
        component.nivelSeleccionado = 3;
        component.onSeleccionarCompanero(component.companerosElegibles[1]);

        component.onConfirmar();

        expect(spy).toHaveBeenCalled();
        const payload = spy.calls.mostRecent()?.args?.[0];
        expect(payload?.companero?.Id_companero).toBe(2);
        expect(payload?.companero?.Plantilla?.Id).toBe(3);
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

    it('la plantilla y el ajuste salen de la fila del compañero, sin el selector base, elevado y sabandija', () => {
        component.ajustes = { '2:3': -1, '1:0': 0 };
        component.nivelesRequeridos = { '2:3': 2 };
        expect(component.getEtiquetaPlantilla(component.companerosElegibles[1])).toBe('Plantilla 3');
        expect(component.getEtiquetaPlantilla(component.companerosElegibles[0])).toBe('');
        expect(component.getEtiquetaAjuste(component.companerosElegibles[1])).toBe('−1');
        expect(component.getEtiquetaAjuste(component.companerosElegibles[0])).toBe('');
        expect(component.getExplicacionNivel(component.companerosElegibles[1])).toContain('nivel efectivo de druida 2');
        expect(component.getExplicacionNivel(component.companerosElegibles[1])).toContain('resta 1');
    });

    it('al cambiar el homebrew emite el evento y quita la selección', () => {
        const spy = spyOn(component.incluirHomebrewChange, 'emit');
        component.onSeleccionarCompanero(component.companerosElegibles[0]);

        component.onCambiarHomebrew(true);

        expect(spy).toHaveBeenCalledWith(true);
        expect(component.claveSeleccionada).toBe('');
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
        const bloqueado = crearCompanero(9, 'Pantera base');
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
        const bloqueado = crearCompanero(10, 'Tejón base');
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
