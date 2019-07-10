import React, { Component } from 'react'
import Screen from './Screen'
import Boot from './Boot';
import Filesystem, { Folder } from './FileSystem/Filesystem';
import Vim from '../Vim/Vim';
import "./style/Terminal.css"
import Skills from '../Skills/Skills';
import { Expression } from './Math';
import { pipe, curry, lensProp, view } from 'ramda'
import { Message } from './TextHistoric';
import { IO, Maybe } from 'ramda-fantasy'

interface Command {
    command: any,
    description: string,
    man?: string
}

type Commands = { [key: string]: Command }

export interface ColorOffset {
    width: number
    height: number
}
export interface ColorShadow {
    color: string,
    offset: ColorOffset,
    radius: number
}

export interface Color {
    name: string,
    color: string,
    shadow: ColorShadow
}

interface Props {
    color?: Color,
    backgroundColor?: string,
    style?: object,
    commands?: Commands,
    startState?: string,
    msg?: string
}

export interface Arguments {
    file: any
    data: any
}


interface State {
    color: Color,
    backgroundColor: string,
    style: object,
    commands: Commands,
    isMaximized: boolean,
    screenText: Message[],
    commandHistory: string[],
    initializing: boolean,
    fileSystem: Filesystem,
    programMode: boolean,
    programArgs: Arguments[]
    program: any
    historyPointer: number
}


export const Ambar: Color = { name: "amber", color: "#FFB000", shadow: { color: "rgba(255,176,0, 0.8)", offset: { width: 0, height: 0 }, radius: 2 } }
export const Pink: Color = { name: "pink", color: "#FF1493", shadow: { color: "rgba(255, 20, 147, 0.8)", offset: { width: 0, height: 0 }, radius: 2 } }
export const AppleGreen: Color = { name: "appleGreen", color: "#33FF33", shadow: { color: "rgba(51,255,51, 0.8)", offset: { width: 0, height: 0 }, radius: 2 } }

export const appendOutput = (buffer: any) => (output: any) => {
    return output.reduce((prev: any, el: any) =>
        prev.concat({ msg: el, type: "output" }), buffer)
}
export const liftToArray = (x: any) => [x]
export const omitInput = (x: any) => ""
export const head = (arr: any) => arr.length ? (arr[0]) : null
export const tail = (arr: any) => arr.length ? arr[arr.length - 1] : head(arr)
export const trace = (label: string) => (inpt: any) => { console.log(`${label}: ${inpt}`); return inpt }

export const getCommandParts = (text: string) => text.split(" ")
export const getCommandFromArgs = (text: string) => head(getCommandParts(text))
export const getRestArgs = (text: string) => getCommandParts(text).slice(1)
export const newState = (newState: any) => (state: any, props: any) => ({ newState })

const getFolderContents = curry((fileSystem: Filesystem, args: any, folder: any) => (
    fileSystem.getFolderContents(head(args)).map((el: Folder) => el.name)
))

class Terminal extends Component<Props, State> {

    scrolldelay: any
    static defaultProps: Props = {
        color: Ambar,
        backgroundColor: 'black',
        startState: 'maximized',
        style: {},
        commands: {},
        msg: "",
    }

    constructor(props: any) {
        super(props)

        const { color, backgroundColor, style, commands, startState, msg } = props

        this.help = this.help.bind(this)
        this.clear = this.clear.bind(this)
        this.onInput = this.onInput.bind(this)
        this.print = this.print.bind(this)
        this.calc = this.calc.bind(this)
        this.fallBackCommand = this.fallBackCommand.bind(this)
        this.getPrevCommand = this.getPrevCommand.bind(this)
        this.finnishBoot = this.finnishBoot.bind(this)
        this.pageScroll = this.pageScroll.bind(this)

        this.scrolldelay = null

        const defaultCommands: { [key: string]: Command } = {
            help: { command: this.help, description: "shows help text. Help <command> will display usage information about <command>" },
            clear: { command: this.clear, description: "clears the screen" },
            ls: { command: this.ls, description: "displays folder information" },
            cd: { command: this.cd, description: "change folder" },
            mkdir: { command: this.mkdir, description: "create folder" },
            touch: { command: this.touch, description: "create file" },
            vi: { command: this.vi, description: "file editor vi" },
            rm: { command: this.rm, description: "removes file" },
            cat: { command: this.cat, description: "reads a file" },
            calc: { command: this.calc, description: "evaluate mathematical expresion" },
            skills: { command: this.skills, description: "show the skills" },
            greenmode: { command: this.greenmode, description: "Change terminal color to green" },
            ambarmode: { command: this.ambarmode, description: "Change terminal color to ambar" },
            pinkmode: { command: this.pinkmode, description: "Change terminal color to pink" },
        }

        this.state = {
            color: color,
            backgroundColor: backgroundColor,
            isMaximized: startState === 'maximized',
            style: style,
            commands: { ...commands, ...defaultCommands },
            screenText: [{ msg: msg }],
            commandHistory: [],
            initializing: true,
            fileSystem: new Filesystem(),
            programMode: false,
            programArgs: [],
            program: null,
            historyPointer: 0
        }
    }

