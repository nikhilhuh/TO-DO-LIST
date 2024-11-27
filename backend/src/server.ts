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

// Socket.IO
io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => console.log('A user disconnected'));
});

// Start the server
server.listen(3000, () => console.log('Server running on port 3000'));
