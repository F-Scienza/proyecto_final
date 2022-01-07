const fs = require('fs')

class Cart{
    constructor(fileName){
        this.file = fileName
        this.countID = 0
        this.list = []
    }
    async init(){
        try{
            const data = await fs.promises.readFile(this.file)
            this.list = JSON.parse(data)
            for(const element of this.list){
                if(element.id > this.countID) this.countID = element.id
            }
        }
        catch (error){
            console.log('No se encontro el archivo!!, generando...')
        }
    }
    async write(){
        try{
            const str = JSON.stringify(this.list)
            await fs.promises.writeFile(this.file, str)
        }
        catch(err){
            return `Ocurrio un error al escrbir el archivo ${err}`
        }
    }
    async save(object){
        try{
            this.countID++
            object['id'] = this.countID
            this.list.push(object)
            await this.write()
            return this.countID
        }
        catch(err){
            return `Ocurrio un error al guardar el datos en el archivo${err}`
        }
    }
}

module.exports = Cart