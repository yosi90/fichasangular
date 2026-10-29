import { normalizarClaseMoldeado, normalizarDoteIncarnum, normalizarPersonajeIncarnum } from 'src/app/services/utils/incarnum-mapper';
import { moldeadoEncarnadoApi, personajeIncarnumApi } from 'src/testing/incarnum';
import {
    datosEsenciaRasgo,
    datosIncarnumDote,
    datosMoldeadoClase,
    filasMoldeado,
    modeloIncarnumFicha,
    textoEsenciaRasgo,
    textoSalvacionFusion,
} from './incarnum';
import { datosVisibles, unirLista } from './ficha';

describe('ficha/incarnum', () => {
    const moldeado = normalizarClaseMoldeado(moldeadoEncarnadoApi())!;

    it('la tabla de moldeado lleva por nivel los chakras que abre y la capacidad que gana', () => {
        const filas = filasMoldeado(moldeado);
        expect(filas.length).toBe(5);
        expect(filas[1]).toEqual({ nivel: 2, fusiones: 3, esencia: 2, vinculos: 1, chakras: 'Corona', capacidad: '' });
        expect(filas[2].capacidad).toBe('+1');
        expect(filas[3].chakras).toBe('Pies, Manos');
        expect(filasMoldeado(null)).toEqual([]);
    });

    it('los datos del moldeado de una clase salen de su `Moldeado`', () => {
        const datos = datosVisibles(datosMoldeadoClase(moldeado));
        expect(datos.map((d) => d.etiqueta)).toEqual(['Nivel de moldeador', 'CD de sus fusiones', 'Fusiones a la vez', 'Lista según el alineamiento']);
        expect(datos[0].valor).toBe('Su nivel de clase');
        expect(datos[1].valor).toBe('10 + mod. de Sabiduría + esencia invertida');
        const nacido = datosVisibles(datosMoldeadoClase({ ...moldeado, Divisor_nivel_moldeador: 2, Caracteristica_cd: null }));
        expect(nacido[0].valor).toBe('La mitad de su nivel de clase');
        expect(nacido.map((d) => d.etiqueta)).not.toContain('CD de sus fusiones');
    });

    it('lo que da una dote de incarnum', () => {
        const esencia = datosVisibles(datosIncarnumDote(normalizarDoteIncarnum({ Esencia_reserva: 1, Esencia_reserva_moldeador: 2 })));
        expect(esencia).toEqual([jasmine.objectContaining({ etiqueta: 'Esencia en la reserva', valor: '+1', detalle: '+2 si ya moldea fusiones' })]);
        const capacidad = datosVisibles(datosIncarnumDote(normalizarDoteIncarnum({ Capacidad: { Bono: 1, Ambito: 'fusiones', Tope_constitucion: true } })));
        expect(capacidad[0]).toEqual(jasmine.objectContaining({ valor: '+1 en una fusión', detalle: 'como mucho, tu mod. de Constitución' }));
        const moldear = datosVisibles(datosIncarnumDote(normalizarDoteIncarnum({ Divisor_nivel_moldeador: 2, Abre_chakra: true })));
        expect(moldear.map((d) => d.valor)).toEqual(['Queda abierto para vincular', 'La mitad de tu nivel de personaje']);
        // Lo que añadió el máster (2026-10-29): la CD de su fusión, la característica que cambia y los PG.
        const nuevos = datosVisibles(datosIncarnumDote(normalizarDoteIncarnum({
            Caracteristica_cd_fusion: { Id: 3, Nombre: 'Constitución' },
            Sustituye_caracteristica: { De: { Id: 3, Nombre: 'Constitución' }, Por: { Id: 5, Nombre: 'Sabiduría' } },
            Pg_por_esencia: 1, Pg_por_dote: { Valor: 2, Tipo: { Id: 37, Nombre: 'Incarnum' } },
        })));
        expect(nuevos.map((d) => d.valor)).toEqual([
            '10 + mod. de Constitución + esencia invertida', 'Sabiduría en vez de Constitución',
            '+1 por punto de tu reserva de esencia, +2 por cada dote de incarnum',
        ]);
        expect(datosVisibles(datosEsenciaRasgo({ Reserva: 0, Receptaculo: false, Habilidades_por_fusiones: [
            { Habilidad: 'Saber', Ids_habilidad: [32], Bono: 1, Fusiones_por_punto: 2 }] })).map((d) => d.valor))
            .toEqual(['+1, y +1 más por cada 2 fusiones moldeadas']);
        expect(datosIncarnumDote(null)).toEqual([]);
    });

    it('la esencia de un racial o un especial', () => {
        expect(datosVisibles(datosEsenciaRasgo({ Reserva: 1, Receptaculo: true, Habilidades_por_fusiones: [] })).map((d) => d.valor)).toEqual(['+1', 'Sí']);
        expect(textoEsenciaRasgo({ Reserva: 0, Receptaculo: true, Habilidades_por_fusiones: [] })).toBe('receptáculo de esencia');
        expect(textoEsenciaRasgo(null)).toBe('');
    });

    it('une con «o» o con «y» y escribe la salvación', () => {
        expect(unirLista(['Corona'], 'o')).toBe('Corona');
        expect(unirLista(['Brazos', 'Manos', 'Pies'], 'o')).toBe('Brazos, Manos o Pies');
        expect(unirLista(['brazos', 'pies'], 'y')).toBe('brazos y pies');
        expect(textoSalvacionFusion({ Salvacion: { Tipo: 'Reflejos', Efecto: 'Mitad' } })).toBe('Reflejos mitad');
        expect(textoSalvacionFusion({ Salvacion: null })).toBeNull();
    });

    describe('la pestaña Incarnum de la ficha', () => {
        const clases = [{ nombre: 'Encarnado', nivel: 5, moldeado }];

        it('con formación: los datos, la rejilla de chakras con la fusión vinculada y los receptáculos', () => {
            const m = modeloIncarnumFicha(normalizarPersonajeIncarnum(personajeIncarnumApi()), clases)!;
            expect(m.conFormacion).toBeTrue();
            expect(m.tituloChakras).toBe('Chakras y formación de partida');
            expect(m.notaChakras).toBe('Fusiones 1 de 4 · vínculos 1 de 1 · esencia 3 de 7');
            expect(m.datos[0]).toEqual(jasmine.objectContaining({ valor: 7, detalle: 'Encarnado 5, Esencia del azurín 1, Dureza azur 1' }));
            expect(m.datos[1]).toEqual(jasmine.objectContaining({ valor: 1, detalle: '2 en fusiones de Encarnado' }));
            expect(m.datos[2]).toEqual(jasmine.objectContaining({ etiqueta: 'Fusiones a la vez · vínculos', valor: '4 · 1' }));
            expect(m.datos[3]).toEqual(jasmine.objectContaining({ etiqueta: 'Nivel de moldeador · CD', valor: '5 · 12 + esencia invertida' }));
            expect(m.chakras.map((c) => c.nombre)).toEqual(['Corona', 'Pies', 'Manos', 'Brazos']);
            expect(m.chakras[0]).toEqual(jasmine.objectContaining({ texto: 'Yelmo de cristal', estado: 'Vinculada · 2 de esencia', vinculada: true, idFusion: 284 }));
            expect(m.chakras[1]).toEqual(jasmine.objectContaining({ texto: 'Libre', estado: 'abierto para vincular' }));
            expect(m.chakras[3]).toEqual(jasmine.objectContaining({ texto: 'Libre', estado: 'vincular a nivel 9' }));
            expect(m.receptaculos).toEqual([{ texto: 'Dureza azur', nota: 'dote · 1 de 1 de esencia' }]);
        });

        it('sin formación: qué chakras puede vincular y desde qué nivel', () => {
            const m = modeloIncarnumFicha(normalizarPersonajeIncarnum(personajeIncarnumApi({ formacion: null })), clases)!;
            expect(m.conFormacion).toBeFalse();
            expect(m.tituloChakras).toBe('Chakras');
            expect(m.chakras[0].texto).toBe('Abierto para vincular');
            expect(m.chakras[3].texto).toBe('Se abre a nivel 9');
            expect(m.receptaculos[0].nota).toBe('dote · hasta 1 de esencia');
        });

        it('quien no moldea (solo una dote de esencia) no tiene rejilla de chakras', () => {
            const m = modeloIncarnumFicha(normalizarPersonajeIncarnum(personajeIncarnumApi({
                puedeMoldear: false, clases: [], formacion: null,
                reserva: { total: 1, desglose: [{ tipo: 'dote', origen: 'Dureza azur', valor: 1 }] },
            })), [])!;
            expect(m.chakras).toEqual([]);
            expect(m.datos.length).toBe(2);
            expect(modeloIncarnumFicha(null)).toBeNull();
        });

        it('enseña los PG de las dotes de incarnum y lo que suma el Saber racial del rilkan', () => {
            const m = modeloIncarnumFicha(normalizarPersonajeIncarnum(personajeIncarnumApi({
                puntosGolpe: [{ tipo: 'dote', origen: 'Corazón de incarnum', valor: 7 }],
                bonosHabilidad: [{ origen: 'Saber racial (rilkan)', habilidad: 'Saber', idsHabilidad: [32], bono: 3, fusiones: 4 }],
            })), [])!;
            const datos = datosVisibles(m.datos);
            expect(datos.find((d) => d.etiqueta === 'Puntos de golpe del incarnum')).toEqual(jasmine.objectContaining({ valor: 7, detalle: 'Corazón de incarnum 7' }));
            expect(datos.find((d) => d.etiqueta === 'Saber')).toEqual(jasmine.objectContaining({ valor: '+3' }));
        });
    });
});
