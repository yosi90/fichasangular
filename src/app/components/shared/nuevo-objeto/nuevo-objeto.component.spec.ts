import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { ArmaService } from 'src/app/services/arma.service';
import { ArmaduraService } from 'src/app/services/armadura.service';
import { ConjuroService } from 'src/app/services/conjuro.service';
import { EquipoService } from 'src/app/services/equipo.service';
import { ManualService } from 'src/app/services/manual.service';
import { MonstruoService } from 'src/app/services/monstruo.service';
import { UserService } from 'src/app/services/user.service';
import { normalizeConjuntoObjetos, normalizeObjeto } from 'src/app/services/utils/equipo-mapper';
import { TipoObjetoEditable } from 'src/app/services/utils/objeto-formulario';
import { IDA_Y_VUELTA_OBJETOS } from 'src/testing/ida-y-vuelta-objetos';
import { NuevoObjetoComponent } from './nuevo-objeto.component';

describe('NuevoObjetoComponent', () => {
    let fixture: ComponentFixture<NuevoObjetoComponent>;
    let component: NuevoObjetoComponent;
    let equipoSvc: jasmine.SpyObj<EquipoService>;
    let puede = true;

    const catalogos = {
        Tipos_objeto: [{ Id: 13, Nombre: 'Anillo', Categoria: 'magico' }, { Id: 20, Nombre: 'Objeto maravilloso', Categoria: 'magico' }],
        Ranuras: [{ Id: 3, Nombre: 'Hombros', Maximo: 1 }],
        Intensidades_aura: [{ Id: 1, Nombre: 'Tenue' }],
        Tipos_activacion: [{ Id: 1, Nombre: 'Palabra de mando' }, { Id: 2, Nombre: 'Uso' }],
        Tipos_accion: [{ Id: 1, Nombre: 'Estándar' }],
    };

    async function montar(tipo: TipoObjetoEditable, modo: 'crear' | 'editar' = 'crear', get: any = null): Promise<void> {
        equipoSvc = jasmine.createSpyObj<EquipoService>('EquipoService', [
            'getCatalogos', 'getConjuntos', 'getMateriales', 'getEncantamientos', 'getObjetos', 'getObjeto', 'getConjuntoFresco',
            'crearObjeto', 'actualizarObjeto', 'crearConjunto', 'actualizarConjunto',
        ]);
        equipoSvc.getCatalogos.and.returnValue(of(catalogos as any));
        equipoSvc.getConjuntos.and.returnValue(of([{ Id: 22, Nombre: 'Regalía del fénix' }] as any));
        equipoSvc.getMateriales.and.returnValue(of([{ Id: 7, Nombre: 'Adamantita' }] as any));
        equipoSvc.getEncantamientos.and.returnValue(of([{ Id: 1, Nombre: 'Afilada' }] as any));
        equipoSvc.getObjetos.and.returnValue(of({ items: [normalizeObjeto({ Id: 40, Nombre: 'Yelmo del fénix' })], total: 1, hayMas: false }));
        if (get) {
            equipoSvc.getObjeto.and.returnValue(of(normalizeObjeto(get)));
            equipoSvc.getConjuntoFresco.and.returnValue(of(normalizeConjuntoObjetos(get)));
        }
        await TestBed.configureTestingModule({
            declarations: [NuevoObjetoComponent],
            imports: [ReactiveFormsModule, FormsModule, NoopAnimationsModule, MatAutocompleteModule, MatButtonModule, MatChipsModule,
                MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule],
            providers: [
                { provide: EquipoService, useValue: equipoSvc },
                { provide: ManualService, useValue: { getManuales: () => of([{ Id: 54, Nombre: 'Manual del jugador 1' }]) } },
                { provide: ArmaService, useValue: { getArmas: () => of([{ Id: 3, Nombre: 'Hacha de batalla' }]) } },
                { provide: ArmaduraService, useValue: { getArmaduras: () => of([{ Id: 4, Nombre: 'Coraza' }]) } },
                { provide: MonstruoService, useValue: { getMonstruos: () => of([{ Id: 9, Nombre: 'Caballo de guerra' }]) } },
                { provide: ConjuroService, useValue: { getConjuros: () => of([{ Id: 30, Nombre: 'Escudo' }]) } },
                {
                    provide: UserService, useValue: {
                        acl$: of({}), isLoggedIn$: of(true), can: (recurso: string) => puede && recurso === 'objetos',
                        getPermissionDeniedMessage: () => 'Sin permisos.',
                    },
                },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(NuevoObjetoComponent);
        component = fixture.componentInstance;
        component.tipo = tipo;
        component.modo = modo;
        component.idEntrada = get?.Id ?? null;
        fixture.detectChanges();
        await fixture.whenStable();
    }

    beforeEach(() => {
        puede = true;
        spyOn(Swal, 'fire').and.resolveTo({} as any);
    });

    afterEach(() => TestBed.resetTestingModule());

    describe('ida y vuelta (respuestas reales de rol_dev)', () => {
        IDA_Y_VUELTA_OBJETOS.objetos.forEach(({ id, nombre, get, cuerpo }) => {
            it(`objeto «${nombre}» (${id}): cargado y sin tocar, manda el cuerpo que devuelve el mismo GET`, async () => {
                await montar('objeto', 'editar', get);

                expect(component.edicion.cargando).toBeFalse();
                expect(component.edicion.hayCambios).toBeFalse();
                expect(component.cuerpo()).toEqual(cuerpo);
            });
        });

        IDA_Y_VUELTA_OBJETOS.conjuntos.forEach(({ id, nombre, get, cuerpo }) => {
            it(`conjunto «${nombre}» (${id}): cargado y sin tocar, manda el cuerpo que devuelve el mismo GET`, async () => {
                await montar('conjunto', 'editar', get);

                expect(component.edicion.hayCambios).toBeFalse();
                expect(component.cuerpo()).toEqual(cuerpo);
            });
        });
    });

    it('un conjunto nuevo: sus piezas se buscan en la API y van con sus bonificaciones', async () => {
        await montar('conjunto');
        equipoSvc.crearConjunto.and.resolveTo({ message: 'Conjunto de objetos creado exitosamente', id: 41, entrada: normalizeConjuntoObjetos({ Id: 41 }) });
        component.form.patchValue({ nombre: 'Regalía de prueba', id_manual: 54, pagina: 10 });
        component.anadirPieza({ Id: 40, Nombre: 'Yelmo del fénix' });
        component.anadirPieza({ Id: 40, Nombre: 'Yelmo del fénix' });
        component.anadirBonificacion();
        component.filas.bonificaciones[0].piezas = 2;
        component.filas.bonificaciones[0].descripcion = ' +1 a la CA. ';

        await component.guardar();

        expect(equipoSvc.crearConjunto).toHaveBeenCalledWith(jasmine.objectContaining({
            piezas: [40],
            bonificaciones: [{ piezas: 2, descripcion: '+1 a la CA.' }],
        }));
        expect(component.form.controls.id_tipo_objeto.hasError('required')).toBeFalse();
    });

    it('un genérico de un conjuro sin su fórmula avisa y lleva a su paso', async () => {
        await montar('objeto');
        component.form.patchValue({ nombre: 'Aceite', id_manual: 54, pagina: 3, id_tipo_objeto: 20 });
        component.alternar('es_generico_conjuro');

        await component.guardar();

        expect(equipoSvc.crearObjeto).not.toHaveBeenCalled();
        expect(component.problema?.campo).toBe('precio_por_nivel_conjuro');
        expect(component.pasoActual).toBe(2);
    });

    it('una sola base: elegir el arma quita la armadura; las aptitudes piden base', async () => {
        await montar('objeto');
        component.form.patchValue({ nombre: 'Hacha', id_manual: 54, pagina: 3, id_tipo_objeto: 20 });
        component.anadirAptitud(1);
        await component.guardar();
        expect(component.problema?.campo).toBe('encantamientos');

        component.elegir('id_armadura_base', 4);
        component.elegir('id_arma_base', 3);
        expect(component.form.controls.id_armadura_base.value).toBeNull();
        const cuerpo = component.cuerpo() as any;
        expect(cuerpo.objeto).toEqual(jasmine.objectContaining({ id_arma_base: 3, id_armadura_base: null }));
        expect(cuerpo.encantamientos).toEqual([{ id_encantamiento: 1, cabeza: 1 }]);
    });

    it('el error de la API en el tipo (la base de otro tipo) va a su campo y a su paso', async () => {
        const { get } = IDA_Y_VUELTA_OBJETOS.objetos[0];
        await montar('objeto', 'editar', get);
        equipoSvc.actualizarObjeto.and.rejectWith(new ProfileApiError('El tipo del objeto y su base no casan.', 'base_de_otro_tipo', 400, 'objeto.id_tipo_objeto'));
        component.pasoActual = 2;
        component.form.controls.precio.setValue(12345);

        await component.guardar();

        expect(component.errores.global).toBe('El tipo del objeto y su base no casan.');
        expect(component.errores.campo?.campo).toBe('id_tipo_objeto');
        expect(component.pasoActual).toBe(0);
    });

    it('sin el permiso objetos, el aviso ámbar y no se manda nada', async () => {
        puede = false;
        await montar('objeto');

        expect(component.edicion.avisoPermisos(component.puedeGuardar)).toContain('objetos');
        await component.guardar();
        expect(equipoSvc.crearObjeto).not.toHaveBeenCalled();
    });
});
