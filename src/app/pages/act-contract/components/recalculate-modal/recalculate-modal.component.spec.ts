import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecalculateModalComponent } from './recalculate-modal.component';

describe('RecalculateModalComponent', () => {
  let component: RecalculateModalComponent;
  let fixture: ComponentFixture<RecalculateModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecalculateModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecalculateModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
