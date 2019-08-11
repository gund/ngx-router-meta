import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterMetaContextService } from 'ngx-router-meta';

@Component({
  selector: 'app-root',
  template: `
    <ul>
      <li>
        <h2><a routerLink="/">Home</a></h2>
      </li>
      <li>
        <h2><a routerLink="/route1">Route 1</a></h2>
      </li>
      <li>
        <h2><a routerLink="/route2">Route 2</a></h2>
      </li>
      <li>
        <h2><a routerLink="/route3">Route 3</a></h2>
      </li>
    </ul>
    <button (click)="clearCtx()">Clear context</button>
    <button (click)="toggleDefaultCtx()">
      {{ defaultCtxProvided ? 'Clear default context' : 'Set default context' }}
    </button>
    <router-outlet></router-outlet>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  defaultCtxProvided = false;

  constructor(private routerMetaContextService: RouterMetaContextService) {}

  ngOnInit(): void {
    this.setDefaultCtx();
  }

  clearCtx() {
    this.routerMetaContextService.clearContext();
  }

  toggleDefaultCtx() {
    if (this.defaultCtxProvided) {
      this.clearDefaultCtx();
    } else {
      this.setDefaultCtx();
    }
  }

  clearDefaultCtx() {
    this.defaultCtxProvided = false;
    this.routerMetaContextService.clearDefaultContext();
  }

  setDefaultCtx() {
    this.defaultCtxProvided = true;
    this.routerMetaContextService.provideDefaultContext({ appName: 'DEMO' });
  }
}
