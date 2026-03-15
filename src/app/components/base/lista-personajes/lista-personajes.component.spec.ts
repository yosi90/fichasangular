import { Subject, of } from 'rxjs';
import { ListaPersonajesComponent } from './lista-personajes.component';
import { Campana } from 'src/app/interfaces/campaña';

describe('ListaPersonajesComponent', () => {
    function createComponent(campanas$: Subject<Campana[]>) {
        return new ListaPersonajesComponent(
            {
                ceateDataTable: () => [],
                getPersonajes: async () => of([]),
            } as any,
            {
                getListCampanas: async () => campanas$.asObservable(),
            } as any,
            {
                announce: jasmine.createSpy('announce'),
            } as any,
            {
                isLoggedIn$: of(true),
            } as any,
        );
    }

    it('cargarCampanas reacciona a emisiones posteriores del listado vivo', async () => {
        const campanas$ = new Subject<Campana[]>();
        const component = createComponent(campanas$);

        await (component as any).cargarCampanas();

        campanas$.next([
            { Id: 0, Nombre: 'Sin campaña', Tramas: [] },
            { Id: 7, Nombre: 'Caballeros', Tramas: [] },
        ]);

        expect(component.Campanas.map((item) => item.Nombre)).toEqual(['Sin campaña', 'Caballeros']);
        expect(component.defaultCampana).toBe('Sin campaña');
    });

    it('ngOnDestroy libera la suscripción de campañas', async () => {
        const campanas$ = new Subject<Campana[]>();
        const component = createComponent(campanas$);

        await (component as any).cargarCampanas();
        campanas$.next([
            { Id: 0, Nombre: 'Sin campaña', Tramas: [] },
            { Id: 7, Nombre: 'Caballeros', Tramas: [] },
        ]);

        component.ngOnDestroy();
        campanas$.next([
            { Id: 0, Nombre: 'Sin campaña', Tramas: [] },
            { Id: 8, Nombre: 'Costa', Tramas: [] },
        ]);

        expect(component.Campanas.map((item) => item.Nombre)).toEqual(['Sin campaña', 'Caballeros']);
    });
});
