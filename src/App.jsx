import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './App.css'
import Header from "./Header.jsx"
import Base from "./Base.jsx"
import Dashboard from "./Dashboard.jsx";
import Footer from "./Footer.jsx";
import Settings from "./Settings.jsx";
import Login from "./Login.jsx";
import Register from "./Register.jsx";
import ResetPassword from "./ResetPassword.jsx";
import { useEffect, useState } from "react";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Function to ensure the API token is present
  const apiTokenPresent = () => {
    return localStorage.getItem("apiToken") !== null;
  }

  // Check if JWT is present in localStorage
  useEffect(() => {
    if (localStorage.getItem("jwt") !== null && localStorage.getItem("jwt") !== "undefined") {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false)
    }
  }, []);

  const PrivateRoute = ({ element }) => {
    return isLoggedIn ? element : <Navigate to="/login" />;
  };

  return (
    <>
    <BrowserRouter>
    <Header isLoggedIn={isLoggedIn} />
      <Routes>
        <Route path="/" element={<Base isLoggedIn={isLoggedIn} />}></Route>
        <Route index element={<Base isLoggedIn={isLoggedIn} />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/register" element={<Register />}></Route>
        <Route path="/reset-password" element={<ResetPassword />}></Route>
        
        {/* Protected routes */}
        <Route path="/dashboard" element={<PrivateRoute element={<Dashboard apiTokenPresent={apiTokenPresent} />} />}></Route>
        <Route path="/settings" element={<PrivateRoute element={<Settings apiTokenPresent={apiTokenPresent} />} />}></Route>

        <Route path="*" element={<Base isLoggedIn={isLoggedIn} />}></Route>
      </Routes>
    <Footer />
    </BrowserRouter>
    </>
  )
}

export default App
