import React, { Component } from 'react'
import './style/Vim.css'
import Carret from '../Terminal/Carret';
import Footer from './Footer'
import { Arguments } from '../Terminal/Terminal';
import { pipe } from 'ramda';

interface Props {
    return: any
    save: any
    input?: Arguments[]
}

export enum Mode {
    Insert,
    Command,
}

export enum CarretMovement {
    UP,
    DOWN,
    LEFT,
    RIGHT
}

interface State {
    mode: Mode,
    text: string
    currentLine: number
    currentCol: number
    commandText: string[]
    file: any
}


export default class Vim extends Component<Props, State>{
    tabSize: number
    getFromStart: any

    constructor(props: Props) {
        super(props)

        this.handleInput = this.handleInput.bind(this)
        this.processInsertModeInput = this.processInsertModeInput.bind(this)
        this.processCommandModeInput = this.processCommandModeInput.bind(this)
        this.deleteChars = this.deleteChars.bind(this)

        this.tabSize = 4
        window.addEventListener("keydown", this.handleInput)

        let text = ""
        let file = null
        if (props.input && props.input.length) {
            let inputFile = props.input[0]
            text = inputFile.data && inputFile.data.length ? inputFile.data : ""
            file = inputFile.file
        }
        this.state = {
            mode: Mode.Insert,
            text: text,
            file: file,
            currentLine: 0,
            currentCol: 0,
            commandText: []
        }

        this.getFromStart = this.getLineFrom(0)
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleInput, false)
    }

    getNumberOfLines() {
        return Math.abs(window.innerHeight / 16) + 2
    }

    handleMovementKeys(direction: CarretMovement) {
        let { currentCol, currentLine, text } = this.state
        if (direction === CarretMovement.RIGHT) {
            currentCol += 1
        } else if (direction === CarretMovement.LEFT) {
            currentCol -= 1
        } else if (direction === CarretMovement.DOWN) {
            let textLines = text.split('\n').length - 1
            if (currentLine < textLines) {
                currentLine++
            }
        } else if (direction === CarretMovement.UP) {
            if (currentLine > 0) {
                currentLine--
                currentCol = text.split("\n")[currentLine].length - 1
            }
        }
        return { currentLine, currentCol }
    }

    insertKey(key: string) {
        let text = this.state.text
        let splittedText = text.split('\n')
        let currentLine = splittedText[this.state.currentLine]
        splittedText[this.state.currentLine] = currentLine.substr(0, this.state.currentCol) + key + currentLine.substr(this.state.currentCol, currentLine.length)

        let newText = splittedText.join('\n')
        return newText
    }

    processInsertModeInput(event: KeyboardEvent) {
        let keycode = event.keyCode;

        let valid =
            (keycode > 47 && keycode < 58) || // number keys
            keycode === 32 || keycode === 13 || // spacebar & return key(s) (if you want to allow carriage returns)
            (keycode > 64 && keycode < 91) || // letter keys
            (keycode > 95 && keycode < 112) || // numpad keys
            (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
            (keycode > 218 && keycode < 227);   // [\]' (in order)
        let { text, currentCol, currentLine } = this.state
        let newPosition = { currentCol, currentLine }
        if (event.key === "Enter") {
            text = this.insertKey('\n')
            newPosition = { currentCol: 0, currentLine: currentLine + 1 }
        } else if (event.code === "Tab") {
            text = text + '\t'
            newPosition.currentCol = currentCol + this.tabSize
        } else if (event.code === "Backspace") {
            text = text.slice(0, -1)
            newPosition.currentCol = currentCol + 1
        } else if (event.code === "ArrowRight") {
            newPosition = this.handleMovementKeys(CarretMovement.RIGHT)
        } else if (event.code === "ArrowLeft") {
            newPosition = this.handleMovementKeys(CarretMovement.LEFT)
        } else if (event.code === "ArrowDown") {
            newPosition = this.handleMovementKeys(CarretMovement.DOWN)
        } else if (event.code === "ArrowUp") {
            newPosition = this.handleMovementKeys(CarretMovement.UP)
        }
        else if (valid) {
            text = this.insertKey(event.key)
            newPosition.currentCol = currentCol + 1
        } else {
            console.log(event)
        }
        this.setState({ ...newPosition, text })
    }

    getLineFrom = (from: number) => (dest: number) => (sentence: string) => sentence.slice(from, dest)
    getFromNUntilEnd = (n: number) => (sentence: string) => sentence.slice(n, sentence.length)
    splitText = (text: string) => text.split('\n')
    getCurrentLine = (text: string) => (
        (currentLine: number) => this.splitText(text)[currentLine]
    )
    replaceAndJoin = (text: string) => (
        (currentLine: number) => (newText: string) => {
            let splitted = this.splitText(text)
            splitted[currentLine] = newText
            return splitted.join('\n')
        }
    )

    deleteChars = (modifiers:string) => (command:string) => {
        let delNChars = 1
        if (modifiers.length) {
            if (!Number.isNaN(Number(modifiers))) {
                delNChars = Number(modifiers)
            }
        }
        const { text, currentCol, currentLine } = this.state

        const getCurrentLineOfText = this.getCurrentLine(text)
        let cursorLine = getCurrentLineOfText(currentLine)

        let newCol = currentCol

        const getLineUntilCursor = this.getFromStart(currentCol)
        const getLineUntilEnd = this.getFromNUntilEnd(currentCol)

        if (command === "x") {
            let getNewText = (str: string) => (
                getLineUntilCursor(str) +
                this.getFromNUntilEnd(currentCol + delNChars)(str)
            )
            cursorLine = getNewText(cursorLine)
        } else if (command === "X") {
            let getNewText = (str: string) => (
                this.getFromStart(currentCol - delNChars)(str) +
                getLineUntilEnd(str)
            )
            cursorLine = getNewText(cursorLine)
            if (currentCol > cursorLine.length - 1) {
                newCol = cursorLine.length - 1
            }
        }

        let newText = this.replaceAndJoin(text)(currentLine)(cursorLine)
        return { text: newText, currentCol: newCol }
    }

    deleteWord(modifiers: number) {
        const { currentLine, text, currentCol } = this.state

        const getCurrentLineOfText = this.getCurrentLine(text)
        let cursorLine = getCurrentLineOfText(currentLine)

        const getLineUntilCursor = this.getFromStart(currentCol)
        const getLineUntilEnd = this.getFromNUntilEnd(currentCol)

        let shiftAndJoin = (modifiers: number) =>
            (words: string) => words.split(" ").slice(modifiers, words.length).join(" ")
        let shiftAndJoinModifiers = shiftAndJoin(modifiers)

        let getLastPart = pipe(getLineUntilEnd, shiftAndJoinModifiers)
        let getNewText = (str: string) => (getLineUntilCursor(str) + getLastPart(str))

        let newText = this.replaceAndJoin(text)(currentLine)(getNewText(cursorLine))
        return newText
    }

    performCommands(commandText: string[]): boolean {
        let ommitKeys = ["Shift", "CapsLock", "Control", "Enter"]
        let modifiers = ""
        const { text, currentLine, currentCol } = this.state
        const getCurrentLineOfText = this.getCurrentLine(text)
        const cursorLine = getCurrentLineOfText(currentLine)

        let newState = commandText.reduce((prevState: any, command: string) => {
            let newState = {}
            switch (command) {
                case "i":
                    newState = { mode: Mode.Insert }
                    break;
                case "h": // left
                    newState = this.handleMovementKeys(CarretMovement.LEFT)
                    break
                case "j": // down
                    newState = this.handleMovementKeys(CarretMovement.DOWN)
                    break
                case "k": // up
                    newState = this.handleMovementKeys(CarretMovement.UP)
                    break
                case "l": // right
                    newState = this.handleMovementKeys(CarretMovement.RIGHT)
                    break
                case "Enter": // save and quit
                    if (modifiers.length) {
                        if (modifiers === "zz") {
                            this.props.save({ file: this.state.file, data: this.state.text })
                            this.props.return()
                        } else if (modifiers === ":q!") {
                            this.props.return()
                        } else if (modifiers === ":w") {
                            this.props.save({ file: this.state.file, data: this.state.text })
                        }
                    }
                    break;
                case "d":
                    modifiers += command
                    break
                case "w":
                    if (modifiers.length && modifiers.charAt(modifiers.length - 1) === "d") {
                        let newModifiers = modifiers.slice(0, modifiers.length - 1)
                        let deleteModifier = 1
                        if (newModifiers.length) {
                            if (!Number.isNaN(Number(newModifiers))) {
                                deleteModifier = Number(newModifiers)
                            }
                        } 
                        newState = {text:this.deleteWord(deleteModifier)}
                    } 
                    break
                case "D":
                    const getLineUntilCursor = this.getFromStart(currentCol)
                    const replaceAndJoinText = this.replaceAndJoin(text)(currentLine)
                    const getNewText = pipe(
                        getLineUntilCursor as (str: string) => string,
                        replaceAndJoinText
                    )
                    newState = { text: getNewText(cursorLine) }
                    break
                case "x":
                case "X":
                    const deleteCharsWithModifiers = this.deleteChars(modifiers)
                    newState = deleteCharsWithModifiers(command)
                    break
                default:
                    if (!ommitKeys.includes(command))
                        modifiers += command
                    break
            }
            return Object.assign(prevState, newState)
        }, {})

        this.setState({...newState})
        return Object.keys(newState).length > 0
    }

    processCommandModeInput(event: KeyboardEvent) {
        let {commandText} = this.state
        switch (event.code) {
            case "ArrowUp":
                commandText.push("k")
                break
            case "ArrowDown":
                commandText.push("j")
                break
            case "ArrowLeft":
                commandText.push("h")
                break
            case "ArrowRight":
                commandText.push("l")
                break
            case "ShiftLeft":
            case "ShiftRight":
                break;
            default:
                commandText.push(event.key)
                break
        }

        if (!this.performCommands(commandText)) {
            this.setState({ commandText })
        } else {
            this.setState({ commandText: [] })
        }
    }

    handleInput(event: KeyboardEvent) {
        if (event.key === "Escape") {
            this.setState({ mode: Mode.Command, commandText: [] })
        }
        else if (this.state.mode === Mode.Command) {
            this.processCommandModeInput(event)
        } else {
            this.processInsertModeInput(event)
        }
        event.preventDefault()
    }

    render() {
        let numberOfLines = this.getNumberOfLines()
        let board: string[] = []
        let text = this.state.text
        if (text.length > 0) {
            text.split('\n').map((e) => board.push(e))
        }

        for (let i = board.length; i < numberOfLines; i++) {
            board.push('~')
        }

        let renderBoard = board.map((e, i) => {
            if (i === this.state.currentLine) {
                return <p key={i}>{e.substr(0, this.state.currentCol)}<Carret />{e.substr(this.state.currentCol + 1, e.length)}</p>
            } else {
                return <p key={i}>{e}</p>
            }

        })

        return <div className="vim">
            <pre>{renderBoard}</pre>
            <Footer mode={this.state.mode} fileName={this.state.file && this.state.file.name ? this.state.file.name : ''} commandText={this.state.commandText} />
        </div>
    }
}