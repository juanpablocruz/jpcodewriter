import React, { Component } from 'react'
import './style/Vim.css'
import Carret from '../Terminal/Carret';
import Footer from './Footer'
import { text } from 'figlet';
import { Arguments } from '../Terminal/Terminal';

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
        
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.handleInput, false)
    }

    getNumberOfLines() {
        return Math.abs(window.innerHeight / 16)
    }

    handleMovementKeys(direction: CarretMovement) {
        if (direction === CarretMovement.RIGHT) {
            this.setState({ currentCol: this.state.currentCol + 1 })
        } else if (direction === CarretMovement.LEFT) {
            this.setState({ currentCol: this.state.currentCol - 1 })
        } else if (direction === CarretMovement.DOWN) {
            let currentLine = this.state.currentLine
            let textLines = this.state.text.split('\n').length - 1
            if (currentLine < textLines) {
                currentLine++
                this.setState({ currentLine })
            }
        } else if (direction === CarretMovement.UP) {
            let currentLine = this.state.currentLine
            if (currentLine > 0) {
                currentLine--
                let currentCol = this.state.text.split("\n")[currentLine].length - 1
                this.setState({ currentLine: currentLine, currentCol: currentCol })
            }
        }
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
            keycode == 32 || keycode == 13 || // spacebar & return key(s) (if you want to allow carriage returns)
            (keycode > 64 && keycode < 91) || // letter keys
            (keycode > 95 && keycode < 112) || // numpad keys
            (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
            (keycode > 218 && keycode < 227);   // [\]' (in order)
        let text = this.state.text
        if (event.key === "Enter") {
            let newText = this.insertKey('\n')
            this.setState({ text: newText, currentLine: this.state.currentLine + 1, currentCol: 0 })
        } else if (event.code === "Tab") {
            this.setState({ text: text + '\t', currentCol: this.state.currentCol + this.tabSize })
        } else if (event.code === "Backspace") {
            text = text.slice(0, -1)
            this.setState({ text: text, currentCol: this.state.currentCol + 1 })
        } else if (event.code === "ArrowRight") {
            this.handleMovementKeys(CarretMovement.RIGHT)
        } else if (event.code === "ArrowLeft") {
            this.handleMovementKeys(CarretMovement.LEFT)
        } else if (event.code === "ArrowDown") {
            this.handleMovementKeys(CarretMovement.DOWN)
        } else if (event.code === "ArrowUp") {
            this.handleMovementKeys(CarretMovement.UP)
        }
        else if (valid) {
            let newText = this.insertKey(event.key)
            this.setState({ text: newText, currentCol: this.state.currentCol + 1 })
        } else {
            console.log(event)
        }
    }

    deleteChars(command: string, modifiers: string) {
        let delNChars = 1
        if (modifiers.length) {
            if (!Number.isNaN(Number(modifiers))) {
                delNChars = Number(modifiers)
            }
        }
        let splittedText = this.state.text.split('\n')
        let currentLine = splittedText[this.state.currentLine]
        let newCol = this.state.currentCol
        if (command === "x") {
            splittedText[this.state.currentLine] = currentLine.substr(0, this.state.currentCol) + currentLine.substr(this.state.currentCol + delNChars, currentLine.length)
        } else if (command === "X") {
            splittedText[this.state.currentLine] = currentLine.substr(0, this.state.currentCol - delNChars) + currentLine.substr(this.state.currentCol, currentLine.length)
            if (this.state.currentCol > splittedText[this.state.currentLine].length - 1) {
                newCol = splittedText[this.state.currentLine].length - 1
            }
        }
        let newText = splittedText.join('\n')
        this.setState({ text: newText, currentCol: newCol })
    }

    deleteWord(modifiers: number) {
        let splittedText = this.state.text.split('\n')
        let currentLine = splittedText[this.state.currentLine]

        let newText = currentLine.slice(0, this.state.currentCol)
        let trimmedText = currentLine.slice(this.state.currentCol, currentLine.length)
        let words = trimmedText.split(" ")
        for (let i = 0; i < modifiers; i++) {
            words.shift()
        }
        newText += words.join(" ")
        splittedText[this.state.currentLine] = newText

        this.setState({ text: splittedText.join('\n') })
    }

    performCommands(commandText: string[]): boolean {
        let commandPerformed = false
        let ommitKeys = ["Shift", "CapsLock", "Control", "Enter"]
        let modifiers = ""
        for (let i = 0; i < commandText.length; i++) {
            switch (commandText[i]) {
                case "i":
                    commandPerformed = true
                    this.setState({ mode: Mode.Insert })
                    break;
                case "h": // left
                    commandPerformed = true
                    this.handleMovementKeys(CarretMovement.LEFT)
                    break
                case "j": // down
                    commandPerformed = true
                    this.handleMovementKeys(CarretMovement.DOWN)
                    break
                case "k": // up
                    commandPerformed = true
                    this.handleMovementKeys(CarretMovement.UP)
                    break
                case "l": // right
                    commandPerformed = true
                    this.handleMovementKeys(CarretMovement.RIGHT)
                    break
                case "Enter": // save and quit
                    if (modifiers.length) {
                        if (modifiers === "zz") {
                            this.props.save({file: this.state.file, data: this.state.text})
                            this.props.return()
                        } else if (modifiers === ":q!") {
                            this.props.return()
                        } else if (modifiers === ":w") {
                            this.props.save({file: this.state.file, data: this.state.text})
                        }
                    }
                    break;
                case "d":
                    if (modifiers.length) {
                        modifiers += commandText[i]
                    } else {
                        modifiers += commandText[i]
                    }
                    break
                case "w":
                    if (modifiers.length && modifiers.charAt(modifiers.length - 1) === "d") {
                        commandPerformed = true
                        let newModifiers = modifiers.slice(0, modifiers.length - 1)
                        let deleteModifier = 1
                        if (newModifiers.length) {
                            if (!Number.isNaN(Number(newModifiers))) {
                                deleteModifier = Number(newModifiers)
                            }
                        }
                        this.deleteWord(deleteModifier)
                    } else {

                    }
                    break
                case "D":
                    commandPerformed = true
                    let splittedText = this.state.text.split('\n')
                    let currentLine = splittedText[this.state.currentLine]

                    splittedText[this.state.currentLine] = currentLine.substr(0, this.state.currentCol)

                    let newText = splittedText.join('\n')
                    this.setState({ text: newText })
                    break
                case "x":
                case "X":
                    commandPerformed = true
                    this.deleteChars(commandText[i], modifiers)
                    break
                default:
                    if (!ommitKeys.includes(commandText[i]))
                        modifiers += commandText[i]
                    break
            }
        }

        return commandPerformed
    }

    processCommandModeInput(event: KeyboardEvent) {
        let commandText = this.state.commandText
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
            text.split('\n').map((e) => {
                board.push(e)
            })
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
            <Footer mode={this.state.mode} fileName={this.state.file.name} commandText={this.state.commandText} />
        </div>
    }
}