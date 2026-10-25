import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { DescripcionEquipoComponent } from 'src/app/components/shared/descripcion-equipo/descripcion-equipo.component';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { EntradaEquipo } from 'src/app/interfaces/equipo';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import {
    normalizeConjuntoObjetos,
    normalizeEncantamiento,
    normalizeMaterial,
    normalizeMunicion,
    normalizeObjeto,
} from 'src/app/services/utils/equipo-mapper';
import {
    crearArmaEspecificaApi,
    crearConjuntoApi,
    crearEncantamientoApi,
    crearMaterialApi,
    crearMunicionApi,
    crearObjetoApi,
    crearObjetoGenericoApi,
} from 'src/testing/equipo-api';
import { textoPrecio } from 'src/app/services/utils/equipo-texto';
import { DetallesEquipoComponent } from './detalles-equipo.component';

describe('DetallesEquipoComponent', () => {
    let fixture: ComponentFixture<DetallesEquipoComponent>;
    let component: DetallesEquipoComponent;
    let manualNav: jasmine.SpyObj<ManualDetalleNavigationService>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const texto = (): string => `${elemento().textContent ?? ''}`.replace(/\s+/g, ' ');
    const tipo = (): string => `${elemento().querySelector('.ficha-cabecera__tipo')?.textContent ?? ''}`.trim();
    const etiquetas = (): string[] => Array.from(elemento().querySelectorAll('.ficha-datos-contenedor--tarjeta .ficha-dato dt'))
        .map((dt) => `${dt.textContent ?? ''}`.trim());
    /** El valor de un dato clave, o de uno de la creación. */
    const valor = (etiqueta: string): string | null => {
        const dato = Array.from(elemento().querySelectorAll('.ficha-dato'))
            .find((d) => `${d.querySelector('dt')?.textContent ?? ''}`.trim() === etiqueta);
        return dato ? `${dato.querySelector('dd')?.textContent ?? ''}`.replace(/\s+/g, ' ').trim() : null;
    };
    const titulos = (): string[] => Array.from(elemento().querySelectorAll('.ficha-titulo')).map((t) => `${t.textContent ?? ''}`.trim());
    const enlace = (nombre: string): HTMLButtonElement => Array.from(elemento().querySelectorAll('button.ficha-enlace'))
        .find((b) => `${b.textContent ?? ''}`.trim() === nombre) as HTMLButtonElement;
    /** Las filas de la tabla de un bloque, con sus celdas separadas por « · ». */
    const filas = (titulo: string): string[] => {
        const bloque = Array.from(elemento().querySelectorAll('.ficha-bloque'))
            .find((b) => `${b.querySelector('.ficha-titulo')?.textContent ?? ''}`.trim() === titulo);
        return Array.from(bloque?.querySelectorAll('tr') ?? []).map((tr) => Array.from(tr.querySelectorAll('th, td'))
            .map((celda) => `${celda.textContent ?? ''}`.replace(/\s+/g, ' ').trim()).join(' · '));
    };

    beforeEach(async () => {
        manualNav = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);
        await TestBed.configureTestingModule({
            declarations: [DetallesEquipoComponent, TextoManualComponent, DescripcionEquipoComponent, ...FICHA_DETALLE_COMPONENTES],
            providers: [{ provide: ManualDetalleNavigationService, useValue: manualNav }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(DetallesEquipoComponent);
        component = fixture.componentInstance;
    });

    function mostrar(entrada: EntradaEquipo): void {
        component.entrada = entrada;
        fixture.detectChanges();
    }

    it('un objeto enseña su tipo, ranura, aura, modificadores y creación, sin pastillas', () => {
        mostrar({ tipo: 'objeto', item: normalizeObjeto(crearObjetoApi()) });
        expect(elemento().querySelector('.ficha-cabecera__nombre')?.textContent?.trim()).toBe('Capa de resistencia +1');
        expect(tipo()).toBe('Objeto maravilloso · Mágico');
        expect(elemento().querySelector('.ficha-cabecera__manual')?.textContent).toContain('Guia del dungeon master 1 · pág. 253');
        expect(valor('Precio')).toBe(textoPrecio(1000));
        expect(valor('Ranura')).toBe('Hombros');
        expect(valor('Aura')).toBe('Débil, abjuración');
        expect(valor('Nivel de lanzador')).toBe('5');
        expect(valor('Activación')).toBe('Uso o continuo');
        expect(texto()).toContain('Salvaciones +1 (resistencia)');
        expect(titulos()).toEqual(jasmine.arrayContaining(['Descripción', 'Modificadores', 'Creación']));
        expect(valor('Coste')).toBe(textoPrecio(500));
        expect(valor('PX')).toBe('40');
        expect(enlace('Crear objeto maravilloso')).toBeTruthy();
        expect(enlace('Resistencia')).toBeTruthy();
        expect(elemento().querySelector('mat-chip')).toBeNull();
    });

    it('no enseña lo que la API da null ni lo vacío', () => {
        mostrar({ tipo: 'objeto', item: normalizeObjeto(crearObjetoApi()) });
        for (const etiqueta of ['Arma base', 'Armadura base', 'Mejora', 'Material', 'Nivel de objeto', 'Cargas', 'Usos al día', 'Para usarlo', 'Montura', 'Conjunto'])
            expect(etiquetas()).not.toContain(etiqueta);
        expect(valor('Otros requisitos')).toBeNull();
        expect(titulos()).not.toContain('Aptitudes especiales');
        expect(titulos()).not.toContain('Conjuros');
        expect(texto()).not.toContain('null');
    });

    it('la descripción va con su origen y, si está traducida, con el nombre original', () => {
        mostrar({ tipo: 'objeto', item: normalizeObjeto(crearObjetoApi({ Traducido: true })) });
        expect(texto()).toContain('Una capa que protege a quien la lleva.');
        expect(texto()).toContain('Descripción propia');
        expect(texto()).toContain('Traducido: Cloak of resistance +1');
    });

    it('abre las dotes y los conjuros de la creación', () => {
        const dote = spyOn(component.doteDetallesId, 'emit');
        const conjuro = spyOn(component.conjuroDetallesId, 'emit');
        mostrar({ tipo: 'objeto', item: normalizeObjeto(crearObjetoApi()) });
        enlace('Crear objeto maravilloso').click();
        enlace('Resistencia').click();
        expect(dote).toHaveBeenCalledWith(300);
        expect(conjuro).toHaveBeenCalledWith(2);
    });

    it('los conjuros de un objeto van en una tabla, sin las columnas vacías', () => {
        const conjuro = spyOn(component.conjuroDetallesId, 'emit');
        mostrar({ tipo: 'objeto', item: normalizeObjeto(crearObjetoApi({
            Conjuros: [{ Id: 9, Nombre: 'Proyectil mágico', Nivel_lanzador: 3, Cargas_por_uso: null, Usos_por_dia: 2 }],
        })) });
        expect(filas('Conjuros')).toEqual(['Conjuro · Nivel de lanzador · Usos al día', 'Proyectil mágico · 3 · 2/día']);
        enlace('Proyectil mágico').click();
        expect(conjuro).toHaveBeenCalledWith(9);
    });

    it('un genérico de un conjuro enseña la fórmula del precio', () => {
        mostrar({ tipo: 'objeto', item: normalizeObjeto(crearObjetoGenericoApi()) });
        expect(valor('Precio')).toBe('50 po × nivel del conjuro × nivel de lanzador');
        expect(valor('Conjuros hasta el nivel')).toBe('3');
    });

    it('un material enseña sus efectos, sus propiedades y sus costes en una tabla', () => {
        mostrar({ tipo: 'material', item: normalizeMaterial(crearMaterialApi()) });
        expect(tipo()).toBe('Material especial');
        expect(valor('Dureza')).toBe('15');
        expect(valor('Peso')).toBe('×0,5');
        expect(valor('Destreza máxima')).toBe('+2');
        expect(etiquetas()).not.toContain('Daño');
        expect(texto()).toContain('Cuenta como de gran calidad');
        expect(texto()).toContain('La armadura cuenta una categoría más ligera');
        expect(texto()).not.toContain('Supera la reducción de daño');
        expect(filas('Coste según a qué se aplica')).toEqual([
            'Se aplica a · Coste',
            `Armadura ligera · +${textoPrecio(1000)}`,
            `Escudo · +${textoPrecio(1000)}`,
        ]);
    });

    it('la munición enseña su lote y abre las armas que la disparan', () => {
        const emit = spyOn(component.armaDetallesId, 'emit');
        mostrar({ tipo: 'municion', item: normalizeMunicion(crearMunicionApi()) });
        expect(tipo()).toBe('Munición');
        expect(valor('Precio')).toBe('1 po las 20');
        expect(valor('Peso')).toBe('3 lb las 20');
        enlace('Arco corto').click();
        expect(emit).toHaveBeenCalledWith(48);
    });

    it('una aptitud especial enseña su bonificador, a qué se aplica y sus requisitos', () => {
        const dote = spyOn(component.doteDetallesId, 'emit');
        mostrar({ tipo: 'encantamiento', item: normalizeEncantamiento(crearEncantamientoApi()) });
        expect(tipo()).toBe('Aptitud especial');
        expect(valor('Bonificador equivalente')).toBe('+1');
        expect(valor('Se aplica a')).toBe('armas cuerpo a cuerpo');
        expect(valor('Solo armas')).toBe('perforante, cortante');
        expect(etiquetas()).not.toContain('Precio');
        expect(etiquetas()).not.toContain('Requiere antes');
        expect(titulos()).toContain('Requisitos para crearla');
        enlace('Fabricar armas y armaduras mágicas').click();
        expect(dote).toHaveBeenCalledWith(332);
    });

    it('una aptitud que pide otra antes la enlaza', () => {
        const emit = spyOn(component.equipoDetalles, 'emit');
        mostrar({ tipo: 'encantamiento', item: normalizeEncantamiento(crearEncantamientoApi({ Encantamiento_base: { Id: 4, Nombre: 'Llameante' }, Es_plantilla: true })) });
        expect(valor('Requiere antes')).toBe('Llameante');
        expect(Array.from(elemento().querySelectorAll('.ficha-etiqueta')).map((e) => e.textContent?.trim())).toContain('Plantilla');
        enlace('Llameante').click();
        expect(emit).toHaveBeenCalledWith({ tipo: 'encantamiento', id: 4 });
    });

    it('un conjunto abre sus piezas y enseña sus bonificaciones en una tabla', () => {
        const emit = spyOn(component.equipoDetalles, 'emit');
        mostrar({ tipo: 'conjunto', item: normalizeConjuntoObjetos(crearConjuntoApi()) });
        expect(tipo()).toBe('Conjunto de objetos');
        expect(filas('Bonificaciones del conjunto')).toEqual(['Piezas · Bonificación', '2 · +1 a las pruebas de nivel de lanzador.']);
        enlace('Capa de resistencia +1').click();
        expect(emit).toHaveBeenCalledWith({ tipo: 'objeto', id: 40 });
    });

    it('abre el manual desde la cabecera', () => {
        mostrar({ tipo: 'municion', item: normalizeMunicion(crearMunicionApi()) });
        (elemento().querySelector('button.ficha-cabecera__manual') as HTMLButtonElement).click();
        expect(manualNav.abrirDetalleManual).toHaveBeenCalledWith({ id: 54, nombre: 'Manual del jugador 1' });
    });

    it('un arma mágica específica enseña su arma base (que se abre), su mejora y sus aptitudes', () => {
        const arma = spyOn(component.armaDetallesId, 'emit');
        const equipo = spyOn(component.equipoDetalles, 'emit');
        mostrar({ tipo: 'objeto', item: normalizeObjeto(crearArmaEspecificaApi({ Bonificador_mejora_2: 1 })) });
        expect(tipo()).toBe('Arma mágica específica · Mágico');
        expect(etiquetas().slice(0, 2)).toEqual(['Arma base', 'Mejora']);
        expect(valor('Arma base')).toBe('Espada bastarda');
        expect(valor('Mejora')).toBe('+2/+1');
        expect(titulos()).toContain('Aptitudes especiales');
        enlace('Espada bastarda').click();
        enlace('Afilada').click();
        expect(arma).toHaveBeenCalledWith(33);
        expect(equipo).toHaveBeenCalledWith({ tipo: 'encantamiento', id: 1 });
    });

    it('una armadura específica abre su armadura base y su material', () => {
        const armadura = spyOn(component.armaduraDetallesId, 'emit');
        const equipo = spyOn(component.equipoDetalles, 'emit');
        mostrar({ tipo: 'objeto', item: normalizeObjeto(crearArmaEspecificaApi({
            Nombre: 'Armadura de mithril élfica', Tipo: { Id: 31, Nombre: 'Armadura mágica específica', Categoria: 'magico' },
            Arma_base: null, Armadura_base: { Id: 8, Nombre: 'Cota de mallas' }, Material: { Id: 9, Nombre: 'Mithril' }, Encantamientos: [],
            Bonificador_mejora: 1,
        })) });
        expect(etiquetas().slice(0, 3)).toEqual(['Armadura base', 'Mejora', 'Material']);
        expect(valor('Armadura base')).toBe('Cota de mallas');
        expect(valor('Material')).toBe('Mithril');
        expect(titulos()).not.toContain('Aptitudes especiales');
        enlace('Cota de mallas').click();
        enlace('Mithril').click();
        expect(armadura).toHaveBeenCalledWith(8);
        expect(equipo).toHaveBeenCalledWith({ tipo: 'material', id: 9 });
    });
});
