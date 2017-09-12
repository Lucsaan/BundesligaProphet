

import { Opponent } from "./opponent";
import { Score } from "./score";


export class Club {
    readonly _id: string;
    _rev?: string;
    opponents: {};

    constructor(name: string, data?){
        this._id = name;
        if (data === undefined){
            return;
        }
        this._rev = data._rev;
        this.setOpponent(data.opponents);  
    }

    getName() : string{
        return this._id;
    }
    setOpponent(opponents) : void{
        if(opponents === undefined){
            this.opponents = {};
            return;
        }
        this.opponents = opponents;
    }
    opponentExists() : boolean{
        for(let opponent in this.opponents){
            if(opponent === undefined){
                return false;
            }else return true;    
        }
    }
    
    
    

    

}