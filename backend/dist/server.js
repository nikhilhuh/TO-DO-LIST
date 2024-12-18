"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const mongoose_1 = __importStar(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Initialize express and server
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, { cors: { origin: '*' } });
// MongoDB connection
const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) {
    throw new Error('MONGO_URL is not defined in .env file');
}
// MongoDB connection
mongoose_1.default
    .connect(MONGO_URL)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch((err) => console.error('MongoDB connection error:', err));
const TaskSchema = new mongoose_1.Schema({
    task: { type: String, required: true },
    completed: { type: Boolean, default: false },
});
const Task = mongoose_1.default.model('Task', TaskSchema);
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// API Routes
app.get('/tasks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const tasks = yield Task.find();
        res.json(tasks);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
}));
app.post('/tasks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newTask = new Task(req.body);
        yield newTask.save();
        io.emit('taskAdded', newTask); // Notify clients
        res.status(201).json(newTask);
    }
    catch (err) {
        res.status(400).json({ error: 'Failed to create task' });
    }
}));
app.patch('/tasks/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updatedTask = yield Task.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedTask) {
            res.status(404).json({ error: 'Task not found' });
            return;
        }
        io.emit('taskUpdated', updatedTask); // Notify clients
        res.json(updatedTask);
    }
    catch (err) {
        res.status(400).json({ error: 'Failed to update task' });
    }
}));
app.delete("/tasks/:id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const deletedTask = yield Task.findByIdAndDelete(id);
        if (!deletedTask) {
            res.status(404).json({ error: "Task not found" });
            return;
        }
        io.emit("taskDeleted", deletedTask);
        res.status(200).send({ message: "Task deleted successfully!" });
    }
    catch (err) {
        res.status(400).json({ error: "Failed to delte task" });
    }
}));
const ChatMessageSchema = new mongoose_1.Schema({
    user: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: String, required: true },
});
const ChatMessage = mongoose_1.default.model('ChatMessage', ChatMessageSchema);
// Socket.IO
io.on('connection', (socket) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('A user connected');
    try {
        // Fetch all chat messages from MongoDB and send them to the client
        const chatLog = yield ChatMessage.find().sort({ timestamp: 1 });
        socket.emit('chatLog', chatLog);
    }
    catch (err) {
        console.error('Error fetching chat log:', err);
    }
    // Listen for new messages
    socket.on('sendMessage', (message) => __awaiter(void 0, void 0, void 0, function* () {
        const chatMessage = new ChatMessage(Object.assign(Object.assign({}, message), { timestamp: new Date().toISOString() }));
        try {
            yield chatMessage.save(); // Save to MongoDB
            io.emit('newMessage', chatMessage); // Broadcast to all clients
        }
        catch (err) {
            console.error('Error saving message:', err);
        }
    }));
    socket.on('typing', ({ user }) => {
        socket.broadcast.emit('userTyping', user); // Notify other users
    });
    socket.on('stopTyping', ({ user }) => {
        socket.broadcast.emit('userStoppedTyping', user); // Notify other users
    });
    // Listen for delete message event
    socket.on('deleteMessage', (_a) => __awaiter(void 0, [_a], void 0, function* ({ timestamp }) {
        try {
            // Delete the message from MongoDB
            const deletedMessage = yield ChatMessage.findOneAndDelete({ timestamp });
            if (deletedMessage) {
                io.emit('messageDeleted', timestamp); // Notify all clients
            }
        }
        catch (err) {
            console.error('Error deleting message:', err);
        }
    }));
    socket.on('disconnect', () => console.log('A user disconnected'));
}));
// Start the server
server.listen(3000, () => console.log('Server running on port 3000'));
