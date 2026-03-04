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
        component.familiaresElegibles[1] = crearFamiliar(2, 'Cuervo', 3);
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

    it('muestra bloqueadas con motivos al desactivar solo elegibles', () => {
        const bloqueado = crearFamiliar(9, 'Serpiente');
        component.familiaresBloqueados = [{
            familiar: bloqueado,
            razones: ['No cumple las preferencias de alineamiento para este familiar.'],
            nivelMinimoRequerido: 4,
        }];

        expect(component.familiaresFiltrados.some((item) => item.Id_familiar === 9)).toBeFalse();
        component.onAlternarSoloElegibles();
        expect(component.familiaresFiltrados.some((item) => item.Id_familiar === 9)).toBeTrue();
        expect(component.getEtiquetaEstado(bloqueado)).toBe('Bloqueada');
        expect(component.getMotivosBloqueo(bloqueado)).toContain('No cumple las preferencias de alineamiento para este familiar.');
    });

    it('no confirma un familiar bloqueado aunque esté seleccionado', () => {
        const bloqueado = crearFamiliar(10, 'Sapo');
        component.familiaresElegibles = [];
        component.familiaresBloqueados = [{
            familiar: bloqueado,
            razones: ['No tiene niveles de clase compatibles con tus fuentes actuales de familiar.'],
            nivelMinimoRequerido: 6,
        }];
        component.onAlternarSoloElegibles();
        component.onSeleccionarFamiliar(bloqueado);
        const spy = spyOn(component.confirmar, 'emit');

        component.onConfirmar();

        expect(spy).not.toHaveBeenCalled();
    });
});
