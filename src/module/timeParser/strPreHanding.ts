import * as util from '@/utils'
const zhNumChar={
    零: 0,
    一: 1,
    两: 2,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9
}
const zhNumValue={
    十: { value: 10, secUnit: false },
    百: { value: 100, secUnit: false },
    千: { value: 1000, secUnit: false },
    万: { value: 10000, secUnit: true },
    亿: { value: 100000000, secUnit: true }
}
export const preHandler={
    delKeyword(target, rules) {
        const r = new RegExp(rules, 'g');
        return target.replace(r, '');
    },

    numberTranslator(target) {
        let tmp = util.reverseStr(target);
        const rule = new RegExp('[末天日](?=(周|期星))', 'g');
        tmp = tmp.replace(rule, '7');
        target = util.reverseStr(tmp);

        let section = 0;
        let number = 0;
        let rtn = 0;
        let secUnit = false;
        const str = target.split('');
        let result = '';
        let flag = false;
        for (let i = 0; i < str.length; i++) {
            if (zhNumChar.hasOwnProperty(str[i]) || zhNumValue.hasOwnProperty(str[i])) {
                flag = true;
                if (zhNumChar.hasOwnProperty(str[i])) {
                    number = zhNumChar[str[i]];
                } else {
                    const unit = zhNumValue[str[i]].value;
                    secUnit = zhNumValue[str[i]].secUnit;
                    if (secUnit) {
                        section = (section + number) * unit;
                        rtn += section;
                        section = 0;
                    } else {
                        section += number * unit;
                    }
                    number = 0;
                }
            } else {
                if (flag) {
                    result += (rtn + section + number).toString();
                    flag = false;
                    number = 0;
                    section = 0;
                    rtn = 0;
                    secUnit = false;
                }
                result += str[i];
            }
        }
        if (flag) {
            result += (rtn + section + number).toString();
        }
        return result;
    },

    DBC2CDB(target) {
        let tmp = '';
        for (let i = 0; i < target.length; i++) {
            if (target.charCodeAt(i) > 65248 && target.charCodeAt(i) < 65375) {
                tmp += String.fromCharCode(target.charCodeAt(i) - 65248);
            } else {
                tmp += String.fromCharCode(target.charCodeAt(i));
            }
        }
        return tmp;
    }
}
