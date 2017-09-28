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
  gamesDb: any;
  lastYearsDb: any;
  configDb: any;
  gameIdsDb: any;
  clubsDb: any;
  loader: any;

  actualYear: any = {};
  actualYearSorted: any;
  lastYears: any;
  config: any = [];
  actualClubs: any = {};
  data: any;
  games:  any = {};
  clubs: any = [];

  noConfig: boolean = true;
  noData: boolean = true;
  noClubs: boolean = true;
  
  constructor(
    public http: Http, 
    public storage:Storage, 
    public toastCtrl : ToastController, 
    public loadingCtrl: LoadingController, 
    public apiController: ApiControllerProvider, 
    public dbController : DbControllerProvider ) {

      this.loadDatabases(true);
      
      this.loader = this.presentLoading();
      this.actualYear.games = [];
      
      this.initData();
      //this.init();  
        
    }
  
  init(){
    if(this.noConfig){
      console.log('Keine Config vorhanden');
      this.getConfig();
      return;
    }
    if(this.noData){
      console.log('Config vorhanden');
      console.log('Hole Daten');
      this.loadGamesData();
      return;
    }
    console.log(this.games);
    if(this.noClubs){
      this.loadClubs();
    }
    console.log('Clubs geladen');
    console.log(this.clubs);
    

  }
  getConfig(){
    this.dbController.getDataById(this.configDb, 'years').then(config=>{
      this.config = config;
      console.log('Config geladen');
      console.log(this.config);
      this.noConfig = false;
      console.log('Restart');
      this.init();
    }).catch(error=>{
      this.setConfig().then(response=>{
        if(response.ok){
          console.log('Config geseedet');
          console.log('Restart');
          this.init();
        }
      }).catch(err => {
        console.log('Config bereits vorhanden');
      });
    });
   
  }
  setConfig(){
    let config = {
      _id: 'years',
      years: {
        2016: true,
        2017: true
      }
    }
    return this.dbController.update(this.configDb, config);  
  }
  loadGamesData(){
    this.dbController.getData(this.gamesDb).then(data=>{
      console.log(data);
      this.data = data;
      if(this.data < 1){
        console.log('Hole Daten von der Api')
        this.getGames(this.config).then(response=>{
          console.log('Restart');
          this.init();  
        });
      }else {
        for(let year of this.data){
          this.games[year._id] = year;
        }
        this.noData = false;
        this.init();
      }
    });
  }

  update(){
    let updated = false;
    let allGamedays = [];
    this.apiController.getData('https://www.openligadb.de/api/getmatchdata/bl1/2017').subscribe(data =>{
        data.forEach(element => {
          allGamedays.push(element);
        });
        console.log(this.lastYears[this.lastYears.length-1]);
      for(let i = 0; i < allGamedays.length; i++){
        if(this.lastYears[this.lastYears.length-1].games[i].MatchIsFinished !== allGamedays[i].MatchIsFinished){
          updated = true;
          this.lastYears[this.lastYears.length-1].games[i] = allGamedays[i];
          this.setScore(allGamedays[i]);
        }
      }
      if(updated){
        this.showToast('Neue Spiele hinzugefügt', 3);
        this.actualYear = this.lastYears[this.lastYears.length-1];
        console.log(this.lastYears);
        this.dbController.update(this.lastYearsDb, this.actualYear).then(response => {
          console.log(response);
        });
      }else {
        this.showToast('Spiele sind auf dem neuesten Stand', 3);
      }
    });
  }
  setScore(game){
    console.log('Verarbeite Ergebnisse');
    let i = 0;
    let j = 0;
    let k = 0;
    let l = 0;
    

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

  getGames(config){
    let promises = [];
    promises.push( new Promise(resolve => {
      this.dbController.update(this.configDb, config).then(response =>{
        resolve('Config gespeichert');
      });
    }));
    Object.keys(config.years).forEach(element => {
      if (config.years[element] === true){
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
  loadClubs(){
    this.getClubs().then(clubs => {
      this.clubs = clubs;
      if(this.clubs < 1){
        console.log('Keine Clubs.');
        this.seedClubs2();
        // .then(resolve => {
        //   this.noClubs = false;
        //   this.init();
        // });
        
      }
    });
  }
  seedClubs2(){
    console.log('Vereine werden erstellt');
    let promises = [];
    for(let key in this.games){
      console.log(this.games[key]);
      for(let gameday in this.games[key].games.gameday){
        console.log(this.games[key].games.gameday[gameday]);
        for(let game of this.games[key].games.gameday[gameday].games){

        }
        
      }
      
    }


    // for(let year of this.lastYears){
    //   for(let game of year.games){
    //     let club = new Promise(resolve => {
    //       this.addClub(game.Team1.TeamName).then(response => {
    //         console.log(game.Team1.TeamName + ' hinzugefügt');
    //         resolve(game.Team1.TeamName);
    //       }).catch (error => {
    //         resolve('redundant');
    //       });
    //     });
    //     promises.push(club);
    //   }
    // }
    // return Promise.all(promises);
  }
  initData() : void{
    console.log('\nInitialisierung: initData()');
    this.loadData().then((response) => {
      console.log('Config vorhanden');
      console.log('Sämtliche Spieldaten vorhanden');
      this.config = response[2];
      this.actualYear = this.lastYears[this.lastYears.length-1];
      console.log(Object.keys(this.actualClubs).length);
      if(Object.keys(this.actualClubs).length === 0){
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
          console.log(this.lastYears);
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
        this.lastYears = data;
        resolve(data);
      });
    });
    let config = new Promise((resolve, reject) => {
      this.getconfigli().then((data) => {
        resolve(data);
      }).catch((error) => {
        reject('Keine Config -> starte allSeed()');
      });
    });
    return Promise.all([clubs, allGames, config])   
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
  
  getconfigli(){
    return this.dbController.getDataById(this.configDb, 'years');
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
    
    let config = {
      _id: 'years',
      years: {
        2016: true,
        2017: true
      }
    }
  
    let promises = [];
    promises.push( new Promise(resolve => {
      this.dbController.update(this.configDb, config).then(response =>{
        resolve('config gespeichert');
      });
    }));
    Object.keys(config.years).forEach(element => {
      if (config.years[element] === true){
        console.log('Jahr ' + element + ' wird ausgewertet');
        promises.push( new Promise(resolve =>{
          this.getGamesOfYear2(element).then(response => {
            resolve(response);
          })
        }))
      }
    });

    return Promise.all(promises);   
  }
  getGamesOfYear2(year) {
    
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
  getGamesOfYear(year) {
    let baseUrl = 'https://www.openligadb.de/api/getmatchdata/bl1/';
    let allGamedays = [];
    
    let games = new Promise (resolve =>{
      this.apiController.getData(baseUrl + year).subscribe(data =>{
        data.forEach(element => {
          allGamedays.push(element);
        });
        let separateGamedays = this.seperateGamedays(allGamedays);
        let obj = {
          _id: (year).toString(),
          games: separateGamedays
        };
        this.dbController.update(this.gamesDb, obj).then(response =>{
          resolve('Jahr ' + year + ' gespeichert');
        });
      });
    });
    
    return Promise.all([games]); 
  }
  seperateGamedays(allGamedays){
    console.log('separiere Spieltage');
    let maxGameday = 1;
    let obj = {gameday: {}};
    let games = [];
    for(let game of allGamedays){
      if(game.Group.GroupOrderID > maxGameday){
         obj.gameday[games[0].Group.GroupOrderID] =  {
          _id : games[0].Group.GroupName,
          games: games
        }
        games = []; 
        maxGameday = game.Group.GroupOrderID;     
      }  
      games.push(game);
      
    }
    obj.gameday[games[0].Group.GroupOrderID] =  {
          _id : games[0].Group.GroupName,
          games: games
        }
    console.log(obj);
    return obj;
  }



  setStorageLocal(key, value){
    this.storage.set(key, value);
  }
  getStorageLocal(key){ 
    return this.storage.get(key);
  }
  showToast(toasties, time){
    let toast = this.toastCtrl.create({
      message: toasties,
      duration: time * 1000,
      position: 'top'
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
      this.configDb.destroy().then(function(response){
        console.log('Datenbank Config gelöscht');
        resolve('Datenbank Config gelöscht');
      })
    }));
    

    return Promise.all(promises);
  }
  loadDatabases(forInit){
    this.gamesDb = this.dbController.getDb('gamesDb');
    this.configDb = this.dbController.getDb('config');
    this.clubsDb = this.dbController.getDb('clubs');
    this.lastYearsDb = this.dbController.getDb('lastYears');
    if(!forInit){
      this.loader = this.presentLoading();
      this.actualYear= {};
      this.lastYears;
      this.config= [];
      this.actualClubs= {};
      this.data;
      this.games = {};
      this.clubs = [];
      this.actualYear.games = [];
      this.initData();
    }
  }
  

}
