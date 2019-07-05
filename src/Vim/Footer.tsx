import React from 'react'
import './style/Footer.css'
import { Mode } from './Vim';
interface Props {
    fileName ?: string,
    mode ?: Mode,
    commandText: string[]
}

interface State {

}

const translateMode = (mode?:Mode) => {
    switch(mode) {
        case Mode.Insert:
            return "-- Insert --"
    }
}

 const Footer = (props:Props) => {
    let today = new Date()
    let time = `${today.getHours()} ${today.getMinutes()} ${today.toLocaleDateString("es-ES", {year:'numeric', month:'numeric', day:'numeric'})} ` 
    return <div className="vim-footer">
        <div className="vim-footer-status">[{props.fileName && props.fileName.length ?props.fileName:'Sin nombre'}] ({time})</div>
        <div className="vim-footer-mode">{translateMode(props.mode)}</div>
        <div className="vim-command-text">{props.commandText.join("")}</div>
    </div>
}


export default Footer