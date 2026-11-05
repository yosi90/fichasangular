import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NormasCreacionError, NormasDeRol } from 'src/app/interfaces/normas-rol';
import { TextoManualComponent } from '../texto-manual/texto-manual.component';
import { NormasCreacionDialogoComponent } from './normas-creacion-dialogo.component';

describe('NormasCreacionDialogoComponent', () => {
    const NORMAS: NormasDeRol = {
        id: 7, version: 2, titulo: 'Normas de Rol', texto: '### Lo que publicas\n\nRespeta la autoría de los demás.',
        importante: true, publicadas: '2026-11-01',
    };

    let fixture: ComponentFixture<NormasCreacionDialogoComponent>;
    let ventana: { close: jasmine.Spy; disableClose: boolean };
    let datos: { leer: jasmine.Spy; aceptar: jasmine.Spy };

    async function crear(): Promise<void> {
        await TestBed.configureTestingModule({
            declarations: [NormasCreacionDialogoComponent, TextoManualComponent],
            imports: [MatDialogModule, MatButtonModule, MatIconModule, MatTooltipModule, NoopAnimationsModule],
            providers: [
                { provide: MatDialogRef, useValue: ventana },
                { provide: MAT_DIALOG_DATA, useValue: datos },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(NormasCreacionDialogoComponent);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    }

    const texto = () => (fixture.nativeElement as HTMLElement).textContent?.replace(/\s+/g, ' ') ?? '';
    const boton = (etiqueta: string) => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
        .find((b) => b.textContent?.trim() === etiqueta) as HTMLButtonElement;

    beforeEach(() => {
        ventana = { close: jasmine.createSpy('close'), disableClose: false };
        datos = {
            leer: jasmine.createSpy('leer').and.resolveTo(NORMAS),
            aceptar: jasmine.createSpy('aceptar').and.resolveTo(),
        };
    });

    it('explica qué son, por qué se piden y que se puede seguir sin ellas, con el texto vigente', async () => {
        await crear();

        expect(texto()).toContain('Las normas para crear en Rol');
        expect(texto()).toContain('Te las pedimos ahora porque vas a crear algo');
        expect(texto()).toContain('Si no las aceptas, puedes seguir usando Rol');
        expect(texto()).toContain('Normas de Rol · versión 2');
        expect(texto()).toContain('Respeta la autoría de los demás.');
    });

    it('al aceptar, guarda la aceptación de esa versión y cierra con true', async () => {
        await crear();

        boton('Aceptar y seguir').click();
        await fixture.whenStable();

        expect(datos.aceptar).toHaveBeenCalledOnceWith(7);
        expect(ventana.close).toHaveBeenCalledOnceWith(true);
    });

    it('«Ahora no» cierra con false sin aceptar nada', async () => {
        await crear();

        boton('Ahora no').click();

        expect(datos.aceptar).not.toHaveBeenCalled();
        expect(ventana.close).toHaveBeenCalledOnceWith(false);
    });

    it('si falla al aceptar, lo dice y no cierra', async () => {
        datos.aceptar.and.rejectWith(new NormasCreacionError('No se ha podido guardar.', ''));
        await crear();

        boton('Aceptar y seguir').click();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(texto()).toContain('No se ha podido guardar.');
        expect(ventana.close).not.toHaveBeenCalled();
        expect(ventana.disableClose).toBeFalse();
    });

    it('si no puede leerlas, deja reintentar y no deja aceptar', async () => {
        datos.leer.and.rejectWith(new NormasCreacionError('No se han podido leer las normas de Rol.', ''));
        await crear();

        expect(texto()).toContain('No se han podido leer las normas de Rol.');
        expect(boton('Aceptar y seguir').disabled).toBeTrue();

        datos.leer.and.resolveTo(NORMAS);
        boton('Reintentar').click();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(texto()).toContain('Respeta la autoría de los demás.');
        expect(boton('Aceptar y seguir').disabled).toBeFalse();
    });
});
