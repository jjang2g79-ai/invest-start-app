// 📌 라우팅 설정
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Tendency from "./pages/Tendency"
import Result from "./pages/Result"
import Detail from "./pages/Detail"
import Record from "./pages/Record"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tendency" element={<Tendency />} />
        <Route path="/result" element={<Result />} />
        <Route path="/detail/:code" element={<Detail />} />
        <Route path="/record" element={<Record />} />
      </Routes>
    </BrowserRouter>
  )
}
