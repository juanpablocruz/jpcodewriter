import React from 'react'
import { Color } from './Terminal';
import './style/Carret.css'
interface Props {
    color?: Color
}
const Carret = (props: Props) => {

    let carretStyle = props.color ? `carret ${props.color.name}` : 'carret green1'
    let carret = <span className={carretStyle} ></span>
    return carret
}

export default Carret