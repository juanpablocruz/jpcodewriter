import React from 'react'
import './style/Footer.css'
import { Mode } from './Vim';

/**
 * 
 * @param {Mode?} mode 
 */
const translateMode = (mode) => {
    switch(mode) {
        case Mode.Insert:
            return "-- Insert --"
        default:
            return ""
    }
}

/**
 * 
 * @param {*} param0
 * @param {string?} param0.fileName
 * @param {Mode?} param0.mode
 * @param {string[]} param0.commandText
 */
const Footer = ({fileName, mode, commandText}) => {
    const today = new Date()
    const time = `${today.getHours()} ${today.getMinutes()} ${today.toLocaleDateString("es-ES", {year:'numeric', month:'numeric', day:'numeric'})} ` 
    return <div className="vim-footer">
        <div className="vim-footer-status">[{fileName && fileName.length ?fileName:'Sin nombre'}] ({time})</div>
        <div className="vim-footer-mode">{translateMode(mode)}</div>
        <div className="vim-command-text">{commandText.join("")}</div>
    </div>
}


export default Footer