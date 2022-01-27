const express = require('express');
const Contenedor = require('./contenedor');
const Cart = require('./cart')
const multer = require('multer');
const path = require('path')
const http = require('http');

const routerCart = require('./routers/cart.router')
const routerProd = require('./routers/cart.router')

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
const now = new Date().toLocaleTimeString()
const welcomeMsg = {
	"user":"Admin","message":"Bienvenido","date": now
}
msg.addProduct(welcomeMsg)
///////////////////
//////////////////////////////////
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
app.use('/api/productos/', routerProd);
// 	Router carrito
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
