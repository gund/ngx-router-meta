import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title, TransferState } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

import { ROUTE_META_CONFIG } from './router-meta';
import { RouterMetaContextService } from './router-meta-context.service';
import { RouterMetaService } from './router-meta.service';

@Component({ selector: 'nrm-dummy', template: '' })
class DummyComponent {}

class TitleMock {
  getTitle = jest.fn();
  setTitle = jest.fn();
}

class MetaMock {
  updateTag = jest.fn();
  removeTag = jest.fn();
}

class RouterMetaContextServiceMock {
  getContext = jest.fn();
  // tslint:disable-next-line: variable-name
  _processContext = jest.fn();
  // tslint:disable-next-line: variable-name
  _templateStr = jest.fn();
}

describe('RouterMetaService', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: '', component: DummyComponent },
          { path: 'child', component: DummyComponent },
        ]),
      ],
      declarations: [DummyComponent],
      providers: [
        RouterMetaService,
        { provide: Title, useClass: TitleMock },
        { provide: Meta, useClass: MetaMock },
        {
          provide: RouterMetaContextService,
          useClass: RouterMetaContextServiceMock,
        },
        { provide: ROUTE_META_CONFIG, useValue: {} },
      ],
    }),
  );

  describe('getOriginalTitle() method', () => {
    it('should return value from `Title.getTitle()`', () => {
      const title = TestBed.get(Title) as TitleMock;
      title.getTitle.mockReturnValue('some title');

      const res = getService().getOriginalTitle();

      expect(res).toBe('some title');
    });

    describe('when `TransferState` available', () => {
      it('should call `TransferState.get()` with [makeStateKey(RouterMetaTitle), Title.getTitle()]', () => {
        const transferStateMock = {
          get: jest.fn().mockReturnValue('transferred title'),
        };

        TestBed.configureTestingModule({
          providers: [{ provide: TransferState, useValue: transferStateMock }],
        });

        const title = TestBed.get(Title) as TitleMock;
        title.getTitle.mockReturnValue('some title');

        const res = getService().getOriginalTitle();

        expect(res).toBe('transferred title');
        expect(title.getTitle).toHaveBeenCalled();
        expect(transferStateMock.get).toHaveBeenCalledWith(
          'RouterMetaTitle',
          'some title',
        );
      });
    });
  });
});

function getService(): RouterMetaService {
  return TestBed.get(RouterMetaService);
}
