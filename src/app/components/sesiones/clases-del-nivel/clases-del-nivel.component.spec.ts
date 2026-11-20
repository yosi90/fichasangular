import { TestBed } from '@angular/core/testing';
import { ConjurosDelNivelComponent } from 'src/app/components/sesiones/conjuros-del-nivel/conjuros-del-nivel.component';
import { ClasesDelNivelComponent } from './clases-del-nivel.component';

/* Los pasos «Clase» y «Conjuros» de un nivel que se gana, comunes a la subida de nivel y a la vuelta a la vida sin ningún DG. */
describe('ClasesDelNivelComponent y ConjurosDelNivelComponent', () => {
    it('la lista de clases: las que no puede tomar, atenuadas con su motivo; «Elegir» emite la clase', async () => {
        await TestBed.configureTestingModule({ imports: [ClasesDelNivelComponent] }).compileComponents();
        const fixture = TestBed.createComponent(ClasesDelNivelComponent);
        const guerrero: any = { Id: 9, Nombre: 'Guerrero', Oficial: true };
        const paladin: any = { Id: 21, Nombre: 'Paladín', Oficial: false };
        fixture.componentRef.setInput('clases', [
            { clase: guerrero, siguienteNivel: 1, elegible: true, motivo: '', tiene: false },
            { clase: paladin, siguienteNivel: 1, elegible: false, motivo: 'Tras ganar niveles de engendro vampírico ya no puede volver a subir de paladín', tiene: false },
        ]);
        fixture.componentRef.setInput('titulo', 'Elige la clase de su 1.er nivel');
        fixture.detectChanges();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.textContent).toContain('Elige la clase de su 1.er nivel');
        expect(el.textContent).toContain('ya no puede volver a subir de paladín');
        expect(el.textContent).toContain('Homebrew');
        const botones = Array.from(el.querySelectorAll<HTMLButtonElement>('button'));
        expect(botones.map((b) => b.disabled)).toEqual([false, true]);
        const elegidas: any[] = [];
        fixture.componentInstance.elegida.subscribe((c) => elegidas.push(c));
        botones[0].click();
        expect(elegidas).toEqual([guerrero]);
    });

    it('los conjuros: lo que queda por elegir, los elegidos y los automáticos, y elegir y quitar con el motor', async () => {
        await TestBed.configureTestingModule({ imports: [ConjurosDelNivelComponent] }).compileComponents();
        const fixture = TestBed.createComponent(ConjurosDelNivelComponent);
        const motor = jasmine.createSpyObj('NuevoPersonajeService', ['getConjurosSesionActual', 'filtrarConjurosDisponibles', 'seleccionarConjuroSesion', 'quitarConjuroSesion']);
        Object.defineProperty(motor, 'CatalogoConjuros', { get: () => [{ Id: 1, Nombre: 'Luz' }, { Id: 2, Nombre: 'Proyectil mágico' }, { Id: 3, Nombre: 'Escudo' }] });
        motor.getConjurosSesionActual.and.returnValue({
            activa: true, indiceEntradaActual: 0,
            entradas: [{ claseObjetivo: { nombre: 'Mago' }, cupoPendiente: { total: 2 }, seleccionadosIds: [2], autoadicionadosIds: [1] }],
        });
        motor.filtrarConjurosDisponibles.and.returnValue([{ Id: 3, Nombre: 'Escudo' }]);
        fixture.componentRef.setInput('motor', motor);
        fixture.componentRef.setInput('homebrew', true);
        fixture.detectChanges();
        const texto = `${(fixture.nativeElement as HTMLElement).textContent ?? ''}`.replace(/\s+/g, ' ');
        expect(texto).toContain('Conjuros nuevos de Mago');
        expect(texto).toContain('Te quedan 2 por elegir.');
        expect(texto).toContain('Luz Automático');
        expect(texto).toContain('Proyectil mágico');
        fixture.componentInstance.elegir({ Id: 3 } as any);
        expect(motor.seleccionarConjuroSesion).toHaveBeenCalledWith(3, true);
        fixture.componentInstance.quitar(2);
        expect(motor.quitarConjuroSesion).toHaveBeenCalledWith(2);
        expect(fixture.componentInstance.nombre(99)).toBe('#99');
    });
});
