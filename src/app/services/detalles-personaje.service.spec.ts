import { TestBed } from '@angular/core/testing';

import { DetallesPersonajeService } from './detalles-personaje.service';

describe('DetallesPersonajeService', () => {
  let service: DetallesPersonajeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetallesPersonajeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
