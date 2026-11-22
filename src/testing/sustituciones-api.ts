/**
 * Clases con niveles de sustitución con la forma del contrato (`ClaseDetalle.Sustituciones`; catalogos.md, «Los niveles de
 * sustitución»), para los specs: datos de prueba, no los de la base. Las aptitudes y las dotes llevan ids propios.
 */

export const ID_DOTE_ADICIONAL = 901;
export const ID_FIRMEZA_ENANA = 902;
export const ID_FURIA = 903;
export const ID_FURIA_DE_LA_MONTANA = 904;
export const ID_SENTIDO_TRAMPAS = 905;
export const ID_ENEMIGO_PREDILECTO = 906;
export const ID_RASTREAR_SUBTERRANEO = 907;
export const ID_GRUPO_HACHAS = 908;

export const ID_RAZA_ENANO = 2;
export const ID_RAZA_HUMANO = 1;
export const ID_RAZA_ELFO = 3;

const especial = (Id: number, Nombre: string, Nivel: number, extra: { Id_extra?: number | null; Extra?: string; } = {}) => ({
    Especial: { Id, Nombre }, Nivel, Id_extra: extra.Id_extra ?? null, Extra: extra.Extra ?? '', Opcional: 0, Id_interno: 0,
    Id_especial_requerido: 0, Id_dote_requerida: 0,
});

const fila = (Nivel: number, Ataque_base: string, fort: string, ref: string, vol: string, Especiales: any[] = []) => ({
    Nivel, Ataque_base, Salvaciones: { Fortaleza: fort, Reflejos: ref, Voluntad: vol }, Especiales, Dotes: [],
    Conjuros_diarios: {}, Conjuros_conocidos_nivel_a_nivel: {}, Conjuros_conocidos_total: 0,
});

const raza = (Id: number, Nombre: string) => ({
    Tipo: 'raza', Nivel: null, Opcional: 0, Elemento: { Id, Nombre }, Extra: null, Cantidad: null, Texto: null, Frase: Nombre,
    Comprueba_la_api: true,
});

const sinAjustes = { Ataque_base: 0, Fortaleza: 0, Reflejos: 0, Voluntad: 0 };

/** El guerrero (d10, 2 puntos) con su dote adicional en 1 y 2, y el juego «Guerrero enano» (d12) de 1.º y 2.º. */
export function guerreroConSustitucionApi(): any {
    return {
        Id: 3, Nombre: 'Guerrero', Tipo_dado: { Id: 4, Nombre: 'd10' }, Puntos_habilidad: { Id: 2, Valor: 2 },
        Habilidades: { Base: [{ Id_habilidad: 10, Habilidad: 'Trepar', Id_extra: -1, Extra: '' }], Custom: [] },
        Competencias: { Armas: [], Armaduras: [{ Id: 50, Nombre: 'Armadura pesada' }], Grupos_arma: [{ Id: ID_GRUPO_HACHAS, Nombre: 'Hachas' }], Grupos_armadura: [] },
        Conjuros: { Listado: [] },
        Desglose_niveles: [
            fila(1, '+1', '+2', '+0', '+0', [especial(ID_DOTE_ADICIONAL, 'Dote adicional', 1)]),
            fila(2, '+2', '+3', '+0', '+0', [especial(ID_DOTE_ADICIONAL, 'Dote adicional', 2)]),
            fila(3, '+3', '+3', '+1', '+1'),
            fila(4, '+4', '+4', '+1', '+1', [especial(ID_DOTE_ADICIONAL, 'Dote adicional', 4)]),
            fila(5, '+5', '+4', '+1', '+1'),
            fila(6, '+6/+1', '+5', '+2', '+2', [especial(ID_DOTE_ADICIONAL, 'Dote adicional', 6)]),
        ],
        Oficial: true,
        Sustituciones: [{
            Id: 1, Nombre: 'Guerrero enano', Nombre_original: 'Dwarf fighter', Traducido: true, Familia: 'racial',
            Titulo: 'Niveles de sustitución racial del guerrero enano', Clase: { Id: 3, Nombre: 'Guerrero' },
            Tipo_dado: { Id: 5, Nombre: 'd12' }, Puntos_habilidad: null, Retroactivo: false, Descripcion: 'Guerreros enanos.',
            Manual: { Id: 40, Nombre: 'Races of Stone', Pagina: 146 }, Oficial: true,
            Prerrequisitos: [raza(ID_RAZA_ENANO, 'Enano')],
            Habilidades: [
                { Habilidad: { Id: 21, Nombre: 'Saber' }, Extra: { Id: 4, Nombre: 'Dungeons' }, Quita: false },
                { Habilidad: { Id: 10, Nombre: 'Trepar' }, Extra: null, Quita: true },
            ],
            Niveles: [
                {
                    Id: 11, Nivel: 1, Ajustes: sinAjustes, Descripcion: '',
                    Especiales: [{ ...especial(ID_FIRMEZA_ENANA, 'Firmeza enana', 1), Por_nivel_del_juego: false, Extra_del_juego: false }],
                    Dotes: [],
                    Quita: [{ Tipo: 'especial', Elemento: { Id: ID_DOTE_ADICIONAL, Nombre: 'Dote adicional' }, Id_extra: null, Extra: null, Nivel_conjuro: null, Cantidad: null, Alcance: 'nivel', Aplaza_a_nivel: null },
                        { Tipo: 'competencia_grupo_arma', Elemento: { Id: ID_GRUPO_HACHAS, Nombre: 'Hachas' }, Id_extra: null, Extra: null, Nivel_conjuro: null, Cantidad: null, Alcance: 'nivel', Aplaza_a_nivel: null }],
                    Conjuros: [],
                },
                {
                    Id: 12, Nivel: 2, Ajustes: sinAjustes, Descripcion: '',
                    Especiales: [], Dotes: [],
                    Quita: [{ Tipo: 'especial', Elemento: { Id: ID_DOTE_ADICIONAL, Nombre: 'Dote adicional' }, Id_extra: null, Extra: null, Nivel_conjuro: null, Cantidad: null, Alcance: 'nivel', Aplaza_a_nivel: null }],
                    Conjuros: [],
                },
            ],
        }],
    };
}

