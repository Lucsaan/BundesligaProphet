

import { Opponent } from "./opponent";
import { Score } from "./score";


export class Club {
    readonly _id: string;
    _rev?: string;
    opponent: {};

    constructor(name: string, data?){
        
        this._id = name;

        if (data === undefined){
            return;
        }

        this._rev = data._rev;
        this.setOpponent(data.opponent);  
        
    }

    getName(){
        return this._id;
    }
    setOpponent(opponent){
        if(opponent === undefined){
            this.opponent = {};
            return;
        }
        this.opponent = opponent;
    }
    addOpponent(gameId){
       
    }
    opponentExists(clubName){
        return this.opponent.hasOwnProperty(clubName) ?  true : false;
    }
    
    

    

}