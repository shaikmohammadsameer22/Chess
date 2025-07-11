import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  // Check session on load
  useEffect(() => {
    fetch("http://localhost:5000/api/auth/me", {
      credentials: "include"
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
  if (data) setUser(data);  // ✅ direct assignment
})

      .catch(() => {});
  }, []);

  const register = async (username, email, password) => {
  const res = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ username, email, password })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Registration failed");
  }

  // No setUser here — login will set user
};


  const login = async (email, password) => {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    setUser(data.user);
  };

  const logout = async () => {
    await fetch("http://localhost:5000/api/auth/logout", {
      credentials: "include",
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