/**
 * El bárbaro con la furia y el sentido de las trampas (+1 en 3, +2 en 6, +3 en 9), y el juego «Bárbaro de la montaña»: su
 * 1.º cambia la furia por la furia de la montaña (`desde`) y su 3.º retrasa el sentido de las trampas, con −1 al ataque base
 * desde 3.º (un ajuste de prueba).
 */
export function barbaroConSustitucionApi(): any {
    const st = (Nivel: number, n: number) => especial(ID_SENTIDO_TRAMPAS, 'Sentido de las trampas', Nivel, { Id_extra: n, Extra: `+${n}` });
    return {
        Id: 7, Nombre: 'Bárbaro', Tipo_dado: { Id: 5, Nombre: 'd12' }, Puntos_habilidad: { Id: 4, Valor: 4 },
        Habilidades: { Base: [], Custom: [] }, Competencias: { Armas: [], Armaduras: [], Grupos_arma: [], Grupos_armadura: [] },
        Conjuros: { Listado: [] },
        Desglose_niveles: [
            fila(1, '+1', '+2', '+0', '+0', [especial(ID_FURIA, 'Furia', 1, { Id_extra: 1, Extra: '1/día' })]),
            fila(2, '+2', '+3', '+0', '+0'),
            fila(3, '+3', '+3', '+1', '+1', [st(3, 1)]),
            fila(4, '+4', '+4', '+1', '+1', [especial(ID_FURIA, 'Furia', 4, { Id_extra: 2, Extra: '2/día' })]),
            fila(6, '+6/+1', '+5', '+2', '+2', [st(6, 2)]),
            fila(9, '+9/+4', '+6', '+3', '+3', [st(9, 3)]),
        ],
        Oficial: true,
        Sustituciones: [{
            Id: 2, Nombre: 'Bárbaro de la montaña', Nombre_original: null, Traducido: false, Familia: 'racial',
            Titulo: 'Niveles de sustitución racial del bárbaro de la montaña', Clase: { Id: 7, Nombre: 'Bárbaro' },
            Tipo_dado: null, Puntos_habilidad: { Id: 6, Valor: 6 }, Retroactivo: false, Descripcion: '',
            Manual: { Id: 40, Nombre: 'Races of Stone', Pagina: 150 }, Oficial: true,
            Prerrequisitos: [raza(ID_RAZA_ENANO, 'Enano'), {
                Tipo: 'no_verificable', Nivel: null, Opcional: 0, Elemento: null, Extra: null, Cantidad: null,
                Texto: 'Haber vivido en las montañas', Frase: 'Haber vivido en las montañas', Comprueba_la_api: false,
            }],
            Habilidades: [],
            Niveles: [
                {
                    Id: 21, Nivel: 1, Ajustes: sinAjustes, Descripcion: 'La furia de la montaña.',
                    Especiales: [{ ...especial(ID_FURIA_DE_LA_MONTANA, 'Furia de la montaña', 1), Por_nivel_del_juego: false, Extra_del_juego: false }],
                    Dotes: [],
                    Quita: [{ Tipo: 'especial', Elemento: { Id: ID_FURIA, Nombre: 'Furia' }, Id_extra: null, Extra: null, Nivel_conjuro: null, Cantidad: null, Alcance: 'desde', Aplaza_a_nivel: null,
                        Sustituto: { Id: ID_FURIA_DE_LA_MONTANA, Nombre: 'Furia de la montaña' } }],
                    Conjuros: [],
                },
                {
                    Id: 23, Nivel: 3, Ajustes: { ...sinAjustes, Ataque_base: -1 }, Descripcion: '',
                    Especiales: [], Dotes: [],
                    Quita: [{ Tipo: 'especial', Elemento: { Id: ID_SENTIDO_TRAMPAS, Nombre: 'Sentido de las trampas' }, Id_extra: null, Extra: null, Nivel_conjuro: null, Cantidad: null, Alcance: 'retrasa', Aplaza_a_nivel: null }],
                    Conjuros: [],
                },
            ],
        }],
    };
}

