import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LandingLayoutHeader } from './components/landing-layout-header';
import { LandingLayoutFooter } from './components/landing-layout-footer';

@Component({
  selector: 'lib-landing-layout',
  imports: [RouterOutlet, LandingLayoutHeader, LandingLayoutFooter],
  template: `
    <lib-landing-layout-header />
    <router-outlet />
    <lib-landing-layout-footer />
  `,
})
export class LandingLayout {}
