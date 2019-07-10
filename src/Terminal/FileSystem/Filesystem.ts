import { IO } from 'ramda-fantasy'
import pipe from 'ramda/es/pipe';

export interface Folder {
    id: number
    id_parent?: number
    fullPath: string
    name: string
    type: 'Folder' | 'File'
    [key: string]: any
}

export default class Filesystem {
    currentFolder: number
    directoryTree: any
    fileSystem: Folder[]

    constructor() {
        this.fileSystem = this.getSavedFS().runIO()

        const originalData = [
            { id: 1, id_parent: 0, fullPath: '/usr', name: 'usr', type: 'Folder' },
            { id: 2, id_parent: 1, fullPath: '/usr/home', name: 'home', type: 'Folder' },
        ].map((e) => this.insertIfNotExists(e).runIO())

        this.currentFolder = 1
    }

    getSavedFS = () => {
        return IO(() => localStorage.getItem("fs") ? JSON.parse(localStorage.getItem("fs") || JSON.stringify([])) : [])
    }

    getCurrentFolder = () => this.fileSystem[this.currentFolder]

    insertIfNotExists = (data: any) => {
        const getCurrentId = () => { const current = this.getCurrentFolder(); return current ? current.id : 0 }
        const newfileSystem = this.fileSystem.find(f => f.fullPath === data.fullPath || f.name === data.name)
            ? this.fileSystem : this.fileSystem.concat({
                id: data.id_parent ? data.id : this.fileSystem.length + 1,
                id_parent: data.id_parent ? data.id_parent : getCurrentId(),
                fullPath: data.fullPath,
                name: data.name,
                type: data.type
            })
        return this.updateFS(newfileSystem)
    }

    createFolder = (folderName: string) => (
        this.insertIfNotExists({
            fullPath: this.fileSystem[this.currentFolder].fullPath + "/" + folderName,
            name: folderName,
            type: "Folder"
        })
    )

    createFile = ({ fileName, contents }: { fileName: string, contents?: string }) => {
        return this.insertIfNotExists({
            fullPath: this.fileSystem[this.currentFolder].fullPath + "/" + fileName,
            name: fileName,
            type: "File",
            contents: contents ? contents : ""
        })
    }

    getCurrentFolderContents = () => {
        const parentAndCurr = this.getCurrAndParent(this.getCurrentFolder())
        return parentAndCurr.concat(this.fileSystem.filter(e => e.id_parent === this.fileSystem[this.currentFolder].id))
    }

    getFileContents = (file: string) => {
        const getFile = (file:string) => this.fileSystem.filter(e => e.name === file)
        const getContents = (files: any) => files.reduce((prev:string, file:Folder) => file.contents ? prev + file.contents : prev, "")
        return pipe(getFile, getContents)(file)
    }

    removeElement = (fileName: string) => {
        const newfileSystem = this.fileSystem.filter(e => fileName.split("/").length > 1 ? e.fullPath !== fileName: e.name !== fileName)
        return this.updateFS(newfileSystem)
    }

    updateFS = (newFileSystem: any) => {
        this.fileSystem = newFileSystem
        return IO(() => {localStorage.setItem("fs", JSON.stringify(newFileSystem)); return ""})
    }

    saveFileContents = ({ id, contents }: { id: number, contents: string }) => {
        const newfileSystem = this.fileSystem.map(item => item.id === id ? Object.assign({}, item, { contents }) : item)
        return this.updateFS(newfileSystem)
    }
    getCurrAndParent = (folder?: Folder) => {
        if (!folder) return []
        let parent: any, curr: any = []
        curr = [
            { id: folder.id, name: ".", id_parent: folder.id_parent, fullPath: folder.fullPath, type: "Folder" },
        ]
        const itemParent = this.fileSystem.find(e => e.id === folder.id_parent)
        if (itemParent) {
            return curr.concat([
                { id: itemParent.id, name: "..", id_parent: itemParent.id, fullPath: itemParent.fullPath, type: "Folder" }
            ])
        }
        return curr
    }

    getFolderFromString = (folder: string) =>
        folder === '.' ? this.fileSystem.find(e => e.id_parent === this.fileSystem[this.currentFolder].id) :
            folder === '..' ? this.fileSystem.find(e => e.id === this.fileSystem[this.currentFolder].id_parent) :
                folder.split("/").length > 1 ? this.fileSystem.find(e => e.fullPath === folder) :
                    this.fileSystem.find(e => e.name === folder)


    getFolderContents = (folder: string) => {
        const gatherFolderContents = (contents: Folder[]) => {
            const current = contents.find((e: Folder) => e.name === ".")
            return current ? contents.concat(this.fileSystem.filter(e => e.id_parent === current.id)) : contents
        }
        return (pipe(this.getFolderFromString, this.getCurrAndParent, gatherFolderContents)(folder))
    }

    changeToFolder = (folderName: string) => {
        const destFolder = this.getFolderFromString(folderName)
        if (destFolder) {
            this.currentFolder = this.fileSystem.indexOf(destFolder)
        }
        return null
    }

    getFolder = (id: number) => this.fileSystem.find(e => e.id === id)

}