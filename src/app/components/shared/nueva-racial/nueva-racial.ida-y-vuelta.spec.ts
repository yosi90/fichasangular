import { FormBuilder } from '@angular/forms';
import { EMPTY, Subject, of } from 'rxjs';
import Swal from 'sweetalert2';
import { normalizeRacial } from 'src/app/services/utils/racial-mapper';
import { IDA_Y_VUELTA_RACIALES } from 'src/testing/ida-y-vuelta-raciales';
import { NuevaRacialComponent } from './nueva-racial.component';

/**
 * «Modificar racial» con la progresión, los bonificadores condicionales, la CD con todos los DG y el «cuenta como» (roadmap
 * `ACTIVO_razas-mutadas`, 2026-11-12): cargado con el GET real de `rol_dev`, guardar sin tocar nada manda el cuerpo con el
 * que la API devolvió ese mismo GET (`src/testing/ida-y-vuelta-raciales.ts`); y lo que la API rechazaría no se manda.
 */
describe('NuevaRacialComponent (progresión, bonificadores e ida y vuelta)', () => {
    let component: NuevaRacialComponent;
    let racialSvc: jasmine.SpyObj<any>;
    const OBJETIVOS = [
        { Id: 1, Nombre: 'CA', Lista_del_rasgo: null },
        { Id: 2, Nombre: 'Ataque', Lista_del_rasgo: null },
        { Id: 5, Nombre: 'Fortaleza', Lista_del_rasgo: 'salvaciones' },
        { Id: 9, Nombre: 'Habilidad', Lista_del_rasgo: 'habilidades' },
    ];
    const TIPOS = [{ Id: 8, Nombre: 'Esquiva', Apila: true }, { Id: 14, Nombre: 'Racial', Apila: false }];

    const editar = (get: any) => {
        racialSvc.getRacial.and.returnValue(of(normalizeRacial(get)));
        component.modo = 'editar';
        component.idRacial = get.Id;
        component.ngOnChanges({
            modo: { currentValue: 'editar', previousValue: 'crear', firstChange: false, isFirstChange: () => false },
            idRacial: { currentValue: get.Id, previousValue: null, firstChange: false, isFirstChange: () => false },
        });
    };

    beforeEach(() => {
        racialSvc = jasmine.createSpyObj('RacialService', ['crearRacial', 'actualizarRacial', 'getRacial', 'getRaciales']);
        racialSvc.getRaciales.and.returnValue(of([{ Id: 12, Nombre: 'Visión en la oscuridad 60\'' }, { Id: 13, Nombre: 'Vuelo' }]));
        racialSvc.actualizarRacial.and.resolveTo({ message: 'Actualizado', idRacial: 41, racial: normalizeRacial({ Id: 41 }) });
        component = new NuevaRacialComponent(
            new FormBuilder(),
            {
                acl$: new Subject<void>().asObservable(),
                isLoggedIn$: new Subject<boolean>().asObservable(),
                can: () => true,
                getPermissionDeniedMessage: () => 'Sin permisos suficientes.',
            } as any,
            racialSvc as any,
            { getDotes: () => of([{ Id: 5, Nombre: 'Alerta', Tipos: [{ Id: 30, Nombre: 'Tocado por diablos', Usado: 1 }] }]) } as any,
            { getHabilidades: () => of([]), getHabilidadesCustom: () => of([]), habilidadesCustomMutadas$: EMPTY } as any,
            { getConjuros: () => of([]) } as any,
            { getRazas: () => of([{ Id: 2, Nombre: 'Elfo' }, { Id: 24, Nombre: 'Elfo (MJ)' }]) } as any,
            { cargar: () => Promise.resolve() } as any,
            { getCatalogos: () => of({ Objetivos_modificador: OBJETIVOS, Tipos_bonificador: TIPOS }) } as any,
            { getManiobrabilidades: () => of([{ Id: 0, Nombre: 'No vuela' }, { Id: 3, Nombre: 'Regular' }]) } as any,
            { getTiposCriatura: () => of([{ Id: 10, Nombre: 'Gigante' }]) } as any,
            { getSubtipos: () => of([{ Id: 68, Nombre: 'Orco' }]) } as any,
        );
        spyOn(Swal, 'fire').and.returnValue(Promise.resolve({ isConfirmed: true } as any));
        component.ngOnInit();
    });

    afterEach(() => component.ngOnDestroy());

    IDA_Y_VUELTA_RACIALES.forEach(({ nombre, get, cuerpo }) => {
        it(`guardar sin tocar nada manda el cuerpo de la ida y vuelta: ${nombre}`, () => {
            editar(get);
            expect((component as any).construirPayload()).toEqual(cuerpo);
            expect(component.isDirty).toBeFalse();
        });
    });

    it('la muestra tiene progresión, bonificadores, la CD, el «cuenta como» y una habilidad con «Elegir» y su condición', () => {
        const cuerpos = IDA_Y_VUELTA_RACIALES.map((caso) => caso.cuerpo);
        expect(cuerpos.some((c) => (c.progresion ?? []).some((p) => p.velocidad?.id_maniobrabilidad))).toBeTrue();
        expect(cuerpos.some((c) => (c.progresion ?? []).some((p) => p.id_tipo_dote))).toBeTrue();
        expect(cuerpos.some((c) => (c.progresion ?? []).some((p) => p.valor))).toBeTrue();
        expect(cuerpos.some((c) => (c.bonificadores_condicionales ?? []).some((b) => b.contra.length > 0))).toBeTrue();
        expect(cuerpos.some((c) => c.racial.id_caracteristica_cd)).toBeTrue();
        expect(cuerpos.some((c) => (c.habilidades?.base ?? []).some((h) => h.id_extra === 0 && h.condicion))).toBeTrue();
        expect(cuerpos.some((c) => (c.progresion ?? []).some((p) => p.elige_opcional))).toBeTrue();
        expect(cuerpos.some((c) => c.racial.cd_dg_totales === true)).toBeTrue();
        expect(cuerpos.some((c) => (c.cuenta_como ?? []).some((f) => 'id_raza' in f))).toBeTrue();
        expect(cuerpos.some((c) => (c.cuenta_como ?? []).some((f) => 'id_tipo' in f))).toBeTrue();
        expect(cuerpos.some((c) => (c.bonificadores_condicionales ?? []).some((b) => b.condicion === '' && b.contra.length === 0))).toBeTrue();
    });

    it('la elección de un grupo opcional, la CD con todos los DG y el «cuenta como» se cambian y se mandan', () => {
        const sigilos = IDA_Y_VUELTA_RACIALES.find((caso) => (caso.cuerpo.progresion ?? []).some((p) => p.elige_opcional))!;
        editar(sigilos.get);
        component.progresionRows[0].elige_opcional = 2;
        component.form.patchValue({ id_caracteristica_cd: 6 });
        component.toggleCdDgTotales();
        component.anadirCuentaComo('tipo_criatura', 10);
        component.anadirCuentaComo('raza', 24);
        component.anadirCuentaComo('raza', 24);

        const payload = (component as any).construirPayload();

        expect(component.isDirty).toBeTrue();
        expect(payload.progresion[0].elige_opcional).toBe(2);
        expect(payload.racial).toEqual(jasmine.objectContaining({ id_caracteristica_cd: 6, cd_dg_totales: true }));
        expect(payload.cuenta_como).toEqual([{ id_tipo: 10 }, { id_raza: 24 }]);
        expect(component.filasCuentaComo('raza').map((f) => f.nombre)).toEqual(['Elfo (MJ)']);
        expect(component.textoCd).toBe('La CD: 10 + ½ de todos sus DG + su modificador de Carisma.');

        component.quitarCuentaComo(component.filasCuentaComo('tipo_criatura')[0]);
        component.form.patchValue({ id_caracteristica_cd: 0 });
        component.alCambiarCaracteristicaCd();

        expect((component as any).construirPayload().cuenta_como).toEqual([{ id_raza: 24 }]);
        expect(component.form.controls.cd_dg_totales.value).toBeFalse();
        expect(component.muestraCdDgTotales).toBeFalse();
    });

    it('al quitar el «cuenta como» que tenía, manda la lista vacía (la API lo quita)', () => {
        const sangre = IDA_Y_VUELTA_RACIALES.find((caso) => (caso.cuerpo.cuenta_como ?? []).length > 0)!;
        editar(sangre.get);
        component.cuentaComoRows.forEach((fila) => component.quitarCuentaComo(fila));

        expect((component as any).construirPayload().cuenta_como).toEqual([]);
        expect(component.isDirty).toBeTrue();
    });

    it('las filas nuevas van al cuerpo con lo que tienen', () => {
        component.form.patchValue({ nombre: 'Alas de prueba' });
        component.agregarProgresion();
        const fila = component.progresionRows[0];
        fila.desde = 6;
        fila.velocidad = 'volar';
        fila.pies = 30;
        fila.id_maniobrabilidad = 3;
        component.elegirRasgoProgresion(fila, 'id_racial_gana', 13);
        component.agregarBonificador();
        const bonificador = component.bonificadoresRows[0];
        Object.assign(bonificador, { id_objetivo: 2, id_tipo_bonificador: 14, cantidad: 1, condicion: 'contra orcos' });
        bonificador.catalogoContra = 'subtipo';
        component.anadirContra(bonificador, 68);

        const payload = (component as any).construirPayload();

        expect(payload.progresion).toEqual([
            { medida: 'dg', desde: 6, id_racial_gana: 13, velocidad: { tipo: 'volar', pies: 30, id_maniobrabilidad: 3 } },
        ]);
        expect(payload.bonificadores_condicionales).toEqual([
            { id_objetivo: 2, id_tipo_bonificador: 14, cantidad: 1, condicion: 'contra orcos', contra: [{ id_subtipo: 68 }] },
        ]);
        expect(component.bonificadoresRows[0].contra[0].nombre).toBe('Orco');
    });

    it('al quitar el movimiento o dejar de volar se van los pies y la maniobrabilidad', () => {
        component.agregarProgresion();
        const fila = component.progresionRows[0];
        Object.assign(fila, { desde: 6, velocidad: 'volar', pies: 30, id_maniobrabilidad: 3 });
        fila.velocidad = 'nadar';
        component.cambiarVelocidadProgresion(fila);
        expect(fila.id_maniobrabilidad).toBeNull();
        expect(fila.pies).toBe(30);
        fila.velocidad = null;
        component.cambiarVelocidadProgresion(fila);
        expect(fila.pies).toBeNull();
    });

    it('no ofrece como bonificador condicional lo que va en su lista ni el propio rasgo en la progresión', () => {
        component.agregarBonificador();
        expect(component.objetivosDeBonificador(component.bonificadoresRows[0]).map((o) => o.Id)).toEqual([1, 2]);
        expect(component.tiposDoteOpciones).toEqual([{ id: 30, nombre: 'Tocado por diablos' }]);
        expect(component.maniobrabilidades).toEqual([{ id: 3, nombre: 'Regular' }]);
        editar({ ...IDA_Y_VUELTA_RACIALES[0].get, Id: 12 });
        expect(component.racialesParaProgresion.map((r) => r.id)).toEqual([13]);
    });

    it('lo que la API rechazaría no se manda: lo dice en su tarjeta y salta a su paso', async () => {
        component.form.patchValue({ nombre: 'Rasgo de prueba' });
        component.agregarProgresion();
        component.progresionRows[0].desde = 4;

        await component.guardarRacial();

        expect(racialSvc.crearRacial).not.toHaveBeenCalled();
        expect(component.errorProgresion).toContain('tiene que dar o cambiar algo');
        expect(component.pasoActual).toBe(2);

        component.progresionRows = [];
        component.agregarBonificador();
        Object.assign(component.bonificadoresRows[0], { id_objetivo: 5, id_tipo_bonificador: 14, cantidad: 2, condicion: 'contra veneno' });

        await component.guardarRacial();

        expect(racialSvc.crearRacial).not.toHaveBeenCalled();
        expect(component.errorProgresion).toBeNull();
        expect(component.errorBonificadores).toContain('las salvaciones van en «Salvaciones»');
        expect(component.pasoActual).toBe(3);

        component.bonificadoresRows = [];
        component.agregarProgresion();
        Object.assign(component.progresionRows[0], { medida: 'nivel', desde: 2, elige_opcional: 100 });

        await component.guardarRacial();

        expect(racialSvc.crearRacial).not.toHaveBeenCalled();
        expect(component.errorProgresion).toContain('«Otro rasgo del grupo opcional» va de 1 a 99');
        expect(component.pasoActual).toBe(2);

        component.progresionRows[0].elige_opcional = 1;
        component.anadirCuentaComo('raza', 24);
        component.cuentaComoRows = [...component.cuentaComoRows, { ...component.cuentaComoRows[0], uid: 'otra' }];

        await component.guardarRacial();

        expect(racialSvc.crearRacial).not.toHaveBeenCalled();
        expect(component.errorCuentaComo).toContain('está repetido');
        expect(component.pasoActual).toBe(0);
    });
});
