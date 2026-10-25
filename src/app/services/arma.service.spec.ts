import { normalizeArma } from './arma.service';
import { crearArmaApi } from 'src/testing/equipo-api';

describe('normalizeArma (familia 1 de objetos)', () => {
    it('lee el manejo, el daño por tamaño, el crítico estructurado y las propiedades', () => {
        const arma = normalizeArma(crearArmaApi({
            Propiedades: [{ Id: 2, Nombre: 'Desarmar', Descripcion: 'Ayuda a desarmar.', Valor: 2 }],
            Municion: null,
        }));
        expect(arma.Manejo).toEqual({ Id: 2, Nombre: 'Ligera' });
        expect(arma.Dano_pequeno).toBe('1d3');
        expect(arma.Dano_mediano).toBe('1d4');
        expect(arma.Critico).toBe('19-20/x2');
        expect(arma.Critico_rango).toBe(19);
        expect(arma.Critico_multiplicador_2).toBeNull();
        expect(arma.Arrojadiza).toBeTrue();
        expect(arma.Propiedades).toEqual([{ Id: 2, Nombre: 'Desarmar', Descripcion: 'Ayuda a desarmar.', Valor: 2 }]);
        expect(arma.Origen_descripcion).toBe('propia');
    });

    it('un arma sin dado ni crítico se queda con `null` (no «Variable» ni «-»)', () => {
        const arma = normalizeArma(crearArmaApi({ Dano: null, Critico: null, Dano_mediano: null, Manejo: null, Tipo_arma: null }));
        expect(arma.Dano).toBeNull();
        expect(arma.Critico).toBeNull();
        expect(arma.Dano_mediano).toBeNull();
        expect(arma.Manejo).toBeNull();
        expect(arma.Tipo_arma).toBeNull();
    });

    it('ya no lee `Encantamientos` (retirado: las armas mágicas específicas son objetos)', () => {
        const arma = normalizeArma(crearArmaApi({
            Encantamientos: [{ Id: 1, Nombre: 'Afilada', Descripcion: '', Modificador: 1, Coste: 0 }],
        }));
        expect('Encantamientos' in arma).toBeFalse();
    });

    it('precio y peso con decimales (el dardo)', () => {
        const arma = normalizeArma(crearArmaApi({ Nombre: 'Dardo', Precio: 0.5, Peso: 0.5 }));
        expect(arma.Precio).toBe(0.5);
        expect(arma.Peso).toBe(0.5);
    });
});
