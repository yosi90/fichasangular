import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilaDeLista, ListaDeCatalogoComponent, anadirALista, filasDeIds } from './lista-de-catalogo.component';

@Component({
    standalone: false,
    template: `
        <app-lista-de-catalogo titulo="Rasgos" vacio="Sin rasgos." [filas]="filas" [opciones]="opciones" [repetibles]="repetibles"
            (anadir)="anadido = $event" (quitar)="quitada = $event">
            <ng-template let-fila><span class="campo-de-fila">extra {{fila.id}}</span></ng-template>
        </app-lista-de-catalogo>`,
})
class AnfitrionComponent {
    filas: FilaDeLista[] = [{ id: 9, nombre: '' }, { id: 13, nombre: 'Sin alma' }];
    opciones = [{ id: 9, nombre: 'Visión en la oscuridad' }, { id: 13, nombre: 'Sin alma (ajenos)' }, { id: 20, nombre: 'Volar' }];
    repetibles = false;
    anadido: number | null = null;
    quitada: FilaDeLista | null = null;
}

describe('ListaDeCatalogoComponent', () => {
    let fixture: ComponentFixture<AnfitrionComponent>;
    let lista: ListaDeCatalogoComponent;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ListaDeCatalogoComponent, AnfitrionComponent],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(AnfitrionComponent);
        fixture.detectChanges();
        lista = fixture.debugElement.children[0].componentInstance;
    });

    it('enseña cada fila con su nombre (o el de su opción) y lo que pone quien la usa', () => {
        const texto = fixture.nativeElement.textContent;
        expect(texto).toContain('Rasgos · 2');
        expect(texto).toContain('Visión en la oscuridad');
        expect(texto).toContain('Sin alma');
        expect(fixture.nativeElement.querySelectorAll('.campo-de-fila').length).toBe(2);
    });

    it('el «Añadir…» no ofrece lo que ya está, salvo en una lista repetible', () => {
        expect(lista.excluir).toEqual([9, 13]);
        fixture.componentInstance.repetibles = true;
        fixture.detectChanges();
        expect(lista.excluir).toEqual([]);
    });

    it('avisa de lo que se quita y de lo que se añade', () => {
        fixture.nativeElement.querySelector('.row-action-btn').click();
        expect(fixture.componentInstance.quitada?.id).toBe(9);
        lista.anadir.emit(20);
        expect(fixture.componentInstance.anadido).toBe(20);
    });

    it('vacía, dice que no hay ninguno', () => {
        fixture.componentInstance.filas = [];
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain('Sin rasgos.');
    });

    it('anadirALista: añade la opción si existe y no estaba (o si se repite); filasDeIds, sin las de relleno', () => {
        const opciones = [{ id: 1, nombre: 'Uno' }, { id: 2, nombre: 'Dos' }];
        const filas = anadirALista<FilaDeLista>([{ id: 1 }], opciones, 2, (opcion) => ({ id: opcion.id, nombre: opcion.nombre }));
        expect(filas).toEqual([{ id: 1 }, { id: 2, nombre: 'Dos' }]);
        expect(anadirALista(filas, opciones, 2, (opcion) => ({ id: opcion.id }))).toEqual(filas);
        expect(anadirALista(filas, opciones, 2, (opcion) => ({ id: opcion.id }), true).length).toBe(3);
        expect(anadirALista(filas, opciones, 7, (opcion) => ({ id: opcion.id }))).toEqual(filas);
        expect(filasDeIds([{ Id: 0, Nombre: 'Ninguno' }, { Id: '4', Nombre: 'Celestial' }])).toEqual([{ id: 4, nombre: 'Celestial' }]);
    });
});
