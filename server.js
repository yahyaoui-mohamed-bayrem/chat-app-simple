const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

//  connect to mongo
mongo.connect('mongodb://localhost:27017/mongochat', (err, cl) => {
    if (err) { throw err; }
    console.log('mongodb connected ..')

    // connect to socket.io
    client.on('connection', (socket) => {
        const db = cl.db('mongochat');
        let chat = db.collection('chats');
        // create function to send status to server
        sendStatus = s => { socket.emit('status', s) } //when ever we want to pass smthing from back(server) to front(client) use emit
        // get chats from mongo collection
        chat.find().limit(100).sort({ _id: 1 }).toArray((err, result) => {
            if (err) { throw err; }
            // emit the msgs
            socket.emit('output', result);
        });
        // handle input events
        socket.on('input', data => {
            let { name, message } = data;
            // check for name & message
            if (name === '' || message === '') {
                sendStatus('Please include your name and message');
            } else {
                //  insert message
                chat.insertOne({ name, message }, () => {
                    client.emit('output', [data]);
                    // send status object
                    sendStatus({ message: 'Message sent', clear: true });
                });
            }
        });
        // Handle clear
        socket.on('clear', data => {
            // remove all chats from collection
            chat.deleteMany({}, () => socket.emit('cleared'))
        })

    });
});