import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { BuscadorGlobalService } from 'src/app/services/buscador-global.service';
import { ElementoBusqueda, FuenteBusqueda, textoBuscable } from 'src/app/services/utils/busqueda-global';
import { IconoRolComponent } from '../icono-rol/icono-rol.component';
import { BuscadorGlobalComponent, BuscadorGlobalVentanaService } from './buscador-global.component';

describe('BuscadorGlobalComponent', () => {
    let fixture: ComponentFixture<BuscadorGlobalComponent>;
    let fuentes$: BehaviorSubject<FuenteBusqueda[]>;
    let abiertos: string[];
    let buscador: any;
    let ventana: { cerrar: jasmine.Spy };
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const campo = (): HTMLInputElement => elemento().querySelector('input') as HTMLInputElement;

    const fila = (nombre: string, subtitulo = ''): ElementoBusqueda => ({
        clave: `dote:${nombre}`, tipo: 'dote', nombre, subtitulo, buscable: textoBuscable(nombre, subtitulo), abrir: () => abiertos.push(nombre),
    });

    const escribir = (texto: string) => {
        campo().value = texto;
        campo().dispatchEvent(new Event('input'));
        fixture.detectChanges();
    };

    const tecla = (key: string): KeyboardEvent => {
        const evento = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
        campo().dispatchEvent(evento);
        fixture.detectChanges();
        return evento;
    };

    beforeEach(async () => {
        abiertos = [];
        fuentes$ = new BehaviorSubject<FuenteBusqueda[]>([
            { id: 'razas', titulo: 'Razas', tipo: 'raza', lista: 'razas', femenino: true, estado: 'lista', elementos: [{ ...fila('Azurín', 'Magia del incarnum'), clave: 'raza:1', tipo: 'raza' }] },
            { id: 'dotes', titulo: 'Dotes', tipo: 'dote', lista: 'dotes', femenino: true, estado: 'lista', elementos: ['Dureza azur', 'Enemistad azur', 'Expulsión azur', 'Talento azur', 'Toque azur', 'Visión azur'].map((n) => fila(n, 'Incarnum')) },
            { id: 'monstruos', titulo: 'Monstruos', tipo: 'monstruo', lista: 'monstruos', estado: 'cargando', elementos: [] },
        ]);
        buscador = {
            fuentes$,
            objetos$: new BehaviorSubject<FuenteBusqueda | null>(null),
            cargarFuentes: jasmine.createSpy('cargarFuentes'),
            buscarTexto: jasmine.createSpy('buscarTexto'),
            abrirListado: jasmine.createSpy('abrirListado'),
        };
        ventana = { cerrar: jasmine.createSpy('cerrar') };
        await TestBed.configureTestingModule({
            declarations: [BuscadorGlobalComponent, IconoRolComponent],
            imports: [MatIconModule],
            providers: [
                { provide: BuscadorGlobalService, useValue: buscador },
                { provide: BuscadorGlobalVentanaService, useValue: ventana },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(BuscadorGlobalComponent);
        fixture.detectChanges();
    });

    it('es un diálogo con un combobox y empieza pidiendo dos letras', () => {
        expect(buscador.cargarFuentes).toHaveBeenCalled();
        expect(elemento().querySelector('[role="dialog"]')?.getAttribute('aria-label')).toBe('Buscar en Rol');
        expect(campo().getAttribute('role')).toBe('combobox');
        expect(elemento().querySelector('.buscador-global__estado')?.textContent).toContain('Escribe al menos dos letras');
    });

    it('agrupa por tipo con su número, como mucho cinco por grupo, y ofrece ver el resto', () => {
        escribir('azur');
        const titulos = Array.from(elemento().querySelectorAll('.buscador-global__titulo')).map((t) => t.textContent?.replace(/\s+/g, ''));
        expect(titulos).toEqual(['Razas·1', 'Dotes·6', 'Monstruos']);
        expect(elemento().querySelectorAll('[role="option"]').length).toBe(1 + 5 + 1);
        expect(elemento().querySelector('.buscador-global__ver-todos')?.textContent).toContain('Ver las 6 en el listado de dotes');
        expect(elemento().querySelector('.buscador-global__cargando')?.textContent).toContain('Cargando…');
        expect(buscador.buscarTexto).toHaveBeenCalledWith('azur');
    });

    it('↑ ↓ mueven la opción activa (con aria-activedescendant) e Intro la abre y cierra la ventana', () => {
        escribir('azur');
        expect(campo().getAttribute('aria-activedescendant')).toBe(elemento().querySelectorAll('[role="option"]')[0].id);
        tecla('ArrowDown');
        const segunda = elemento().querySelectorAll('[role="option"]')[1];
        expect(segunda.getAttribute('aria-selected')).toBe('true');
        expect(campo().getAttribute('aria-activedescendant')).toBe(segunda.id);
        tecla('ArrowUp');
        tecla('ArrowUp');
        expect(elemento().querySelectorAll('[role="option"]')[6].getAttribute('aria-selected')).toBe('true');
        tecla('Enter');
        expect(ventana.cerrar).toHaveBeenCalled();
        expect(buscador.abrirListado).toHaveBeenCalledWith('dotes', 'azur');
    });

    it('Intro sobre un resultado abre su detalle', () => {
        escribir('dureza');
        tecla('Enter');
        expect(abiertos).toEqual(['Dureza azur']);
    });

    it('Esc cierra sin que la tecla llegue a las pestañas', () => {
        const fuera = jasmine.createSpy('fuera');
        document.addEventListener('keydown', fuera);
        const evento = tecla('Escape');
        document.removeEventListener('keydown', fuera);
        expect(ventana.cerrar).toHaveBeenCalled();
        expect(evento.defaultPrevented).toBeTrue();
        expect(fuera).not.toHaveBeenCalled();
    });

    it('sin resultados lo dice con lo escrito', () => {
        fuentes$.next(fuentes$.value.filter((f) => f.estado !== 'cargando'));
        escribir('xyz');
        expect(elemento().querySelector('.buscador-global__estado')?.textContent).toContain('Nada con «xyz»');
    });
});
