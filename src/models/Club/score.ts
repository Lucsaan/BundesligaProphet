export class Score {
    
    constructor(
        private readonly opponent:string, 
        private readonly gameId: number,
        private readonly goalsOwn: number,
        private readonly goalsOpponent: number
    ){}

    getOpponent(){
        return this.opponent;
    }
    getGameId(){
        return this.gameId;
    }
    getGoalsOwn(){
        return this.goalsOwn;
    }
    getAchievedGoald(){
        return this.goalsOpponent;
    }

}