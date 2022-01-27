import routerCart from './cart.router';

const express = require('express')
const { Router } = express

const routerProd = Router();

routerProd.use(express.json())
routerProd.use(express.urlencoded({extended: true}))

routerProd.get('/', (req, res) => {
	return res.json(products.productList);
});
routerProd.get('/:id', async (req, res) => {
	let id = req.params.id; //leemos lo que pasó por url el usuario
	return res.json(await products.getById(id));
});

//	usamos multer para guardar las imagenes
routerProd.post('/', upload.single('thumbnail'), async (req, res) => {
	let obj = req.body;
	obj.thumbnail = '/files/' + req.file.filename;
	await products.addProduct(obj); // usamos el metodo save
	return res.redirect('/productList'); //redireccionamos a lista
});

routerProd.put('/:id', (req, res) => {
	let obj = req.body;
	let id = req.params.id;
	return res.json(products.update(id, obj));
});

module.exports = routerProd