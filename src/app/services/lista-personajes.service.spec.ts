import { TestBed } from '@angular/core/testing';

import { ListaPersonajesService } from './lista-personajes.service';

describe('ListaPersonajesService', () => {
  let service: ListaPersonajesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ListaPersonajesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
