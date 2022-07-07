import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';

@Component({
  selector: 'nrm-lazy',
  templateUrl: './lazy.component.html',
  styleUrls: ['./lazy.component.css'],
})
export class LazyComponent {
  url$ = this.route.url.pipe(map(() => this.router.url));

  constructor(private route: ActivatedRoute, private router: Router) {}
}
