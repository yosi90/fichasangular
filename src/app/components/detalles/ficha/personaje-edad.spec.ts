import { Personaje } from 'src/app/interfaces/personaje';
import { aptitudesDeEdadPersonaje, etiquetasTipoPersonaje, lanzamientoRacialPersonaje, razaConCategoriaPersonaje } from './personaje-edad';

describe('ficha: raza por edades y lanzamiento racial', () => {
    function pnjDragon(extra: Partial<Personaje> = {}): Personaje {
        return {
            Raza: { Id: 709, Nombre: 'Dragón rojo' },
            Tipo_criatura: { Id: 7, Nombre: 'Dragón' },
            tipo: 'pnj',
            vd: 18,
            CategoriaEdad: { idPasoEdad: 21, edad: 201, categoria: { Id: 7, Nombre: 'Adulto maduro' }, orden: 7, dgs: 25, ajusteNivel: null, jugable: false, vd: 18 },
            Raciales: [
                { Id: 1, Nombre: 'Arma de aliento', Valor: '14d10', Cd: 28 },
                { Id: 2, Nombre: 'Presencia pavorosa', Valor: "210'", Cd: 26 },
                { Id: 3, Nombre: 'Visión en la oscuridad', Valor: null, Cd: null },
            ],
            LanzamientoRacial: {
                clase: { id: 9, nombre: 'Hechicero' },
                nivelRacial: 9,
                nivelesClase: 0,
                nivel: 9,
                nivelLanzador: 9,
                caracteristicaLanzamiento: 'Carisma',
                modificadorLanzamiento: 4,
                conjurosDiarios: [
                    { nivel: 0, base: 6, adicionales: 0, especialista: 0, dominio: 0, total: 6, puedeLanzar: true },
                    { nivel: 1, base: 6, adicionales: 1, especialista: 0, dominio: 0, total: 7, puedeLanzar: true },
                ],
                listas: [],
            },
            ...extra,
        } as unknown as Personaje;
    }

    it('la raza va con su edad', () => {
        expect(razaConCategoriaPersonaje(pnjDragon())).toBe('Dragón rojo · adulto maduro');
        expect(razaConCategoriaPersonaje(pnjDragon({ CategoriaEdad: null }))).toBe('Dragón rojo');
    });

    it('un PNJ lleva su etiqueta y su VD; un PJ, ninguna', () => {
        expect(etiquetasTipoPersonaje(pnjDragon()).map((e) => e.texto)).toEqual(['PNJ', 'VD 18']);
        expect(etiquetasTipoPersonaje(pnjDragon({ tipo: 'pj' }))).toEqual([]);
    });

    it('«Aptitudes de dragón · adulto maduro»: los raciales con su cifra y su CD, el título desde los datos', () => {
        const aptitudes = aptitudesDeEdadPersonaje(pnjDragon());

        expect(aptitudes?.titulo).toBe('Aptitudes de dragón · adulto maduro');
        expect(aptitudes?.filas).toEqual([
            { nombre: 'Arma de aliento', valor: '14d10 · CD 28' },
            { nombre: 'Presencia pavorosa', valor: "210' · CD 26" },
        ]);
        expect(aptitudesDeEdadPersonaje(pnjDragon({ Raciales: [] }))).toBeNull();
        expect(aptitudesDeEdadPersonaje(pnjDragon({ CategoriaEdad: null }))?.titulo).toBe('Aptitudes con CD');
    });

    it('el lanzamiento racial dice su nivel, de dónde sale y sus conjuros al día', () => {
        const lanzamiento = lanzamientoRacialPersonaje(pnjDragon());

        expect(lanzamiento?.texto).toBe('Lanza conjuros como un hechicero de nivel 9');
        expect(lanzamiento?.detalle).toBe('9 por su edad + 0 niveles de hechicero. Si sube niveles de hechicero, se suman.');
        expect(lanzamiento?.caracteristica).toBe('Carisma (+4)');
        expect(lanzamiento?.conjuros).toEqual([{ nivel: '0', total: 6 }, { nivel: '1.º', total: 7 }]);
        expect(lanzamiento?.listas).toBeNull();
        expect(lanzamientoRacialPersonaje(pnjDragon({ LanzamientoRacial: null }))).toBeNull();
    });

    it('las listas extra se lanzan como arcanas', () => {
        const pj = pnjDragon();
        pj.LanzamientoRacial!.listas = [
            { Tipo: 'clase', Id: 2, Nombre: 'Clérigo' },
            { Tipo: 'dominio', Id: 1, Nombre: 'Aire' },
            { Tipo: 'dominio', Id: 2, Nombre: 'Ley' },
        ];
        expect(lanzamientoRacialPersonaje(pj)?.listas).toBe('También lanza como arcanos los conjuros de clérigo y de los dominios de Aire y Ley.');
    });
});
