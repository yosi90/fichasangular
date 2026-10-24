import { analizarTextoManual, trozosDeTexto } from './texto-manual';

describe('analizarTextoManual', () => {
    it('un texto sin formato es un único párrafo', () => {
        expect(analizarTextoManual('obtienes un bonificador +2.')).toEqual([
            { tipo: 'parrafo', trozos: [{ texto: 'obtienes un bonificador +2.', cursiva: false, negrita: false }] },
        ]);
    });

    it('separa los párrafos por líneas en blanco y une las líneas de un mismo párrafo', () => {
        const bloques = analizarTextoManual('Primero\nsigue.\n\nSegundo.');
        expect(bloques.map(b => b.tipo)).toEqual(['parrafo', 'parrafo']);
        expect((bloques[0] as any).trozos[0].texto).toBe('Primero sigue.');
    });

    it('reconoce la cursiva y la negrita', () => {
        expect(trozosDeTexto('Un conjuro de *bola de fuego* y **Nivel:** 3')).toEqual([
            { texto: 'Un conjuro de ', cursiva: false, negrita: false },
            { texto: 'bola de fuego', cursiva: true, negrita: false },
            { texto: ' y ', cursiva: false, negrita: false },
            { texto: 'Nivel:', cursiva: false, negrita: true },
            { texto: ' 3', cursiva: false, negrita: false },
        ]);
    });

    it('no toma un asterisco suelto por cursiva', () => {
        expect(trozosDeTexto('2 * 3 = 6')).toEqual([{ texto: '2 * 3 = 6', cursiva: false, negrita: false }]);
    });

    it('convierte las tablas con su cabecera', () => {
        const [tabla] = analizarTextoManual('| Tarea | CD |\n| --- | --- |\n| Activar a ciegas | 25 |\n| Usar una *varita* | 20 |');
        expect(tabla.tipo).toBe('tabla');
        if (tabla.tipo !== 'tabla')
            return;
        expect(tabla.cabecera.map(c => c[0].texto)).toEqual(['Tarea', 'CD']);
        expect(tabla.filas.length).toBe(2);
        expect(tabla.filas[1][0][1]).toEqual({ texto: 'varita', cursiva: true, negrita: false });
    });

    it('reconoce los títulos', () => {
        expect(analizarTextoManual('# Conjuros de clérigo')[0].tipo).toBe('titulo');
    });

    it('reconoce las listas con guion o numeradas', () => {
        const bloques = analizarTextoManual('- una **dote**\n- otra\n\n1. primero\n2. segundo');
        expect(bloques.map(b => b.tipo)).toEqual(['lista', 'lista']);
        const [guiones, numerada] = bloques as { tipo: 'lista'; elementos: { texto: string; negrita: boolean }[][] }[];
        expect(guiones.elementos.length).toBe(2);
        expect(guiones.elementos[0][1]).toEqual(jasmine.objectContaining({ texto: 'dote', negrita: true }));
        expect(numerada.elementos.map(e => e[0].texto)).toEqual(['1. primero', '2. segundo']);
    });

    it('sin texto no hay bloques', () => {
        expect(analizarTextoManual(null)).toEqual([]);
        expect(analizarTextoManual('   ')).toEqual([]);
    });
});
