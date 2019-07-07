import React from 'react'
import SkillItem, { Skill } from './SkillItem';
import './styles/SkillsHeader.css'

interface Props {
    skills: Skill[]
    color: string
}



const SkillsHeader = (props: Props) => {
    return <div className="skills-header">
        {props.skills.map((e) => <SkillItem key={e.name} skill={e} color={props.color} />)}
    </div>
}

export default SkillsHeader