    greenmode = (args: string[], screenText: string) => {
        this.setState((state, props) => ({ color: AppleGreen }))
        return screenText
    }
    ambarmode = (args: string[], screenText: string) => {
        this.setState((state, props) => ({ color: Ambar }))
        return screenText
    }
    pinkmode = (args: string[], screenText: string) => {
        this.setState((state, props) => ({ color: Pink }))
        return screenText
    }

    clear = (args: string[], screenText: string) => {
        this.setState((state, props) => ({ screenText: [] }))
        return screenText
    }

    cat = (args: string[], screenText: string) => {
        const getContents = (fileSystem: Filesystem) => (file: string) => fileSystem.getFileContents(file)
        const getContentsFromFs = getContents(this.state.fileSystem)
        return args.length ?
            pipe(head,
                getContentsFromFs,
                liftToArray,
                appendOutput(screenText)
            )(args)
            : screenText
    }

    help = (args: string[], screenText: string) => {
        if (!args.length) {
            const getCommands = (commands: any) => Object.entries(commands)
            const filterHasDesc = (commands: any) => commands.filter((c: any) => c[1].description.length)
            const formatHelpText = (commands: any) => commands.map((e: any) => `${e[0]}:\t${e[1].description}`)
            return pipe(
                getCommands,
                filterHasDesc,
                formatHelpText,
                appendOutput(screenText))(this.state.commands)
        } else {
            const commandHasMan = (commandList: any) =>
                (command: any) => (
                    commandList.hasOwnProperty(command)
                        && commandList[command].hasOwnProperty("man")
                        ? commandList[command].man
                        : `${command} has no man page`
                )
            return pipe(head,
                commandHasMan(this.state.commands),
                liftToArray,
                appendOutput(screenText))(args)
        }
    }

    ls = (args: string[], screenText: string) => {
        const getCurrentFolderContents = (fileSystem: Filesystem) =>
            () => (
                fileSystem.getCurrentFolderContents().map(
                    (el: Folder) => el.name
                )
            )
        const currentFSFolder = getCurrentFolderContents(this.state.fileSystem)
        const getFolderContentsFs = getFolderContents(this.state.fileSystem, args)
        const doLs = (data: any) =>
            data.length
                ? getFolderContentsFs(data)
                : currentFSFolder()

        return pipe(doLs, appendOutput(screenText))(args)
    }

    cd = (args: string[], screenText: string) => {
        const doCd = (folder: any) => (
            folder.length ? this.state.fileSystem.changeToFolder(folder)
                : ""
        )
        return pipe(head, doCd,
            omitInput,
            liftToArray,
            appendOutput(screenText))(args)
    }

    mkdir = (args: string[], screenText: string) => {
        const doCreate = (folder: any) => { this.state.fileSystem.createFolder(folder); return "" }
        const doMkdir = (args: any) => args.length ? doCreate(head(args)) : ""
        return pipe(doMkdir, liftToArray, appendOutput(screenText))(args)
    }

    touch = (args: string[], screenText: string) => {
        const doCreate = (file: any): IO<any> => this.state.fileSystem.createFile({ fileName: file })
        const doTouch = (args: any) => args.length ? doCreate(head(args)) : IO(() => "")
        return doTouch(args).map(liftToArray).map(appendOutput(screenText)).runIO()
    }

    rm = (args: string[], screenText: string) => {
        const doRemove = (elem: any) => this.state.fileSystem.removeElement(elem)
        const doRm = (args: any) => args.length ? doRemove(head(args)) : IO(() => "")
        return doRm(args).map(liftToArray).map(appendOutput(screenText)).runIO()
    }

    vi = (args: string[], screenText: string) => {
        const { fileSystem } = this.state

        const curriedSave = curry((fileSystem: Filesystem, data: Arguments) => {
            return data.file.id > 0
                ? fileSystem.saveFileContents({ id: data.file.id, contents: data.data }).runIO()
                : fileSystem.createFile({ fileName: data.file.name, contents: data.data }).runIO()
        })
        const save = curriedSave(fileSystem)
        const returnFn = () => this.setState({ programMode: false })
        const initVim = (save: any, returnFn: any) => (args: Arguments[]) =>
            <Vim return={returnFn}
                save={save}
                input={args} />

        const fetchFileContents = (file: any) => {
            const contents: any = fileSystem.getFolderFromString(file)
            return liftToArray(contents).map((file: any) => ({
                file: {
                    name: file.name,
                    id: file.id,
                }, data: file.details
            }))
        }
        const programArgs: Arguments[] = args.length
            ? fileSystem.getCurrentFolderContents().find((e: Folder) => e.name === args[0])
                ? fetchFileContents(args[0]) : [{
                    file: {
                        name: args[0],
                        id: -1,
                    }, data: ""
                }]
            : []

        return pipe(
            initVim(save, returnFn),
            this.bootProgram(programArgs),
            trace("after boot"),
            liftToArray,
            appendOutput(screenText))(programArgs)
    }

    bootProgram = (programArgs: Arguments[]) => (program: any) => {
        this.setState(() => ({ programMode: true, programArgs, program }))
        return ""
    }

