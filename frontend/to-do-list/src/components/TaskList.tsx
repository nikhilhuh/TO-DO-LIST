// TaskList.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../hooks/useSocket';
import { Task } from '../types/task';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;;

if (!BACKEND_URL) {
    console.error("Backend URL is not defined in environment variables!");
}

const API_URL = `${BACKEND_URL}/tasks`;

const TaskList: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState<string>('');

    const fetchTasks = async () => {
        const response = await axios.get<Task[]>(API_URL);
        setTasks(response.data);
    };

    const addTask = async () => {
        if (!newTask.trim()) return;
        const response = await axios.post<Task>(API_URL, { task: newTask });
        setNewTask('');
        setTasks((prev) => [...prev, response.data]);
    };

    const toggleTask = async (task: Task) => {
        const updatedTask = { ...task, completed: !task.completed };
        await axios.patch(`${API_URL}/${task._id}`, updatedTask);
    };

    // Handle real-time updates
    useSocket('taskAdded', (task: Task) => setTasks((prev) => [...prev, task]));
    useSocket('taskUpdated', (updatedTask: Task) => {
        setTasks((prev) =>
            prev.map((task) => (task._id === updatedTask._id ? updatedTask : task))
        );
    });

    useEffect(() => {
        fetchTasks();
    }, []);

    return (
        <div className="max-w-lg mx-auto mt-10 p-4 bg-gray-100 rounded shadow">
            <h1 className="text-xl font-bold text-center mb-4">To-Do List</h1>
            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Add a task"
                    className="flex-grow p-2 border border-gray-300 rounded"
                />
                <button
                    onClick={addTask}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Add
                </button>
            </div>
            <ul>
                {tasks.map((task) => (
                    <li
                        key={task._id}
                        className={`p-2 flex justify-between items-center rounded mb-2 ${
                            task.completed ? 'bg-green-200' : 'bg-gray-200'
                        }`}
                    >
                        <span
                            className={`cursor-pointer ${
                                task.completed ? 'line-through' : ''
                            }`}
                            onClick={() => toggleTask(task)}
                        >
                            {task.task}
                        </span>
                        <span
                            className={`text-sm ${
                                task.completed ? 'text-green-600' : 'text-red-600'
                            }`}
                        >
                            {task.completed ? 'Completed' : 'Pending'}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TaskList;
