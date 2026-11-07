import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { AlineamientoService } from 'src/app/services/alineamiento.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { ArmaService } from 'src/app/services/arma.service';
import { CategoriaEdadService, normalizarCategoriaEdad } from 'src/app/services/categoria-edad.service';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { DominioService } from 'src/app/services/dominio.service';
import { DoteService } from 'src/app/services/dote.service';
import { GrupoArmaService } from 'src/app/services/grupo-arma.service';
import { GrupoArmaduraService } from 'src/app/services/grupo-armadura.service';
import { HabilidadService } from 'src/app/services/habilidad.service';
import { IdiomaService } from 'src/app/services/idioma.service';
import { ManualService } from 'src/app/services/manual.service';
import { PrerrequisitosTiposService } from 'src/app/services/prerrequisitos-tipos.service';
import { RacialService } from 'src/app/services/racial.service';
import { RazaCatalogosService } from 'src/app/services/raza-catalogos.service';
import { RazaService } from 'src/app/services/raza.service';
import { SubtipoService } from 'src/app/services/subtipo.service';
import { TamanoService } from 'src/app/services/tamano.service';
import { TipoCriaturaService } from 'src/app/services/tipo-criatura.service';
import { UserService } from 'src/app/services/user.service';
import { normalizeRazaApi } from 'src/app/services/utils/raza-mapper';
import { CATALOGOS_IDA_Y_VUELTA_RAZAS as CATALOGOS, IDA_Y_VUELTA_RAZAS } from 'src/testing/ida-y-vuelta-razas';
import { NuevaRazaComponent } from './nueva-raza.component';
import { ModeloMutacion } from 'src/app/interfaces/razas-api';

function tipo(Clave: string, Sujeto: 'raza_base' | 'personaje', Catalogo: string | null,
              pide: { referencia?: boolean; cantidad?: boolean; texto?: boolean; }) {
    return {
        Clave, Nombre: Clave, Ejemplo: '', Sujeto, Dato: Clave, Comparador: 'es', Catalogo,
        Pide_referencia: pide.referencia === true, Pide_cantidad: pide.cantidad === true, Pide_texto: pide.texto === true,
    };
}

/** Lo que admite una raza mutada (`GET /razas/mutaciones/modelo`): los tipos que usa la prueba. */
const MODELO_MUTACION: ModeloMutacion = {
    Tipos_de_prerrequisito: [
        tipo('tipo_criatura', 'raza_base', 'tipos_criatura', { referencia: true }),
        tipo('alineamiento_requerido', 'personaje', 'alineamientos_basicos', { referencia: true }),
        tipo('condicion_master', 'personaje', null, { texto: true }),
        tipo('dgs_raciales_maximos', 'raza_base', null, { cantidad: true }),
    ],
    Campos: [], Operaciones: [], Catalogos: {},
};

/*
 * «Modificar raza» sin tocar nada manda el cuerpo con el que la API devuelve el mismo GET (hito 3 del roadmap de
 * inserciones): respuestas reales de `rol_dev` (`src/testing/ida-y-vuelta-razas.ts`), con las edades de los dragones y
 * los ids de sus pasos, que la API conserva.
 */
