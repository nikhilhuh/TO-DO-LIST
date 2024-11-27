import React from 'react';
import TaskList from './components/TaskList';

const App: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <TaskList />
        </div>
    );
};

export default App;
