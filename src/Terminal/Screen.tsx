import React from 'react'
import Prompt from './Prompt'
import TextHistoric, { Message } from './TextHistoric'
import { Color } from './Terminal';
import './style/Screen.css'

interface Props {
    output?: Message[],
    onInput: any,
    getPrevCommand: any,
    color: Color,
    currentPath: string
}

const Screen = (props: Props) => {
    return <div className="screen">
        <TextHistoric screenText={props.output} />
        <Prompt onInput={props.onInput} currentPath={props.currentPath} getPrevCommand={props.getPrevCommand} color={props.color}/>
    </div>
}

export default Screen