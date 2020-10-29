import React, { Component, useState, useReducer, useEffect } from 'react'
import Screen from './Screen'
import Boot from './Boot';
import Filesystem, { Folder } from './FileSystem/Filesystem';
import Vim from '../Vim/Vim';
import "./style/Terminal.css"
import Skills from '../Skills/Skills';
import { Expression } from './Math';
import * as R from 'ramda'
/**
 * @typedef {object} Command
 * @property {*} Command.command
 * @property {string} Command.description
 * @property {string?} Command.man
 */
/**
 * @typedef {Object.<string,Command>} Commands
 * 
 */
/**
 * @typedef {object} ColorOffset
 * @property {number} ColorOffset.width
 * @property {number} ColorOffset.height
 */
/**
 * @typedef {object} ColorShadow
 * @property {string} ColorOffset.color
 * @property {ColorOffset} ColorOffset.offset
 * @property {number} ColorOffset.radius
 */
/**
 * @typedef {object} Color
 * @property {string} Color.name
 * @property {string} Color.color
 * @property {ColorShadow} shadow
 */
/**
 * @typedef {object} Arguments
 * @property {*} Arguments.file
 * @property {*} Arguments.data
 */

export const Ambar = { name: "amber", color: "#FFB000", shadow: { color: "rgba(255,176,0, 0.8)", offset: { width: 0, height: 0 }, radius: 2 } }
export const Pink = { name: "pink", color: "#FF1493", shadow: { color: "rgba(255, 20, 147, 0.8)", offset: { width: 0, height: 0 }, radius: 2 } }
export const AppleGreen = { name: "appleGreen", color: "#33FF33", shadow: { color: "rgba(51,255,51, 0.8)", offset: { width: 0, height: 0 }, radius: 2 } }


/**
 * 
 * @param {*} param0
 * @param {Color?} param0.color
 * @param {string?} param0.backgroundColor
 * @param {object?} param0.style
 * @param {Commands?} param0.commands
 * @param {string?} param0.startState
 * @param {string?} param0.msg
 */
