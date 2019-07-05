import React from 'react'
import './styles/SkillItem.css'

export interface Skill {
    name: string
}

interface Props {
    skill: Skill
    conquered: boolean
}

const SkillItem = (props:Props) => {
    return <div className={`skill-badge ${props.conquered?'conquered':''}`}><span>{props.skill.name}</span></div>
}
export default SkillItem