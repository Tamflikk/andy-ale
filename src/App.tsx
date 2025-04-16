import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Album from './pages/Album';
import LoveNotes from './pages/LoveNotes';
import NewPost from './pages/NewPost';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-rose-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/album" element={<Album />} />
            <Route path="/love-notes" element={<LoveNotes />} />
            <Route path="/new-post" element={<NewPost />} />
          </Routes>
        </main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#363636',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              borderRadius: '0.5rem',
              padding: '1rem',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;