import React from 'react'
import './styles/SkillItem.css'

export interface Skill {
    name: string
    percentage: number
    description: string
    conquered: boolean
}

interface Props {
    skill: Skill
    color: string
}

const SkillItem = (props:Props) => {
    return <div className={`skill-badge ${props.skill.conquered?'conquered':''} ${props.color}`}><span>{props.skill.name}</span></div>
}
export default SkillItem