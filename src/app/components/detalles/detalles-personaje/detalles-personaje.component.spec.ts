import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Database } from '@angular/fire/database';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { NuevoPersonajeService } from 'src/app/services/nuevo-personaje.service';
import { FichasDescargaBackgroundService } from 'src/app/services/fichas-descarga-background.service';
import { PersonajeService } from 'src/app/services/personaje.service';
import { RegionService } from 'src/app/services/region.service';
import { UserService } from 'src/app/services/user.service';
import { DetallesPersonajeComponent } from './detalles-personaje.component';

describe('DetallesPersonajeComponent', () => {
    let component: DetallesPersonajeComponent;
    let fixture: ComponentFixture<DetallesPersonajeComponent>;
    let fichasDescargaBgSvcMock: any;
    let regionSvcMock: any;

    beforeEach(async () => {
        fichasDescargaBgSvcMock = {
            descargarFichas: jasmine.createSpy('descargarFichas').and.callFake(() => undefined),
        };
        regionSvcMock = {
            getRegiones: () => of([]),
        };
        await TestBed.configureTestingModule({
            declarations: [DetallesPersonajeComponent],
            providers: [
                {
                    provide: FichasDescargaBackgroundService,
                    useValue: fichasDescargaBgSvcMock,
                },
                {
                    provide: PersonajeService,
                    useValue: {
                        actualizarVisibilidadPersonaje: async () => ({
                            idPersonaje: 1,
                            visible_otros_usuarios: false,
                            uid: 'test-uid',
                        }),
                    },
                },
                {
                    provide: UserService,
                    useValue: {
                        CurrentUserUid: 'test-uid',
                    },
                },
                {
                    provide: RegionService,
                    useValue: regionSvcMock,
                },
                {
                    provide: Database,
                    useValue: {},
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesPersonajeComponent);
        component = fixture.componentInstance;
        component.pj = new NuevoPersonajeService().PersonajeCreacion;
    });

    it('muestra botón Generar pdf por defecto', () => {
        fixture.detectChanges();

        const botones = fixture.debugElement.queryAll(By.css('button'));
        const existeBoton = botones.some((btn) => `${btn.nativeElement.textContent ?? ''}`.includes('Generar pdf'));
        expect(existeBoton).toBeTrue();
    });

    it('generarFicha delega en descarga background con alcance de detalles', () => {
        component.pj.Nombre = 'Druida de prueba';
        component.pj.Conjuros = [{ Id: 1, Nombre: 'Luz' } as any];
        component.pj.Sortilegas = [];

        component.generarFicha();

        expect(fichasDescargaBgSvcMock.descargarFichas).toHaveBeenCalledTimes(1);
        expect(fichasDescargaBgSvcMock.descargarFichas).toHaveBeenCalledWith(jasmine.objectContaining({
            Nombre: 'Druida de prueba',
        }), {
            incluirConjuros: true,
            incluirFamiliares: false,
            incluirCompaneros: false,
        });
    });

    it('muestra "Creador: Tú" cuando el ownerUid coincide con la sesión activa', () => {
        component.pj.ownerUid = 'test-uid';
        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Creador: Tú');
    });

    it('oculta botón Generar pdf cuando mostrarBotonGenerarPdf es false', () => {
        component.mostrarBotonGenerarPdf = false;
        fixture.detectChanges();

        const botones = fixture.debugElement.queryAll(By.css('button'));
        const existeBoton = botones.some((btn) => `${btn.nativeElement.textContent ?? ''}`.includes('Generar pdf'));
        expect(existeBoton).toBeFalse();
    });

    it('oculta datos básicos faltantes por defecto', () => {
        component.pj.Genero = 'Sin genero';
        component.pj.Deidad = 'No tener deidad';
        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).not.toContain('Sin genero');
        expect(html).not.toContain('Deidad No tener deidad');
    });

    it('muestra la región cuando Id_region es mayor que 0', () => {
        regionSvcMock.getRegiones = () => of([{ Id: 2, Nombre: 'Costa de la espada', Oficial: true }]);
        component.pj.Id_region = 2;
        component.pj.Region = { Id: 2, Nombre: '' } as any;

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Región Costa de la espada');
    });

    it('no muestra región cuando Id_region es 0', () => {
        component.pj.Id_region = 0;
        component.pj.Region = { Id: 0, Nombre: 'Sin región' } as any;

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).not.toContain('Región');
    });

    it('no renderiza el bloque "No tiene clase"', () => {
        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).not.toContain('No tiene clase');
    });

    it('oculta contexto y personalidad de fallback semántico', () => {
        component.pj.Contexto = 'Eres totalmente antirol hijo mio.';
        component.pj.Personalidad = 'Rellena un fisco puto vago.';
        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).not.toContain('Contexto');
        expect(html).not.toContain('Personalidad');
    });

    it('activa modo compacto cuando el ancho del host es estrecho', () => {
        spyOn(component['hostElement'].nativeElement, 'querySelector').and.returnValue({
            getBoundingClientRect: () => ({
                width: 900,
                height: 500,
                top: 0,
                left: 0,
                right: 900,
                bottom: 500,
                x: 0,
                y: 0,
                toJSON: () => ({}),
            }),
        } as any);

        component['actualizarModoCompacto']();
        expect(component.modoCompactoLayout).toBeTrue();
    });

    it('desactiva modo compacto cuando el ancho disponible es amplio', () => {
        spyOn(component['hostElement'].nativeElement, 'querySelector').and.returnValue({
            getBoundingClientRect: () => ({
                width: 1100,
                height: 500,
                top: 0,
                left: 0,
                right: 1100,
                bottom: 500,
                x: 0,
                y: 0,
                toJSON: () => ({}),
            }),
        } as any);

        component['actualizarModoCompacto']();
        expect(component.modoCompactoLayout).toBeFalse();
    });

    it('muestra edad, altura, peso y madurez en la sección de raza', () => {
        component.pj.Raza.Nombre = 'Elfo';
        component.pj.Raza.Edad_adulto = 110;
        component.pj.Raza.Edad_mediana = 175;
        component.pj.Raza.Edad_viejo = 263;
        component.pj.Raza.Edad_venerable = 350;
        component.pj.Edad = 180;
        component.pj.Altura = 1.84;
        component.pj.Peso = 73;

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Edad 180 años');
        expect(html).toContain('Altura 1.84 m');
        expect(html).toContain('Peso 73 kg');
        expect(html).toContain('Madurez Mediana edad');
        expect(html).toContain('Fue/Des/Con -1');
        expect(html).toContain('Int/Sab/Car +1');
    });

    it('muestra subtipos válidos y oculta placeholders', () => {
        component.pj.Raza.Nombre = 'Aasimar';
        component.pj.Subtipos = [
            { Id: 1, Nombre: 'Angelical' },
            { Id: 2, Nombre: 'Placeholder' },
        ];

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Subtipos');
        expect(html).toContain('Angelical');
        expect(html).not.toContain('Placeholder');
    });

    it('muestra raza base cuando existe', () => {
        component.pj.Raza.Nombre = 'Prole de Bahamut';
        component.pj.RazaBase = {
            Id: 10,
            Nombre: 'Humano',
        } as any;

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Base: Humano');
    });

    it('no muestra raza base cuando es null', () => {
        component.pj.Raza.Nombre = 'Elfo';
        component.pj.RazaBase = null;

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).not.toContain('Base:');
    });

    it('calcula madurez venerable y modificadores de edad como en C#', () => {
        component.pj.Edad = 95;
        component.pj.Raza.Edad_mediana = 40;
        component.pj.Raza.Edad_viejo = 60;
        component.pj.Raza.Edad_venerable = 80;

        const madurez = component.madurezEdad;
        expect(madurez.id).toBe(3);
        expect(madurez.nombre).toBe('Venerable');
        expect(madurez.modFisico).toBe(-6);
        expect(madurez.modMental).toBe(3);
    });

    it('emite referencia estructurada al abrir detalle racial', () => {
        const emitSpy = spyOn(component.racialDetallesPorNombre, 'emit');
        component.verDetallesRacialPorNombre({ id: 15, nombre: 'Sangre antigua' });
        expect(emitSpy).toHaveBeenCalledWith({ id: 15, nombre: 'Sangre antigua' });
    });

    it('emite referencia estructurada al abrir detalle de ventaja', () => {
        const emitSpy = spyOn(component.ventajaDetallesPorNombre, 'emit');
        component.verDetallesVentajaPorNombre({ nombre: 'Voluntad de hierro', origen: 'Ventaja' });
        expect(emitSpy).toHaveBeenCalledWith({ nombre: 'Voluntad de hierro', origen: 'Ventaja' });
    });

    it('normaliza referencia de ventaja con prefijo en el nombre al emitir detalle', () => {
        const emitSpy = spyOn(component.ventajaDetallesPorNombre, 'emit');
        component.verDetallesVentajaPorNombre({ nombre: 'Desventaja: Miopia' });
        expect(emitSpy).toHaveBeenCalledWith({ nombre: 'Miopia', origen: 'Desventaja' });
    });

    it('no emite detalle de ventaja cuando el nombre no es válido', () => {
        const emitSpy = spyOn(component.ventajaDetallesPorNombre, 'emit');
        component.verDetallesVentajaPorNombre({ nombre: '   ' });
        expect(emitSpy).not.toHaveBeenCalled();
    });

    it('emite detalle de raza aunque el id llegue como string numerico', () => {
        const emitSpy = spyOn(component.razaDetalles, 'emit');
        component.verDetallesRaza('7' as any);
        expect(emitSpy).toHaveBeenCalledWith(7);
    });

    it('muestra subchips de origen en rasgos/raciales/dotes/idiomas/ventajas', () => {
        component.pj.Tipo_criatura.Nombre = 'Muerto viviente';
        component.pj.Tipo_criatura.Rasgos = [
            { Id: 1, Nombre: 'Inmunidad al veneno', Descripcion: '', Oficial: true },
        ];
        component.pj.Raciales = [
            {
                Id: 10,
                Nombre: 'Sangre antigua',
                Descripcion: '',
                Origen: 'Elfo',
                Dotes: [],
                Habilidades: { Base: [], Custom: [] },
                Caracteristicas: [],
                Salvaciones: [],
                Sortilegas: [],
                Ataques: [],
                Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
                Prerrequisitos: { raza: [], caracteristica: [] },
            } as any,
        ];
        component.pj.Dotes = [{
            Nombre: 'Alerta',
            Descripcion: '',
            Beneficio: '',
            Pagina: 1,
            Extra: '',
            Origen: 'Nivel',
        }];
        component.pj.Idiomas = [{
            Nombre: 'Abisal',
            Descripcion: '',
            Secreto: false,
            Oficial: true,
            Origen: 'Ventaja',
        }];
        component.pj.Ventajas = [{
            Nombre: 'Voluntad de hierro',
            Origen: 'Ventaja',
        }];

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Muerto viviente');
        expect(html).toContain('Elfo');
        expect(html).toContain('Nivel');
        expect(html).toContain('Ventaja');
    });

    it('aplica warm solo a chips de ventajas y mantiene click en preview', () => {
        component.pj.Ventajas = [
            { Nombre: 'Voluntad de hierro', Origen: 'Ventaja' } as any,
            { Nombre: 'Miopia', Origen: 'Desventaja' } as any,
        ];
        const emitSpy = spyOn(component.ventajaDetallesPorNombre, 'emit');
        fixture.detectChanges();

        const chips = fixture.debugElement.queryAll(By.css('mat-chip.chip-clic.sombra3d-sm'));
        const chipVentaja = chips.find((chip) => `${chip.nativeElement.textContent ?? ''}`.includes('Voluntad de hierro'));
        const chipDesventaja = chips.find((chip) => `${chip.nativeElement.textContent ?? ''}`.includes('Miopia'));

        expect(chipVentaja).toBeDefined();
        expect(chipDesventaja).toBeDefined();
        expect(chipVentaja!.nativeElement.classList.contains('warm')).toBeTrue();
        expect(chipDesventaja!.nativeElement.classList.contains('warm')).toBeFalse();

        chipVentaja!.triggerEventHandler('click', new MouseEvent('click'));
        expect(emitSpy).toHaveBeenCalledWith({ nombre: 'Voluntad de hierro', origen: 'Ventaja' });
    });

    it('actualiza raciales visibles cuando cambian tras inicializar el componente', () => {
        fixture.detectChanges();
        component.pj.Raciales = [
            {
                Id: 20,
                Nombre: 'Telepatia',
                Descripcion: '',
                Origen: 'Azotamentes',
                Dotes: [],
                Habilidades: { Base: [], Custom: [] },
                Caracteristicas: [],
                Salvaciones: [],
                Sortilegas: [],
                Ataques: [],
                Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
                Prerrequisitos: { raza: [], caracteristica: [] },
            } as any,
        ];

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Habilidades raciales');
        expect(html).toContain('Telepatia');
        expect(html).toContain('Azotamentes');
    });

    it('renderiza raciales con claves legacy y fallback desde raza', () => {
        fixture.detectChanges();

        component.pj.Raciales = [] as any;
        (component.pj as any).Raza = {
            ...(component.pj as any).Raza,
            Raciales: [{
                i: 31,
                n: 'Olfato',
                o: 'Licantropo',
            }],
        };

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Habilidades raciales');
        expect(html).toContain('Olfato');
        expect(html).toContain('Licantropo');
    });

    it('muestra metadatos de sortilegas en la preview del personaje', () => {
        component.pj.Sortilegas = [
            {
                Conjuro: { Id: 1, Nombre: 'Levitar' },
                Nivel_lanzador: 9,
                Usos_diarios: 'A voluntad',
                Dgs_necesarios: 4,
                Descripcion: 'Innato',
                Origen: 'Azotamentes',
            } as any,
        ];

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Habilidades sortílegas');
        expect(html).toContain('Levitar');
        expect(html).toContain('Nivel de lanzador 9');
        expect(html).toContain('Usos A voluntad');
        expect(html).toContain('DGs min 4');
        expect(html).toContain('Innato');
    });

    it('muestra subchips de lanzador en el chip de clase cuando hay catálogo', () => {
        component.pj.desgloseClases = [{ Nombre: 'Mago', Nivel: 1 }];
        component.clasesCatalogo = [{
            Id: 1,
            Nombre: 'Mago',
            Conjuros: {
                Arcanos: true,
                Divinos: false,
                Psionicos: false,
                Alma: false,
                Dependientes_alineamiento: true,
                Lanzamiento_espontaneo: false,
                Conocidos_total: true,
                Conocidos_nivel_a_nivel: false,
                Dominio: false,
                puede_elegir_especialidad: true,
                Clase_origen: { Id: 0, Nombre: '' },
                Listado: [],
            },
            Mod_salv_conjuros: 'Inteligencia',
            Desglose_niveles: [{
                Nivel: 1,
                Nivel_max_poder_accesible_nivel_lanzadorPsionico: -1,
                Reserva_psionica: 0,
                Conjuros_diarios: {
                    Nivel_0: 0,
                    Nivel_1: 1,
                    Nivel_2: -1,
                },
                Conjuros_conocidos_nivel_a_nivel: {},
                Conjuros_conocidos_total: 3,
                Ataque_base: '+0',
                Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' },
                Aumentos_clase_lanzadora: [],
                Dotes: [],
                Especiales: [],
            }],
        } as any];

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Mago 1');
        expect(html).toContain('Lanzador arcano');
        expect(html).toContain('Salvación (Inteligencia)');
        expect(html).toContain('Niveles diarios 0, 1');
        expect(html).toContain('Conocidos 3');
        expect(html).toContain('Dependiente de alineamiento');
    });

    it('emite claseDetalles al solicitar detalle de clase desde preview', () => {
        const emitSpy = spyOn(component.claseDetalles, 'emit');
        component.verDetallesClase('Mago');
        expect(emitSpy).toHaveBeenCalledWith('Mago');
    });

    it('renderiza familiares y companeros animales cuando existen en el personaje', () => {
        component.pj.Familiares = [
            { Id: 101, Nombre: 'Cuervo sabio' } as any,
        ];
        component.pj.Companeros = [
            { Id: 202, Nombre: 'Lobo fiel' } as any,
        ];

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Familiares y companeros animales');
        expect(html).toContain('Cuervo sabio');
        expect(html).toContain('Lobo fiel');
    });

    it('emite detalle de monstruo al abrir un familiar o companero', () => {
        const emitSpy = spyOn(component.monstruoDetalles, 'emit');
        const monstruo = { Id: 77, Nombre: 'Gato infernal' } as any;

        component.verDetallesMonstruo(monstruo);

        expect(emitSpy).toHaveBeenCalledWith(monstruo);
    });

    it('no muestra origen en legacy sin origen, salvo fallback del rasgo de tipo', () => {
        component.pj.Tipo_criatura.Nombre = 'Humanoide';
        component.pj.Tipo_criatura.Rasgos = [
            { Id: 1, Nombre: 'Rasgo base', Descripcion: '', Oficial: true },
        ];
        component.pj.Raciales = [
            {
                Id: 10,
                Nombre: 'Sangre antigua',
                Descripcion: '',
                Dotes: [],
                Habilidades: { Base: [], Custom: [] },
                Caracteristicas: [],
                Salvaciones: [],
                Sortilegas: [],
                Ataques: [],
                Prerrequisitos_flags: { raza: false, caracteristica_minima: false },
                Prerrequisitos: { raza: [], caracteristica: [] },
            } as any,
        ];
        component.pj.Dotes = [{
            Nombre: 'Alerta',
            Descripcion: '',
            Beneficio: '',
            Pagina: 1,
            Extra: '',
            Origen: '',
        }];
        component.pj.Idiomas = [{
            Nombre: 'Común',
            Descripcion: '',
            Secreto: false,
            Oficial: true,
        }];
        component.pj.Ventajas = ['Voluntad de hierro'];

        fixture.detectChanges();

        const origenes = fixture.debugElement.queryAll(By.css('.chip-origen'))
            .map((el) => `${el.nativeElement.textContent ?? ''}`.trim())
            .filter(Boolean);
        expect(origenes).toContain('Humanoide');
        expect(origenes).not.toContain('Elfo');
        expect(origenes).not.toContain('Nivel');
    });

    it('muestra el estado perdida por clave y oculta chips numéricas', () => {
        component.pj.Fuerza = 0;
        component.pj.ModFuerza = 0;
        component.pj.Constitucion = 13;
        component.pj.ModConstitucion = 1;
        component.pj.Caracteristicas_perdidas = {
            Fuerza: true,
        };

        fixture.detectChanges();

        const chipPerdida = fixture.debugElement.query(By.css('.chip-caracteristica-perdida'));
        expect(chipPerdida).not.toBeNull();
        expect(`${chipPerdida.nativeElement.textContent ?? ''}`).toContain('Perdida');
        expect(`${fixture.nativeElement.textContent ?? ''}`).toContain('Constitución');
        expect(`${fixture.nativeElement.textContent ?? ''}`).toContain('13');
    });

    it('normaliza escuelas prohibidas cuando llegan como string y objeto', () => {
        component.pj.Escuelas_prohibidas = [
            'Evocación',
            { Nombre: 'Ilusión' },
            { Nombre: '  ' } as any,
        ];

        expect(component.getEscuelasProhibidasVisibles()).toEqual(['Evocación', 'Ilusión']);
        expect(component.tieneEscuelasProhibidasVisibles()).toBeTrue();
    });

    it('normaliza dominios cuando llegan como objetos y evita [object Object]', () => {
        (component.pj as any).Dominios = [
            { Nombre: 'Guerra' },
            { nombre: 'Bien' },
            'Magia',
        ];

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(component.getDominiosVisibles()).toEqual(['Guerra', 'Bien', 'Magia']);
        expect(html).toContain('Dominios');
        expect(html).toContain('Guerra');
        expect(html).toContain('Bien');
        expect(html).toContain('Magia');
        expect(html).not.toContain('[object Object]');
    });

    it('preview nuevo personaje muestra iniciativa y carga aunque valgan 0 al confirmar características', () => {
        component.esPreviewNuevoPersonaje = true;
        component.caracteristicasConfirmadas = true;
        component.pj.Raza.Nombre = 'Humano';
        component.pj.ModDestreza = 0;
        component.pj.Iniciativa_varios = [];
        component.pj.Capacidad_carga = {
            Ligera: 0,
            Media: 0,
            Pesada: 0,
        };

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Iniciativa 0');
        expect(html).toContain('Capacidad de carga');
        expect(html).toContain('Ligera 0');
        expect(html).toContain('Media 0');
        expect(html).toContain('Pesada 0');
    });

    it('preview nuevo personaje muestra experiencia y oro en 0 cuando ya aplica NEP', () => {
        component.esPreviewNuevoPersonaje = true;
        component.pj.Raza.Ajuste_nivel = 1;
        component.pj.Experiencia = 0;
        component.pj.Oro_inicial = 0;

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Exp 0');
        expect(html).toContain('Oro inicial');
        expect(html).toContain('0');
    });

    it('calcula iniciativa como ModDestreza + bonos varios', () => {
        component.pj.Raza.Nombre = 'Humano';
        component.pj.ModDestreza = 2;
        component.pj.Iniciativa_varios = [
            { Valor: 3, Origen: 'Ventaja' },
        ];

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(html).toContain('Iniciativa +5');
    });

    it('muestra bloque de salvaciones en preview aunque estén a 0', () => {
        component.esPreviewNuevoPersonaje = true;
        component.pj.Salvaciones.fortaleza.modsClaseos = [];
        component.pj.Salvaciones.reflejos.modsClaseos = [];
        component.pj.Salvaciones.voluntad.modsClaseos = [];
        component.pj.Salvaciones.fortaleza.modsVarios = [];
        component.pj.Salvaciones.reflejos.modsVarios = [];
        component.pj.Salvaciones.voluntad.modsVarios = [];

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(component.tieneBloqueSalvacionesVisible()).toBeTrue();
        expect(component.fortaleza).toBe(0);
        expect(component.reflejos).toBe(0);
        expect(component.voluntad).toBe(0);
        expect(html).toContain('Salvaciones');
    });

    it('muestra bloque de salvaciones en detalle normal aunque estén a 0', () => {
        component.esPreviewNuevoPersonaje = false;
        component.pj.Salvaciones.fortaleza.modsClaseos = [];
        component.pj.Salvaciones.reflejos.modsClaseos = [];
        component.pj.Salvaciones.voluntad.modsClaseos = [];
        component.pj.Salvaciones.fortaleza.modsVarios = [];
        component.pj.Salvaciones.reflejos.modsVarios = [];
        component.pj.Salvaciones.voluntad.modsVarios = [];

        fixture.detectChanges();

        const html = `${fixture.nativeElement.textContent ?? ''}`;
        expect(component.tieneBloqueSalvacionesVisible()).toBeTrue();
        expect(html).toContain('Salvaciones');
    });

    it('actualiza resumen de salvaciones cuando cambian mods tras inicializar', () => {
        component.pj.Salvaciones.fortaleza.modsClaseos = [];
        component.pj.Salvaciones.fortaleza.modsVarios = [];

        fixture.detectChanges();
        expect(component.fortaleza).toBe(0);
        expect(component.fortaleza_varios).toBe(0);

        component.pj.Salvaciones.fortaleza.modsClaseos = [{ valor: 2, origen: 'Clase test' }];
        component.pj.Salvaciones.fortaleza.modsVarios = [{ valor: -1, origen: 'Plantilla test' }];
        fixture.detectChanges();

        expect(component.fortaleza).toBe(2);
        expect(component.fortaleza_varios).toBe(-1);
    });
});
