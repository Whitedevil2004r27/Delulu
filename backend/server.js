const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000";
const io = new Server(server, {
    cors: {
        origin: allowedOrigin,
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

// API endpoint to serve the letter content
app.get('/api/letter', (req, res) => {
    res.json({
        hero: {
            label: "A little something from the heart",
            heading: "For Delulu",
            subtitle: "Because some feelings do not need a label to be real"
        },
        letter: {
            paragraphs: [
                "Hey Delulu,",
                "I do not fully know what to call this feeling. Love? Friendship? Maybe it is something in between that does not need a name to feel absolutely real.",
                "Every time we talk something in me feels lighter. You make the ordinary feel warmer. You make me happy in a way I cannot quite explain and honestly I do not want to.",
                "So here is my honest question the one I have been carrying quietly. Are you here for me always?",
                "Because I am. Always."
            ],
            signature: "- Ravi"
        },
        always: {
            text: "Always.",
            subText: "Whatever this is it is beautiful"
        },
        footer: {
            textLine1: "Made with quiet love",
            textLine2: "Ravi to Delulu"
        }
    });
});

// APIs for Memories Timeline
app.get('/api/memories', (req, res) => {
    res.json([
        { id: 1, date: "The Beginning", title: "Our First Talk", text: "When we first spoke, I didn't know how much you'd come to mean to me." },
        { id: 2, date: "The Spark", title: "That One Joke", text: "We laughed until it hurt. That was the moment everything felt different." },
        { id: 3, date: "The Realization", title: "Quiet Moments", text: "It's not just the exciting times, it's the quiet moments with you that I cherish." }
    ]);
});

// Reply API
app.post('/api/reply', (req, res) => {
    const { answer } = req.body;
    console.log(`\n💖 DELULU HAS REPLIED: "${answer.toUpperCase()}" at ${new Date().toLocaleString()} 💖\n`);
    res.json({ success: true, message: "Response recorded!" });
});

// WebSockets
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // When Ravi clicks the secret button
    socket.on('thinking_of_you', () => {
        console.log('Ravi is thinking of Delulu! Broadcasting burst...');
        // Broadcast the burst to all other connected clients
        socket.broadcast.emit('trigger_burst');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Delulu backend (with WebSockets) running on port ${PORT}`);
});
