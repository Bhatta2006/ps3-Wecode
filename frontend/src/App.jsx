import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import StrategyDetail from './pages/StrategyDetail';
import Compare from './pages/Compare';
import Login from './pages/Login';
import Signup from './pages/Signup';
import History from './pages/History';
import { AuthProvider } from './context/AuthContext';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/strategy/:id" element={<StrategyDetail />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </AuthProvider>
  );
}
