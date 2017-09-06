import { Injectable } from '@angular/core';
import { Http} from '@angular/http';
import 'rxjs/add/operator/map';
import PouchDB from 'pouchdb';
import { Storage } from '@ionic/storage';
import { ToastController } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { ApiControllerProvider } from '../api-controller/api-controller';
import { DbControllerProvider } from '../db-controller/db-controller';



/*
  Generated class for the LigaDataProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/
@Injectable()
export class LigaDataProvider {

  db: any;
  data: any;
  lastCompleteGameDay: number;
  loader: any;

  constructor(public http: Http, private storage:Storage, public toastCtrl : ToastController, public loadingCtrl: LoadingController, public apiController: ApiControllerProvider, 
    public dbController : DbControllerProvider ) {
    
    this.db = this.dbController.getDb('actualGames');

    this.apiController.getData('https://www.openligadb.de/api/getmatchdata/bl1/2016').subscribe((data) => {
      console.log(data);
    });

    // this.getGameDays().then((data) => {
    //   if(data.length < 1) {
    //     this.seed(1);
    //   }else {
    //     console.log(this.data);
    //   }
    // })

    this.dbController.getData(this.db).then((data) => {
      console.log(data);
      this.data = data;
        console.log(data);

        if(this.data.length < 1){
          console.log("Nix drin")

        }else{
          console.log('Was drin')
      }

    });

    let years = {
      2014: 'true',
      2015: 'false',
      2016: 'true'
    }




    this.dbController.create(this.db, years);



    
  }



  
  /*
  * Response der Spieltage aus der openligaDB
  * var gameDay -> der jewilige Spieltag - hier im jahr 2017
  */

  seed(i){
    console.log(i);
    if(i === 1){
      this.loader = this.presentLoading();
    }
    this.getDataFromApi(i).subscribe((data) => {
      let gameDay = {
        day : i,
        games : data
      };
      if(data.length > 1){
        try{
          this.createGameDay(gameDay);
        }catch(e) {
          console.log(e);
          return;
        }
        this.seed(++i);
      }  else {
        this.loader.dismiss();
      }
    });    
      
  }

  getAll(){
    if(this.data < 1){
      this.seed(1);
    } else{
      console.log('Hab scho');
    }
    
  }

  getDataFromApi(gameDay){
    let url = 'https://www.openligadb.de/api/getmatchdata/bl1/2017/' + gameDay;
    let response = this.http.get(url).map(
      data => data.json()
      
      
    );
    return response;
  }

  setStorageLocal(key, value){
    this.storage.set(key, value);
  }
  getStorageLocal(key){  }

  getGameDays() {
    if(this.data){
      return Promise.resolve(this.data);
    }
    return new Promise(resolve => {
      this.db.allDocs({
        include_docs: true
      }).then(
        (result) => {
          this.data = [];
          let doc = result.rows.map(
            (row) => {
              this.data.push(row.doc);
            }
          );
          resolve(this.data);
          this.db.changes({live:true, since: 'now', include_docs: true}).on('change', (change) => {
            this.handleChange(change);
          });
        }
      ).catch((error) => {
        console.log(error);
      });
    });
  }

  createGameDay(gameDay){
      this.db.put(gameDay);
  }

  updateGameDay(gameDay){
    this.db.put(gameDay).catch((err)=> {
      console.log(err);
    });
  }

  deletegameDay(gameDay){
    this.db.remove(gameDay).catch((err) => {
      console.log(err);
    });
    console.log('Spieltag ' + gameDay.day + ' gelöscht!');
  }

  resetOnlineApi(){
    for(let gameDay of this.data){
      this.deletegameDay(gameDay);
    }
  }

  handleChange(change){
 
    let changedDoc = null;
    let changedIndex = null;
 
    this.data.forEach((doc, index) => {
 
      if(doc._id === change.id){
        changedDoc = doc;
        changedIndex = index;
      }
 
    });
 
    //A document was deleted
    if(change.deleted){
      this.data.splice(changedIndex, 1);
    } 
    else {
  
      //A document was updated
      if(changedDoc){
        this.data[changedIndex] = change.doc;
      } 
  
      //A document was added
      else {
        this.data.push(change.doc); 
      }
 
    }
 
  }

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
