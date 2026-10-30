import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject } from 'rxjs';
import { DadosService } from 'src/app/services/dados.service';
import { EstadoPlataforma, PlatformSessionService } from 'src/app/services/platform-session.service';
import { IconoRolComponent } from '../../shared/icono-rol/icono-rol.component';
import { ListadoCabeceraComponent } from '../../shared/listado-cabecera/listado-cabecera.component';
import { DadosComponent } from './dados.component';

describe('DadosComponent', () => {
    let fixture: ComponentFixture<DadosComponent>;
    let servicio: DadosService;
    let estado$: BehaviorSubject<EstadoPlataforma>;
    /** Lo que sale en cada dado, en orden (1…caras); luego, 1. */
    let caras: number[];

    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const dados = (): HTMLButtonElement[] => Array.from(elemento().querySelectorAll<HTMLButtonElement>('.dados-dado'));
    const dado = (nombre: string): HTMLButtonElement => dados()[['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].indexOf(nombre)];
    const boton = (texto: string): HTMLButtonElement | undefined =>
        Array.from(elemento().querySelectorAll<HTMLButtonElement>('button')).find((b) => b.textContent?.trim() === texto);
    const texto = (selector: string): string => elemento().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    const pulsar = (destino: HTMLElement, key: string): KeyboardEvent => {
        const evento = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        destino.dispatchEvent(evento);
        fixture.detectChanges();
        return evento;
    };
    const clicDerecho = (destino: HTMLElement): MouseEvent => {
        const evento = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
        destino.dispatchEvent(evento);
        fixture.detectChanges();
        return evento;
    };
    const clic = (destino: HTMLElement | undefined): void => {
        destino!.click();
        fixture.detectChanges();
    };

    beforeEach(async () => {
        estado$ = new BehaviorSubject<EstadoPlataforma>({ tipo: 'sin_sesion' });
        await TestBed.configureTestingModule({
            declarations: [DadosComponent, ListadoCabeceraComponent, IconoRolComponent],
            imports: [MatButtonModule, MatIconModule],
            providers: [{ provide: PlatformSessionService, useValue: { estado$ } }],
        }).compileComponents();
        servicio = TestBed.inject(DadosService);
        caras = [];
        servicio.fuente = (destino) => { destino[0] = (caras.shift() ?? 1) - 1; };
        fixture = TestBed.createComponent(DadosComponent);
        fixture.detectChanges();
    });

    it('enseña la cabecera, la fila de siete dados y «Toca un dado» sin nada puesto', () => {
        expect(texto('.listado-cabecera__titulo')).toBe('Dados');
        expect(texto('.listado-cabecera__subtitulo')).toBe('Tiradas sueltas para la mesa');
        expect(elemento().querySelector('.listado-cabecera input')).toBeNull();
        expect(dados().map((b) => b.getAttribute('aria-label'))).toEqual([
            'Añadir un d4', 'Añadir un d6', 'Añadir un d8', 'Añadir un d10', 'Añadir un d12', 'Añadir un d20', 'Añadir un d100',
        ]);
        expect(dado('d100').querySelector('.dados-dado__porcentaje')?.textContent).toBe('%');
        expect(dados().filter((b) => b.querySelector('.dados-dado__porcentaje')).length).toBe(1);
        expect(texto('.dados-tirada__texto')).toBe('Toca un dado');
        expect(elemento().querySelector('.dados-tirada__texto--vacia')).not.toBeNull();
        expect(texto('.dados-historial__vacio')).toBe('Aún no has tirado en esta sesión.');
    });

    it('«Tirar» está desactivado sin dados (también con bonificador) y «Limpiar» solo sale si hay algo', () => {
        expect(boton('Tirar')?.disabled).toBeTrue();
        expect(boton('Limpiar')).toBeUndefined();
        clic(elemento().querySelector<HTMLButtonElement>('[aria-label="Sumar 1 al bonificador"]')!);
        expect(boton('Tirar')?.disabled).toBeTrue();
        expect(boton('Limpiar')).toBeDefined();
        clic(dado('d6'));
        expect(boton('Tirar')?.disabled).toBeFalse();
    });

    it('un clic añade un dado, con su insignia y su nombre accesible; el clic derecho quita uno', () => {
        clic(dado('d6'));
        clic(dado('d6'));
        clic(dado('d20'));
        expect(dado('d6').getAttribute('aria-label')).toBe('d6, llevas 2');
        expect(dado('d6').classList).toContain('dados-dado--puesto');
        expect(dado('d6').querySelector('.dados-dado__insignia')?.textContent?.trim()).toBe('2');
        expect(dado('d4').querySelector('.dados-dado__insignia')).toBeNull();
        expect(texto('.dados-tirada__texto')).toBe('2d6 + 1d20');

        const evento = clicDerecho(dado('d6'));
        expect(evento.defaultPrevented).withContext('no abre el menú del navegador').toBeTrue();
        expect(dado('d6').getAttribute('aria-label')).toBe('d6, llevas 1');
        clicDerecho(dado('d6'));
        clicDerecho(dado('d6'));
        expect(dado('d6').getAttribute('aria-label')).toBe('Añadir un d6');
        expect(dado('d6').classList).not.toContain('dados-dado--puesto');
    });

    it('el bonificador es un paso a paso de − y +, que entra en la expresión', () => {
        const restar = elemento().querySelector<HTMLButtonElement>('[aria-label="Restar 1 al bonificador"]')!;
        const sumar = elemento().querySelector<HTMLButtonElement>('[aria-label="Sumar 1 al bonificador"]')!;
        expect(restar.textContent?.trim()).toBe('−');
        expect(sumar.textContent?.trim()).toBe('+');
        clic(dado('d8'));
        clic(restar);
        expect(texto('.dados-paso__valor')).toBe('−1');
        expect(texto('.dados-tirada__texto')).toBe('1d8 − 1');
        servicio.cambiarBonificador(200);
        fixture.detectChanges();
        expect(texto('.dados-paso__valor')).toBe('+99');
        expect(sumar.disabled).toBeTrue();
    });

    it('«Tirar» enseña el total y el desglose y lo apunta en el historial', () => {
        clic(dado('d6'));
        clic(dado('d6'));
        clic(dado('d20'));
        servicio.cambiarBonificador(3);
        caras = [4, 2, 15];
        clic(boton('Tirar'));
        expect(texto('.dados-resultado__total')).toBe('24');
        expect(texto('.dados-resultado__expresion')).toBe('2d6 + 1d20 + 3');
        expect(texto('.dados-resultado .dados-nota')).toBe('2d6 [4, 2] · 1d20 [15] · +3');
        const filas = elemento().querySelectorAll('.dados-historial__fila');
        expect(filas.length).toBe(1);
        expect(filas[0].querySelector('.dados-historial__expresion')?.textContent).toBe('2d6 + 1d20 + 3');
        expect(filas[0].querySelector('.dados-nota')?.textContent).toMatch(/^\[4, 2\] \[15\] \+3 · \d\d:\d\d$/);
        expect(filas[0].querySelector('.dados-historial__total')?.textContent?.trim()).toBe('24');
    });

    it('un 20 natural va en dorado y un 1 natural en rojo, con su texto', () => {
        clic(dado('d20'));
        caras = [20];
        clic(boton('Tirar'));
        expect(elemento().querySelector('.dados-resultado__total')?.classList).toContain('dados--natural-20');
        expect(texto('.dados-resultado__natural')).toBe('¡20 natural!');
        caras = [1];
        clic(boton('Tirar'));
        expect(elemento().querySelector('.dados-resultado__total')?.classList).toContain('dados--natural-1');
        expect(texto('.dados-resultado__natural')).toBe('1 natural');
        expect(elemento().querySelectorAll('.dados-historial__fila .dados--natural-1').length).toBe(1);
        expect(elemento().querySelectorAll('.dados-historial__fila .dados--natural-20').length).toBe(1);
    });

    it('Intro tira, también con el foco en un dado (sin añadir otro)', () => {
        clic(dado('d4'));
        dado('d4').focus();
        caras = [3];
        const evento = pulsar(dado('d4'), 'Enter');
        expect(evento.defaultPrevented).toBeTrue();
        expect(dado('d4').getAttribute('aria-label')).toBe('d4, llevas 1');
        expect(texto('.dados-resultado__total')).toBe('3');
        expect(servicio.estado.historial.length).toBe(1);
    });

    it('Intro sin dados no tira', () => {
        pulsar(fixture.componentInstance.raiz.nativeElement, 'Enter');
        expect(servicio.estado.historial.length).toBe(0);
    });

    it('Escape limpia la tirada sin cerrar la pestaña; sin nada que limpiar, sigue su camino', () => {
        clic(dado('d12'));
        servicio.cambiarBonificador(2);
        fixture.detectChanges();
        const alDocumento = jasmine.createSpy('keydown en el documento');
        document.addEventListener('keydown', alDocumento);
        try {
            const evento = pulsar(dado('d12'), 'Escape');
            expect(evento.defaultPrevented).toBeTrue();
            expect(alDocumento).not.toHaveBeenCalled();
            expect(texto('.dados-tirada__texto')).toBe('Toca un dado');
            expect(texto('.dados-paso__valor')).toBe('+0');

            pulsar(fixture.componentInstance.raiz.nativeElement, 'Escape');
            expect(alDocumento).toHaveBeenCalledTimes(1);
        } finally {
            document.removeEventListener('keydown', alDocumento);
        }
    });

    it('«Borrar historial» vacía la lista', () => {
        clic(dado('d10'));
        clic(boton('Tirar'));
        clic(boton('Tirar'));
        expect(elemento().querySelectorAll('.dados-historial__fila').length).toBe(2);
        clic(boton('Borrar historial'));
        expect(elemento().querySelectorAll('.dados-historial__fila').length).toBe(0);
        expect(boton('Borrar historial')).toBeUndefined();
    });

    it('al cambiar de cuenta se borran el historial y la tirada', () => {
        estado$.next({ tipo: 'con_sesion', cuenta: { id: 'a', alias: 'a', correo: null } });
        clic(dado('d6'));
        clic(boton('Tirar'));
        expect(elemento().querySelectorAll('.dados-historial__fila').length).toBe(1);
        estado$.next({ tipo: 'con_sesion', cuenta: { id: 'b', alias: 'b', correo: null } });
        fixture.detectChanges();
        expect(elemento().querySelectorAll('.dados-historial__fila').length).toBe(0);
        expect(elemento().querySelector('.dados-resultado')).toBeNull();
        expect(texto('.dados-tirada__texto')).toBe('Toca un dado');
    });

    it('el estado sigue al cerrar y volver a abrir la pestaña', () => {
        clic(dado('d8'));
        clic(boton('Tirar'));
        fixture.destroy();
        fixture = TestBed.createComponent(DadosComponent);
        fixture.detectChanges();
        expect(dado('d8').getAttribute('aria-label')).toBe('d8, llevas 1');
        expect(elemento().querySelectorAll('.dados-historial__fila').length).toBe(1);
    });
});
