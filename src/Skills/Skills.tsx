import React, { Component } from 'react'
import skillsFile from "./skills_list.json"
import SkillsHeader from './SkillsHeader';
import Asteroids from './Asteroids';
import './styles/Skills.css'
import { Color } from '../Terminal/Terminal';
import { Skill } from './SkillItem.jsx';
import SkillsModal from './SkillsModal';

interface Props {
    return: any
    color: Color
}


interface State {
    skills: Skill[]
    displayInfo: boolean
}


export default class Skills extends Component<Props, State>{

    constructor(props: Props) {
        super(props)

        this.skillConquered = this.skillConquered.bind(this)
        this.showInfo = this.showInfo.bind(this)

        this.state = {
            skills: skillsFile.skills,
            displayInfo: false
        }
    }

    showInfo() {
        this.setState({displayInfo: !this.state.displayInfo})
    }

    skillConquered(skillName:string) {
        let skills = this.state.skills
        for (let skill of skills) {
            if (skill.name === skillName) {
                skill.conquered = true
            }
        }

        this.setState({skills})
    }


    render() {
        return <div>
            <SkillsHeader skills={this.state.skills} color={this.props.color.name}/>
            <Asteroids skills={this.state.skills} skillConquered={this.skillConquered} return={this.props.return} color={this.props.color} showInfo={this.showInfo}/>
            {this.state.displayInfo ? <SkillsModal skills={this.state.skills} color={this.props.color}/> : null }
            <p className="help-text">Press ESC to exit | Press Tab for more info</p>
        </div>
    }
}