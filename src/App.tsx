import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AgeGateway from './pages/AgeGateway'
import Home from './pages/Home'
import Shorts from './pages/Shorts'
import Search from './pages/Search'
import VideoPlayer from './pages/VideoPlayer'
import Info from './pages/Info'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AgeGateway />} />
        <Route path="/home" element={<Home />} />
        <Route path="/shorts" element={<Shorts />} />
        <Route path="/search" element={<Search />} />
        <Route path="/video/:id" element={<VideoPlayer />} />
        <Route path="/info/:page" element={<Info />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

