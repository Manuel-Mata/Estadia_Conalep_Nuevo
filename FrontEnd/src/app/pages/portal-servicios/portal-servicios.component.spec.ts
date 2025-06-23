import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortalServiciosComponent } from './portal-servicios.component';

describe('PortalServiciosComponent', () => {
  let component: PortalServiciosComponent;
  let fixture: ComponentFixture<PortalServiciosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortalServiciosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortalServiciosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
