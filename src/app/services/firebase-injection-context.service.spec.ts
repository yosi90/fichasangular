import { TestBed } from '@angular/core/testing';
import { FirebaseInjectionContextService } from './firebase-injection-context.service';

describe('FirebaseInjectionContextService', () => {
    it('ejecuta una funcion y devuelve su resultado', () => {
        TestBed.configureTestingModule({});
        const service = TestBed.inject(FirebaseInjectionContextService);

        const result = service.run(() => 42);

        expect(result).toBe(42);
    });
});
