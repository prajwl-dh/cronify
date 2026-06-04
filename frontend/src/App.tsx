import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Error from "./components/common/Error";
import Loading from "./components/common/Loading";
import Logs from "./components/logs/Logs";
import Navbar from "./components/navbar/Navbar";
import Tasks from "./components/tasks/Tasks";
import { APP_PORT } from "./config/config";

export default function App() {
  const [showLog, setShowLog] = useState(-1);

  const { isPending, error, data } = useQuery({
    queryKey: ["tasks"],
    queryFn: () =>
      fetch(`http://127.0.0.1:${APP_PORT}/api/tasks`).then((res) => res.json()),
    refetchInterval: 10000,
  });

  if (isPending) {
    return <Loading />;
  }

  if (error) {
    return <Error error={error} />;
  }

  return (
    <div className="h-dvh flex flex-col items-center justify-between bg-(--background) font-mono overflow-x-hidden">
      <Navbar setShowLog={setShowLog} />
      <Logs showLog={showLog} setShowLog={setShowLog} tasks={data} />
      <Tasks showLog={showLog} setShowLog={setShowLog} tasks={data} />
    </div>
  );
}
