import { TestBed } from '@angular/core/testing';

import { FichaPersonajeService } from './ficha-personaje.service';

describe('FichaPersonajeService', () => {
  let service: FichaPersonajeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FichaPersonajeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
