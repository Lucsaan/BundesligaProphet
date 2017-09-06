import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import PouchDB from 'pouchdb';


/*
  Generated class for the DbControllerProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular DI.
*/
@Injectable()
export class DbControllerProvider {

  constructor(public http: Http) {}

  getDb(dbName: string){
    let db = new PouchDB(dbName);
    return db;
  }
  getData(db){
    return new Promise(resolve => {
      db.allDocs({
        include_docs: true
      }).then(
        (result) => {
          let data = [];
          let doc = result.rows.map(
            (row) => {
              data.push(row.doc);
            }
          );
          resolve(data);
          db.changes({live:true, since: 'now', include_docs: true}).on('change', (change) => {
            this.handleChange(change, data);
          });
        }
      ).catch((error) => {
        console.log(error);
      });
    });

  }
  create(db, data){
    db.post(data);
  }
  update(db, data){
    db.put(data).catch((err) => {
      console.log(err);
    });
  }
  delete(db, data){
    db.remove(data).catch((err) => {
      console.log(err);
    });
    console.log('Datensatz gelöscht');
  }
  handleChange(change, data){
 
    let changedDoc = null;
    let changedIndex = null;
 
    data.forEach((doc, index) => {
 
      if(doc._id === change.id){
        changedDoc = doc;
        changedIndex = index;
      }
 
    });
 
    //A document was deleted
    if(change.deleted){
      data.splice(changedIndex, 1);
    } 
    else {
  
      //A document was updated
      if(changedDoc){
        data[changedIndex] = change.doc;
      } 
  
      //A document was added
      else {
        data.push(change.doc); 
      }
 
    }

  }  



}
