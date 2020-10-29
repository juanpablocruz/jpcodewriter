import React from 'react'
import Prompt from './Prompt'
import TextHistoric from './TextHistoric'
import { Color } from './Terminal';
import './style/Screen.css'

/**
 * 
 * @param {*} props 
 * @param {object[]} props.output
 * @param {*} props.onInput
 * @param {*} props.getPrevCommand
 * @param {Color} props.color
 * @param {string} props.currentPath
 */
const Screen = ({output, getPrevCommand, onInput, currentPath, color}) => {
    return <div className="screen">
        <TextHistoric screenText={output} />
        <Prompt onInput={onInput} currentPath={currentPath} getPrevCommand={getPrevCommand} color={color}/>
    </div>
}

export default Screen