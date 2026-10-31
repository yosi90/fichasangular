import { FormBuilder } from '@angular/forms';
import { of } from 'rxjs';
import { Clase } from 'src/app/interfaces/clase';
import { normalizeClase } from 'src/app/services/clase.service';
import { NuevaClaseComponent } from './nueva-clase.component';
import { IDA_Y_VUELTA_CLASES } from 'src/testing/ida-y-vuelta-clases';
import { soloLoDeLaReferencia } from 'src/testing/cuerpo-de-catalogo';

// El `PUT /clases` deja vacío lo que no viene (guía `docs/publica/CLASES_PROPIAS_FRONT.md`): el editor reenvía lo que no
// edita (la lista de conjuros, el libro y el divisor) y manda los campos de las clases propias.

function crearEditor(razaCatalogosSvc: any = {}): NuevaClaseComponent {
    // Sin `ngOnInit`: no se cargan catálogos; los servicios no se usan (el último, `RazaCatalogosService`, el de las actitudes).
    const servicios = Array.from({ length: 23 }, () => ({}) as any);
    const editor: NuevaClaseComponent = new (NuevaClaseComponent as any)(new FormBuilder(), ...servicios, razaCatalogosSvc);
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

    it('los prerrequisitos llegan como filas del editor; la habilidad con extras se guarda tal cual', () => {
        const archimago = cargada(15);
        expect(archimago.prerrequisitosEditor.length).toBeGreaterThan(0);
        expect(archimago.prerrequisitosSeleccionados).toContain('dote');
        expect(archimago.prerrequisitosConservados.length).toBe(1);
        expect(archimago.prerrequisitosConservados[0].clave).toBe('rangos_habilidad');
        expect((archimago.prerrequisitosConservados[0].item as any).Extras.length).toBeGreaterThan(0);

        archimago.quitarPrerrequisitoConservado(0);
        expect(archimago.isDirty).toBeTrue();
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
