import { FormBuilder } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import Swal from 'sweetalert2';
import { plantillaApiDeEjemplo } from 'src/testing/plantilla-api';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { normalizePlantillaApi } from 'src/app/services/utils/plantilla-mapper';
import { TEXTO_SIN_CAMBIO } from 'src/app/services/utils/plantilla-formulario';
import { NuevaPlantillaComponent } from './nueva-plantilla.component';

describe('NuevaPlantillaComponent', () => {
    let component: NuevaPlantillaComponent;
    let puedeCrear: boolean;
    let plantillaSvc: jasmine.SpyObj<any>;
    let swal: jasmine.Spy;

    const plantilla = () => normalizePlantillaApi(plantillaApiDeEjemplo());
    const errorDeApi = (campo: string, mensaje: string) =>
        new ProfileApiError(`Los datos de la plantilla no son válidos. ${mensaje}`, 'peticion_no_valida', 400, campo);

    function crear(modo: 'crear' | 'editar' = 'crear'): NuevaPlantillaComponent {
        const nuevo = new NuevaPlantillaComponent(
            new FormBuilder(),
            {
                isLoggedIn$: new BehaviorSubject(true),
                can: jasmine.createSpy('can').and.callFake((recurso: string, accion: string) => recurso === 'plantillas' && accion === 'create' && puedeCrear),
                getPermissionDeniedMessage: () => 'Sin permisos suficientes.',
            } as any,
            plantillaSvc as any,
            { getManuales: () => of([{ Id: 4, Nombre: 'Manual de monstruos 1' }]) } as any,
            { getTamanos: () => of([{ Id: 5, Nombre: 'Mediano' }, { Id: 6, Nombre: 'Grande' }]), getTamano: () => of({ Id: 0, Nombre: 'Depende' }) } as any,
            {
                getTiposDado: () => of([{ Id: 0, Nombre: 'Elegir' }, { Id: 3, Nombre: 'd8' }]),
                getManiobrabilidades: () => of([{ Id: 4, Nombre: 'buena' }]),
                getActitudes: () => of([{ Id: 6, Nombre: 'Maligno' }]),
            } as any,
            { getTiposCriatura: () => of([{ Id: 0, Nombre: 'Cualquiera' }, { Id: 2, Nombre: 'Animal' }, { Id: 5, Nombre: 'Humanoide' }, { Id: 6, Nombre: 'Gigante' }]) } as any,
            { getAlineamientosCombinacionesCatalogo: () => of([{ Id: 7, Basico: { Id: 3, Nombre: 'Legal maligno' }, Ley: {}, Moral: {}, Prioridad: { Nombre: 'Siempre' } }]) } as any,
            { getRaciales: () => of([{ Id: 70, Nombre: 'Olfato' }, { Id: 71, Nombre: 'Licantropía contagiosa' }, { Id: 72, Nombre: 'Visión en la oscuridad' }]) } as any,
            { getConjuros: () => of([{ Id: 40, Nombre: 'Hablar con los animales' }]) } as any,
            { getDotes: () => of([{ Id: 30, Nombre: 'Soltura con un arma', Extras_disponibles: { Armas: [{ Id: 5, Nombre: 'Mordisco' }], Armaduras: [], Escuelas: [], Habilidades: [] } }]) } as any,
            { getHabilidades: () => of([{ Id_habilidad: 12, Nombre: 'Avistar', Extras: [] }]) } as any,
            { getSubtipos: () => of([{ Id: 9, Nombre: 'Cambiaformas' }, { Id: 14, Nombre: 'Incorporal' }]) } as any,
            { cargar: () => Promise.resolve() } as any,
        );
        nuevo.modo = modo;
        nuevo.idPlantilla = modo === 'editar' ? 21 : null;
        nuevo.ngOnInit();
        return nuevo;
    }

    beforeEach(() => {
        puedeCrear = true;
        plantillaSvc = jasmine.createSpyObj('PlantillaService', ['crearPlantilla', 'actualizarPlantilla', 'getPlantillaFresca', 'getPlantillas']);
        plantillaSvc.getPlantillas.and.returnValue(of([plantilla()]));
        plantillaSvc.getPlantillaFresca.and.returnValue(of(plantilla()));
        plantillaSvc.crearPlantilla.and.resolveTo({ message: 'Plantilla creada correctamente.', idPlantilla: 22, plantilla: plantilla() });
        plantillaSvc.actualizarPlantilla.and.resolveTo({ message: 'Plantilla actualizada correctamente.', idPlantilla: 21, plantilla: plantilla() });
        swal = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
    });

    afterEach(() => component?.ngOnDestroy());

    describe('crear', () => {
        beforeEach(() => component = crear());

        it('tiene cinco pasos, empieza en el primero y dice «Crear plantilla»', () => {
            expect(component.pasos.length).toBe(5);
            expect(component.pasoActual).toBe(0);
            expect(component.textoAccion).toBe('Crear plantilla');
            expect(component.lineaManual).toBe('');
            expect(component.accionDesactivada).toBeFalse();
        });

        it('sin nombre, manual ni tamaño no llama a la API y se queda en el paso 1', async () => {
            component.pasoActual = 3;
            await component.guardar();

            expect(plantillaSvc.crearPlantilla).not.toHaveBeenCalled();
            expect(component.pasoActual).toBe(0);
            expect(component.errorDe('nombre')).toBe('El nombre es obligatorio.');
            expect(component.errorDe('id_manual')).toBe('Elige uno.');
            expect(component.errorDe('id_tamano')).toBe('Elige uno.');
        });

        it('un número con decimales no vale y lleva a su paso', async () => {
            component.form.patchValue({ nombre: 'Celestial', id_manual: 4, id_tamano: 0, fortaleza: 1.5 });
            await component.guardar();

            expect(plantillaSvc.crearPlantilla).not.toHaveBeenCalled();
            expect(component.pasoActual).toBe(1);
            expect(component.errorDe('fortaleza')).toBe('Tiene que ser un número entero.');
        });

        it('manda el cuerpo del contrato con los rasgos, los requisitos y los campos nuevos, y vuelve a empezar', async () => {
            const creadas: unknown[] = [];
            component.plantillaCreada.subscribe((p) => creadas.push(p));
            component.form.patchValue({
                nombre: 'Celestial', descripcion: 'Texto propio.', id_manual: 4, pagina: 31, id_tamano: 0, oficial: true,
                nombre_original: 'Celestial', traducido: true, entorno: 'Planos buenos', vd: '+1',
            });
            component.anadirRasgo('ataquesEspeciales', 72);
            component.anadirRasgo('dotes', 30);
            component.listas.dotes[0].id_extra = 5;
            component.anadirRasgo('subtipos', 9);
            component.anadirRequisito('criaturas_compatibles');
            component.listas.prerrequisitos[0].id = 2;
            component.anadirRequisito('subtipo_prohibido');
            component.listas.prerrequisitos[1].id = 14;
            component.anadirRequisito('nivel_lanzador');
            component.listas.prerrequisitos[2].valor = 11;

            await component.guardar();

            expect(plantillaSvc.crearPlantilla).toHaveBeenCalledTimes(1);
            const cuerpo = plantillaSvc.crearPlantilla.calls.argsFor(0)[0];
            expect(cuerpo.plantilla).toEqual(jasmine.objectContaining({
                nombre: 'Celestial', descripcion: 'Texto propio.', id_manual: 4, pagina: 31, id_tamano: 0, oficial: true,
                nombre_original: 'Celestial', traducido: true, entorno: 'Planos buenos', vd: '+1', tesoro: null, ca: TEXTO_SIN_CAMBIO,
            }));
            expect(cuerpo.ataquesEspeciales).toEqual([{ id_racial: 72, dg: 1 }]);
            expect(cuerpo.dotes).toEqual([{ id_dote: 30, id_extra: 5, dg: 1 }]);
            expect(cuerpo.subtipos).toEqual([9]);
            expect(cuerpo.prerrequisitos.criaturas_compatibles).toEqual([{ id_tipo_comp: 2, id_tipo_nuevo: 0, opcional: 0 }]);
            expect(cuerpo.prerrequisitos.subtipo_prohibido).toEqual([{ id_subtipo: 14, opcional: 0 }]);
            expect(cuerpo.prerrequisitos.nivel_lanzador).toEqual([{ nivel: 11, opcional: 0 }]);
            expect(swal).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'success', title: 'Plantilla creada' }));
            expect(creadas.length).toBe(1);
            expect(component.form.controls.nombre.value).toBe('');
            expect(component.listas.prerrequisitos).toEqual([]);
        });

        it('no deja guardar un requisito a medias', async () => {
            component.form.patchValue({ nombre: 'Celestial', id_manual: 4, id_tamano: 0 });
            component.anadirRequisito('tamano_minimo');
            await component.guardar();

            expect(plantillaSvc.crearPlantilla).not.toHaveBeenCalled();
            expect(component.pasoActual).toBe(3);
            expect(component.errorGlobal).toContain('requisitos');
        });

        it('un 400 con field de un escalar marca ese campo y salta a su paso', async () => {
            plantillaSvc.crearPlantilla.and.rejectWith(errorDeApi('plantilla.descripcion', "'plantilla.descripcion' es obligatorio."));
            component.form.patchValue({ nombre: 'Celestial', id_manual: 4, id_tamano: 0 });
            await component.guardar();

            expect(component.pasoActual).toBe(4);
            expect(component.errorDe('descripcion')).toContain("'plantilla.descripcion' es obligatorio.");
            expect(component.errorGlobal).toContain('no son válidos');
            component.form.controls.descripcion.setValue('Ya tiene descripción.');
            expect(component.errorDe('descripcion')).toBeNull();
        });

        it('un 400 con field de una lista marca su tarjeta y salta al paso de los rasgos', async () => {
            plantillaSvc.crearPlantilla.and.rejectWith(errorDeApi('dotes[0].dg', "'dotes[0].dg' debe ser numérico."));
            component.form.patchValue({ nombre: 'Celestial', id_manual: 4, id_tamano: 0 });
            await component.guardar();

            expect(component.pasoActual).toBe(2);
            expect(component.errorCampo?.campo).toBe('dotes');
            expect(component.errorDe('dotes')).toContain('dotes[0].dg');
        });

        it('un 400 de un requisito lleva al paso 4', async () => {
            plantillaSvc.crearPlantilla.and.rejectWith(errorDeApi('prerrequisitos.dg[0].cantidad', 'debe ser mayor que 0.'));
            component.form.patchValue({ nombre: 'Celestial', id_manual: 4, id_tamano: 0 });
            await component.guardar();
            expect(component.pasoActual).toBe(3);
            expect(component.errorCampo?.campo).toBe('prerrequisitos');
        });

        it('sin permiso de crear plantillas avisa en el marco y no guarda', async () => {
            puedeCrear = false;
            component.ngOnDestroy();
            component = crear();
            expect(component.avisoPermisos).toBe('No tienes permisos para crear plantillas.');
            await component.guardar();
            expect(plantillaSvc.crearPlantilla).not.toHaveBeenCalled();
        });

        it('los pasos de modificación salen de las plantillas que ya hay, con el 0 (no cambia)', () => {
            expect(component.pasosModificacion).toEqual([{ id: 0, nombre: TEXTO_SIN_CAMBIO }, { id: 1, nombre: '+1 paso' }]);
            expect(component.tamanos.map((t) => t.id)).toEqual([0, 5, 6]);
        });

        it('lee los requisitos como en la creación: frase provisional para lo nuevo', () => {
            component.anadirRequisito('criaturas_compatibles');
            component.alCambiarRequisitos(component.listas.prerrequisitos.map((fila) => ({ ...fila, id: 5 })));
            expect(component.hayFrasesProvisionales).toBeTrue();
            expect(component.gruposLectura[0].condiciones[0].frase).toContain('Humanoide → conserva su tipo');
        });
    });

    describe('modificar', () => {
        beforeEach(() => component = crear('editar'));

        it('rellena todo desde GET /plantillas/<id> y empieza sin cambios', () => {
            expect(plantillaSvc.getPlantillaFresca).toHaveBeenCalledWith(21);
            expect(component.form.controls.nombre.value).toBe('Licántropo de prueba');
            expect(component.form.controls.con_dg_lic.value).toBeTrue();
            expect(component.listas.raciales.map((f) => f.id)).toEqual([70]);
            expect(component.listas.prerrequisitos.length).toBe(5);
            expect(component.prerrequisitosTipos).toEqual(['criaturas_compatibles', 'tamano_minimo', 'subtipo_prohibido', 'caracteristica']);
            expect(component.cambios).toEqual([]);
            expect(component.accionDesactivada).toBeTrue();
            expect(component.textoAccion).toBe('Guardar cambios');
            expect(component.lineaManual).toBe('Manual de monstruos 1, p. 175');
            expect(component.notaPie).toBe('Sin cambios todavía.');
            // Los requisitos sin tocar se leen con la frase de la API.
            expect(component.hayFrasesProvisionales).toBeFalse();
            expect(component.gruposLectura.flatMap((g) => g.condiciones.map((c) => c.frase))).toContain('Tamaño menudo o mayor');
        });

        it('marca lo cambiado, sus pasos y escribe «N cambios: …»', () => {
            component.form.controls.nombre.setValue('Licántropo revisado');
            component.anadirRasgo('raciales', 72);

            expect(component.cambios).toEqual(['nombre', 'raciales']);
            expect(component.cambiado('nombre')).toBeTrue();
            expect(component.etiqueta('nombre')).toBe('Nombre · cambiado');
            expect(component.etiqueta('pagina')).toBe('Página');
            expect(component.pasosConCambios).toEqual([0, 2]);
            expect(component.notaPie).toBe('2 cambios: Nombre, Raciales');
            expect(component.accionDesactivada).toBeFalse();
        });

        it('deshacer el cambio a mano vuelve a «sin cambios»', () => {
            component.form.controls.fortaleza.setValue(5);
            expect(component.cambios).toEqual(['fortaleza']);
            component.form.controls.fortaleza.setValue(2);
            expect(component.cambios).toEqual([]);
        });

        it('«Descartar» vuelve a la plantilla tal como llegó', () => {
            component.form.controls.nombre.setValue('Otro');
            component.quitarRasgo('raciales', component.listas.raciales[0].uid);
            component.descartar();

            expect(component.form.controls.nombre.value).toBe('Licántropo de prueba');
            expect(component.listas.raciales.map((f) => f.id)).toEqual([70]);
            expect(component.cambios).toEqual([]);
        });

        it('«Guardar cambios» manda la plantilla entera por PUT, avisa al control de pestañas y cierra', async () => {
            const actualizadas: unknown[] = [];
            let cerrada = false;
            component.plantillaActualizada.subscribe((p) => actualizadas.push(p));
            component.cerrar.subscribe(() => cerrada = true);
            component.form.controls.iniciativa.setValue(2);

            await component.guardar();

            expect(plantillaSvc.actualizarPlantilla).toHaveBeenCalledTimes(1);
            const [id, cuerpo] = plantillaSvc.actualizarPlantilla.calls.argsFor(0);
            expect(id).toBe(21);
            expect(cuerpo.plantilla.iniciativa).toBe(2);
            // Lo que no se tocó va también: el PUT reemplaza la plantilla entera.
            expect(cuerpo.raciales).toEqual([{ id_racial: 70, dg: 1 }]);
            expect(cuerpo.dotes).toEqual([{ id_dote: 30, id_extra: 5, dg: 3 }]);
            expect(cuerpo.prerrequisitos.tamano_minimo).toEqual([{ id_tamano: 3, opcional: 0 }]);
            expect(cuerpo.plantilla.mult_dg_lic).toBe(2);
            expect(actualizadas.length).toBe(1);
            expect(cerrada).toBeTrue();
        });

        it('sin cambios no guarda', async () => {
            await component.guardar();
            expect(plantillaSvc.actualizarPlantilla).not.toHaveBeenCalled();
        });

        it('pregunta antes de cerrar solo si hay cambios', async () => {
            expect(await component.confirmarSalidaSiHayCambios()).toBeTrue();
            expect(swal).not.toHaveBeenCalled();
            component.form.controls.nombre.setValue('Otro');
            swal.and.resolveTo({ isConfirmed: false } as any);
            expect(await component.confirmarSalidaSiHayCambios()).toBeFalse();
        });

        it('un 409 de nombre repetido vuelve al nombre', async () => {
            plantillaSvc.actualizarPlantilla.and.rejectWith(new ProfileApiError('Ya existe una plantilla con ese nombre.', 'nombre_duplicado', 409, 'plantilla.nombre'));
            component.form.controls.nombre.setValue('Celestial');
            component.pasoActual = 4;
            await component.guardar();

            expect(component.pasoActual).toBe(0);
            expect(component.errorDe('nombre')).toBe('Ya existe una plantilla con ese nombre.');
        });

        it('modificar pide el permiso de crear plantillas, como la API', () => {
            expect(component.puedeGuardar).toBeTrue();
            puedeCrear = false;
            component.ngOnDestroy();
            component = crear('editar');
            expect(component.avisoPermisos).toBe('No tienes permisos para modificar plantillas.');
        });
    });
});
