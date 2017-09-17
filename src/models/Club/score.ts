export class Score {
    
    public readonly goalsOwn: number;
    public readonly goalsOpponent: number;
    public readonly home: boolean;
    public readonly date: Date;

    constructor(goalsOwn, goalsOpponent, home, date){
        this.goalsOwn = goalsOwn;
        this.goalsOpponent = goalsOpponent;
        this.home = home;
        this.date = date;
    }


}