import { TestBed } from '@angular/core/testing';

import { RazasService } from './razas.service';

describe('RazasService', () => {
  let service: RazasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RazasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
