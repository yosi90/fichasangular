import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ProfileApiError } from 'src/app/interfaces/user-account';
import { CategoriaEdadService } from 'src/app/services/categoria-edad.service';
import { categoriaVacia, pasoAlEmpezar } from 'src/app/services/utils/raza-edades-formulario';
import { RazaEdadesComponent } from './raza-edades.component';

const CATALOGO = [
    { Id: 1, Nombre: 'Cría', Orden_tipico: 1, Oficial: true, Manual: { Id: 1, Nombre: 'Manual', Pagina: 74 } },
    { Id: 3, Nombre: 'Joven', Orden_tipico: 3, Oficial: true, Manual: { Id: 1, Nombre: 'Manual', Pagina: 74 } },
    { Id: 6, Nombre: 'Adulto', Orden_tipico: 6, Oficial: true, Manual: { Id: 1, Nombre: 'Manual', Pagina: 74 } },
];

describe('RazaEdadesComponent', () => {
    let fixture: ComponentFixture<RazaEdadesComponent>;
    let component: RazaEdadesComponent;
    let categoriaSvc: jasmine.SpyObj<CategoriaEdadService>;
    let cambios: number;

    beforeEach(async () => {
        categoriaSvc = jasmine.createSpyObj<CategoriaEdadService>('CategoriaEdadService', ['crearCategoriaEdad']);
        await TestBed.configureTestingModule({
            declarations: [RazaEdadesComponent],
            providers: [{ provide: CategoriaEdadService, useValue: categoriaSvc }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(RazaEdadesComponent);
        component = fixture.componentInstance;
        component.categoriasCatalogo = CATALOGO;
        component.porEdades = true;
        component.opcionesRaciales = [{ id: 9, nombre: 'Aliento (dragón)' }];
        component.opcionesConjuros = [{ id: 5, nombre: 'Luz' }];
        const cria = { ...categoriaVacia(), id_categoria_edad: 1, edad_desde: 0, edad_hasta: 9, dgs: 4, ajuste_nivel: 3 };
        component.edades = { categorias: [cria], pasos: [pasoAlEmpezar(cria)] };
        cambios = 0;
        component.cambio.subscribe(() => cambios++);
        fixture.detectChanges();
    });

    it('añade una categoría después de la última y quita una con sus pasos', () => {
        component.agregarCategoria();
        const [, nueva] = component.edades.categorias;
        expect(nueva.edad_desde).toBe(10);
        expect(component.textoAnios(nueva)).toBe('10 o más');
        expect(component.categoriasLibres(nueva).map((categoria) => categoria.Id)).toEqual([3, 6]);

        component.elegirCategoria(nueva, 3);
        component.agregarPasosQueFaltan();
        expect(component.edades.pasos.map((paso) => [paso.edad, paso.id_categoria_edad])).toEqual([[0, 1], [10, 3]]);
        expect(component.faltanPasos).toBeFalse();

        component.quitarCategoria(0);
        expect(component.edades.categorias.length).toBe(1);
        expect(component.edades.pasos.map((paso) => paso.id_categoria_edad)).toEqual([3]);
        expect(cambios).toBeGreaterThan(0);
    });

    it('cambiar la categoría de una fila se lleva sus pasos', () => {
        component.elegirCategoria(component.edades.categorias[0], 6);
        expect(component.edades.pasos[0].id_categoria_edad).toBe(6);
        expect(component.nombreCategoria(6)).toBe('Adulto');
    });

    it('los campos vacíos que admiten nulo (sin tope, sin ajuste, sin VD) quedan nulos', () => {
        const fila = component.edades.categorias[0];
        component.numero(fila, 'edad_hasta', '');
        component.numero(fila, 'ajuste_nivel', '');
        component.numero(fila, 'espacio', '2.5');
        component.numero(fila, 'dgs', '7');
        expect([fila.edad_hasta, fila.ajuste_nivel, fila.espacio, fila.dgs]).toEqual([null, null, 2.5, 7]);
        expect(component.nivelDelPaso(component.edades.pasos[0])).toBe('Solo PNJ');
    });

    it('lo que gana: raciales con su cifra y sortílegas con sus usos, sin repetir', () => {
        const fila = component.edades.categorias[0];
        component.agregarRacial(fila, 9);
        component.agregarRacial(fila, 9);
        component.valorRacial(fila, 0, "Cono de 15' (1d6)");
        component.agregarSortilega(fila, 5);
        component.textoSortilega(fila, 0, 'usos_diarios', '3/día');
        expect(fila.raciales).toEqual([{ id_racial: 9, nombre: 'Aliento (dragón)', valor: "Cono de 15' (1d6)" }]);
        expect(fila.sortilegas).toEqual([{ id_conjuro: 5, nombre: 'Luz', usos_diarios: '3/día', descripcion: '' }]);
        expect(component.idsRaciales(fila)).toEqual([9]);

        component.quitarRacial(fila, 0);
        component.quitarSortilega(fila, 0);
        expect([fila.raciales.length, fila.sortilegas.length]).toEqual([0, 0]);
    });

    it('el paso dice si es jugable: NEP con ajuste en él y en su categoría, si no «Solo PNJ»', () => {
        expect(component.nivelDelPaso(component.edades.pasos[0])).toBe('NEP 7');
        component.numeroPaso(component.edades.pasos[0], 'ajuste_nivel', '');
        expect(component.nivelDelPaso(component.edades.pasos[0])).toBe('Solo PNJ');
    });

    it('crea una categoría nueva en el catálogo y la avisa', async () => {
        const creada = { Id: 13, Nombre: 'Anciano', Orden_tipico: 13, Oficial: false, Manual: { Id: 1, Nombre: 'Manual', Pagina: 0 } };
        categoriaSvc.crearCategoriaEdad.and.resolveTo({ message: 'ok', categoria: creada });
        const avisadas: any[] = [];
        component.categoriaCreada.subscribe((categoria) => avisadas.push(categoria));

        component.abrirNuevaCategoria();
        expect(component.nuevaCategoria.orden_tipico).toBe(7);
        await component.crearCategoria();
        expect(component.errorNuevaCategoria).toContain('Escribe el nombre');

        component.nuevaCategoria = { nombre: ' Anciano ', orden_tipico: 13, id_manual: 1, pagina: 0, oficial: false };
        await component.crearCategoria();
        expect(categoriaSvc.crearCategoriaEdad).toHaveBeenCalledWith({
            categoria: { nombre: 'Anciano', orden_tipico: 13, id_manual: 1, pagina: 0, oficial: false },
        });
        expect(avisadas).toEqual([creada]);
        expect(component.nuevaCategoriaVisible).toBeFalse();
    });

    it('si la API rechaza la categoría nueva, dice por qué', async () => {
        categoriaSvc.crearCategoriaEdad.and.rejectWith(new ProfileApiError('Ya existe una categoría de edad con ese nombre.', 'nombre_duplicado', 409, 'categoria.nombre'));
        component.abrirNuevaCategoria();
        component.nuevaCategoria = { nombre: 'Cría', orden_tipico: 1, id_manual: 1, pagina: 0, oficial: true };

        await component.crearCategoria();

        expect(component.errorNuevaCategoria).toBe('Ya existe una categoría de edad con ese nombre.');
        expect(component.nuevaCategoriaVisible).toBeTrue();
    });
});
