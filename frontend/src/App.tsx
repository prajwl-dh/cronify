import { useState } from 'react';
import Logs from './components/logs/Logs';
import Navbar from './components/navbar/Navbar';
import Tasks from './components/tasks/Tasks';

export default function App() {
  const [showLog, setShowLog] = useState(-1);

  return (
    <div className='h-dvh flex flex-col items-center justify-between bg-(--background) font-mono overflow-x-hidden'>
      <Navbar />
      <Logs showLog={showLog} setShowLog={setShowLog} />
      <Tasks showLog={showLog} setShowLog={setShowLog} />
    </div>
  );
}
