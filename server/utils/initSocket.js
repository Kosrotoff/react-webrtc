import { nanoid } from 'nanoid'

const users = {}


// функция принимает `id` адресата, тип события и полезную нагрузку - данные для передачи
const emit = (userId, event, data) => {
    // определяем получателя
    const receiver = users[userId];
    if (receiver) {
        // вызываем событие
        receiver.emit(event, data);
    }
};

let countId = 0;

// функция принимает сокет
export default function initSocket(socket) {
    let id;
    
    socket
        .on('init', () => {
            id = countId++;
            users[id] = socket
            console.log(id, 'connected')
            socket.emit('init', { id })
        })
        .on('request', (data) => {
            emit(data.to, 'request', { from: id })
        })
        .on('call', (data) => {
            emit(data.to, 'call', { ...data, from: id })
        })
        .on('end', (data) => {
            emit(data.to, 'end')
        })
        .on('disconnect', () => {
            delete users[id]
            console.log(id, 'disconnected')
        })
}
