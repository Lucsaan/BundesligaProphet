import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { MyApp } from './app.component';
import { HttpModule } from '@angular/http';

import { AboutPage } from '../pages/about/about';
import { ContactPage } from '../pages/contact/contact';
import { HomePage } from '../pages/home/home';
import { TabsPage } from '../pages/tabs/tabs';
import { SettingsPage } from '../pages/settings/settings';

import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { LigaDataProvider } from '../providers/liga-data/liga-data';
import { IonicStorageModule } from '@ionic/storage';
import { DbControllerProvider } from '../providers/db-controller/db-controller';
import { ApiControllerProvider } from '../providers/api-controller/api-controller';
import { ProphetEngineProvider } from '../providers/prophet-engine/prophet-engine';
import { Keyboard} from "@ionic-native/keyboard";


@NgModule({
  declarations: [
    MyApp,
    AboutPage,
    ContactPage,
    HomePage,
    TabsPage,
    SettingsPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    HttpModule,
    IonicStorageModule.forRoot()
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    AboutPage,
    ContactPage,
    HomePage,
    TabsPage,
    SettingsPage
    
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    LigaDataProvider,
    DbControllerProvider,
    ApiControllerProvider,
    ProphetEngineProvider,
      Keyboard,
    
  ]
})
export class AppModule {}
