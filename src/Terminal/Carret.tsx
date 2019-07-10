import React from 'react'
import { Color } from './Terminal';
import './style/Carret.css'
interface Props {
    color?: Color
}
const Carret = (props: Props) => {
    const carretStyle = props.color ? `carret ${props.color.name}` : 'carret green1'
    return <span className={carretStyle} ></span>
}

export default Carret