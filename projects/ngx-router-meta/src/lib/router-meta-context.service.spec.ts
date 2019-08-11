/* tslint:disable:no-unused-variable */

import { async, inject, TestBed } from '@angular/core/testing';

import { RouterMetaContextService } from './router-meta-context.service';

describe('Service: RouterMetaContext', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RouterMetaContextService],
    });
  });

  it('should ...', inject(
    [RouterMetaContextService],
    (service: RouterMetaContextService) => {
      expect(service).toBeTruthy();
    },
  ));
});
