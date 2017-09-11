


import { Score } from "./score";

export class Opponent {
    constructor(
        private readonly name: string,
       private scores : Array<Score> = []
    ){}

    getName(){
        return this.name;
    }
    getScores(){
        return this.scores;
    }
    addScore(score: Score){
        this.scores.push(score);
    }
}