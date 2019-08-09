import { isPlatformServer } from '@angular/common';
import { Component, Inject, NgZone, OnInit, PLATFORM_ID } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterMetaService } from 'ngx-router-meta';
import { merge, of, timer } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-show-route',
  template: `
    <p>Current title: {{ title$ | async }}</p>
    <p>Current url: {{ url$ | async }}</p>
  `,
})
export class ShowRouteComponent implements OnInit {
  title$ = merge(this.route.url, this.zone.onStable).pipe(
    map(() => this.titleService.getTitle()),
  );

  url$ = merge(this.route.url).pipe(map(() => this.router.url));

  constructor(
    @Inject(PLATFORM_ID) private platformId: any,
    private zone: NgZone,
    private titleService: Title,
    private router: Router,
    private route: ActivatedRoute,
    private routerMetaService: RouterMetaService,
  ) {}

  ngOnInit(): void {
    if (this.router.url === '/') {
      const source$ = isPlatformServer(this.platformId)
        ? of(0)
        : timer(0, 1000);

      this.routerMetaService.provideContext(
        source$.pipe(map(i => ({ msg: 'Hi!', count: i }))),
      );
    }
  }
}
