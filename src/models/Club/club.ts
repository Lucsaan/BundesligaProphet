

import { Opponent } from "./opponent";
import { Score } from "./score";


export class Club {
    _id: string;
    _rev?: string;
    opponents: {};

    constructor(name: string,){
        this._id = name;

    }

    getName(){
        return this._id;
    }
    addOpponent(gameId){
        // if (!this.opponents.hasOwnProperty(opponent.name)){
        //     let score = new Score(opponent.gameId)
        //     let opponent = new Opponent(opponent.name )
        // }
    }
    
    

    

}