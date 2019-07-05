import React, { Component } from 'react'
import './styles/Asteroids.css'
import Game from './Asteroids/Game';
import { Skill } from './SkillItem';
import { Color } from '../Terminal/Terminal';


interface Props {
    skills: string[],
    skillConquered: any
    return: any
    color: Color
}

interface State {
    game?: Game,
    requestId: any
}
class Asteroids extends Component<Props, State> {
    canvasRef: any
    constructor(props: Props) {

        super(props)

        this.canvasRef = React.createRef()

        this.state = {
            requestId: null
        }
    }
    componentDidMount() {
        setTimeout(() => {
            let game = new Game(document.querySelector("canvas"), 
                                this.props.skills, 
                                this.props.color,
                                this.props.skillConquered, 
                                this.props.return, (requestId: any) => { this.setState({ requestId }) })
            game.onResize()
            game.loop()

        })

    }

    componentWillUnmount() {
        cancelAnimationFrame(this.state.requestId)
    }

    render() {
        return <canvas ref={this.canvasRef} />
    }

}

export default Asteroids