import { PersonajeService } from 'src/app/services/personaje.service';
import { Personaje } from 'src/app/interfaces/personaje';
import { crearDetalleApi } from 'src/testing/personaje-detalle-api';
import { crearEquipoFichaApi } from 'src/testing/equipo-api';
import { camposPdfEquipo } from './ficha-pdf-equipo';
import { detallesPiezaEquipo, textoEquipadoPieza, textoModificadorEquipo } from './equipo-texto';
import { normalizarDefensa, normalizarDinero, normalizarPiezasEquipo } from './personaje-equipo-mapper';
import { textoDesglose, sumarPartes } from './personaje-totales';

function fichaDeLaApi(cambios: Record<string, any> = {}): Personaje {
    const servicio = new PersonajeService({ currentUser: null } as any, {} as any);
    return (servicio as any).mapApiDetalleToPersonaje(crearDetalleApi(cambios));
}

describe('El equipo de la ficha', () => {
    it('la ficha de la API trae el equipo, la defensa, el peso y el dinero', () => {
        const pj = fichaDeLaApi(crearEquipoFichaApi());
        expect(pj.Ca).toBe(18);
        expect(pj.Equipo?.length).toBe(6);
        expect(pj.Equipo?.[1].armadura?.bonDes).toBeNull();
        expect(pj.Defensa?.toque.total).toBe(11);
        expect(pj.Defensa?.destrezaMaxima).toBe(2);
        expect(pj.PesoEquipo).toBe(96);
        expect(pj.Dinero).toEqual({ po: 12.5, dineroInicial: 240 });
        expect(pj.ModificadoresEquipo?.[1].sumado).toBeFalse();
        expect(sumarPartes(pj.Totales?.salvaciones.fortaleza, 'equipo')).toBe(1);
    });

    it('sin equipo la ficha se queda sin piezas ni dinero', () => {
        const pj = fichaDeLaApi();
        expect(pj.Equipo).toEqual([]);
        expect(pj.Dinero).toBeNull();
        expect(pj.Defensa).toBeNull();
    });

    it('el desglose de la CA dice el tipo de cada bonificador', () => {
        const defensa = normalizarDefensa(crearEquipoFichaApi()['defensa']);
        expect(textoDesglose(defensa?.ca)).toContain('Cota de mallas +5 (armadura)');
        expect(textoDesglose(defensa?.ca)).toContain('Tamaño (Grande) -1');
    });

    it('cada pieza enseña lo suyo', () => {
        const [cota, rodela, daga, flechas, capa, pocion] = normalizarPiezasEquipo(crearEquipoFichaApi()['equipo']);
        expect(detallesPiezaEquipo(cota)).toEqual(['Gran calidad', 'CA +5', 'Destreza máxima +2', 'Penalizador -4', 'Fallo arcano 30%', '80 lb']);
        expect(detallesPiezaEquipo(rodela)).toContain('Destreza máxima Sin límite');
        expect(detallesPiezaEquipo(daga)).toEqual(['+1', 'Afilada', 'Daño 1d6', 'Crítico 17-20/x2', '2 lb']);
        expect(textoEquipadoPieza(daga)).toBe('Equipado (mano principal)');
        expect(textoEquipadoPieza(flechas)).toBe('');
        expect(textoEquipadoPieza(capa)).toBe('Equipado (hombros)');
        expect(detallesPiezaEquipo(pocion)).toEqual(['Curar heridas leves (nivel 1, NL 1)']);
    });

    it('un modificador condicional se enseña con su condición', () => {
        const pj = fichaDeLaApi(crearEquipoFichaApi());
        expect(textoModificadorEquipo(pj.ModificadoresEquipo![0])).toBe('Salvaciones +1 (resistencia)');
        expect(textoModificadorEquipo(pj.ModificadoresEquipo![1])).toBe('Salvaciones +2 (competencia) contra encantamientos');
    });

    it('el dinero sin compra es null', () => {
        expect(normalizarDinero(null)).toBeNull();
        expect(normalizarDinero({ po: '3.5', dineroInicial: 10 })).toEqual({ po: 3.5, dineroInicial: 10 });
    });
});

describe('camposPdfEquipo', () => {
    it('rellena la defensa, la armadura, el escudo, las armas, los objetos, el peso y el dinero', () => {
        const campos = camposPdfEquipo(fichaDeLaApi(crearEquipoFichaApi()));
        expect(campos['ca_toque']).toBe('11');
        expect(campos['ca_desprevenido']).toBe('16');
        expect(campos['ca_armadura']).toBe('5');
        expect(campos['ca_escudo']).toBe('1');
        expect(campos['fallo_arcano']).toBe('35');
        expect(campos['mod_magico_fortaleza']).toBe('1');
        expect(campos['armadura']).toBe('Cota de mallas');
        expect(campos['armadura_max_des']).toBe('+2');
        expect(campos['armadura_desc']).toBe('Gran calidad');
        expect(campos['escudo']).toBe('Rodela');
        expect(campos['escudo_penalizador']).toBe('-1');
        expect(campos['ataque_arma1']).toBe('Daga');
        expect(campos['daño_arma1']).toBe('1d6');
        expect(campos['critico_arma1']).toBe('17-20/x2');
        expect(campos['notas_arma1']).toBe('+1, Afilada');
        expect(campos['objeto1']).toBe('Flechas ×20');
        expect(campos['objeto2']).toBe('Capa de resistencia +1');
        expect(campos['loc_objeto2']).toBe('Hombros');
        expect(campos['objeto3']).toBe('Poción ×2');
        expect(campos['peso_total']).toBe('96');
        expect(campos['monedas_oro']).toBe('12,5');
    });

    it('sin defensa ni equipo no toca la hoja', () => {
        const pj = fichaDeLaApi();
        const campos = camposPdfEquipo({ ...pj, Totales: undefined });
        expect(campos).toEqual({});
    });
});
