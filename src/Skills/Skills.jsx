import React, { useState, useEffect } from 'react'
import skillsFile from "./skills_list.json"
import SkillsHeader from './SkillsHeader';
import Asteroids from './Asteroids';
import './styles/Skills.css'
import { Color } from '../Terminal/Terminal';
import { Skill } from './SkillItem.jsx';
import SkillsModal from './SkillsModal';

/**
 * 
 * @param {*} param0 
 * @param {*} param0.returnCallback
 * @param {Color} param0.color
 */
const Skills = ({ returnCallback, color }) => {
    const [skills, setSkills] = useState(skillsFile.skills)
    const [displayInfo, setDisplayInfo] = useState(false)

    const skillConquered = (skillName) => {
        setSkills(
            (prevSkills) => 
                prevSkills.map((skill) => skill.name === skillName ? { ...skill, conquered: true } : skill)
            )
    }
        

    return (
        <div>
            <SkillsHeader skills={skills} color={color.name} />
            <Asteroids skills={skills}
                skillConquered={skillConquered} 
                returnCallback={returnCallback} 
                color={color} 
                showInfo={() => setDisplayInfo((prevState) => !prevState)} 
            />
            {displayInfo ? <SkillsModal skills={skills} color={color} /> : null}
            <p className="help-text">Press ESC to exit | Press Tab for more info</p>
        </div>
    )
}
export default Skills