describe('NuevaRazaComponent (Modificar raza: guardar sin cambios)', () => {
    async function cargada(get: any): Promise<NuevaRazaComponent> {
        const razaSvc = jasmine.createSpyObj<RazaService>('RazaService', ['getRazas', 'getRazaFresca', 'getModeloMutacion']);
        razaSvc.getRazas.and.returnValue(of([]));
        razaSvc.getModeloMutacion.and.resolveTo(MODELO_MUTACION);
        razaSvc.getRazaFresca.and.returnValue(of(normalizeRazaApi(get)));
        await TestBed.configureTestingModule({
            imports: [ReactiveFormsModule],
            declarations: [NuevaRazaComponent],
            providers: [
                { provide: RazaService, useValue: razaSvc },
                { provide: PrerrequisitosTiposService, useValue: { cargar: () => Promise.resolve() } },
                { provide: UserService, useValue: {
                    acl$: new Subject<void>(), isLoggedIn$: new Subject<boolean>(), CurrentUserUid: 'uid-ida-y-vuelta',
                    can: () => true, getPermissionDeniedMessage: () => '',
                } },
                { provide: ManualService, useValue: { getManuales: () => of(CATALOGOS.manuales) } },
                { provide: ClaseService, useValue: { getClases: () => of(CATALOGOS.clases) } },
                { provide: TamanoService, useValue: { getTamanos: () => of(CATALOGOS.tamanos) } },
                { provide: TipoCriaturaService, useValue: { getTiposCriatura: () => of(CATALOGOS.tiposCriatura) } },
                { provide: AlineamientoService, useValue: {
                    getAlineamientosCombinacionesCatalogo: () => of(CATALOGOS.combinaciones),
                    getAlineamientosBasicosCatalogo: () => of(CATALOGOS.basicos),
                    getAlineamientosPrioridadesCatalogo: () => of(CATALOGOS.prioridades),
                    getAlineamientosPreferenciaLeyCatalogo: () => of(CATALOGOS.ley),
                    getAlineamientosPreferenciaMoralCatalogo: () => of(CATALOGOS.moral),
                } },
                { provide: SubtipoService, useValue: { getSubtipos: () => of([]) } },
                { provide: IdiomaService, useValue: { getIdiomas: () => of([]) } },
                { provide: HabilidadService, useValue: {
                    getHabilidades: () => of(CATALOGOS.habilidades), getHabilidadesCustom: () => of([]), habilidadesCustomMutadas$: new Subject<any>(),
                } },
                { provide: DoteService, useValue: { getDotes: () => of([]) } },
                { provide: RacialService, useValue: { getRaciales: () => of([]) } },
                { provide: ConjuroService, useValue: { getConjuros: () => of([]) } },
                { provide: DominioService, useValue: { getDominios: () => of(CATALOGOS.dominios) } },
                { provide: ArmaService, useValue: { getArmas: () => of([]) } },
                { provide: ArmaduraService, useValue: { getArmaduras: () => of([]) } },
                { provide: GrupoArmaService, useValue: { getGruposArmas: () => of([]) } },
                { provide: GrupoArmaduraService, useValue: { getGruposArmaduras: () => of([]) } },
                { provide: CategoriaEdadService, useValue: { getCategoriasEdad: () => of(CATALOGOS.categoriasEdad.map(normalizarCategoriaEdad)) } },
                { provide: RazaCatalogosService, useValue: {
                    getManiobrabilidades: () => of(CATALOGOS.maniobrabilidades), getTiposDado: () => of(CATALOGOS.tiposDado), getActitudes: () => of([]),
                } },
            ],
        }).overrideComponent(NuevaRazaComponent, { set: { template: '' } }).compileComponents();
        const fixture = TestBed.createComponent(NuevaRazaComponent);
        const component = fixture.componentInstance;
        component.modo = 'editar';
        component.idRaza = Number(get.i);
        fixture.detectChanges();
        await fixture.whenStable();
        return component;
    }

    IDA_Y_VUELTA_RAZAS.forEach(({ id, nombre, get, cuerpo }) => {
        it(`«${nombre}» (${id}) manda el cuerpo con el que la API devuelve el mismo GET`, async () => {
            const component = await cargada(get);

            expect(component.form.valid).toBeTrue();
            expect(component.edicion.hayCambios).toBeFalse();
            // Las respuestas se grabaron antes de las armas naturales como dato (2026-11-06) y de las demás clases
            // predilectas y la multiclase libre (2026-11-07): sin ellas en el GET, el cuerpo las manda vacías, que deja el
            // mismo GET.
            expect(JSON.parse(JSON.stringify(component.buildPayload())))
                .toEqual({ ...cuerpo, armas_naturales: [], clases_predilectas_extra: [], clases_multiclase_libre: [] });
            expect(component.porEdades).toBe((get.Categorias_edad ?? []).length > 0);
        });
    });

    it('conserva lo que una habilidad de la raza suma solo en un caso (`Cantidad_condicional` y `Condicion`)', async () => {
        const conHabilidades = IDA_Y_VUELTA_RAZAS.find((item) => (item.get.Habilidades?.Base ?? []).length > 0)!;
        const get = JSON.parse(JSON.stringify(conHabilidades.get));
        Object.assign(get.Habilidades.Base[0], { Cantidad_condicional: 2, Condicion: 'bajo tierra' });
        const component = await cargada(get);

        expect(component.edicion.hayCambios).toBeFalse();
        const base = component.buildPayload().habilidades?.base ?? [];
        expect(base[0]).toEqual(jasmine.objectContaining({ id_habilidad: get.Habilidades.Base[0].Id_habilidad, cantidad_condicional: 2, condicion: 'bajo tierra' }));
        expect(base.slice(1).every((item) => item.condicion === undefined)).toBeTrue();
    });

    it('una raza mutada manda lo que pide y lo que cambia tal como llegó (fase 3: `pr` y `Cambios_mutacion`)', async () => {
        const elfo = IDA_Y_VUELTA_RAZAS.find((item) => item.nombre === 'Elfo')!;
        const get = JSON.parse(JSON.stringify(elfo.get));
        const prerrequisito = (Id: number, Tipo: string, Sujeto: string, extra: Record<string, any>) => ({
            Id, Tipo, Sujeto, Id_referencia: null, Referencia: null, Cantidad: null, Texto: null, Opcional: 0, Frase: Tipo, ...extra,
        });
        Object.assign(get, {
            Mutada: true,
            pr: {
                tipo_criatura: [prerrequisito(1, 'tipo_criatura', 'raza_base', { Id_referencia: 11, Referencia: 'Humanoide' })],
                // El grupo «uno de estos» de los alineamientos (`Opcional`), por su básico.
                alineamiento_requerido: [
                    prerrequisito(2, 'alineamiento_requerido', 'personaje', { Id_referencia: 3, Opcional: 2 }),
                    prerrequisito(3, 'alineamiento_requerido', 'personaje', { Id_referencia: 9, Opcional: 2 }),
                ],
                condicion_master: [prerrequisito(4, 'condicion_master', 'personaje', { Texto: 'Completar el rito' })],
                // Un tipo que solo existe como datos en la base.
                dgs_raciales_maximos: [prerrequisito(5, 'dgs_raciales_maximos', 'raza_base', { Cantidad: 0 })],
            },
            Cambios_mutacion: [
                { Campo: 'Tamano', Nombre: 'Tamaño', Operacion: 'heredar', Valor: null, Elementos: [], Frase: '' },
                { Campo: 'Raciales', Nombre: 'Rasgos raciales', Operacion: 'quitar', Valor: null,
                  Elementos: [{ Id: 12, Nombre: 'Visión en la oscuridad' }], Frase: '' },
            ],
        });
        const component = await cargada(get);

        expect(component.edicion.hayCambios).toBeFalse();
        const cuerpo = component.buildPayload();
        expect(cuerpo.prerrequisitos_mutacion).toEqual([
            { tipo: 'tipo_criatura', id_referencia: 11 },
            { tipo: 'alineamiento_requerido', id_referencia: 3, opcional: 2 },
            { tipo: 'alineamiento_requerido', id_referencia: 9, opcional: 2 },
            { tipo: 'condicion_master', texto: 'Completar el rito' },
            { tipo: 'dgs_raciales_maximos', cantidad: 0 },
        ]);
        expect(cuerpo.cambios_mutacion).toEqual([
            { campo: 'Tamano', operacion: 'heredar' },
            { campo: 'Raciales', operacion: 'quitar', elementos: [12] },
        ]);
    });

    it('conserva sus otras clases predilectas y su multiclase libre (C3 y C4 de las razas mutadas, 2026-11-07)', async () => {
        const elfo = IDA_Y_VUELTA_RAZAS.find((item) => item.nombre === 'Elfo')!;
        // Como el iluminiano de `rol_dev` con otra predilecta: «Cualquiera» y guerrero; el paladín y el monje, libres.
        const get = JSON.parse(JSON.stringify(elfo.get));
        Object.assign(get, {
            c: 'Cualquiera', Clase_predilecta: { Id: 0, Nombre: 'Cualquiera' }, Id_clase_predilecta: 0, Clase_predilecta_comodin: 'cualquiera',
            Clases_predilectas_extra: [{ Id: 7, Nombre: 'Guerrero' }],
            Clases_multiclase_libre: [{ Id: 11, Nombre: 'Paladín' }, { Id: 10, Nombre: 'Monje' }],
        });
        const component = await cargada(get);

        expect(component.edicion.hayCambios).toBeFalse();
        const cuerpo = component.buildPayload();
        expect(cuerpo.raza.id_clase_predilecta).toBe(0);
        expect(cuerpo.clases_predilectas_extra).toEqual([7]);
        expect(cuerpo.clases_multiclase_libre).toEqual([10, 11]);

        // La principal no se repite entre las demás, y sin clase predilecta («Ninguna») no se manda ninguna.
        component.seleccionarClasePredilecta(7);
        expect(component.buildPayload().clases_predilectas_extra).toEqual([]);
        component.seleccionarClasePredilecta(-1);
        expect(component.tieneClasePredilecta).toBeFalse();
        expect(component.buildPayload().raza.id_clase_predilecta).toBeNull();
        expect(component.buildPayload().clases_predilectas_extra).toEqual([]);
    });

    it('una raza mutada que resta velocidad la conserva (la momia de Libris Mortis: `Correr: sumar`, -10)', async () => {
        const elfo = IDA_Y_VUELTA_RAZAS.find((item) => item.nombre === 'Elfo')!;
        // Como `GET /razas/1008` de `rol_dev` (la momia, 2026-11-07): `co` -10 y su cambio `Correr: sumar`.
        const get = JSON.parse(JSON.stringify(elfo.get));
        Object.assign(get, {
            Mutada: true,
            co: -10,
            Cambios_mutacion: [{ Campo: 'Correr', Nombre: 'Correr', Operacion: 'sumar', Valor: null, Elementos: [], Frase: '' }],
        });
        const component = await cargada(get);

        expect(component.form.controls.correr.valid).toBeTrue();
        expect(component.form.valid).toBeTrue();
        expect(component.edicion.hayCambios).toBeFalse();
        expect(component.buildPayload().raza.correr).toBe(-10);
        expect(component.buildPayload().cambios_mutacion).toEqual([{ campo: 'Correr', operacion: 'sumar' }]);

        // Sin mutar, una velocidad negativa no vale.
        component.form.controls.mutada.setValue(false);
        expect(component.form.controls.correr.hasError('min')).toBeTrue();
        expect(component.errorVelocidad).toBe('Entre 0 y 200.');
    });

    it('conserva sus armas naturales (`Armas_naturales`; el rakshasa de `rol_dev`: mordisco 1d6 y 2 garras 1d4)', async () => {
        const rakshasa = IDA_Y_VUELTA_RAZAS.find((item) => item.id === 427)!;
        const get = JSON.parse(JSON.stringify(rakshasa.get));
        get.Armas_naturales = [
            { Id_arma_natural: 1, Arma_natural: 'Mordisco', Cantidad: 1, Dano: '1d6', Primaria: true, Texto: 'Mordisco 1d6' },
            { Id_arma_natural: 2, Arma_natural: 'Garra', Cantidad: 2, Dano: '1d4', Primaria: true, Texto: '2 garras 1d4' },
        ];
        const component = await cargada(get);

        expect(component.edicion.hayCambios).toBeFalse();
        expect(component.buildPayload().armas_naturales).toEqual([
            { id_arma_natural: 1, cantidad: 1, dano: '1d6', primaria: true },
            { id_arma_natural: 2, cantidad: 2, dano: '1d4', primaria: true },
        ]);
    });

    it('un dragón conserva sus pasos por su id y cada categoría con lo que gana', async () => {
        const rojo = IDA_Y_VUELTA_RAZAS.find((item) => item.cuerpo.categorias_edad.length > 0 && item.get.Lanzamiento)!;
        const component = await cargada(rojo.get);

        const payload = component.buildPayload();
        const porNumero = (a: number, b: number) => a - b;
        expect((payload.pasos_edad ?? []).map((paso) => paso.id as number).sort(porNumero))
            .toEqual(rojo.get.Pasos_edad.map((paso: any) => paso.Id as number).sort(porNumero));
        expect(payload.categorias_edad?.length).toBe(rojo.get.Categorias_edad.length);
        expect(payload.raza.nivel_lanzamiento).toBe(0);
        expect(payload.categorias_edad?.some((categoria) => categoria.nivel_lanzamiento > 0)).toBeTrue();
    });
});
