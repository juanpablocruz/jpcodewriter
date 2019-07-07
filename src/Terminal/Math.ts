class Operator {
    associativity: string
    name: string
    precedence: number
    numParams: number
    method: any

    constructor(name: string,
        precedence: number,
        associativity: string,
        numParams: number,
        method: any) {
        this.associativity = associativity || 'left'
        this.name = name
        this.precedence = precedence
        this.numParams = numParams
        this.method = method
    }

    greaterThan = (op: Operator) => this.precedence > op.precedence
    greaterThanEqual = (op: Operator) => this.precedence >= op.precedence
    equalThan = (op: Operator) => this.precedence === op.precedence
    lessThan = (op: Operator) => this.precedence < op.precedence
    lessThanEqual = (op: Operator) => this.precedence <= op.precedence
    leftAssoc = () => this.associativity === 'left'
    rightAssoc = () => this.associativity === 'right'
}



export class Expression {
    operators: any
    functions: any
    expression: string
    constructor(expression: string) {
        this.operators = {
            '+': new Operator('+', 2, 'left', 2, (a: number, b: number) => a + b),
            '-': new Operator('-', 2, 'left', 2, (a: number, b: number) => a - b),
            '*': new Operator('*', 3, 'left', 2, (a: number, b: number) => a * b),
            '/': new Operator('/', 3, 'left', 2, (a: number, b: number) => a / b),
            '^': new Operator('^', 4, 'right', 2, (a: number, b: number) => Math.pow(a, b))
        }

        this.expression = expression

        this.functions = {}
    }

    addFunction(key: string, func: any) {
        if (this.functions[key]) {
            throw new Error(`Function ${key} does already exist.`)
        }
        this.functions[key] = func
    }

    addOperator(key: string, operator: Operator) {
        if (this.operators[key]) {
            throw new Error(`Operator ${key} does already exist.`)
        }
        this.operators[key] = operator
    }

    parse(str: string) {
        let output: string[] = []
        let stack: string[] = []
        let sign: string | null | undefined
        let lastToken
        let token: string

        for (let i = 0, l = str.length; i < l; ++i) {
            token = str[i]
            if (token === ' ') {
                continue // do nothing with spaces
            }
            if (sign) {
                token = sign += token
                sign = null
            }
            if (this.isLeftParent(token)) {
                stack.push(token)
            } else if (this.isFunction(token)) {
                stack.push(token)
            } else if (this.isRightParent(token)) {
                let operator
                while ((operator = stack.pop()) && !this.isLeftParent(operator)) {
                    if (!this.isFunction(operator)) {
                        output.push(operator)
                    }
                }
                if (typeof operator === 'undefined') {
                    return null // to many closing paranthesis
                }
            } else if (this.isOperator(token)) {
                if (!lastToken || lastToken === '(') {
                    sign = token
                    continue
                }
                while (stack.length) {
                    const thisOperator: Operator = this.operators[token]
                    const operator: Operator = this.operators[stack[stack.length - 1]]
                    if (!operator || !thisOperator) { break }
                    if ((thisOperator.leftAssoc() && thisOperator.lessThanEqual(operator)) || thisOperator.lessThan(operator)) {
                        let last = stack.pop()
                        if (last) {
                            output.push(last)
                        }
                    } else {
                        break
                    }
                }
                stack.push(token)
            } else {
                if (!lastToken || this.isLeftParent(lastToken) || this.isOperator(lastToken)) {
                    output.push(token)
                } else {
                    output[output.length - 1] += token
                }
            }
            lastToken = token
        }

        while (stack.length) {
            let tk = stack.pop() 
            if (!tk || this.isLeftParent(tk)) {
                return null // to many opening paranthesis
            }
            output.push(tk)
        }

        return output
    }

    resolveRpn(arr: string[] | null) {
        if (!arr) { return null }
        let stack: number[] = arr.map((e) => {
            const op = this.operators[e] || this.functions[e]
            if (op) {
                return op.method.apply(this, stack.splice(-op.params))
            } else {
                return parseFloat(e)
            }
        })

        return stack[0]
    }
    resolve() {
        return this.resolveRpn(this.parse(this.expression))
    }

    isLeftParent = (token?: string) => token === '('
    isRightParent = (token?: string) => token === ')'
    isOperator = (token?: string) => token && Object.keys(this.operators).indexOf(token) !== -1
    isFunction = (token?: string) => token && Object.keys(this.functions).indexOf(token) !== -1
}