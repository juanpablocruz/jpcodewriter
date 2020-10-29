import React from 'react'
import { Color } from './Terminal';
import './style/Carret.css'

/**
 * 
 * @param {object} param0
 * @param {Color} param0.color
 */
const Carret = ({color}) => {
    const carretStyle = color ? `carret ${color.name}` : 'carret green1'
    const carret = <span className={carretStyle} ></span>
    return carret
}

export default Carret