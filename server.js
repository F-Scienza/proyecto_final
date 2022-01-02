const express = require('express');
const Contenedor = require('./contenedor');
const multer = require('multer');
const path = require('path')
const http = require('http');
const { Router } = express;

/////////////////////////////////////////////////////
// express server
const app = express();
const httpServer = http.Server(app);
httpServer.listen(8080, ()=>{
	console.log('server on: 8080')
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
// inicializamos productos
const productos = new Contenedor(__dirname + '/data/productos.json');
productos.init();


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

/////////////////////////////////////////////////////
// 	Router
const router = Router();

router.get('/', (req, res) => {
	return res.json(productos.productList);
});
router.get('/:id', async (req, res) => {
	let id = req.params.id; //leemos lo que pasó por url el usuario
	return res.json(await productos.getById(id));
});

//	usamos multer para guardar las imagenes
router.post('/', upload.single('thumbnail'), async (req, res) => {
	let obj = req.body;
	obj.thumbnail = '/files/' + req.file.filename;
	await productos.addProduct(obj); // usamos el metodo save
	return res.redirect('/productList'); //redireccionamos a lista
});

router.put('/:id', (req, res) => {
	let obj = req.body;
	let id = req.params.id;
	return res.json(productos.update(id, obj));
});

app.use('/api/productos/', router);

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
