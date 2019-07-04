import React, {Component} from 'react'
import figlet from 'figlet'
import './style/Boot.css'
import TextScramble from './TextScramble';

interface Props {
    finishBoot: any,
    alreadyInitialized: boolean
}

interface State {
    text: string
}

class Boot extends Component<Props, State> {

    constructor(props:Props) {

        super(props)

        figlet.defaults({fontPath: "assets/fonts"})
        

        this.state = {
            text: ''
        }
    }

    componentDidMount() {
        if (!this.props.alreadyInitialized) {
            const el = document.querySelector('.logo p')
            const fx = new TextScramble(el)
    
            fx.setText("").then(() => {
                figlet('Juan Pablo', 'Doh', (err:any, text:any) => {
                    fx.setText(text).then(() => {
                        this.props.finishBoot()
                    }) 
                    this.setState({text})
                })
            })
        } else {
            figlet('Juan Pablo', 'Doh', (err:any, text:any) => {
                this.setState({text})
            })
        }
        
    }



    render() {
        return <div className='logo'>
            <p>{this.state.text}</p>
        </div>
    }

}
export default Boot