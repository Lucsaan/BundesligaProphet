import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { LigaDataProvider } from '../../providers/liga-data/liga-data';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController, public ligaData:LigaDataProvider) {
  }

}
