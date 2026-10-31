import { normalizeRazaApi } from './raza-mapper';
import {
    EdadesDeRaza,
    ajusteRacialDePuntuacion,
    categoriaVacia,
    cuerpoDeEdades,
    edadesDesdeRaza,
    filaDeRazaDesdePrimeraEdad,
    pasoAlEmpezar,
    problemaDeEdades,
} from './raza-edades-formulario';

/** Un dragón homebrew de tres categorías del catálogo (cría, joven y adulto), con años propios. */
function tres(): EdadesDeRaza {
    const cria = { ...categoriaVacia(), id_categoria_edad: 1, edad_desde: 0, edad_hasta: 9, id_tamano: 3, dgs: 4, ajuste_nivel: 3, fuerza: 15, carisma: 9 };
    const joven = { ...categoriaVacia(cria), id_categoria_edad: 3, edad_hasta: 99, dgs: 8, ajuste_nivel: 5 };
    const adulto = { ...categoriaVacia(joven), id_categoria_edad: 6, dgs: 14, ajuste_nivel: null };
    return { categorias: [cria, joven, adulto], pasos: [pasoAlEmpezar(cria), pasoAlEmpezar(joven), pasoAlEmpezar(adulto)] };
}

const CONTEXTO = { ordenTipico: (id: number) => id, lanzaComoClase: false, dgsDeLaRaza: 4 };

describe('raza-edades-formulario', () => {
    it('una categoría nueva empieza donde acaba la anterior, con sus cifras', () => {
        const cria = { ...categoriaVacia(), edad_desde: 0, edad_hasta: 5, dgs: 6, id_tamano: 3 };
        const siguiente = categoriaVacia(cria);
        expect([siguiente.edad_desde, siguiente.edad_hasta, siguiente.dgs, siguiente.id_tamano]).toEqual([6, null, 6, 3]);
        expect(pasoAlEmpezar({ ...cria, id_categoria_edad: 1, ajuste_nivel: 4 })).toEqual(jasmine.objectContaining({ id: null, edad: 0, dgs: 6, ajuste_nivel: 4 }));
    });

    it('lee las edades del GET y las manda igual, con los ids de los pasos', () => {
        const raza = normalizeRazaApi({
            i: 1, n: 'Dragón', Categorias_edad: [{
                Orden: 1, Categoria: { Id: 1, Nombre: 'Cría' }, Edad_desde: 0, Edad_hasta: 5, Tamano: { Id: 3, Nombre: 'Pequeño' },
                Espacio: 2.5, Alcance: 5, Dgs: 4, Ajuste_nivel: null, Vd: 1.5,
                Caracteristicas: { Fuerza: 11, Destreza: 10, Constitucion: 13, Inteligencia: 6, Sabiduria: 11, Carisma: null },
                Velocidades: { Correr: 40, Nadar: 0, Volar: 100, Trepar: 0, Excavar: 0 }, Maniobrabilidad: { Id: 2, Nombre: 'Mala' },
                Ataques_naturales: null, Rd: null, Rc: '11', Re: null, Nivel_lanzamiento: 0, Nivel_lanzador_sortilegas: 1,
                Raciales: [{ Id: 9, Nombre: 'Aliento', Valor: null }], Sortilegas: [{ Conjuro: { Id: 5, Nombre: 'Luz' }, Usos_diarios: '1/día', Descripcion: '' }],
            }],
            Pasos_edad: [{ Id: 70, Edad: 0, Categoria: { Id: 1, Nombre: 'Cría' }, Dgs: 4, Ajuste_nivel: null, Armadura_natural: 3 }],
        });

        const cuerpo = cuerpoDeEdades(edadesDesdeRaza(raza));

        expect(cuerpo.categorias_edad[0]).toEqual(jasmine.objectContaining({
            espacio: 2.5, vd: 1.5, ajuste_nivel: null, carisma: 0, id_maniobrabilidad: 2, ataques_naturales: null,
            resistencia_conjuros: '11', raciales: [{ id_racial: 9, valor: null }],
            sortilegas: [{ id_conjuro: 5, usos_diarios: '1/día', descripcion: '' }],
        }));
        expect(cuerpo.pasos_edad).toEqual([{ id: 70, edad: 0, id_categoria_edad: 1, dgs: 4, ajuste_nivel: null, armadura_natural: 3 }]);
        expect(cuerpoDeEdades({ categorias: [], pasos: [] })).toEqual({ categorias_edad: [], pasos_edad: [] });
    });

    it('las comprobaciones de la API, antes de mandar', () => {
        expect(problemaDeEdades(tres(), CONTEXTO)).toBeNull();
        expect(problemaDeEdades(tres(), { ...CONTEXTO, dgsDeLaRaza: 0 })).toContain('«DG extra» no puede ser 0');

        const casos: [(edades: EdadesDeRaza) => void, string][] = [
            [(e) => e.categorias[1].id_categoria_edad = 1, 'dos veces'],
            [(e) => { e.categorias[0].id_categoria_edad = 4; e.pasos[0].id_categoria_edad = 4; }, 'orden del catálogo'],
            [(e) => e.categorias[1].edad_desde = 9, 'se solapan'],
            [(e) => e.categorias[0].edad_hasta = null, 'se solapan'],
            [(e) => { e.categorias[2].dgs = 7; e.pasos[2].dgs = 7; }, 'no pueden bajar de una categoría'],
            [(e) => e.pasos[1].edad = 5, 'no cae dentro'],
            [(e) => e.pasos.push({ ...e.pasos[0], uid: 'otro' }), 'Dos pasos de edad'],
            [(e) => e.pasos[2].ajuste_nivel = 7, 'su categoría no'],
            [(e) => e.pasos.splice(1, 1), 'no tiene ningún paso'],
            [(e) => e.categorias[2].nivel_lanzamiento = 3, 'Lanzamiento racial'],
            [(e) => e.categorias[0].sortilegas.push({ id_conjuro: 5, nombre: 'Luz', usos_diarios: ' ', descripcion: '' }), 'usos'],
        ];
        casos.forEach(([romper, texto]) => {
            const edades = tres();
            romper(edades);
            expect(problemaDeEdades(edades, CONTEXTO)).withContext(texto).toContain(texto);
        });
        // Sin el catálogo (aún no ha llegado), el orden lo comprueba la API.
        const desordenadas = tres();
        desordenadas.categorias[0].id_categoria_edad = 4;
        desordenadas.pasos[0].id_categoria_edad = 4;
        expect(problemaDeEdades(desordenadas, { ...CONTEXTO, ordenTipico: () => undefined })).toBeNull();
    });

    it('la fila de la raza, desde la primera edad y su primer paso', () => {
        expect(ajusteRacialDePuntuacion(15)).toBe(4);
        expect(ajusteRacialDePuntuacion(9)).toBe(-2);
        expect(ajusteRacialDePuntuacion(0)).toBe(0);
        const edades = tres();
        expect(filaDeRazaDesdePrimeraEdad(edades)).toEqual(jasmine.objectContaining({
            id_tamano: 3, dgs_extra: 4, ajuste_nivel: 3, mod_fue: 4, mod_car: -2, mod_des: 0,
        }));
        expect(filaDeRazaDesdePrimeraEdad({ categorias: [], pasos: [] })).toBeNull();
    });
});
