import React, { Component } from 'react'
import Screen from './Screen'
import Boot from './Boot';
import Filesystem, { Folder } from './FileSystem/Filesystem';
import Vim from '../Vim/Vim';
import "./style/Terminal.css"
import Skills from '../Skills/Skills';
import { Expression } from './Math';
import * as R from 'ramda'
import pipe from 'ramda/es/pipe';

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
    screenText: object[],
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

    greenmode = (args: string[], print: any) => {
        print()
        this.setState({ color: AppleGreen })
    }
    ambarmode = (args: string[], print: any) => {
        print()
        this.setState({ color: Ambar })
    }
    pinkmode = (args: string[], print: any) => {
        print()
        this.setState({ color: Pink })
    }

    clear = (args: string[], print: any) => {
        print()
        this.setState({ screenText: [] })
    }

    cat = async (args: string[], print: any) => {
        const {pipe} = R 
        const getContents = (fileSystem:Filesystem) => (file:string) => fileSystem.getFileContents(file)
        const getDetails = (contents:any) => contents.map((c: any) => c.details)
        const getContentsFromFs = getContents(this.state.fileSystem)
        const exec = pipe(this.head, getContentsFromFs)
        args.length ? print(...getDetails(await exec(args))) : print()    
    }

    help = (args: string[], print: any) => {
        const { pipe } = R
        if (!args.length) {
            const getEntries = (commands: any) => Object.entries(commands)
            const getWithDescription = (commands: any) => commands.filter((c: any) => c[1].description.length)
            const getHelpText = (commands: any) => commands.map((e: any) => `${e[0]}:\t${e[1].description}`)
            const getText = pipe(getEntries, getWithDescription, getHelpText)
            print(...getText(this.state.commands))
        } else {
            const hasCommand = (commandList: any, command: any) => commandList.hasOwnProperty(command)
            const hasMan = (commandList: any) => (command: any) => hasCommand(commandList, command)
                ? commandList[command].hasOwnProperty("man")
                    ? commandList[command].man : `${command} has no man page`
                : ""
            const hasManWithList = hasMan(this.state.commands)
            const exec = pipe(this.head, hasManWithList, print)
            exec(args)
        }
    }

    ls = async (args: string[], print: any) => {
        const getCurrentFolderContents = (fileSystem: any) => () => {
            return fileSystem.getCurrentFolderContents().map((el: Folder) => el.name)
        }
        const { curry } = R
        const getFolderContents = curry(async (fileSystem: any, folder: any) => {
            const data: any = await fileSystem.getFolderContents(
                args[0]
            )
            return data.map((el: Folder) => el.name)
        })

        const currentFSFolder = getCurrentFolderContents(this.state.fileSystem)
        const getFolderContentsFs = getFolderContents(this.state.fileSystem)

        const doLs = async (args: any) => !args.length ? currentFSFolder() : await getFolderContentsFs(args)
        print(...await doLs(args))
    }

    cd = (args: string[], print: any) => {
        const { pipe } = R
        const doChange = (folder: any) => { this.state.fileSystem.changeToFolder(folder); return "" }
        const doCd = (args: any) => args.length ? doChange(this.head(args)) : ""
        const exec = pipe(doCd, this.trace("after cd"), print)
        exec(args)
    }

    mkdir = (args: string[], print: any) => {
        const { pipe } = R
        const doCreate = (folder: any) => { this.state.fileSystem.createFolder(folder); return "" }
        const doMkdir = (args: any) => args.length ? doCreate(this.head(args)) : ""
        const exec = pipe(doMkdir, print)
        exec(args)
    }

    touch = (args: string[], print: any) => {
        const { pipe } = R
        const doCreate = (file: any) => { this.state.fileSystem.createFile(file); return "" }
        const doTouch = (args: any) => args.length ? doCreate(this.head(args)) : ""
        const exec = pipe(doTouch, print)
        exec(args)
    }

    rm = (args: string[], print: any) => {
        const { pipe } = R
        const doRemove = (elem: any) => { this.state.fileSystem.removeElement(elem); return "" }
        const doRm = (args: any) => args.length ? doRemove(this.head(args)) : ""
        const exec = pipe(doRm, print)
        exec(args)
    }

    vi = async (args: string[], print: any) => {
        const { fileSystem } = this.state
        const { curry } = R

        const curriedSave = curry((fileSystem: Filesystem, data: Arguments) => (
            data.file.id > 0
                ? fileSystem.saveFileContents(data.file.id, data.data)
                : fileSystem.createFile(data.file.name, data.data)
        ))
        const save = curriedSave(fileSystem)
        const returnFn = () => this.setState({ programMode: false })
        const initVim = (save: any, returnFn: any) => (args: Arguments[]) =>
            <Vim return={returnFn}
                save={save}
                input={args} />
        const initVimCurried = initVim(save, returnFn)

        const fetchContents = async (file: any) => {
            const contents: any = await fileSystem.getFileContents(file)
            return contents.map((file: any) => ({
                file: {
                    name: file.name,
                    id: file.id_file,
                }, data: file.details
            }))
        }
        const programArgs: Arguments[] = args.length
            ? fileSystem.currentFolderContents.find(e => e.name === args[0])
                ? await fetchContents(args[0]) : [{
                    file: {
                        name: args[0],
                        id: -1,
                    }, data: ""
                }]
            : []

        const init = this.initProgram(programArgs)
        const exec = pipe(
            initVimCurried,
            init,
            print)

        exec(programArgs)
    }

    initProgram = (programArgs: Arguments[]) => (program: any) => {
        this.setState({ programMode: true, programArgs: programArgs, program: program })
        return ""
    }

    skills = (args: string[], print: any) => {
        const { pipe } = R
        const returnFn = () => { this.setState({ programMode: false, program: null }) }
        const initializeProgram = (color: Color) => (returnFn: any) => <Skills
            return={returnFn}
            color={color}
        />

        const init = this.initProgram([])
        const curried = initializeProgram(this.state.color)
        const execSkills = pipe(
            curried,
            init,
            print)

        execSkills(returnFn)
    }

    calc = (args: string[], print: any) => {
        let expresion = new Expression(args.join(''))
        try {
            let result = (expresion.resolve())
            if (result) {
                print(result)
            }
        } catch (err) { console.log(err) }
        print()
    }

    pageScroll = () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            clearTimeout(this.scrolldelay)
        } else {
            window.scrollBy(0, 2)
            this.scrolldelay = setTimeout(this.pageScroll, 0.05)
        }
    }

    print = (buffer: any) => (...args: string[]) => {
        const screenText = args.reduce((prev, el) => prev.concat({ msg: el, type: "output" }), buffer)
        this.setState({ screenText }, () => { this.pageScroll() })
    }

    fallBackCommand(command: string, buffer: any) {
        if (command.length) {
            const screenText = buffer.concat({
                msg: `Unrecognized command '${command}'`,
                type: "output"
            })

            this.setState({ screenText }, () => { this.pageScroll() })
        }
        return command
    }

    head = (arr: any) => arr[0]
    tail = (arr: any) => arr[arr.length - 1]
    trace = (label: string) => (inpt: any) => { console.log(label, inpt); return inpt }

    getCurrentFolderPath = () => this.state.fileSystem.currentFolder.fullPath

    appendCommandToHistory = (command: any) => {
        return command.length && this.tail(this.state.commandHistory) === command
            ? this.state.commandHistory
            : this.state.commandHistory.concat(command)
    }

    onInput = (text: string) => {
        const { commands: stateCommands,
            screenText: stateScreenText
        } = this.state
        const { pipe, curry } = R
        const getCommandParts = (text: string) => text.split(" ")
        const getFirstCommand = (text: string) => this.head(getCommandParts(text))
        const getRestArgs = (text: string) => getCommandParts(text).slice(1)

        const executeCommand = curry((commandList: any, args: any, print: any, screenText:any, command: string) => {
            commandList.hasOwnProperty(command)
                ? commandList[command].command(args, print)
                : this.fallBackCommand(command,screenText)
            return [command].concat(args).join(" ")
        })

        const screenText = stateScreenText.concat({
            msg: text,
            path: this.getCurrentFolderPath()
        })
        const execCommandCurried = executeCommand(stateCommands,
            getRestArgs(text),
            this.print(screenText),
            screenText
        )
        const processCommand = pipe(
            getFirstCommand,
            execCommandCurried,
            this.appendCommandToHistory
        )

        const commandHistory = processCommand(text)
        this.setState({ commandHistory, historyPointer: 0 })
    }

    getCurrentCommand = (history: string[]) => (pointer: number) => (
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
        const getCurrentCommandWithHistoric = this.getCurrentCommand(this.state.commandHistory)

        const historyPointer = direction > 0
            ? incHistory(this.state.historyPointer)
            : decHistory(this.state.historyPointer)
        const command = getCurrentCommandWithHistoric(historyPointer)

        this.setState({ historyPointer })
        return command
    }

    finnishBoot() {
        this.setState({ initializing: false })
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