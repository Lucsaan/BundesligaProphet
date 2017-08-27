import { Injectable } from '@angular/core';
import { Http} from '@angular/http';
import 'rxjs/add/operator/map';
import PouchDB from 'pouchdb';
import { Storage } from '@ionic/storage';


/*
  Generated class for the LigaDataProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/
@Injectable()
export class LigaDataProvider {

  db: any;

  constructor(public http: Http, private storage:Storage) {
  
    this.db = new PouchDB('allGames');
    this.apiDataOnlineDB(1).subscribe(data => {
      console.log(data);
    });

    this.setStorageLocal('test', "lol");
    this.getStorageLocal('test').then(value =>{
      console.log(value);
    });
    
  }
  /*
  * Response der Spieltage aus der openligaDB
  * var gameDay -> der jewilige Spieltag - hier im jahr 2017
  */
  apiDataOnlineDB(gameDay){
    let url = 'https://www.openligadb.de/api/getmatchdata/bl1/2017/' + gameDay;
    let response = this.http.get(url).map(
      data => data.json()
    );
    return response;
  }

  setStorageLocal(key, value){
    this.storage.set(key, value);
  }
  getStorageLocal(key){
    return this.storage.get(key);
  }

  actualiseLocalDatabase(){


  }
}
