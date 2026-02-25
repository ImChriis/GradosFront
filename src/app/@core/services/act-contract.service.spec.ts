import { TestBed } from '@angular/core/testing';

import { ActContractService } from './act-contract.service';

describe('ActContractService', () => {
  let service: ActContractService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ActContractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
