import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ArmaNaturalService } from 'src/app/services/arma-natural.service';
import { FilaArmaNatural } from 'src/app/services/utils/armas-naturales';
import { ListaDeCatalogoComponent } from '../lista-de-catalogo/lista-de-catalogo.component';
import { ArmasNaturalesEditorComponent } from './armas-naturales-editor.component';

const TIPOS = [
    { Id: 9, Nombre: 'Ala', Nombre_plural: 'alas', Primaria: false, Oficial: true },
    { Id: 2, Nombre: 'Garra', Nombre_plural: 'garras', Primaria: true, Oficial: true },
];

describe('ArmasNaturalesEditorComponent', () => {
    let fixture: ComponentFixture<ArmasNaturalesEditorComponent>;
    let editor: ArmasNaturalesEditorComponent;
    let emitidas: FilaArmaNatural[][];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ArmasNaturalesEditorComponent, ListaDeCatalogoComponent],
            providers: [{ provide: ArmaNaturalService, useValue: { getTipos: () => of(TIPOS) } }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(ArmasNaturalesEditorComponent);
        editor = fixture.componentInstance;
        emitidas = [];
        editor.filasChange.subscribe((filas) => emitidas.push(filas));
        fixture.detectChanges();
    });

    it('ofrece los tipos del catálogo y añade uno con su primaria por defecto', () => {
        expect(editor.opciones.map((opcion) => opcion.nombre)).toEqual(['Ala', 'Garra']);
        editor.anadir(9);
        expect(emitidas.length).toBe(1);
        expect(emitidas[0].map((fila) => [fila.id, fila.nombre, fila.cantidad, fila.primaria])).toEqual([[9, 'Ala', 1, false]]);
    });

    it('cambia, quita y, en una plantilla, «le quita las de este tipo» deja la cantidad a 0', () => {
        editor.plantilla = true;
        editor.anadir(2);
        editor.filas = emitidas[0];
        const [garra] = editor.filas;
        editor.cambiarCantidad(garra, '4');
        expect(emitidas[1][0].cantidad).toBe(4);
        editor.cambiarModo(garra, 'quita');
        expect([emitidas[2][0].modo, emitidas[2][0].cantidad]).toEqual(['quita', 0]);
        editor.cambiarForma(garra, 'hibrida');
        expect(emitidas[3][0].forma).toBe('hibrida');
        editor.quitar(garra);
        expect(emitidas[4]).toEqual([]);
    });

    it('avisa de un tipo repetido en la misma forma', () => {
        editor.anadir(2);
        const fila = emitidas[0][0];
        editor.filas = [fila, { ...fila, uid: 'otra' }];
        expect(editor.problemaDe(fila)).toBe('Ese tipo ya está.');
    });
});
