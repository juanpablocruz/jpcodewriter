

export interface Folder {
    id: number
    id_parent?: number
    fullPath: string
    name: string
    type: string
}
interface FolderHolder {
    current: Folder
    contents: Folder[]
}

export default class Filesystem {
    version: string
    dbInstance: any
    currentFolder: Folder
    currentFolderContents: Folder[]
    directoryTree: any

    constructor() {
        this.version = '1.0'

        this.dbInstance = window.openDatabase('filesystem2', this.version, 'Client side filesystem', 2 * 1024 * 1024, () => console.info("Database created"))
        if (this.dbInstance) {
            this.dbInstance.transaction((tran: any) => {
                tran.executeSql('CREATE TABLE IF NOT EXISTS FileSystem(id_parent integer, full_path text, type text, name text)')
                tran.executeSql('CREATE TABLE IF NOT EXISTS FileSystem_details(id_file integer, details text)')
                this.insertIfNotExists([0, "/usr", "usr", "folder"], tran)
                this.insertIfNotExists([1, "/usr/home", "home", "folder"], tran)
            })
        } else {
            console.error("no instance")
        }

        
        this.currentFolder = { id: 2, fullPath: "/usr/home", name: "home", type: "folder", id_parent: 1 }
        this.currentFolderContents = []

        this.getInitialFolder()

        
    }

    async getInitialFolder() {
        let folder:any = await this.getFolder(this.currentFolder.id)

        this.currentFolder = folder.current
        this.currentFolderContents = this.appendCurrentAndParentFolder(folder.contents)
    }

    insertIfNotExists(data: any, tran: any) {
        return new Promise((resolve, reject) => {
            tran.executeSql("SELECT * FROM FileSystem WHERE id_parent=? and full_path=? and name=? and type=?", data, (tx: any, rs: any) => {
                if (!rs.rows.length) {
                    tran.executeSql('insert into FileSystem (id_parent, full_path, name, type) values (?, ?, ?, ?) ', data, (tx: any, rs: any) => {
                        if (resolve)
                            resolve(rs.insertId)
                    })
                }
            })
        })
    }

     createFolder(folderName: string) {
        this.dbInstance.transaction(async(tran: any) => {
            let data = [this.currentFolder.id, this.currentFolder.fullPath + "/" + folderName, folderName, "folder"]
            this.insertIfNotExists(data, tran)
            let folder:any = await this.getFolder(this.currentFolder.id)
            let holder = folder as FolderHolder
            this.currentFolder = holder.current
            this.currentFolderContents = this.appendCurrentAndParentFolder(holder.contents)
        })
    }

    createFile(fileName: string, contents?: string) {
        this.dbInstance.transaction(async (tran: any) => {
            let data = [this.currentFolder.id, this.currentFolder.fullPath + "/" + fileName, fileName, "file"]
            let id = await this.insertIfNotExists(data, tran)

            tran.executeSql("INSERT INTO FileSystem_details (id_file, details) VALUES (?, ?)", [id, contents ? contents : ""])

            let folder:any= await this.getFolder(this.currentFolder.id)
            this.currentFolder = folder.current
            this.currentFolderContents = this.appendCurrentAndParentFolder(folder.contents)
        })
    }

    getCurrentFolderContents() {
        return this.currentFolderContents
    }

    getFileContents(file: string) {
        return new Promise(resolve => {
            this.dbInstance.transaction((tran: any) => {
                tran.executeSql("SELECT d.rowid, d.*, f.* FROM FileSystem_details d INNER JOIN FileSystem f ON d.id_file = f.rowid WHERE f.name = ?", [file], (tx: any, rs: any) => {
                    if (rs.rows.length) {
                        resolve(Array.from(rs.rows))
                    }
                })
            })
        })
    }

    removeElement(fileName: string) {
        return new Promise(async (resolve, reject) => {
            let fullPath = this.currentFolder.fullPath + "/" + fileName
            this.dbInstance.transaction(async (tran: any) => {
                let doesExist = async (fullPath: string, tran: any) => {
                    return new Promise((resolve, reject) => {
                        tran.executeSql("SELECT rowid, * FROM FileSystem WHERE full_path = ?",
                            [fullPath],
                            (tx: any, rs: any) => {
                                resolve(rs.rows)
                            })
                    })
                }
                let exist: any = await doesExist(fileName, tran)
                if (exist.length) {
                    let deleteFile = async (fullPath: string, tran: any) => {
                        return new Promise((resolve, reject) => {
                            tran.executeSql("DELETE FROM FileSystem WHERE full_path=?",
                                [fullPath],
                                (tx: any, rs: any) => {
                                    resolve(rs)
                                }, (tx: any, err: any) => reject(err))
                        })
                    }

                    await deleteFile(fullPath, tran)
                    let folder:any = await this.getFolder(this.currentFolder.id)
                    this.currentFolder = folder.current
                    this.currentFolderContents = this.appendCurrentAndParentFolder(folder.contents)
                    

                    if (exist[0].type === "file") {
                        let deleteFileDetails = async (rowId: number, tran: any) => {
                            return new Promise((resolve, reject) => {
                                tran.executeSql("DELETE FROM FileSystem_details WHERE id_file=?",
                                    [rowId],
                                    (tx: any, rs: any) => { resolve() },
                                    (tx: any, err: any) => reject(err))
                            })
                        }
                        await deleteFileDetails(exist[0].rowid, tran)
                    }

                    resolve()
                }

            })
        })

    }

