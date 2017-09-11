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
import { Club } from '../../models/Club/club';
import { Score } from '../../models/Club/score';

@Injectable()
export class LigaDataProvider {

  actualYearDb: any;
  lastYearsDb: any;
  settingsDb: any;
  gameIdsDb: any;
  clubsDb: any;
  loader: any;

  actualYear: any;
  lastYears: any;
  settings: any = [];
  actualClubs: any;
  gameIds: any;

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
      this.gameIdsDb = this.dbController.getDb('gameIds');
      
      this.loader = this.presentLoading();
      this.initData();  
        
  }

  initData(){
    
    console.log('Initialisierung: initData()');
    this.loadData().then((response) => {
      console.log('Settings vorhanden');
      console.log('Spieldaten der letzten Jahre vorhanden');
      console.log(response);
      this.lastYears = response[1];
      console.log(this.actualClubs);
      if(this.actualClubs === undefined){
        console.log('Noch keine Clubs gespeichert');
        this.seedClubs().then(response =>{
          console.log(response);
          this.initData();
        });
      }else {
        console.log('Vereine der letzten Jahre vorhanden');
        this.seedScores();
        this.loader.dismiss();
      }

    }).catch(reason => {
      console.log(reason);
      this.seedAll().then(response =>{
        console.log(response);
        this.initData();
      });   
    });
  }
  
  loadData(){
    let clubs = new Promise((resolve) => {
      this.getClubs().then((data)=>{
        resolve(data);
      });
    });
    
    let allGames = new Promise((resolve) => {
      this.getGamesAllYears().then((data) => {
        resolve(data);
      });
    });
    let settings = new Promise((resolve, reject) => {
      this.getSettings().then((data) => {
        console.log(data);
        resolve(data);
      }).catch((error) => {
        reject('Keine Settings -> starte allSeed()');
      });
    });
    return Promise.all([clubs, allGames, settings])   
  }
  
  seedClubs(){
    console.log('buildActualClubs()');
    let promises = [];
    for(let year of this.lastYears){
      for(let game of year.games){
        let club = new Promise(resolve => {
          this.addClub(game.Team1.TeamName).then(response => {
            console.log(game.Team1.TeamName + ' hinzugefügt');
            resolve(game.Team1.TeamName);
          }).catch (error => {
            resolve('redundant');
          });
        });
        promises.push(club);
      }
    }
    return Promise.all(promises);
  }

  seedScores(){
    console.log('seedScores()');
    this.getGameIds().then(data =>{
      this.gameIds = data;
      if(this.gameIds.length === 0){
        this.gameIds = {};
      }
      for(let year of this.lastYears){
        for(let game of year.games){
          let name_Team1 = game.Team1.TeamName;
          let name_Team2 = game.Team2.TeamName;
          let club = this.actualClubs[name_Team1];

          if(game.MatchResults.length < 2){
            return;
          }
          
          if(!club.opponent.hasOwnProperty(name_Team2)){
            club.opponent[name_Team2] = {};
          }
          club.opponent[name_Team2][game.MatchId] = 
            new Score(game.MatchResults[0].PointsTeam1, game.MatchResults[0].PointsTeam2, true)
          
        }   
      }
      console.log(this.actualClubs);

    });
 
      // club.gegner[name_Team2].push({
      //   goalsOpponent: game.MatchResults[0].PointsTeam1,
      //   ownGoals: game.MatchResults[0].PointsTeam2,
      //   home: true
      // })
      // this.dbController.update(this.clubsDb, club);

   
    
     
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
  

  addClub(clubName){
    
    let club = new Club(clubName);
    return this.dbController.update(this.clubsDb, club);
  }
  
  getSettings(){
    return this.dbController.getDataById(this.settingsDb, 'years');
  }

  getClubs(){
    
    return new Promise(resolve =>{
      this.dbController.getData(this.clubsDb).then(data => {
        let clubs: any = {};
        clubs = data;
        if(clubs.length > 0){
          this.actualClubs = {};
          for(let club of clubs){
            this.actualClubs[club._id] = new Club(club._id, club);
          }
          resolve(this.actualClubs);
        }else {
          resolve(data);
        }
        
      });
    });
    
  }

  getClub(clubName){
    return new Promise(resolve =>{
      this.dbController.getDataById(this.clubsDb, clubName).then(data =>{
        let club = new Club(data._id, data);
        resolve(data); 
      });
    } )
    
  }
  getGameIds(){
    return this.dbController.getData(this.gameIdsDb);
  }

  getGamesAllYears(){
    return this.dbController.getData(this.lastYearsDb);
  }

  getGamesOneYear(year){
    return this.dbController.getDataById(this.lastYearsDb, year);
  }

  seedAll(){ 
    let baseUrl = 'https://www.openligadb.de/api/getmatchdata/bl1/';
    
    let settings = {
      _id: 'years',
      years: {
        2014: true,
        2015: true,
        2016: true,
        2017: true
      }
    }
  
    let promises = [];
    promises.push( new Promise(resolve => {
      this.dbController.update(this.settingsDb, settings).then(response =>{
        resolve('settings gespeichert');
      });
    }));
    Object.keys(settings.years).forEach(element => {
      if (settings.years[element] === true){
        console.log('Jahr ' + element + ' wird ausgewertet');
        promises.push( new Promise(resolve =>{
          this.getGamesOfYear(element).then(response => {
            resolve(response);
          })
        }))
      }
    });

    return Promise.all(promises);

  
     
  }
  
  getGamesOfYear(year) {
    
    let baseUrl = 'https://www.openligadb.de/api/getmatchdata/bl1/';
    let allGamedays = [];

    let games = new Promise (resolve =>{
      this.apiController.getData(baseUrl + year).subscribe(data =>{
        data.forEach(element => {
          allGamedays.push(element);
        });
        let obj = {
          _id: (year).toString(),
          games: allGamedays
        };
        this.dbController.update(this.lastYearsDb, obj).then(response =>{
          resolve('Jahr ' + year + ' gespeichert');
        });
      });
    });
    
    return Promise.all([games]); 
  }

  
  setStorageLocal(key, value){
    this.storage.set(key, value);
  }
  getStorageLocal(key){ 
    return this.storage.get(key);
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
