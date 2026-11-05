import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { ClaseService } from 'src/app/services/clase.service';
import { ConjuroCatalogosService } from 'src/app/services/conjuro-catalogos.service';
import { IncarnumService } from 'src/app/services/incarnum.service';
import { ManualService } from 'src/app/services/manual.service';
import { UserService } from 'src/app/services/user.service';
import { normalizarChakra, normalizarFusion } from 'src/app/services/utils/incarnum-mapper';
import { IDA_Y_VUELTA_RASGOS_VENTAJAS_INCARNUM } from 'src/testing/ida-y-vuelta-rasgos-ventajas-incarnum';
import { NuevaFusionComponent } from './nueva-fusion.component';

describe('NuevaFusionComponent', () => {
    let fixture: ComponentFixture<NuevaFusionComponent>;
    let component: NuevaFusionComponent;
    let incarnumSvc: jasmine.SpyObj<IncarnumService>;
    let puede = true;

    const chakras = [
        { Id: 34, Nombre: 'Corona', Orden: 1, Categoria: { Id: 19, Nombre: 'Mínimo', Orden: 1 } },
        { Id: 39, Nombre: 'Hombros', Orden: 6, Categoria: { Id: 20, Nombre: 'Menor', Orden: 2 } },
        { Id: 44, Nombre: 'Tótem', Orden: 11, Categoria: { Id: 24, Nombre: 'Tótem', Orden: 6 } },
    ].map(normalizarChakra);

    async function montar(modo: 'crear' | 'editar' = 'crear', get: any = null): Promise<void> {
        incarnumSvc = jasmine.createSpyObj<IncarnumService>('IncarnumService', ['getFusionFresca', 'guardarFusion', 'getChakras']);
        incarnumSvc.getChakras.and.returnValue(of(chakras));
        if (get)
            incarnumSvc.getFusionFresca.and.returnValue(of(normalizarFusion(get)));
        await TestBed.configureTestingModule({
            declarations: [NuevaFusionComponent],
            imports: [ReactiveFormsModule, FormsModule, NoopAnimationsModule, MatChipsModule, MatFormFieldModule, MatIconModule,
                MatInputModule, MatSelectModule],
            providers: [
                { provide: IncarnumService, useValue: incarnumSvc },
                { provide: ManualService, useValue: { getManuales: () => of([{ Id: 65, Nombre: 'Rol mapa mundi' }]) } },
                {
                    provide: ClaseService, useValue: {
                        getClases: () => of([
                            { Id: 405, Nombre: 'Encarnado', Moldeado: { Niveles: [] } },
                            { Id: 1, Nombre: 'Guerrero', Moldeado: null },
                        ]),
                    },
                },
                { provide: ConjuroCatalogosService, useValue: { getDescriptores: () => of([{ Id: 12, Nombre: 'Bueno' }]) } },
                {
                    provide: UserService, useValue: {
                        acl$: of({}), isLoggedIn$: of(true), can: (recurso: string) => puede && recurso === 'clases',
                        getPermissionDeniedMessage: () => 'Sin permisos.',
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(NuevaFusionComponent);
        component = fixture.componentInstance;
        component.modo = modo;
        component.idFusion = get?.Id ?? null;
        fixture.detectChanges();
        await fixture.whenStable();
    }

    beforeEach(() => {
        puede = true;
        spyOn(Swal, 'fire').and.resolveTo({} as any);
    });

    describe('ida y vuelta (respuestas reales de rol_dev)', () => {
        IDA_Y_VUELTA_RASGOS_VENTAJAS_INCARNUM.fusiones.forEach(({ id, nombre, get, cuerpo }) => {
            it(`«${nombre}» (${id}): cargada y sin tocar, manda el cuerpo que devuelve el mismo GET (sin los datos de juego)`, async () => {
                await montar('editar', get);

                expect(component.edicion.hayCambios).toBeFalse();
                expect(component.cuerpo()).toEqual(cuerpo);
                expect(JSON.stringify(component.cuerpo())).not.toContain('datos_');
            });
        });
    });

    it('solo ofrece las clases que moldean', async () => {
        await montar();
        expect(component.clasesOpciones.map((clase) => clase.nombre)).toEqual(['Encarnado']);
    });

    it('una fusión nueva con un chakra donde moldearla, su clase y su descriptor', async () => {
        await montar();
        incarnumSvc.guardarFusion.and.resolveTo({ message: 'Fusión creada exitosamente', id: 400, entrada: normalizarFusion({ Id: 400 }) });
        component.form.patchValue({ nombre: 'Capa de bruma', id_manual: 65, pagina: 3, salvacion_efecto: 'Ver texto' });
        component.chakras[0].id_chakra = 39;
        component.anadir('clases', 405);
        component.anadir('descriptores', 12);

        await component.guardar();

        const [cuerpo, id] = incarnumSvc.guardarFusion.calls.mostRecent().args;
        expect(id).toBeNull();
        expect(cuerpo.fusion.salvacion).toEqual({ tipo: null, efecto: 'Ver texto' });
        expect(cuerpo.clases).toEqual([405]);
        expect(cuerpo.descriptores).toEqual([12]);
        expect(cuerpo.chakras).toEqual([{ id_chakra: 39, ocupa: true, vinculo: true, efecto_vinculo: '' }]);
        expect(component.chakras.length).toBe(1);
        expect(component.chakras[0].id_chakra).toBeNull();
    });

    it('comprueba las reglas de los chakras antes de mandar', async () => {
        await montar();
        component.form.patchValue({ nombre: 'Capa', id_manual: 65, pagina: 3 });
        component.chakras[0].id_chakra = 44;
        component.alternarChakra(component.chakras[0], 'ocupa');

        await component.guardar();

        expect(incarnumSvc.guardarFusion).not.toHaveBeenCalled();
        expect(component.avisoDe('chakras')).toContain('moldearse en algún chakra');

        component.anadirChakra();
        component.chakras[1].id_chakra = 44;
        component.alternarChakra(component.chakras[0], 'ocupa');
        await component.guardar();
        expect(component.avisoDeFila(component.chakras[1])).toContain('ya está en la fusión');
        expect(component.chakrasLibres(component.chakras[1]).map((c) => c.Id)).toEqual([34, 39, 44]);
    });

    it('el 409 de una fusión en uso va a la lista de chakras', async () => {
        const { get } = IDA_Y_VUELTA_RASGOS_VENTAJAS_INCARNUM.fusiones[0];
        await montar('editar', get);
        incarnumSvc.guardarFusion.and.rejectWith(new ProfileApiError('Un personaje la moldea en un chakra que se quita.', 'fusion_en_uso', 409, 'chakras'));
        component.quitarChakra(component.chakras[component.chakras.length - 1].uid);
        component.anadirChakra();
        component.chakras[component.chakras.length - 1].id_chakra = 34;

        await component.guardar();

        expect(component.avisoDe('chakras')).toContain('Un personaje la moldea');
    });
});
