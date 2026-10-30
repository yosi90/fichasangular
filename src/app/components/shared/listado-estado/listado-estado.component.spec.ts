import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { ListadoEstadoComponent } from './listado-estado.component';

describe('ListadoEstadoComponent', () => {
    let fixture: ComponentFixture<ListadoEstadoComponent>;
    let componente: ListadoEstadoComponent;
    const raiz = () => fixture.nativeElement as HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ListadoEstadoComponent],
            imports: [MatButtonModule],
        }).compileComponents();
        fixture = TestBed.createComponent(ListadoEstadoComponent);
        componente = fixture.componentInstance;
    });

    function pintar(cambios: Partial<ListadoEstadoComponent>): void {
        Object.entries(cambios).forEach(([clave, valor]) => fixture.componentRef.setInput(clave, valor));
        fixture.detectChanges();
    }

    it('cargando: seis filas de esqueleto con su nombre para el lector', () => {
        pintar({ tipo: 'cargando', etiqueta: 'Cargando razas' });

        const esqueleto = raiz().querySelector('[role="status"]')!;
        expect(esqueleto.getAttribute('aria-label')).toBe('Cargando razas');
        expect(raiz().querySelectorAll('.listado-estado__fila').length).toBe(6);
        expect(raiz().querySelector('.listado-estado__fila--alta')).toBeNull();
    });

    it('con el icono de 40 (el inicio), las filas son las altas', () => {
        pintar({ tipo: 'cargando', icono: 40 });
        expect(raiz().querySelectorAll('.listado-estado__fila--alta').length).toBe(6);
    });

    it('error: el mensaje en un bloque-error y «Reintentar» emite la acción', () => {
        const accion = spyOn(componente.accion, 'emit');
        pintar({ tipo: 'error', mensaje: 'No se pudieron cargar las razas.' });

        const bloque = raiz().querySelector('.bloque-error[role="alert"]')!;
        expect(bloque.textContent).toContain('No se pudieron cargar las razas.');
        const boton = bloque.querySelector('button')!;
        expect(boton.textContent?.trim()).toBe('Reintentar');
        boton.click();
        expect(accion).toHaveBeenCalled();
    });

    it('vacío: el mensaje y, solo si se da, el botón de la acción', () => {
        pintar({ tipo: 'vacio', mensaje: 'Aún no hay razas.' });
        expect(raiz().textContent).toContain('Aún no hay razas.');
        expect(raiz().querySelector('button')).toBeNull();

        pintar({ textoAccion: 'Limpiar filtros', mensaje: 'Ninguna raza cumple los filtros.' });
        expect(raiz().querySelector('button')?.textContent?.trim()).toBe('Limpiar filtros');
    });
});
