import React, { Component } from 'react'
import "./style/prompt.css"
import { Color } from './Terminal';
import Carret from './Carret';

interface Props {
    onInput: any,
    getPrevCommand: any,
    color ?: Color,
    currentPath: string
}


interface State {
    text: string
}

class Prompt extends Component<Props, State> {
    carret: any
    prev: any

    constructor(props: any) {
        super(props)

        this.carret = React.createRef()
        this.typeKey = this.typeKey.bind(this)
        this.prev = this.props.getPrevCommand()

        this.state = {
            text: ''
        }
    }

    typeKey = (event: any) => {
        let text = this.state.text
        let hasModified = false
        
        switch (event.keyCode) {
            case 8:
                if (text.length > 0) {
                    text = text.substring(0, text.length - 1);
                    hasModified = true
                }
                break
            case 13:
                this.props.onInput(text)
                text = ""
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
                    text = this.state.text + event.key
                    hasModified = true
                } else {
                    if (keycode === 38) {// UP
                        event.preventDefault()
                        let prevCommand = this.prev.next()
                        
                        if (prevCommand.value && prevCommand.value.length) {
                            text = prevCommand.value
                            hasModified = true
                        }
                    } else if (keycode === 40) { // DOWN
                        event.preventDefault()
                    }
                }
        }
        if (hasModified) {
            this.setState({ text })
        }
    }

    componentDidMount() {
        this.carret.focus()
    }


    render() {
        return <div className="prompt-input" ref={(input) => this.carret = input} onKeyDown={this.typeKey} tabIndex={0}>
            <span>[{this.props.currentPath}] > </span>{this.state.text}{<Carret color={this.props.color}/>}
        </div>
    }
}

export default Prompt