import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemaWebService } from 'src/app/services/tema-web/tema-web.service';
import { TEMAS_WEB } from 'src/app/services/tema-web/temas-web';
import { AVISO_ELEGIR_TEMA, AVISO_TEMA_SIN_GUARDAR, VentanaTemaComponent } from './ventana-tema.component';

describe('VentanaTemaComponent', () => {
    let fixture: ComponentFixture<VentanaTemaComponent>;
    let componente: VentanaTemaComponent;
    let temaWeb: jasmine.SpyObj<TemaWebService> & { estado: { tema: string; modo: string } };
    let cerrada: jasmine.Spy;

    function crear(bienvenida: boolean): void {
        temaWeb = Object.assign(
            jasmine.createSpyObj<TemaWebService>('TemaWebService', ['elegirTema', 'previsualizar', 'deshacerVistaPrevia', 'elegirModo', 'modoEfectivoDe']),
            { estado: { tema: 'a', modo: 'sistema' } },
        );
        temaWeb.elegirTema.and.resolveTo();
        temaWeb.modoEfectivoDe.and.callFake((tema: string) => tema === 'b' ? 'oscuro' : 'claro');
        TestBed.configureTestingModule({
            imports: [VentanaTemaComponent],
            providers: [{ provide: TemaWebService, useValue: temaWeb }],
        });
        fixture = TestBed.createComponent(VentanaTemaComponent);
        componente = fixture.componentInstance;
        fixture.componentRef.setInput('bienvenida', bienvenida);
        cerrada = jasmine.createSpy('cerrada');
        componente.cerrada.subscribe(cerrada);
        fixture.detectChanges();
    }

    const dialogo = () => fixture.nativeElement.querySelector('dialog') as HTMLDialogElement;
    // El evento `close` del `<dialog>` llega en otra tarea, después de `close()`.
    const alCerrarse = () => new Promise<void>((resolve) => dialogo().addEventListener('close', () => setTimeout(resolve), { once: true }));
    const opcion = (texto: string) => [...fixture.nativeElement.querySelectorAll('label.ventana-tema__opcion')]
        .find((l: HTMLElement) => l.textContent?.includes(texto))!.querySelector('input') as HTMLInputElement;

    afterEach(() => {
        if (dialogo()?.open)
            dialogo().close();
        fixture?.destroy();
    });

    it('se abre como ventana modal con los tres temas y su vista previa', () => {
        crear(false);
        expect(dialogo().open).toBeTrue();
        expect(dialogo().matches(':modal')).toBeTrue();
        const previas = [...fixture.nativeElement.querySelectorAll('[data-tema-previa]')].map((p: HTMLElement) => p.dataset['temaPrevia']);
        expect(previas).toEqual(['a', 'b', 'c']);
        // Cada vista previa, en el modo con el que se vería ese tema.
        const modos = [...fixture.nativeElement.querySelectorAll('[data-tema-previa]')].map((p: HTMLElement) => p.dataset['modoPrevia']);
        expect(modos).toEqual(['claro', 'oscuro', 'claro']);
        expect(fixture.nativeElement.textContent).toContain('B · Tinta');
    });

    it('en Opciones, elegir un tema lo guarda al momento y se cierra con la ×', async () => {
        crear(false);
        opcion('C · Manual').click();
        await fixture.whenStable();
        expect(temaWeb.elegirTema).toHaveBeenCalledOnceWith('c');
        const cerrandose = alCerrarse();
        (fixture.nativeElement.querySelector('.ventana-tema__cerrar') as HTMLButtonElement).click();
        await cerrandose;
        expect(cerrada).toHaveBeenCalled();
    });

    it('si no se guarda en la cuenta, lo dice', async () => {
        crear(false);
        temaWeb.elegirTema.and.rejectWith(new Error('sin red'));
        opcion('B · Tinta').click();
        await fixture.whenStable();
        fixture.detectChanges();
        expect(fixture.nativeElement.textContent).toContain(AVISO_TEMA_SIN_GUARDAR);
    });

    it('el modo se elige aparte; con el claro del tema listo (A, fase 2), no está desactivado', () => {
        crear(false);
        const modos = [...fixture.nativeElement.querySelectorAll('input[name="ventana-tema-modo"]')] as HTMLInputElement[];
        expect(modos.length).toBe(3);
        expect(modos.some((m) => m.disabled)).toBeFalse();
        expect(fixture.nativeElement.textContent).not.toContain('solo se ve en oscuro');
        modos.find((m) => m.value === 'claro')!.click();
        expect(temaWeb.elegirModo).toHaveBeenCalledWith('claro');
    });

    it('mientras un tema no tiene su claro, el modo sale desactivado con su nota', () => {
        const c = TEMAS_WEB[2] as { claroListo: boolean };
        c.claroListo = false;
        try {
            crear(false);
            componente.seleccion = 'c';
            fixture.detectChanges();
            const modos = [...fixture.nativeElement.querySelectorAll('input[name="ventana-tema-modo"]')] as HTMLInputElement[];
            expect(modos.every((m) => m.disabled)).toBeTrue();
            expect(fixture.nativeElement.textContent).toContain('solo se ve en oscuro');
        } finally {
            c.claroListo = true;
        }
    });

    it('la bienvenida no tiene × ni se cierra con Esc: lo dice y sigue abierta', () => {
        crear(true);
        expect(fixture.nativeElement.querySelector('.ventana-tema__cerrar')).toBeNull();
        expect(dialogo().getAttribute('closedby')).toBe('none');
        const cancelar = new Event('cancel', { cancelable: true });
        dialogo().dispatchEvent(cancelar);
        fixture.detectChanges();
        expect(cancelar.defaultPrevented).toBeTrue();
        expect(fixture.nativeElement.textContent).toContain(AVISO_ELEGIR_TEMA);
        expect(dialogo().open).toBeTrue();
    });

    it('si la bienvenida se cierra sin elegir (un navegador sin closedby), se vuelve a abrir', async () => {
        crear(true);
        const cerrandose = alCerrarse();
        dialogo().close();
        await cerrandose;
        fixture.detectChanges();
        expect(dialogo().open).toBeTrue();
        expect(cerrada).not.toHaveBeenCalled();
    });

    it('en la bienvenida, elegir solo enseña el tema; «Usar este tema» lo guarda y cierra', async () => {
        crear(true);
        opcion('B · Tinta').click();
        expect(temaWeb.previsualizar).toHaveBeenCalledOnceWith('b');
        expect(temaWeb.elegirTema).not.toHaveBeenCalled();

        const cerrandose = alCerrarse();
        (fixture.nativeElement.querySelector('.ventana-tema__boton') as HTMLButtonElement).click();
        await cerrandose;
        expect(temaWeb.elegirTema).toHaveBeenCalledOnceWith('b');
        expect(dialogo().open).toBeFalse();
        expect(cerrada).toHaveBeenCalled();
    });
});
