import { useState } from 'react';
import Logs from './components/logs/Logs';
import Navbar from './components/navbar/Navbar';
import Tasks from './components/tasks/Tasks';

export default function App() {
  const [showLog, setShowLog] = useState(false);

  return (
    <div className='h-dvh flex flex-col items-center justify-between bg-(--background) font-mono'>
      <Navbar />
      {showLog ? <Logs /> : <Tasks />}
    </div>
  );
}
