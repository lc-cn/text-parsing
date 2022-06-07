import {TimeParser} from "./module";

export type ParseResult<P extends Parsers>={
    [K in keyof P]:P[K] extends BaseParser?ReturnType<P[K]['parse']>:unknown
}
export interface Parsers extends Record<string, BaseParser>{
    timeParser?:TimeParser
}
export type ParserOptions<P extends BaseParser>=Parameters<P['parse']>[1]
type BuiltInParserOptions={
    [P in keyof BuiltInParser]?:ParserOptions<BuiltInParser[P]>
}
interface ParsersOptions extends BuiltInParserOptions{
    [key:string]:any
}
interface BuiltInParser{
    timeParser:TimeParser
}
export class ParserManager{
    public parsers:Parsers={}
    constructor(private _options:ParsersOptions={}) {
    }
    use<K extends keyof BuiltInParser>(name:K,options?:ParserOptions<BuiltInParser[K]>):this
    use<K extends keyof BuiltInParser>(names:K[],options?:Record<K, ParserOptions<BuiltInParser[K]>>):this
    use<P extends BaseParser>(parser:P,options?:ParserOptions<P>):this
    use<P extends BaseParser>(parsers:P[],options:Record<string, ParserOptions<P>>):this
    use<E extends BaseParser|(keyof BuiltInParser)>(entries:E|E[],options?:Record<string, any>):this{
        entries=[].concat(entries)
        for(const entry of entries){
            let p:BaseParser
            if(typeof entry==='string') p=new (require(`./module/${entry}`).default)
            else p=entry
            if(options)Object.assign(this._options,{[p.name]:options[p.name]||options})
            if(this.parsers[p.name]) throw new Error(`parser ${p.name} already exists`)
            this.parsers[p.name]=p
        }
        return this
    }
    useDefault(){
        this.use('timeParser',this._options['timeParser'])
        return this
    }
    parse(expression:string):ParseResult<Parsers>{
        let result={} as ParseResult<Parsers>;
        Object.keys(this.parsers).forEach(key=>{
            result[key]=this.parsers[key].parse(expression,this._options[key]||this._options)
        })
        return result
    }
}
export abstract class BaseParser<R=any>{
    constructor(public name:string) {
    }
    parse(str:string,...args:any[]):R{
        throw new Error('Method not implemented.');
    }
}