    saveFileContents(id: number, contents: string) {
        return new Promise((resolve, reject) => {
            this.dbInstance.transaction((tran: any) => {
                tran.executeSql("UPDATE FileSystem_details set details = ? WHERE id_file=?",
                    [contents, id],
                    (tx: any, rs: any) => resolve(rs),
                    (tx: any, err: any) => reject(err)
                )
            })
        })

    }

    getFolderContents(folder: string) {
        return new Promise(resolve => {
            this.dbInstance.transaction((tran: any) => {

                let query = "SELECT fs.rowid,fs.* FROM FileSystem fs inner join FileSystem fs2 on fs.id_parent = fs2.rowid where "
                let args: string | number | undefined = ""
                if (folder === '.') {
                    query = `${query} fs2.id_parent=?`
                    args = this.currentFolder.id
                } else if (folder === '..') {
                    query = `${query} fs2.id_parent=?`
                    args = this.currentFolder.id_parent
                } else if (folder.split("/").length > 1) {
                    query = `${query} fs2.full_path=?`
                    args = folder
                } else {
                    query = `${query} fs2.name=?`
                    args = folder
                }
                tran.executeSql(query, [args], (tx: any, rs: any) => {
                    if (rs.rows.length) {
                        resolve(this.mapToFolder(rs.rows))
                    } else {
                        resolve([])
                    }

                })

            })
        })

    }

    mapToFolder(data: any) {
        return Object.values(data).map((el: any) => ({ id: el.rowid, fullPath: el.full_path, name: el.name, type: el.type, id_parent: el.id_parent }))
    }

    appendCurrentAndParentFolder(data: Folder[]) {
        let newData = []
        let thisDir = { id: this.currentFolder.id, name: ".", fullPath: this.currentFolder.fullPath, type: this.currentFolder.type, id_parent: this.currentFolder.id_parent }
        newData.push(thisDir)
        if (this.currentFolder.id_parent) {
            let prevFolder = this.currentFolder.fullPath.split("/")
            prevFolder.pop()
            newData.push({ id: this.currentFolder.id_parent, fullPath: prevFolder.join("/"), name: "..", type: this.currentFolder.type })
        }

        newData = newData.concat(data)

        return newData
    }

    async changeToFolder(folderName: string) {
        let folderExists = false
        let foundFolder: Folder = { id: 0, fullPath: "", name: "", type: "" }
        for (let folder of this.currentFolderContents) {
            if (folder.name === folderName) {
                folderExists = true
                foundFolder = folder
                break
            }
        }
        if (foundFolder.name === '.') {
            foundFolder = this.currentFolder
            return;
        }


        if (folderExists && foundFolder) {
            this.currentFolder = foundFolder
            let folder:any = await this.getFolder(this.currentFolder.id)
            let holder = folder as FolderHolder
            this.currentFolder = holder.current
            this.currentFolderContents = this.appendCurrentAndParentFolder(holder.contents)
        }
    }

    getFolder(id: number) {
        return new Promise((resolve, reject) => {
            this.dbInstance.transaction(async (tran: any) => {
                let fetchFolder = async (id: number, tran: any) => {
                    return new Promise((resolve, reject) => {
                        tran.executeSql("SELECT rowid, * FROM FileSystem WHERE rowid=?", [id], (tx: any, rs: any) => {
                            if (rs.rows.length) {
                                resolve(this.mapToFolder(rs.rows)[0])
                            }
                        })
                    }
                    )
                }

                let fetchFolderContents = async (id:number, tran: any) => {
                    return new Promise((resolve, reject) => {
                        tran.executeSql("SELECT rowid,* FROM FileSystem WHERE id_parent=?", [id], (tx: any, rs: any) => {
                            if (rs.rows.length) {
                                resolve(this.mapToFolder(rs.rows))
                            } else {
                                resolve([])
                            }
        
                        })
                    })
                }

                let current = await fetchFolder(id, tran)
                let folderContents = await fetchFolderContents(id,tran)

                resolve({current: current, contents: folderContents})

            })
        })

    }

}