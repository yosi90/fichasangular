import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { IdeasIaError, IdeasIaService } from 'src/app/services/ideas-ia.service';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
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

    beforeEach(async () => {
        servicio = crearServicio();
        servicio.pedir.and.resolveTo({ texto: '«¡Por Moradin!»', proveedor: 'openai', modelo: 'gpt-5.4-mini', recortada: false });
        await TestBed.configureTestingModule({
            declarations: [VozPersonajeComponent],
            providers: [
                { provide: IdeasIaService, useValue: servicio },
                { provide: PlatformSessionService, useValue: { estado$: new BehaviorSubject<any>({ tipo: 'con_sesion' }) } },
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
});
