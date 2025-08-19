import { TestBed } from '@angular/core/testing';

import { ReferenceGeneratorService } from './reference-generator.service';

describe('ReferenceGeneratorService', () => {
  let service: ReferenceGeneratorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReferenceGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
