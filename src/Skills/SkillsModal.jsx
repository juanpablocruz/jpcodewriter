import React, { Component, useState } from 'react'
import { Skill } from './SkillItem';
import "./styles/SkillsModal.css"
import { Color } from '../Terminal/Terminal';
import SkillInfo from './SkillInfo';

const SkillsModal = ({skills, color}) => {
    const [selectedSkill,setSelectedSkill] = useState(null)
    const onSkillSelected = (skill) => setSelectedSkill(skill)
    return (
        <div className={`skills-modal ${color.name}`}>
            <div className={`skills-modal-progress ${color.name}`}>
                {
                    skills.map((e) => {
                        return e.conquered ? <SkillInfo key={e.name} color={color} select={onSkillSelected} skill={e} /> : ''
                    })
                }
            </div>
            <div className={`skills-modal-skill-info`}>
                {selectedSkill ? selectedSkill.description : null}
            </div>
        </div>
    )
}

export default SkillsModal