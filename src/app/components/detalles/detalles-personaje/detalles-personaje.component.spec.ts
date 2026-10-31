import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { Personaje } from 'src/app/interfaces/personaje';
import { ClaseService } from 'src/app/services/clase.service';
import { FichasDescargaBackgroundService } from 'src/app/services/fichas-descarga-background.service';
import { ListaPersonajesService } from 'src/app/services/listas/lista-personajes.service';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { RegionService } from 'src/app/services/region.service';
import { UserService } from 'src/app/services/user.service';
import { crearEquipoFichaApi } from 'src/testing/equipo-api';
import { lectorFicha, limpio } from 'src/testing/ficha-detalle';
import { crearDetalleApi } from 'src/testing/personaje-detalle-api';
import { personajeIncarnumApi } from 'src/testing/incarnum';
import { DetallesPersonajeComponent } from './detalles-personaje.component';

/** La ficha de la API tal como la deja `PersonajeService` (el mapper real, sin HTTP). */
function fichaDeLaApi(cambios: Record<string, any> = {}): Personaje {
    const servicio = new PersonajeService({ currentUser: null } as any, {} as any);
    return (servicio as any).mapApiDetalleToPersonaje(crearDetalleApi(cambios));
}

/** Una clase lanzadora del catálogo, con su progresión por nivel. */
function claseLanzadora(id: number, nombre: string, niveles: number, cambios: Record<string, any> = {}): any {
    return {
        Id: id,
        Nombre: nombre,
        Conjuros: {
            Arcanos: true, Divinos: false, Psionicos: false, Dependientes_alineamiento: false,
            Lanzamiento_espontaneo: false, Conocidos_total: false, Conocidos_nivel_a_nivel: false, Dominio: false,
            puede_elegir_especialidad: true, Clase_origen: { Id: 0, Nombre: '' }, Listado: [],
            ...(cambios['Conjuros'] ?? {}),
        },
        Mod_salv_conjuros: 'Inteligencia',
        Desglose_niveles: Array.from({ length: niveles }, (_item, index) => ({
            Nivel: index + 1,
            Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
            Reserva_psionica: 0,
            Conjuros_diarios: { Nivel_0: 0, Nivel_1: 1, Nivel_2: -1 },
            Conjuros_conocidos_nivel_a_nivel: {},
            Conjuros_conocidos_total: 3,
            Ataque_base: '+0',
            Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
            Aumentos_clase_lanzadora: [],
            Dotes: [],
            Especiales: [],
        })),
    };
}

const CLAVE_VISTA_A = 'rol.ficha.vista.cuenta-a';
const CLAVE_VISTA_SIN_CUENTA = 'rol.ficha.vista.sin-cuenta';

