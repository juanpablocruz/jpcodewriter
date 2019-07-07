import React from 'react'
import { Skill } from './SkillItem';
import './styles/SkillsInfo.css'
import { Color } from '../Terminal/Terminal';
interface Props {
    skill: Skill
    color: Color
    select: any
}

const SkillInfo = (props: Props) => {
    return <div className={`skill-info ${props.color.name}`} onClick={() => {props.select(props.skill)}}>
        <p>{props.skill.name}</p>
        <div className={"skill-info-total-progress"}>
            <p className={`skill-info-progress ${props.color.name}`} style={{ width: props.skill.percentage + "%" }}/>
        </div>
    </div>


}

export default SkillInfo