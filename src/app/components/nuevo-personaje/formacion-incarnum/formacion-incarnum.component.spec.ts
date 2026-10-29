import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FICHA_DETALLE_COMPONENTES } from 'src/app/components/detalles/ficha';
import { CREACION_MARCO_COMPONENTES } from 'src/app/components/nuevo-personaje/marco';
import { Clase } from 'src/app/interfaces/clase';
import { Dote } from 'src/app/interfaces/dote';
import { calcularIncarnumBorrador } from 'src/app/services/utils/incarnum';
import { normalizarCapacidadEsencia, normalizarChakraDetalle, normalizarClaseMoldeado, normalizarDoteIncarnum, normalizarFusion } from 'src/app/services/utils/incarnum-mapper';
import { chakraApi, fusionApi, moldeadoEncarnadoApi } from 'src/testing/incarnum';
import { limpio } from 'src/testing/ficha-detalle';
import { FormacionIncarnumComponent } from './formacion-incarnum.component';

describe('FormacionIncarnumComponent', () => {
    let component: FormacionIncarnumComponent;
    let fixture: ComponentFixture<FormacionIncarnumComponent>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const boton = (texto: string, dentro: ParentNode = elemento()): HTMLButtonElement =>
        Array.from(dentro.querySelectorAll<HTMLButtonElement>('button')).find((b) => limpio(b) === texto || limpio(b) === `${texto} arrow_forward`)!;
    const filaChakra = (nombre: string): HTMLTableRowElement =>
        Array.from(elemento().querySelectorAll<HTMLTableRowElement>('.formacion-chakras tbody tr')).find((tr) => limpio(tr.cells[0]) === nombre)!;

    const yelmo = normalizarFusion(fusionApi());
    const sandalias = normalizarFusion(fusionApi({ Id: 283, Nombre: 'Sandalias cerúleas', Descriptores: [], Chakras: [
        { Id: 35, Nombre: 'Pies', Ocupa: true, Vinculo: true },
    ] }));
    const maligna = normalizarFusion(fusionApi({
        Id: 290, Nombre: 'Guanteletes de la guerra de sangre',
        Descriptores: [{ Id: 9, Nombre: 'Maligno', Actitud: { Id: 5, Nombre: 'Maligno' } }],
        Chakras: [{ Id: 36, Nombre: 'Manos', Ocupa: true, Vinculo: true }],
    }));
    const chakras = [
        normalizarChakraDetalle(chakraApi()),
        normalizarChakraDetalle(chakraApi({ Id: 35, Nombre: 'Pies', Orden: 2 })),
        normalizarChakraDetalle(chakraApi({ Id: 36, Nombre: 'Manos', Orden: 3 })),
    ];

    function bloque() {
        return calcularIncarnumBorrador({
            clases: [{ clase: { Id: 405, Nombre: 'Encarnado', Moldeado: normalizarClaseMoldeado(moldeadoEncarnadoApi()) } as Clase, nombre: 'Encarnado', nivel: 5 }],
            dotes: [{ dote: { Id: 1087, Nombre: 'Dureza azur', Incarnum: normalizarDoteIncarnum({ Esencia_reserva: 1, Receptaculo: true }) } as Dote, idExtra: 0 }],
            raciales: [],
            especiales: [],
            puntuaciones: { constitucion: 14, sabiduria: 15 },
            nivelPersonaje: 5,
            capacidad: [normalizarCapacidadEsencia({ Nivel_minimo: 1, Nivel_maximo: 5, Capacidad: 1 })],
        });
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [FormacionIncarnumComponent, ...FICHA_DETALLE_COMPONENTES, ...CREACION_MARCO_COMPONENTES],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
        fixture = TestBed.createComponent(FormacionIncarnumComponent);
        component = fixture.componentInstance;
        component.bloque = bloque();
        component.fusiones = [yelmo, sandalias, maligna];
        component.chakras = chakras;
        component.alineamiento = { actitudes: [2, 4], descriptoresSinAlineamiento: [] };
        component.ngOnChanges();
        fixture.detectChanges();
    });

    it('enseña la lista de su clase, sin las que su alineamiento no deja, y sus chakras con los receptáculos', () => {
        expect(limpio(elemento().querySelector('.formacion-lista .ficha-titulo'))).toBe('Lista de Encarnado (2)');
        expect(limpio(elemento().querySelector('.formacion-lista'))).not.toContain('Guanteletes de la guerra de sangre');
        expect(Array.from(elemento().querySelectorAll('.formacion-chakras tbody tr')).map((tr) => limpio((tr as HTMLTableRowElement).cells[0])))
            .toEqual(['Corona', 'Pies', 'Dote']);
        expect(component.franja.map((d) => [d.etiqueta, d.valor, d.detalle])).toEqual([
            ['Fusiones moldeadas', 0, 'de 4'],
            ['Vínculos', 0, 'de 1 · corona, pies o manos'],
            ['Esencia repartida', 0, 'de 6'],
            ['Capacidad', 1, '2 en fusiones de Encarnado · 1 en dotes'],
        ]);
    });

    it('moldea, vincula y reparte la esencia con los límites, y emite la formación al continuar', () => {
        boton('Moldear').click();
        fixture.detectChanges();
        expect(limpio(filaChakra('Corona').cells[1])).toBe('Yelmo de cristal');

        boton('Vincular', filaChakra('Corona')).click();
        fixture.detectChanges();
        expect(boton('Vinculada', filaChakra('Corona')).getAttribute('aria-pressed')).toBe('true');

        const mas = (nombre: string) => boton('+', filaChakra(nombre));
        mas('Corona').click();
        mas('Corona').click();
        fixture.detectChanges();
        expect(limpio(filaChakra('Corona').querySelector('.formacion-cifra'))).toBe('2');
        expect(mas('Corona').disabled).withContext('capacidad 2').toBeTrue();

        mas('Dote').click();
        fixture.detectChanges();
        const emitido = spyOn(component.confirmar, 'emit');
        boton('Continuar: Equipo').click();
        expect(emitido).toHaveBeenCalledWith({
            fusiones: [{ idFusion: 284, idClase: 405, idChakra: 34, idChakraVinculo: 34, esencia: 2 }],
            receptaculos: [{ tipo: 'dote', id: 1087, esencia: 1 }],
        });
    });

    it('con un solo vínculo, el segundo no se puede; quitar una fusión libera su chakra', () => {
        component.formacion = {
            fusiones: [
                { idFusion: 284, idClase: 405, idChakra: 34, idChakraVinculo: 34, esencia: 0 },
                { idFusion: 283, idClase: 405, idChakra: 35, idChakraVinculo: null, esencia: 0 },
            ],
            receptaculos: [],
        };
        component.ngOnChanges();
        fixture.detectChanges();
        expect(boton('Vincular', filaChakra('Pies')).disabled).toBeTrue();

        component.quitar(284);
        fixture.detectChanges();
        expect(limpio(filaChakra('Corona').cells[1])).toBe('Libre');
    });

    it('enseña el error de la API y lo señala en su fila; saltar el paso lo dice', () => {
        component.formacion = { fusiones: [{ idFusion: 284, idClase: 405, idChakra: 34, esencia: 0 }], receptaculos: [] };
        component.errorApi = { code: 'capacidad_superada', field: 'incarnum.fusiones[0].esencia', mensaje: 'Yelmo de cristal admite como mucho 2 de esencia.' };
        component.ngOnChanges();
        fixture.detectChanges();
        expect(limpio(elemento().querySelector('.bloque-error'))).toContain('Yelmo de cristal admite como mucho 2 de esencia.');
        expect(filaChakra('Corona').classList).toContain('formacion-fila--error');

        const saltar = spyOn(component.saltar, 'emit');
        boton('Saltar este paso').click();
        expect(saltar).toHaveBeenCalled();
    });
});
