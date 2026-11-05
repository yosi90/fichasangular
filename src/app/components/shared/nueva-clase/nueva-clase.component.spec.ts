import { FormBuilder } from '@angular/forms';
import { EMPTY, Subject, of } from 'rxjs';
import { Clase } from 'src/app/interfaces/clase';
import { normalizeClase } from 'src/app/services/clase.service';
import { NuevaClaseComponent } from './nueva-clase.component';
import { IDA_Y_VUELTA_CLASES } from 'src/testing/ida-y-vuelta-clases';
import { soloLoDeLaReferencia } from 'src/testing/cuerpo-de-catalogo';
import { getPrerequisiteDefinition } from '../prerrequisito-editor/prerrequisito-editor.registry';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { CAMPOS_CLASE } from 'src/app/services/utils/clase-formulario';

// El `PUT /clases` deja vacío lo que no viene (guía `docs/publica/CLASES_PROPIAS_FRONT.md`): el editor reenvía lo que no
// edita (la lista de conjuros, el libro y el divisor) y manda los campos de las clases propias.

function crearEditor(razaCatalogosSvc: any = {}, deidadSvc: any = {}): NuevaClaseComponent {
    // Sin `ngOnInit`: no se cargan catálogos; los servicios no se usan (los dos últimos, `RazaCatalogosService`, el de las
    // actitudes, y `DeidadService`, el de los géneros).
    const servicios = Array.from({ length: 23 }, () => ({}) as any);
    const editor: NuevaClaseComponent = new (NuevaClaseComponent as any)(new FormBuilder(), ...servicios, razaCatalogosSvc, deidadSvc);
    editor.modo = 'editar';
    return editor;
}

function claseCargada(): Clase {
    return normalizeClase({
        Id: 40, Nombre: 'Lanzador de prueba', Nivel_max_claseo: 1,
        Manual: { Id: 1, Nombre: 'Manual', Pagina: 3 },
        Ataque_base: { Id: 2 }, Salvaciones: { Fortaleza: { Id: 1 }, Reflejos: { Id: 1 }, Voluntad: { Id: 2 } },
        Conjuros: {
            Arcanos: true,
            Libro: { Nivel_cero_completo: true, Iniciales: 3, Iniciales_suman_caracteristica: true, Por_nivel: 2 },
            Nivel_lanzador_divisor: 2,
            Listado: [{ Id: 1, Nombre: 'Luz', Nivel: 0, Espontaneo: false }],
            Escuela_especialista: { Id: 9, Nombre: 'Escuela propia', Nombre_esp: 'Especialista propio' },
            Listado_por_especial: [
                { Id: 2, Nombre: 'Conjuro del fuego', Nivel: 2, Espontaneo: true, Especial: { Id: 50, Nombre: 'Senda' }, Extra: { Id: 7, Nombre: 'Fuego' } },
            ],
            Niveles_con_requisito: [
                { Nivel: 7, Especial: { Id: 60, Nombre: 'Implante' }, Dote: null },
                { Nivel: 7, Especial: null, Dote: { Id: 70, Nombre: 'Dote del implante' } },
            ],
        },
        Desglose_niveles: [{ Nivel: 1, Ataque_base: '+0', Salvaciones: { Fortaleza: '+0', Reflejos: '+0', Voluntad: '+2' } }],
    });
}

