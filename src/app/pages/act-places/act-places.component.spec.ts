import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActPlacesComponent } from './act-places.component';

describe('ActPlacesComponent', () => {
  let component: ActPlacesComponent;
  let fixture: ComponentFixture<ActPlacesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActPlacesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActPlacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