    skills = (args: string[], screenText: string) => {
        const returnFn = () => { this.setState({ programMode: false, program: null }) }
        const initializeProgram = (color: Color) => (returnFn: any) => <Skills
            return={returnFn}
            color={color}
        />
        const initSkills = initializeProgram(this.state.color)
        return pipe(
            initSkills,
            this.bootProgram([]),
            liftToArray,
            appendOutput(screenText)
        )(returnFn)
    }

    calc = (args: string[], screenText: string) => {
        let expresion = new Expression(args.join(''))
        try {
            let result = (expresion.resolve())
            if (result) {
                return appendOutput(screenText)(result)
            }
        } catch (err) { console.log(err) }
        return appendOutput(screenText)("")
    }

    pageScroll = () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            clearTimeout(this.scrolldelay)
        } else {
            window.scrollBy(0, 2)
            this.scrolldelay = setTimeout(this.pageScroll, 0.05)
        }
    }

    print = (...args: any) => {
        this.setState(() => ({ screenText: head(args) }), () => { this.pageScroll() })
    }

    fallBackCommand(command: string, screenText: any) {
        const generateErrorCommand = (command: string) => `Unrecognized command '${command}'`
        return pipe(generateErrorCommand,
            liftToArray,
            appendOutput(screenText)
        )(command)
    }

    getCurrentFolderPath = () => this.state.fileSystem.getCurrentFolder().fullPath

    appendToCommandHistory = ({ command = "", output = [] }) => {
        return {
            commandHistory: (command.length && tail(this.state.commandHistory) === command
                ? this.state.commandHistory
                : this.state.commandHistory.concat(command)),
            output
        }
    }

    onInput = async (text: string) => {
        const { commands: stateCommands,
            screenText: stateScreenText
        } = this.state

        const executeCommand = (commandList: any, args: any, screenText: any) =>
            async (command: string) => {
                const output = commandList.hasOwnProperty(command)
                    ? await commandList[command].command(args, screenText)
                    : this.fallBackCommand(command, screenText)
                return { command: [command].concat(args).join(" "), output }
            }

        const screenText = stateScreenText.concat({
            msg: text,
            path: this.getCurrentFolderPath()
        })
        const execCommandCurried = await executeCommand(stateCommands,
            getRestArgs(text),
            screenText
        )
        const printOutput = ({ output, commandHistory }:
            { output: string[], commandHistory: any }) => {
            this.print(output)
            return { commandHistory }
        }

        const prepareNewState = (history: string[]) => ({ commandHistory: history, historyPointer: 0 })
        const lens = lensProp("commandHistory")
        const over = curry((lens: any, store: any) => view(lens, store))
        const setState = (text: any) => this.setState(() => { return text })

        const output = await pipe(
            getCommandFromArgs,
            execCommandCurried
        )(text)
        pipe(
            this.appendToCommandHistory,
            printOutput,
            over(lens),
            prepareNewState,
            setState
        )(output)
    }

    getPointedCommand = (history: string[]) => (pointer: number) => (
        pointer === 0 ? "" : history[history.length - pointer]
    )
    getPrevCommand(direction: number) {
        const inc = (history: string[]) => (
            (historyPointer: number) => (
                historyPointer < history.length ? historyPointer + 1 : historyPointer
            )
        )
        const dec = (history: string[]) => (
            (historyPointer: number) => (
                historyPointer > 0 ? historyPointer - 1 : historyPointer
            )
        )
        const incHistory = inc(this.state.commandHistory)
        const decHistory = dec(this.state.commandHistory)
        const getCommandFromHistory = this.getPointedCommand(this.state.commandHistory)

        const historyPointer = direction > 0
            ? incHistory(this.state.historyPointer)
            : decHistory(this.state.historyPointer)
        const command = getCommandFromHistory(historyPointer)

        this.setState((state, props) => ({ historyPointer }))
        return command
    }

    finnishBoot() {
        this.setState(() => ({ initializing: false }))
    }

    render() {
        let computedStyle = {
            ...this.state.style,
            ...{
                backgroundColor: this.state.backgroundColor,
                color: this.state.color.color,
                textShadowColor: this.state.color.shadow.color,
                textShadowOffset: this.state.color.shadow.offset,
                textShadowRadius: this.state.color.shadow.radius,
                display: "block",
                fontFamily: "'PRNumber3','AndaleMono', monospace",
            }
        }

        if (this.state.isMaximized) {
            computedStyle = { ...computedStyle, ...{ width: '100%', height: '100%' } }
        }

        return <div style={computedStyle}>
            <div className={`overlay ${this.state.color.name}`} />
            {this.state.programMode ?
                this.state.program
                : <React.Fragment>
                    <Boot finishBoot={this.finnishBoot} alreadyInitialized={!this.state.initializing} />
                    {
                        !this.state.initializing
                            ? <Screen onInput={this.onInput}
                                currentPath={this.getCurrentFolderPath()}
                                output={this.state.screenText}
                                getPrevCommand={this.getPrevCommand}
                                color={this.state.color}
                            />
                            : null
                    }
                </React.Fragment>
            }

        </div>
    }
}

export default Terminal