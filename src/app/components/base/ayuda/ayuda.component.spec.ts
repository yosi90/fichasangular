import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TextoManualComponent } from '../../shared/texto-manual/texto-manual.component';
import { MatIconModule } from '@angular/material/icon';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { HelpLegalComponent } from '../help-legal/help-legal.component';
import { HelpUsageAboutComponent } from '../help-usage-about/help-usage-about.component';
import { AyudaComponent } from './ayuda.component';

describe('AyudaComponent', () => {
    let fixture: ComponentFixture<AyudaComponent>;
    const elemento = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const titulo = (): string => elemento().querySelector('.ayuda-cabecera__nombre')?.textContent?.trim() ?? '';
    const abrir = (seccion: any, id: number) => {
        fixture.componentRef.setInput('solicitud', { seccion, id });
        fixture.detectChanges();
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AyudaComponent, HelpUsageAboutComponent, HelpLegalComponent, TextoManualComponent],
            imports: [MatIconModule],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: PlatformSessionService, useValue: { urlCompanion: 'https://apk.test/rol', urlSocial: () => 'https://social.test/normas' } },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(AyudaComponent);
        fixture.detectChanges();
    });

    it('una navegación lateral con las cuatro secciones y la actual marcada (las novedades tienen su pestaña)', () => {
        const botones = Array.from(elemento().querySelectorAll('.ayuda-nav__boton'));
        expect(botones.map((b) => b.textContent?.trim())).toEqual(['Primeros pasos', 'Legal y privacidad', '3.5 Companion', 'Créditos']);
        expect(botones[0].getAttribute('aria-current')).toBe('page');
        expect(titulo()).toBe('Primeros pasos');
        expect(elemento().textContent).toContain('Ctrl+K');
    });

    it('se abre en la sección que se pide y se cambia desde la navegación', () => {
        abrir('legal', 1);
        expect(titulo()).toBe('Legal y privacidad');
        expect(elemento().querySelector('#legal-medicion')?.textContent).toContain('yosiftadisticas:ultima');
        expect(Array.from(elemento().querySelectorAll('.ayuda-indice__enlace')).map((e) => e.textContent?.trim())).toEqual([
            'Proyecto no oficial', 'Propiedad intelectual', 'Uso de la web', 'Normas de Rol', 'Datos de usuario',
            'Medición de audiencia', 'Alcance del texto',
        ]);
        TestBed.inject(HttpTestingController).match(() => true);

        (elemento().querySelectorAll('.ayuda-nav__boton')[2] as HTMLButtonElement).click();
        fixture.detectChanges();
        expect(titulo()).toBe('3.5 Companion');
    });

    it('3.5 Companion enlaza la descarga y Créditos da la atribución de cada autor', () => {
        abrir('companion', 3);
        expect(elemento().querySelector('a.ayuda-boton')?.getAttribute('href')).toBe('https://apk.test/rol');
        abrir('creditos', 4);
        const autores = Array.from(elemento().querySelectorAll('.ayuda-creditos dt')).map((dt) => dt.textContent?.trim());
        expect(autores).toEqual(['Lorc', 'Delapouite', 'Skoll', 'Faithtoken']);
        expect(elemento().textContent).toContain('Creative Commons');
        expect(elemento().textContent).toContain('visored-helm');
        expect(elemento().textContent).toContain('dado-d4');
    });

    it('Legal: los datos, en una línea que remite a la privacidad de Yosiftware, y las normas de Rol leídas sin sesión', async () => {
        abrir('legal', 5);
        const http = TestBed.inject(HttpTestingController);
        const peticion = http.expectOne((req) => req.url.endsWith('/v1/webs/rol/normas'));
        expect(peticion.request.method).toBe('GET');
        expect(peticion.request.headers.has('Authorization')).toBeFalse();
        peticion.flush({ id: 3, web: 'rol', version: 2, titulo: 'Normas de Rol', texto: '# Qué es Rol\n\nCrea **tus** personajes.', importante: true, publicadas: '2026-10-29T10:00:00Z' });
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const datos = elemento().querySelector('#legal-datos') as HTMLElement;
        expect(datos.querySelectorAll('p').length).toBe(1);
        expect(datos.querySelector('a')?.getAttribute('href')).toBe('https://social.test/normas');
        expect(datos.querySelector('a .simbolo-yosiftware')).not.toBeNull();
        const normas = elemento().querySelector('#legal-normas') as HTMLElement;
        expect(normas.querySelector('.legal-normas__version')?.textContent).toContain('versión 2');
        expect(normas.querySelector('app-texto-manual')?.textContent).toContain('Crea tus personajes.');
        expect(elemento().querySelector('#legal-medicion')?.textContent).toContain('yosiftadisticas:excluir');
        http.verify();
    });

    it('Legal: si no se pueden leer las normas de Rol, lo dice y deja reintentar', () => {
        abrir('legal', 6);
        const http = TestBed.inject(HttpTestingController);
        http.expectOne((req) => req.url.endsWith('/v1/webs/rol/normas')).flush({ code: 'normas_no_encontradas' }, { status: 404, statusText: 'Not Found' });
        fixture.detectChanges();
        return fixture.whenStable().then(() => {
            fixture.detectChanges();
            const error = elemento().querySelector('.legal-normas__error');
            expect(error?.textContent).toContain('No se han podido cargar las normas de Rol.');
            (error?.querySelector('button') as HTMLButtonElement).click();
            http.expectOne((req) => req.url.endsWith('/v1/webs/rol/normas'));
        });
    });
});
