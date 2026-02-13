import { SelectorIdiomaModalComponent } from './selector-idioma-modal.component';

describe('SelectorIdiomaModalComponent', () => {
    let component: SelectorIdiomaModalComponent;

    beforeEach(() => {
        component = new SelectorIdiomaModalComponent();
        component.idiomas = [
            { Id: 1, Nombre: 'Comun', Descripcion: 'Base', Secreto: false, Oficial: true },
            { Id: 2, Nombre: 'Infernal', Descripcion: 'No oficial', Secreto: false, Oficial: false },
            { Id: 3, Nombre: 'Clave del gremio', Descripcion: 'Secreto', Secreto: true, Oficial: true },
        ];
        component.idiomasYaSeleccionados = [];
        component.personajeOficial = true;
        component.incluirHomebrew = false;
    });

    it('no muestra idiomas secretos', () => {
        const nombres = component.idiomasDisponibles.map(i => i.Nombre);
        expect(nombres).toContain('Comun');
        expect(nombres).not.toContain('Clave del gremio');
    });

    it('filtro homebrew funciona', () => {
        expect(component.idiomasDisponibles.map(i => i.Nombre)).toEqual(['Comun']);
        component.incluirHomebrew = true;
        expect(component.idiomasDisponibles.map(i => i.Nombre)).toEqual(['Comun', 'Infernal']);
    });

    it('chip homebrew queda forzado cuando personaje no oficial', () => {
        component.personajeOficial = false;
        component.incluirHomebrew = false;
        component.onToggleHomebrew();
        expect(component.incluirHomebrewEfectivo).toBeTrue();
        expect(component.incluirHomebrew).toBeFalse();
    });

    it('al confirmar emite el idioma seleccionado', () => {
        const emitSpy = spyOn(component.confirmar, 'emit');
        component.idiomaSeleccionadoId = 1;
        component.onConfirmar();
        expect(emitSpy).toHaveBeenCalledWith(jasmine.objectContaining({ Id: 1, Nombre: 'Comun' }));
    });

    it('evita duplicados de idiomas ya seleccionados', () => {
        component.idiomasYaSeleccionados = ['Comun'];
        expect(component.idiomasDisponibles.map(i => i.Nombre)).not.toContain('Comun');
    });

    it('calcula idiomas pendientes según objetivo y seleccionados', () => {
        component.cantidadObjetivo = 3;
        component.cantidadSeleccionada = 1;
        expect(component.cantidadPendiente).toBe(2);
        expect(component.textoPendiente).toBe('Faltan 2 idiomas por elegir');
    });

    it('bloquea cierre cuando aun faltan idiomas y asi se configura', () => {
        component.cantidadObjetivo = 2;
        component.cantidadSeleccionada = 0;
        component.bloquearCierreHastaCompletar = true;
        const closeSpy = spyOn(component.cerrar, 'emit');

        component.onCerrar();

        expect(closeSpy).not.toHaveBeenCalled();
        expect(component.puedeCerrar).toBeFalse();
    });
});
