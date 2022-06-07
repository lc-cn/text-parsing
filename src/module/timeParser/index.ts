import {preHandler} from './strPreHanding';
import {TimeUnit} from './timeUnit';
import {BaseParser} from "@/parser";
export interface TimeOptions{
    timeBase?:Date;
    format?:string;
}
export default class TimeParser extends BaseParser<string|Date>{
    public timeBase:Date
    public expression:string
    public isPreferFuture:boolean
    constructor() {
        super('timeParser');
        this.timeBase = null;
        this.expression = '';
        this.isPreferFuture = true;
    }
    turnOffPreferFuture(){
        this.isPreferFuture=false
    }
    getTimeBase(){
        return this.timeBase
    }
    setTimeBase(s:Date){
        this.timeBase=s
    }
    parse(expression:string,options?:TimeOptions):Date|string{
        let format:string,timeBase:Date;
        if(options){
            timeBase = options.timeBase;
            format = options.format;
        }
        this.expression = expression;
        const exp = this._preHandling(expression);
        if (timeBase) {
            if (typeof timeBase === 'string') {
                this.timeBase = new Date(timeBase);
            } else {
                this.timeBase = timeBase;
            }
        } else {
            this.timeBase = new Date();
        }
        let tu = new TimeUnit(exp, this.isPreferFuture, this.timeBase);
        return tu.timeNormalization(format);
    }
    private _preHandling(expression:string){
        expression = preHandler.delKeyword(expression, '\\s+'); // 清理空白符
        expression = preHandler.delKeyword(expression, '[的]+'); // 清理语气助词
        expression = preHandler.DBC2CDB(expression); // 全角转半角
        expression = preHandler.numberTranslator(expression); // 大写数字转化
        return expression;
    }
}
