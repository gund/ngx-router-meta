import { TestBed } from '@angular/core/testing';

import { RouterMetaService } from './router-meta.service';

describe('RouterMetaService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RouterMetaService = TestBed.get(RouterMetaService);
    expect(service).toBeTruthy();
  });
});
