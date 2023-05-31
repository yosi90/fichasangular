import { TestBed } from '@angular/core/testing';

import { ManualesService } from './manuales.service';

describe('ManualesService', () => {
  let service: ManualesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManualesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
