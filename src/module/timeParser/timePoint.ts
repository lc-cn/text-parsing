export class TimePoint{
    public tunit:number[]
    constructor(date?:string|number|Date) {
        if (date) {
            const d = new Date(date);
            this.tunit = [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()];
        } else {
            this.tunit = [-1, -1, -1, -1, -1, -1];
        }
    }
}
