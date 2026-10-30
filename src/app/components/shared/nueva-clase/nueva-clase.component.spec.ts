import { FormBuilder } from '@angular/forms';
import { Clase } from 'src/app/interfaces/clase';
import { normalizeClase } from 'src/app/services/clase.service';
import { NuevaClaseComponent } from './nueva-clase.component';

// El `PUT /clases` deja vacío lo que no viene (guía `docs/publica/CLASES_PROPIAS_FRONT.md`): el editor reenvía lo que no
// edita (la lista de conjuros, el libro y el divisor) y manda los campos de las clases propias.

function crearEditor(): NuevaClaseComponent {
    // Sin `ngOnInit`: no se cargan catálogos; los servicios no se usan.
    const servicios = Array.from({ length: 23 }, () => ({}) as any);
    const editor: NuevaClaseComponent = new (NuevaClaseComponent as any)(new FormBuilder(), ...servicios);
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
