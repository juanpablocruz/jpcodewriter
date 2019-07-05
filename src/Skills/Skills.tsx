import React, { Component } from 'react'
import skillsFile from "./skills_list.json"
import SkillsHeader from './SkillsHeader';
import Asteroids from './Asteroids';
import './styles/Skills.css'

interface Props {
    return: any
}


interface State {
    skills: string[],
    conquered: string[]
}


export default class Skills extends Component<Props, State>{

    constructor(props: Props) {
        super(props)

        this.skillConquered = this.skillConquered.bind(this)

        this.state = {
            skills: skillsFile.skills,
            conquered: []
        }
    }


    skillConquered(skill:string) {
        let conquered = this.state.conquered
        conquered.push(skill)
        this.setState({conquered})
    }


    render() {
        return <div>
            <SkillsHeader skills={this.state.skills} conquered={this.state.conquered}/>
            <Asteroids skills={this.state.skills} skillConquered={this.skillConquered} return={this.props.return}/>
            <p className="help-text">Press ESC to exit</p>
        </div>
    }
}