import { Injectable } from '@angular/core';
import { Http} from '@angular/http';
import 'rxjs/add/operator/map';
import PouchDB from 'pouchdb';
import { Storage } from '@ionic/storage';
import { ToastController } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { ApiControllerProvider } from '../api-controller/api-controller';
import { DbControllerProvider } from '../db-controller/db-controller';

@Injectable()
export class LigaDataProvider {

  actualYearDB: any;
  lastYearsDB: any;
  settingsDB: any;
  loader: any;

  actualYear: any;
  lastYears: any;
  settings: any = [];

  constructor(
    public http: Http, 
    public storage:Storage, 
    public toastCtrl : ToastController, 
    public loadingCtrl: LoadingController, 
    public apiController: ApiControllerProvider, 
    public dbController : DbControllerProvider ) {
      
      this.getData();    
  }

   getData(){
    this.dbController.getData(this.dbController.getDb('settings')).then((data) => {
        this.settings = data;
        console.log(this.settings);
        if(this.settings.length < 1){
          console.log('Noch keine Settings und Datenbanken vorhanden');
          console.log('Setze Settings');
          console.log('Setze Datenbank');
          this.seedAll();
        }else {
          this.dbController.getData(this.dbController.getDb('lastYearsDB')).then((data) => {
            this.lastYears = data;
            console.log(this.lastYears);
          });
          this.dbController.getData(this.dbController.getDb('actualYearDB')).then((data) => {
            this.actualYear = data;
            console.log(this.actualYear);
          });
        }
      });
  }
  
  seedAll(){
    let baseUrl = 'https://www.openligadb.de/api/getmatchdata/bl1/';
    
    this.settings = {
      _id: 'years',
      2014: true,
      2015: true,
      2016: true
    }

    this.dbController.create(this.dbController.getDb('settings'), this.settings);
    
    for(let i = 2014 ; i < new Date().getFullYear(); i++){
      console.log('Hole Daten aus dem Jahr ' + (i));
      let allGamedays = [];
      this.apiController.getData(baseUrl + (i).toString()).subscribe(data => {
        data.forEach(element => {
          allGamedays.push(element);
        });
        console.log(allGamedays);
        let year = {
          _id: (i).toString(),
          games: allGamedays
        }
        console.log(year);
        this.dbController.create(this.dbController.getDb('lastYearsDB'),year);
      })
      
    }
    this.getData();
  }
   
  setStorageLocal(key, value){
    this.storage.set(key, value);
  }
  getStorageLocal(key){  }

  equaliseGameDay(data){
    console.log(data);

  }

  showToast(whatsUp){
    let toastText;

    switch(whatsUp){
      case 'noNetwork': 
        'Keine Netzwerkverbindung. Möglicherweile sind die Daten nicht auf dem neuesten Stand.'
      break;

      default: 'Irgendwas, aber nit so wichtig, ist passiert... Relax!!!'
      break; 
    }

    let toast = this.toastCtrl.create({
      message: toastText,
      duration: 3000
    });
    toast.present();
  }  

  presentLoading() {
    let loader = this.loadingCtrl.create({
      content: "Verarbeite Daten für den ersten Gebrauch"
    });
    loader.present();
    return loader;
  }
  

}
