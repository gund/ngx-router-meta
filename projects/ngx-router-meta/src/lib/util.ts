import { Event, NavigationEnd } from '@angular/router';

export function isNavigationEndEvent(event: Event): event is NavigationEnd {
  return event instanceof NavigationEnd;
}

export function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
