import React from 'react'

/**
 * 
 * @typedef {object} Message
 * @property {string} Message.msg
 * @property {string?} Message.type
 * @property {string?} Message.path 
 */

/**
 * 
 * @param {*} props 
 */
const TextHistoric = (props) => {
    return props.screenText.map((text, index) => {
        return <React.Fragment key={index}>
            <span style={{whiteSpace: "pre-line"}}>{`${ (text.type !== "output" && text.path) ? `[${text.path}] > ` : '  '} ${text.msg}`}</span><br />
        </React.Fragment>
    })
}

export default TextHistoric