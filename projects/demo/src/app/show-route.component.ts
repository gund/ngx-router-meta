import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-show-route',
  template: `
    <p>Current url: {{ url }}</p>
  `,
})
export class ShowRouteComponent {
  url = this.router.url;

  constructor(private router: Router) {}
}
