import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortalAlumnoComponent } from './portal-alumno.component';

describe('PortalAlumnoComponent', () => {
  let component: PortalAlumnoComponent;
  let fixture: ComponentFixture<PortalAlumnoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortalAlumnoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortalAlumnoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
