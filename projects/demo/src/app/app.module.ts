import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterMetaModule } from 'ngx-router-meta';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ShowRouteComponent } from './show-route.component';

@NgModule({
  imports: [BrowserModule, RouterMetaModule.forRoot(), AppRoutingModule],
  declarations: [AppComponent, ShowRouteComponent],
  bootstrap: [AppComponent],
  providers: [],
})
export class AppModule {}
