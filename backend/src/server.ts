import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose, { Schema, Document } from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// Initialize express and server
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// MongoDB connection
const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
    throw new Error('MONGO_URL is not defined in .env file');
}

// MongoDB connection
mongoose
    .connect(MONGO_URL)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Define Task interface and schema
interface ITask extends Document {
    task: string;
    completed: boolean;
}

const TaskSchema = new Schema<ITask>({
    task: { type: String, required: true },
    completed: { type: Boolean, default: false },
});

const Task = mongoose.model<ITask>('Task', TaskSchema);

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/tasks', async (req: Request, res: Response): Promise<void> => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

app.post('/tasks', async (req: Request, res: Response): Promise<void> => {
    try {
        const newTask = new Task(req.body);
        await newTask.save();
        io.emit('taskAdded', newTask); // Notify clients
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ error: 'Failed to create task' });
    }
});

app.patch('/tasks/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedTask) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        io.emit('taskUpdated', updatedTask); // Notify clients
        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ error: 'Failed to update task' });
    }
});

app.delete("/tasks/:id", async(req: Request , res: Response): Promise<void>=>{
    try{
        const {id} = req.params;
        const deletedTask = await Task.findByIdAndDelete(id);
        if (!deletedTask) {
            res.status(404).json({ error: "Task not found" });
            return;
          }
          io.emit("taskDeleted",deletedTask)
        res.status(200).send({message: "Task deleted successfully!"})
    } catch (err) {
        res.status(400).json({error: "Failed to delte task"})
    }
})

interface IChatMessage extends Document {
    user: string;
    text: string;
    timestamp: string;
}

const ChatMessageSchema = new Schema<IChatMessage>({
    user: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: String, required: true },
});

const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);


// Socket.IO
io.on('connection', async (socket) => {
    console.log('A user connected');

    try {
        // Fetch all chat messages from MongoDB and send them to the client
        const chatLog = await ChatMessage.find().sort({ timestamp: 1 });
        socket.emit('chatLog', chatLog);
    } catch (err) {
        console.error('Error fetching chat log:', err);
    }

    // Listen for new messages
    socket.on('sendMessage', async (message: Omit<IChatMessage, 'timestamp'>) => {
        const chatMessage = new ChatMessage({
            ...message,
            timestamp: new Date().toISOString(),
        });

        try {
            await chatMessage.save(); // Save to MongoDB
            io.emit('newMessage', chatMessage); // Broadcast to all clients
        } catch (err) {
            console.error('Error saving message:', err);
        }
    });

    socket.on('typing', ({ user }) => {
        socket.broadcast.emit('userTyping', user); 
    });

    socket.on('stopTyping', ({ user }) => {
        socket.broadcast.emit('userStoppedTyping', user); 
    });

    socket.on('deleteMessage', async ({ timestamp }) => {
        try {
            // Delete the message from MongoDB
            const deletedMessage = await ChatMessage.findOneAndDelete({ timestamp });
            if (deletedMessage) {
                io.emit('messageDeleted', timestamp); 
            }
        } catch (err) {
            console.error('Error deleting message:', err);
        }
    });

    socket.on('disconnect', () => console.log('A user disconnected'));
});


// Start the server
server.listen(3000, () => console.log('Server running on port 3000'));
