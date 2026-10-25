import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { IdeasIaError, IdeasIaService } from 'src/app/services/ideas-ia.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { ImagenesPersonajeService } from 'src/app/services/imagenes-personaje.service';
import { VozPersonajeService } from 'src/app/services/voz-personaje.service';
import Swal from 'sweetalert2';
import { TextoManualComponent } from '../texto-manual/texto-manual.component';
import { IdeasIaComponent } from './ideas-ia.component';
import { ImagenesPersonajeComponent } from './imagenes-personaje.component';
import { ModeloIaMenuComponent } from './modelo-ia-menu.component';
import { VozPersonajeComponent } from './voz-personaje.component';

function crearServicio() {
    return {
        seleccion: signal(null),
        urlGestion: 'https://qa-social.yosiftware.es/?vista=claves-ia',
        disponibilidad: jasmine.createSpy('disponibilidad').and.resolveTo('lista'),
        preferido: jasmine.createSpy('preferido').and.resolveTo(null),
        pedir: jasmine.createSpy('pedir').and.resolveTo({ texto: 'Hijo de la forja.', proveedor: 'anthropic', modelo: 'claude-haiku-5-5', recortada: false }),
        modelos: jasmine.createSpy('modelos').and.resolveTo([]),
        voces: jasmine.createSpy('voces').and.resolveTo([
            {
                proveedor: 'elevenlabs', error: null, voces: [
                    { id: 'alice', nombre: 'Alice', idioma: 'en', genero: 'female', muestra: null },
                    { id: 'lucia', nombre: 'Lucía', idioma: 'es', genero: 'female', muestra: null },
                    { id: 'emilio', nombre: 'Emilio', idioma: 'es', genero: 'male', muestra: null },
                ],
            },
        ]),
        olvidarEstado: jasmine.createSpy('olvidarEstado'),
        seleccionImagen: signal<any>(null),
        modelosDeImagen: jasmine.createSpy('modelosDeImagen').and.resolveTo([{ id: 'gpt-image-2', nombre: 'GPT Image 2' }]),
    };
}

const VOZ_GUARDADA = {
    id: 1, texto: '¡Por Moradin!', proveedor: 'elevenlabs', voz: 'emilio', nombreVoz: 'Emilio', modelo: 'eleven_multilingual_v2',
    tipo: 'audio/mpeg', creada: '2026-10-23T18:30:00Z',
};

function crearServicioDeVoz(guardadas: any[] = []) {
    return {
        voces: jasmine.createSpy('voces').and.resolveTo({ voces: guardadas, maximo: 3 }),
        audio: jasmine.createSpy('audio').and.resolveTo(new Blob(['mp3'], { type: 'audio/mpeg' })),
        generar: jasmine.createSpy('generar').and.resolveTo(VOZ_GUARDADA),
        descartar: jasmine.createSpy('descartar').and.resolveTo(),
    };
}