describe('NuevaClaseComponent (lo que manda al guardar)', () => {
    it('al editar reenvía la lista, el libro y el divisor, y los campos de las clases propias tal como llegaron', () => {
        const editor = crearEditor();
        (editor as any).hidratarDesdeClase(claseCargada());

        const conjuros = (editor as any).construirPayload().Conjuros;
        expect(conjuros.Listado).toEqual([{ Id: 1, Nombre: 'Luz', Nivel: 0, Espontaneo: false }]);
        expect(conjuros.Libro).toEqual({ Nivel_cero_completo: true, Iniciales: 3, Iniciales_suman_caracteristica: true, Por_nivel: 2 });
        expect(conjuros.Nivel_lanzador_divisor).toBe(2);
        expect(conjuros.Escuela_especialista).toEqual(jasmine.objectContaining({ Id: 9 }));
        expect(conjuros.Listado_por_especial).toEqual([
            { Id: 2, Nombre: 'Conjuro del fuego', Nivel: 2, Espontaneo: true, Especial: { Id: 50, Nombre: 'Senda' }, Extra: { Id: 7, Nombre: 'Fuego' } },
        ]);
        expect(conjuros.Niveles_con_requisito).toEqual([
            { Nivel: 7, Especial: { Id: 60, Nombre: 'Implante' }, Dote: null },
            { Nivel: 7, Especial: null, Dote: { Id: 70, Nombre: 'Dote del implante' } },
        ]);
        expect(editor.isDirty).toBeFalse();
    });

    it('las filas nuevas se mandan sin las incompletas; sin escuela fija, null', () => {
        const editor = crearEditor();
        (editor as any).hidratarDesdeClase(claseCargada());
        editor.form.patchValue({ escuela_especialista_id: 0 });
        editor.agregarNivelRequisito();
        editor.agregarConjuroPorEspecial();
        editor.cambiarTipoNivelRequisito(editor.nivelesRequisitoRows[2], 'dote');

        const conjuros = (editor as any).construirPayload().Conjuros;
        expect(conjuros.Escuela_especialista).toBeNull();
        expect(conjuros.Listado_por_especial.length).toBe(1);
        expect(conjuros.Niveles_con_requisito.length).toBe(2);
        expect(editor.isDirty).toBeTrue();
    });

    it('al crear no hay nada que conservar', () => {
        const editor = crearEditor();
        const conjuros = (editor as any).construirPayload().Conjuros;
        expect(conjuros.Listado).toEqual([]);
        expect(conjuros.Libro).toBeNull();
        expect(conjuros.Nivel_lanzador_divisor).toBe(1);
        expect(conjuros.Listado_por_especial).toEqual([]);
        expect(conjuros.Niveles_con_requisito).toEqual([]);
    });
});

describe('NuevaClaseComponent (el error de la API, en el marco y en su campo)', () => {
    it('con field va al bloque-error del marco, al control de su ruta y a su paso; sin control, a su paso', () => {
        const editor = crearEditor();
        editor.pasoActual = 0;

        editor.errores.mostrar(new ProfileApiError("'Conjuros.Libro.Iniciales' no puede ser negativo.", 'peticion_no_valida', 400,
            'Conjuros.Libro.Iniciales'), 'No se ha podido actualizar la clase.');

        expect(editor.errores.global).toBe("'Conjuros.Libro.Iniciales' no puede ser negativo.");
        expect(editor.pasoActual).toBe(4);
        expect(editor.form.controls.libro_iniciales.getError('api')).toBe("'Conjuros.Libro.Iniciales' no puede ser negativo.");
        expect(editor.errores.textoDe('Conjuros.Libro.Iniciales', 'No puede ser negativo.')).toBe("'Conjuros.Libro.Iniciales' no puede ser negativo.");
        expect(editor.errores.textoDe('Conjuros.Libro.Por_nivel', 'No puede ser negativo.')).toBe('No puede ser negativo.');

        editor.errores.limpiar();
        editor.errores.mostrar(new ProfileApiError('No se ha encontrado el género de prerrequisito.', 'no_encontrado', 404,
            'Prerrequisitos.genero'), 'No se ha podido actualizar la clase.');
        expect(editor.pasoActual).toBe(6);
        expect(editor.errores.mensajeDe('Prerrequisitos')).toBe('No se ha encontrado el género de prerrequisito.');

        editor.errores.mostrar(new ProfileApiError('Ya existe una clase con ese nombre.', 'nombre_duplicado', 409, 'Nombre'), 'x');
        expect(editor.pasoActual).toBe(0);
        expect(editor.form.controls.nombre.hasError('api')).toBeTrue();
        editor.form.controls.nombre.setValue('Otra clase');
        expect(editor.form.controls.nombre.hasError('api')).toBeFalse();
    });

    it('cada control con validadores está en CAMPOS_CLASE (para saltar a su paso al guardar)', () => {
        const editor = crearEditor();
        const conControl = new Set(Object.values(CAMPOS_CLASE).map((campo) => campo.control).filter(Boolean));
        const conValidador = Object.entries(editor.form.controls).filter(([, control]) => control.validator).map(([nombre]) => nombre);
        expect(conValidador.filter((nombre) => !conControl.has(nombre))).toEqual([]);
        Object.values(CAMPOS_CLASE).forEach((campo) => {
            if (campo.control)
                expect(editor.form.get(campo.control)).withContext(campo.control).not.toBeNull();
        });
    });
});