const Terminal = ({color, backgroundColor, style, commands, startState, msg}) => {
    const defaultCommands = {
        "help": { command: help, description: "shows help text. Help <command> will display usage information about <command>" },
        "clear": { command: clear, description: "clears the screen" },
        "ls": { command: ls, description: "displays folder information" },
        "cd": { command: cd, description: "change folder" },
        "mkdir": { command: mkdir, description: "create folder" },
        "touch": { command: touch, description: "create file" },
        "vi": { command: vi, description: "file editor vi" },
        "rm": { command: rm, description: "removes file" },
        "cat": { command: cat, description: "reads a file" },
        "calc": { command: calc, description: "evaluate mathematical expresion" },
        "skills": { command: skills, description: "show the skills" },
        "greenmode": { command: greenmode, description: "Change terminal color to green" },
        "ambarmode": { command: ambarmode, description: "Change terminal color to ambar" },
        "pinkmode": { command: pinkmode, description: "Change terminal color to pink" },
    }
    const [state, setState] = useReducer((oldState, newState) => ({...oldState, ...newState}), {
        color: color ?? Ambar,
        backgroundColor: backgroundColor ?? 'black',
        isMaximized: (startState ?? 'maximized') === 'maximized',
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
    });

    let scrolldelay = null
    const head = (arr) => arr[0]
    const tail = (arr) => arr[arr.length - 1]
    const trace = (label) => (inpt) => {console.log(label, inpt); return inpt}
    
    function greenmode() {setState({color: AppleGreen })}
    function ambarmode () { setState({color: Ambar })}
    function pinkmode () { setState({color: Pink })}
    function clear () { setState({ screenText: [] })}
    /**
     * 
     * @param {string[]} args 
     * @param {*} print 
     */
    async function cat(args, print) {
        if (args.length) {
            let data = await state.fileSystem.getFileContents(args[0])
            print(...data.map((c) => c.details))
        }
    }
    function help(args, print) {
        if (!args.length) {
            let commands = Object.entries(state.commands)
            let withDescription = commands.filter((c) => c[1].description.length)
            let helpText = withDescription.map((e) => `${e[0]}:\t${e[1].description}`)
            print(...helpText)
        } else {
            let command = args[0]
            if (state.commands.hasOwnProperty(command)) {
                if (state.commands[command].hasOwnProperty("man")) {
                    print(state.commands[command].man)
                } else {
                    print(`${command} has no man page`)
                }
            }
        }
    }
    /**
     * 
     * @param {string[]} args 
     * @param {*} print 
     */
    async function ls(args, print) {
        if (!args.length) {
            print(...state.fileSystem.getCurrentFolderContents().map((el) => el.name))
        } else {
            let data = await state.fileSystem.getFolderContents(
                args[0]
            )
            print(...data.map((el) => el.name))
        }
    }
    function cd(args, print) {
        if (args.length) {
            state.fileSystem.changeToFolder(args[0])
        }
    }
    function mkdir(args, print) {
        if (args.length) {
            state.fileSystem.createFolder(args[0])
        }
    }
    function touch(args, print) {
        if (args.length) {
            state.fileSystem.createFile(args[0])
        }
    }
    function rm(args, print) {
        if (args.length) {
            state.fileSystem.removeElement(args[0])
        }
    }
    async function vi(args, print) {
        let programArgs = []
        const { fileSystem } = state
        const { curry } = R

        const curriedSave = curry((fileSystem, data) => {
            if (data.file.id > 0) {
                fileSystem.saveFileContents(data.file.id, data.data)
            } else {
                fileSystem.createFile(data.file.name, data.data)
            }
        })
        const save = curriedSave(fileSystem)
        const returnFn = () => setState({ programMode: false })

        let initVim = (args) =>
            <Vim returnCallback={returnFn}
                save={save}
                input={args} />

        if (args.length) {
            if (fileSystem.currentFolderContents.find(e => e.name === args[0])) {
                let contents = await fileSystem.getFileContents(args[0])
                programArgs = contents.map((file) => ({
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
        setState({ programMode: true, program: initVim(programArgs) })
    }
    function skills(args, print) {
        let program = <Skills
            returnCallback={() => { setState({ programMode: false, program: null }) }}
            color={state.color}
        />

        setState({ programMode: true, programArgs: [], program: program })
    }
    function calc(args, print) {
        let expresion = new Expression(args.join(''))
        try {
            let result = (expresion.resolve())
            if (result) {
                print(result)
            }
        } catch (err) { console.log(err) }
    }
    function pageScroll() {
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
            clearTimeout(scrolldelay)
        } else {
            window.scrollBy(0, 2)
            scrolldelay = setTimeout(pageScroll, 0.05)
        }
    }
    function print(buffer) {
        return (...args) => {
            const screenText = args.reduce((prev, el) => prev.concat({ msg: el, type: "output" }), buffer)
            setState({ screenText }, () => { pageScroll() }) 
        } 
    }
    function fallBackCommand(command) {
        if (command.length) {
            const screenText = state.screenText.concat({
                msg: `Unrecognized command '${command}'`,
                type: "output"
            })
            setState({ screenText }, () => { pageScroll() })
        }
        return command
    }
    const getCurrentFolderPath = () => state.fileSystem.currentFolder.fullPath

    function appendCommandToHistory(command) {
        return tail(state.commandHistory) === command
            ? state.commandHistory
            : state.commandHistory.concat(command)
    }

    function onInput(text) {
        const { commands: stateCommands, screenText: stateScreenText} = state;
        const { pipe, curry } = R
        const getCommandParts = (text) => text.split(" ")
        const getFirstCommand = (text) => head(getCommandParts(text))
        const getRestArgs = (text) => getCommandParts(text).slice(1)

        const executeCommand = curry((commandList, args, print, command) => {
            commandList.hasOwnProperty(command)
                ? commandList[command].command(args, print)
                : fallBackCommand(command)
            return [command].concat(args).join(" ")
        })

        const screenText = stateScreenText.concat({
            msg: text,
            path: getCurrentFolderPath()
        })
        const execCommandCurried = executeCommand(stateCommands,
            getRestArgs(text),
            print(screenText)
        )
        const processCommand = pipe(
            getFirstCommand,
            execCommandCurried,
            appendCommandToHistory
        )

        const commandHistory = processCommand(text)
        setState({ commandHistory, historyPointer:0 })
    }
    function getPrevCommand() {
        const inc = (history) => (
            (historyPointer) => (
                historyPointer < history.length 
                    ? historyPointer + 1 
                    : historyPointer
            )
        )
        const getCurrentCommand = (history) => (pointer) => history[history.length - (pointer+1)]
        
        const incHistory = inc(state.commandHistory)
        const getCurrentCommandWithHistoric = getCurrentCommand(state.commandHistory)

        
        const command = getCurrentCommandWithHistoric(state.historyPointer)
        const historyPointer = incHistory(state.historyPointer)

        setState({historyPointer})
        return command
    }

    const stateColor = state?.color || Ambar
    
    let computedStyle = {
        ...state.style,
        ...{
            backgroundColor: state?.backgroundColor || 'black',
            color: stateColor.color,
            textShadowColor: stateColor.shadow.color,
            textShadowOffset: stateColor.shadow.offset,
            textShadowRadius: stateColor.shadow.radius,
            display: "block",
            fontFamily: "'PRNumber3','AndaleMono', monospace",
        }
    }
    if (state.isMaximized) {
        computedStyle = { ...computedStyle, ...{ width: '100%', height: '100%' } }
    }

    const finnishBoot = () => setState({initializing: false})
    
    return (<div style={computedStyle}>
        <div className={`overlay ${stateColor.name}`} />
        {state.programMode ?
            state.program
            : <>
               <Boot finishBoot={finnishBoot} alreadyInitialized={!state.initializing} />
                {!state.initializing && <Screen onInput={onInput}
                            currentPath={getCurrentFolderPath()}
                            output={state.screenText}
                            getPrevCommand={getPrevCommand}
                            color={stateColor}
                        />}
            </>
        }

    </div>)

}

export default Terminal