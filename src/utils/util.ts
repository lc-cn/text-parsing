export const ONE_MINUTE_MILLISECOND=60000,
    ONE_HOUR_MILLISECOND= 3600000,
    ONE_DAY_MILLISECOND= 86400000,
    ONE_WEEK_MILLISECOND=604800000,
    ONE_MONTH_MILLISECOND= 2592000000,
    ONE_YEAR_MILLISECOND=31536000000,
    zodiacArray= ['猴', '鸡', '狗', '猪', '鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊'],
    constellationArray= ['水瓶座', '双鱼座', '牡羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '魔羯座'],
    constellationEdgeDay= [20, 19, 21, 21, 21, 22, 23, 23, 23, 23, 22, 22]

export function isEmptyStr(str) {
    return !(str && str.trim().length > 0);
}
export function zeroPad(digits, n) {
    n = n.toString();
    while (n.length < digits) {
        n = '0' + n;
    }
    return n;
}
export function reverseStr(str) {
    return str.split('').reverse().join('');
}
export function isLeapYear(year) {
    if (year / 4 * 4 !== year) {
        // eslint-disable-line
        return false;
    }
    if (year / 100 * 100 !== year) {
        // eslint-disable-line
        return true;
    }

    return year / 400 * 400 === year; // eslint-disable-line
}
export function year2Zodica(year) {
    return zodiacArray[year % 12];
}
export function date2Zodica(date) {
    var d = date ? new Date(date) : new Date();
    return year2Zodica(d.getFullYear());
}
export function date2Constellation(date) {
    var d = date ? new Date(date) : new Date();
    var month = d.getMonth();
    var day = d.getDate();
    if (day < constellationEdgeDay[month]) {
        month -= 1;
    }
    if (month >= 0) {
        return constellationArray[month];
    }

    return constellationArray[11];
}

/**
 * 是否是今天
 * @param date
 */
export function isToday(date) {
    return isTheDay(date, new Date());
}
/**
 * 获得指定时间那天的某个小时（24小时制）的整点时间
 */
export function getSpecificHourInTheDay(date, hourIn24) {
    var d = date ? new Date(date) : new Date();
    d.setHours(hourIn24, 0, 0, 0);
    return d;
}
/**
 * 取周一
 */
export function getFirstDayOfWeek(date) {
    var d = date ? new Date(date) : new Date();
    var currentDay = d.getDay();
    currentDay = currentDay === 0 ? 7 : currentDay;
    return getDateAfterDays(date, 1 - currentDay);
}
/**
 * 获取相对多少天后的日期
 * @param date
 * @param AddDayCount
 * @return {Date}
 */
export function getDateAfterDays(date, AddDayCount) {
    var d = date ? new Date(date) : new Date();
    d.setDate(d.getDate() + AddDayCount);
    return d;
}
/**
 * 获取相对多少星期后的日期
 * @param date
 * @param AddWeekCount
 * @param weekDay
 * @return {Date}
 */
export function getDateAfterWeeks(date, AddWeekCount, weekDay) {
    var d = date ? new Date(date) : new Date();
    d.setDate(d.getDate() + 7 * AddWeekCount);
    if (weekDay) {
        var dWeekDay = d.getDay();
        if (dWeekDay === 0) {
            dWeekDay = 7;
        }
        if (weekDay !== dWeekDay) {
            d.setDate(d.getDate() + (weekDay - dWeekDay));
        }
    }
    return d;
}
/**
 * 获取相对多少月后的日期
 * @param date
 * @param AddMonthCount
 * @return {Date}
 */
export function getDateAfterMonths(date, AddMonthCount) {
    var d = date ? new Date(date) : new Date();
    var day = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + AddMonthCount);
    d.setDate(day);
    return d;
}
/**
 * 获取相对多少年后的日期
 * @param date
 * @param AddYearCount
 * @return {Date}
 */
export function getDateAfterYears(date, AddYearCount) {
    var d = date ? new Date(date) : new Date();
    d.setFullYear(d.getFullYear() + AddYearCount);
    return d;
}
/**
 * 某一天开始时间
 */
export function dayBegin(date) {
    return getSpecificHourInTheDay(date, 0);
}
/**
 * 某一天结束时间
 */
export function dayEnd(date) {
    var d = date ? new Date(date) : new Date();
    d.setHours(23, 59, 59, 999);
    return d;
}
/**
 * 判断是否某一天
 * @param date
 * @param day
 * @return {boolean}
 */
export function isTheDay(date, day) {
    var d = (date ? new Date(date) : new Date()).getTime();
    return d >= dayBegin(day).getTime() && d <= dayEnd(day).getTime();
}
/**
 * 格式化时间
 * @param date
 * @return {string}
 */
export function formatDateDefault(date) {
    var d = date ? new Date(date) : new Date();
    var year = d.getFullYear();
    var month = zeroPad(2, d.getMonth() + 1);
    var day = zeroPad(2, d.getDate());
    var hour = zeroPad(2, d.getHours());
    var min = zeroPad(2, d.getMinutes());
    var sec = zeroPad(2, d.getSeconds());
    return year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':' + sec;
}
/**
 * 检测日期格式字符串是否合法
 * @param strDateTime
 * @return {boolean}
 */
export function checkDateFormatAndValite(strDateTime) {
    if (isEmptyStr(strDateTime)) {
        return false;
    }
    if (formatDateDefault(new Date(strDateTime)) !== strDateTime) {
        return false;
    }
    return true;
}

export function formatDate(date:Date|string,format='YY-MM-DD hh:mm:ss'){
    let ret;
    const weekCn = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    if(typeof date==='string')date=new Date(date)
    const opt:Record<string, string> = {
        "Y+": date.getFullYear().toString(),        // 年
        "M+": (date.getMonth() + 1).toString(),     // 月
        "D+": date.getDate().toString(),            // 日
        "h+": date.getHours().toString(),           // 时
        'q+': Math.floor((date.getMonth() + 3) / 3).toString(), // 季度
        "m+": date.getMinutes().toString(),         // 分
        "s+": date.getSeconds().toString(),         // 秒
        'S': date.getMilliseconds().toString(),     // 毫秒
        'w': date.getDay().toString(),              // 周
        'W': weekCn[date.getDay()],                 // 大写周
        'T': 'T'                                    // 时间标记
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(format);
        if (ret) {
            format = format.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        };
    };
    return format;
}
