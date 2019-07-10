import React, { Component } from 'react'
import './style/Vim.css'
import Carret from '../Terminal/Carret';
import Footer from './Footer'
import { Arguments, head } from '../Terminal/Terminal';
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
interface KeyMethodInput {
    text: string
    currentCol: number
    currentLine: number
}

export const isValid = (keycode: number) => (keycode > 47 && keycode < 58) || // number keys
    keycode === 32 || keycode === 13 || // spacebar & return key(s) (if you want to allow carriage returns)
    (keycode > 64 && keycode < 91) || // letter keys
    (keycode > 95 && keycode < 112) || // numpad keys
    (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
    (keycode > 218 && keycode < 227)

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
        this.deleteWord = this.deleteWord.bind(this)

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

    
    join = (arr: any) => arr.length ? arr.join('\n') : ""
    replaceAt = (index: number, value: any, array: any) => {
        const rep = array.slice(0)
        rep[index] = value;
        return rep
    }
    trace = (label: string) => (value: any) => {
        console.log(`${label}: ${value}`)
        return value
    }

    getNumberOfLines = () => Math.abs(window.innerHeight / 16) + 2
    getLineFrom = (from: number) => (dest: number) => (sentence: string) => sentence.slice(from, dest)
    getFromNUntilEnd = (n: number) => (sentence: string) => sentence.slice(n, sentence.length)
    splitText = (text: string) => text.split('\n')
    getCurrentLine = (text: string) => (currentLine: number) => this.splitText(text)[currentLine]
    parseIntModifier = (modifiers: string) => modifiers.length && !Number.isNaN(Number(modifiers)) ? Number(modifiers) : 1

    mapCursorToBounds = (currentCol: number) => (
        (cursorLine: string) => currentCol > cursorLine.length
            ? { text: cursorLine, currentCol: cursorLine.length - 1 }
            : { text: cursorLine, currentCol: currentCol }
    )

    insertTextAndJoin = curry((text: string, currentLine: number, newText: string) => {
        const replaceCurry = curry(this.replaceAt)
        return pipe(this.splitText,
            replaceCurry(currentLine, newText),
            this.join)(text)
    })

    joinTextFromState = curry((text: string, currentLine: number, newState: any) => (
        { ...newState, text: this.insertTextAndJoin(text, currentLine, newState.text) }
    ))

    handleMovementKeys(direction: CarretMovement) {
        let { currentCol, currentLine, text } = this.state
        const directions = {
            [CarretMovement.RIGHT]: ({ text, currentCol, currentLine }: KeyMethodInput) => (
                { currentCol: currentCol + 1 }
            ),
            [CarretMovement.LEFT]: ({ text, currentCol, currentLine }: KeyMethodInput) => (
                { currentCol: currentCol - 1 }
            ),
            [CarretMovement.DOWN]: ({ text, currentCol, currentLine }: KeyMethodInput) => (
                text.split('\n').length > currentLine
                    ? { currentLine: currentLine + 1 } : { currentLine }
            ),
            [CarretMovement.UP]: ({ text, currentCol, currentLine }: KeyMethodInput) => (
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
        const appendKeyToText = (currentLine: string) => (key: string) => (
            "".concat(
                getLineUntilCursor(currentLine),
                key,
                getLineUntilEnd(currentLine)
            ))
        return pipe(
            appendKeyToText(currentLine),
            this.insertTextAndJoin(text, this.state.currentLine)
        )(key)
    }

    processInsertModeInput(event: KeyboardEvent) {
        const keys = [
            {
                type: "key",
                value: "Enter",
                fn: ({ text, currentCol, currentLine }: KeyMethodInput) => ({
                    text: this.insertKey('\n'), currentCol: 0, currentLine: currentLine + 1
                })
            }, {
                type: "code",
                value: "Tab",
                fn: ({ text, currentCol, currentLine }: KeyMethodInput) => (
                    { text: text + '\t', currentCol: currentCol + this.tabSize }
                )
            }, {
                type: "code",
                value: "Backspace",
                fn: ({ text, currentCol, currentLine }: KeyMethodInput) => (
                    { text: text.slice(0, -1), currentCol: currentCol + 1 }
                )
            }, {
                type: "code",
                value: "ArrowRight",
                fn: ({ text, currentCol, currentLine }: KeyMethodInput) => (
                    { ...this.handleMovementKeys(CarretMovement.RIGHT) }
                )
            }, {
                type: "code",
                value: "ArrowLeft",
                fn: ({ text, currentCol, currentLine }: KeyMethodInput) => (
                    { ...this.handleMovementKeys(CarretMovement.LEFT) }
                )
            }, {
                type: "code",
                value: "ArrowDown",
                fn: ({ text, currentCol, currentLine }: KeyMethodInput) => (
                    { ...this.handleMovementKeys(CarretMovement.DOWN) }
                )
            }, {
                type: "code",
                value: "ArrowUp",
                fn: ({ text, currentCol, currentLine }: KeyMethodInput) => (
                    { ...this.handleMovementKeys(CarretMovement.UP) }
                )
            },
        ]
        const getEvent = (event: any) => keys.filter((e) => event[e.type] === e.value)
        const processEvents = curry((originalEvent: KeyboardEvent, { text, currentCol, currentLine }, events: any) => (
            events.length
                ? events.map((item: any) => item.fn({ text, currentCol, currentLine }))
                : isValid(originalEvent.keyCode)
                    ? [{ text: this.insertKey(event.key), currentCol: currentCol + 1 }]
                    : []
        ))
        return pipe(
            getEvent,
            processEvents(event, this.state),
            head
        )(event)
    }

    deleteChars = (modifiers: string) => (command: string) => {
        const { text, currentCol, currentLine } = this.state
        const delNChars = this.parseIntModifier(modifiers)

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
        const processCommand = (command: string) => (
            (cursorLine: string) => command === "x"
                ? getNewTextFwd(cursorLine) : getNewTextBck(cursorLine)
        )
        const applyCommandToText = processCommand(command)

        return pipe(
            getCurrentLineOfText,
            applyCommandToText,
            this.mapCursorToBounds(currentCol),
            this.joinTextFromState(text, currentLine)
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

        return this.insertTextAndJoin(text, currentLine, getNewText(cursorLine))
    }

    performCommands(commandText: string[]): boolean {
        let ommitKeys = ["Shift", "CapsLock", "Control", "Enter"]
        let modifiers = ""
        const { text, currentLine, currentCol } = this.state
        const getCurrentLineOfText = this.getCurrentLine(text)
        const cursorLine = getCurrentLineOfText(currentLine)

        const doReturn = () => {
            this.props.return()
            return {}
        }
        const doSave = () => {
            this.props.save({ file: this.state.file, data: this.state.text })
            return {}
        }
        const saveAndReturn = () => pipe(doSave, doReturn)()

        const removeFirstModifier = (modifier: string) => modifiers.slice(0, modifiers.length - 1)
        const deleteWord = (modifiers: string) => (modifiers.length && modifiers.charAt(modifiers.length - 1) === "d") ?
            pipe(removeFirstModifier, this.parseIntModifier, this.deleteWord)(modifiers)
            : modifiers

        const removeLine = () => {
            const getLineUntilCursor = this.getFromStart(currentCol)
            const insertTextAndJoinCurry = this.insertTextAndJoin(text, currentLine)
            return pipe(
                getLineUntilCursor as (str: string) => string,
                insertTextAndJoinCurry
            )(cursorLine)
        }

        const defaultBehaviour = (command: string) => !ommitKeys.includes(command) ? { modifiers: modifiers + command } : {}

        const commands: { [key: string]: any } = {
            "i": (modifiers: string) => ({ mode: Mode.Insert }),
            "h": (modifiers: string) => this.handleMovementKeys(CarretMovement.LEFT),
            "j": (modifiers: string) => this.handleMovementKeys(CarretMovement.DOWN),
            "k": (modifiers: string) => this.handleMovementKeys(CarretMovement.UP),
            "l": (modifiers: string) => this.handleMovementKeys(CarretMovement.RIGHT),
            "Enter": (modifiers: string) => (modifiers.length ?
                modifiers === "zz" ? saveAndReturn() :
                    modifiers === ":q!" ? doReturn() :
                        modifiers === ":w" ? doSave() :
                            {} : {}),
            "d": (modifiers: string) => ({ modifiers: modifiers + "d" }),
            "w": (modifiers: string) => ({ text: deleteWord(modifiers) }),
            "D": (modifiers: string) => ({ text: removeLine() }),
            "x": (modifiers: string) => this.deleteChars(modifiers)("x"),
            "X": (modifiers: string) => this.deleteChars(modifiers)("X"),
        }

        const newState = commandText.reduce((prevState: any, command: string) => {
            const newState = commands.hasOwnProperty(command) ?
                commands[command](modifiers)
                : defaultBehaviour(command)
            const { modifiers: newModifiers, ...rest } = newState
            modifiers = newModifiers
            return Object.assign({}, prevState, rest)
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


    render() {
        const createBoard = (n: number) => new Array(n).fill('~')
        const fillWithText = (text: string) => (board: string[]) => {
            const textSplited = text.split('\n')
            return board.map((e, i) => e = (i < textSplited.length) ? textSplited[i] : e)
        }
        const filleWithStateText = fillWithText(this.state.text)
        const newBoard = pipe(Math.round, createBoard, filleWithStateText)

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