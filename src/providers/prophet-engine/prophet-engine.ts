import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { LigaDataProvider } from "../liga-data/liga-data";
import { ToastController } from "ionic-angular";

/*
  Generated class for the ProphetEngineProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/
@Injectable()
export class ProphetEngineProvider {

  club1: any;
  club2: any;
  homeMultiplier: number = 2;
  directMultiplier: number = 2;
  goalDifference: number = 0;
  ownGoals: number = 0;
  highestYear: number = 0;
  lowestYear: number;
  maxYearDifference: number;
  fineTuneMultiplier: number;

  constructor(public http: Http, public dataProvider : LigaDataProvider, public toastCtrl : ToastController) {
    console.log('Hello ProphetEngineProvider Provider');
  }

  getProphecy(club1: string, club2: string, event){
    
    this.club1 = this.getClubData(club1);
    this.club2 = this.getClubData(club2);
    let goalsClub1;
    let goalsClub2;
    
    console.log(this.club1);
    console.log(this.club2);
    console.log(event);
    this.analyseDirektGames();
    this.analyseSameOpponents();
    
    


    return {club1: goalsClub1, club2: goalsClub2}
  }
  getClubData(club){
    return this.dataProvider.actualClubs[club];
  }
  getYearMultiplier(score){
    let x = 2;
    this.maxYearDifference;
    let y = this.maxYearDifference - (this.highestYear - (new Date(score.date).getFullYear()));
    if (score.gameYear === "1. Fußball-Bundesliga 2017/2018"){
      x += 1;
    }
    console.log(x + ' hoch ' + y);
    return Math.pow(x,y);
  }
  analyseDirektGames(){
    
    let sumScores;
    
    let diffGDMultiplier;
    let diffOGMultiplier;

    
    for(let yearIndex in this.dataProvider.settings.years){
      let year = this.dataProvider.settings.years[yearIndex];
      if(year !== true){
        continue;
      }
      if(this.highestYear < 1){
        this.highestYear = parseInt(yearIndex);
        this.lowestYear = parseInt(yearIndex);
        continue;
      }
      if(parseInt(yearIndex) > this.highestYear){
        this.highestYear = parseInt(yearIndex);
        continue;
      }
      if(parseInt(yearIndex) < this.lowestYear){
        this.lowestYear = parseInt(yearIndex);
      }

    }
    this.maxYearDifference = this.highestYear - this.lowestYear;
    console.log(this.maxYearDifference); 
    
    try{
      sumScores = Object.keys(this.club1.opponents[this.club2._id].scores).length;
      console.log('Summe Scores: ' + sumScores);
      this.calculateScores(sumScores);
    }catch(err){
      console.log('Noch keine Spiele gegeneinander gespielt');
      let gegnerString = this.analyseSameOpponents();
      this.showToast('Noch keine Spiele gegeneinander gespielt\n' + gegnerString );
    }
  
  }

  calculateScores(sumScores){
    let gd = 0;
    let og = 0; 
    let divider = 0;
    let compareableScore;
    let index = 0;

    for(let scoreIndex in this.club1.opponents[this.club2._id].scores){
      console.log(index);
      
      let score = this.club1.opponents[this.club2._id].scores[scoreIndex];
      if(++index === sumScores){
        if(score.gameYear === "1. Fußball-Bundesliga 2017/2018"){
          compareableScore = {'gd' : Math.round(gd/divider), 'og' : Math.round(og/divider)};
          let prophecyDiffGD = compareableScore.gd - (score.goalsOwn - score.goalsOpponent);
          let prophecyDiffOG = compareableScore.og - (score.goalsOwn);
          console.log('GD: ' + prophecyDiffGD);
          console.log('OG: ' + prophecyDiffOG);
          console.log(compareableScore);
        }
      }
      console.log(score);
      let yearMultiplier = this.getYearMultiplier(score); 
      console.log('yearmultiplier ' + yearMultiplier);

      if(score.home){
        gd += (score.goalsOwn - score.goalsOpponent) * this.homeMultiplier;
        gd += (score.goalsOwn - score.goalsOpponent) * yearMultiplier;
        
        og += (score.goalsOwn) * this.homeMultiplier;
        og += (score.goalsOwn) * yearMultiplier;
        divider += this.homeMultiplier;   
      }else {
        gd += (score.goalsOwn - score.goalsOpponent) * yearMultiplier;
        og += (score.goalsOwn) * yearMultiplier;
        divider++;
      }
      divider += yearMultiplier;
      
      console.log({'gd': gd, 'og': og, 'divider': divider});
    }

    console.log('Ergebnis: ' + Math.round(og/divider) + ' : ' + (Math.round(og/divider) - (Math.round(gd/divider))));
    let gegnerString = this.analyseSameOpponents();
    this.showToast('Ergebnis aus direkten Spielen: ' + Math.round(og/divider) + ' : ' + (Math.round(og/divider) - (Math.round(gd/divider))) + '\n' + gegnerString);
    return {'gd': gd, 'og': og, 'divider': divider}

  }
  analyseSameOpponents(){
    console.log('Analysiere gemeinsame Gegner');
    let gd = 0, og = 0, divider = 0;
        
    for(let opponent_club1 in this.club1.opponents){
      for(let opponent_club2 in this.club2.opponents){
        if(opponent_club1 === opponent_club2){
          console.log('Gemeinsamer Gegner: ' + opponent_club1);
          let score_club1 = this.analyseScores(opponent_club1,this.club1, true);
          let score_club2 = this.analyseScores(opponent_club2,this.club2, false);
          gd += (score_club1.gd - score_club2.gd);
          console.log(gd);
          og += (score_club1.og - score_club2.og);
          console.log(og);
          divider++;
        }
      }
      
    }
    if (og < 1){
      gd += og;
      og = 0;

    }
    if((og - gd) < 0){
      og -= (og - gd);
    }
    if(divider === 0){
      console.log('Noch keine gemeinsamen Gegner')
      //return {'gd': -1}
      return 'Noch keine gemeinsamen Gegner';
    }
    console.log('gd ' + gd);
    console.log('og ' + og);
    console.log('divider' + divider);
    
    console.log('Ergebnis aus Gegneranalyse: og: ' + og + ' gd: ' + gd + ' divider: ' + divider);
    //return {'gd': gd, 'og': og, 'divider' : divider};
    return 'Ergebnis aus Gegneranalyse: ' + Math.round(og/divider) + ' : ' + Math.round((og - gd)/divider);
  }

  analyseScores(opponent,club, home){
    let gd = 0, og = 0, divider = 0;
        
    for(let scoreIndex in club.opponents[opponent].scores){
      let multiplier = 1;
      let score = club.opponents[opponent].scores[scoreIndex];
      console.log(score);
      if(score.home === home){
        multiplier = 2;
      }
      
      gd += (score.goalsOwn - score.goalsOpponent) * multiplier;
      og += score.goalsOwn * multiplier;
      divider += multiplier;
      
      
    }
    console.log('gd: ' + (gd/divider) + ' og: ' + Math.round(og/divider));
    return {'gd': gd/divider, 'og' : og/divider};
  }

  showToast(toasties){
    let toast = this.toastCtrl.create({
      message: toasties,
      duration: 10000,
      position: 'top'
    });
    toast.present();
  }
 


  



}