describe('IdeasIaComponent', () => {
    let fixture: ComponentFixture<IdeasIaComponent>;
    let component: IdeasIaComponent;
    let servicio: ReturnType<typeof crearServicio>;
    const estado$ = new BehaviorSubject<any>({ tipo: 'con_sesion' });

    async function montar(disponibilidad: string) {
        servicio = crearServicio();
        servicio.disponibilidad.and.resolveTo(disponibilidad);
        await TestBed.configureTestingModule({
            declarations: [IdeasIaComponent],
            providers: [
                { provide: IdeasIaService, useValue: servicio },
                { provide: PlatformSessionService, useValue: { estado$ } },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(IdeasIaComponent);
        component = fixture.componentInstance;
        component.obtenerDatos = () => ({ nombre: 'Thorin' });
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    const texto = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

    it('con una clave lista enseña los botones de cada idea', async () => {
        await montar('lista');
        const botones = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.ideas-ia__boton')).map(b => b.textContent?.trim());
        expect(botones).toEqual(['Idea de personaje', 'Trasfondo', 'Personalidad']);
        expect(texto()).toContain('Ideas con IA');
    });

    it('sin clave lista enlaza la gestión de la cuenta en lugar de los botones', async () => {
        await montar('sin_clave');
        const enlace = (fixture.nativeElement as HTMLElement).querySelector('.ideas-ia__gestion a') as HTMLAnchorElement;
        expect(enlace.textContent?.trim()).toBe('Tus claves de IA y su tope se gestionan en tu cuenta de Yosiftware');
        expect(enlace.href).toBe('https://qa-social.yosiftware.es/?vista=claves-ia');
        expect((fixture.nativeElement as HTMLElement).querySelector('.ideas-ia__boton')).toBeNull();
    });

    it('sin sesión no ofrece nada', async () => {
        await montar('sin_sesion');
        expect(texto().trim()).toBe('');
    });

    it('enseña la propuesta y, con el campo vacío, la usa tal cual', async () => {
        await montar('lista');
        const emitido = jasmine.createSpy('usar');
        component.usar.subscribe(emitido);
        await component.pedir('trasfondo');
        fixture.detectChanges();
        expect(servicio.pedir).toHaveBeenCalledWith('trasfondo', { nombre: 'Thorin' });
        expect(texto()).toContain('Usar en el trasfondo');
        await component.aplicar();
        expect(emitido).toHaveBeenCalledWith({ tipo: 'trasfondo', texto: 'Hijo de la forja.' });
        expect(component.propuesta).toBeNull();
    });

    it('si ya hay texto pregunta y puede añadir la idea al final', async () => {
        await montar('lista');
        const swal = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false, isDenied: true, isDismissed: false } as any);
        const emitido = jasmine.createSpy('usar');
        component.usar.subscribe(emitido);
        component.textoActual = () => 'Lo que había.';
        await component.pedir('personalidad');
        await component.aplicar();
        expect(swal).toHaveBeenCalled();
        expect(emitido).toHaveBeenCalledWith({ tipo: 'personalidad', texto: 'Lo que había.\n\nHijo de la forja.' });
    });

    it('al cancelar la pregunta no cambia nada', async () => {
        await montar('lista');
        spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false, isDenied: false, isDismissed: true } as any);
        const emitido = jasmine.createSpy('usar');
        component.usar.subscribe(emitido);
        component.textoActual = () => 'Lo que había.';
        await component.pedir('trasfondo');
        await component.aplicar();
        expect(emitido).not.toHaveBeenCalled();
        expect(component.propuesta).not.toBeNull();
    });

    it('«Otra» vuelve a pedir y «Descartar» la quita', async () => {
        await montar('lista');
        await component.pedir('personaje');
        component.otra();
        await fixture.whenStable();
        expect(servicio.pedir).toHaveBeenCalledTimes(2);
        component.descartar();
        expect(component.propuesta).toBeNull();
    });

    it('enseña el error legible y, si es de la clave, el enlace a la gestión', async () => {
        await montar('lista');
        servicio.pedir.and.rejectWith(new IdeasIaError('Tus claves de IA han llegado a su tope de este mes.', 'tope_de_gasto', 429));
        await component.pedir('trasfondo');
        fixture.detectChanges();
        expect(texto()).toContain('Tus claves de IA han llegado a su tope de este mes.');
        expect(texto()).toContain('Ir a tus claves de IA');
        expect(servicio.disponibilidad).toHaveBeenCalledTimes(2);
    });
});

