import {AppRoutingModule} from './app-routing.module';
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {NgxOdeSijilModule} from 'ngx-ode-sijil';

import {CoreModule} from './core/core.module';
import {AppComponent} from './app.component';
import {AppHomeComponent} from './app-home.component';
import {HttpClientModule} from '@angular/common/http';
import { COMPONENT_LIFECYCLE_DEBUG_MODE } from 'ngx-ode-core';

import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeEs from '@angular/common/locales/es';
import localeFr from '@angular/common/locales/fr';
import localeIt from '@angular/common/locales/it';
import localePt from '@angular/common/locales/pt';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

registerLocaleData(localeDe);
registerLocaleData(localeEs);
registerLocaleData(localeFr);
registerLocaleData(localeIt);
registerLocaleData(localePt);

@NgModule({
    imports: [
        BrowserModule,
        AppRoutingModule,
        CoreModule,
        HttpClientModule,
        NgxOdeSijilModule.forRoot(),
        BrowserAnimationsModule
    ],
    declarations: [
        AppComponent,
        AppHomeComponent
    ],
    bootstrap: [AppComponent],
    providers: [
        { provide: COMPONENT_LIFECYCLE_DEBUG_MODE, useValue: 1 }
    ]
})
export class AppModule {
}
