import React, { useEffect, useState, useRef } from "react"
import "./style/prompt.css"
import { Color } from './Terminal';
import Carret from './Carret';

/**
 * @param param0 
 * @param {*} onInput
 * @param {*} getPrevCommand
 * @param {Color?} color
 * @param {string} currentPath
 */
const Prompt = ({onInput, getPrevCommand, color, currentPath}) => {
    const carret = useRef(null);
    const [prev, setPrev] = useState(0)
    const [text, setText] = useState('');

    useEffect(() => {
        const focusCarret = () => {
            carret.current.focus()
        };
        focusCarret()
        window.addEventListener("click", focusCarret)
        return () => window.removeEventListener("click", focusCarret)
    }, [])

    const typeKey = (event) => {
        let hasModified = false;
        let tmpText = text
        switch (event.keyCode) {
            case 8:
                if (text.length > 0) {
                    tmpText = text.substring(0, text.length - 1);
                    hasModified = true
                }
                break
            case 13:
                onInput(text)
                tmpText = ""
                hasModified = true
                break
            default:
                let keycode = event.keyCode
                
                var valid =
                    (keycode > 47 && keycode < 58) || // number keys
                    keycode === 32 || keycode === 13 || // spacebar & return key(s) (if you want to allow carriage returns)
                    (keycode > 64 && keycode < 91) || // letter keys
                    (keycode > 95 && keycode < 112) || // numpad keys
                    (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
                    (keycode > 218 && keycode < 223)   // [\]' (in order)

                if (valid) {
                    let key = event.key
                    if (key === 'Dead') {key = '^'}
                    tmpText = text + key
                    hasModified = true
                } else {
                    if (keycode === 38) {// UP
                        event.preventDefault()
                        let prevCommand = getPrevCommand()
                        console.log(prevCommand)
                        if (prevCommand && prevCommand.length) {
                            tmpText = prevCommand
                            hasModified = true
                        }
                    } else if (keycode === 40) { // DOWN
                        event.preventDefault()
                    }
                }
        }
        if (hasModified) {
            setText(tmpText);
        }
    }
    return (
        <div className="prompt-input" ref={carret} onKeyDown={typeKey} tabIndex={0}>
            <span>{`[${currentPath}] > `}</span>{text}{<Carret color={color}/>}
        </div>
    )
}

export default Prompt