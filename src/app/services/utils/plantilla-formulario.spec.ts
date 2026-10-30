import { plantillaApiDeEjemplo } from 'src/testing/plantilla-api';
import { getPrerequisiteDefinition } from 'src/app/components/shared/prerrequisito-editor/prerrequisito-editor.registry';
import { normalizePlantillaApi } from './plantilla-mapper';
import {
    CAMPOS_PLANTILLA,
    PASOS_PLANTILLA,
    TEXTO_SIN_CAMBIO,
    TIPOS_PRERREQUISITO_PLANTILLA,
    camposCambiados,
    campoDeErrorApi,
    construirPlantillaRequest,
    filasDesdePrerrequisitosPlantilla,
    firmaFilaPrerrequisito,
    listasDesdePlantilla,
    listasPlantillaVacias,
    prerrequisitosPlantillaDesdeFilas,
    valorDesdePlantilla,
    valorPlantillaNueva,
} from './plantilla-formulario';

describe('plantilla-formulario', () => {
    let contador = 0;
    const uid = () => `fila_${++contador}`;

    it('construye el cuerpo de POST /plantillas/add según el contrato', () => {
        const valor = {
            ...valorPlantillaNueva(),
            nombre: '  Criatura celestial ',
            descripcion: 'Texto propio.',
            id_manual: 4,
            pagina: 31,
            id_tamano: 0,
            fuerza: 2,
            ca: '',
            reduccion_dano: '5/mágico',
            entorno: '  ',
            vd: 'Igual que la criatura base +1',
            nombre_original: 'Celestial creature',
            traducido: true,
            oficial: true,
            mult_dg_lic: 4,
            iniciativa: null as unknown as number,
        };
        const listas = {
            ...listasPlantillaVacias(),
            raciales: [{ uid: 'a', id: 70, nombre: 'Olfato', dg: 0 }],
            dotes: [{ uid: 'b', id: 30, nombre: 'Soltura', dg: 3, id_extra: -1 }, { uid: 'c', id: 31, nombre: 'Otra', dg: 1, id_extra: 5 }],
            habilidades: [{ uid: 'd', id: 12, nombre: 'Avistar', rangos: 4, id_extra: -1, varios: '' }],
            sortilegas: [{ uid: 'e', id: 40, nombre: 'Luz', dg: 1, nivel_lanzador: 5, usos_diarios: ' 3/día ' }],
            subtipos: [{ uid: 'f', id: 9, nombre: 'B' }, { uid: 'g', id: 3, nombre: 'A' }, { uid: 'h', id: 9, nombre: 'B' }],
        };

        const cuerpo = construirPlantillaRequest(valor, listas);

        expect(cuerpo.plantilla.nombre).toBe('Criatura celestial');
        expect(cuerpo.plantilla.id_tamano).toBe(0);
        expect(cuerpo.plantilla.iniciativa).toBe(0);
        expect(cuerpo.plantilla.fuerza).toBe(2);
        // Los textos que el alta exige van con el relleno de «no cambia»; los opcionales vacíos, a null.
        expect(cuerpo.plantilla.ca).toBe(TEXTO_SIN_CAMBIO);
        expect(cuerpo.plantilla.velocidades).toBe(TEXTO_SIN_CAMBIO);
        expect(cuerpo.plantilla.reduccion_dano).toBe('5/mágico');
        expect(cuerpo.plantilla.entorno).toBeNull();
        expect(cuerpo.plantilla.organizacion).toBeNull();
        expect(cuerpo.plantilla.vd).toBe('Igual que la criatura base +1');
        expect(cuerpo.plantilla.nombre_original).toBe('Celestial creature');
        expect(cuerpo.plantilla.traducido).toBeTrue();
        expect(cuerpo.plantilla.oficial).toBeTrue();
        expect(cuerpo.plantilla.nacimiento).toBeFalse();
        expect(cuerpo.plantilla.act_dg).toBeFalse();
        // Sin «Añade DG de otra criatura», los DG de licantropía van a 0 aunque el campo tenga algo.
        expect(cuerpo.plantilla.mult_dg_lic).toBe(0);
        expect(cuerpo.plantilla.id_tipo_criatura_dg_lic).toBe(0);
        expect('con_dg_lic' in cuerpo.plantilla).toBeFalse();

        expect(cuerpo.raciales).toEqual([{ id_racial: 70, dg: 1 }]);
        expect(cuerpo.ataquesEspeciales).toEqual([]);
        expect(cuerpo.dotes).toEqual([{ id_dote: 30, dg: 3 }, { id_dote: 31, id_extra: 5, dg: 1 }]);
        expect(cuerpo.habilidades).toEqual([{ id_habilidad: 12, rangos: 4 }]);
        expect(cuerpo.sortilegas).toEqual([{ id_conjuro: 40, nivel_lanzador: 5, usos_diarios: '3/día', dg: 1 }]);
        expect(cuerpo.subtipos).toEqual([3, 9]);
        expect(Object.keys(cuerpo.prerrequisitos).sort()).toEqual([...TIPOS_PRERREQUISITO_PLANTILLA].sort());
    });

    it('manda los DG de licantropía cuando está marcado «Añade DG de otra criatura»', () => {
        const cuerpo = construirPlantillaRequest(
            { ...valorPlantillaNueva(), con_dg_lic: true, id_tipo_dado_lic: 3, mult_dg_lic: 2, suma_dg_lic: 1, id_tipo_criatura_dg_lic: 2 },
            listasPlantillaVacias(),
        );
        expect(cuerpo.plantilla).toEqual(jasmine.objectContaining({ id_tipo_dado_lic: 3, mult_dg_lic: 2, suma_dg_lic: 1, id_tipo_criatura_dg_lic: 2 }));
    });

    it('escribe los requisitos en minúscula, con su opcional, y deja fuera los incompletos', () => {
        const fila = (tipo: any, cambios: any) => ({ ...getPrerequisiteDefinition(tipo).createDefaultRow(), ...cambios });
        const prerrequisitos = prerrequisitosPlantillaDesdeFilas([
            fila('criaturas_compatibles', { id: 5, id_destino: 0, opcional: 1 }),
            fila('tamano_minimo', { id: 6 }),
            fila('dg', { valor: 10 }),
            fila('subtipo', { id: 4 }),
            fila('subtipo_prohibido', { id: 14 }),
            fila('nivel_lanzador', { valor: 11 }),
            fila('dote', { id: 99 }),
            fila('caracteristica', { id: 4, valor: 3 }),
            fila('alineamiento_requerido', { id: 2 }),
            fila('actitud_prohibido', { id: 6 }),
            fila('tamano_maximo', { id: 0 }),
        ]);

        expect(prerrequisitos.criaturas_compatibles).toEqual([{ id_tipo_comp: 5, id_tipo_nuevo: 0, opcional: 1 }]);
        expect(prerrequisitos.tamano_minimo).toEqual([{ id_tamano: 6, opcional: 0 }]);
        expect(prerrequisitos.tamano_maximo).toEqual([]);
        expect(prerrequisitos.dg).toEqual([{ cantidad: 10, opcional: 0 }]);
        expect(prerrequisitos.subtipo).toEqual([{ id_subtipo: 4, opcional: 0 }]);
        expect(prerrequisitos.subtipo_prohibido).toEqual([{ id_subtipo: 14, opcional: 0 }]);
        expect(prerrequisitos.nivel_lanzador).toEqual([{ nivel: 11, opcional: 0 }]);
        expect(prerrequisitos.dote).toEqual([{ id_dote: 99, opcional: 0 }]);
        expect(prerrequisitos.caracteristica).toEqual([{ id_caracteristica: 4, cantidad: 3, opcional: 0 }]);
        expect(prerrequisitos.alineamiento_requerido).toEqual([{ id_alineamiento: 2, opcional: 0 }]);
        expect(prerrequisitos.actitud_prohibido).toEqual([{ id_actitud: 6, opcional: 0 }]);
        expect(prerrequisitos.actitud_requerido).toEqual([]);
    });

    it('rellena el formulario desde GET /plantillas/<id> y vuelve a dar el mismo cuerpo, sin cambios', () => {
        const plantilla = normalizePlantillaApi(plantillaApiDeEjemplo());
        const valor = valorDesdePlantilla(plantilla);
        const listas = listasDesdePlantilla(plantilla, uid);

        expect(valor).toEqual(jasmine.objectContaining({
            nombre: 'Licántropo de prueba', id_manual: 4, pagina: 175, id_tamano: 0, id_mod_tam: 1, id_mod_dg: 0, id_tipo_dado: 3,
            nacimiento: true, oficial: true, traducido: true, nombre_original: 'Test lycanthrope', con_dg_lic: true, mult_dg_lic: 2,
            id_tipo_criatura_dg_lic: 2, constitucion: 4, min_inteligencia: 3, ca: '+2 armadura natural', ataques: '', id_alineamiento: 7,
            entorno: 'Igual que la criatura base', organizacion: '', vd: 'Igual que la criatura base +2', puntos_hab_suma: 2,
        }));
        expect(listas.raciales.map((f) => [f.id, f.dg])).toEqual([[70, 1]]);
        expect(listas.ataquesEspeciales.map((f) => [f.id, f.dg])).toEqual([[71, 2]]);
        expect(listas.dotes.map((f) => [f.id, f.dg, f.id_extra])).toEqual([[30, 3, 5]]);
        expect(listas.habilidades.map((f) => [f.id, f.rangos, f.id_extra, f.varios])).toEqual([[12, 4, -1, 'Con el olfato']]);
        expect(listas.sortilegas.map((f) => [f.id, f.nivel_lanzador, f.usos_diarios])).toEqual([[40, 5, '1/día']]);
        expect(listas.subtipos.map((f) => f.id)).toEqual([9]);
        expect(listas.prerrequisitos.map((f) => f.tipo)).toEqual(['criaturas_compatibles', 'criaturas_compatibles', 'tamano_minimo', 'subtipo_prohibido', 'caracteristica']);

        const cuerpo = construirPlantillaRequest(valor, listas);
        expect(cuerpo.plantilla.ataques).toBe(TEXTO_SIN_CAMBIO);
        expect(cuerpo.prerrequisitos.criaturas_compatibles).toEqual([
            { id_tipo_comp: 5, id_tipo_nuevo: 0, opcional: 1 },
            { id_tipo_comp: 6, id_tipo_nuevo: 0, opcional: 1 },
        ]);
        const otra = construirPlantillaRequest(valorDesdePlantilla(plantilla), listasDesdePlantilla(plantilla, uid));
        expect(camposCambiados(cuerpo, otra, true, true)).toEqual([]);
    });

    it('dice qué campos cambian, en el orden de los campos, sin depender del orden de las filas', () => {
        const plantilla = normalizePlantillaApi(plantillaApiDeEjemplo());
        const antes = construirPlantillaRequest(valorDesdePlantilla(plantilla), listasDesdePlantilla(plantilla, uid));
        const listas = listasDesdePlantilla(plantilla, uid);
        listas.prerrequisitos = [...listas.prerrequisitos].reverse();
        listas.raciales = [...listas.raciales, { uid: 'n', id: 80, nombre: 'Nuevo', dg: 1 }];
        const ahora = construirPlantillaRequest({ ...valorDesdePlantilla(plantilla), nombre: 'Otro', fortaleza: 4, tesoro: 'Doble' }, listas);

        expect(camposCambiados(antes, ahora, true, true)).toEqual(['nombre', 'fortaleza', 'raciales', 'tesoro']);
        expect(camposCambiados(antes, ahora, true, true).map((campo) => CAMPOS_PLANTILLA[campo].paso)).toEqual([0, 1, 2, 4]);
    });

    it('apagar «Añade DG de otra criatura» cuenta como un cambio, no como cuatro', () => {
        const plantilla = normalizePlantillaApi(plantillaApiDeEjemplo());
        const antes = construirPlantillaRequest(valorDesdePlantilla(plantilla), listasPlantillaVacias());
        const ahora = construirPlantillaRequest({ ...valorDesdePlantilla(plantilla), con_dg_lic: false }, listasPlantillaVacias());
        expect(camposCambiados(antes, ahora, true, false)).toEqual(['con_dg_lic']);
    });

    it('conserva la frase de la API de cada requisito mientras la fila no cambie', () => {
        const plantilla = normalizePlantillaApi(plantillaApiDeEjemplo());
        const { filas, frases } = filasDesdePrerrequisitosPlantilla(plantilla.Prerrequisitos, uid);
        const tamano = filas.find((f) => f.tipo === 'tamano_minimo')!;
        expect(frases.get(tamano.uid)).toBe(`${firmaFilaPrerrequisito(tamano)}|Tamaño menudo o mayor`);
        expect(firmaFilaPrerrequisito({ ...tamano, id: 4 })).not.toBe(firmaFilaPrerrequisito(tamano));
    });

    it('lleva el field de un error de la API a su campo y su paso', () => {
        expect(campoDeErrorApi('plantilla.nombre')).toBe('nombre');
        expect(campoDeErrorApi('plantilla.descripcion')).toBe('descripcion');
        expect(campoDeErrorApi('dotes[0].dg')).toBe('dotes');
        expect(campoDeErrorApi('ataquesEspeciales[1].id_racial')).toBe('ataquesEspeciales');
        expect(campoDeErrorApi('subtipos[1]')).toBe('subtipos');
        expect(campoDeErrorApi('prerrequisitos.dg[0].cantidad')).toBe('prerrequisitos');
        expect(campoDeErrorApi('uid')).toBeNull();
        expect(campoDeErrorApi(null)).toBeNull();
        expect(CAMPOS_PLANTILLA[campoDeErrorApi('dotes[0].dg')!].paso).toBe(2);
        expect(PASOS_PLANTILLA.length).toBe(5);
    });
});
