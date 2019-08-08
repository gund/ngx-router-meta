import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RouterMetaService } from 'ngx-router-meta';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-show-route',
  template: `
    <p>Current url: {{ url }}</p>
  `,
})
export class ShowRouteComponent implements OnInit {
  url = this.router.url;

  constructor(
    private router: Router,
    private routerMetaService: RouterMetaService,
  ) {}

  ngOnInit(): void {
    if (this.router.url === '/') {
      this.routerMetaService.provideContext(
        timer(0, 1000).pipe(map(i => ({ msg: 'Hi!', count: i }))),
      );
    }
  }
}
