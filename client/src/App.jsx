import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import VideoSession from './pages/VideoSession';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/session/:sessionId" element={<VideoSession />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
