import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortalAlumnoReferenciasComponent } from './portal-alumno-referencias.component';

describe('PortalAlumnoReferenciasComponent', () => {
  let component: PortalAlumnoReferenciasComponent;
  let fixture: ComponentFixture<PortalAlumnoReferenciasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortalAlumnoReferenciasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortalAlumnoReferenciasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
