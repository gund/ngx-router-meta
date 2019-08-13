import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { LazyComponent } from './lazy.component';
import { LazyRoutesModule } from './lazy.routing';

@NgModule({
  imports: [CommonModule, LazyRoutesModule],
  declarations: [LazyComponent],
})
export class LazyModule {}
