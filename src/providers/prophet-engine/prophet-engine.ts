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

  constructor(public http: Http, public dataProvider : LigaDataProvider) {
    console.log('Hello ProphetEngineProvider Provider');
  }

  prophecy(club1: string, club2: string){
    this.club1 = this.getClubData(club1);
    this.club2 = this.getClubData(club2);
    let goalsClub1;
    let goalsClub2;

    console.log(club1);
    console.log(club2);

    return {club1: goalsClub1, club2: goalsClub2}
  }
  getClubData(club){
    return this.dataProvider.actualClubs[club];
  }



}
