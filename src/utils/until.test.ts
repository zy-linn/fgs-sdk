import * as until from './util';

test("Object is not a string type", () => {
    expect(until.isString({ param: 1 })).toBe(false);
});

test("String is the string type", () => {
    expect(until.isString('test')).toBe(true);
});

test("Change underline to hump", () => {
    expect(until.underlineToHump('aa_bb_cc')).toEqual('aaBbCc');
});

test("Change hump to underline", () => {
    expect(until.humpToUnderline('aaBbCc')).toEqual('aa_bb_cc');
});