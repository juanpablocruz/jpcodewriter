import React from 'react';
import ReactDOM from 'react-dom';
import Terminal, {
    appendOutput,
    liftToArray,
    omitInput,
    head,
    tail,
    trace,
    getCommandParts,
    getCommandFromArgs,
    getRestArgs,
    newState
} from '../Terminal';

describe('newState', () => {
    it("Returns setState argument function", () => {
        expect(newState({ a: "test" })({}, {}))
            .toStrictEqual({ "newState": { "a": "test" } })
    })
})
describe('getRestArgs', () => {
    it("Returns arguments from string", () => {
        expect(getRestArgs("test command")).toStrictEqual(["command"])
        expect(getRestArgs("test")).toStrictEqual([])
    })
})
describe('getCommandFromArgs', () => {
    it("Returns command part from string", () => {
        expect(getCommandFromArgs("test command")).toStrictEqual("test")
        expect(getCommandFromArgs("test")).toStrictEqual("test")
    })
})

describe('getCommandParts', () => {
    it("Returns command as array", () => {
        expect(getCommandParts("test command")).toStrictEqual(["test", "command"])
    })
})

describe('appendOutput', () => {
    it('Should append new message', () => {
        const expected = [{ "msg": "test", "type": "output" }]
        expect(appendOutput([])(["test"])).toStrictEqual(expected)
    })
    it('Should concatenate messages', () => {
        const original = [{ "msg": "test", "type": "output" }]
        const message = ["test2"]
        const expected = [
            { "msg": "test", "type": "output" },
            { "msg": "test2", "type": "output" },
        ]
        expect(appendOutput(original)(message)).toStrictEqual(expected)
    })
})

describe('liftToArray', () => {
    it('Should lift to array', () => {
        expect(liftToArray("a")).toStrictEqual(["a"])
        expect(liftToArray(2)).toStrictEqual([2])
        expect(liftToArray({ test: "test" })).toStrictEqual([{ test: "test" }])
    })
})

describe('omitInput', () => {
    it("Argument should be omitted", () => {
        expect(omitInput("a")).toStrictEqual("")
    })
})

describe('head', () => {
    it("Should return head element", () => {
        expect(head([1, 2])).toStrictEqual(1)
    })
    it("Should return null if no elements", () => {
        expect(head([])).toBeNull()
    })
    it("Should return null if no array", () => {
        expect(head(2)).toBeNull()
    })
})
describe('tail', () => {
    it("Should return last element", () => {
        expect(tail([1, 2])).toStrictEqual(2)
    })
    it("Should return only element", () => {
        expect(tail([1])).toStrictEqual(1)
    })
    it("Should return null if no elements", () => {
        expect(tail([])).toBeNull()
    })
    it("Should return null if no array", () => {
        expect(tail(2)).toBeNull()
    })
})

describe("trace", () => {
    beforeEach(() => {
        console["log"] = jest.fn()
    })
    it("Should pass through input", () => {
        expect(trace("test")(2)).toStrictEqual(2)
    })
    it("Should log the label + input", () => {

        trace("test")(2)
        expect(console["log"]).toHaveBeenCalledWith("test: 2")
    })
})