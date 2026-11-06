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

/*
 * «Modificar raza» sin tocar nada manda el cuerpo con el que la API devuelve el mismo GET (hito 3 del roadmap de
 * inserciones): respuestas reales de `rol_dev` (`src/testing/ida-y-vuelta-razas.ts`), con las edades de los dragones y
 * los ids de sus pasos, que la API conserva.
 */
describe('NuevaRazaComponent (Modificar raza: guardar sin cambios)', () => {
    async function cargada(get: any): Promise<NuevaRazaComponent> {
        const razaSvc = jasmine.createSpyObj<RazaService>('RazaService', ['getRazas', 'getRazaFresca']);
        razaSvc.getRazas.and.returnValue(of([]));
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
        await Promise.resolve();
        return component;
    }

    IDA_Y_VUELTA_RAZAS.forEach(({ id, nombre, get, cuerpo }) => {
        it(`«${nombre}» (${id}) manda el cuerpo con el que la API devuelve el mismo GET`, async () => {
            const component = await cargada(get);

            expect(component.form.valid).toBeTrue();
            expect(component.edicion.hayCambios).toBeFalse();
            expect(JSON.parse(JSON.stringify(component.buildPayload()))).toEqual(cuerpo);
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
