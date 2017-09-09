

import { Opponent } from "./opponent";

export class Club {
    _id: string;
    _rev?: string;
    opponent: {Opponent};

    constructor(name: string,){
        this._id = name;

    }

    getName(){
        return this._id;
    }
    addOpponent(opponent:Opponent){
        
    }
    
    

    

}