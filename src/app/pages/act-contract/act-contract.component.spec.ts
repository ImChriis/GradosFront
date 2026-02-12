import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActContractComponent } from './act-contract.component';

describe('ActContractComponent', () => {
  let component: ActContractComponent;
  let fixture: ComponentFixture<ActContractComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActContractComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActContractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
