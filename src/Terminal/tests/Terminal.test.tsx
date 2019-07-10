import React from 'react';
import ReactDOM from 'react-dom';
import Terminal, {
    appendOutput,
    liftToArray,
    omitInput,
    head,
    tail,
    trace,
    liftP
} from '../Terminal';


/**
 * export const appendOutput = (buffer: any) => (output: any) => (
    output.reduce((prev: any, el: any) =>
        prev.concat({ msg: el, type: "output" }), buffer)
)
export const liftToArray = (x: any) => [x]
export const omitInput = (x:any) => ""
export const head = (arr: any) => arr[0]
export const tail = (arr: any) => arr[arr.length - 1]
export const trace = (label: string) => (inpt: any) => { console.log(label, inpt); return inpt }
export const liftP = (fn: any) => {
    return (...args: any) => {
        return Promise.all(args).then((x) => fn.apply(null, x))
    }
}
 */
describe('appendOutput', () => {
    it('', () => {
        expect(appendOutput([])(["test"])).toBe(["test"])
    })
})
