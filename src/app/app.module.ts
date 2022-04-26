import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';

import {IonicModule, IonicRouteStrategy} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {IonicStorageModule} from '@ionic/storage';
import {Camera, CameraOptions} from '@ionic-native/camera/ngx';
import {ActionSheet, ActionSheetOptions} from '@ionic-native/action-sheet/ngx';
import {PhotoLibrary} from '@ionic-native/photo-library/ngx';
//import {CallNumber} from '@ionic-native/call-number/ngx';
import {EmailComposer} from '@ionic-native/email-composer/ngx';
import {CommentsModalPageModule} from './services/detail/comments/comments.module';
import {InAppBrowser} from '@ionic-native/in-app-browser/ngx';
import {AppConfig} from './AppConfig';
import {HttpClientModule} from '@angular/common/http';

import { ImageModalPage } from './services/image-modal/image-modal.page';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { FCM } from '@ionic-native/fcm/ngx';
import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { FirebaseX } from '@ionic-native/firebase-x/ngx';
import {AppVersion} from '@ionic-native/app-version/ngx';
import { DatePicker } from '@ionic-native/date-picker/ngx';
import { ImagePicker, ImagePickerOptions } from '@ionic-native/image-picker/ngx';

const config = {
    apiKey: "AIzaSyAO3nLfA8wLPsz7ZxKi1qXv-bc2_iDiwek",
    authDomain: "hsh-app-push-notification.firebaseapp.com",
    databaseURL: "https://hsh-app-push-notification.firebaseio.com",
    projectId: "hsh-app-push-notification",
    storageBucket: "hsh-app-push-notification.appspot.com",
    messagingSenderId: "707211142117",
    appId: "1:707211142117:web:43f0f27ee16df6bdb6050c",
    measurementId: "G-55L1K0V51S"
};

@NgModule({
    declarations: [AppComponent],
    entryComponents: [],
    imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule, FormsModule,
        ReactiveFormsModule, IonicStorageModule.forRoot(),
        AngularFireModule.initializeApp(config),
        AngularFirestoreModule],
    providers: [
        StatusBar,
        SplashScreen,
        {provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
        Camera,
        ActionSheet,
        PhotoLibrary,
        //CallNumber,
        EmailComposer,
        InAppBrowser,
        CommentsModalPageModule,
        ImageModalPage,
        AppConfig,
        FCM,
        FirebaseX,
        AppVersion,
        DatePicker,
        ImagePicker
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
