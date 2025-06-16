import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.href = "/"; // No-op in Vite, handled by App.tsx
  }, []);
  return null;
}
