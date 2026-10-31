import { FormBuilder } from '@angular/forms';
import { BehaviorSubject, of } from 'rxjs';
import Swal from 'sweetalert2';
import { IDA_Y_VUELTA_MONSTRUOS } from 'src/testing/ida-y-vuelta-monstruos';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { normalizeMonstruoDetalle } from 'src/app/services/utils/monstruo-mapper';
import { NuevaMonstruoComponent } from './nueva-monstruo.component';

describe('NuevaMonstruoComponent', () => {
    let component: NuevaMonstruoComponent;
    let puedeCrear: boolean;
    let monstruoSvc: jasmine.SpyObj<any>;
    let swal: jasmine.Spy;

    const entrada = (id: number) => IDA_Y_VUELTA_MONSTRUOS.find((item) => item.id === id)!;
    const monstruo = (id: number) => normalizeMonstruoDetalle(entrada(id).get, 1);

    function crear(modo: 'crear' | 'editar' = 'crear', id: number | null = null): NuevaMonstruoComponent {
        const nuevo = new NuevaMonstruoComponent(
            new FormBuilder(),
            {
                isLoggedIn$: new BehaviorSubject(true),
                can: jasmine.createSpy('can').and.callFake((recurso: string, accion: string) => recurso === 'monstruos' && accion === 'create' && puedeCrear),
                getPermissionDeniedMessage: () => 'Sin permisos suficientes.',
            } as any,
            monstruoSvc as any,
            { getManuales: () => of([{ Id: 47, Nombre: 'Manual de monstruos 1' }]) } as any,
            { getTamanos: () => of([{ Id: 3, Nombre: 'Menudo', Espacio: 2.5, Alcance: 0 }, { Id: 6, Nombre: 'Grande', Espacio: 10, Alcance: 10 }]) } as any,
            { getTiposDado: () => of([{ Id: 0, Nombre: 'Elegir' }, { Id: 3, Nombre: 'd8' }]), getManiobrabilidades: () => of([{ Id: 0, Nombre: 'no vuela' }, { Id: 4, Nombre: 'buena' }]) } as any,
            { getTiposCriatura: () => of([{ Id: 3, Nombre: 'Animal' }, { Id: 2, Nombre: 'Ajeno' }]) } as any,
            {
                getAlineamientosCombinacionesCatalogo: () => of([{ Id: 2, Basico: { Id: 5, Nombre: 'Neutral auténtico' }, Ley: {}, Moral: {}, Prioridad: { Nombre: 'Siempre' } }]),
                getAlineamientosBasicosCatalogo: () => of([{ Id: 0, Nombre: 'No aplica' }, { Id: 1, Nombre: 'Legal bueno' }, { Id: 3, Nombre: 'Legal maligno' }]),
                getAlineamientosPreferenciaLeyCatalogo: () => of([{ Id: 10, Nombre: 'Ninguna preferencia' }]),
                getAlineamientosPreferenciaMoralCatalogo: () => of([{ Id: 4, Nombre: 'Siempre Bueno' }, { Id: 10, Nombre: 'Ninguna preferencia' }]),
            } as any,
            { getClases: () => of([{ Id: 5, Nombre: 'Druida' }, { Id: 9, Nombre: 'Mago' }]) } as any,
            { getRaciales: () => of([{ Id: 18, Nombre: 'Visión en la penumbra' }, { Id: 171, Nombre: 'Rayo relampagueante' }]) } as any,
            { getConjuros: () => of([{ Id: 40, Nombre: 'Luz' }]) } as any,
            { getDotes: () => of([{ Id: 4, Nombre: 'Soltura con un arma', Extras_disponibles: { Armas: [{ Id: 72, Nombre: 'Mordisco' }], Armaduras: [], Escuelas: [], Habilidades: [] } }, { Id: 45, Nombre: 'Familiar celestial' }]) } as any,
            { getHabilidades: () => of([{ Id_habilidad: 6, Nombre: 'Avistar', Extras: [] }, { Id_habilidad: 32, Nombre: 'Saber', Extras: [{ Id_extra: 57, Extra: 'Naturaleza' }] }]) } as any,
            { getSubtipos: () => of([{ Id: 4, Nombre: 'Bueno' }]) } as any,
            { getIdiomas: () => of([{ Id: 22, Nombre: 'Común' }]) } as any,
        );
        nuevo.modo = modo;
        nuevo.idMonstruo = id;
        nuevo.ngOnInit();
        return nuevo;
    }

    beforeEach(() => {
        puedeCrear = true;
        monstruoSvc = jasmine.createSpyObj('MonstruoService', ['crearMonstruo', 'actualizarMonstruo', 'getMonstruoFresco', 'getPlantillasFamiliar']);
        monstruoSvc.getPlantillasFamiliar.and.returnValue(of([{ Id: 1, Nombre: 'Básica' }, { Id: 3, Nombre: 'Celestial' }]));
        monstruoSvc.getMonstruoFresco.and.callFake((id: number) => of(monstruo(id)));
        monstruoSvc.crearMonstruo.and.resolveTo({ message: 'Monstruo creado correctamente.', idMonstruo: 59, monstruo: monstruo(48) });
        monstruoSvc.actualizarMonstruo.and.callFake((id: number) => Promise.resolve({ message: 'Monstruo actualizado correctamente.', idMonstruo: id, monstruo: monstruo(id) }));
        swal = spyOn(Swal, 'fire').and.resolveTo({ isConfirmed: true } as any);
    });

    afterEach(() => component?.ngOnDestroy());

    describe('crear', () => {
        beforeEach(() => component = crear());

        it('tiene seis pasos, empieza en el primero y dice «Crear monstruo»', () => {
            expect(component.pasos.length).toBe(6);
            expect(component.pasoActual).toBe(0);
            expect(component.textoAccion).toBe('Crear monstruo');
            expect(component.textoGuardando).toBe('Creando monstruo…');
            expect(component.accionDesactivada).toBeFalse();
            expect(component.avisoPermisos).toBe('');
        });

        it('sin nombre, manual, tipo, tamaño, dado ni alineamiento no llama a la API y se queda en la identidad', async () => {
            component.pasoActual = 4;
            await component.guardar();

            expect(monstruoSvc.crearMonstruo).not.toHaveBeenCalled();
            expect(component.pasoActual).toBe(0);
            expect(component.errorDe('nombre')).toBe('El nombre es obligatorio.');
            expect(component.errorDe('id_manual')).toBe('Elige uno.');
            expect(component.errorDe('id_tipo')).toBe('Elige uno.');
            expect(component.errorDe('id_tamano')).toBe('Elige uno.');
            expect(component.errorDe('id_tipo_dado')).toBe('Elige uno.');
        });

        it('los DG son un número o una fracción y el espacio va en medios pies', async () => {
            component.form.patchValue({ nombre: 'Rata gigante', id_manual: 47, id_tipo: 3, id_tamano: 3, id_tipo_dado: 3, id_alineamiento: 2, cantidad_dg: 'medio', espacio: 2.2 });
            await component.guardar();

            expect(monstruoSvc.crearMonstruo).not.toHaveBeenCalled();
            expect(component.pasoActual).toBe(1);
            expect(component.errorDe('cantidad_dg')).toBe('Un número («12») o una fracción («1/2»).');
            expect(component.errorDe('espacio')).toBe('En pies, en medios: 2,5, 5, 10…');
        });

        it('al elegir el tamaño, el espacio y el alcance son los suyos', () => {
            component.alElegirTamano(3);
            expect(component.form.controls.espacio.value).toBe(2.5);
            expect(component.form.controls.alcance.value).toBe(0);
        });

        it('manda el cuerpo del contrato, con «—» como null, sin extra como null y los niveles de clase, y vuelve a empezar', async () => {
            const creados: unknown[] = [];
            component.monstruoCreado.subscribe((m) => creados.push(m));
            component.form.patchValue({
                nombre: ' Rata gigante ', id_manual: 47, pagina: 12, id_tipo: 3, id_tamano: 3, id_tipo_dado: 3, id_alineamiento: 2,
                cantidad_dg: '1/2', espacio: 2.5, alcance: 0, inteligencia: null, reduccion_dano: ' 5/plata ', resistencia_conjuros: '12',
                familiar: true, oficial: true,
            });
            component.anadirALista('dotes', 4);
            component.listas.dotes[0].id_extra = 72;
            component.anadirALista('dotes', 45);
            component.anadirALista('habilidades', 32);
            component.listas.habilidades[0].id_extra = 57;
            component.listas.habilidades[0].rangos = 4;
            component.anadirALista('raciales', 18);
            component.anadirALista('sortilegas', 40);
            component.anadirALista('idiomas', 22);
            component.anadirNivelClase(9);
            component.listas.niveles_clase[0].id_plantilla = 3;
            component.listas.niveles_clase[0].id_preferencia_moral = 4;
            component.alternarAlineamientoRequerido('familiar', 3);
            component.alternarAlineamientoRequerido('familiar', 1);

            await component.guardar();

            expect(monstruoSvc.crearMonstruo).toHaveBeenCalledTimes(1);
            const cuerpo = monstruoSvc.crearMonstruo.calls.argsFor(0)[0];
            expect(cuerpo.monstruo).toEqual(jasmine.objectContaining({
                nombre: 'Rata gigante', id_manual: 47, pagina: 12, cantidad_dg: '1/2', espacio: 2.5, alcance: 0, inteligencia: null,
                fuerza: 10, reduccion_dano: '5/plata', resistencia_conjuros: '12', ataques: '', id_maniobrabilidad: null,
                familiar: true, companero: false, oficial: true,
            }));
            expect(cuerpo.dotes).toEqual([{ id_dote: 4, id_extra: 72 }, { id_dote: 45, id_extra: null }]);
            expect(cuerpo.habilidades).toEqual([{ id_habilidad: 32, id_extra: 57, rangos: 4 }]);
            expect(cuerpo.sortilegas).toEqual([{ id_conjuro: 40, nivel_lanzador: 1, usos_diarios: '' }]);
            expect(cuerpo.raciales).toEqual([18]);
            expect(cuerpo.idiomas).toEqual([22]);
            expect(cuerpo.niveles_clase).toEqual([{ id_clase: 9, nivel: 1, id_plantilla: 3, id_preferencia_legal: null, id_preferencia_moral: 4, id_dote: null }]);
            expect(cuerpo.alineamientos_requeridos).toEqual({ familiar: [1, 3], companero: [] });
            expect(swal).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'success', title: 'Monstruo creado' }));
            expect(creados.length).toBe(1);
            expect(component.form.controls.nombre.value).toBe('');
            expect(component.listas.dotes).toEqual([]);
        });

        it('sin permiso, el aviso ámbar y no llama a la API', async () => {
            puedeCrear = false;
            component.ngOnDestroy();
            component = crear();
            expect(component.avisoPermisos).toBe('No tienes permisos para crear monstruos.');
            await component.guardar();
            expect(monstruoSvc.crearMonstruo).not.toHaveBeenCalled();
            expect(swal).toHaveBeenCalledWith(jasmine.objectContaining({ title: 'Permisos insuficientes' }));
        });

        it('el error de la API con su campo va al marco, al campo y a su paso', async () => {
            monstruoSvc.crearMonstruo.and.rejectWith(new ProfileApiError("'habilidades[0].id_habilidad': habilidad repetido.", 'peticion_no_valida', 400, 'habilidades[0].id_habilidad'));
            component.form.patchValue({ nombre: 'Rata gigante', id_manual: 47, id_tipo: 3, id_tamano: 3, id_tipo_dado: 3, id_alineamiento: 2 });
            component.anadirALista('habilidades', 6);
            await component.guardar();

            expect(component.errorGlobal).toContain('habilidad repetido');
            expect(component.errorCampo?.campo).toBe('habilidades');
            expect(component.pasoActual).toBe(3);
        });
    });

    describe('modificar', () => {
        IDA_Y_VUELTA_MONSTRUOS.forEach((caso) => {
            it(`${caso.nombre}: el formulario cargado manda el mismo cuerpo con el que la API devolvió el mismo GET y no marca cambios`, () => {
                component = crear('editar', caso.id);

                expect(component.form.valid).withContext(JSON.stringify(Object.keys(component.form.controls).filter((k) => (component.form.controls as any)[k].invalid))).toBeTrue();
                expect(component.cuerpoActual()).toEqual(caso.cuerpo);
                expect(component.hayCambios).toBeFalse();
                expect(component.accionDesactivada).toBeTrue();
                expect(component.notaPie).toBe('Sin cambios todavía.');
            });
        });

        it('dice el manual en la cabecera, los familiares y compañeros que se conservan y «Guardar cambios»', () => {
            component = crear('editar', 13);
            expect(component.textoAccion).toBe('Guardar cambios');
            expect(component.lineaManual).toBe('Manual de monstruos 1, p. 277');
            expect(component.derivados.length).toBe(1);
            expect(component.derivados[0]).toMatch(/^Familiar: /);
        });

        it('marca el campo y el paso cambiados y manda el PUT con el monstruo entero', async () => {
            component = crear('editar', 58);
            const actualizados: unknown[] = [];
            const cerrados: unknown[] = [];
            component.monstruoActualizado.subscribe((m) => actualizados.push(m));
            component.cerrar.subscribe(() => cerrados.push(true));

            component.form.controls.constitucion.setValue(12);
            component.quitarDeLista('dotes', component.listas.dotes[0].uid);

            expect(component.cambios).toEqual(['constitucion', 'dotes']);
            expect(component.pasosConCambios).toEqual([2, 3]);
            expect(component.etiqueta('constitucion')).toBe('Constitución · cambiado');
            expect(component.notaPie).toBe('2 cambios: Constitución, Dotes');

            await component.guardar();

            expect(monstruoSvc.actualizarMonstruo).toHaveBeenCalledTimes(1);
            const [id, cuerpo] = monstruoSvc.actualizarMonstruo.calls.argsFor(0);
            expect(id).toBe(58);
            expect(cuerpo.monstruo.constitucion).toBe(12);
            expect(cuerpo.dotes.length).toBe(entrada(58).cuerpo.dotes.length - 1);
            expect(swal).toHaveBeenCalledWith(jasmine.objectContaining({ icon: 'success', title: 'Monstruo actualizado' }));
            expect(actualizados.length).toBe(1);
            expect(cerrados.length).toBe(1);
        });

        it('«Descartar» vuelve a lo que llegó y cerrar con cambios pregunta', async () => {
            component = crear('editar', 48);
            component.form.controls.nombre.setValue('Lobo feroz');
            expect(component.hayCambios).toBeTrue();
            swal.and.resolveTo({ isConfirmed: false } as any);
            expect(await component.confirmarSalidaSiHayCambios()).toBeFalse();

            component.descartar();
            expect(component.hayCambios).toBeFalse();
            expect(component.form.controls.nombre.value).toBe('Lobo');
        });
    });
});
