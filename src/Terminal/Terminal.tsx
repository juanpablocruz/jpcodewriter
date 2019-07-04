import React, { Component } from 'react'
import Screen from './Screen'
import Boot from './Boot';
import Filesystem from './FileSystem/Filesystem';
import Vim from '../Vim/Vim';


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
}


let Ambar: Color = { name: "amber", color: "#FFB000", shadow: { color: "rgba(255,176,0, 0.8)", offset: { width: 0, height: 0 }, radius: 2 } }
let Pink: Color = { name: "amber", color: "#FF1493", shadow: { color: "rgba(255, 20, 147, 0.8)", offset: { width: 0, height: 0 }, radius: 2 } }
let Green1: Color = { name: "green1", color: "#33FF00", shadow: { color: "rgba(51,255,0, 0.8)", offset: { width: 0, height: 0 }, radius: 2 } }
let AppleGreen: Color = { name: "appleGreen", color: "#33FF33", shadow: { color: "rgba(51,255,51, 0.8)", offset: { width: 0, height: 0 }, radius: 2 } }

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
        this.fallBackCommand = this.fallBackCommand.bind(this)
        this.getPrevCommand = this.getPrevCommand.bind(this)
        this.finnishBoot = this.finnishBoot.bind(this)
        this.pageScroll = this.pageScroll.bind(this)


        this.scrolldelay = null

        const defaultCommands: { [key: string]: Command } = {
            help: { command: this.help, description: "shows help text. Help <command> will display usage information about <command> if available" },
            clear: { command: this.clear, description: "clears the screen" },
            ls: { command: this.ls, description: "displays folder information" },
            cd: { command: this.cd, description: "change folder" },
            mkdir: { command: this.mkdir, description: "create folder" },
            touch: { command: this.touch, description: "create file" },
            vi: { command: this.vi, description: "file editor vi" },
            rm: { command: this.rm, description: "removes file" },
            cat: { command: this.cat, description: "reads a file" },
            greenmode: { command: this.greenmode, description: "" },
            ambarmode: { command: this.ambarmode, description: "" },
            pinkmode: { command: this.pinkmode, description: "" },
        }

        let oldLog = window.console.log

        /*      window.console.log = (...args:any) => {
                 this.print(...args)
                 oldLog(...args)
             }
      */

        this.state = {
            color: color,
            backgroundColor: backgroundColor,
            isMaximized: startState === 'maximized',
            style: style,
            commands: { ...defaultCommands, ...commands },
            screenText: [{ msg: msg }],
            commandHistory: [],
            initializing: true,
            fileSystem: new Filesystem(),
            programMode: false,
            programArgs: []
        }

    }

    greenmode = () => {
        this.setState({color: AppleGreen})
    }
    ambarmode = () => {
        this.setState({color: Ambar})
    }
    pinkmode = () => {
        this.setState({color: Pink})
    }

    clear = () => {
        this.setState({ screenText: [] })
    }

    cat = (args: string[], print: any) => {
        if (args.length) {
            this.state.fileSystem.getFileContents(args[0], (data:any) => {
                print(data[0].details)
            })
        }
    }

    help = (args: string[], print: any) => {
        if (args.length === 0) {
            let helpText = []

            let commands = this.state.commands
            for (let command in commands) {
                let obj: { [key: string]: string } = {}
                obj[command] = commands[command].description || "undefined"
                helpText.push(obj)
            }
            print(...helpText.map((value) => Object.keys(value)[0] + ":\t" + Object.values(value)[0]))
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

    ls = (args: string[], print: any) => {
        if (args.length === 0) {
            print(...this.state.fileSystem.getCurrentFolderContents().map((el: any) => el.name))
        } else {

            this.state.fileSystem.getFolderContents(args[0], (data: any) => { print(...data.map((el: any) => el.name)) })
        }
    }

    cd = (args: string[], print: any) => {
        if (args.length > 0) {
            this.state.fileSystem.changeToFolder(args[0])
        }
    }

    mkdir = (args: string[], print: any) => {
        if (args.length > 0) {
            this.state.fileSystem.createFolder(args[0])
        }
    }

    touch = (args: string[], print: any) => {
        if (args.length > 0) {
            this.state.fileSystem.createFile(args[0])
        }
    }

    rm = (args: string[], print: any) => {
        if (args.length > 0) {
            this.state.fileSystem.removeElement(args[0])
        }
    }

    vi = (args: string[], print: any) => {
        let programArgs : Arguments[] = []
        if (args.length > 0) {
            if (this.state.fileSystem.currentFolderContents.find(e => e.name === args[0])) {
                this.state.fileSystem.getFileContents(args[0], (rs: any) => {
                    let file = rs[0]
                    programArgs.push({file:{
                        name: file.name,
                        id: file.id_file,
                    }, data: file.details})
                    this.setState({programMode: true, programArgs: programArgs})
                })
            } else {
                programArgs.push({file:{
                    name: args[0],
                    id: -1,
                }, data: ""})
                this.setState({programMode: true, programArgs: programArgs})
            }
            
        } else {
            this.setState({programMode: true, programArgs: programArgs})
        }
        
    }

    pageScroll = () => {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            clearTimeout(this.scrolldelay)
        } else {
            window.scrollBy(0, 1)
            this.scrolldelay = setTimeout(this.pageScroll, 0.05)
        }
    }

    print(...args: string[]) {
        let screenText = this.state.screenText

        for (let arg of args) {
            screenText.push({ msg: arg, type: "output" })
        }

        this.setState({ screenText }, () => { this.pageScroll() })
    }

    fallBackCommand(command: string, commandParts: string[]) {
        let screenText = this.state.screenText
        if (command.length) {
            screenText.push({ msg: `Unrecognized command '${command}'`, type: "output" })
        }

        this.setState({ screenText }, () => { this.pageScroll() })
    }

    onInput = (text: string) => {
        let commandParts = text.split(" ")
        let command: string = commandParts[0]
        let stateCommands: { [key: string]: any } = this.state.commands
        let args: string[] = commandParts.slice(1)

        let screenText = this.state.screenText
        screenText.push({ msg: text, path: this.state.fileSystem.currentFolder.fullPath })
        this.setState({ screenText })

        if (stateCommands.hasOwnProperty(command)) {
            let commandHistory = this.state.commandHistory
            commandHistory.push(command)
            this.setState({ commandHistory })
            stateCommands[command].command(args, this.print)
        } else {
            this.fallBackCommand(command, commandParts)
        }
    }

    *getPrevCommand() {
        for (let i = this.state.commandHistory.length - 1; i >= 0; i--) {
            yield this.state.commandHistory[i]
        }
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

        let adapter = <Screen onInput={this.onInput} currentPath={this.state.fileSystem.currentFolder.fullPath} output={this.state.screenText} getPrevCommand={this.getPrevCommand} color={this.state.color} />

        if (this.state.programMode) {
            adapter = <Vim return={() => this.setState({programMode: false})} save={(data: Arguments) => {
                if (data.file.id > 0) {
                    this.state.fileSystem.saveFileContents(data.file.id, data.data)
                } else {
                    this.state.fileSystem.createFile(data.file.name, data.data)
                }
                
            }} input={this.state.programArgs}/>
        }


        return <div style={computedStyle}>
            {this.state.programMode ?
                adapter
                : <React.Fragment>
                    <Boot finishBoot={this.finnishBoot} alreadyInitialized={!this.state.initializing} />
                    {
                        !this.state.initializing ? adapter : null
                    }
                </React.Fragment>
            }

        </div>
    }
}

export default Terminal