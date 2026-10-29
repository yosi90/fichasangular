import { ListadoRazasComponent } from './listado-razas.component';

describe('ListadoRazasComponent', () => {
    function crear(): ListadoRazasComponent {
        const componente = new ListadoRazasComponent({ detectChanges: () => undefined } as any, {} as any, {} as any);
        componente.razas = [{ Id: 3, Nombre: 'Elfo' } as any];
        return componente;
    }

    it('en la creación (vista previa), pulsar una fila abre la raza y no la elige', () => {
        const componente = crear();
        componente.vistaPrevia = true;
        const abre = spyOn(componente.razaDetalles, 'emit');
        const elige = spyOn(componente.razaSeleccionada, 'emit');

        componente.pulsarFila(3);

        expect(abre).toHaveBeenCalledWith(jasmine.objectContaining({ Id: 3 }));
        expect(elige).not.toHaveBeenCalled();
    });

    it('fuera de la creación, pulsar una fila la elige, como antes', () => {
        const componente = crear();
        const abre = spyOn(componente.razaDetalles, 'emit');
        const elige = spyOn(componente.razaSeleccionada, 'emit');

        componente.pulsarFila(3);

        expect(elige).toHaveBeenCalledWith(jasmine.objectContaining({ Id: 3 }));
        expect(abre).not.toHaveBeenCalled();
    });

    it('«Limpiar filtros» vacía el texto, vuelve a «Cualquiera» y quita el homebrew propio', () => {
        const componente = crear();
        (componente as any).nombreText = { nativeElement: { value: 'elfo' } };
        componente.defaultManual = 'Manual del jugador';
        componente.AlternarRazasHombrew();
        expect(componente.hayFiltros).toBeTrue();

        componente.limpiarFiltros();

        expect((componente as any).nombreText.nativeElement.value).toBe('');
        expect(componente.defaultManual).toBe('Cualquiera');
        expect(componente.homebrewActivo).toBeFalse();
        expect(componente.hayFiltros).toBeFalse();
    });
});
