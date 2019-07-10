import React, { Component, useState, useEffect, RefObject } from 'react'
import "./style/prompt.css"
import { Color } from './Terminal';
import Carret from './Carret';
import { pipe } from 'ramda';
import { isValid } from '../Vim/Vim';

interface Props {
    onInput: any,
    getPrevCommand: any,
    color?: Color,
    currentPath: string
}
const inputActions: { [key: number]: any } = {
    8: ({ text, onInput }: { text: string, onInput: any }) => (
        text.length > 0 ?
            () => text.substring(0, text.length - 1)
            : ""
    ),
    13: ({ text, onInput }: { text: string, onInput: any }) => {
        onInput(text)
        return ""
    }
}

const Prompt = (props: Props) => {

    const [text, setText] = useState('')
    const carret: RefObject<HTMLDivElement> = React.createRef()

    const isCodeValid = ({ keyCode, ...rest }: { keyCode: number }) => isValid(keyCode)
    const typeKey = ({ onInput, getPrevCommand }: Props) =>
        (event: any) => {
            const mapSpecialChars = (key: string) => (key === 'Dead') ? '^' : key
            const defaultCase = (text: string, event: any) => (
                () => isCodeValid(event) ? text + mapSpecialChars(event.key) :
                    event.keyCode === 38 ? getPrevCommand(1) :
                        event.keyCode === 40 ? getPrevCommand(-1) :
                            text
            )
            const e = Object.assign({},event)
            setText(inputActions[e.keyCode] ?
                inputActions[e.keyCode]({ text, onInput })
                : defaultCase(text, e)
            )
            event.preventDefault()
        }
    useEffect(() => {
        return () => {
            if (carret && carret.current)
                carret.current.focus()
        };
    }, [])

    return <div className="prompt-input"
        ref={carret}
        onKeyDown={typeKey(props)}
        tabIndex={0}>
        <span>[{props.currentPath}] > </span>{text}{
            <Carret color={props.color} />}
    </div>

}

export default Prompt