describe('NuevaClaseComponent (catálogos de los prerrequisitos)', () => {
    it('las actitudes salen del catálogo (`GET /actitudes`), no de una lista escrita en el código', () => {
        const editor = crearEditor({ getActitudes: () => of([
            { Id: 1, Nombre: 'Legal' }, { Id: 2, Nombre: 'Neutral' }, { Id: 3, Nombre: 'Caótico' },
            { Id: 4, Nombre: 'Bueno' }, { Id: 5, Nombre: 'Maligno' },
        ]) });
        expect((editor as any).getCatalogoPrerrequisito('actitud_requerido')).toEqual([]);

        (editor as any).cargarActitudes();

        expect((editor as any).getCatalogoPrerrequisito('actitud_requerido')).toEqual([
            { id: 4, nombre: 'Bueno' }, { id: 3, nombre: 'Caótico' }, { id: 1, nombre: 'Legal' },
            { id: 5, nombre: 'Maligno' }, { id: 2, nombre: 'Neutral' },
        ]);
        expect((editor as any).getCatalogoPrerrequisito('actitud_prohibido')).toBe(editor.actitudesCatalogo);
    });

    it('el género sale del catálogo (`GET /generos`), no de una lista escrita en el código, y se manda por su id', async () => {
        const editor = crearEditor({}, { getGeneros: () => of([
            { Id: 1, Nombre: 'Macho' }, { Id: 2, Nombre: 'Hembra' }, { Id: 3, Nombre: 'Hermafrodita' }, { Id: 4, Nombre: 'Sin genero' },
        ]) });
        expect((editor as any).getCatalogoPrerrequisito('genero')).toEqual([]);
        expect(getPrerequisiteDefinition('genero').requiredCatalogs).toEqual(['generos']);

        await (editor as any).asegurarCatalogosPrerrequisitos(['genero']);

        expect((editor as any).getCatalogoPrerrequisito('genero')).toEqual([
            { id: 2, nombre: 'Hembra' }, { id: 3, nombre: 'Hermafrodita' }, { id: 1, nombre: 'Macho' }, { id: 4, nombre: 'Sin genero' },
        ]);
        const fila = { ...getPrerequisiteDefinition('genero').createDefaultRow(), id: 4 };
        expect(getPrerequisiteDefinition('genero').toPayload(fila, (editor as any).prerrequisitosCatalogContext)).toEqual({ Id_genero: 4 });
    });
});

