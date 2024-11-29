import React, { useEffect, useState } from "react";
import TaskList from "./components/TaskList";
import StickyNotes from "./components/StickyNote";
import Chat from "./components/Chat";

const App: React.FC = () => {
  const [theme, setTheme] = useState<string>("light");

  // Load saved theme and update max bounds on resize
  useEffect(() => {
    const savedTheme = localStorage.getItem("savedTheme");
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") document.documentElement.classList.add("dark");
    }
  }, []);

  // Function to toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    if (newTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    setTheme(newTheme);
    localStorage.setItem("savedTheme", newTheme);
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 grid place-items-center dark:bg-primaryDark">
      <button
        onClick={toggleTheme}
        className="toggle-theme-button bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
      >
        {theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
      </button>
      <TaskList />
      <StickyNotes Height={"425px"} />
      <Chat Height={"300px"} Width={"400px"} />
    </div>
  );
};

export default App;
