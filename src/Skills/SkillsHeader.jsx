import React from 'react'
import SkillItem, { Skill } from './SkillItem';
import './styles/SkillsHeader.css'

const SkillsHeader = ({skills, color}) => {
    return <div className="skills-header">
        {skills.map((e) => <SkillItem key={e.name} skill={e} color={color} />)}
    </div>
}

export default SkillsHeader
