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

  actualYear: any = {};
  actualYearSorted: any;
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

      
      
      this.loader = this.presentLoading();
      this.actualYear.games = [];
      
      this.initDatabases();
      this.initData();  
        
  }
  initDatabases(){
    this.lastYearsDb = this.dbController.getDb('lastYearsDb');
    this.settingsDb = this.dbController.getDb('settings');
    this.clubsDb = this.dbController.getDb('clubs');
    this.gameIdsDb = this.dbController.getDb('gameIds');
  }

  initData() : void{
    console.log('\nInitialisierung: initData()');
    this.loadData().then((response) => {
      console.log('Settings vorhanden');
      console.log('Sämtliche Spieldaten vorhanden');
      this.settings = response[2];
      this.lastYears = response[1];
      this.actualYear = this.lastYears[this.lastYears.length-1];
      this.sortActualYear();
      if(this.actualClubs === undefined){
        console.log('Speichere Clubs');
        this.seedClubs().then(response =>{
          this.initData();
        });
      }else {
        console.log('Sämtliche Vereine vorhanden');
        if(!this.actualClubs[Object.keys(this.actualClubs)[0]].opponentExists()){
          this.seedScores();
        }else{
          console.log('Sämtliche Ergebnisse vorhanden');
          console.log(this.actualClubs);
          console.log(this.actualYear.games);
        }
        this.loader.dismiss();
      }
    }).catch(reason => {
      console.log(reason);
      this.seedAll().then(response =>{
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
    console.log('Verarbeite Ergebnisse');
    let i = 0;
    let j = 0;
    let k = 0;
    let l = 0;
    for(let year of this.lastYears){
      for(let game of year.games){
        
        if(game.MatchResults.length < 2){
          console.log('noch nicht gespielt');
           continue;
        } 

        let name_homeClub = game.Team1.TeamName;
        let goals_homeClub = game.MatchResults[1].PointsTeam1;

        let name_awayClub = game.Team2.TeamName
        let goals_awayClub = game.MatchResults[1].PointsTeam2; 

        let homeClub = this.actualClubs[name_homeClub];
        let awayClub = this.actualClubs[name_awayClub];
        let date = game.MatchDateTime;
        let gameYear = game.LeagueName;
        
        this.addOpponent(homeClub, name_awayClub) ? i++ : k++;
        this.addOpponent(awayClub, name_homeClub) ? i++ : k++;
        this.addScore(game, homeClub, name_awayClub, true, goals_homeClub, goals_awayClub, date, gameYear) ? j++ : l++;
        this.addScore(game, awayClub, name_homeClub, false, goals_awayClub, goals_homeClub, date, gameYear) ? j++ : l++;
      }   
    }
    
    console.log(i + ' Gegner in die Vereine eingetragen');
    console.log(j + ' Spielergebnisse in die Vereine eingetragen ');
    console.log(l + ' Spielergebnisse waren bereits vorhanden');
    for(let club in this.actualClubs){
      this.dbController.update(this.clubsDb, this.actualClubs[club]);
    }
    this.getClubs().then(clubs => {
      console.log('Alles erledigt');
    });    
  }
  addClub(clubName){
    let club = new Club(clubName);
    return this.dbController.update(this.clubsDb, club);
  }
  addOpponent(club, clubName){
    if(club.opponents.hasOwnProperty(clubName)){
      return false;
    }
    club.opponents[clubName] = {scores: {}};
    return true;  
  }
  addScore(game, club, nameOpponent, atHome, goalsClub, goalsOpponent, date, gameYear){
    if(club.opponents[nameOpponent].scores[game.MatchID]){
      return false;
    }
    club.opponents[nameOpponent].scores[game.MatchID] = new Score(goalsClub, goalsOpponent, atHome, date, gameYear);
    return true;    
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
  sortActualYear(){
    console.log('sortActualYear');
    this.actualYearSorted = {};
    for(let game of this.actualYear){
      for(let i = 1; i <= this.actualYear[this.actualYear.length -1].GroupOrderID; i++){
        if(i === game.GroupOrderID){
          this.actualYearSorted.i = [];
          this.actualYearSorted[i].push(game);
        }
      }
      console.log(this.actualYearSorted);
    }
  }
  resetDatabases(){
    let promises = [];

    promises.push(new Promise(resolve =>{
      this.clubsDb.destroy().then(function(response){
        console.log('Datenbank gelöscht');
        resolve('Datenbank gelöscht');
      })
    }));
    promises.push(new Promise(resolve => {
      this.lastYearsDb.destroy().then(function(response){
        console.log('Datenbank LastYears gelöscht');
        resolve('Datenbank LastYears gelöscht');
        
      })
    }));
    promises.push(new Promise(resolve => {
      this.settingsDb.destroy().then(function(response){
        console.log('Datenbank Settings gelöscht');
        resolve('Datenbank Settings gelöscht');
      })
    }));
    

    return Promise.all(promises);
  }
  

}
