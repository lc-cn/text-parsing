import {formatDate} from "@/utils";

export enum TimeEnum {
    dayBreak = 3, // 凌晨
    earlyMorning = 8, // 早上
    morning = 10, // 上午
    noon = 12, // 中午、午间
    afternoon = 15, // 下午、午后
    night = 18, // 晚上、傍晚
    lateNight = 20, // 晚、晚间
    midNight = 23 // 深夜
}

import * as util from '@/utils';
import {TimePoint} from './timePoint'

export class TimeUnit {
    private _tp:TimePoint
    public timeExpression:string
    private _excursion:number[]
    public timeBase:Date
    public isPreferFuture:boolean
    private _tpOrigin:TimePoint
    private isFirstTimeSolveContext:boolean
    private isAllDayTime:boolean
    constructor(expTime:string, isPreferFuture:boolean, timeBase?:Date) {
        this.timeExpression = expTime;
        this._tp = new TimePoint();
        this._excursion = [0, 0, 0];
        if (timeBase) {
            this.timeBase = timeBase;
        } else {
            this.timeBase = new Date();
        }
        this.isPreferFuture = false;
        if (isPreferFuture) {
            this.isPreferFuture = isPreferFuture;
        }
        this._tpOrigin = new TimePoint(this.timeBase);
        this.isFirstTimeSolveContext = true;
        this.isAllDayTime = true;
    }
    private _checkContextTime(checkTimeIndex:number) {
        for (let i = 0; i < checkTimeIndex; i++) {
            if (this._tp.tunit[i] === -1 && this._tpOrigin.tunit[i] !== -1) {
                this._tp.tunit[i] = this._tpOrigin.tunit[i];
            }
        }
        /** 在处理小时这个级别时，如果上文时间是下午的且下文没有主动声明小时级别以上的时间，则也把下文时间设为下午 */
        if (this.isFirstTimeSolveContext && checkTimeIndex === 3 && this._tpOrigin.tunit[3] >= 12 && this._tp.tunit[3] < 12) {
            this._tp.tunit[3] += 12;
        }
        if (checkTimeIndex === 3 && this._tpOrigin.tunit[3] > this._tp.tunit[3]) {
            this._tp.tunit[3] += 12;
        }
        this.isFirstTimeSolveContext = false;
    }
    private _preferFuture(checkTimeIndex:number) {
        /** 1. 检查被检查的时间级别之前，是否没有更高级的已经确定的时间，如果有，则不进行处理. */
        for (let i = 0; i < checkTimeIndex; i++) {
            if (this._tp.tunit[i] !== -1) return;
        }
        /** 2. 根据上下文补充时间 */
        this._checkContextTime(checkTimeIndex);
        // /** 3. 根据上下文补充时间后再次检查被检查的时间级别之前，是否没有更高级的已经确定的时间，如果有，则不进行倾向处理. */
        // for (let i = 0; i < checkTimeIndex; i++) {
        //     if (this._tp.tunit[i] !== -1) return;
        // }
        /** 4. 确认用户选项 */
        if (!this.isPreferFuture) {
            return;
        }
        /** 5. 获取当前时间，如果识别到的时间小于当前时间，则将其上的所有级别时间设置为当前时间，并且其上一级的时间步长+1 */
        const d = this.timeBase;
        const tp = new TimePoint(d);

        if (tp.tunit[checkTimeIndex] < this._tp.tunit[checkTimeIndex]) {
            return;
        }
        // 准备增加的时间单位是被检查的时间的上一级，将上一级时间+1
        tp.tunit[checkTimeIndex - 1] += 1;

        for (let _i = 0; _i < checkTimeIndex; _i++) {
            this._tp.tunit[_i] = tp.tunit[_i];
            if (_i === 1) {
                this._tp.tunit[_i] += 1;
            }
        }
    }
    private _preferFutureWeek(weekday:number) {
        /** 1. 确认用户选项 */
        if (!this.isPreferFuture) {
            return;
        }
        /** 2. 检查被检查的时间级别之前，是否没有更高级的已经确定的时间，如果有，则不进行倾向处理. */
        const checkTimeIndex = 2;
        for (let i = 0; i < checkTimeIndex; i++) {
            if (this._tp.tunit[i] !== -1) return;
        }
        /** 获取当前是在周几，如果识别到的时间小于当前时间，则识别时间为下一周 */
        const d = this.timeBase;
        let curWeekday = d.getDay();
        if (curWeekday === 0) {
            curWeekday = 7;
        }
        if (curWeekday < weekday) {
            return;
        }
        // 准备增加的时间单位是被检查的时间的上一级，将上一级时间+1
        this.timeBase = util.getDateAfterWeeks(d, 1, weekday);
    }
    public normSetYear(){
        /** 假如只有两位数来表示年份 */
        let rule = new RegExp('[0-9]{2}(?=年)', 'g');
        let match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            this._tp.tunit[0] = parseInt(match[0], 10);
            if (this._tp.tunit[0] >= 0 && this._tp.tunit[0] < 100) {
                if (this._tp.tunit[0] < 30) {
                    /** 30以下表示2000年以后的年份 */
                    this._tp.tunit[0] += 2000;
                } else {
                    /** 否则表示1900年以后的年份 */
                    this._tp.tunit[0] += 1900;
                }
            }
        }
        /** 不仅局限于支持1XXX年和2XXX年的识别，可识别三位数和四位数表示的年份 */
        rule = new RegExp('[0-9]?[0-9]{3}(?=年)', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            this._tp.tunit[0] = parseInt(match[0], 10);
        }
    }
    public normSetMonth() {
        const rule = new RegExp('((10)|(11)|(12)|([1-9]))(?=月)', 'g');
        const match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            this._tp.tunit[1] = parseInt(match[0], 10);

            /** 处理倾向于未来时间的情况   */
            this._preferFuture(1);
        }
    }
    public normSetMonthFuzzyDay() {
        let rule = new RegExp('((10)|(11)|(12)|([1-9]))[月|.|-]([0-2][0-9]|3[0-1]|[1-9])', 'g');
        let match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            const m = match[0];
            rule = new RegExp('[月|.|-]');
            match = m.match(rule);
            if (match && match.length > 0) {
                this._tp.tunit[1] = parseInt(m.substring(0, match.index), 10);
                this._tp.tunit[2] = parseInt(m.substring(match.index + 1), 10);
                /** 处理倾向于未来时间的情况   */
                this._preferFuture(1);
            }
        }
    }
    public normSetDay() {
        const rule = new RegExp('([0-2][0-9]|3[0-1]|[1-9])(?=(日|号))', 'g');
        const match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            this._tp.tunit[2] = parseInt(match[0], 10);

            /** 处理倾向于未来时间的情况   */
            this._preferFuture(2);
        }
    }
    public normSetHour() {
        const tmp = this.timeExpression.replace(/(周|星期)[1-7]/g, '');
        let rule = new RegExp('([0-2]?[0-9])(?=(点|时))');
        let match = tmp.match(rule);
        if (match && match.length > 0) {
            this._tp.tunit[3] = parseInt(match[0], 10);
            /** 处理倾向于未来时间的情况   */
            this._preferFuture(3);
            this.isAllDayTime = false;
        }
        /**
         * 对关键字：早（包含早上/早晨/早间），上午，中午,午间,下午,午后,晚上,傍晚,晚间,晚,pm,PM的正确时间计算
         * 规约：
         * 1.中午/午间0-10点视为12-22点
         * 2.下午/午后0-11点视为12-23点
         * 3.晚上/傍晚/晚间/晚1-11点视为13-23点，12点视为0点
         * 4.0-11点pm/PM视为12-23点
         *
         */
        rule = new RegExp('凌晨', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            if (this._tp.tunit[3] === -1) {
                /** 增加对没有明确时间点，只写了“凌晨”这种情况的处理  */
                this._tp.tunit[3] = TimeEnum.dayBreak;
            }
            /** 处理倾向于未来时间的情况   */
            this._preferFuture(3);
            this.isAllDayTime = false;
        }

        rule = new RegExp('早上|早晨|早间|晨间|今早|明早', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            if (this._tp.tunit[3] === -1) {
                /** 增加对没有明确时间点，只写了“早上/早晨/早间”这种情况的处理  */
                this._tp.tunit[3] = TimeEnum.earlyMorning;
            }
            /** 处理倾向于未来时间的情况   */
            this._preferFuture(3);
            this.isAllDayTime = false;
        }

        rule = new RegExp('上午', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            if (this._tp.tunit[3] === -1) {
                /** 增加对没有明确时间点，只写了“上午”这种情况的处理  */
                this._tp.tunit[3] = TimeEnum.morning;
            }
            /** 处理倾向于未来时间的情况   */
            this._preferFuture(3);
            this.isAllDayTime = false;
        }

        rule = new RegExp('中午|午间', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            if (this._tp.tunit[3] >= 0 && this._tp.tunit[3] <= 10) {
                this._tp.tunit[3] += 12;
            }
            if (this._tp.tunit[3] === -1) {
                /** 增加对没有明确时间点，只写了“中午/午间”这种情况的处理  */
                this._tp.tunit[3] = TimeEnum.noon;
            }
        }

        rule = new RegExp('下午|午后|pm|PM', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            if (this._tp.tunit[3] >= 0 && this._tp.tunit[3] <= 11) {
                this._tp.tunit[3] += 12;
            }
            if (this._tp.tunit[3] === -1) {
                /** 增加对没有明确时间点，只写了“下午|午后”这种情况的处理   */
                this._tp.tunit[3] = TimeEnum.afternoon;
            }
            /** 处理倾向于未来时间的情况   */
            this._preferFuture(3);
            this.isAllDayTime = false;
        }
        rule = new RegExp('晚上|夜间|夜里|今晚|明晚', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            if (this._tp.tunit[3] >= 1 && this._tp.tunit[3] <= 11) {
                this._tp.tunit[3] += 12;
            } else if (this._tp.tunit[3] === 12) {
                this._tp.tunit[3] = 0;
            } else if (this._tp.tunit[3] === -1) {
                this._tp.tunit[3] = TimeEnum.night;
            }
            /** 处理倾向于未来时间的情况   */
            this._preferFuture(3);
            this.isAllDayTime = false;
        }
    }
    public normSetMinute() {
        let rule = new RegExp('([0-5]?[0-9](?=分(?!钟)))', 'g');
        let match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            this._tp.tunit[4] = parseInt(match[0], 10);
            /** 处理倾向于未来时间的情况   */
            this._preferFuture(4);
            this.isAllDayTime = false;
        } else {
            const tmp = util.reverseStr(this.timeExpression);
            rule = new RegExp('([0-9][0-5]?)(?=([点时](?!小)))');
            match = tmp.match(rule);
            let s = '';
            if (match) {
                if (match.index === 0) {
                    s = util.reverseStr(match[0]);
                } else if (tmp[match.index - 1] !== '刻') {
                    s = util.reverseStr(match[0]);
                }
                if (s !== '') {
                    this._tp.tunit[4] = parseInt(s, 10);
                    /** 处理倾向于未来时间的情况   */
                    this._preferFuture(4);
                    this.isAllDayTime = false;
                }
            }
        }
        /** 加对一刻，半，3刻的正确识别（1刻为15分，半为30分，3刻为45分） */
        rule = new RegExp('([点时])[1一]刻(?!钟)', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            this._tp.tunit[4] = 15;
            /** 处理倾向于未来时间的情况   */
            this._preferFuture(4);
            this.isAllDayTime = false;
        }

        rule = new RegExp('([点时])半', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            this._tp.tunit[4] = 30;
            /** 处理倾向于未来时间的情况   */
            this._preferFuture(4);
            this.isAllDayTime = false;
        }

        rule = new RegExp('([点时])[3三]刻(?!钟)', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            this._tp.tunit[4] = 45;
            /** 处理倾向于未来时间的情况   */
            this._preferFuture(4);
            this.isAllDayTime = false;
        }
    }
    public normSetFuture() {
        let hour = this.timeExpression.match(/(\d*(?=小时)).*以?后/)
        if (hour) { this._excursion[0] = parseInt(hour ? hour[1] : '0', 10); }

        let minute = this.timeExpression.match(/(\d+(?=分钟?)).*以?后/)
        if (minute) { this._excursion[1] = parseInt(minute ? minute[1] : '0', 10); }

        let second = this.timeExpression.match(/(\d*(?=秒钟?)).*以?后/)
        if (second) { this._excursion[2] = parseInt(second ? second[1] : '0', 10); }

        if (this.timeExpression.match(/(分半|半分钟?)以?后/)) {
            this._excursion[2] = 30
        }
        if (this.timeExpression.match(/(半小时)以?后/)) {
            this._excursion[1] = 30
        }
    }
    public normSetSecond() {
        let rule = new RegExp('([0-5]?[0-9](?=秒))', 'g');
        let match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            this._tp.tunit[5] = parseInt(match[0], 10);
            this.isAllDayTime = false;
        } else {
            const tmp = util.reverseStr(this.timeExpression);
            rule = new RegExp('([0-9][0-5]?)(?=分)', 'g');
            match = tmp.match(rule);
            if (match && match.length > 0) {
                const s = util.reverseStr(match[0]);
                this._tp.tunit[5] = parseInt(s, 10);
                this.isAllDayTime = false;
            }
        }
    }
    public normSetTotal(){
        let tmpParser = [];
        const tmp = this.timeExpression.replace(/(周|星期)[1-7]/g, '');
        let rule = new RegExp('([0-2]?[0-9]):[0-5]?[0-9]:[0-5]?[0-9]', 'g');
        let match = tmp.match(rule);
        if (match && match.length > 0) {
            tmpParser = match[0].split(':');
            this._tp.tunit[3] = parseInt(tmpParser[0], 10);
            this._tp.tunit[4] = parseInt(tmpParser[1], 10);
            this._tp.tunit[5] = parseInt(tmpParser[2], 10);
            /** 处理倾向于未来时间的情况  */
            this._preferFuture(3);
            this.isAllDayTime = false;
        } else {
            rule = new RegExp('([0-2]?[0-9]):[0-5]?[0-9]');
            match = tmp.match(rule);
            if (match && match.length > 0) {
                tmpParser = match[0].split(':');
                this._tp.tunit[3] = parseInt(tmpParser[0], 10);
                this._tp.tunit[4] = parseInt(tmpParser[1], 10);
                /** 处理倾向于未来时间的情况  */
                this._preferFuture(3);
                this.isAllDayTime = false;
            }
        }
        /*
         * 增加了:固定形式时间表达式的
         * 中午,午间,下午,午后,晚上,傍晚,晚间,晚,pm,PM
         * 的正确时间计算，规约同上
         */
        rule = new RegExp('中午|午间', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            if (this._tp.tunit[3] >= 0 && this._tp.tunit[3] <= 10) {
                this._tp.tunit[3] += 12;
            }
            if (this._tp.tunit[3] === -1) {
                /** 增加对没有明确时间点，只写了“中午/午间”这种情况的处理 */
                this._tp.tunit[3] = TimeEnum.noon;
            }
            /** 处理倾向于未来时间的情况  */
            this._preferFuture(3);
            this.isAllDayTime = false;
        }
        rule = new RegExp('下午|午后|pm|PM', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            if (this._tp.tunit[3] >= 0 && this._tp.tunit[3] <= 11) {
                this._tp.tunit[3] += 12;
            }
            if (this._tp.tunit[3] === -1) {
                /** 增加对没有明确时间点，只写了“中午/午间”这种情况的处理 */
                this._tp.tunit[3] = TimeEnum.afternoon;
            }
            /** 处理倾向于未来时间的情况  */
            this._preferFuture(3);
            this.isAllDayTime = false;
        }

        rule = new RegExp('晚', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            if (this._tp.tunit[3] >= 1 && this._tp.tunit[3] <= 11) {
                this._tp.tunit[3] += 12;
            } else if (this._tp.tunit[3] === 12) {
                this._tp.tunit[3] = 0;
            }
            if (this._tp.tunit[3] === -1) {
                /** 增加对没有明确时间点，只写了“中午/午间”这种情况的处理 */
                this._tp.tunit[3] = TimeEnum.night;
            }
            /** 处理倾向于未来时间的情况  */
            this._preferFuture(3);
            this.isAllDayTime = false;
        }

        rule = new RegExp('[0-9]?[0-9]?[0-9]{2}-((10)|(11)|(12)|([1-9]))-([0-3][0-9]|[1-9])', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            tmpParser = match[0].split('-');
            this._tp.tunit[0] = parseInt(tmpParser[0], 10);
            this._tp.tunit[1] = parseInt(tmpParser[1], 10);
            this._tp.tunit[2] = parseInt(tmpParser[2], 10);
        }

        rule = new RegExp('((10)|(11)|(12)|([1-9]))/([0-3][0-9]|[1-9])/[0-9]?[0-9]?[0-9]{2}', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            tmpParser = match[0].split('/');
            this._tp.tunit[0] = parseInt(tmpParser[2], 10);
            this._tp.tunit[1] = parseInt(tmpParser[0], 10);
            this._tp.tunit[2] = parseInt(tmpParser[1], 10);
        }
        /*
         * 增加了:固定形式时间表达式 年.月.日 的正确识别
         * add by 曹零
         */
        rule = new RegExp('[0-9]?[0-9]?[0-9]{2}\\.((10)|(11)|(12)|([1-9]))\\.([0-3][0-9]|[1-9])', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            tmpParser = match[0].split('.');
            this._tp.tunit[0] = parseInt(tmpParser[0], 10);
            this._tp.tunit[1] = parseInt(tmpParser[1], 10);
            this._tp.tunit[2] = parseInt(tmpParser[2], 10);
        }
    }
    public normSetBaseRelated() {
        let d = this.timeBase;

        const flag = [false, false, false]; // 观察时间表达式是否因当前相关时间表达式而改变时间

        let rule = new RegExp('(\\d+)(?=天[以之]?前)', 'g');
        let match = this.timeExpression.match(rule);
        let day = 0;
        if (match && match.length > 0) {
            flag[2] = true;
            day = parseInt(match[0], 10);
            d = util.getDateAfterDays(d, -day);
        }

        rule = new RegExp('(\\d+)(?=天[以之]?后)', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[2] = true;
            day = parseInt(match[0], 10);
            d = util.getDateAfterDays(d, day);
        }

        rule = new RegExp('(\\d+)(?=(个)?月[以之]?前)', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[1] = true;
            day = parseInt(match[0], 10);
            d = util.getDateAfterMonths(d, -day);
        }

        rule = new RegExp('(\\d+)(?=(个)?月[以之]?后)', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[1] = true;
            day = parseInt(match[0], 10);
            d = util.getDateAfterMonths(d, day);
        }

        rule = new RegExp('(\\d+)(?=年[以之]?前)', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[0] = true;
            day = parseInt(match[0], 10);
            d = util.getDateAfterYears(d, -day);
        }

        rule = new RegExp('(\\d+)(?=年[以之]?后)', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[0] = true;
            day = parseInt(match[0], 10);
            d = util.getDateAfterYears(d, day);
        }

        if (flag[0] || flag[1] || flag[2]) {
            this._tp.tunit[0] = d.getFullYear();
        }
        if (flag[1] || flag[2]) {
            this._tp.tunit[1] = d.getMonth() + 1;
        }
        if (flag[2]) {
            this._tp.tunit[2] = d.getDate();
        }
    }
    normSetCurRelated() {
        let d = this.timeBase;

        let flag = [false, false, false]; // 观察时间表达式是否因当前相关时间表达式而改变时间
        let rule = new RegExp('前年', 'g');
        let match = this.timeExpression.match(rule);
        let day = 0;
        if (match && match.length > 0) {
            flag[0] = true;
            d = util.getDateAfterYears(d, -2);
        }
        rule = new RegExp('去年', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[0] = true;
            d = util.getDateAfterYears(d, -1);
        }

        rule = new RegExp('今年', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[0] = true;
            d = util.getDateAfterYears(d, 0);
        }

        rule = new RegExp('明年', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[0] = true;
            d = util.getDateAfterYears(d, 1);
        }

        rule = new RegExp('后年', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[0] = true;
            d = util.getDateAfterYears(d, 2);
        }

        rule = new RegExp('上(个)?月', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[1] = true;
            d = util.getDateAfterMonths(d, -1);
        }

        rule = new RegExp('(本|这个)月', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[1] = true;
            d = util.getDateAfterMonths(d, 0);
        }

        rule = new RegExp('下(个)?月', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[1] = true;
            d = util.getDateAfterMonths(d, 1);
        }

        rule = new RegExp('大前天', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[2] = true;
            d = util.getDateAfterDays(d, -3);
        }

        rule = new RegExp('大前天', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[2] = true;
            d = util.getDateAfterDays(d, -3);
        }

        rule = new RegExp('昨', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[2] = true;
            d = util.getDateAfterDays(d, -1);
        }

        rule = new RegExp('今(?!年)', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[2] = true;
            d = util.getDateAfterDays(d, 0);
        }

        rule = new RegExp('明(?!年)', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[2] = true;
            d = util.getDateAfterDays(d, 1);
        }

        rule = new RegExp('大后天', 'g');
        match = this.timeExpression.match(rule);
        if (match && match.length > 0) {
            flag[2] = true;
            d = util.getDateAfterDays(d, 3);
        }

        let tmp = util.reverseStr(this.timeExpression);
        rule = new RegExp('天前(?!大)', 'g');
        match = tmp.match(rule);
        if (match && match.length > 0) {
            flag[2] = true;
            d = util.getDateAfterDays(d, -2);
        }

        rule = new RegExp('天后(?!大)', 'g');
        match = tmp.match(rule);
        if (match && match.length > 0) {
            flag[2] = true;
            d = util.getDateAfterDays(d, 2);
        }

        rule = new RegExp('[1-7]?(?=(周|期星)上上)', 'g');
        match = tmp.match(rule);
        if (match && match.length > 0) {
            flag[2] = true;
            day = parseInt(match[0], 10);
            d = util.getDateAfterWeeks(d, -2, day);
        }

        rule = new RegExp('[1-7]?(?=(周|期星)上(?!上))', 'g');
        match = tmp.match(rule);
        if (match && match.length > 0) {
            flag[2] = true;
            day = parseInt(match[0], 10);
            d = util.getDateAfterWeeks(d, -1, day);
        }

        rule = new RegExp('[1-7]?(?=(周|期星)下(?!下))', 'g');
        match = tmp.match(rule);
        if (match && match.length > 0) {
            flag[2] = true;
            day = parseInt(match[0], 10);
            d = util.getDateAfterWeeks(d, 1, day);
        }

        rule = new RegExp('[1-7]?(?=(周|期星)下下)', 'g');
        match = tmp.match(rule);
        if (match && match.length > 0) {
            flag[2] = true;
            day = parseInt(match[0], 10);
            d = util.getDateAfterWeeks(d, 2, day);
        }

        rule = new RegExp('[1-7]?(?=(周|期星)(?!((上|下))))', 'g');
        match = tmp.match(rule);
        if (match && match.length > 0) {
            flag[2] = true;
            day = parseInt(match[0], 10);
            let ddw = this.timeBase.getDay();
            let addW = 0;
            if (ddw === 0) {
                ddw = 7;
            }
            if (ddw > day) {
                addW = 1;
            }
            d = util.getDateAfterWeeks(d, addW, day);
        }

        if (flag[0] || flag[1] || flag[2]) {
            this._tp.tunit[0] = d.getFullYear();
        }
        if (flag[1] || flag[2]) {
            this._tp.tunit[1] = d.getMonth() + 1;
        }
        if (flag[2]) {
            this._tp.tunit[2] = d.getDate();
        }
    }
    modifyTimeBase() {
        let d = this.timeBase;

        let s = '';
        if (this._tp.tunit[0] !== -1) {
            s += this._tp.tunit[0].toString();
        } else {
            s += d.getFullYear();
        }
        s += '-';
        if (this._tp.tunit[1] !== -1) {
            s += this._tp.tunit[1].toString();
        } else {
            s += d.getMonth() + 1;
        }
        s += '-';
        if (this._tp.tunit[2] !== -1) {
            s += this._tp.tunit[2].toString();
        } else {
            s += d.getDate();
        }
        s += ' ';
        if (this._tp.tunit[3] !== -1) {
            s += this._tp.tunit[3].toString();
        } else {
            s += d.getHours();
        }
        s += ':';
        if (this._tp.tunit[4] !== -1) {
            s += this._tp.tunit[4].toString();
        } else {
            s += d.getMinutes();
        }
        s += ':';
        if (this._tp.tunit[5] !== -1) {
            s += this._tp.tunit[5].toString();
        } else {
            s += d.getSeconds();
        }

        this.timeBase = new Date(s);
    }
    timeNormalization(format?:string) {
        this.normSetYear();
        this.normSetMonth();
        this.normSetDay();
        this.normSetMonthFuzzyDay();
        this.normSetBaseRelated();
        this.normSetCurRelated();
        this.normSetHour();
        this.normSetMinute();
        this.normSetSecond();
        this.normSetFuture();
        this.normSetTotal();
        // this.modifyTimeBase();

        this._tpOrigin.tunit = [].concat(this._tp.tunit);

        let _resultTmp = [];
        _resultTmp[0] = this._tp.tunit[0].toString();
        if (this._tp.tunit[0] >= 10 && this._tp.tunit[0] < 100) {
            _resultTmp[0] = '19' + this._tp.tunit[0].toString();
        }
        if (this._tp.tunit[0] > 0 && this._tp.tunit[0] < 10) {
            _resultTmp[0] = '200' + this._tp.tunit[0].toString();
        }
        if (this._tp.tunit[0] === -1) {
            _resultTmp[0] = new Date().getFullYear()
        }
        let flag = false;
        this._tp.tunit.forEach(function (t) {
            if (t !== -1) {
                flag = true;
            }
        });
        if (!flag && !this._excursion.length) {
            return null;
        }
        // 没有设置月的默认当前
        if (this._tp.tunit[1] === -1) {
            this._tp.tunit[1] = new Date().getMonth();
        }
        // 没有设置日的默认当前
        if (this._tp.tunit[2] === -1) {
            this._tp.tunit[2] = new Date().getDay();
        }
        // 没有设置小时的默认当前
        if (this._tp.tunit[3] === -1) {
            this._tp.tunit[3] = new Date().getHours();
        }


        for (let i = 1; i < 6; i++) {
            if (this._tp.tunit[i] !== -1) {
                _resultTmp[i] = util.zeroPad(2, this._tp.tunit[i]);
            } else {
                _resultTmp[i] = '00';
            }
        }
        let timePlus = (this._excursion[0] * 3600 + this._excursion[1] * 60 + this._excursion[2]) * 1000
        let time = _resultTmp[0] + '-' + _resultTmp[1] + '-' + _resultTmp[2] + ' ' + _resultTmp[3] + ':' + _resultTmp[4] + ':' + _resultTmp[5];
        if (timePlus) {
            return format?formatDate(new Date(new Date().getTime() + timePlus),format):new Date(new Date().getTime() + timePlus);
        } else {
            return format?formatDate(new Date(time),format):new Date(time);
        }
    }
}
