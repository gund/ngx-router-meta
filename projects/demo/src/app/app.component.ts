import { Component } from '@angular/core';

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
    </ul>
    <router-outlet></router-outlet>
  `,
  styles: [],
})
export class AppComponent {}
