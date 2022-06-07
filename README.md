# text-parsing
可扩展的nodejs 文本解析库
## 安装
```shell
npm install text-parsing
# or
yarn add text-parsing
```
## 使用样例
### 1. 直接使用解析器
```javascript
//假设今日为2022-01-01
const {TimeParser} = require('text-parsing')
const tp=new TimeParser()
console.log(tp.parse('明天晚上8点半开会',{format:'YYYY-MM-DD hh:mm:ss'}))
//打印结果：2022-01-02 08:30:00
```
### 2. 使用ParserManger同时使用多个解析器
```javascript
const {ParserManger}=require('text-parsing')
const pm=new ParserManger()
pm.use('timeParser',{format:'YYYY-MM-DD',timeBase:new Date('2022-01-01')})
console.log(pm.parse('下周二一起聚餐'))
//打印结果：{ timeParser:'2022-01-04' },如果有其他解析器，会将结果一同返回
```
### 3.定义自己的解析器
你可以通过继承BaseParser实现任意你想实现的解析器

```typescript
// cardParser.ts
import {BaseParser} from 'text-parsing'

class CardParser extends BaseParser<string> {
    constructor() {
        super('cardParser')
    }
    // 定义文本接收函数
    parse(expression: string,options?:{location:string}) {
        // do sth
        return expression.replace(expression,/!([\d]{17}[0-9|x|X]{1})/)//此处的返回值类型需在BaseParser的泛型中声明，否则在ts中将无法获得正确代码提示
    }
}

// index.ts
import {ParserManager} from "text-parsing";
import {CardParser} from './cardParser'
const pm=new ParserManager()
pm.use(new ParserManager(),{location:'china'})//use的第二个参数将传递给parser的parse函数的option
console.log(pm.parse('515323194803141144'))
```
