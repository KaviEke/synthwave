const io = require('./frontend/node_modules/socket.io-client');

// Connect perfectly to the backend without any hardware
const socket = io('http://localhost:5000');

socket.on('connect', () => {
    console.log('✅ Tester script connected to the Web App!');
    
    // 1. Tell the website our fake hardware is Active
    socket.emit('device_status', { active: true, deviceId: 'Virtual_Tester' });

    console.log('🥁 Playing a Drum kick...');
    // 2. Play a Drum
    socket.emit('note_played', { instrument: 'drum', note: 'Kick 1' });

    // 3. Play a Violin 2 seconds later
    setTimeout(() => {
        console.log('🎻 Playing a Violin note...');
        socket.emit('note_played', { instrument: 'violin', note: 'A4' });
    }, 2000);

    // 4. Play a Piano 4 seconds later
    setTimeout(() => {
        console.log('🎹 Playing a Piano chord...');
        socket.emit('note_played', { instrument: 'piano', note: 'C Major' });
    }, 4000);

    // Close the connection
    setTimeout(() => {
        console.log('👋 Test finished. Check the website!');
        process.exit(0);
    }, 6000);
});
