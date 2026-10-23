import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { IdeasIaError, IdeasIaService } from 'src/app/services/ideas-ia.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { VozPersonajeService } from 'src/app/services/voz-personaje.service';
import Swal from 'sweetalert2';
import { IdeasIaComponent } from './ideas-ia.component';
import { VozPersonajeComponent } from './voz-personaje.component';

function crearServicio() {
    return {
        seleccion: signal(null),
        urlGestion: 'https://qa-social.yosiftware.es/?vista=claves-ia',
        disponibilidad: jasmine.createSpy('disponibilidad').and.resolveTo('lista'),
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
    };
}

const VOZ_GUARDADA = {
    texto: '¡Por Moradin!', proveedor: 'elevenlabs', voz: 'emilio', nombreVoz: 'Emilio', modelo: 'eleven_multilingual_v2',
    tipo: 'audio/mpeg', creada: '2026-10-23T18:30:00Z',
};

function crearServicioDeVoz(guardada: any = null) {
    return {
        guardada: jasmine.createSpy('guardada').and.resolveTo(guardada),
        audio: jasmine.createSpy('audio').and.resolveTo(new Blob(['mp3'], { type: 'audio/mpeg' })),
        generar: jasmine.createSpy('generar').and.resolveTo(VOZ_GUARDADA),
        borrar: jasmine.createSpy('borrar').and.resolveTo(),
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

    it('pide una frase del personaje y la lee en español con su tono', async () => {
        if (!component.puedeHablar)
            pending('Este navegador no tiene speechSynthesis');
        const hablar = spyOn(window.speechSynthesis, 'speak');
        spyOn(window.speechSynthesis, 'cancel');
        await component.queHable();
        expect(servicio.pedir).toHaveBeenCalledWith('frase', jasmine.objectContaining({ nombre: 'Thorin', raza: 'Enano', genero: 'Masculino' }));
        expect(component.frase).toBe('«¡Por Moradin!»');
        const locucion = hablar.calls.mostRecent().args[0] as SpeechSynthesisUtterance;
        expect(locucion.text).toBe('¡Por Moradin!');
        expect(locucion.lang).toBe('es-ES');
        expect(locucion.pitch).toBeCloseTo(0.8, 2);
        expect(component.hablando).toBeTrue();

        component.parar();
        expect(window.speechSynthesis.cancel).toHaveBeenCalled();
        expect(component.hablando).toBeFalse();
    });

    it('sin síntesis de voz enseña solo la frase', async () => {
        (component as any).puedeHablar = false;
        await component.queHable();
        fixture.detectChanges();
        expect(component.hablando).toBeFalse();
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('Tu navegador no puede leerla en voz alta.');
    });

    it('sin clave lista solo enseña el enlace a la gestión', async () => {
        servicio.disponibilidad.and.resolveTo('sin_clave');
        await component.comprobar();
        fixture.detectChanges();
        expect(component.visible).toBeTrue();
        expect((fixture.nativeElement as HTMLElement).textContent).toContain('Tus claves de IA y su tope se gestionan en tu cuenta de Yosiftware');
    });

    describe('su voz guardada', () => {
        it('la oye quien ve la ficha, aunque no tenga clave de IA', async () => {
            voz.guardada.and.resolveTo(VOZ_GUARDADA);
            servicio.disponibilidad.and.resolveTo('sin_sesion');
            await component.comprobar();
            await component.leerGuardada();
            fixture.detectChanges();
            expect(voz.guardada).toHaveBeenCalledWith(7);
            expect(component.visible).toBeTrue();
            expect((fixture.nativeElement as HTMLElement).textContent).toContain('Escuchar su voz');
            expect((fixture.nativeElement as HTMLElement).textContent).toContain('Emilio (ElevenLabs)');
        });

        it('escucharla descarga el audio una vez y lo reproduce', async () => {
            voz.guardada.and.resolveTo(VOZ_GUARDADA);
            await component.leerGuardada();
            const reproducir = spyOn(HTMLMediaElement.prototype, 'play').and.resolveTo();
            await component.escucharGuardada();
            expect(voz.audio).toHaveBeenCalledWith(7);
            expect(reproducir).toHaveBeenCalled();
            expect(component.reproduciendo).toBeTrue();
            await component.escucharGuardada();
            expect(component.reproduciendo).toBeFalse();
            await component.escucharGuardada();
            expect(voz.audio).toHaveBeenCalledTimes(1);
        });

        describe('el dueño, en un solo paso', () => {
            beforeEach(() => {
                component.pj = { ...component.pj, ownerUid: 'sub-del-dueno' } as any;
                localStorage.removeItem('rol.voz.ultima.sub-del-dueno');
                spyOn(HTMLMediaElement.prototype, 'play').and.resolveTo();
            });

            afterEach(() => localStorage.removeItem('rol.voz.ultima.sub-del-dueno'));

            it('escribe la frase a mano y la genera con la voz automática', async () => {
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
                expect(localStorage.getItem('rol.voz.ultima.sub-del-dueno')).toBeNull();
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
                component.vozElegida = component.voces!.find(v => v.voz.id === 'lucia')!;
                component.textoParaGuardar = 'Hola';
                await component.guardarConVoz();
                expect(localStorage.getItem('rol.voz.ultima.sub-del-dueno')).toBe('elevenlabs:lucia');

                component.voces = null;
                await component.abrirPanel();
                expect(component.vozElegida?.voz.id).toBe('lucia');
            });
        });

        it('quien no es el dueño no puede cambiarla', () => {
            component.pj = { ...component.pj, ownerUid: 'otra-cuenta' } as any;
            expect(component.esDueno).toBeFalse();
        });

        it('el dueño la borra', async () => {
            voz.guardada.and.resolveTo(VOZ_GUARDADA);
            await component.leerGuardada();
            await component.borrarVoz();
            expect(voz.borrar).toHaveBeenCalledWith(7);
            expect(component.guardada).toBeNull();
        });
    });
});
