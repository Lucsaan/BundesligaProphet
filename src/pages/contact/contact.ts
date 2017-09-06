import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import {LigaDataProvider} from "../../providers/liga-data/liga-data";

@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html'
})
export class ContactPage {

  includedYears: any = [];

  constructor(public navCtrl: NavController, private ligaData: LigaDataProvider) {

  }



}
