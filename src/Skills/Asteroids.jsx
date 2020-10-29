import React, { useEffect, useState } from 'react'
import './styles/Asteroids.css'
import Game from './Asteroids/Game';
import { Skill } from './SkillItem';
import { Color } from '../Terminal/Terminal';

/**
 * 
 * @param {object} param0 
 * @param {Skill[]} param0.skills
 * @param {*} param0.skillConquered
 * @param {*} param0.returnCallback
 * @param {Color} param0.color
 * @param {*} param0.showInfo
 */
const Asteroids = ({skills, skillConquered, returnCallback, color, showInfo}) => {
    const [requestId, setRequestId] = useState(null);
    const canvasRef = React.createRef();

    useEffect(() => {
        const gameInit = () => {
            let game = new Game(document.querySelector("canvas"), 
                                skills, 
                                color,
                                skillConquered, 
                                returnCallback, 
                                (requestId) => { setRequestId(requestId) },
                                showInfo)
            game.onResize()
            game.loop()
        }
        const gameTimeout = setTimeout(gameInit)
        return () => {
            clearTimeout(gameTimeout)
            cancelAnimationFrame(requestId)
        }
    }, [])

    return <canvas ref={canvasRef} />
}

export default Asteroids