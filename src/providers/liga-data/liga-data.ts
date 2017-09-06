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

  actualYearDb: any;
  lastYearsDb: any;
  settingsDb: any;
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
    this.dbController.getDataById(this.dbController.getDb('settings'), 'years')
    .then((data) => {
      this.settings = data;
      
      //console.log(this.settings);
      this.dbController.getData(this.dbController.getDb('lastYearsDb')).then((data) => {
        this.lastYears = data;
        console.log(this.lastYears); 
       this.evaluate();
        
      });
      this.dbController.getData(this.dbController.getDb('actualYearDb')).then((data) => {
        this.actualYear = data;
       // console.log(this.actualYear);
      });
      this.getNewGamedays();
      
      
    })
    .catch((err) => {
      console.log('New Seed');
      this.seedAll();
      return;
    });


  }

  evaluate(){
    let lastYearsDb = this.dbController.getDb('lastYearsDb');
    this.dbController.getDataById(lastYearsDb, '2014').then((data) => {
      let games2014 = data;
      console.log(games2014);
      console.log('Verarbeite Daten');
      games2014.games.forEach(element => {
        if(!this.clubExists(element.Team1.TeamName)){
          console.log(element.Team1.TeamName + ' existiert nicht. Wird angelegt')
          let club = {
          _id: element.Team1.TeamName,
          gegner: {}
        }
        this.dbController.update(this.dbController.getDb('clubs'), club);
        }
        this.setResult(element);
      });
      this.dbController.getData(this.dbController.getDb('clubs')).then((data) => {
        console.log(data);
      })
    }).catch((err) => {
      console.log('was geht?');
    });
  }
  
  seedAll(){
    let baseUrl = 'https://www.openligadb.de/api/getmatchdata/bl1/';
    
    this.settings = {
      _id: 'years',
    }

    for(let i = 2014 ; i < new Date().getFullYear()+1; i++){
      console.log('Hole Daten aus dem Jahr ' + (i));
      this.settings[i] = true;
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
        this.dbController.create(this.dbController.getDb('lastYearsDb'),year);
      })
      
    }
    this.dbController.create(this.dbController.getDb('settings'), this.settings)
    
    this.getData();
  }

  setResult(game){
    let clubsDb = this.dbController.getDb('clubs');
    let name_Team1 = game.Team1.TeamName;
    let name_Team2 = game.Team2.TeamName;
     
    // this.dbController.getDataById(clubsDb, name_Team1).then((data) => {
    //   console.log(data);
    //   let club = data;
    //   if(!club.gegner[name_Team2]){
    //     club.gegner[name_Team2] = [];
    //   }
    //   club.gegner[name_Team2].push({
    //     goalsOpponent: game.MatchResults[0].PointsTeam1,
    //     ownGoals: game.MatchResults[0].PointsTeam2,
    //     home: true
    //   });
    //   this.dbController.update(clubsDb, club);
      
    // }); 
    
  }
  clubExists(clubName) : boolean{
    let clubsDb = this.dbController.getDb('clubs');
    this.dbController.getDataById(clubsDb,clubName)
    .then(
      (data) => {
        //console.log(true);
        return true;
      })
      .catch((err) => {
       //console.log(false);
        return false;
      });
      return false;
  }

  setClub(clubName){
    let clubsDB = this.dbController.getDb('clubs');
    this.dbController.getDataById(clubsDB,clubName).then(
      (data) => {
        console.log(data);
      }
    ).catch((err) => {
      let club = {
        _id : clubName
      }
      this.dbController.create(clubsDB, club);
    })
  }


  checkIfActual(){

  }


  getNewGamedays(){
    let baseUrl_lastChange = "https://www.openligadb.de/api/getlastchangedate/bl1/2017/";
    let baseUrl_actualYear ="https://www.openligadb.de/api/getmatchdata/bl1/2017"
    this.apiController.getData(baseUrl_lastChange + 1).subscribe((data) => {
      console.log(data);
      let date = new Date(data);
      
    });
    this.apiController.getData(baseUrl_actualYear).subscribe((data) => {
      console.log(data);
    })
  }

  
   
  setStorageLocal(key, value){
    this.storage.set(key, value);
  }
  getStorageLocal(key){ 
    return this.storage.get(key);
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
