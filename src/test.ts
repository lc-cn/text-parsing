import {ParserManager} from "./parser";

const pm = new ParserManager({timeParser: {format: 'YYYY-MM-DD'}})
pm.use('timeParser',{format: 'YYYY-MM-DD W'})
const result = pm.parse('下周二')
console.log(result.timeParser)
