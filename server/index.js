import express from 'express';
import logger from 'morgan'
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {Server} from 'socket.io'
import { createServer } from 'node:http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = process.env.PORT || 4000;

const app = express();
const server = createServer(app)
const io =  new Server(server)
io.on('connection',()=> {
    console.log('User connected')
})
app.use(logger('dev'))

app.use(express.static(path.join(__dirname, '../client')))

// app.get('/', (req, res) => {
//     res.sendFile(process.cwd() + '/client/style.css')
//     res.sendFile(process.cwd() + '/client/index.html')
// })

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Send the HTML file
});



server.listen(port,()=>{
    console.log('listening on port '+port)
})