import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
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
            '3.5 Companion', 'Medición de audiencia', 'Alcance del texto',
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
        const medicion = (elemento().querySelector('#legal-medicion')?.textContent ?? '').replace(/\s+/g, ' ');
        expect(medicion).toContain('yosiftadisticas:excluir');
        // La medición, en la versión 4 de estadisticas-kit/POLITICA_DE_COOKIES.md: Cloudflare (la 3) y el responsable (la 4).
        expect(medicion).toContain('a través de Cloudflare, que conecta los servidores de Yosiftware con Internet');
        expect(medicion).toContain('El responsable es Antonio Josafat González Correa, titular de Yosiftware.');
        expect(medicion).toContain('Para que ni siquiera lo descargue, bloquea con una extensión');
        expect(medicion).not.toContain('El responsable es Yosiftware;');
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
    it('Legal: el apartado «3.5 Companion», con el texto de privacidad aprobado el 2026-11-12, tal cual', () => {
        abrir('legal', 8);
        TestBed.inject(HttpTestingController).match(() => true);
        const apartado = elemento().querySelector('section#legal-companion') as HTMLElement;
        expect(apartado.querySelector('h3')?.textContent?.trim()).toBe('3.5 Companion');
        expect((apartado.querySelector('p')?.textContent ?? '').replace(/\s+/g, ' ').trim()).toBe(
            '3.5 Companion, la app de Rol para Android, usa tu cuenta de Yosiftware, que se rige por la política de privacidad de '
            + 'Yosiftware. Además, guarda en tu móvil, solo para funcionar: una copia de tus fichas y campañas privadas, para usarlas '
            + 'sin conexión (cifrada, fuera de las copias de seguridad, separada por cuenta y como mucho 3 días desde la última vez que '
            + 'el servidor confirmó tu acceso); los mensajes del chat que aún no se han enviado, cifrados; tus favoritos, lo último que '
            + 'has visto, tus tiradas guardadas y su historial y el rastreador de esencia de tus fichas, por cuenta; y tus preferencias '
            + 'de la app y del sonido. La copia de tus fichas y campañas y los mensajes sin enviar se borran al cerrar la sesión de esa cuenta; lo demás, al desinstalar la app. Las voces '
            + 'de los personajes se descargan solo mientras suenan. La app no lleva anuncios ni analítica.');
    });

    it('con un apartado en la petición, baja a él al abrir y otra vez al llegar las normas, que van antes y lo empujan', fakeAsync(() => {
        const bajadas: string[] = [];
        spyOn(Element.prototype, 'scrollIntoView').and.callFake(function (this: Element) { bajadas.push(this.id); });
        const http = TestBed.inject(HttpTestingController);
        fixture.componentRef.setInput('solicitud', { seccion: 'legal', id: 9, apartado: 'legal-companion' });
        fixture.detectChanges();
        tick();
        expect(titulo()).toBe('Legal y privacidad');
        expect(bajadas).toEqual(['legal-companion']);

        http.expectOne((req) => req.url.endsWith('/v1/webs/rol/normas'))
            .flush({ id: 3, web: 'rol', version: 2, titulo: 'Normas de Rol', texto: 'Texto largo.', importante: true, publicadas: '2026-10-29T10:00:00Z' });
        flushMicrotasks();
        fixture.detectChanges();
        tick();
        expect(bajadas).toEqual(['legal-companion', 'legal-companion']);
        expect(elemento().querySelector('#legal-companion-titulo')?.getAttribute('tabindex')).toBe('-1');

        // Cambiar de sección y volver a Legal desde la navegación ya no baja al apartado.
        (elemento().querySelectorAll('.ayuda-nav__boton')[0] as HTMLButtonElement).click();
        fixture.detectChanges();
        (elemento().querySelectorAll('.ayuda-nav__boton')[1] as HTMLButtonElement).click();
        fixture.detectChanges();
        http.expectOne((req) => req.url.endsWith('/v1/webs/rol/normas')).flush({ id: 3, web: 'rol', version: 2, titulo: 'Normas de Rol', texto: 'Texto.', importante: true, publicadas: '' });
        flushMicrotasks();
        fixture.detectChanges();
        tick();
        expect(bajadas.length).toBe(2);
        http.verify();
    }));

    it('un apartado que no es de la página no mueve nada', fakeAsync(() => {
        const scroll = spyOn(Element.prototype, 'scrollIntoView');
        fixture.componentRef.setInput('solicitud', { seccion: 'legal', id: 10, apartado: 'otro"], img' });
        fixture.detectChanges();
        tick();
        TestBed.inject(HttpTestingController).match(() => true);
        flushMicrotasks();
        tick();
        expect(titulo()).toBe('Legal y privacidad');
        expect(scroll).not.toHaveBeenCalled();
    }));
    it('si la pestaña aún no se ve (se elige después de abrirla), espera a que se vea para bajar', fakeAsync(() => {
        const bajadas: string[] = [];
        spyOn(Element.prototype, 'scrollIntoView').and.callFake(function (this: Element) { bajadas.push(this.id); });
        elemento().style.display = 'none';
        fixture.componentRef.setInput('solicitud', { seccion: 'legal', id: 11, apartado: 'legal-companion' });
        fixture.detectChanges();
        // Las normas fallan mientras sigue oculta: no hay nada que las empuje, pero aún no se puede bajar.
        TestBed.inject(HttpTestingController).expectOne((req) => req.url.endsWith('/v1/webs/rol/normas'))
            .flush({ code: 'normas_no_encontradas' }, { status: 404, statusText: 'Not Found' });
        flushMicrotasks();
        fixture.detectChanges();
        tick(300);
        expect(bajadas).toEqual([]);

        elemento().style.display = '';
        tick(50);
        expect(bajadas).toEqual(['legal-companion']);
        tick(3000);
        expect(bajadas).toEqual(['legal-companion']);
    }));
});
