import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { LigaDataProvider } from '../../providers/liga-data/liga-data';
import { ProphetEngineProvider } from "../../providers/prophet-engine/prophet-engine";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController, public ligaData:LigaDataProvider, public prophet: ProphetEngineProvider) {
  }

}
