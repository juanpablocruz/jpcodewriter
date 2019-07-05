import React from 'react'
import SkillItem from './SkillItem';
import './styles/SkillsHeader.css'

interface Props {
    skills: string[]
    conquered: string[],
    color: string
}



const SkillsHeader = (props: Props) => {
    return <div className="skills-header">
        {props.skills.map((e) => <SkillItem key={e} skill={{ name: e }} color={props.color} conquered={props.conquered.includes(e)}/>)}
    </div>
}

export default SkillsHeader
