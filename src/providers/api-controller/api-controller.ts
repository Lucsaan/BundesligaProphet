import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

/*
  Generated class for the ApiControllerProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/
@Injectable()
export class ApiControllerProvider {

  constructor(public http: Http) {
    console.log('Hello ApiControllerProvider Provider');
  }

  getData(url){
    let response = this.http.get(url).map(
      data => data.json()
    );
    return response;
  }

}
