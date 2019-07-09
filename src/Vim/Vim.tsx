import React, { Component } from 'react'
import './style/Vim.css'
import Carret from '../Terminal/Carret';
import Footer from './Footer'
import { Arguments } from '../Terminal/Terminal';
import { pipe } from 'ramda';
import curry from 'ramda/es/curry';

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
        this.performCommands = this.performCommands.bind(this)

        this.tabSize = 4

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

    componentDidMount() {
        window.addEventListener("keydown", this.handleInput)
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleInput, false)
    }

    getNumberOfLines() {
        return Math.abs(window.innerHeight / 16) + 2
    }

    handleMovementKeys(direction: CarretMovement) {
        let { currentCol, currentLine, text } = this.state
        const directions = {
            [CarretMovement.RIGHT]: ({ text = "", currentCol = 0, currentLine = 0 }) => (
                { currentCol: currentCol + 1 }
            ),
            [CarretMovement.LEFT]: ({ text = "", currentCol = 0, currentLine = 0 }) => (
                { currentCol: currentCol - 1 }
            ),
            [CarretMovement.DOWN]: ({ text = "", currentCol = 0, currentLine = 0 }) => (
                text.split('\n').length > currentLine
                    ? { currentLine: currentLine + 1 } : { currentLine }
            ),
            [CarretMovement.UP]: ({ text = "", currentCol = 0, currentLine = 0 }) => (
                currentLine > 0
                    ? { currentLine: currentLine - 1, currentCol: text.split("\n")[currentLine].length - 1 }
                    : currentLine
            ),
        }

        return directions[direction]
            ? directions[direction]({ text, currentCol, currentLine })
            : {}
    }

    insertKey(key: string) {
        const { text } = this.state
        const currentLine = this.getCurrentLine(text)(this.state.currentLine)
        const getLineUntilCursor = this.getFromStart(this.state.currentCol)
        const getLineUntilEnd = this.getFromNUntilEnd(this.state.currentCol)
        const concatWithKey = (currentLine: string) => (key: string) => (
            "".concat(
                getLineUntilCursor(currentLine),
                key,
                getLineUntilEnd(currentLine)
            ))
        return pipe(
            concatWithKey(currentLine),
            this.insertTextAndJoin(text)(this.state.currentLine)
        )(key)
    }

    head = (arr: any) => arr.length ? arr[0] : null
    tail = (arr: any) => arr.length ? arr[arr.length - 1] : this.head(arr)

    processInsertModeInput(event: KeyboardEvent) {
        const isValid = (keycode: number) => (keycode > 47 && keycode < 58) || // number keys
            keycode === 32 || keycode === 13 || // spacebar & return key(s) (if you want to allow carriage returns)
            (keycode > 64 && keycode < 91) || // letter keys
            (keycode > 95 && keycode < 112) || // numpad keys
            (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
            (keycode > 218 && keycode < 227)
        const keys = [
            {
                type: "key",
                value: "Enter",
                fn: ({ text = "", currentCol = 0, currentLine = 0 }) => ({
                    text: this.insertKey('\n'),
                    currentCol: 0,
                    currentLine: currentLine + 1
                })
            }, {
                type: "code",
                value: "Tab",
                fn: ({ text = "", currentCol = 0, currentLine = 0 }) => (
                    {
                        text: text + '\t',
                        currentCol: currentCol + this.tabSize
                    }
                )
            }, {
                type: "code",
                value: "Backspace",
                fn: ({ text = "", currentCol = 0, currentLine = 0 }) => (
                    {
                        text: text.slice(0, -1),
                        currentCol: currentCol + 1
                    }
                )
            }, {
                type: "code",
                value: "ArrowRight",
                fn: ({ text = "", currentCol = 0, currentLine = 0 }) => (
                    { ...this.handleMovementKeys(CarretMovement.RIGHT) }
                )
            }, {
                type: "code",
                value: "ArrowLeft",
                fn: ({ text = "", currentCol = 0, currentLine = 0 }) => (
                    { ...this.handleMovementKeys(CarretMovement.LEFT) }
                )
            }, {
                type: "code",
                value: "ArrowDown",
                fn: ({ text = "", currentCol = 0, currentLine = 0 }) => (
                    { ...this.handleMovementKeys(CarretMovement.DOWN) }
                )
            }, {
                type: "code",
                value: "ArrowUp",
                fn: ({ text = "", currentCol = 0, currentLine = 0 }) => (
                    { ...this.handleMovementKeys(CarretMovement.UP) }
                )
            },
        ]
        const getEvent = (event: any) => keys.filter((e) => event[e.type] === e.value)
        const processEvents = curry((originalEvent: any, text: string, currentCol: number, currentLine: number, events: any) => (
            events.length
                ? events.map((item: any) => item.fn({ text, currentCol, currentLine }))
                : isValid(originalEvent.keyCode)
                    ? [{ text: this.insertKey(event.key), currentCol: currentCol + 1 }]
                    : []
        ))
        return pipe(
            getEvent,
            processEvents(event, this.state.text, this.state.currentCol, this.state.currentLine),
            this.head
        )(event)
    }

    getLineFrom = (from: number) => (dest: number) => (sentence: string) => sentence.slice(from, dest)
    getFromNUntilEnd = (n: number) => (sentence: string) => sentence.slice(n, sentence.length)
    splitText = (text: string) => text.split('\n')
    getCurrentLine = (text: string) => (
        (currentLine: number) => this.splitText(text)[currentLine]
    )
    replaceAt(index: number, value: any, array: any) {
        const ret = array.slice(0);
        ret[index] = value;
        return ret;
    }
    join = (arr: any) => arr.join('\n')
    
    insertTextAndJoin = (text: string) => (
        (currentLine: number) => (newText: string) => {
            const replaceCurry = curry(this.replaceAt)
            return pipe(this.splitText,
                replaceCurry(currentLine, newText),
                this.join)(text)
        }
    )

    deleteChars = (modifiers: string) => (command: string) => {
        const getModifier = (modifiers: any) => (modifiers.length)
            ? !Number.isNaN(Number(modifiers))
                ? Number(modifiers) : 1 : 1
        const delNChars = getModifier(modifiers)
        const { text, currentCol, currentLine } = this.state

        const getCurrentLineOfText = this.getCurrentLine(text)
        const getLineUntilCursor = this.getFromStart(currentCol)
        const getLineUntilEnd = this.getFromNUntilEnd(currentCol)

        const getNewTextFwd = (str: string) => (
            getLineUntilCursor(str) +
            this.getFromNUntilEnd(currentCol + delNChars)(str)
        )
        const getNewTextBck = (str: string) => (
            this.getFromStart(currentCol - delNChars)(str) +
            getLineUntilEnd(str)
        )
        const mapCursor = (currentCol: number) => (
            (cursorLine: string) => currentCol > cursorLine.length
                ? { text: cursorLine, currentCol: cursorLine.length - 1 }
                : { text: cursorLine, currentCol: currentCol }
        )
        const processCommand = (command: string) => (
            (cursorLine: string) => command === "x"
                ? getNewTextFwd(cursorLine) : getNewTextBck(cursorLine)
        )
        const process = processCommand(command)
        const joinTextFromState = curry((text: string, currentLine: number, newState: any) => {
            return { ...newState, text: this.insertTextAndJoin(text)(currentLine)(newState.text) }
        })

        return pipe(
            getCurrentLineOfText,
            process,
            mapCursor(currentCol),
            joinTextFromState(text, currentLine)
        )(currentLine)
    }
    deleteWord(modifiers: number) {
        const { currentLine, text, currentCol } = this.state

        const getCurrentLineOfText = this.getCurrentLine(text)
        const cursorLine = getCurrentLineOfText(currentLine)

        const getLineUntilCursor = this.getFromStart(currentCol)
        const getLineUntilEnd = this.getFromNUntilEnd(currentCol)

        const shiftAndJoin = (modifiers: number) =>
            (words: string) => words.split(" ").slice(modifiers, words.length).join(" ")
        const shiftAndJoinModifiers = shiftAndJoin(modifiers)

        const getLastPart = pipe(getLineUntilEnd, shiftAndJoinModifiers)
        const getNewText = (str: string) => (getLineUntilCursor(str) + getLastPart(str))

        return this.insertTextAndJoin(text)(currentLine)(getNewText(cursorLine))
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
                        newState = { text: this.deleteWord(deleteModifier) }
                    }
                    break
                case "D":
                    const getLineUntilCursor = this.getFromStart(currentCol)
                    const insertTextAndJoinCurry = this.insertTextAndJoin(text)(currentLine)
                    const getNewText = pipe(
                        getLineUntilCursor as (str: string) => string,
                        insertTextAndJoinCurry
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
            return Object.assign({}, prevState, newState)
        }, {})

        return { ...newState, commandText: commandText }
    }

    processCommandModeInput(event: KeyboardEvent) {
        const commands: { [key: string]: any } = {
            "ArrowUp": (commandText: string[]) => commandText.concat('k'),
            "ArrowDown": (commandText: string[]) => commandText.concat('k'),
            "ArrowLeft": (commandText: string[]) => commandText.concat('h'),
            "ArrowRight": (commandText: string[]) => commandText.concat('l'),
            "ShiftLeft": (commandText: string[]) => commandText,
            "ShiftRight": (commandText: string[]) => commandText,
        }
        const addEventKeyword = (event: KeyboardEvent) => (
            (commandText: string[]) => commands[event.code]
                ? commands[event.code](commandText)
                : commandText.concat(event.key)
        )
        const removeCommandIfExecuted = (newState: any) => (
            Object.keys(newState).length > 1 ? Object.assign({}, newState, { commandText: [] }) : newState
        )
        return pipe(addEventKeyword(event),
            this.performCommands,
            removeCommandIfExecuted
        )(this.state.commandText)
    }

    handleInput(event: KeyboardEvent) {
        const newState = event.key === "Escape"
            ? { mode: Mode.Command, commandText: [] }
            : this.state.mode === Mode.Command
                ? this.processCommandModeInput(event)
                : this.processInsertModeInput(event)

        event.preventDefault()
        this.setState(newState)
    }

    trace = (label: string) => (x: any) => {
        console.log(label, x)
        return x
    }

    render() {
        const createBoard = (n: number) => new Array(n).fill('~')
        const fillWithText = (text: string) => (board: string[]) => {
            const textSplited = text.split('\n')
            return board.map((e, i) => e = (i < textSplited.length) ? textSplited[i] : e)
        }
        const filled = fillWithText(this.state.text)
        const newBoard = pipe(Math.round, createBoard, filled)

        let renderBoard = newBoard(this.getNumberOfLines()).map((e, i) => (
            (i === this.state.currentLine)
                ? <p key={i}>{e.substr(0, this.state.currentCol)}<Carret />{e.substr(this.state.currentCol + 1, e.length)}</p>
                : <p key={i}>{e}</p>
        ))

        return <div className="vim">
            <pre>{renderBoard}</pre>
            <Footer mode={this.state.mode} fileName={this.state.file && this.state.file.name ? this.state.file.name : ''} commandText={this.state.commandText} />
        </div>
    }
}