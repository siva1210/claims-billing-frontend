import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem("token"));

  function login(newToken) {
    sessionStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function logout() {
    sessionStorage.removeItem("token");
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}