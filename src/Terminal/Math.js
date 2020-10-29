class Operator {
    constructor(name,
        precedence,
        associativity,
        numParams,
        method) {
        this.associativity = associativity || 'left'
        this.name = name
        this.precedence = precedence
        this.numParams = numParams
        this.method = method
    }

    greaterThan = (op) => this.precedence > op.precedence
    greaterThanEqual = (op) => this.precedence >= op.precedence
    equalThan = (op) => this.precedence === op.precedence
    lessThan = (op) => this.precedence < op.precedence
    lessThanEqual = (op) => this.precedence <= op.precedence
    leftAssoc = () => this.associativity === 'left'
    rightAssoc = () => this.associativity === 'right'
}



export class Expression {
    operators
    functions
    expression
    constructor(expression) {
        this.operators = {
            '+': new Operator('+', 2, 'left', 2, (a, b) => a + b),
            '-': new Operator('-', 2, 'left', 2, (a, b) => a - b),
            '*': new Operator('*', 3, 'left', 2, (a, b) => a * b),
            '/': new Operator('/', 3, 'left', 2, (a, b) => a / b),
            '^': new Operator('^', 4, 'right', 2, (a, b) => Math.pow(a, b))
        }

        this.expression = expression

        this.functions = {}
    }

    addFunction(key, func) {
        if (this.functions[key]) {
            throw new Error(`Function ${key} does already exist.`)
        }
        this.functions[key] = func
    }

    addOperator(key, operator) {
        if (this.operators[key]) {
            throw new Error(`Operator ${key} does already exist.`)
        }
        this.operators[key] = operator
    }

    parse(str) {
        let output = []
        let stack = []
        let sign
        let lastToken
        let token

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
                    const thisOperator = this.operators[token]
                    const operator = this.operators[stack[stack.length - 1]]
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

    resolveRpn(arr) {
        if (!arr) { return null }
        let stack = arr.map((e) => {
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

    isLeftParent = (token) => token === '('
    isRightParent = (token) => token === ')'
    isOperator = (token) => token && Object.keys(this.operators).indexOf(token) !== -1
    isFunction = (token) => token && Object.keys(this.functions).indexOf(token) !== -1
}