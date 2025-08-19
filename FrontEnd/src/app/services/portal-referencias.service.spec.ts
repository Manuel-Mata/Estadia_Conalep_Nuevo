import { TestBed } from '@angular/core/testing';

import { PortalReferenciasService } from './portal-referencias.service';

describe('PortalReferenciasService', () => {
  let service: PortalReferenciasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PortalReferenciasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