/** El explorador con su tercer enemigo predilecto en 10, y el juego «Explorador elfo», cuyo 10.º lo aplaza a 15.º. */
export function exploradorConSustitucionApi(): any {
    const ep = (Nivel: number) => especial(ID_ENEMIGO_PREDILECTO, 'Enemigo predilecto', Nivel);
    return {
        Id: 8, Nombre: 'Explorador', Tipo_dado: { Id: 4, Nombre: 'd8' }, Puntos_habilidad: { Id: 6, Valor: 6 },
        Habilidades: { Base: [], Custom: [] }, Competencias: { Armas: [], Armaduras: [], Grupos_arma: [], Grupos_armadura: [] },
        Conjuros: { Listado: [{ Id: 300, Nombre: 'Enmarañar', Nivel: 1, Espontaneo: false }] },
        Desglose_niveles: [
            fila(1, '+1', '+2', '+2', '+0', [ep(1)]),
            fila(5, '+5', '+4', '+4', '+1', [ep(5)]),
            fila(10, '+10/+5', '+7', '+7', '+3', [ep(10)]),
            fila(15, '+15/+10/+5', '+9', '+9', '+5', [ep(15)]),
        ],
        Oficial: true,
        Sustituciones: [{
            Id: 3, Nombre: 'Explorador elfo', Nombre_original: 'Elf ranger', Traducido: true, Familia: 'racial',
            Titulo: 'Niveles de sustitución racial del explorador elfo', Clase: { Id: 8, Nombre: 'Explorador' },
            Tipo_dado: null, Puntos_habilidad: null, Retroactivo: false, Descripcion: '',
            Manual: { Id: 41, Nombre: 'Races of the Wild', Pagina: 157 }, Oficial: true,
            Prerrequisitos: [raza(ID_RAZA_ELFO, 'Elfo')],
            Habilidades: [],
            Niveles: [{
                Id: 31, Nivel: 10, Ajustes: sinAjustes, Descripcion: '',
                Especiales: [{ ...especial(ID_RASTREAR_SUBTERRANEO, 'Rastreo en el bosque', 10), Por_nivel_del_juego: false, Extra_del_juego: false }],
                Dotes: [],
                Quita: [{ Tipo: 'especial', Elemento: { Id: ID_ENEMIGO_PREDILECTO, Nombre: 'Enemigo predilecto' }, Id_extra: null, Extra: null, Nivel_conjuro: null, Cantidad: null, Alcance: 'aplaza', Aplaza_a_nivel: 15 }],
                Conjuros: [
                    { Conjuro: { Id: 301, Nombre: 'Paso sin rastro' }, Nivel: 1, Quita: false, Conocido: false },
                    { Conjuro: { Id: 300, Nombre: 'Enmarañar' }, Nivel: 1, Quita: true, Conocido: false },
                ],
            }],
        }],
    };
}
