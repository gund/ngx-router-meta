import { Event, NavigationEnd } from '@angular/router';

export function isNavigationEndEvent(event: Event): event is NavigationEnd {
  return event instanceof NavigationEnd;
}

export interface SafeRegexString extends String {
  __safe: true;
}

export function escapeRegExp(str: string): SafeRegexString {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') as any; // $& means the whole matched string
}
