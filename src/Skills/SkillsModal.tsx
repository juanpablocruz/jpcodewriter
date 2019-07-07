import React, { Component } from 'react'
import { Skill } from './SkillItem';
import "./styles/SkillsModal.css"
import { Color } from '../Terminal/Terminal';
import SkillInfo from './SkillInfo';

interface Props {
    skills: Skill[]
    color: Color
}

interface State {
    selectedSkill: Skill|null
}

class SkillsModal extends Component<Props, State> {
    constructor(props:Props) {
        super(props)
        this.onSkillSelected = this.onSkillSelected.bind(this)
        this.state = {
            selectedSkill: null
        }
    }
    onSkillSelected(skill:Skill) {
        this.setState({selectedSkill: skill})
    }
    render() {
        return <div className={`skills-modal ${this.props.color.name}`}>
            <div className={`skills-modal-progress ${this.props.color.name}`}>
                {
                    this.props.skills.map((e: Skill) => {
                        return e.conquered ? <SkillInfo key={e.name} color={this.props.color} select={this.onSkillSelected} skill={e} /> : ''
                    })
                }
            </div>
            <div className={`skills-modal-skill-info`}>
                {this.state.selectedSkill ? this.state.selectedSkill.description : null}
            </div>
        </div>
    }
}

export default SkillsModal