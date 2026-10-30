import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { PlatformSessionService } from 'src/app/services/platform-session.service';
import { HelpLegalComponent } from '../help-legal/help-legal.component';
import { HelpRoadmapComponent, VERSIONES_ROL } from '../help-roadmap/help-roadmap.component';
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
            declarations: [AyudaComponent, HelpUsageAboutComponent, HelpRoadmapComponent, HelpLegalComponent],
            imports: [MatIconModule],
            providers: [{ provide: PlatformSessionService, useValue: { urlCompanion: 'https://apk.test/rol', urlSocial: () => 'https://social.test/normas' } }],
        }).compileComponents();
        fixture = TestBed.createComponent(AyudaComponent);
        fixture.detectChanges();
    });

    it('una navegación lateral con las cinco secciones y la actual marcada', () => {
        const botones = Array.from(elemento().querySelectorAll('.ayuda-nav__boton'));
        expect(botones.map((b) => b.textContent?.trim())).toEqual(['Primeros pasos', 'Novedades', 'Legal y privacidad', '3.5 Companion', 'Créditos']);
        expect(botones[0].getAttribute('aria-current')).toBe('page');
        expect(titulo()).toBe('Primeros pasos');
        expect(elemento().textContent).toContain('Ctrl+K');
    });

    it('se abre en la sección que se pide y se cambia desde la navegación', () => {
        abrir('legal', 1);
        expect(titulo()).toBe('Legal y privacidad');
        expect(elemento().querySelector('#legal-medicion')?.textContent).toContain('yosiftadisticas:ultima');
        expect(Array.from(elemento().querySelectorAll('.ayuda-indice__enlace')).length).toBe(6);

        (elemento().querySelectorAll('.ayuda-nav__boton')[1] as HTMLButtonElement).click();
        fixture.detectChanges();
        expect(titulo()).toBe('Novedades');
    });

    it('Novedades: la versión en curso arriba y abierta; las demás, plegadas', () => {
        abrir('novedades', 2);
        const versiones = Array.from(elemento().querySelectorAll('details.ayuda-version')) as HTMLDetailsElement[];
        expect(versiones.length).toBe(VERSIONES_ROL.length);
        expect(versiones[0].classList).toContain('ayuda-version--actual');
        expect(versiones[0].open).toBeTrue();
        expect(versiones.slice(1).every((v) => !v.open)).toBeTrue();
    });

    it('3.5 Companion enlaza la descarga y Créditos da la atribución de cada autor', () => {
        abrir('companion', 3);
        expect(elemento().querySelector('a.ayuda-boton')?.getAttribute('href')).toBe('https://apk.test/rol');
        abrir('creditos', 4);
        const autores = Array.from(elemento().querySelectorAll('.ayuda-creditos dt')).map((dt) => dt.textContent?.trim());
        expect(autores).toEqual(['Lorc', 'Delapouite', 'Skoll', 'Faithtoken']);
        expect(elemento().textContent).toContain('Creative Commons');
        expect(elemento().textContent).toContain('visored-helm');
    });
});
