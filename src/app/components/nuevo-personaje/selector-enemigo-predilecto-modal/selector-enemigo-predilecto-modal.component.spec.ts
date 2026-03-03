import { SelectorEnemigoPredilectoModalComponent } from './selector-enemigo-predilecto-modal.component';

describe('SelectorEnemigoPredilectoModalComponent', () => {
    let component: SelectorEnemigoPredilectoModalComponent;

    beforeEach(() => {
        component = new SelectorEnemigoPredilectoModalComponent();
        component.enemigos = [
            { Id: 1, Nombre: 'No muerto' },
            { Id: 2, Nombre: 'Dragón' },
        ];
    });

    it('solo confirma cuando hay una selección válida', () => {
        const spy = spyOn(component.confirmar, 'emit');

        component.onConfirmar();
        expect(spy).not.toHaveBeenCalled();

        component.onSeleccionar(2);
        component.onConfirmar();
        expect(spy).toHaveBeenCalledWith(2);
    });

    it('acepta confirmar con Enter cuando la selección es válida', () => {
        const spy = spyOn(component.confirmar, 'emit');

        component.onSeleccionar(1);
        component.onEnter(new KeyboardEvent('keydown', { key: 'Enter' }));

        expect(spy).toHaveBeenCalledWith(1);
    });

    it('filtra por texto y reparte resultados en 3 columnas', () => {
        component.enemigos = [
            { Id: 1, Nombre: 'No muerto' },
            { Id: 2, Nombre: 'Dragón' },
            { Id: 3, Nombre: 'Bestia mágica' },
            { Id: 4, Nombre: 'Gigante' },
        ];
        component.filtroTexto = 'g';

        expect(component.enemigosFiltrados.map((x) => x.Nombre)).toEqual(['Bestia mágica', 'Dragón', 'Gigante']);
        expect(component.enemigosColumnaA.map((x) => x.Nombre)).toEqual(['Bestia mágica']);
        expect(component.enemigosColumnaB.map((x) => x.Nombre)).toEqual(['Dragón']);
        expect(component.enemigosColumnaC.map((x) => x.Nombre)).toEqual(['Gigante']);
    });

    it('preview suma +2 al enemigo repetido según la selección actual', () => {
        component.enemigosYaElegidos = [
            { id: 1, nombre: 'No muerto', bono: 4, veces: 2 },
            { id: 2, nombre: 'Dragón', bono: 2, veces: 1 },
        ];

        component.onSeleccionar(1);

        expect(component.previewEnemigos).toEqual([
            { id: 2, nombre: 'Dragón', bono: 2, veces: 1 },
            { id: 1, nombre: 'No muerto', bono: 6, veces: 3 },
        ]);
    });

    it('preview añade enemigo nuevo con +2 según la selección actual', () => {
        component.enemigosYaElegidos = [{ id: 1, nombre: 'No muerto', bono: 2, veces: 1 }];

        component.onSeleccionar(2);

        expect(component.previewEnemigos).toEqual([
            { id: 2, nombre: 'Dragón', bono: 2, veces: 1 },
            { id: 1, nombre: 'No muerto', bono: 2, veces: 1 },
        ]);
    });
});
