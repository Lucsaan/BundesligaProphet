


import { Score } from "./score";

export interface Opponent {
   
        name: string,
        gameId: number,
        goalsOwn: number,
        goalsOpponent: number,
        scores : Array<Score>
  
}