import {Immutable, ImmutableUtils} from 'immutable-typescript'
const Token = {
    Number: ['value'],
    Lparen: [],
    Rparen: [],
    Mul: [],
    Div: [],
    Add: [],
    Sub: []
}

const matchers = [
    { type: "Number", pattern: /^\d+/ },
    { type: 'Lparen', pattern: /^\(/ },
    { type: 'Rparen', pattern: /^\)/ },
    { type: 'Mul', pattern: /^\*/ },
    { type: 'Div', pattern: /^\// },
    { type: 'Add', pattern: /^\+/ },
    { type: 'Sub', pattern: /^-/ },
    { type: 'space', pattern: /^\s+/ },
]

const lex = (inputStr:string) => {
    if (!inputStr) {
        return []
    }

    const match = matchers.reduce(
        (foundMatch:any, matcher:any) => {
            if(foundMatch) return foundMatch
            const possibleMatch = matcher.pattern.exec(inputStr)
            return possibleMatch && {
                type: matcher.type,
                value: possibleMatch[0]
            }
        }, null
    )

    if (!match) {
        throw Error(`Parse error at: ${inputStr}`)
    }

    if (match.type === 'space') {
        return lex(inputStr.slice(1))
    }
    const token = ""
/*
    const token = (match.type === 'Number')
    ? Token.Number(match.value)*/

    const remaining = inputStr.slice(match.value.length)

    return lex(remaining).unshift(token)
}