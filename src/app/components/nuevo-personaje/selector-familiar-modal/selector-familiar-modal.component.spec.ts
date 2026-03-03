import { FamiliarMonstruoDetalle } from 'src/app/interfaces/monstruo';
import { SelectorFamiliarModalComponent } from './selector-familiar-modal.component';

function crearFamiliar(
    idFamiliar: number,
    nombre: string,
    idPlantilla = 1
): FamiliarMonstruoDetalle {
    return {
        Id: idFamiliar + 100,
        Nombre: nombre,
        Id_familiar: idFamiliar,
        Plantilla: {
            Id: idPlantilla,
            Nombre: `Plantilla ${idPlantilla}`
        },
        Manual: { Id: 1, Nombre: 'Manual', Pagina: 1 },
    } as any;
}

describe('SelectorFamiliarModalComponent', () => {
    let component: SelectorFamiliarModalComponent;

    beforeEach(() => {
        component = new SelectorFamiliarModalComponent();
        component.familiaresElegibles = [
            crearFamiliar(1, 'Ardilla'),
            crearFamiliar(2, 'Cuervo'),
            crearFamiliar(3, 'Gato'),
            crearFamiliar(4, 'Lagarto'),
        ];
    });

    it('filtra por texto y distribuye en 3 columnas', () => {
        component.filtroTexto = 'a';

        expect(component.familiaresFiltrados.map((item) => item.Nombre)).toEqual(['Ardilla', 'Gato', 'Lagarto']);
        expect(component.familiaresColumnaA.map((item) => item.Nombre)).toEqual(['Ardilla']);
        expect(component.familiaresColumnaB.map((item) => item.Nombre)).toEqual(['Gato']);
        expect(component.familiaresColumnaC.map((item) => item.Nombre)).toEqual(['Lagarto']);
    });

    it('emite confirmar con familiar y plantilla seleccionados', () => {
        const spy = spyOn(component.confirmar, 'emit');
        component.plantillaSeleccionada = 3;
        component.nombreFamiliar = 'Nimbo';
        component.onSeleccionarFamiliar(component.familiaresElegibles[1]);

        component.onConfirmar();

        expect(spy).toHaveBeenCalled();
        const payload = spy.calls.mostRecent()?.args?.[0];
        expect(payload?.familiar?.Id_familiar).toBe(2);
        expect(payload?.plantilla).toBe(3);
        expect(payload?.nombre).toBe('Nimbo');
    });

    it('emite detalle y omitir', () => {
        const spyDetalle = spyOn(component.detalle, 'emit');
        const spyOmitir = spyOn(component.omitir, 'emit');

        component.onAbrirDetalle(component.familiaresElegibles[0]);
        component.onOmitir();

        expect(spyDetalle).toHaveBeenCalledWith(component.familiaresElegibles[0]);
        expect(spyOmitir).toHaveBeenCalled();
    });

    it('al cambiar plantilla emite evento y resetea selección actual', () => {
        const spy = spyOn(component.plantillaChange, 'emit');
        component.onSeleccionarFamiliar(component.familiaresElegibles[0]);

        component.onCambiarPlantilla(5);

        expect(spy).toHaveBeenCalledWith(5);
        expect(component.idFamiliarSeleccionado).toBe(0);
        expect(component.idPlantillaSeleccionada).toBe(0);
    });

    it('emite cambios de nombre personalizado del familiar', () => {
        const spy = spyOn(component.nombreFamiliarChange, 'emit');
        component.onCambiarNombreFamiliar('Familiar de Aramil');
        expect(spy).toHaveBeenCalledWith('Familiar de Aramil');
    });
});
