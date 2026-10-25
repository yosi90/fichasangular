import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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

    beforeEach(async () => {
        manualNav = jasmine.createSpyObj<ManualDetalleNavigationService>('ManualDetalleNavigationService', ['abrirDetalleManual']);
        await TestBed.configureTestingModule({
            declarations: [DetallesEquipoComponent],
            providers: [{ provide: ManualDetalleNavigationService, useValue: manualNav }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(DetallesEquipoComponent);
        component = fixture.componentInstance;
    });

    function mostrar(entrada: EntradaEquipo): string {
        component.entrada = entrada;
        fixture.detectChanges();
        return (fixture.nativeElement as HTMLElement).textContent ?? '';
    }

    it('un objeto enseña su tipo, ranura, aura, modificadores y creación', () => {
        const texto = mostrar({ tipo: 'objeto', item: normalizeObjeto(crearObjetoApi()) });
        expect(texto).toContain('Capa de resistencia +1');
        expect(texto).toContain('Objeto maravilloso (Mágico)');
        expect(texto).toContain('Hombros');
        expect(texto).toContain('Débil, abjuración');
        expect(texto).toContain('Salvaciones +1 (resistencia)');
        expect(texto).toContain('Crear objeto maravilloso');
        expect(texto).toContain('Guia del dungeon master 1 (p. 253)');
    });

    it('un genérico de un conjuro enseña la fórmula del precio', () => {
        const texto = mostrar({ tipo: 'objeto', item: normalizeObjeto(crearObjetoGenericoApi()) });
        expect(texto).toContain('50 po × nivel del conjuro × nivel de lanzador');
        expect(texto).toContain('Conjuros hasta el nivel');
    });

    it('un material enseña sus efectos y sus costes', () => {
        const texto = mostrar({ tipo: 'material', item: normalizeMaterial(crearMaterialApi()) });
        expect(texto).toContain('Dureza');
        expect(texto).toContain('×0,5');
        expect(texto).toContain('Cuenta como de gran calidad');
        expect(texto).toContain(`Armadura ligera: +${textoPrecio(1000)}`);
    });

    it('la munición enseña su lote y abre las armas que la disparan', () => {
        const emit = spyOn(component.armaDetallesId, 'emit');
        const texto = mostrar({ tipo: 'municion', item: normalizeMunicion(crearMunicionApi()) });
        expect(texto).toContain('1 po las 20');
        expect(texto).toContain('Arco corto');
        component.abrirArma(48);
        expect(emit).toHaveBeenCalledWith(48);
    });

    it('una aptitud especial enseña su bonificador, a qué se aplica y sus requisitos', () => {
        const dote = spyOn(component.doteDetallesId, 'emit');
        const texto = mostrar({ tipo: 'encantamiento', item: normalizeEncantamiento(crearEncantamientoApi()) });
        expect(texto).toContain('Bonificador equivalente');
        expect(texto).toContain('armas cuerpo a cuerpo');
        expect(texto).toContain('perforante, cortante');
        expect(texto).toContain('Fabricar armas y armaduras mágicas');
        component.abrirDote(332);
        expect(dote).toHaveBeenCalledWith(332);
    });

    it('un conjunto abre sus piezas', () => {
        const emit = spyOn(component.equipoDetalles, 'emit');
        const texto = mostrar({ tipo: 'conjunto', item: normalizeConjuntoObjetos(crearConjuntoApi()) });
        expect(texto).toContain('2 piezas: +1 a las pruebas de nivel de lanzador.');
        component.abrirEquipo('objeto', 40);
        expect(emit).toHaveBeenCalledWith({ tipo: 'objeto', id: 40 });
    });

    it('abre el manual', () => {
        mostrar({ tipo: 'municion', item: normalizeMunicion(crearMunicionApi()) });
        component.abrirDetalleManual();
        expect(manualNav.abrirDetalleManual).toHaveBeenCalledWith({ id: 54, nombre: 'Manual del jugador 1' });
    });

    it('un arma mágica específica enseña su arma base (que se abre), su mejora y sus aptitudes', () => {
        const arma = spyOn(component.armaDetallesId, 'emit');
        const equipo = spyOn(component.equipoDetalles, 'emit');
        const texto = mostrar({ tipo: 'objeto', item: normalizeObjeto(crearArmaEspecificaApi({ Bonificador_mejora_2: 1 })) });
        expect(texto).toContain('Arma base Espada bastarda');
        expect(texto).toContain('+2/+1');
        expect(texto).toContain('Aptitudes especiales');
        expect(texto).toContain('Afilada');
        component.abrirArma(33);
        component.abrirEquipo('encantamiento', 1);
        expect(arma).toHaveBeenCalledWith(33);
        expect(equipo).toHaveBeenCalledWith({ tipo: 'encantamiento', id: 1 });
    });

    it('una armadura específica abre su armadura base', () => {
        const emit = spyOn(component.armaduraDetallesId, 'emit');
        const texto = mostrar({ tipo: 'objeto', item: normalizeObjeto(crearArmaEspecificaApi({
            Nombre: 'Armadura de mithril élfica', Tipo: { Id: 31, Nombre: 'Armadura mágica específica', Categoria: 'magico' },
            Arma_base: null, Armadura_base: { Id: 8, Nombre: 'Cota de mallas' }, Material: { Id: 9, Nombre: 'Mithril' }, Encantamientos: [],
        })) });
        expect(texto).toContain('Armadura base Cota de mallas');
        expect(texto).toContain('Mithril');
        component.abrirArmadura(8);
        expect(emit).toHaveBeenCalledWith(8);
    });
});
