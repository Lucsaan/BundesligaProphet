import { Injectable } from '@angular/core';
import { Http} from '@angular/http';
import 'rxjs/add/operator/map';
import PouchDB from 'pouchdb';
import { Storage } from '@ionic/storage';
import { ToastController } from 'ionic-angular';
import { LoadingController } from 'ionic-angular';
import { ApiControllerProvider } from '../api-controller/api-controller';
import { DbControllerProvider } from '../db-controller/db-controller';
import { Observable } from "rxjs/Observable";

@Injectable()
export class LigaDataProvider {

  actualYearDb: any;
  lastYearsDb: any;
  settingsDb: any;
  clubsDb: any;
  loader: any;

  actualYear: any;
  lastYears: any;
  settings: any = [];
  actualClubs: any = {};

  constructor(
    public http: Http, 
    public storage:Storage, 
    public toastCtrl : ToastController, 
    public loadingCtrl: LoadingController, 
    public apiController: ApiControllerProvider, 
    public dbController : DbControllerProvider ) {

      this.lastYearsDb = this.dbController.getDb('lastYearsDb');
      this.settingsDb = this.dbController.getDb('settings');
      this.clubsDb = this.dbController.getDb('clubs');
      
      this.getData();  
        
  }

  getData(){
      this.getSettings()
        .then((data) => {
          this.getDataFromDataBase().subscribe((data) =>{
            if(this.lastYears !== undefined && this.actualClubs.length < 1){
              console.log(this.lastYears);
              console.log('Bilde Vereine');
              this.buildActualClubs().subscribe((data) =>{
                this.getClubs().then((data) => {
                  this.actualClubs = data;
                  console.log(this.actualClubs);
                })
              });
            }
          });
          this.settings = data;
          console.log(this.settings);
         
        })
        .catch((err) => {
          console.log('Hole Daten');
          this.seedAll().subscribe((response) => {  
            this.getData();
          });

        });
  }
  getDataFromDataBase(){
    return Observable.create(observer => {
      this.getClubs().then((data) => {
          this.actualClubs = data;
          observer.next(data);
      });
      this.getGamesAllYears().then((data) => {
          this.lastYears = data;
          observer.next(data);
      });

    })
  }
  buildActualClubs(){
    return Observable.create(observer => {
      this.lastYears.forEach(element => {
        element.games.forEach(element => {
          this.addClub(element.Team1.TeamName);
        });
      });
      this.getClubs().then((data) => {
        observer.next(data);
        console.log(this.actualClubs);
        observer.complete();
      })
    })
  }

   addClub(clubName){
    if(this.clubExists(clubName)){
      return;
    }
    this.actualClubs[clubName] = true;
    console.log(clubName+ ' existiert nicht. Wird angelegt')
    let club = {
        _id: clubName,
        gegner: {}
    }
    this.dbController.update(this.dbController.getDb('clubs'), club);
  }
  clubExists(clubName){
    if(this.actualClubs[clubName] !== undefined){
      return true;
    }
      return false;
  }

  
  getSettings(){
    return this.dbController.getDataById(this.settingsDb, 'years');
  }
  getClubs(){
    return this.dbController.getData(this.clubsDb);
  }
  getClub(clubName){
    this.dbController.getDataById(this.clubsDb, clubName).then((data) => {
      return data;
    })
  }
  getGamesAllYears(){
    return this.dbController.getData(this.lastYearsDb);
  }
  getGamesOneYear(year){
    this.dbController.getDataById(this.lastYearsDb, year).then((data) =>{
      return data;
    })
  }
  refreshActualClubs(){
    this.actualClubs = {};
    this.getClubs().then((data) => {
      this.actualClubs = data;
    });
  }
 

  evaluate(){
    let listedClubs = {};
    

    this.dbController.getDataById(this.lastYearsDb, '2014').then((data) => {
      let games2014 = data;
      console.log(games2014);
      console.log('Verarbeite Daten');
      games2014.games.forEach(element => {
        
       
          if(!this.clubExists(element.Team1.TeamName)){
            
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
    
    return Observable.create(observer => {
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
          let year = {
            _id: (i).toString(),
            games: allGamedays
          };
          observer.next(this.dbController.create(this.dbController.getDb('lastYearsDb'),year));
        }) 
      }
      observer.next(this.dbController.create(this.settingsDb, this.settings));
      observer.complete();
    });   
  }

  newClub(game){

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
