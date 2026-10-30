import { of, throwError } from 'rxjs';
import { ListadoRazasComponent } from './listado-razas.component';

describe('ListadoRazasComponent', () => {
    function crear(): ListadoRazasComponent {
        const componente = new ListadoRazasComponent({ detectChanges: () => undefined } as any, {} as any);
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
        componente.textoBusqueda = 'elfo';
        componente.defaultManual = 'Manual del jugador';
        componente.AlternarRazasHombrew();
        expect(componente.hayFiltros).toBeTrue();

        componente.limpiarFiltros();

        expect(componente.textoBusqueda).toBe('');
        expect(componente.defaultManual).toBe('Cualquiera');
        expect(componente.homebrewActivo).toBeFalse();
        expect(componente.hayFiltros).toBeFalse();
    });

    it('enseña los modificadores distintos de cero como en el lienzo («Fue +2», «Car −2»)', () => {
        const componente = crear();
        expect(componente.modificadoresVisibles({ Fuerza: 2, Destreza: 0, Carisma: -2 }).map((m) => m.texto)).toEqual(['Fue +2', 'Car −2']);
        expect(componente.modificadoresVisibles(null)).toEqual([]);
    });

    it('el buscador rápido filtra por nombre sin tildes y cuenta como filtro', () => {
        const componente = crear();
        componente.razas = [{ Id: 1, Nombre: 'Elfo', Oficial: true, Manual: '' } as any, { Id: 2, Nombre: 'Enano', Oficial: true, Manual: '' } as any];

        componente.buscar('ELFO');

        expect(componente.razasDS.data.map((r) => r.Nombre)).toEqual(['Elfo']);
        expect(componente.hayFiltros).toBeTrue();
    });

    it('cargar pasa a error si la lectura falla y vuelve a leer con «Reintentar»', () => {
        const getRazas = jasmine.createSpy('getRazas').and.returnValues(throwError(() => new Error('caída')), of([{ Id: 1, Nombre: 'Elfo', Oficial: true }]));
        const componente = new ListadoRazasComponent({ detectChanges: () => undefined } as any, { getRazas } as any);

        componente.cargar();
        expect(componente.cargado).toBeTrue();
        expect(componente.errorCarga).toBeTrue();

        componente.cargar();
        expect(componente.errorCarga).toBeFalse();
        expect(componente.razas.length).toBe(1);
    });
});
