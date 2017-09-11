export class Score {
    
    public readonly goalsOwn: number;
    public readonly goalsOpponent: number;
    public readonly home: boolean;

    constructor(goalsOwn, goalsOpponent, home){
        this.goalsOwn = goalsOwn;
        this.goalsOpponent = goalsOpponent;
        this.home = home;
    }


}