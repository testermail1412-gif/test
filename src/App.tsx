import { Routes, Route, Navigate } from "react-router-dom";
import { useStore } from "./context/StoreContext";
import Navbar from "./components/Navbar";
import Toasts from "./components/Toasts";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import PostDetail from "./pages/PostDetail";
import NewPost from "./pages/NewPost";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";
import Verify from "./pages/Verify";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";

function Guard({ children }: { children: JSX.Element }) {
  const { me } = useStore();
  return me ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <div className="min-h-full flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/u/:id" element={<Profile />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route path="/new" element={<Guard><NewPost /></Guard>} />
          <Route path="/verify" element={<Guard><Verify /></Guard>} />
          <Route path="/settings" element={<Guard><Settings /></Guard>} />
          <Route path="/messages" element={<Guard><Messages /></Guard>} />
          <Route path="/messages/:convId" element={<Guard><Messages /></Guard>} />
          <Route path="/dashboard" element={<Guard><Dashboard /></Guard>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-line mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-sm text-muted flex flex-wrap gap-x-8 gap-y-2 justify-between">
          <span>© {new Date().getFullYear()} Post Pro Shop — Marktplatz für Online-Business</span>
          <span className="flex gap-5">
            <a href="#" className="hover:text-white">Impressum</a>
            <a href="#" className="hover:text-white">Datenschutz</a>
            <a href="#" className="hover:text-white">AGB</a>
          </span>
        </div>
      </footer>
      <Toasts />
    </div>
  );
}
