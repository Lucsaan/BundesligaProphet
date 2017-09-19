import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import { LigaDataProvider } from "../liga-data/liga-data";

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

  constructor(public http: Http, public dataProvider : LigaDataProvider) {
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
    
    


    return {club1: goalsClub1, club2: goalsClub2}
  }
  getClubData(club){
    return this.dataProvider.actualClubs[club];
  }
  getYearMultiplier(date){
    this.maxYearDifference;
    let x = this.maxYearDifference - (this.highestYear - (new Date(date).getFullYear()));
    return Math.pow(2,x);
  }
  analyseDirektGames(){
    let gd = 0;
    let og = 0; 
    let divider = 0;
    let sumScores;
    let compareableScore;
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
    
    sumScores = Object.keys(this.club1.opponents[this.club2._id].scores).length;
    console.log('Summe Scores: ' + sumScores);
    let index = 0;

    for(let scoreIndex in this.club1.opponents[this.club2._id].scores){
      console.log(index);
      
      let score = this.club1.opponents[this.club2._id].scores[scoreIndex];
      if(++index === sumScores){
        if(score.gameYear === "1. Fußball-Bundesliga 2016/2017"){
          compareableScore = {'gd' : Math.round(gd/divider), 'og' : Math.round(og/divider)};
          let prophecyDiffGD = compareableScore.gd - (score.goalsOwn - score.goalsOpponent);
          let prophecyDiffOG = compareableScore.og - (score.goalsOwn);
          console.log('GD: ' + prophecyDiffGD);
          console.log('OG: ' + prophecyDiffOG);
          console.log(compareableScore);
        }
      }
      console.log(score);
      let yearMultiplier = this.getYearMultiplier(score.date); 

      if(score.home){
        gd += (score.goalsOwn - score.goalsOpponent) * this.homeMultiplier * yearMultiplier;
        og += (score.goalsOwn) * this.homeMultiplier * yearMultiplier;
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
      //alert('Ergebnis: ' + Math.round(og/divider) + ' : ' + (Math.round(og/divider) - (Math.round(gd/divider))));
    return {'gd': gd, 'og': og, 'divider': divider}
  }
  analyseSameOpponents(){
    return {gd: 'gd', og: 'og', multiplier: 'multiplier'}
  }
 


  



}
