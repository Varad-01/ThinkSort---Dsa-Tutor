import { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";

export default function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [userEmail, setUserEmail] = useState<string | null>(
    localStorage.getItem("userEmail")
  );

  const handleSetTokenAndEmail = (newToken: string, email: string) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("userEmail", email);
    setToken(newToken);
    setUserEmail(email);
  };

  if (!token) return <Login setTokenAndEmail={handleSetTokenAndEmail} />;

  return <Dashboard userEmail={userEmail} />;
}
