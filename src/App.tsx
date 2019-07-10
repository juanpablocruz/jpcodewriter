import React from 'react';
import './App.css';
import Terminal, { appendOutput } from './Terminal/Terminal';

const about = (args: string[], screenText: string) => (
  appendOutput(screenText)(["HI, MY NAME IS JUAN PABLO",
    "IM NOT VERY GOOD ON TALKING ABOUT MYSELF SO I DECIDED TO CREATE",
    "THIS WEBSITE IN ORDER TO LET IT SPEAK FOR ME.",
    "SO GO TAKE A LOOK AROUND AND PLAY, AS THIS IS WHO I AM."])
)

const contact = (args: string[], screenText:string) => {
  let contactInf: { [key: string]: string } = {
    "NAME": "JUAN PABLO CRUZ",
    "EMAIL": "juanpablocruzmaseda@gmail.com",
    "GITHUB": "https://github.com/juanpablocruz",
    "LINKEDIN": "https://www.linkedin.com/in/juanpablocruzmaseda",
  }
  if (args.length === 0) {
    let contactOptions = []
    for (let c in contactInf) {
      contactOptions.push(`${c}:\t\t${contactInf[c]}`)
    }
    return appendOutput(screenText)(contactOptions)
  } else {
    let option = args[0]
    switch (option) {
      case "NAME":
      case "name":
        break;
      case "EMAIL":
      case "email":
        window.open(`mailto:${contactInf["EMAIL"]}`, "_self")
        break;
      case "GITHUB":
      case "github":
        window.open(contactInf["GITHUB"], '_blank')
        break;
      case "LINKEDIN":
      case "linkedin":
        window.open(contactInf["LINKEDIN"], '_blank')
        break;
      default:
        appendOutput(screenText)([`Unrecognized contact: ${option}`])
        break;

    }
  }
}

const work = (args: string[], screenText: string) => {
  let work = [
    'Software architect at DIGI - (jan 2018 - current ) ',
    'Design and implementation of the architecture of new web applications,',
    'using technologies like GraphQL, React, JavaScript, Zend Framework 2/3',
    '',
    'Senior software developer at DIGI - ( oct 2016 - dec 2017 ) ',
    'Porting the company website from perl to php over zend framework 2 and microsoft sql server.',
    'Desing of the software architecture over zend framework.',
    'Implementation and integration of Webservices.',
    'Design and implementation of the internal API with PHP and GraphQL',
    'Scrum methodology with daily meetings with the matrix in english/ romanian.',
    'Cache and log implementation over microsoft sql server and mongodb.',
    '',
    'Freelance software architect at JPD - ( 2014 - current )',
    'Design of the software architecture and implementation of a web framework in php.',
    'Design and development of microcontrollers in assembler and C intended for medical use.',
    'Design and production of peristaltic controllers and its software development in assembler and C over arduino.',
    'Backend and fronend development of websites over custom frameworks with php, mysql, javascript, ',
    'jquery, .net and oracle. Design and development of android applications in java.',
    '',
    'Software architect at Estrada Design - ( may 2013 - jun 2014)',
    'Maintenance and development of the website manuelestrada.com.',
    'Design and development in css3, html5, javascript and php of a exhibitions website for estrada design.',
    'Design and development in javascript of an application for building corporative graphs for Cores.',
    'Development of html newsletters for Repsol. Development of a microsite for Repsol.',
    'Web development in drupal and php for Cores.',
    'Cover designs and layout for Alianza Editorial books. Graphic design of anual reports for Repsol.',
    'Layout of the "Guia Repsol". Web development of Tourespaña for the tourism secretary of the state.',
    'Web development for altafonte.',
    'Tools and technologies used: Photoshop, illustrator, inDesign, php, javascript,',
    'html5, html, css3, jQuery, mysql.',
    '',]
  return appendOutput(screenText)(work)
}

const studies = (args: string[], screenText: string) => {
  let studies = [
    'Universidad Complutense de Madrid - (2010 - 2013)',
    'Maths degree',
    '',
    'IES Virgen de la Paloma - (2012 - 2013)',
    'Multiplatform apps development',]
  appendOutput(screenText)(studies)
}

const commands = {
  about: { command: about, description: "info about me" },
  contact: { command: contact, description: "how to contact", man: "contact <key> will open the contact." },
  work: { command: work, description: "displays work info" },
  studies: { command: studies, description: "displays studies info" }
}

const App = (props: any) => {
  return (<div
    className="App"
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100%"
    }}
  >
    <Terminal style={{ fontWeight: 'bold', fontSize: '1em' }}
      commands={commands}
      msg="Welcome to Juan Pablo Cruz Maseda's personal page. Try typing 'help'."
    />
  </div>)
}

export default App;