describe('IdeasIaComponent: la respuesta de la IA, como texto (kit 1.58)', () => {
    it('lo que parece HTML se enseña como texto, sin crear elementos', async () => {
        const servicio = crearServicio();
        servicio.pedir.and.resolveTo({
            texto: '<img src="x" onerror="window.__ia=1"> **Valiente** y <script>window.__ia=2</script>',
            proveedor: 'anthropic', modelo: 'claude-haiku-5-5', recortada: false,
        });
        await TestBed.configureTestingModule({
            declarations: [IdeasIaComponent, TextoManualComponent],
            providers: [
                { provide: IdeasIaService, useValue: servicio },
                { provide: PlatformSessionService, useValue: { estado$: new BehaviorSubject<any>({ tipo: 'con_sesion' }) } },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        const fixture = TestBed.createComponent(IdeasIaComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        await fixture.componentInstance.pedir('personaje');
        fixture.detectChanges();
        const propuesta = (fixture.nativeElement as HTMLElement).querySelector('.ideas-ia__propuesta') as HTMLElement;
        expect(propuesta.querySelector('img, script')).toBeNull();
        expect(propuesta.textContent).toContain('<img src="x" onerror="window.__ia=1">');
        expect(propuesta.querySelector('strong')?.textContent).toBe('Valiente');
        expect((window as any).__ia).toBeUndefined();
    });
});

describe('VozPersonajeComponent', () => {
    let fixture: ComponentFixture<VozPersonajeComponent>;
    let component: VozPersonajeComponent;
    let servicio: ReturnType<typeof crearServicio>;
    let voz: ReturnType<typeof crearServicioDeVoz>;

    beforeEach(async () => {
        servicio = crearServicio();
        voz = crearServicioDeVoz();
        servicio.pedir.and.resolveTo({ texto: '«¡Por Moradin!»', proveedor: 'openai', modelo: 'gpt-5.4-mini', recortada: false });
        await TestBed.configureTestingModule({
            declarations: [VozPersonajeComponent],
            providers: [
                { provide: IdeasIaService, useValue: servicio },
                { provide: VozPersonajeService, useValue: voz },
                {
                    provide: PlatformSessionService,
                    useValue: { estado$: new BehaviorSubject<any>({ tipo: 'con_sesion' }), cuenta: { id: 'sub-del-dueno' } },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(VozPersonajeComponent);
        component = fixture.componentInstance;
        component.pj = { Id: 7, Nombre: 'Thorin', Raza: { Nombre: 'Enano' }, Genero: 'Masculino', desgloseClases: [] } as any;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    afterEach(() => fixture.destroy());

    it('sin clave lista solo enseña al dueño el enlace a la gestión', async () => {
        component.pj = { ...component.pj, ownerUid: 'sub-del-dueno' } as any;
        servicio.disponibilidad.and.resolveTo('sin_clave');
        await component.comprobar();
        fixture.detectChanges();
        expect(component.visible).toBeTrue();
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('Tus claves de IA y su tope se gestionan en tu cuenta de Yosiftware');
    });

    describe('sus voces guardadas', () => {
        const OTRA = { ...VOZ_GUARDADA, id: 2, texto: '¡Mi hacha no olvida!' };

        it('las oye quien ve la ficha, aunque no tenga clave de IA', async () => {
            voz.voces.and.resolveTo({ voces: [VOZ_GUARDADA, OTRA], maximo: 3 });
            servicio.disponibilidad.and.resolveTo('sin_sesion');
            await component.comprobar();
            await component.leerGuardadas();
            fixture.detectChanges();
            expect(voz.voces).toHaveBeenCalledWith(7);
            expect(component.visible).toBeTrue();
            const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
            expect(texto).toContain('«¡Por Moradin!» · Emilio (ElevenLabs)');
            expect(texto).toContain('«¡Mi hacha no olvida!»');
            expect(texto).not.toContain('Descartar');
        });

        it('cada una descarga su audio una vez y suena de una en una', async () => {
            voz.voces.and.resolveTo({ voces: [VOZ_GUARDADA, OTRA], maximo: 3 });
            await component.leerGuardadas();
            const reproducir = spyOn(HTMLMediaElement.prototype, 'play').and.resolveTo();
            await component.escuchar(VOZ_GUARDADA as any);
            expect(voz.audio).toHaveBeenCalledWith(7, 1);
            expect(reproducir).toHaveBeenCalled();
            expect(component.sonando).toBe(1);
            await component.escuchar(OTRA as any);
            expect(voz.audio).toHaveBeenCalledWith(7, 2);
            expect(component.sonando).toBe(2);
            await component.escuchar(OTRA as any);
            expect(component.sonando).toBeNull();
            await component.escuchar(VOZ_GUARDADA as any);
            expect(voz.audio).toHaveBeenCalledTimes(2);
        });

        describe('el dueño, en un solo paso', () => {
            beforeEach(() => {
                component.pj = { ...component.pj, ownerUid: 'sub-del-dueno' } as any;
                localStorage.removeItem('rol.voz.ultima.sub-del-dueno');
                spyOn(HTMLMediaElement.prototype, 'play').and.resolveTo();
            });

            afterEach(() => localStorage.removeItem('rol.voz.ultima.sub-del-dueno'));

            it('escribe la frase a mano y la genera con la voz automática', async () => {
                voz.voces.and.resolveTo({ voces: [OTRA], maximo: 3 });
                await component.leerGuardadas();
                expect(component.esDueno).toBeTrue();
                await component.abrirPanel();
                expect(component.textoParaGuardar).toBe('');
                expect(component.vozElegida).toBeNull();
                // Thorin es «Masculino»: una voz en español de hombre.
                expect(component.vozQueSeUsara?.voz.id).toBe('emilio');
                component.textoParaGuardar = '¡Por Moradin!';
                await component.guardarConVoz();
                expect(servicio.pedir).not.toHaveBeenCalled();
                expect(voz.generar).toHaveBeenCalledWith(7, { texto: '¡Por Moradin!', proveedor: 'elevenlabs', voz: 'emilio', nombreVoz: 'Emilio' });
                expect(component.eligiendo).toBeFalse();
                expect(component.guardadas.map(v => v.id)).toEqual([2, 1]);
                expect(localStorage.getItem('rol.voz.ultima.sub-del-dueno')).toBeNull();
            });

            it('con 3 voces no puede generar otra hasta descartar una', async () => {
                const tres = [VOZ_GUARDADA, OTRA, { ...VOZ_GUARDADA, id: 3 }];
                voz.voces.and.resolveTo({ voces: tres, maximo: 3 });
                await component.leerGuardadas();
                await component.comprobar();
                fixture.detectChanges();
                const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
                expect(component.llena).toBeTrue();
                expect(texto).toContain('Tiene 3 voces, el máximo. Descarta una para generar otra.');
                expect(texto).not.toContain('Darle otra voz');
                await component.abrirPanel();
                expect(component.eligiendo).toBeFalse();

                await component.descartar(OTRA as any);
                expect(voz.descartar).toHaveBeenCalledWith(7, 2);
                expect(component.guardadas.map(v => v.id)).toEqual([1, 3]);
                expect(component.llena).toBeFalse();
            });

            it('si la API dice que ya tiene 3, vuelve a leer sus voces', async () => {
                voz.generar.and.rejectWith(new IdeasIaError('Este personaje ya tiene 3 voces.', 'tope_de_voces', 409));
                await component.abrirPanel();
                component.textoParaGuardar = 'Hola';
                voz.voces.calls.reset();
                await component.guardarConVoz();
                expect(component.error?.code).toBe('tope_de_voces');
                expect(voz.voces).toHaveBeenCalledWith(7);
            });

            it('o la genera con IA, avisando de que es de la IA', async () => {
                servicio.pedir.and.resolveTo({ texto: '¡Mi hacha no olvida!', proveedor: 'anthropic', modelo: 'claude-haiku-5-5', recortada: false });
                await component.abrirPanel();
                await component.generarTexto();
                expect(servicio.pedir).toHaveBeenCalledWith('frase', jasmine.objectContaining({ nombre: 'Thorin' }));
                expect(component.textoParaGuardar).toBe('¡Mi hacha no olvida!');
                expect(component.textoDeIa).toBeTrue();
            });

            it('recuerda la última voz elegida a mano', async () => {
                await component.abrirPanel();
                component.vozElegida = component.vocesDisponibles!.find(v => v.voz.id === 'lucia')!;
                component.textoParaGuardar = 'Hola';
                await component.guardarConVoz();
                expect(localStorage.getItem('rol.voz.ultima.sub-del-dueno')).toBe('elevenlabs:lucia');

                component.vocesDisponibles = null;
                await component.abrirPanel();
                expect(component.vozElegida?.voz.id).toBe('lucia');
            });
        });

        it('quien no es el dueño no puede generarla: sin voz guardada no ve nada', async () => {
            component.pj = { ...component.pj, ownerUid: 'otra-cuenta' } as any;
            await component.comprobar();
            fixture.detectChanges();
            expect(component.esDueno).toBeFalse();
            expect(component.visible).toBeFalse();
            const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
            expect(texto).not.toContain('Darle voz');
            expect(texto).not.toContain('Que hable');
        });

        it('el dueño ve «Descartar» en cada una', async () => {
            component.pj = { ...component.pj, ownerUid: 'sub-del-dueno' } as any;
            voz.voces.and.resolveTo({ voces: [VOZ_GUARDADA], maximo: 3 });
            await component.leerGuardadas();
            fixture.detectChanges();
            expect((fixture.nativeElement as HTMLElement).querySelector('[aria-label="Descartar esta voz"]')).not.toBeNull();
        });
    });
});

describe('ImagenesPersonajeComponent', () => {
    let fixture: ComponentFixture<ImagenesPersonajeComponent>;
    let component: ImagenesPersonajeComponent;
    let servicio: ReturnType<typeof crearServicio>;
    let imagenes: any;
    const RETRATO = { tipo: 'retrato', ancho: 512, alto: 512, origen: 'subida', creada: '2026-10-23T20:00:00Z', imagen: '/personajes/7/imagenes/retrato?v=1' };
    const CUERPO_IA = { tipo: 'cuerpo', ancho: 768, alto: 1152, origen: 'ia', creada: '2026-10-23T20:00:00Z', imagen: '/personajes/7/imagenes/cuerpo?v=2' };

    beforeEach(async () => {
        servicio = crearServicio();
        imagenes = {
            imagenes: jasmine.createSpy('imagenes').and.resolveTo({ retrato: RETRATO, cuerpo: null }),
            archivo: jasmine.createSpy('archivo').and.resolveTo(new Blob(['webp'], { type: 'image/webp' })),
            subir: jasmine.createSpy('subir').and.resolveTo(RETRATO),
            generar: jasmine.createSpy('generar').and.resolveTo(CUERPO_IA),
            quitar: jasmine.createSpy('quitar').and.resolveTo(),
        };
        await TestBed.configureTestingModule({
            declarations: [ImagenesPersonajeComponent],
            providers: [
                { provide: IdeasIaService, useValue: servicio },
                { provide: ImagenesPersonajeService, useValue: imagenes },
                {
                    provide: PlatformSessionService,
                    useValue: { estado$: new BehaviorSubject<any>({ tipo: 'con_sesion' }), cuenta: { id: 'sub-del-dueno' } },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(ImagenesPersonajeComponent);
        component = fixture.componentInstance;
        component.pj = { Id: 7, Nombre: 'Thorin', Raza: { Nombre: 'Enano' }, Genero: 'Masculino', desgloseClases: [] } as any;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    afterEach(() => fixture.destroy());

    it('quien ve la ficha ve sus imágenes, sin poder cambiarlas', async () => {
        fixture.detectChanges();
        expect(imagenes.imagenes).toHaveBeenCalledWith(7);
        expect(imagenes.archivo).toHaveBeenCalledOnceWith(RETRATO.imagen);
        expect(component.urls.retrato).toMatch(/^blob:/);
        expect(component.esDueno).toBeFalse();
        expect(component.visible).toBeTrue();
        const html = fixture.nativeElement as HTMLElement;
        expect(html.querySelector('img')?.getAttribute('alt')).toBe('Retrato de Thorin');
        expect(html.textContent).not.toContain('Subir');
    });

    it('sin imágenes y sin ser el dueño, no se enseña', async () => {
        imagenes.imagenes.and.resolveTo({ retrato: null, cuerpo: null });
        await component.leer();
        expect(component.visible).toBeFalse();
    });

    describe('el dueño', () => {
        beforeEach(() => {
            component.pj = { ...component.pj, ownerUid: 'sub-del-dueno' } as any;
            fixture.detectChanges();
        });

        it('sube una imagen y la ve', async () => {
            const archivo = new File(['png'], 'thorin.png', { type: 'image/png' });
            await component.subir('retrato', { target: { files: [archivo], value: 'thorin.png' } } as any);
            expect(imagenes.subir).toHaveBeenCalledWith(7, 'retrato', archivo, 'thorin.png');
            expect(component.urls.retrato).toMatch(/^blob:/);
            expect(component.ocupado).toBeNull();
        });

        it('no manda las de más de 10 MB', async () => {
            const grande = { size: 11 * 1024 * 1024, name: 'enorme.png' };
            await component.subir('cuerpo', { target: { files: [grande], value: 'x' } } as any);
            expect(imagenes.subir).not.toHaveBeenCalled();
            expect(component.error?.message).toBe('La imagen no puede pasar de 10 MB.');
        });

        it('la genera con IA, con sus detalles y el modelo elegido', async () => {
            servicio.seleccionImagen.set({ proveedor: 'openai', modelo: 'gpt-image-2', nombre: 'GPT Image 2' });
            component.abrirIa('cuerpo');
            component.detalles = '  Barba pelirroja  ';
            await component.generar();
            expect(imagenes.generar).toHaveBeenCalledWith(7, 'cuerpo', {
                datos: jasmine.objectContaining({ raza: 'Enano', genero: 'Masculino' }),
                detalles: 'Barba pelirroja',
                modelo: 'gpt-image-2',
            });
            expect(component.imagenes.cuerpo?.origen).toBe('ia');
            expect(component.conIa).toBeNull();
        });

        it('pregunta antes de sustituir una que ya tiene, y si cancela no gasta', async () => {
            const fuego = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: false } as any);
            component.abrirIa('retrato');
            await component.generar();
            expect(fuego).toHaveBeenCalled();
            expect(imagenes.generar).not.toHaveBeenCalled();
        });

        it('la quita tras confirmarlo', async () => {
            spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
            await component.quitar('retrato');
            expect(imagenes.quitar).toHaveBeenCalledWith(7, 'retrato');
            expect(component.imagenes.retrato).toBeNull();
            expect(component.urls.retrato).toBeUndefined();
        });

        it('un error de la clave se enseña con el enlace a la gestión', async () => {
            imagenes.generar.and.rejectWith(new IdeasIaError('Tus claves de IA han llegado a su tope.', 'tope_de_gasto', 429));
            component.abrirIa('cuerpo');
            await component.generar();
            fixture.detectChanges();
            const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
            expect(texto).toContain('Tus claves de IA han llegado a su tope.');
            expect(texto).toContain('Ir a tus claves de IA');
            expect(component.conIa).toBe('cuerpo');
        });
    });
});

describe('ModeloIaMenuComponent', () => {
    it('con uso «imagen» ofrece los modelos de imagen y guarda su propia elección', async () => {
        const servicio = crearServicio();
        await TestBed.configureTestingModule({
            declarations: [ModeloIaMenuComponent],
            providers: [{ provide: IdeasIaService, useValue: servicio }],
            schemas: [NO_ERRORS_SCHEMA],
        }).overrideTemplate(ModeloIaMenuComponent, '').compileComponents();
        const menu = TestBed.createComponent(ModeloIaMenuComponent).componentInstance;
        menu.uso = 'imagen';
        await menu.cargar();
        expect(servicio.modelos).not.toHaveBeenCalled();
        expect(menu.modelos?.[0].modelos.map(m => m.id)).toEqual(['gpt-image-2']);
        menu.elegir({ proveedor: 'openai', modelo: 'gpt-image-2', nombre: 'GPT Image 2' });
        expect(servicio.seleccionImagen()?.modelo).toBe('gpt-image-2');
        expect(servicio.seleccion()).toBeNull();
        expect(menu.descripcion).toBe('Modelo de imagen: GPT Image 2');
    });
});
