import React from 'react'

export interface Message {
    msg: string
    type?: string,
    path ?: string
}

const TextHistoric = (props: any) => {
    console.log(props.screenText)
    return props.screenText.map((text: Message, index: number) => {
        return <React.Fragment key={index}>
            <span style={{whiteSpace: "pre-line"}}>{`${ (text.type !== "output" && text.path) ? `[${text.path}] > ` : '  '} ${text.msg}`}</span><br />
        </React.Fragment>
    })
}

export default TextHistoric