import { NgModule } from '@angular/core';
import {
  BrowserModule,
  BrowserTransferStateModule,
} from '@angular/platform-browser';
import { RouterMetaModule } from 'ngx-router-meta';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ShowRouteComponent } from './show-route.component';

@NgModule({
  imports: [
    BrowserModule.withServerTransition({ appId: 'demo-ssr' }),
    BrowserTransferStateModule,
    RouterMetaModule.forRoot({
      defaultMeta: {
        _templates_: {
          title: '{title} | {appName}',
          description: 'Desc: {description}',
        },
        description: 'Nothing to say by default...',
      },
    }),
    AppRoutingModule,
  ],
  declarations: [AppComponent, ShowRouteComponent],
  bootstrap: [AppComponent],
  providers: [],
})
export class AppModule {}