describe('NuevaClaseComponent (una habilidad del catálogo y una personalizada con el mismo id)', () => {
    // De `GET /clases/19` (cuchillo del alma) y del catálogo de `rol_dev`: la habilidad 2 es Artesanía 1 y la
    // personalizada 2, Autohipnosis. Las dos son de la clase; cada una va en su lista (`Base` y `Custom`).
    const artesania = { Id_habilidad: 2, Habilidad: 'Artesanía 1', Id_extra: 0, Extra: 'Elegir', Extra_comodin: 'elegir', Varios: null };
    const autohipnosis = { Id_habilidad: 2, Habilidad: 'Autohipnosis', Id_caracteristica: 5, Caracteristica: 'Sabiduría', Varios: null };
    const catalogo = [{ Id_habilidad: 2, Nombre: 'Artesanía 1', Soporta_extra: true, Extras: [{ Id_extra: 1, Extra: 'Alfarería' }] }];
    const personalizadas = [{ Id_habilidad: 2, Nombre: 'Autohipnosis', Soporta_extra: false, Extras: [] }];

    /** El editor con sus catálogos cargándose: los de las habilidades, de verdad; los demás no llegan nunca. */
    function editorConCatalogos(personalizadas$: Subject<any[]>): NuevaClaseComponent {
        const sinDatos = () => new Proxy({}, { get: (_objeto, clave) => `${String(clave)}`.endsWith('$') ? EMPTY : () => EMPTY });
        const servicios: any[] = Array.from({ length: 25 }, sinDatos);
        servicios[8] = {
            getHabilidades: () => of(catalogo),
            getHabilidadesCustom: () => personalizadas$.asObservable(),
            habilidadesCustomMutadas$: EMPTY,
        };
        const editor: NuevaClaseComponent = new (NuevaClaseComponent as any)(new FormBuilder(), ...servicios);
        editor.modo = 'editar';
        (editor as any).cargarCatalogosBase();
        return editor;
    }

    function cuchilloDelAlma(): Clase {
        return normalizeClase({ Id: 19, Nombre: 'Cuchillo del alma', Nivel_max_claseo: 1, Habilidades: { Base: [artesania], Custom: [autohipnosis] } });
    }

    function habilidadesDelCuerpo(editor: NuevaClaseComponent): { base: string[]; custom: string[]; } {
        const habilidades = (editor as any).construirPayload().Habilidades;
        return {
            base: habilidades.Base.map((item: any) => `${item.Id_habilidad} ${item.Habilidad}`),
            custom: habilidades.Custom.map((item: any) => `${item.Id_habilidad} ${item.Habilidad}`),
        };
    }

    it('si las personalizadas llegan después de la clase, Artesanía 1 sigue siendo del catálogo', () => {
        const personalizadas$ = new Subject<any[]>();
        const editor = editorConCatalogos(personalizadas$);
        (editor as any).hidratarDesdeClase(cuchilloDelAlma());

        personalizadas$.next(personalizadas);

        expect(editor.habilidadesRows.map((fila) => `${fila.tipo} ${fila.id_habilidad} ${fila.busqueda}`))
            .toEqual(['base 2 Artesanía 1', 'custom 2 Autohipnosis']);
        expect(habilidadesDelCuerpo(editor)).toEqual({ base: ['2 Artesanía 1'], custom: ['2 Autohipnosis'] });
        expect(editor.isDirty).toBeFalse();
        editor.ngOnDestroy();
    });

    it('si las personalizadas llegan antes, igual', () => {
        const personalizadas$ = new Subject<any[]>();
        const editor = editorConCatalogos(personalizadas$);
        personalizadas$.next(personalizadas);

        (editor as any).hidratarDesdeClase(cuchilloDelAlma());

        expect(habilidadesDelCuerpo(editor)).toEqual({ base: ['2 Artesanía 1'], custom: ['2 Autohipnosis'] });
        expect(editor.getExtrasHabilidad(editor.habilidadesRows[0]).map((extra) => extra.Extra)).toEqual(['Alfarería']);
        expect(editor.getExtrasHabilidad(editor.habilidadesRows[1])).toEqual([]);
        editor.ngOnDestroy();
    });

    it('cambiar el tipo de una fila la vacía: el mismo id es otra habilidad en el otro catálogo', () => {
        const editor = crearEditor();
        (editor as any).hidratarDesdeClase(cuchilloDelAlma());

        editor.cambiarTipoHabilidad(editor.habilidadesRows[1], 'custom');
        editor.cambiarTipoHabilidad(editor.habilidadesRows[0], 'custom');

        expect(editor.habilidadesRows.map((fila) => `${fila.tipo} ${fila.id_habilidad} ${fila.busqueda}`))
            .toEqual(['custom 0 ', 'custom 2 Autohipnosis']);
        expect(habilidadesDelCuerpo(editor)).toEqual({ base: [], custom: ['2 Autohipnosis'] });
    });

    it('cambiar una dote de nivel a especial (o al revés) vacía lo elegido', () => {
        const editor = crearEditor();
        editor.agregarRelacion('dote');
        const fila = editor.relacionesRows[editor.relacionesRows.length - 1];
        fila.id = 5;
        fila.busqueda = 'Ataque poderoso';

        editor.cambiarTipoRelacion(fila, 'especial');

        expect(editor.relacionesRows[editor.relacionesRows.length - 1]).toEqual(jasmine.objectContaining({
            uid: fila.uid, tipo: 'especial', id: 0, busqueda: '', id_extra: -1,
        }));
    });
});

