import { useEffect, useState } from "react";

export type Route = {
  path: "overview" | "tasks" | "logs" | "settings";
  params: URLSearchParams;
};

const paths = ["overview", "tasks", "logs", "settings"] as const;

function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, "");
  const [pathPart, queryPart = ""] = clean.split("?");
  const first = pathPart.split("/")[0];
  const path = (paths as readonly string[]).includes(first)
    ? (first as Route["path"])
    : "overview";

  return { path, params: new URLSearchParams(queryPart) };
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  useEffect(() => {
    if (!location.hash) {
      history.replaceState(null, "", "#/overview");
    }
  }, []);

  return route;
}

export function navigate(path: string) {
  if (location.hash === path) return;
  location.hash = path;
}

export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), interval);
    return () => window.clearInterval(timer);
  }, [interval]);

  return now;
}

export function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
