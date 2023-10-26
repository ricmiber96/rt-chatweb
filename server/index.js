import express from 'express';
import logger from 'morgan'
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {Server} from 'socket.io'
import { createServer } from 'node:http';
import dotenv from 'dotenv';
import {createClient } from '@libsql/client'


dotenv.config()
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = process.env.PORT || 4000;

const app = express();
const server = createServer(app)
const io =  new Server(server,{
    connectionStateRecovery: {}
})

const db = createClient({
    url:'libsql://flowing-shamrock-ricmiber96.turso.io',
    authToken: process.env.DB_TOKEN
})

await db.execute(`CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT, user TEXT)`)

io.on('connection', async(socket)=> {
    console.log('New User connected')

    socket.on('disconnect',()=> {
        console.log('User disconnected')
    })

    socket.on('chat message',async (message)=> {
        let result
        const username = socket.handshake.auth.username ?? 'anonymus'
        try {
        
            result = await db.execute({
                sql: 'INSERT INTO messages (content, user) VALUES (:message, :username)',
                args: {message: message, username: username}
            })

        }catch {
            console.error('Error inserting message')
            return
        }
        io.emit('chat message',message, result.lastInsertRowid.toString(),username)
        console.log('message: ' + message);  
    })

    //Si no tuviera conexion me recupoera todos los mensajes enviados desde el ultimo descargado 
    if(!socket.recovered){
        try{
            const result = await db.execute({
                sql: 'SELECT id, content, user FROM messages WHERE id > ?',
                args: [socket.handshake.auth.serverOffset ?? 0]
            })

            result.rows.forEach(row => {
                socket.emit('chat message', row.content, row.id, row.user)
            })
        }
        catch(e){
            console.error(e)
        }
    }
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