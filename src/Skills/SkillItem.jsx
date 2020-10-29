import React from 'react'
import './styles/SkillItem.css'

/**
 * @typedef {object} Skill
 * @property {string} Skill.name
 * @property {number} Skill.percentage
 * @property {string} Skill.description
 * @property {boolean} Skill.conquered
 */

/**
 * 
 * @param {*} param0 
 * @param {Skill} param0.skill
 * @param {string} param0.color
 */
const SkillItem = ({skill, color}) => {
    return <div className={`skill-badge ${skill.conquered?'conquered':''} ${color}`}><span>{skill.name}</span></div>
}
export default SkillItem