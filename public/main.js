const socket = io.connect();

fetch('/api/productos/')
	.then(response => response.json())

socket.on('products', data => {
	render(data);
}); 

let productTitle 
let productPrice
let productThumbnail

function createProduct(){
	const productDetails = {
		title: productTitle,
		price: productPrice,
		thumbnail: productThumbnail,
	}
	socket.emit('addproduct', productDetails)	
}

function submitForm(e){
	e.preventDefault()
    productTitle = document.getElementById('title').value;
	productPrice = document.getElementById('price').value;
	productThumbnail = document.getElementById('thumbnail');
	createProduct();
}

function render(data) {
	const html = data.map(prod=> {	
		return (`
			<tr>
				<td>${prod.title}</td>
				<td>$${prod.price}</td>
				<td><img src=${prod.thumbnail} width=70px/> </td>
			</tr>
		`)
	}).join(' ')
	document.getElementById('live-products').innerHTML = html;
}

// escuchamos message
socket.on('message', data => {
	console.log(data)
    chatRender(data)
})

// 	funcion para renderizar el chat
function chatRender(data){
	const html = data.map(message =>{
		return(
			`	
			<p>${message.user} [ ${message.date} ]: ${message.message}</p>
			`
		)
	}).join(' ')
	document.getElementById('chat').innerHTML = html;
}

// Emite mensaje al servidor

function sendMessage(e) {
	e.preventDefault()
    let msn = {
        user: document.getElementById('user').value,
        date: new Date().toLocaleTimeString(),
        message: document.getElementById('msg').value
    }
    socket.emit("new-message", msn);
}