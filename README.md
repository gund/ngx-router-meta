# NgxRouterMeta

[![Build Status](https://travis-ci.org/gund/ngx-router-meta.svg?branch=master)](https://travis-ci.org/gund/ngx-router-meta)
[![codecov](https://codecov.io/gh/gund/ngx-router-meta/branch/master/graph/badge.svg)](https://codecov.io/gh/gund/ngx-router-meta)
[![Maintainability](https://api.codeclimate.com/v1/badges/75faccce723e7021b790/maintainability)](https://codeclimate.com/github/gund/ngx-router-meta/maintainability)
[![Npm](https://img.shields.io/npm/v/ngx-router-meta.svg)](https://www.npmjs.com/package/ngx-router-meta)
[![Npm Downloads](https://img.shields.io/npm/dt/ngx-router-meta.svg)](https://www.npmjs.com/package/ngx-router-meta)
![Size](https://badgen.net/bundlephobia/minzip/ngx-router-meta)
[![Licence](https://img.shields.io/npm/l/ngx-router-meta.svg?maxAge=2592000)](https://github.com/gund/ngx-router-meta/blob/master/LICENSE)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

> Configure HTML meta tags in route configuration of Angular for SSR

## Features

- Native support for SSR - so all meta data will be served to any crawler
- Declarative configuration of meta tags without any restrictions
- Templating in strings with dynamic data from context
- Global templates for any type of meta tag
- Contexts can be either plain objects or RxJs Observables of objects
- Default (global) and local contexts (reset after every route navigation)

## Install

```
npm install ngx-router-meta
```

## Configure

1. Just import `RouterMetaModule.forRoot()` in your `AppModule`:

```ts
import { NgModule } from '@angular/core';
import { RouterMetaModule } from 'ngx-router-meta';

@NgModule({
  imports: [RouterMetaModule.forRoot()],
})
export class AppModule {}
```

2. And then configure give your routes some ~~love~~ meta info:  
   **TIP**: You can use `RoutesWithMeta` instead of default `Routes` type
   from `@angular/router` package for extra type info!

```ts
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { RoutesWithMeta } from 'ngx-router-meta';

import { ShowRouteComponent } from './show-route.component';

const routes: RoutesWithMeta = [
  {
    path: '',
    component: ShowRouteComponent,
    data: {
      meta: {
        title: 'Home Page',
        description: 'Tell everyone about your home!',
      },
    },
  },
  {
    path: 'route1',
    component: ShowRouteComponent,
    data: {
      meta: {
        title: 'Route 1 Page',
        'custom:tag': 'Works!',
      },
    },
  },
  {
    path: 'route2',
    component: ShowRouteComponent,
    // Look, these tags are not even required, yay!!
  },
];
```

3. Serve your app (even with SSR) and enjoy your meta!

## Documentation

**Coming really soon =)**

---

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 8.2.0.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
