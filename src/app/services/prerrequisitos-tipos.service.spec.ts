import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from 'src/environments/environment';
import { PrerrequisitosTiposService } from './prerrequisitos-tipos.service';
import { nombreTipoPrerrequisito } from './utils/prerrequisito-frase';

describe('PrerrequisitosTiposService', () => {
    let servicio: PrerrequisitosTiposService;
    let http: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()],
        });
        servicio = TestBed.inject(PrerrequisitosTiposService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => http.verify());

    it('pide los tipos una vez y deja sus nombres para el editor', async () => {
        const primera = servicio.cargar();
        const segunda = servicio.cargar();
        http.expectOne(`${environment.apiUrl}prerrequisitos/tipos`).flush([
            { Clave: 'ataque_base', Nombre: 'Ataque base mínimo', Ejemplo: 'Ataque base +6', Entidades: ['dote', 'clase'] },
        ]);
        await Promise.all([primera, segunda]);

        expect(nombreTipoPrerrequisito('ataque_base')).toBe('Ataque base mínimo');
        await servicio.cargar();
        http.expectNone(`${environment.apiUrl}prerrequisitos/tipos`);
    });

    it('si la ruta falla, sigue con el respaldo y lo vuelve a intentar la próxima vez', async () => {
        const fallida = servicio.cargar();
        http.expectOne(`${environment.apiUrl}prerrequisitos/tipos`).flush('error', { status: 503, statusText: 'Service Unavailable' });
        await fallida;

        expect(nombreTipoPrerrequisito('nivel_max')).toBe('Nivel max');
        void servicio.cargar();
        http.expectOne(`${environment.apiUrl}prerrequisitos/tipos`).flush([]);
    });
});
