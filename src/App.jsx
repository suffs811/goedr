import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './App.css'
import Settings from "./Settings.jsx"
import Header from "./Header.jsx"
import Dashboard from "./Dashboard.jsx"
import Footer from "./Footer.jsx";

function App() {

  return (
    <>
    <BrowserRouter>
    <Header />
      <Routes>
        <Route path="/" element={<Dashboard />}></Route>
        <Route index element={<Dashboard />}></Route>

        <Route path="/settings" element={<Settings />}></Route>

        <Route path="*" element={<Dashboard />}></Route>
      </Routes>
    <Footer />
    </BrowserRouter>
    </>
  )
}

export default App
