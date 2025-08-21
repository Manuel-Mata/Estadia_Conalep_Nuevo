import { TestBed } from '@angular/core/testing';

import { GeneradorReferenciaVbaService } from './generador-referencia-vba.service';

describe('GeneradorReferenciaVbaService', () => {
  let service: GeneradorReferenciaVbaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeneradorReferenciaVbaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
