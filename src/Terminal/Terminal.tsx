import React, { Component } from 'react'
import Screen from './Screen'
import Boot from './Boot';
import Filesystem, { Folder } from './FileSystem/Filesystem';
import Vim from '../Vim/Vim';
import "./style/Terminal.css"
import Skills from '../Skills/Skills';
import { Expression } from './Math';
import * as R from 'ramda'

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

    greenmode = () => {
        this.setState({ color: AppleGreen })
    }
    ambarmode = () => {
        this.setState({ color: Ambar })
    }
    pinkmode = () => {
        this.setState({ color: Pink })
    }

    clear = () => {
        this.setState({ screenText: [] })
    }

    cat = async (args: string[], print: any) => {
        if (args.length) {
            let data: any = await this.state.fileSystem.getFileContents(args[0])
            print(...data.map((c: any) => c.details))
        }
    }

    help = (args: string[], print: any) => {
        if (!args.length) {
            let commands = Object.entries(this.state.commands)
            let withDescription = commands.filter((c: any) => c[1].description.length)
            let helpText = withDescription.map((e: any) => `${e[0]}:\t${e[1].description}`)
            print(...helpText)
        } else {
            let command = args[0]
            if (this.state.commands.hasOwnProperty(command)) {
                if (this.state.commands[command].hasOwnProperty("man")) {
                    print(this.state.commands[command].man)
                } else {
                    print(`${command} has no man page`)
                }
            }
        }
    }

    ls = async (args: string[], print: any) => {
        if (!args.length) {
            print(...this.state.fileSystem.getCurrentFolderContents().map((el: Folder) => el.name))
        } else {
            let data: any = await this.state.fileSystem.getFolderContents(
                args[0]
            )
            print(...data.map((el: Folder) => el.name))
        }
    }

    cd = (args: string[], print: any) => {
        if (args.length) {
            this.state.fileSystem.changeToFolder(args[0])
        }
    }

    mkdir = (args: string[], print: any) => {
        if (args.length) {
            this.state.fileSystem.createFolder(args[0])
        }
    }

    touch = (args: string[], print: any) => {
        if (args.length) {
            this.state.fileSystem.createFile(args[0])
        }
    }

    rm = (args: string[], print: any) => {
        if (args.length) {
            this.state.fileSystem.removeElement(args[0])
        }
    }

    vi = async (args: string[], print: any) => {
        let programArgs: Arguments[] = []
        const { fileSystem } = this.state
        const { curry } = R

        const curriedSave = curry((fileSystem: Filesystem, data: Arguments) => {
            if (data.file.id > 0) {
                fileSystem.saveFileContents(data.file.id, data.data)
            } else {
                fileSystem.createFile(data.file.name, data.data)
            }
        })
        const save = curriedSave(fileSystem)
        const returnFn = () => this.setState({ programMode: false })

        let initVim = (args: Arguments[]) =>
            <Vim return={returnFn}
                save={save}
                input={args} />

        if (args.length) {
            if (fileSystem.currentFolderContents.find(e => e.name === args[0])) {
                let contents: any = await fileSystem.getFileContents(args[0])
                programArgs = contents.map((file: any) => ({
                    file: {
                        name: file.name,
                        id: file.id_file,
                    }, data: file.details
                })
                )
            } else {
                programArgs.push({
                    file: {
                        name: args[0],
                        id: -1,
                    }, data: ""
                })
            }
        }
        this.setState({ programMode: true, program: initVim(programArgs) })
    }

    skills = (args: string[], print: any) => {
        let program = <Skills
            return={() => { this.setState({ programMode: false, program: null }) }}
            color={this.state.color}
        />

        this.setState({ programMode: true, programArgs: [], program: program })
    }

    calc = (args: string[], print: any) => {
        let expresion = new Expression(args.join(''))
        try {
            let result = (expresion.resolve())
            if (result) {
                print(result)
            }
        } catch (err) { console.log(err) }
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

    fallBackCommand(command: string) {
        if (command.length) {
            const screenText = this.state.screenText.concat({
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
        return this.tail(this.state.commandHistory) === command
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

        const executeCommand = curry((commandList: any, args: any, print: any, command: string) => {
            commandList.hasOwnProperty(command)
                ? commandList[command].command(args, print)
                : this.fallBackCommand(command)
            return [command].concat(args).join(" ")
        })

        const screenText = stateScreenText.concat({
            msg: text,
            path: this.getCurrentFolderPath()
        })
        const execCommandCurried = executeCommand(stateCommands,
            getRestArgs(text),
            this.print(screenText)
        )
        const processCommand = pipe(
            getFirstCommand,
            execCommandCurried,
            this.appendCommandToHistory
        )

        const commandHistory = processCommand(text)
        this.setState({ commandHistory, historyPointer:0 })
    }

    getPrevCommand() {
        const inc = (history:string[]) => (
            (historyPointer:number) => (
                historyPointer < history.length ? historyPointer+1 : historyPointer
            )
        )
        const getCurrentCommand = (history:string[]) => (pointer: number) => (
            history[pointer]
        )
        
        const incHistory = inc(this.state.commandHistory)
        const getCurrentCommandWithHistoric = getCurrentCommand(this.state.commandHistory)

        const historyPointer = incHistory(this.state.historyPointer)
        const command = getCurrentCommandWithHistoric(historyPointer)
        this.setState({historyPointer})
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