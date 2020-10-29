import React from 'react'
import { Skill } from './SkillItem';
import './styles/SkillsInfo.css'
import { Color } from '../Terminal/Terminal';

/**
 * 
 * @param {*} param0 
 * @param {Skill} param0.skill
 * @param {Color} param0.color
 * @param {*} param0.select 
 */
const SkillInfo = ({skill, color, select}) => {
    return <div className={`skill-info ${color.name}`} onClick={() => {select(skill)}}>
        <p>{skill.name}</p>
        <div className={"skill-info-total-progress"}>
            <p className={`skill-info-progress ${color.name}`} style={{ width: skill.percentage + "%" }}/>
        </div>
    </div>


}

export default SkillInfo