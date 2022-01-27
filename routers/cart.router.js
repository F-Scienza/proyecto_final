const express = require('express')
const { Router } = express
const routerCart = Router()

routerCart.use(express.json())
routerCart.use(express.urlencoded({extended: true}))

routerCart.get("/", (req,res)=>{
	return res.json(cart.list)
})
routerCart.post("/", (req,res)=>{
	let obj = req.body
	let saveCart = res.json(cart.save(obj))
	cart.write()
	return saveCart
})
routerCart.delete("/:id", (req,res)=>{
	let id = req.params.id
    let deleted = res.json(cart.delete(id))
    cart.write()
    return deleted
})
routerCart.get("/:id/productos", (req,res)=>{
    let id = req.params.id
    return res.json(cart.find(id).productos)
})
routerCart.post("/:id/productos", (req,res)=>{
	let obj = req.body
    let id = req.params.id
    let post = res.json(cart.cartInsert(id,obj))
    cart.write()
    return post
})
routerCart.delete("/:id/productos", (req,res)=>{
	let idCart = req.params.id
    let idProd = req.params.idprod
    let deleted = res.json(cart.cartDelete(idCart, idProd))
    cart.write()
    return(deleted)
})

module.exports = routerCart