import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import './App.css'
import Header from "./Header.jsx"
import Base from "./Base.jsx"
import Footer from "./Footer.jsx";

function App() {

  return (
    <>
    <BrowserRouter>
    <Header />
      <Routes>
        <Route path="/" element={<Base />}></Route>
        <Route index element={<Base />}></Route>

        <Route path="*" element={<Base />}></Route>
      </Routes>
    <Footer />
    </BrowserRouter>
    </>
  )
}

export default App
