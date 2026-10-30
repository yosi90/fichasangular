import { of, Subject, throwError } from 'rxjs';
import { ListadoRacialesComponent } from './listado-raciales.component';

describe('ListadoRacialesComponent', () => {
    it('recarga el listado cuando el servicio emite un racial actualizado', () => {
        const racialesMutados$ = new Subject<any>();
        const rSvc = jasmine.createSpyObj('RacialService', ['getRaciales'], {
            racialesMutados$: racialesMutados$.asObservable(),
        });
        rSvc.getRaciales.and.returnValues(
            of([{ Id: 1, Nombre: 'Alas', Descripcion: '' }]),
            of([{ Id: 1, Nombre: 'Alas actualizadas', Descripcion: '' }]),
        );
        const cdr = { detectChanges: jasmine.createSpy('detectChanges') } as any;
        const component = new ListadoRacialesComponent(cdr, rSvc);

        component.racialSort = {
            active: '',
            direction: '',
            sortChange: of(null),
            initialized: of(null),
        } as any;
        component.racialPaginator = {
            page: of(null),
            initialized: of(null),
        } as any;

        component.ngAfterViewInit();
        racialesMutados$.next({ Id: 1, Nombre: 'Alas actualizadas' });

        expect(rSvc.getRaciales).toHaveBeenCalledTimes(2);
        expect(component.raciales[0].Nombre).toBe('Alas actualizadas');
    });

    function crear(raciales: any[] = []): ListadoRacialesComponent {
        const rSvc = { racialesMutados$: new Subject<any>(), getRaciales: () => of(raciales) } as any;
        const component = new ListadoRacialesComponent({ detectChanges: () => undefined } as any, rSvc);
        component.raciales = raciales;
        return component;
    }

    it('el buscador rápido filtra por nombre o descripción y «Limpiar filtros» lo vacía', () => {
        const component = crear([{ Id: 1, Nombre: 'Alas', Descripcion: '' }, { Id: 2, Nombre: 'Garras', Descripcion: 'Ataque natural' }]);

        component.buscar('ataque');
        expect(component.racialesDS.data.map((r) => r.Nombre)).toEqual(['Garras']);
        expect(component.hayFiltros).toBeTrue();

        component.limpiarFiltros();
        expect(component.textoBusqueda).toBe('');
        expect(component.hayFiltros).toBeFalse();
        expect(component.racialesDS.data.length).toBe(2);
    });

    it('si la lectura falla enseña el error y «Reintentar» vuelve a leer', () => {
        const getRaciales = jasmine.createSpy('getRaciales').and.returnValues(throwError(() => new Error('caída')), of([{ Id: 1, Nombre: 'Alas' }]));
        const component = new ListadoRacialesComponent({ detectChanges: () => undefined } as any, { racialesMutados$: new Subject<any>(), getRaciales } as any);

        component.cargar();
        expect(component.errorCarga).toBeTrue();

        component.cargar();
        expect(component.errorCarga).toBeFalse();
        expect(component.raciales.length).toBe(1);
    });
});
