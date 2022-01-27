const express = require('express');
const Contenedor = require('./contenedor');
const Cart = require('./cart')
const multer = require('multer');
const path = require('path')
const http = require('http');
const { Router } = express;
const cart = Router()


/////////////////////////////////////////////////////
// express server
const app = express();
const httpServer = http.Server(app);
httpServer.listen(3000, ()=>{
	console.log('server on: 3000')
});

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/files', express.static('uploads'));
app.use(express.static('uploads'));

/////////////////////////////////////////////////////
// 	seteamos la carpeta views y el engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

/////////////////////////////////////////////////////
// 	inicializamos productos
const productos = new Contenedor(__dirname + '/data/productos.json');
productos.init();
//	inicializamos carrito
const carrito = new Cart(__dirname + 'data/cart.json')
carrito.init()

/////////////////////////////////////////////////////
// mensaje de bienvenida
const msg = new Contenedor(__dirname + '/data/messages.json')
msg.init()
const messages = []
/////////////////////////////////////////////////////
// seteamos el file con multer
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads');
	},
	filename: function (req, file, cb) {
		cb(null, file.originalname);
	},
});
const upload = multer({ storage });

//	mostramos el formulario
app.get('/', (req, res) => {
	res.sendFile('index.html', { root: __dirname });
});
app.get('/productList', (req, res) => {
	return res.render('productList.ejs', {
		productos: productos.productList,
	});
});

app.get('/cart', (req, res)=>{
	return res.render('cart.ejs')
})

/////////////////////////////////////////////////////
// 	Router productos
const routerProd = Router();
routerProd.get('/', (req, res) => {
	return res.json(productos.productList);
});
routerProd.get('/:id', async (req, res) => {
	let id = req.params.id; //leemos lo que pasó por url el usuario
	return res.json(await productos.getById(id));
});

//	usamos multer para guardar las imagenes
routerProd.post('/', upload.single('thumbnail'), async (req, res) => {
	let obj = req.body;
	obj.thumbnail = '/files/' + req.file.filename;
	await productos.addProduct(obj); // usamos el metodo save
	return res.redirect('/productList'); //redireccionamos a lista
});

routerProd.put('/:id', (req, res) => {
	let obj = req.body;
	let id = req.params.id;
	return res.json(productos.update(id, obj));
});
app.use('/api/productos/', routerProd);

// 	Router carrito
const routerCart = Router()
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

app.use('/api/carrito', routerCart)

/////////////////////////////////////////////////////
// web sockets

const io = require('socket.io');
const wsServer = io(httpServer);

let users = [];

wsServer.on('connection', (socket) => {
	users.push(socket);
	console.log('Usuario conectado. Total: ' + users.length)
	socket.on('disconnect', () => {
		users = users.splice(1, 1);
		console.log('Usuario desconectado. Total: ' + users.length);
	})
	const productList = productos.productList
	socket.emit('products', productList)
	socket.on('addproduct', async data => {
		await productos.addProduct(data);
		wsServer.emit('products', productList);
	});
	socket.on('message', data=>{
		console.log(data)
		io.sockets.emit('message', data)
	})
	socket.emit('message', msg.productList)
	socket.on('new-message', async (data) =>{
        data.time = new Date().toLocaleTimeString()
        data.date = new Date().toLocaleDateString()
        await msg.save(data)
        messages.push(data)
		console.log(messages)
        io.sockets.emit('messages', [data])
    })
})
