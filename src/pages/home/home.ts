import {Component, ViewChild} from '@angular/core';
import {Content, NavController} from 'ionic-angular';
import { LigaDataProvider } from '../../providers/liga-data/liga-data';
import { ProphetEngineProvider } from "../../providers/prophet-engine/prophet-engine";

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild(Content) content: Content;

  gameDay: string = '';

  constructor(public navCtrl: NavController, public ligaData:LigaDataProvider, public prophet: ProphetEngineProvider) {
  }

  doRefresh(refresher?){
    console.log('AjAjAj');
    this.ligaData.update();
    if(refresher !== undefined) {
        refresher.complete();
    }
    // this.ligaData.resetDatabases().then(response =>{
    //   console.log('Datenbanken ready for refresh');
    //   this.ligaData.initDatabases();
    //   this.ligaData.initData();
    //   event.complete();
      
    // })
  }

  isNotSameGameDay(gameDay: string){
    if(this.gameDay === gameDay){
      return false;
    }
    this.gameDay = gameDay;
    return true;
  }

  scrollTo() {
      let elementId = '';
      let done = false;
      this.ligaData.actualYearFilter.games.map((game) => {
          if(game.MatchResults[1] === undefined && done === false){
            elementId = game.MatchID;
            done = true;
          }
      });
      if(elementId !== ''){
          let y = document.getElementById(elementId).offsetTop;
          this.content.scrollTo(0, y - 60);
      }
  }


}
