// TaskList.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSocket } from "../hooks/useSocket";
import { Task } from "../types/task";
import { FaTrash } from "react-icons/fa";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

if (!BACKEND_URL) {
  console.error("Backend URL is not defined in environment variables!");
}

const API_URL = `${BACKEND_URL}/tasks`;

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>("");

  const fetchTasks = async () => {
    const response = await axios.get<Task[]>(API_URL);
    setTasks(response.data);
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    const response = await axios.post<Task>(API_URL, { task: newTask });
    setNewTask("");
    setTasks((prev) => {
      // Check if the task already exists in the list
      if (prev.some((existingTask) => existingTask._id === response.data._id)) {
        return prev; // Do not add the task if it already exists
      }
      return [...prev, response.data];
    });
  };

  const toggleTask = async (task: Task) => {
    const updatedTask = { ...task, completed: !task.completed };
    await axios.patch(`${API_URL}/${task._id}`, updatedTask);
  };

  const deleteTask = async (taskId: string) => {
    try {
      await axios.delete(`${API_URL}/${taskId}`);
      setTasks((prev) => prev.filter((task) => task._id !== taskId)); // Remove from state
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Handle real-time updates
  useSocket("taskAdded", (task: Task) => {
    setTasks((prev) => {
      if (prev.some((existingTask) => existingTask._id === task._id)) {
        return prev; // Task already exists, do not add again
      }
      return [...prev, task]; // Add new task if it doesn't exist
    });
  });

  useSocket("taskUpdated", (updatedTask: Task) => {
    setTasks((prev) =>
      prev.map((task) => (task._id === updatedTask._id ? updatedTask : task))
    );
  });

  useSocket("taskDeleted", (deletedTask: Task) => {
    setTasks((prev) => prev.filter((task) => task._id !== deletedTask._id)); // Corrected: use deletedTask
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="max-w-[90vw] sm:max-w-[80vw] md:max-w-[50vw] lg:max-w-[30vw] p-4 bg-gray-100 rounded shadow-lg drop-shadow-lg dark:bg-primarySecondary">
      <div className="drag-handle cursor-move bg-gray-300 p-2 rounded mb-4 dark:bg-gray-400">
        <h1 className="text-xl font-bold text-center">To-Do List</h1>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          id="add-task-field"
          name="add-task-field"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a task"
          className="flex-grow p-2 border border-gray-300 rounded"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // Check if the Enter key is pressed
              addTask(); // Call the addTask function
            }
          }}
        />
        <button
          onClick={addTask}
          className="max-w-[60px] bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add
        </button>
        
      </div>
      <ul className="overflow-y-auto max-h-[40vh] custom-scrollbar overflow-x-hidden">
        {tasks.map((task) => (
          <li
            key={task._id}
            className={`p-2 flex justify-between gap-5 items-center rounded mb-2 border-b-2 border-bg-black}`}
          >
            <input
              type="checkbox"
              id={`${task._id}-checkbox`}
              name={`${task._id}-checkbox`}
              checked={task.completed}
              onChange={() => toggleTask(task)}
              className="peer hidden"
            />
            <label
              title={`${
                task.completed ? "Mark as incomplete" : "Mark as completed"
              }`}
              htmlFor={`${task._id}-checkbox`}
              className="cursor-pointer min-w-5 min-h-5 max-w-5 max-h-5 border-2 border-gray-400 rounded-sm peer-checked:bg-green-500 peer-checked:border-green-500 text-center flex justify-center items-center"
            >
              {task.completed ? "✓" : ""}
            </label>
            <span
              className={`flex-grow  ${task.completed ? "line-through" : ""}break-words max-w-full`}
            >
              {task.task}
            </span>
            <span
              className={`text-sm min-w-[70px] ${
                task.completed ? "text-green-600" : "text-red-600"
              }`}
            >
              {task.completed ? "Completed" : "Pending"}
            </span>
            <span title="Remove Task">
              <FaTrash
                className="cursor-pointer"
                onClick={() => deleteTask(task._id)}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;
