import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { Personaje } from 'src/app/interfaces/personaje';
import { PasoEdadRaza } from 'src/app/interfaces/raza';
import { normalizeRazaApi } from 'src/app/services/utils/raza-mapper';
import { OpcionCategoriaEdad, opcionesEdad } from 'src/app/services/utils/razas-por-edades';
import { TipoPersonaje, tituloNuevoPersonaje } from 'src/app/services/utils/tipo-personaje';
import { razaPorEdadesApi } from 'src/testing/raza-por-edades';
import { CREACION_MARCO_COMPONENTES, lineaPersonajeCreacion } from '.';

@Component({
    template: `
        <app-creacion-marco>
            <app-creacion-cabecera paso="raza" [titulo]="titulo" [tipo]="tipo" [eligiendoTipo]="eligiendoTipo"
                [puedeCambiarTipo]="puedeCambiar" (cambiarTipo)="cambios = cambios + 1"></app-creacion-cabecera>
            <app-creacion-tipo *ngIf="eligiendoTipo" [tipo]="tipo" (elegir)="elegido = $event"></app-creacion-tipo>
            <app-creacion-edad *ngIf="!eligiendoTipo" [opciones]="opciones" [idPaso]="idPaso" [pnj]="tipo === 'pnj'"
                (elegir)="pasoElegido = $event"></app-creacion-edad>
        </app-creacion-marco>`,
    standalone: false
})
class CreacionTipoYEdadDePruebaComponent {
    tipo: TipoPersonaje | null = null;
    eligiendoTipo = true;
    puedeCambiar = false;
    cambios = 0;
    elegido: TipoPersonaje | null = null;
    opciones: OpcionCategoriaEdad[] = [];
    idPaso: number | null = null;
    pasoElegido: PasoEdadRaza | null = null;

    get titulo(): string {
        return tituloNuevoPersonaje(this.tipo);
    }
}

describe('La creación: qué se crea y la edad de la raza', () => {
    let fixture: ComponentFixture<CreacionTipoYEdadDePruebaComponent>;
    let host: CreacionTipoYEdadDePruebaComponent;
    const el = (): HTMLElement => fixture.nativeElement;
    const boton = (texto: string): HTMLButtonElement =>
        Array.from(el().querySelectorAll('button')).find((b) => (b.textContent ?? '').includes(texto)) as HTMLButtonElement;
    const raza = normalizeRazaApi(razaPorEdadesApi());

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CreacionTipoYEdadDePruebaComponent, ...CREACION_MARCO_COMPONENTES, ...FICHA_DETALLE_COMPONENTES, TextoManualComponent],
            imports: [MatIconModule, MatTooltipModule],
        }).compileComponents();
        fixture = TestBed.createComponent(CreacionTipoYEdadDePruebaComponent);
        host = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('lo primero es «¿Qué vas a crear?», sin la fila de pasos, con las dos tarjetas', () => {
        expect(el().querySelector('.creacion-cabecera__nombre')?.textContent).toContain('¿Qué vas a crear?');
        expect(el().querySelector('.creacion-pasos')).toBeNull();
        const tarjetas = Array.from(el().querySelectorAll('.creacion-tipo__opcion'));
        expect(tarjetas.map((t) => t.querySelector('.creacion-tipo__titulo')?.textContent?.trim())).toEqual(['Personaje jugador', 'PNJ']);
        expect(tarjetas[0].getAttribute('aria-checked')).toBe('true');
    });

    it('al elegir PNJ el botón lo dice y emite el tipo', () => {
        (el().querySelectorAll('.creacion-tipo__opcion')[1] as HTMLButtonElement).click();
        fixture.detectChanges();
        boton('Crear un PNJ').click();
        expect(host.elegido).toBe('pnj');
    });

    it('elegido el tipo, la cabecera lo dice en el título y en su etiqueta, y deja cambiarlo', () => {
        host.tipo = 'pnj';
        host.eligiendoTipo = false;
        host.puedeCambiar = true;
        host.opciones = opcionesEdad(raza, { tipo: 'pnj' });
        fixture.detectChanges();
        const cabecera = el().querySelector('.creacion-cabecera')!;
        expect(cabecera.textContent).toContain('Nuevo PNJ · Paso 1');
        expect(el().querySelector('.creacion-etiqueta--pnj')?.textContent?.trim()).toBe('PNJ');
        boton('Cambiar a personaje jugador').click();
        expect(host.cambios).toBe(1);
        host.puedeCambiar = false;
        fixture.detectChanges();
        expect(boton('Cambiar a personaje jugador')).toBeUndefined();
    });

    it('«Categoría de edad»: un PJ ve atenuadas las edades sin ajuste, con «Solo PNJ» y su motivo', () => {
        host.tipo = 'pj';
        host.eligiendoTipo = false;
        host.opciones = opcionesEdad(raza, { tipo: 'pj' });
        host.idPaso = 11;
        fixture.detectChanges();
        const categorias = Array.from(el().querySelectorAll('.creacion-edad__categoria')) as HTMLButtonElement[];
        expect(categorias.map((c) => c.querySelector('.creacion-edad__pie')?.textContent?.trim())).toEqual(['NEP 11', 'NEP 15', 'NEP 19–20', 'Solo PNJ']);
        expect(categorias[3].disabled).toBeTrue();
        expect(categorias[0].getAttribute('aria-checked')).toBe('true');
        expect(el().querySelector('.creacion-edad__motivos')?.textContent).toContain('El manual no da ajuste de nivel a esta edad; solo como PNJ.');
    });

    it('al pulsar una edad emite su paso; con varios pasos en la categoría, deja elegir el paso', () => {
        host.tipo = 'pj';
        host.eligiendoTipo = false;
        host.opciones = opcionesEdad(raza, { tipo: 'pj' });
        host.idPaso = 11;
        fixture.detectChanges();
        (el().querySelectorAll('.creacion-edad__categoria')[2] as HTMLButtonElement).click();
        expect(host.pasoElegido?.Id).toBe(13);
        host.idPaso = 13;
        fixture.detectChanges();
        const pasos = Array.from(el().querySelectorAll('.creacion-edad__pasos .creacion-opcion')) as HTMLButtonElement[];
        expect(pasos.map((p) => p.textContent?.trim())).toEqual(['16 años · 13 DG · NEP 19', '20 años · 14 DG · NEP 20']);
        pasos[1].click();
        expect(host.pasoElegido?.Id).toBe(14);
    });

    it('creando un PNJ, todas las edades con su VD', () => {
        host.tipo = 'pnj';
        host.eligiendoTipo = false;
        host.opciones = opcionesEdad(raza, { tipo: 'pnj' });
        host.idPaso = 15;
        fixture.detectChanges();
        const categorias = Array.from(el().querySelectorAll('.creacion-edad__categoria')) as HTMLButtonElement[];
        expect(categorias.every((c) => !c.disabled)).toBeTrue();
        expect(categorias.map((c) => c.querySelector('.creacion-edad__pie')?.textContent?.trim())).toEqual(['VD 4', 'VD 5', 'VD 7', 'VD 10']);
        expect(el().querySelector('.creacion-edad__ayuda')?.textContent).toContain('Como PNJ, cualquier edad');
    });

    it('la línea de la cabecera lleva la raza con su edad', () => {
        const pj = { Raza: { Nombre: 'Dragón rojo' }, CategoriaEdad: { categoria: { Id: 3, Nombre: 'Joven' } }, desgloseClases: [] } as unknown as Personaje;
        expect(lineaPersonajeCreacion(pj)).toBe('Dragón rojo (joven)');
    });
});
