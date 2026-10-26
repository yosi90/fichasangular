import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { normalizeArma } from 'src/app/services/arma.service';
import { textoPrecio } from 'src/app/services/utils/equipo-texto';
import { normalizeEncantamiento, normalizeEquipoCatalogos, normalizeMaterial, normalizeObjeto } from 'src/app/services/utils/equipo-mapper';
import { aptitudesAplicables, articuloDeArma, articuloDeObjeto, materialesAplicables, nuevaPieza } from 'src/app/services/utils/tienda-equipo';
import { crearArmaApi, crearEncantamientoApi, crearEquipoCatalogosApi, crearMaterialApi, crearObjetoGenericoApi } from 'src/testing/equipo-api';
import { CreacionVentanaComponent } from '../marco/creacion-ventana.component';
import { ConfigurarPiezaComponent } from './configurar-pieza.component';

describe('ConfigurarPiezaComponent', () => {
    let fixture: ComponentFixture<ConfigurarPiezaComponent>;
    let component: ConfigurarPiezaComponent;
    const aplicaciones = normalizeEquipoCatalogos(crearEquipoCatalogosApi()).Aplicaciones_material;
    const espada = articuloDeArma(normalizeArma(crearArmaApi({
        Id: 30, Nombre: 'Espada larga', Precio: 15, Peso: 4, Manejo: { Id: 3, Nombre: 'A una mano' }, Tipo_dano: { Id: 3, Nombre: 'Cortante' },
    })));
    const coste = (aplicacion: number, valores: Record<string, number | null>) => ({
        Aplicacion: { Id: aplicacion, Nombre: '' }, Coste: null, Coste_por_libra: null, Multiplicador_precio: null, Coste_encantar: null, ...valores,
    });
    const materiales = [
        normalizeMaterial(crearMaterialApi({ Id: 7, Nombre: 'Adamantina', Cuenta_como_gran_calidad: true, Costes: [coste(1, { Coste: 3000 })] })),
        normalizeMaterial(crearMaterialApi({ Id: 8, Nombre: 'Hierro frío', Cuenta_como_gran_calidad: false, Costes: [coste(1, { Multiplicador_precio: 2, Coste_encantar: 2000 })] })),
        normalizeMaterial(crearMaterialApi({ Id: 3, Nombre: 'Plata alquímica', Cuenta_como_gran_calidad: false, Costes: [coste(3, { Coste: 90 })] })),
        // Solo armaduras: no sale para una espada.
        normalizeMaterial(crearMaterialApi()),
    ];
    const afilada = normalizeEncantamiento(crearEncantamientoApi());
    const iluminadora = normalizeEncantamiento(crearEncantamientoApi({ Id: 2, Nombre: 'Iluminadora', Modificador: 0, Coste: 500, Tipos_dano_requeridos: [] }));
    const velocidad = normalizeEncantamiento(crearEncantamientoApi({ Id: 3, Nombre: 'Velocidad', Modificador: 3, Tipos_dano_requeridos: [] }));
    const defensora = normalizeEncantamiento(crearEncantamientoApi({ Id: 4, Nombre: 'Defensora', Modificador: 1, Tipos_dano_requeridos: [] }));
    const solo_armaduras = normalizeEncantamiento(crearEncantamientoApi({
        Id: 5, Nombre: 'Sombra', Aplica_a: { Arma_cuerpo_a_cuerpo: false, Arma_a_distancia: false, Municion: false, Armadura: true, Escudo: false },
    }));

    function abrir(disponible = 100000): void {
        component.pieza = nuevaPieza(espada);
        component.nueva = true;
        component.materiales = materialesAplicables(espada, materiales, aplicaciones);
        component.aptitudes = aptitudesAplicables(espada, [afilada, iluminadora, velocidad, defensora, solo_armaduras]);
        component.disponible = disponible;
        component.ngOnChanges();
        fixture.detectChanges();
    }

    function lineas(): string[] {
        return component.desglose.map((l) => `${l.etiqueta}: ${l.po}`);
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfigurarPiezaComponent, CreacionVentanaComponent],
            imports: [FormsModule],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(ConfigurarPiezaComponent);
        component = fixture.componentInstance;
    });

    it('solo ofrece los materiales y las aptitudes que se aplican a la pieza', () => {
        abrir();
        expect(component.materiales.map((m) => m.material.Nombre)).toEqual(['Adamantina', 'Hierro frío', 'Plata alquímica']);
        expect(component.aptitudes.map((a) => a.Nombre)).toEqual(['Afilada', 'Iluminadora', 'Velocidad', 'Defensora']);
        const texto = fixture.nativeElement.textContent as string;
        expect(texto).toContain('Adamantina');
        expect(texto).not.toContain('Mithril');
        expect(texto).not.toContain('Sombra');
    });

    it('precio con material, mejora y aptitudes (Guía del DM)', () => {
        abrir();
        component.elegirMaterial(component.materiales[0]);
        component.elegirMejora(1);
        component.alternarAptitud(afilada);
        component.alternarAptitud(iluminadora);
        // Adamantina ya es de gran calidad; +1 afilada = +2: 2.000 × 4; iluminadora, 500 fijos.
        expect(lineas()).toEqual(['Espada larga: 15', 'Adamantina: 3000', 'Bonificador +2 (+1, afilada +1): 8000', 'Iluminadora: 500']);
        expect(component.precio).toBe(11515);
        expect(component.textoBoton).toBe(`Añadir la pieza · ${textoPrecio(11515)}`);
    });

    it('el hierro frío multiplica el precio y cobra encantarlo; la plata, según el manejo', () => {
        abrir();
        component.elegirMaterial(component.materiales[1]);
        component.elegirMejora(1);
        expect(lineas()).toEqual(['Espada larga (×2): 30', 'Gran calidad: 300', 'Bonificador +1 (+1): 2000', 'Encantar hierro frío: 2000']);
        component.elegirMaterial(component.materiales[2]);
        component.elegirMejora(0);
        expect(component.precio).toBe(105);
    });

    it('sin mejora no hay aptitudes, y bajar a «Sin» las quita', () => {
        abrir();
        component.alternarAptitud(afilada);
        expect(component.borrador.aptitudes).toEqual([]);
        component.elegirMejora(2);
        component.alternarAptitud(afilada);
        expect(component.total).toBe(3);
        component.elegirMejora(0);
        expect(component.borrador.aptitudes).toEqual([]);
    });

    it('no deja pasar de +10', () => {
        abrir(10000000);
        component.elegirMejora(5);
        component.alternarAptitud(velocidad);
        component.alternarAptitud(afilada);
        component.alternarAptitud(defensora);
        expect(component.total).toBe(10);
        expect(component.puedeGuardar).toBeTrue();
        const masDe10 = normalizeEncantamiento(crearEncantamientoApi({ Id: 6, Nombre: 'Vorpal', Modificador: 5, Tipos_dano_requeridos: [] }));
        component.alternarAptitud(masDe10);
        expect(component.total).toBe(15);
        expect(component.puedeGuardar).toBeFalse();
        expect(component.textoBoton).toBe('Pasa de +10');
    });

    it('avisa si no llega el dinero (lo que queda más lo que ya costaba)', () => {
        abrir(2000);
        component.elegirMejora(1);
        expect(component.falta).toBe(315);
        expect(component.puedeGuardar).toBeFalse();
        expect(component.textoBoton).toBe('No te llega el dinero');
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain('te faltan 315 po');
    });

    it('sin objetos a medida solo deja la gran calidad', () => {
        component.politica = { objetosMagicos: true, aMedida: false, precioMaximo: null };
        abrir();
        expect(fixture.nativeElement.textContent).toContain('Esta campaña no permite objetos a medida');
        expect(fixture.nativeElement.querySelector('[aria-label="Material"]')).toBeNull();
    });

    it('un genérico pide su conjuro', () => {
        component.pieza = nuevaPieza(articuloDeObjeto(normalizeObjeto(crearObjetoGenericoApi())));
        component.conjuros = [{ Id: 1, Nombre: 'Curar heridas leves' }, { Id: 2, Nombre: 'Curar heridas moderadas' }];
        component.disponible = 1000;
        component.ngOnChanges();
        expect(component.motivo).toBe('Elige el conjuro');
        expect(component.conjurosPara('cu').length).toBe(2);
        component.elegirConjuro('Curar heridas leves');
        expect(component.borrador.idConjuro).toBe(1);
        expect(component.motivo).toBeNull();
        const guardar = spyOn(component.guardar, 'emit');
        component.onGuardar();
        expect(guardar).toHaveBeenCalledWith(jasmine.objectContaining({ idConjuro: 1, nombreConjuro: 'Curar heridas leves' }));
        component.escribirConjuro('curar heridas');
        expect(component.borrador.idConjuro).toBeNull();
    });
});
