import React, {useState, useEffect} from 'react'
import figlet from 'figlet'
import './style/Boot.css'
import TextScramble from './TextScramble';

/**
 * 
 * @param {*} param0
 * @param {*} param0.finishBoot
 * @param {boolean} param0.alreadyInitialized 
 */
const Boot = ({finishBoot, alreadyInitialized}) => {
    const [text, setText] = useState('');
    figlet.defaults({fontPath: "assets/fonts"})
    useEffect(() => {
        if (!alreadyInitialized) {
            const el = document.querySelector('.logo p')            
            const fx = new TextScramble(el)
            fx.setText('').then(() => {
                figlet('Juan Pablo', 'Doh', (err, data) => {
                    fx.setText(data).then(() => {
                        finishBoot()
                    }) 
                    setText(data)
                })
            })
        } else {
            figlet('Juan Pablo', 'Doh', (err, newText) => {
                setText(newText)
            })
        }
    }, [])
    return (
        <div className='logo'>
            <p>{text}</p>
        </div>
    )
}
export default Boot