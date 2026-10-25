import { normalizeEquipoRef, normalizeMaterial, normalizeObjeto, normalizeTextoEquipo } from './equipo-mapper';
import { crearArmaEspecificaApi, crearMaterialApi, crearObjetoApi, crearObjetoGenericoApi } from 'src/testing/equipo-api';

describe('equipo-mapper', () => {
    it('lee la descripción con su origen; lo que no es «srd» cuenta como propia', () => {
        expect(normalizeTextoEquipo({ Descripcion: 'x', Origen_descripcion: 'SRD' }).Origen_descripcion).toBe('srd');
        expect(normalizeTextoEquipo({ Descripcion: 'x' }).Origen_descripcion).toBe('propia');
        expect(normalizeTextoEquipo({ Manual: null }).Manual).toBeNull();
        expect(normalizeTextoEquipo({ Nombre_original: '  ' }).Nombre_original).toBeNull();
    });

    it('una referencia que no viene es null', () => {
        expect(normalizeEquipoRef(null)).toBeNull();
        expect(normalizeEquipoRef({ Id: '3', Nombre: 'Hombros' })).toEqual({ Id: 3, Nombre: 'Hombros' });
    });

    it('lee los efectos y costes de un material', () => {
        const mithril = normalizeMaterial(crearMaterialApi());
        expect(mithril.Efectos.Peso_multiplicador).toBe(0.5);
        expect(mithril.Efectos.Categoria_mas_ligera).toBeTrue();
        expect(mithril.Efectos.Dano_mod).toBeNull();
        expect(mithril.Costes[0]).toEqual({ Aplicacion: { Id: 6, Nombre: 'Armadura ligera' }, Coste: 1000, Coste_por_libra: null, Multiplicador_precio: null, Coste_encantar: null });
    });

    it('lee un objeto con sus modificadores y un genérico con su fórmula', () => {
        const capa = normalizeObjeto(crearObjetoApi());
        expect(capa.Ranura?.Nombre).toBe('Hombros');
        expect(capa.Modificadores[0]).toEqual({
            Objetivo: { Id: 3, Nombre: 'Salvaciones' },
            Tipo_bonificador: { Id: 15, Nombre: 'Resistencia', Apila: false },
            Valor: 1,
            Caracteristica: null,
            Habilidad: null,
            Tipo_dano: null,
            Condicion: null,
        });
        expect(capa.Generico_conjuro).toBeNull();
        const pocion = normalizeObjeto(crearObjetoGenericoApi());
        expect(pocion.Precio).toBeNull();
        expect(pocion.Generico_conjuro).toEqual({ Precio_por_nivel: 50, Nivel_maximo: 3, Usos_componente_caro: 1 });
        expect(pocion.Tipo?.Categoria).toBe('magico');
    });

    it('un arma mágica específica trae su arma base, su mejora y sus aptitudes con la cabeza', () => {
        const espada = normalizeObjeto(crearArmaEspecificaApi({ Bonificador_mejora_2: null }));
        expect(espada.Arma_base).toEqual({ Id: 33, Nombre: 'Espada bastarda' });
        expect(espada.Armadura_base).toBeNull();
        expect(espada.Bonificador_mejora).toBe(2);
        expect(espada.Bonificador_mejora_2).toBeNull();
        expect(espada.Encantamientos).toEqual([{ Id: 1, Nombre: 'Afilada', Descripcion: 'Dobla el rango de amenaza.', Modificador: 1, Coste: 0, Cabeza: 1, Oficial: true }]);
        const capa = normalizeObjeto(crearObjetoApi());
        expect(capa.Arma_base).toBeNull();
        expect(capa.Encantamientos).toEqual([]);
    });
});
