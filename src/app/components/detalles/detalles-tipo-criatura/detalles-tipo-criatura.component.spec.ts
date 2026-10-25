import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { TextoManualComponent } from 'src/app/components/shared/texto-manual/texto-manual.component';
import { TipoCriatura } from 'src/app/interfaces/tipo_criatura';
import { ManualDetalleNavigationService } from 'src/app/services/manual-detalle-navigation.service';
import { DetallesTipoCriaturaComponent } from './detalles-tipo-criatura.component';
import { lectorFicha, limpio } from 'src/testing/ficha-detalle';

function crearTipo(partial: Partial<TipoCriatura> = {}): TipoCriatura {
    return {
        Id: 5,
        Nombre: 'Muerto viviente',
        Descripcion: 'Criaturas que no están vivas.',
        Manual: 'Manual de monstruos, página: 317',
        Id_tipo_dado: 4,
        Tipo_dado: 12,
        Id_ataque: 2,
        Id_fortaleza: 2,
        Id_reflejos: 2,
        Id_voluntad: 1,
        Id_puntos_habilidad: 2,
        Come: false,
        Respira: false,
        Duerme: false,
        Recibe_criticos: false,
        Puede_ser_flanqueado: true,
        Pierde_constitucion: true,
        Limite_inteligencia: 0,
        Tesoro: '',
        Id_alineamiento: 0,
        Rasgos: [],
        Oficial: true,
        ...partial,
    };
}

describe('DetallesTipoCriaturaComponent', () => {
    let component: DetallesTipoCriaturaComponent;
    let fixture: ComponentFixture<DetallesTipoCriaturaComponent>;
    let manualNav: { abrirDetalleManual: jasmine.Spy };
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const { texto, titulos, datos } = lectorFicha(elemento);

    beforeEach(async () => {
        manualNav = { abrirDetalleManual: jasmine.createSpy('abrirDetalleManual') };
        await TestBed.configureTestingModule({
            declarations: [DetallesTipoCriaturaComponent, TextoManualComponent, ...FICHA_DETALLE_COMPONENTES],
            providers: [{ provide: ManualDetalleNavigationService, useValue: manualNav }],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(DetallesTipoCriaturaComponent);
        component = fixture.componentInstance;
    });

    it('pinta la cabecera, las progresiones en los datos clave y la naturaleza en la lateral', () => {
        component.tipo = crearTipo();
        fixture.detectChanges();

        expect(limpio(elemento().querySelector('.ficha-cabecera__tipo'))).toBe('Tipo de criatura');
        expect(limpio(elemento().querySelector('.ficha-cabecera__nombre'))).toBe('Muerto viviente');
        expect(limpio(elemento().querySelector('.ficha-cabecera__manual'))).toContain('Manual de monstruos, página: 317');
        expect(Array.from(elemento().querySelectorAll('.ficha-etiqueta')).map((e) => limpio(e))).toEqual(['Oficial']);
        expect(datos(elemento().querySelector('.ficha-datos-contenedor--tarjeta'))).toEqual([
            ['Dados de golpe', 'd12'],
            ['Ataque base', 'Media (+15)'],
            ['Fortaleza', 'Baja (+6)'],
            ['Reflejos', 'Baja (+6)'],
            ['Voluntad', 'Alta (+12)'],
            ['Puntos de habilidad por DG', '4 + mod. de Int'],
        ]);
        expect(titulos()).toEqual(['Descripción', 'Naturaleza']);
        const lateral = elemento().querySelector('.ficha-lateral-tarjeta');
        expect(datos(lateral)).toEqual([
            ['Necesita comer', 'No'],
            ['Necesita respirar', 'No'],
            ['Necesita dormir', 'No'],
            ['Recibe críticos', 'No'],
            ['Puede ser flanqueado', 'Sí'],
            ['Pierde la Constitución', 'Sí'],
        ]);
    });

    it('no enseña lo que la API da vacío o null', () => {
        component.tipo = crearTipo({ Descripcion: null as any, Tipo_dado: null as any, Pierde_constitucion: false, Oficial: false });
        fixture.detectChanges();

        expect(titulos()).toEqual(['Naturaleza']);
        const datosClave = datos(elemento().querySelector('.ficha-datos-contenedor--tarjeta')).map(([dt]) => dt);
        expect(datosClave).not.toContain('Dados de golpe');
        expect(datos(elemento().querySelector('.ficha-lateral-tarjeta')).map(([dt]) => dt)).not.toContain('Pierde la Constitución');
        expect(Array.from(elemento().querySelectorAll('.ficha-etiqueta')).map((e) => limpio(e))).toEqual(['Homebrew']);
        expect(texto()).not.toContain('null');
    });

    it('enlaza los rasgos y el manual con su detalle', () => {
        const rasgoSpy = spyOn(component.rasgoDetalles, 'emit');
        const rasgo = { Id: 2, Nombre: 'Inmunidad a la mente' } as any;
        component.tipo = crearTipo({ Rasgos: [rasgo] });
        fixture.detectChanges();

        expect(titulos()).toEqual(['Descripción', 'Naturaleza', 'Rasgos']);
        (elemento().querySelector('.ficha-lista button.ficha-enlace') as HTMLButtonElement).click();
        (elemento().querySelector('button.ficha-cabecera__manual') as HTMLButtonElement).click();

        expect(rasgoSpy).toHaveBeenCalledWith(rasgo);
        expect(manualNav.abrirDetalleManual).toHaveBeenCalledWith('Manual de monstruos, página: 317');
    });
});
