import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterMetaService } from 'ngx-router-meta';

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
    <router-outlet></router-outlet>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  constructor(private routerMetaService: RouterMetaService) {}

  ngOnInit(): void {
    this.routerMetaService.provideDefaultContext({ appName: 'DEMO' });
  }
}
