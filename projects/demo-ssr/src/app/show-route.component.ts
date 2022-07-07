import { isPlatformServer } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterMetaContextService } from 'ngx-router-meta';
import { map, merge, of, timer } from 'rxjs';

@Component({
  selector: 'app-show-route',
  template: `
    <p>Current title: {{ title$ | async }}</p>
    <p>Current url: {{ url$ | async }}</p>
  `,
})
export class ShowRouteComponent implements OnInit {
  title$ = merge(
    this.route.url,
    this.routerMetaContextService.getContext(),
  ).pipe(map(() => this.titleService.getTitle()));

  url$ = merge(this.route.url).pipe(map(() => this.router.url));

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private titleService: Title,
    private router: Router,
    private route: ActivatedRoute,
    private routerMetaContextService: RouterMetaContextService,
  ) {}

  ngOnInit(): void {
    if (this.router.url === '/') {
      const source$ = isPlatformServer(this.platformId)
        ? of(0)
        : timer(0, 1000);

      this.routerMetaContextService.provideContext(
        source$.pipe(map(i => ({ msg: 'Hi!', count: i }))),
      );
    }
  }
}
