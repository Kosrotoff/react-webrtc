import { io } from 'socket.io-client'

// в производственном режиме сервер и клиент будут находиться в одном источнике (origin),
// а в режиме для разработки - в разных
const SERVER_URI = 'http://localhost:4000';

const socket = io(SERVER_URI)

export default socket
