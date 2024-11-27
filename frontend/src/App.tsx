import React, { useEffect, useState } from "react";
import TaskList from "./components/TaskList";
import Draggable from "react-draggable";

const App: React.FC = () => {
  interface Position {
    x: number;
    y: number;
  }

  const DefaultPositions: Position = { x: 0, y: 0 };
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [theme, setTheme] = useState<string>("light");
  const [isDesktop, setIsDesktop] = useState<boolean>(true);

  // Load saved position from local storage or use default
  const [position, setPosition] = useState(() => {
    const savedPosition = JSON.parse(
      localStorage.getItem("listPosition") ?? "{}"
    );
    return { ...DefaultPositions, ...savedPosition };
  });


  const handleDragStop = (data: any) => {
    const newPos = { x: data.x, y: data.y };
    setPosition(newPos);
    localStorage.setItem("taskListPosition", JSON.stringify(newPos));
  };
  // Reset position to default
  const resetAll = () => {
    setIsResetting(true);
    setPosition(DefaultPositions);
    localStorage.setItem("listPosition", JSON.stringify(DefaultPositions));
    setTimeout(() => setIsResetting(false), 300);
  };

  useEffect(() => {
    // Save position to local storage whenever it changes
    localStorage.setItem("listPosition", JSON.stringify(position));
  }, [position]);

  // Load saved theme and update max bounds on resize
  useEffect(() => {
    const savedTheme = localStorage.getItem("savedTheme");
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "dark") document.documentElement.classList.add("dark");
    }
    // Check screen width and set isDesktop state
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024); // Desktop: 1024px and up
    };

    // Run on initial load
    checkScreenSize();

    // Attach event listener to resize
    window.addEventListener("resize", checkScreenSize);

    // Clean up event listener on unmount
    return () => {
      window.removeEventListener("resize", checkScreenSize);
    };
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
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={toggleTheme}
          className="toggle-theme-button bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          {theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        </button>
        <button
          onClick={resetAll}
          className="reset-button bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Reset to Default
        </button>
      </div>
      {isDesktop ? (
        <Draggable
          bounds="parent"
          position={position}
          onStop={handleDragStop}
        >
          <div className={`${isResetting ? "transition-all duration-300 ease-in-out" : ""}`}>
            <TaskList />
          </div>
        </Draggable>
      ) : (
        <div className="task-list-container">
          <TaskList />
        </div>
      )}
    </div>
  );
};

export default App;
