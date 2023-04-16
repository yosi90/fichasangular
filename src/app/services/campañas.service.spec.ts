import { TestBed } from '@angular/core/testing';

import { CampañasService } from './campañas.service';

describe('CampañasService', () => {
  let service: CampañasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CampañasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
