import { filaDeLectura } from './prerrequisito-lectura';

describe('filaDeLectura (los prerrequisitos de la API como filas del editor)', () => {
    it('lee el id, el valor y el opcional de su tipo', () => {
        const fila = filaDeLectura('caracteristica', { Id_caracteristica: 2, Cantidad: 13, Opcional: 1 }, 'u1');
        expect(fila).toEqual(jasmine.objectContaining({ uid: 'u1', tipo: 'caracteristica', id: 2, valor: 13, opcional: 1 }));
        expect(filaDeLectura('nivel_lanzador', { Nivel: 5 }, 'u2').valor).toBe(5);
        expect(filaDeLectura('subtipo_prohibido', { Id_subtipo: 9 }, 'u3').id).toBe(9);
    });

    it('lee el destino de criaturas_compatibles (0: conserva su tipo)', () => {
        const fila = filaDeLectura('criaturas_compatibles', { Id_tipo_compatible: 5, Id_tipo_nuevo: 0 }, 'u');
        expect(fila.id).toBe(5);
        expect(fila.id_destino).toBe(0);
    });

    it('la dote pedida conserva su extra y su Repetido tal cual', () => {
        expect(filaDeLectura('dote', { Id_dote_prerrequisito: 4, Id_extra: -1, Repetido: 0 }, 'u'))
            .toEqual(jasmine.objectContaining({ id: 4, id_extra: -1, repetido: 0 }));
        expect(filaDeLectura('dote', { Id_dote_prerrequisito: 4 }, 'u').id_extra).toBeNull();
        // La de una clase con el arma predilecta de su deidad (el cruzado divino) conserva la marca.
        expect(filaDeLectura('dote', { Id_dote_prerrequisito: 4, Id_extra: -1, Extra_arma_deidad: true }, 'u').arma_deidad).toBeTrue();
        expect(filaDeLectura('dote', { Id_dote_prerrequisito: 4, Id_extra: -1 }, 'u').arma_deidad).toBeUndefined();
    });

    it('la salvación mínima lee la que tiene valor', () => {
        const fila = filaDeLectura('salvacion_minimo', { Fortaleza: 0, Reflejos: 4, Voluntad: 0 }, 'u');
        expect(fila.salvacion_tipo).toBe('reflejos');
        expect(fila.valor).toBe(4);
    });

    it('la habilidad lee «requiere extra» y sus extras pedidos', () => {
        const fila = filaDeLectura('habilidad', {
            Id_habilidad: 30, Cantidad: 8, Requiere_extra: 1, Extras: [{ Id_extra: 12, Extra: 'Arcano' }, { Id_extra: 3, Extra: 'Planos' }],
        }, 'u');
        expect(fila).toEqual(jasmine.objectContaining({ id: 30, valor: 8, requiere_extra: true, extras: [3, 12] }));
    });

    it('el arma 0 de una competencia es el arma elegida (comodín), no una fila sin elegir', () => {
        expect(filaDeLectura('competencia_arma', { Id_arma: 0 }, 'u').comodin).toBeTrue();
        expect(filaDeLectura('competencia_arma', { Id_arma: 7 }, 'u').comodin).toBeUndefined();
        expect(filaDeLectura('competencia_armadura', { Id_armadura: 0 }, 'u').comodin).toBeUndefined();
    });

    it('lee los tipos psiónicos, el género y no_raza (los de la clase)', () => {
        expect(filaDeLectura('genero', { Genero: 2 }, 'u').id).toBe(2);
        expect(filaDeLectura('no_raza', { Id_raza: 5 }, 'u').id).toBe(5);
        expect(filaDeLectura('conocer_poder_psionico', { Id_conjuro: 77 }, 'u').id).toBe(77);
        expect(filaDeLectura('reserva_psionica', { Cantidad: 3 }, 'u').valor).toBe(3);
        expect(filaDeLectura('lanzar_poder_psionico_nivel', { Nivel: 2 }, 'u').valor).toBe(2);
    });

    it('un catálogo puede leer un tipo con otra clave (la clase: Rangos, Cantidad)', () => {
        const claves = { valor: { habilidad: 'Rangos', ataque_base: 'Cantidad', escuela_nivel: 'Cantidad' } };
        expect(filaDeLectura('habilidad', { Id_habilidad: 9, Rangos: 15, Cantidad: 1 }, 'u', claves).valor).toBe(15);
        expect(filaDeLectura('ataque_base', { Cantidad: 6 }, 'u', claves).valor).toBe(6);
        expect(filaDeLectura('escuela_nivel', { Id_escuela: 4, Cantidad: 3 }, 'u', claves))
            .toEqual(jasmine.objectContaining({ id: 4, valor: 3 }));
        // Sin claves propias, la común.
        expect(filaDeLectura('ataque_base', { Ataque_base: 4 }, 'u').valor).toBe(4);
    });
});