describe('DetallesPersonajeComponent', () => {
    let component: DetallesPersonajeComponent;
    let fixture: ComponentFixture<DetallesPersonajeComponent>;
    let fichasDescargaBgSvcMock: any;
    let regionSvcMock: any;
    let listaPersonajesSvcMock: any;
    let userSvcMock: any;
    let sesion: { cuenta: { id: string; } | null; estado$: BehaviorSubject<unknown>; };
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const { texto, textos, titulos, valor, enlace, lateral, filasPares, franja, casillas, etiquetasCabecera, tipoCabecera } = lectorFicha(elemento);

    const crear = (): void => {
        fixture = TestBed.createComponent(DetallesPersonajeComponent);
        component = fixture.componentInstance;
        component.pj = new NuevoPersonajeService().PersonajeCreacion;
        component.pj.Id = 1;
        component.pj.ownerUid = 'test-uid';
    };
    const verPagina = (): void => {
        fixture.detectChanges();
        component.cambiarVista('pagina');
        fixture.detectChanges();
    };
    const pestanas = (): string[] => textos('[role="tab"]');
    const abrirPestana = (nombre: string): void => {
        (Array.from(elemento().querySelectorAll<HTMLButtonElement>('[role="tab"]')).find((p) => limpio(p) === nombre)!).click();
        fixture.detectChanges();
    };
    const botonVista = (nombre: string): HTMLButtonElement =>
        Array.from(elemento().querySelectorAll<HTMLButtonElement>('.personaje-vista__boton')).find((b) => limpio(b.querySelector('span')) === nombre)!;

    beforeEach(async () => {
        localStorage.removeItem(CLAVE_VISTA_A);
        localStorage.removeItem(CLAVE_VISTA_SIN_CUENTA);
        fichasDescargaBgSvcMock = { descargarFichas: jasmine.createSpy('descargarFichas') };
        listaPersonajesSvcMock = {
            actualizarVisibilidadEnCache: jasmine.createSpy('actualizarVisibilidadEnCache'),
            actualizarArchivadoEnCache: jasmine.createSpy('actualizarArchivadoEnCache'),
        };
        regionSvcMock = { getRegiones: () => of([]) };
        userSvcMock = { CurrentUserUid: 'test-uid', IsLoggedIn: true };
        sesion = { cuenta: { id: 'cuenta-a' }, estado$: new BehaviorSubject<unknown>({ tipo: 'con_sesion' }) };
        await TestBed.configureTestingModule({
            declarations: [DetallesPersonajeComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            providers: [
                { provide: FichasDescargaBackgroundService, useValue: fichasDescargaBgSvcMock },
                { provide: ClaseService, useValue: { getClases: () => of([]) } },
                {
                    provide: PersonajeService,
                    useValue: {
                        actualizarVisibilidadPersonaje: async () => ({ idPersonaje: 1, visible_otros_usuarios: false }),
                        actualizarArchivadoPersonaje: async () => ({ idPersonaje: 1, archivado: true }),
                    },
                },
                { provide: ListaPersonajesService, useValue: listaPersonajesSvcMock },
                { provide: UserService, useValue: userSvcMock },
                { provide: RegionService, useValue: regionSvcMock },
                { provide: PlatformSessionService, useValue: sesion },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        crear();
    });

    afterEach(() => {
        localStorage.removeItem(CLAVE_VISTA_A);
        localStorage.removeItem(CLAVE_VISTA_SIN_CUENTA);
    });

    describe('interruptor de vista', () => {
        it('por defecto enseña la vista por pestañas, con la cabecera compacta', () => {
            fixture.detectChanges();

            expect(component.vista).toBe('pestanas');
            expect(elemento().querySelector('[role="tablist"]')).not.toBeNull();
            expect(elemento().querySelector('.ficha-cabecera--compacta')).not.toBeNull();
            expect(botonVista('Pestañas').getAttribute('aria-pressed')).toBe('true');
            expect(botonVista('Página').getAttribute('aria-pressed')).toBe('false');
            expect(elemento().querySelector('.personaje-vista')?.getAttribute('aria-label')).toBe('Cómo se ve la ficha');
        });

        it('cambia a la página continua y lo recuerda por cuenta en este navegador', () => {
            fixture.detectChanges();
            botonVista('Página').click();
            fixture.detectChanges();

            expect(component.vista).toBe('pagina');
            expect(elemento().querySelector('[role="tablist"]')).toBeNull();
            expect(elemento().querySelector('.ficha-cabecera--compacta')).toBeNull();
            expect(botonVista('Página').getAttribute('aria-pressed')).toBe('true');
            expect(localStorage.getItem(CLAVE_VISTA_A)).toBe('pagina');

            // Otra ficha que se abre después sale ya con la página continua.
            fixture.destroy();
            crear();
            fixture.detectChanges();
            expect(component.vista).toBe('pagina');

            botonVista('Pestañas').click();
            expect(localStorage.getItem(CLAVE_VISTA_A)).toBe('pestanas');
        });

        it('cada cuenta tiene su preferencia; sin cuenta, la de este navegador sin sesión', () => {
            localStorage.setItem(CLAVE_VISTA_A, 'pagina');
            sesion.cuenta = null;
            fixture.detectChanges();
            expect(component.vista).toBe('pestanas');

            component.cambiarVista('pagina');
            expect(localStorage.getItem(CLAVE_VISTA_SIN_CUENTA)).toBe('pagina');
            localStorage.setItem(CLAVE_VISTA_A, 'pestanas');

            // La cuenta se confirma con la ficha ya abierta: entonces manda su preferencia.
            sesion.cuenta = { id: 'cuenta-a' };
            sesion.estado$.next({ tipo: 'con_sesion' });
            expect(component.vista).toBe('pestanas');
        });

        it('una preferencia que no se entiende vuelve a la vista por defecto', () => {
            localStorage.setItem(CLAVE_VISTA_A, 'tabla');
            fixture.detectChanges();
            expect(component.vista).toBe('pestanas');
        });
    });

    describe('vista por pestañas', () => {
        beforeEach(() => {
            component.pj = fichaDeLaApi({ dotes: [{ Dote: { Id: 7, Nombre: 'Rastrear' }, Contexto: { Entidad: 'personaje', Extra: '', Id_extra: -1, Origen: 'Explorador' } }] });
            fixture.detectChanges();
        });

        it('enseña arriba la franja y las características, y las pestañas que tienen algo', () => {
            const resumen = elemento().querySelector('.personaje-resumen') as HTMLElement;
            // En la franja compacta, «PG» y «CA», con el nombre entero como nombre accesible.
            expect(franja(resumen).map(([etiqueta]) => etiqueta)).toEqual(['PG', 'CA', 'Iniciativa', 'Ataque base', 'Presa', 'Velocidad']);
            expect(resumen.querySelector('.ficha-franja__etiqueta')?.getAttribute('aria-label')).toBe('Puntos de golpe');
            expect(casillas(resumen).map(([abreviatura]) => abreviatura)).toEqual(['FUE', 'DES', 'CON', 'INT', 'SAB', 'CAR']);
            expect(pestanas()).toEqual(['Combate', 'Habilidades', 'Capacidades', 'Equipo', 'Historia']);
            expect(tipoCabecera()).toBe('Centauro · Explorador 8 · NEP 14');
        });

        it('empieza en Combate, con el desglose de las salvaciones, la CA, la presa y la iniciativa', () => {
            const panel = elemento().querySelector('[role="tabpanel"]') as HTMLElement;
            expect(panel.getAttribute('aria-labelledby')).toBe(component.idPestana('combate'));
            expect(titulos('[role="tabpanel"]')).toEqual(['Salvaciones', 'Clase de armadura', 'Presa e iniciativa']);
            expect(filasPares(lateral('Salvaciones'))[0]).toEqual(['Fortaleza Constitución +4 · Explorador +6 · Centauro +1', '+11']);
            expect(filasPares(lateral('Presa e iniciativa'))).toEqual([
                ['Iniciativa Destreza +4 · Iniciativa mejorada +4', '+8'],
                ['Presa Ataque base +8 · Fuerza +8 · Tamaño (Grande) +4', '+20'],
            ]);
        });

        it('cada pestaña enseña su parte, y las flechas cambian de pestaña', () => {
            abrirPestana('Capacidades');
            expect(titulos('[role="tabpanel"]')).toEqual(['Dotes', 'Aptitudes de clase']);
            expect(enlace('Rastrear')).toBeTruthy();

            abrirPestana('Historia');
            expect(valor('Raza')).toBe('Centauro · Grande');

            const tablist = elemento().querySelector('[role="tablist"]') as HTMLElement;
            tablist.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
            fixture.detectChanges();
            expect(component.pestanaActiva).toBe('combate');
            tablist.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
            fixture.detectChanges();
            expect(component.pestanaActiva).toBe('historia');
            expect(elemento().querySelector(`#${component.idPestana('historia')}`)?.getAttribute('aria-selected')).toBe('true');
            expect(elemento().querySelector(`#${component.idPestana('historia')}`)?.getAttribute('tabindex')).toBe('0');
        });
    });

    describe('la pestaña Incarnum (Magic of Incarnum, opción B)', () => {
        it('sale con lo que calcula la API y la formación de partida, en las dos vistas', () => {
            component.pj = fichaDeLaApi({ incarnum: personajeIncarnumApi() });
            fixture.detectChanges();

            expect(pestanas()).toContain('Incarnum');
            abrirPestana('Incarnum');
            expect(titulos('[role="tabpanel"]')).toEqual(['Incarnum', 'Chakras y formación de partida', 'Receptáculos de esencia']);
            expect(valor('Reserva de esencia')).toBe('7 Encarnado 5, Esencia del azurín 1, Dureza azur 1');
            expect(valor('Fusiones a la vez · vínculos')).toBe('4 · 1');
            expect(texto()).toContain('Vinculada · 2 de esencia');
            const fusion = spyOn(component.fusionDetallesId, 'emit');
            enlace('Yelmo de cristal').click();
            expect(fusion).toHaveBeenCalledWith(284);

            component.cambiarVista('pagina');
            fixture.detectChanges();
            expect(titulos()).toContain('Chakras y formación de partida');
        });

        it('sin nada de incarnum no sale la pestaña', () => {
            component.pj = fichaDeLaApi({ incarnum: null });
            fixture.detectChanges();
            expect(pestanas()).not.toContain('Incarnum');
        });
    });

    it('las dos vistas enseñan lo mismo; solo cambia la colocación', () => {
        component.pj = fichaDeLaApi({
            ...crearEquipoFichaApi(),
            dotes: [{ Dote: { Id: 7, Nombre: 'Rastrear' }, Contexto: { Entidad: 'personaje', Extra: '', Id_extra: -1, Origen: 'Explorador' } }],
            idi: [{ Nombre: 'Silvano', Descripcion: '', Secreto: false, Oficial: true }],
            con: [{ Id: 4, Nombre: 'Luz' }],
            ventajas: [{ id: 3, nombre: 'Voluntad de hierro' }],
            familiares: [{ Id: 101, Id_familiar: 5, Nombre: 'Cuervo sabio' }],
            reduccionesDano: [{ valor: '5/plata', origen: 'Licántropo' }],
        });
        component.pj.Personalidad = 'Curiosa y aventurera.';
        component.pj.Contexto = 'Nació en un bosque templado.';
        fixture.detectChanges();

        const enPestanas = new Set<string>();
        const textosPestanas: string[] = [];
        for (const pestana of pestanas()) {
            abrirPestana(pestana);
            titulos('[role="tabpanel"]').forEach((titulo) => enPestanas.add(titulo));
            textosPestanas.push(limpio(elemento().querySelector('[role="tabpanel"]')));
        }

        component.cambiarVista('pagina');
        fixture.detectChanges();
        // En la página, las salvaciones van en sus casillas, junto a las características.
        const enPagina = new Set([...titulos(), 'Salvaciones']);
        expect([...enPagina].sort()).toEqual([...enPestanas].sort());
        expect(casillas().map(([abreviatura]) => abreviatura)).toContain('FORTALEZA');
        for (const fragmento of ['Luz', 'Silvano', 'Cuervo sabio', '5/plata', 'Voluntad de hierro', 'Flechas ×20', 'Curiosa y aventurera.'])
            expect(textosPestanas.join(' ')).withContext(fragmento).toContain(fragmento);
        for (const fragmento of ['Luz', 'Silvano', 'Cuervo sabio', '5/plata', 'Voluntad de hierro', 'Flechas ×20', 'Curiosa y aventurera.'])
            expect(texto()).withContext(fragmento).toContain(fragmento);
    });

    describe('página continua', () => {
        it('enseña la cabecera, los datos, la franja grande y las casillas con las salvaciones', () => {
            component.pj = fichaDeLaApi();
            verPagina();

            expect(tipoCabecera()).toBe('Personaje · Centauro · Explorador 8');
            expect(etiquetasCabecera()).toEqual(['Público', 'Oficial']);
            expect(valor('Raza')).toBe('Centauro · Grande');
            expect(valor('Clase')).toBe('Explorador 8');
            expect(valor('Nivel efectivo (NEP)')).toBe('14 · 4 DG raciales + 8 de clase + 2 de ajuste');
            expect(valor('Tipo de criatura')).toBe('Humanoide monstruoso');
            expect(franja()).toEqual([
                ['Puntos de golpe', '80'],
                ['Clase de armadura', '17'],
                ['Iniciativa', '+8'],
                ['Ataque base', '+8/+3'],
                ['Presa', '+20'],
                ['Velocidad', "50'"],
            ]);
            expect(casillas()[0]).toEqual(['FUE', '26', '+8']);
            expect(casillas()[6]).toEqual(['FORTALEZA', '+11', 'clase +6 · varios +1']);
            expect(casillas()[8]).toEqual(['VOLUNTAD', '+6', 'clase +2']);
        });

        it('enseña el tamaño que cuenta con su espacio y su alcance, y por qué no es el de la raza', () => {
            component.pj = fichaDeLaApi({
                tamano: {
                    id: 6, nombre: 'Grande', modificador: -1, modificadorPresa: 4, modificadorEsconderse: -4, espacio: 10, alcance: 10,
                    base: { Id: 5, Nombre: 'Mediano' }, pasos: 1, origenes: [{ origen: 'Aptitud grande', pasos: 1 }],
                },
            });
            verPagina();

            expect(valor('Tamaño')).toBe("Grande · espacio 10' · alcance 10'");
            const dato = (component as any).m.datos.find((d: any) => d.etiqueta === 'Tamaño');
            expect(dato.ayuda).toBe('Mediano por su raza; Aptitud grande +1');

            component.pj = fichaDeLaApi({
                tamano: {
                    id: 5, nombre: 'Mediano', modificador: 0, modificadorPresa: 0, modificadorEsconderse: 0, espacio: 5, alcance: 5,
                    base: { Id: 5, Nombre: 'Mediano' }, pasos: 0, origenes: [],
                },
            });
            fixture.detectChanges();
            expect(valor('Tamaño')).toBe("Mediano · espacio 5' · alcance 5'");
            expect((component as any).m.datos.find((d: any) => d.etiqueta === 'Tamaño').ayuda).toBeNull();
        });

        it('no enseña lo que la API da null ni lo que es de relleno', () => {
            component.pj = fichaDeLaApi();
            verPagina();

            for (const etiqueta of ['Deidad', 'Alineamiento', 'Campaña', 'Trama', 'Subtrama', 'Región', 'Raza base', 'Subtipos'])
                expect(valor(etiqueta)).withContext(etiqueta).toBeNull();
            expect(texto()).not.toContain('null');
            expect(texto()).not.toContain('undefined');
            expect(titulos()).not.toContain('Magia');
            expect(titulos()).not.toContain('Defensas especiales');

            component.pj = fichaDeLaApi({ g: 'Sin genero', de: 'No tener deidad' });
            fixture.detectChanges();
            expect(valor('Género')).toBeNull();
            expect(valor('Deidad')).toBeNull();
        });

        it('las clases, la raza, el tipo y la deidad son enlaces a su detalle', () => {
            component.pj = fichaDeLaApi({ de: 'Ehlonna' });
            const clase = spyOn(component.claseDetalles, 'emit');
            const raza = spyOn(component.razaDetalles, 'emit');
            const tipo = spyOn(component.tipoDetalles, 'emit');
            const deidad = spyOn(component.deidadDetallesPorNombre, 'emit');
            verPagina();

            enlace('Explorador 8').click();
            enlace('Centauro').click();
            enlace('Humanoide monstruoso').click();
            enlace('Ehlonna').click();
            expect(clase).toHaveBeenCalledWith('Explorador');
            expect(raza).toHaveBeenCalledWith(30);
            expect(tipo).toHaveBeenCalledWith(jasmine.objectContaining({ Nombre: 'Humanoide monstruoso' }));
            expect(deidad).toHaveBeenCalledWith('Ehlonna');
        });

        it('enseña la campaña, la trama y la subtrama que da la API y nada cuando son null', () => {
            component.pj = fichaDeLaApi({ ncam: 'Costa de la Espada', ntr: 'Torre eclipsada', nst: null });
            verPagina();

            expect(valor('Campaña')).toBe('Costa de la Espada');
            expect(valor('Trama')).toBe('Torre eclipsada');
            expect(valor('Subtrama')).toBeNull();
        });
    });

    describe('cabecera', () => {
        it('enseña «Creado por ti» bajo el nombre cuando el personaje es de la sesión', () => {
            fixture.detectChanges();

            const pie = elemento().querySelector('.ficha-cabecera__identidad .ficha-cabecera__pie');
            expect(limpio(pie)).toBe('Creado por ti');
            expect(pie?.querySelector('button')).toBeNull();
        });

        it('el creador de otro personaje es un enlace a su perfil público', () => {
            component.pj.ownerUid = 'otro-uid';
            component.pj.ownerDisplayName = 'Aramil';
            const perfil = spyOn(component.perfilPublicoDetalles, 'emit');
            fixture.detectChanges();

            expect(limpio(elemento().querySelector('.ficha-cabecera__pie'))).toBe('Creado por Aramil');
            enlace('Aramil').click();
            expect(perfil).toHaveBeenCalledWith({ uid: 'otro-uid', initialDisplayName: 'Aramil' });
        });

        it('el PDF sale por defecto, se oculta con la entrada y delega en la descarga en segundo plano', () => {
            fixture.detectChanges();
            expect(texto()).toContain('Generar PDF');

            component.pj.Nombre = 'Druida de prueba';
            component.generarFicha();
            expect(fichasDescargaBgSvcMock.descargarFichas).toHaveBeenCalledOnceWith(
                jasmine.objectContaining({ Nombre: 'Druida de prueba' }),
                { incluirConjuros: true, incluirFamiliares: false, incluirCompaneros: false });

            fixture.destroy();
            crear();
            component.mostrarBotonGenerarPdf = false;
            fixture.detectChanges();
            expect(texto()).not.toContain('Generar PDF');
        });

        it('los interruptores de visibilidad y archivado solo los ve el dueño con sesión', () => {
            fixture.detectChanges();
            expect(elemento().querySelectorAll('mat-slide-toggle').length).toBe(2);

            fixture.destroy();
            crear();
            component.pj.ownerUid = 'otro-uid';
            fixture.detectChanges();
            expect(elemento().querySelectorAll('mat-slide-toggle').length).toBe(0);

            fixture.destroy();
            crear();
            userSvcMock.CurrentUserUid = '';
            fixture.detectChanges();
            expect(component.mostrarControlVisibilidad).toBeFalse();
            expect(elemento().querySelectorAll('mat-slide-toggle').length).toBe(0);
        });

        it('cambiar la visibilidad o el archivado actualiza la caché del listado y las etiquetas', async () => {
            component.pj.visible_otros_usuarios = false;
            fixture.detectChanges();
            expect(etiquetasCabecera()).toContain('Privado');

            await component.actualizarVisibilidad(true);
            await component.actualizarArchivado(true);
            fixture.detectChanges();

            expect(component.pj.visible_otros_usuarios).toBeTrue();
            expect(component.pj.Archivado).toBeTrue();
            expect(listaPersonajesSvcMock.actualizarVisibilidadEnCache).toHaveBeenCalledOnceWith(1, true);
            expect(listaPersonajesSvcMock.actualizarArchivadoEnCache).toHaveBeenCalledOnceWith(1, true);
            expect(etiquetasCabecera()).toEqual(jasmine.arrayContaining(['Público', 'Archivado']));
        });
    });

    describe('datos del personaje', () => {
        it('enseña la región del catálogo cuando tiene una, y nada con 0', () => {
            regionSvcMock.getRegiones = () => of([{ Id: 2, Nombre: 'Costa de la espada', Oficial: true }]);
            component.pj.Id_region = 2;
            component.pj.Region = { Id: 2, Nombre: '' };
            verPagina();
            expect(valor('Región')).toBe('Costa de la espada');

            component.pj = { ...component.pj, Id_region: 0, Region: { Id: 0, Nombre: 'Sin región' } };
            fixture.detectChanges();
            expect(valor('Región')).toBeNull();
        });

        it('enseña la edad, la altura, el peso y la madurez', () => {
            component.pj.Raza.Nombre = 'Elfo';
            component.pj.Raza.Edad_adulto = 110;
            component.pj.Raza.Edad_mediana = 175;
            component.pj.Raza.Edad_viejo = 263;
            component.pj.Raza.Edad_venerable = 350;
            component.pj.Edad = 180;
            component.pj.Altura = 1.84;
            component.pj.Peso = 73;
            verPagina();

            expect(valor('Edad')).toBe('180 años');
            expect(valor('Altura')).toBe('1,84 m');
            expect(valor('Peso')).toBe('73 kg');
            expect(valor('Madurez')).toBe('Mediana edad · −1 a Fue, Des y Con; +1 a Int, Sab y Car');
            expect((component as any).m.datos.find((d: any) => d.etiqueta === 'Madurez').ayuda)
                .toBe('Adulto: 110 | Mediana: 175 | Viejo: 263 | Venerable: 350\n−1 a Fue, Des y Con; +1 a Int, Sab y Car');
        });

        it('pasa a metros la altura que llega en centímetros', () => {
            component.pj.Altura = 170;
            verPagina();
            expect(valor('Altura')).toBe('1,70 m');
        });

        it('calcula la madurez venerable y sus modificadores como en C#', () => {
            component.pj.Edad = 95;
            component.pj.Raza.Edad_adulto = 20;
            component.pj.Raza.Edad_mediana = 40;
            component.pj.Raza.Edad_viejo = 60;
            component.pj.Raza.Edad_venerable = 80;

            expect(component.madurezEdad).toEqual(jasmine.objectContaining({ pasos: 3, nombre: 'Venerable', fisico: -6, mental: 3 }));
        });

        it('sin las edades de la raza no enseña la madurez (MJ, tabla 6-5: sin edades no hay etapas)', () => {
            component.pj.Edad = 95;
            component.pj.Raza.Edad_adulto = 0;
            component.pj.Raza.Edad_mediana = 0;
            component.pj.Raza.Edad_viejo = 0;
            component.pj.Raza.Edad_venerable = 0;
            verPagina();

            expect(valor('Edad')).toBe('95 años');
            expect(valor('Madurez')).toBeNull();
        });

        it('los subtipos son enlaces, sin los textos que no se enseñan; la raza base sale si la hay', () => {
            component.pj.Raza.Nombre = 'Aasimar';
            component.pj.Subtipos = [{ Id: 1, Nombre: 'Angelical' }, { Id: 2, Nombre: 'No aplica' }];
            component.pj.RazaBase = { Id: 10, Nombre: 'Humano' } as any;
            const subtipo = spyOn(component.subtipoDetalles, 'emit');
            verPagina();

            expect(valor('Subtipos')).toBe('Angelical');
            expect(valor('Raza base')).toBe('Humano');
            enlace('Angelical').click();
            expect(subtipo).toHaveBeenCalledWith({ Id: 1, Nombre: 'Angelical' });
        });

        it('oculta la personalidad y el contexto de relleno', () => {
            component.pj.Contexto = 'Eres totalmente antirol hijo mio.';
            component.pj.Personalidad = 'Rellena un fisco puto vago.';
            verPagina();

            expect(lateral('Personalidad')).toBeNull();
            expect(lateral('Contexto')).toBeNull();
        });
    });

    describe('habilidades', () => {
        it('enseña las que tienen rangos o varios y, con «Ver las N», todas', () => {
            component.pj = fichaDeLaApi();
            verPagina();

            const filas = () => Array.from(lateral('Habilidades')!.querySelectorAll('tbody tr')).map((fila) => textos('td', fila));
            expect(filas()).toEqual([['Avistar de clase', 'Sab', '14', '+18']]);

            enlace('Ver las 2').click();
            fixture.detectChanges();
            expect(filas()).toEqual([['Avistar de clase', 'Sab', '14', '+18'], ['Artesanía (Elegir)', 'Int', '0', '+4']]);
            expect(enlace('Ver solo las que tienen rangos')).toBeTruthy();
        });

        it('el total negativo sale sin el más', () => {
            component.pj.Habilidades = [{ Nombre: 'Trepar', Car: 'Fuerza', Rangos: 1, Rangos_varios: 0, Mod_car: -5, Extra: '', Varios: '' } as any];
            verPagina();

            const fila = textos('tbody td', lateral('Habilidades'));
            expect(fila).toEqual(['Trepar', 'Fue', '1', '-4']);
        });
    });

    describe('capacidades', () => {
        it('enseña el origen de rasgos, raciales, dotes, idiomas y ventajas, y los abre', () => {
            component.pj.Tipo_criatura.Nombre = 'Muerto viviente';
            component.pj.Tipo_criatura.Rasgos = [{ Id: 1, Nombre: 'Inmunidad al veneno', Descripcion: '', Oficial: true } as any];
            component.pj.Raciales = [{ Id: 10, Nombre: 'Sangre antigua', Origen: 'Elfo' } as any];
            component.pj.Dotes = [{ Nombre: 'Alerta', Descripcion: '', Beneficio: '', Pagina: 1, Extra: '', Origen: 'Nivel' }];
            component.pj.Idiomas = [{ Nombre: 'Abisal', Descripcion: 'De los demonios', Secreto: false, Oficial: true, Origen: 'Ventaja' }];
            component.pj.Ventajas = [{ Nombre: 'Voluntad de hierro', Origen: 'Ventaja' }, 'Desventaja: Miopia'];
            const racial = spyOn(component.racialDetallesPorNombre, 'emit');
            const ventaja = spyOn(component.ventajaDetallesPorNombre, 'emit');
            const rasgo = spyOn(component.rasgoDetalles, 'emit');
            const dote = spyOn(component.doteDetalles, 'emit');
            verPagina();

            expect(limpio(lateral('Rasgos del tipo de criatura'))).toContain('Inmunidad al veneno Muerto viviente');
            expect(limpio(lateral('Rasgos raciales'))).toContain('Sangre antigua Elfo');
            expect(limpio(lateral('Dotes'))).toContain('Alerta Nivel');
            expect(limpio(lateral('Idiomas'))).toContain('Abisal Ventaja');
            expect(limpio(lateral('Ventajas y desventajas'))).toContain('Voluntad de hierro Ventaja');
            expect(limpio(lateral('Ventajas y desventajas'))).toContain('Miopia Desventaja');

            enlace('Sangre antigua').click();
            enlace('Voluntad de hierro').click();
            enlace('Miopia').click();
            enlace('Inmunidad al veneno').click();
            enlace('Alerta').click();
            expect(racial).toHaveBeenCalledWith({ id: 10, nombre: 'Sangre antigua' });
            expect(ventaja).toHaveBeenCalledWith({ nombre: 'Voluntad de hierro', origen: 'Ventaja' });
            expect(ventaja).toHaveBeenCalledWith({ nombre: 'Miopia', origen: 'Desventaja' });
            expect(rasgo).toHaveBeenCalledWith(jasmine.objectContaining({ Nombre: 'Inmunidad al veneno' }));
            expect(dote).toHaveBeenCalledWith(jasmine.objectContaining({ Dote: jasmine.objectContaining({ Nombre: 'Alerta' }) }));
        });

        it('sin origen no enseña nota, salvo el tipo de criatura en sus rasgos', () => {
            component.pj.Tipo_criatura.Nombre = 'Humanoide';
            component.pj.Tipo_criatura.Rasgos = [{ Id: 1, Nombre: 'Rasgo base', Descripcion: '', Oficial: true } as any];
            component.pj.Dotes = [{ Nombre: 'Alerta', Descripcion: '', Beneficio: '', Pagina: 1, Extra: '', Origen: '' }];
            verPagina();

            const notas = textos('.personaje-nota');
            expect(notas).toEqual(['Humanoide']);
        });

        it('lee las raciales con claves antiguas y, si no tiene, las de la raza', () => {
            (component.pj as any).Raciales = [];
            (component.pj as any).Raza = { ...component.pj.Raza, Raciales: [{ i: 31, n: 'Olfato', o: 'Licantropo' }] };
            verPagina();

            expect(limpio(lateral('Rasgos raciales'))).toContain('Olfato Licantropo');
        });

        it('enseña las plantillas con lo que dan y las abre', () => {
            component.pj.Plantillas = [{ Id: 1, Nombre: 'Liche', Multiplicador_dgs_lic: 0, Tipo_dgs_lic: 'd12', Suma_dgs_lic: 0, Ajuste_nivel: 4, Heredada: false } as any];
            const plantilla = spyOn(component.plantillaDetalles, 'emit');
            verPagina();

            expect(textos('li', lateral('Plantillas'))).toEqual(['Liche ajuste de nivel +4 · adquirida']);
            enlace('Liche').click();
            expect(plantilla).toHaveBeenCalledWith({ id: 1, nombre: 'Liche' });
        });

        it('enseña los familiares y compañeros y abre su detalle', () => {
            component.pj.Familiares = [{ Id: 101, Nombre: 'Cuervo sabio' } as any];
            component.pj.Companeros = [{ Id: 202, Nombre: 'Lobo fiel' } as any];
            const monstruo = spyOn(component.monstruoDetalles, 'emit');
            verPagina();

            expect(textos('.ficha-subtitulo, li', lateral('Familiares y compañeros')))
                .toEqual(['Familiares', 'Cuervo sabio', 'Compañeros animales', 'Lobo fiel']);
            enlace('Lobo fiel').click();
            expect(monstruo).toHaveBeenCalledWith(jasmine.objectContaining({ Id: 202 }));
        });

        it('usa el comodín de la API para los extras de los especiales', () => {
            component.pj = fichaDeLaApi({
                especiales: [
                    { id: 38, nombre: 'Enemigo predilecto', idExtra: 40, extra: 'Primero', extraComodin: null },
                    { id: 50, nombre: 'Saber bárdico', idExtra: 13, extra: 'Cualquiera', extraComodin: 'cualquiera' },
                    { id: 51, nombre: 'Esquiva asombrosa', idExtra: 110, extra: 'Elegir', extraComodin: 'elegir' },
                    { id: 30, nombre: 'Empatía salvaje', idExtra: null, extra: null, extraComodin: null },
                ],
            });
            const especial = spyOn(component.especialDetallesPorNombre, 'emit');
            verPagina();

            expect(textos('li', lateral('Aptitudes de clase'))).toEqual(['Enemigo predilecto (Primero)', 'Saber bárdico', 'Esquiva asombrosa (Elegir)', 'Empatía salvaje']);
            enlace('Saber bárdico').click();
            expect(especial).toHaveBeenCalledWith('Saber bárdico');
        });
    });

    describe('magia', () => {
        it('enseña la progresión de cada clase lanzadora con el catálogo', () => {
            component.pj.desgloseClases = [{ Nombre: 'Mago', Nivel: 1, Caracteristica_lanzamiento: 'Inteligencia' }];
            component.clasesCatalogo = [claseLanzadora(1, 'Mago', 1, { Conjuros: { Dependientes_alineamiento: true, Conocidos_total: true } })];
            const clase = spyOn(component.claseDetalles, 'emit');
            verPagina();

            const magia = limpio(lateral('Magia'));
            expect(magia).toContain('Mago 1');
            expect(magia).toContain('Lanzador arcano · Nivel de lanzador 1 · Dependiente de alineamiento · Salvación (Inteligencia)');
            expect(magia).toContain('Niveles diarios 0, 1');
            expect(magia).toContain('Conocidos 3');
            lateral('Magia')!.querySelector<HTMLButtonElement>('button.ficha-enlace')!.click();
            expect(clase).toHaveBeenCalledWith('Mago');
        });

        it('enseña el nivel de lanzador, los conjuros al día y los puntos de poder que da la API (MJ tabla 1-1, MPE tabla 2-1)', () => {
            component.pj.desgloseClases = [
                {
                    Nombre: 'Clérigo', Nivel: 1, Caracteristica_lanzamiento: 'Sabiduría', Nivel_lanzador: 1,
                    Conjuros_diarios: [
                        { nivel: 0, base: 3, adicionales: 0, especialista: 0, dominio: 0, total: 3, puedeLanzar: true },
                        { nivel: 1, base: 1, adicionales: 1, especialista: 0, dominio: 1, total: 3, puedeLanzar: true },
                    ],
                    Puntos_poder: null,
                },
                { Nombre: 'Paladín', Nivel: 4, Caracteristica_lanzamiento: 'Sabiduría', Nivel_lanzador: 2, Conjuros_diarios: [], Puntos_poder: null },
            ];
            component.clasesCatalogo = [
                claseLanzadora(1, 'Clérigo', 1, { Conjuros: { Arcanos: false, Divinos: true } }),
                claseLanzadora(2, 'Paladín', 4, { Conjuros: { Arcanos: false, Divinos: true } }),
            ];
            verPagina();

            const magia = limpio(lateral('Magia'));
            expect(magia).toContain('Conjuros al día 0: 3 · 1: 1+2');
            expect(magia).toContain('Nivel de lanzador 2');
        });

        it('enseña el nivel de lanzador efectivo por clase con los aumentos guardados', () => {
            component.pj.desgloseClases = [{ Nombre: 'Mago', Nivel: 10 }, { Nombre: 'Archimago', Nivel: 2 }];
            component.pj.ProgresionLanzador = {
                selecciones: [
                    { idClaseAplicada: 187, nivelClaseAplicado: 1, indiceAumento: 1, idClaseObjetivo: 186 },
                    { idClaseAplicada: 187, nivelClaseAplicado: 2, indiceAumento: 1, idClaseObjetivo: 186 },
                ],
            };
            component.clasesCatalogo = [
                claseLanzadora(186, 'Mago', 20),
                { Id: 187, Nombre: 'Archimago', Conjuros: { Arcanos: false, Divinos: false, Psionicos: false }, Aumenta_clase_lanzadora: true, Desglose_niveles: [] } as any,
            ];
            verPagina();

            expect(limpio(lateral('Magia'))).toContain('Nivel de lanzador 12');
            expect(component.getSubchipsLanzadorClase({ Nombre: 'Archimago', Nivel: 2 })).toEqual([]);
            expect(component.pj.Niveles_lanzador?.[0]?.nivelLanzador).toBe(12);
        });

        it('con el nivel de lanzador de la API no añade el calculado; el de su raza va aparte (lanzamiento racial)', () => {
            component.pj.desgloseClases = [{ Nombre: 'Mago', Nivel: 10 }, { Nombre: 'Archimago', Nivel: 2 }];
            component.pj.ProgresionLanzador = {
                selecciones: [
                    { idClaseAplicada: 187, nivelClaseAplicado: 1, indiceAumento: 1, idClaseObjetivo: 186 },
                    { idClaseAplicada: 187, nivelClaseAplicado: 2, indiceAumento: 1, idClaseObjetivo: 186 },
                ],
            };
            component.clasesCatalogo = [
                claseLanzadora(186, 'Mago', 20),
                { Id: 187, Nombre: 'Archimago', Conjuros: { Arcanos: false, Divinos: false, Psionicos: false }, Aumenta_clase_lanzadora: true, Desglose_niveles: [] } as any,
            ];
            verPagina();

            const chips = component.getSubchipsLanzadorClase({ Nombre: 'Mago', Nivel: 10, Nivel_lanzador: 11, Nivel_lanzamiento_racial: 4 } as any);
            expect(chips).toContain('Nivel de lanzador 11');
            expect(chips).not.toContain('Nivel de lanzador 12');
            expect(chips).toContain('4 de su raza');
        });

        it('enseña escuelas prohibidas y dominios aunque lleguen como texto u objeto', () => {
            component.pj.Escuelas_prohibidas = ['Evocación', { Nombre: 'Ilusión' }, { Nombre: '  ' } as any];
            (component.pj as any).Dominios = [{ Nombre: 'Guerra' }, { nombre: 'Bien' }, 'Magia'];
            verPagina();

            expect(component.getEscuelasProhibidasVisibles()).toEqual(['Evocación', 'Ilusión']);
            expect(component.getDominiosVisibles()).toEqual(['Guerra', 'Bien', 'Magia']);
            expect(valor('Escuelas prohibidas')).toBe('Evocación, Ilusión');
            expect(valor('Dominios')).toBe('Guerra, Bien, Magia');
            expect(texto()).not.toContain('[object Object]');
        });

        it('enseña los conjuros conocidos y las sortílegas con sus datos, y los abre', () => {
            const luz = { Id: 1, Nombre: 'Luz' } as any;
            component.pj.Conjuros = [luz];
            component.pj.Sortilegas = [{
                Conjuro: { Id: 2, Nombre: 'Levitar' }, Nivel_lanzador: 9, Usos_diarios: 'A voluntad', Dgs_necesarios: 4,
                Descripcion: 'Innato', Origen: 'Azotamentes',
            } as any];
            const conjuro = spyOn(component.conjuroDetalles, 'emit');
            const sortilega = spyOn(component.sortilegaDetalles, 'emit');
            verPagina();

            expect(textos('li', lateral('Aptitudes sortílegas'))).toEqual(['Levitar NL 9 · A voluntad · desde 4 DG · Innato']);
            enlace('Luz').click();
            enlace('Levitar').click();
            expect(conjuro).toHaveBeenCalledWith(luz);
            expect(sortilega).toHaveBeenCalledWith(jasmine.objectContaining({ Nivel_lanzador: 9 }));
        });
    });

    describe('combate y equipo', () => {
        it('enseña las salvaciones de la API con su total, que incluye la característica', () => {
            component.pj = fichaDeLaApi();
            fixture.detectChanges();

            expect(component.salvacionesVisibles.map((salvacion) => salvacion.total)).toEqual([11, 14, 6]);
            expect(component.salvacionesVisibles[0]).toEqual(jasmine.objectContaining({
                clase: 6, claseOrigenes: 'Explorador', varios: 1, variosOrigenes: 'Centauro',
                desglose: 'Constitución +4\nExplorador +6\nCentauro +1',
            }));
            // La parte de clase sin origen (el «Placeholder» de las fichas antiguas) cuenta y se nombra por su tipo.
            expect(component.salvacionesVisibles[1].claseOrigenes).toBe('');
            expect(filasPares(lateral('Salvaciones'))[1]).toEqual(['Reflejos Destreza +4 · Clase +6 · Centauro +4', '+14']);
        });

        it('enseña la defensa, lo que suma el equipo a las salvaciones, el equipo y el dinero', () => {
            component.pj = fichaDeLaApi(crearEquipoFichaApi());
            verPagina();

            expect(component.caDisclaimer).toContain('Cota de mallas +5 (armadura)');
            expect(franja()[1][1]).toBe('18 toque 11 · desprev. 16');
            expect(filasPares(lateral('Clase de armadura')).map(([nombre, numero]) => [nombre.split(' ')[0], numero])).toEqual([
                ['Clase', '18'], ['Toque', '11'], ['Desprevenido', '16'], ['Destreza', '+2'], ['Penalizador', '-5'], ['Fallo', '35%'],
            ]);
            expect(casillas()[6][2]).toContain('equipo +1');
            const equipo = limpio(lateral('Equipo y carga'));
            expect(valor('Dinero')).toBe('12,5 po');
            expect(valor('Peso total')).toBe('96 lb');
            expect(equipo).toContain('Flechas ×20');
            expect(equipo).toContain('Equipado (hombros)');
            expect(equipo).toContain('Salvaciones +2 (competencia) contra encantamientos');
            expect(equipo).not.toContain('Todavía no tiene equipo comprado.');
        });

        it('sin armadura puesta no enseña la Destreza máxima ni el penalizador', () => {
            component.pj = fichaDeLaApi(crearEquipoFichaApi({
                equipo: [],
                defensa: { ...crearEquipoFichaApi()['defensa'], destrezaMaxima: null, penalizadorArmadura: 0, falloConjuroArcano: 0 },
            }));
            verPagina();

            const defensa = limpio(lateral('Clase de armadura'));
            expect(defensa).toContain('Toque');
            expect(defensa).not.toContain('Destreza máxima');
            expect(defensa).not.toContain('Penalizador de armadura');
            expect(limpio(lateral('Equipo y carga'))).toContain('Todavía no tiene equipo comprado.');
        });

        it('no enseña la presa cuando la API no la da, ni el ataque base de relleno', () => {
            component.pj = fichaDeLaApi({ a: '-', presa: null });
            verPagina();

            expect(component.tienePresaVisible()).toBeFalse();
            expect(franja().map(([etiqueta]) => etiqueta)).not.toContain('Presa');
            expect(franja().map(([etiqueta]) => etiqueta)).not.toContain('Ataque base');
            expect(texto()).not.toContain('Presa');
        });

        it('enseña la reducción de daño, las resistencias y los enemigos predilectos con su origen', () => {
            component.pj.Rds = [{ Modificador: '5/plata', Origen: 'Licántropo' }];
            component.pj.Rcs = [{ Modificador: '12', Origen: 'Drow' }];
            component.pj.Res = [{ Modificador: 'Fuego 10', Origen: 'Tiflin' }];
            component.pj.enemigosPredilectos = [{ id: 3, nombre: 'Orcos', bono: 4, veces: 2 }];
            verPagina();

            expect(filasPares(lateral('Defensas especiales'))).toEqual([
                ['Reducción de daño Licántropo', '5/plata'],
                ['Resistencia a conjuros Drow', '12'],
                ['Resistencia a la energía Tiflin', 'Fuego 10'],
            ]);
            expect(filasPares(lateral('Enemigos predilectos'))).toEqual([['Orcos 2 veces', '+4']]);
        });

        it('una característica perdida sale con «—» y «Perdida»', () => {
            component.pj.Fuerza = 0;
            component.pj.ModFuerza = 0;
            component.pj.Constitucion = 13;
            component.pj.ModConstitucion = 1;
            component.pj.Caracteristicas_perdidas = { Fuerza: true };
            verPagina();

            expect(casillas()[0]).toEqual(['FUE', '—', 'Perdida']);
            expect(elemento().querySelector('.ficha-casilla')?.getAttribute('aria-label')).toBe('Fuerza perdida');
            expect(casillas()[2]).toEqual(['CON', '13', '+1']);
        });

        it('cuando vuela, la velocidad lleva sus otros movimientos y la ayuda de maniobrabilidad', () => {
            component.pj.Correr = 30;
            component.pj.Volar = 40;
            (component.pj as any).Raza = {
                ...(component.pj as any).Raza,
                Maniobrabilidad: {
                    Nombre: 'Perfecta', Velocidad_avance: 'Normal', Flotar: 1, Volar_atras: 1, Contramarcha: 1, Giro: 'Cualquiera',
                    Rotacion: 'Cualquiera', Giro_max: 'Cualquiera', Angulo_ascenso: 'Cualquiera', Velocidad_ascenso: 'Normal',
                    Angulo_descenso: 'Cualquiera', Descenso_ascenso: 1,
                },
            };
            verPagina();

            expect(franja().find(([etiqueta]) => etiqueta === 'Velocidad')?.[1]).toContain("30' volar 40' (perfecta)");
            elemento().querySelector<HTMLButtonElement>('.ficha-ayuda')!.click();
            expect(component.mostrarInfoManiobrabilidad).toBeTrue();
            const secciones = JSON.stringify(component.getManiobrabilidadInfoSecciones());
            expect(secciones).toContain('Perfecta');
            expect(secciones).toContain('Flotar: Sí.');
        });
    });

    describe('vista previa de la creación', () => {
        beforeEach(() => {
            component.esPreviewNuevoPersonaje = true;
        });

        it('se recalcula cuando el borrador cambia por dentro, y no repinta si no cambia nada', () => {
            component.pj.ModConstitucion = 1;
            verPagina();
            expect(component.salvacionesVisibles[0]).toEqual(jasmine.objectContaining({ total: 1, clase: 0, varios: 0 }));
            const antes = component.m;
            fixture.detectChanges();
            expect(component.m).toBe(antes);

            component.pj.Salvaciones.fortaleza.modsClaseos = [{ valor: 2, origen: 'Clase test' }];
            component.pj.Salvaciones.fortaleza.modsVarios = [{ valor: -1, origen: 'Plantilla test' }];
            component.pj.Raciales = [{ Id: 20, Nombre: 'Telepatia', Origen: 'Azotamentes' } as any];
            fixture.detectChanges();

            // En el borrador se suma como en la API: característica + clase + varios.
            expect(component.salvacionesVisibles[0]).toEqual(jasmine.objectContaining({
                nombre: 'Fortaleza', total: 2, clase: 2, claseOrigenes: 'Clase test', varios: -1, variosOrigenes: 'Plantilla test',
            }));
            expect(limpio(lateral('Rasgos raciales'))).toContain('Telepatia Azotamentes');
        });

        it('enseña la iniciativa y la carga aunque valgan 0 al confirmar las características', () => {
            component.caracteristicasConfirmadas = true;
            component.pj.ModDestreza = 0;
            component.pj.Iniciativa_varios = [];
            component.pj.Capacidad_carga = { Ligera: 0, Media: 0, Pesada: 0 };
            verPagina();

            expect(franja().find(([etiqueta]) => etiqueta === 'Iniciativa')?.[1]).toBe('+0');
            expect(valor('Carga ligera')).toBe('0 lb');
            expect(valor('Carga pesada')).toBe('0 lb');
        });

        it('enseña la experiencia a 0 cuando ya aplica el NEP, y nada de dinero, creador, campaña ni etiquetas', () => {
            component.pj.Raza.Ajuste_nivel = 1;
            component.pj.Experiencia = 0;
            component.pj.Campana = 'Costa de la Espada';
            verPagina();

            expect(valor('Experiencia')).toBe('0 PX');
            expect(valor('Dinero')).toBeNull();
            expect(valor('Campaña')).toBeNull();
            expect(elemento().querySelector('.ficha-cabecera__pie')).toBeNull();
            expect(etiquetasCabecera()).not.toContain('Público');
            expect(texto()).not.toContain('Todavía no tiene equipo comprado.');
        });

        it('calcula la iniciativa como el modificador de Destreza más los bonos varios', () => {
            component.pj.ModDestreza = 2;
            component.pj.Iniciativa_varios = [{ Valor: 3, Origen: 'Ventaja' }];
            component.pj.Destreza = 14;
            verPagina();

            expect(franja().find(([etiqueta]) => etiqueta === 'Iniciativa')?.[1]).toBe('+5');
        });
    });
});
