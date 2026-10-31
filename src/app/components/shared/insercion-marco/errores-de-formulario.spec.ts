import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { CamposDeFormulario, ErroresDeFormulario, campoDeErrorApi } from './errores-de-formulario';

const CAMPOS: CamposDeFormulario = {
    nombre: { etiqueta: 'Nombre', paso: 0 },
    pagina: { etiqueta: 'Página', paso: 0 },
    dotes: { etiqueta: 'Dotes', paso: 2 },
};

describe('ErroresDeFormulario (los errores de una inserción, en el marco y en su campo)', () => {
    let form: FormGroup;
    let paso: number;
    let dotes: string;
    let errores: ErroresDeFormulario;

    beforeEach(() => {
        form = new FormGroup({ nombre: new FormControl('Cosa', Validators.required), pagina: new FormControl(1) });
        paso = 1;
        dotes = '[]';
        errores = new ErroresDeFormulario({
            campos: CAMPOS,
            raiz: 'cosa',
            control: (campo) => form.get(campo),
            firma: (campo) => campo === 'dotes' ? dotes : JSON.stringify(form.get(campo)?.value ?? null),
            irAPaso: (destino) => paso = destino,
        });
    });

    it('lleva el field de la API a su campo con o sin la raíz del cuerpo', () => {
        expect(campoDeErrorApi('cosa.nombre', CAMPOS, 'cosa')).toBe('nombre');
        expect(campoDeErrorApi('dotes[0].id_dote', CAMPOS, 'cosa')).toBe('dotes');
        expect(campoDeErrorApi('nombre', CAMPOS, null)).toBe('nombre');
        expect(campoDeErrorApi('uid', CAMPOS, 'cosa')).toBeNull();
        expect(campoDeErrorApi('', CAMPOS, 'cosa')).toBeNull();
    });

    it('un error con field va al marco, a su control (clave api) y a su paso', () => {
        errores.mostrar(new ProfileApiError('Ya existe una cosa con ese nombre.', 'nombre_duplicado', 409, 'cosa.nombre'), 'No se pudo.');

        expect(errores.global).toBe('Ya existe una cosa con ese nombre.');
        expect(errores.campo?.campo).toBe('nombre');
        expect(form.get('nombre')?.getError('api')).toBe('Ya existe una cosa con ese nombre.');
        expect(paso).toBe(0);
    });

    it('el error de una lista se lee con mensajeDe y se va al corregirla', () => {
        errores.mostrar(new ProfileApiError('No se ha encontrado la dote.', 'no_encontrado', 404, 'dotes[0].id_dote'), 'No se pudo.');
        expect(paso).toBe(2);
        expect(errores.mensajeDe('dotes')).toBe('No se ha encontrado la dote.');

        errores.seguirCambios();
        expect(errores.campo).not.toBeNull();
        dotes = '[1]';
        errores.seguirCambios();
        expect(errores.campo).toBeNull();
    });

    it('sin field, solo el global; limpiar lo quita todo', () => {
        errores.mostrar(new Error('Sin conexión'), 'No se pudo.');
        expect(errores.global).toBe('Sin conexión');
        expect(errores.campo).toBeNull();

        errores.limpiar();
        expect(errores.global).toBe('');
    });

    it('antes de mandar lleva al paso del primer campo que no vale', () => {
        form.get('nombre')?.setValue('');
        errores.irAlPrimerError();
        expect(paso).toBe(0);
    });
});
