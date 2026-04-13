import { Subject, of } from 'rxjs';
import { ListaPersonajesComponent } from './lista-personajes.component';
import { Campana } from 'src/app/interfaces/campaña';
import { PersonajeSimple } from 'src/app/interfaces/simplificaciones/personaje-simple';

describe('ListaPersonajesComponent', () => {
    function buildPersonaje(partial: Partial<PersonajeSimple> = {}): PersonajeSimple {
        return {
            Id: 1,
            Nombre: 'Personaje',
            ownerUid: null,
            ownerDisplayName: null,
            campaignId: null,
            campaignName: null,
            accessReason: null,
            visible_otros_usuarios: false,
            Id_region: 0,
            Region: null,
            Raza: { Id: 1, Nombre: 'Humano', Manual: '' } as any,
            RazaBase: null,
            Clases: 'Guerrero 1',
            Personalidad: '',
            Contexto: '',
            Campana: 'Sin campaña',
            Trama: 'Trama base',
            Subtrama: 'Subtrama base',
            Archivado: false,
            ...partial,
        };
    }

    function createComponent(campanas$: Subject<Campana[]>, userOverrides: Record<string, any> = {}) {
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
                CurrentUserUid: 'uid-actor',
                ...userOverrides,
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

    it('normaliza el resumen de clases usando siempre Clase (Nivel) cuando hay nivel', () => {
        const component = createComponent(new Subject<Campana[]>());

        expect(component.resumenClases('Guerrero 3, Mago(2), Pícaro')).toBe('Guerrero (3), Mago (2), Pícaro');
    });

    it('formatea una única clase con el mismo criterio visual que la multiclase', () => {
        const component = createComponent(new Subject<Campana[]>());

        expect(component.formatearClase({ Nombre: 'Clérigo', Nivel: 5 })).toBe('Clérigo (5)');
        expect(component.formatearClase({ Nombre: 'Monje', Nivel: null })).toBe('Monje');
    });

    it('filtroPersonajes permite mostrar solo personajes propios', () => {
        const component = createComponent(new Subject<Campana[]>());
        component.inputText = { nativeElement: { value: '' } } as any;
        component.Personajes = [
            buildPersonaje({ Id: 1, Nombre: 'Propio con ownerUid', ownerUid: 'uid-actor' }),
            buildPersonaje({ Id: 2, Nombre: 'Propio por accessReason', ownerUid: null, accessReason: 'owner' }),
            buildPersonaje({ Id: 3, Nombre: 'Ajeno', ownerUid: 'uid-otro', accessReason: 'campaign_public' }),
        ];
        component.mostrarSoloMios = true;

        component.filtroPersonajes();

        expect(component.personajesDS.data.map((item) => item.Id)).toEqual([1, 2]);
    });

    it('filtroPersonajes filtra por visibilidad publica o privada', () => {
        const component = createComponent(new Subject<Campana[]>());
        component.inputText = { nativeElement: { value: '' } } as any;
        component.Personajes = [
            buildPersonaje({ Id: 1, Nombre: 'Publico', visible_otros_usuarios: true }),
            buildPersonaje({ Id: 2, Nombre: 'Privado', visible_otros_usuarios: false }),
        ];

        component.filtroVisibilidad = 'publicos';
        component.filtroPersonajes();
        expect(component.personajesDS.data.map((item) => item.Id)).toEqual([1]);

        component.filtroVisibilidad = 'privados';
        component.filtroPersonajes();
        expect(component.personajesDS.data.map((item) => item.Id)).toEqual([2]);
    });

    it('AlternarSoloMios no activa el filtro si no hay sesion iniciada', () => {
        const component = createComponent(new Subject<Campana[]>(), {
            isLoggedIn$: of(false),
            CurrentUserUid: '',
        });
        component.sesionIniciada = false;

        component.AlternarSoloMios();

        expect(component.mostrarSoloMios).toBeFalse();
    });
});
