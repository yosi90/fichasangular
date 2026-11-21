import { Truco } from 'src/app/interfaces/truco';
import { SelectorTrucosModalComponent } from './selector-trucos-modal.component';

// Los trucos adicionales del compañero (contrato: `personajes.md`, «Los trucos del compañero»).
describe('SelectorTrucosModalComponent', () => {
    const truco = (id: number, nombre: string, cambios: Partial<Truco> = {}): Truco => ({
        Id: id, Nombre: nombre, Nombre_original: '', Traducido: false, Descripcion: '', Manual: { Id: 54, Nombre: 'Manual del jugador 1', Pagina: 83 },
        Cd: 15, Coste: 1, Es_fin: false, Semanas: null, Int_minima: null, Sustituye: null, Semanas_mejora: null, Cd_mejora: null, Trucos: [],
        Requisitos: { Trucos: [], Especiales: [], Tipos: [] }, Oficial: true, ...cambios,
    });
    const ATACA = truco(1, 'Ataca');
    const AYUDA = truco(5, 'Ayuda en ataque', { Requisitos: { Trucos: [{ Id: 1, Nombre: 'Ataca', Opcional: false }], Especiales: [], Tipos: [] } });
    const ATACA_TODAS = truco(2, 'Ataca (todas las criaturas)', { Coste: 2 });
    const LUCHA = truco(7, 'Lucha', { Es_fin: true });
    let component: SelectorTrucosModalComponent;

    beforeEach(() => {
        component = new SelectorTrucosModalComponent();
        component.companero = { Nombre: 'Colmillo', Trucos_adi: 2, Tipo: { Id: 3 }, Caracteristicas: { Inteligencia: 2 }, Trucos: [] } as any;
        component.catalogo = [AYUDA, ATACA, ATACA_TODAS, LUCHA];
    });

    it('sin fines; primero los que puede elegir y después los demás, con su motivo', () => {
        expect(component.opciones.map((o) => [o.truco.Nombre, o.motivo])).toEqual([
            ['Ataca', null], ['Ataca (todas las criaturas)', null], ['Ayuda en ataque', 'Pide saber «Ataca».'],
        ]);
    });

    it('al elegir Ataca se puede elegir Ayuda en ataque; con los dos, completo y se confirma en su orden', () => {
        const emitido = spyOn(component.confirmar, 'emit');
        component.alternar(component.opciones.find((o) => o.truco.Id === 1)!);
        expect(component.puedeConfirmar).toBeFalse();
        component.alternar(component.opciones.find((o) => o.truco.Id === 5)!);
        expect(component.quedan).toBe(0);
        // Ataca (todas las criaturas) ya no cabe.
        expect(component.motivoDe(ATACA_TODAS)).toBe('Cuenta 2 trucos y le quedan 0.');
        component.onConfirmar();
        expect(emitido).toHaveBeenCalledWith([1, 5]);
    });

    it('al quitar Ataca se quita también Ayuda en ataque, que lo pedía', () => {
        component.alternar(component.opciones.find((o) => o.truco.Id === 1)!);
        component.alternar(component.opciones.find((o) => o.truco.Id === 5)!);
        component.alternar(component.opciones.find((o) => o.truco.Id === 1)!);
        expect(component.elegidos).toEqual([]);
    });

    it('con lo que le queda sin ninguno que quepa, se confirma lo elegido; «Omitir» los deja pendientes', () => {
        component.catalogo = [ATACA];
        component.alternar(component.opciones[0]);
        expect(component.quedan).toBe(1);
        expect(component.puedeConfirmar).toBeTrue();
        const omitido = spyOn(component.omitir, 'emit');
        component.onOmitir();
        expect(omitido).toHaveBeenCalled();
    });
});