function porId(lista: any[] | undefined): any[] {
    return [...(lista ?? [])].sort((a, b) => a.Id - b.Id);
}

/**
 * Un cuerpo de la clase comparable con el de la comprobación del backend (luego, con `soloLoDeLaReferencia`): las listas
 * de ids en orden (la web ordena las selecciones) y los prerrequisitos sin las claves vacías.
 */
function ordenado(cuerpo: any): any {
    const copia = JSON.parse(JSON.stringify(cuerpo));
    ['Armas', 'Armaduras', 'Grupos_arma', 'Grupos_armadura'].forEach((k) => copia.Competencias[k] = porId(copia.Competencias[k]));
    copia.Idiomas = porId(copia.Idiomas);
    copia.Idiomas_adicionales = porId(copia.Idiomas_adicionales);
    copia.Desglose_niveles.forEach((nivel: any) => nivel.Aumentos_clase_lanzadora = porId(nivel.Aumentos_clase_lanzadora));
    copia.Prerrequisitos = Object.fromEntries(Object.entries(copia.Prerrequisitos ?? {}).filter(([, items]) => (items as any[]).length > 0));
    return copia;
}

describe('NuevaClaseComponent (Modificar clase: guardar sin cambios)', () => {
    IDA_Y_VUELTA_CLASES.forEach(({ id, nombre, get, cuerpo }) => {
        it(`«${nombre}» (${id}) manda el cuerpo con el que la API devuelve el mismo GET`, () => {
            const editor = crearEditor();
            (editor as any).hidratarDesdeClase(normalizeClase(get));

            const web = ordenado((editor as any).construirPayload());
            const esperado = ordenado(cuerpo);
            expect(Object.keys(web.Prerrequisitos).sort()).toEqual(Object.keys(esperado.Prerrequisitos).sort());
            expect(soloLoDeLaReferencia(web, esperado)).toEqual(esperado);
            expect(editor.isDirty).toBeFalse();
        });
    });

    function cargada(id: number): NuevaClaseComponent {
        const editor = crearEditor();
        (editor as any).hidratarDesdeClase(normalizeClase(IDA_Y_VUELTA_CLASES.find((item) => item.id === id)!.get));
        return editor;
    }

    it('los prerrequisitos llegan como filas del editor, también la habilidad con extras pedidos', () => {
        const archimago = cargada(15);
        expect(archimago.prerrequisitosSeleccionados).toContain('dote');
        expect(archimago.prerrequisitosConservados).toEqual([]);
        const saber = archimago.prerrequisitosEditor.find((fila) => fila.tipo === 'habilidad' && fila.requiere_extra)!;
        expect(saber.valor).toBe(15);
        expect(saber.extras).toEqual([51]);

        // «Extras pedidos» ofrece los de esa habilidad del catálogo, por nombre.
        archimago.habilidadesBase = [{
            Id_habilidad: saber.id, Nombre: 'Saber', Soporta_extra: true,
            Extras: [{ Id_extra: 51, Extra: 'Arcano' }, { Id_extra: 3, Extra: 'Planos' }],
        } as any];
        expect(archimago.prerrequisitosCatalogContext.getHabilidadExtraOptions!(saber.id))
            .toEqual([{ id: 51, nombre: 'Arcano' }, { id: 3, nombre: 'Planos' }]);

        archimago.prerrequisitosEditor = archimago.prerrequisitosEditor.filter((fila) => fila !== saber);
        expect(archimago.isDirty).toBeTrue();
    });

    it('lo que el editor no puede enseñar se guarda tal cual: una fila incompleta o extras sin «requiere extra»', () => {
        const editor = crearEditor();
        const clase = claseCargada();
        clase.Prerrequisitos = {
            ...clase.Prerrequisitos,
            raza: [{ Id_raza: 0, Frase: 'Raza sin elegir' }],
            rangos_habilidad: [{ Id_habilidad: 32, Rangos: 8, Requiere_extra: 0, Extras: [{ Id_extra: 60, Extra: 'Religión' }], Frase: 'Saber (religión) 8 rangos' }],
        } as any;
        (editor as any).hidratarDesdeClase(clase);

        expect(editor.prerrequisitosConservados.map((c) => [c.clave, c.frase])).toEqual(jasmine.arrayWithExactContents([
            ['raza', 'Raza sin elegir'],
            ['rangos_habilidad', 'Saber (religión) 8 rangos'],
        ]));
        const cuerpo = (editor as any).construirPayload().Prerrequisitos;
        expect(cuerpo.rangos_habilidad).toEqual([clase.Prerrequisitos.rangos_habilidad[0]]);
        expect(cuerpo.raza).toEqual([clase.Prerrequisitos.raza[0]]);

        editor.quitarPrerrequisitoConservado(0);
        expect(editor.isDirty).toBeTrue();
    });

    it('lo de Magic of Incarnum se enseña sin editar y no va en el cuerpo', () => {
        const encarnado = cargada(405);
        expect(encarnado.moldeadoConservado).not.toBeNull();
        const cuerpo = (encarnado as any).construirPayload();
        expect(cuerpo.Moldeado).toBeUndefined();
        expect(Object.keys(cuerpo.Prerrequisitos)).not.toContain('esencia_minima');
        expect(cargada(7).moldeadoConservado).toBeNull();
    });

    it('las habilidades por alineamiento y los idiomas adicionales se editan', () => {
        const nacido = cargada(406);
        expect(nacido.habilidadesAlineamientoRows.length).toBe(4);
        nacido.quitarHabilidadAlineamiento(0);
        expect((nacido as any).construirPayload().Habilidades.Por_alineamiento.length).toBe(3);

        const clerigo = cargada(4);
        expect(clerigo.seleccionados.idiomasAdicionales.size).toBe(3);
        clerigo.toggleSeleccion('idiomasAdicionales', 99, true);
        expect((clerigo as any).construirPayload().Idiomas_adicionales.map((i: any) => i.Id)).toContain(99);
    });

    it('la lista de conjuros, el libro, el divisor y los aumentos de lanzador se editan', () => {
        const psionico = cargada(22);
        const total = psionico.listadoRows.length;
        expect(total).toBeGreaterThan(0);
        psionico.quitarConjuroListado(psionico.listadoRows[0]);
        expect((psionico as any).construirPayload().Conjuros.Listado.length).toBe(total - 1);

        const mago = cargada(418);
        mago.form.patchValue({ libro_por_nivel: 4, nivel_lanzador_divisor: 2 });
        mago.niveles[0].aumentos = [1];
        const conjuros = (mago as any).construirPayload();
        expect(conjuros.Conjuros.Libro.Por_nivel).toBe(4);
        expect(conjuros.Conjuros.Nivel_lanzador_divisor).toBe(2);
        expect(conjuros.Desglose_niveles[0].Aumentos_clase_lanzadora.map((a: any) => a.Id)).toEqual([1]);
        mago.form.patchValue({ libro_conjuros: false });
        expect((mago as any).construirPayload().Conjuros.Libro).toBeNull();
    });

    it('sin clase de origen manda null y el especial nuevo sin extra, el 0', () => {
        const guerrero = cargada(7);
        expect((guerrero as any).construirPayload().Conjuros.Clase_origen).toBeNull();
        guerrero.agregarRelacion('especial');
        const fila = guerrero.relacionesRows[guerrero.relacionesRows.length - 1];
        fila.id = 1;
        fila.busqueda = 'Especial nuevo';
        const especiales = (guerrero as any).construirPayload().Desglose_niveles[0].Especiales;
        const nuevo = especiales[especiales.length - 1];
        expect(nuevo.Id_extra).toBe(0);
        expect(nuevo.Id_especial_requerido).toBe(-1);
        expect(nuevo.Id_dote_requerida).toBe(-1);
    });

    it('el selector de tipos solo ofrece los que escribe la clase', () => {
        const claves = crearEditor().prerrequisitoOpciones.map((opcion) => opcion.key);
        expect(claves).toContain('dote');
        expect(claves).toContain('habilidad');
        expect(claves).not.toContain('region');
        expect(claves).not.toContain('nivel_de_clase');
        expect(claves).not.toContain('criaturas_compatibles');
    });
});
