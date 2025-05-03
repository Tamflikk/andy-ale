import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Camera, PenSquare, LogIn, LogOut, Menu, X, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function EnhancedNavbar() {
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Sesión cerrada correctamente');
      navigate('/');
    } catch (error) {
      toast.error('Error al cerrar sesión');
      console.error('Error al cerrar sesión:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white shadow-lg' 
          : 'bg-gradient-to-r from-rose-50 to-pink-50'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo y título */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <Heart 
                className="h-7 w-7 text-rose-500 transition-all duration-300 transform group-hover:scale-110"
                fill="currentColor"
              />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
              </span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 text-transparent bg-clip-text">
                Andy & Ale
              </span>
              <span className="text-xs text-gray-500 -mt-1">Nuestra Historia</span>
            </div>
          </Link>

          {/* Menú de navegación escritorio */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink to="/" isActive={isActive('/')}>
              <BookOpen className="h-4 w-4 mr-1" />
              Posts
            </NavLink>
            <NavLink to="/love-notes" isActive={isActive('/love-notes')}>
              <PenSquare className="h-4 w-4 mr-1" />
              Notas
            </NavLink>
            <NavLink to="/album" isActive={isActive('/album')}>
              <Camera className="h-4 w-4 mr-1" />
              Álbum
            </NavLink>
            {user ? (
              <div className="flex items-center space-x-2 ml-2">
                <Link
                  to="/new-post"
                  className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-4 py-2 rounded-full font-medium hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Nuevo Post
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-rose-500 p-2 rounded-full hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Salir</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1 bg-white text-rose-500 border border-rose-200 px-4 py-2 rounded-full font-medium hover:bg-rose-50 transition-colors ml-2"
              >
                <LogIn className="h-4 w-4" />
                <span>Entrar</span>
              </Link>
            )}
          </div>

          {/* Botón menú móvil */}
          <button 
            className="md:hidden text-gray-600 hover:text-rose-500 focus:outline-none" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 py-2 px-4 mt-1 shadow-lg rounded-b-lg">
            <div className="flex flex-col space-y-3 py-2">
              <MobileNavLink to="/" isActive={isActive('/')}>
                <BookOpen className="h-5 w-5 mr-2" />
                Posts
              </MobileNavLink>
              <MobileNavLink to="/love-notes" isActive={isActive('/love-notes')}>
                <PenSquare className="h-5 w-5 mr-2" />
                Notas de Amor
              </MobileNavLink>
              <MobileNavLink to="/album" isActive={isActive('/album')}>
                <Camera className="h-5 w-5 mr-2" />
                Nuestro Álbum
              </MobileNavLink>
              {user ? (
                <>
                  <Link
                    to="/new-post"
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white py-2 px-4 rounded-full text-center font-medium shadow-sm"
                  >
                    Crear Nuevo Post
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full py-2 px-4 border border-gray-200 rounded-full text-gray-600 justify-center font-medium"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center w-full py-2 px-4 bg-rose-50 border border-rose-200 rounded-full text-rose-500 justify-center font-medium"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Componente para enlaces de navegación en escritorio
const NavLink = ({ children, to, isActive }) => {
  return (
    <Link
      to={to}
      className={`flex items-center font-medium px-4 py-2 rounded-full transition-all duration-200 ${
        isActive
          ? 'bg-rose-100 text-rose-600'
          : 'text-gray-600 hover:bg-rose-50 hover:text-rose-500'
      }`}
    >
      {children}
    </Link>
  );
};

// Componente para enlaces de navegación en móvil
const MobileNavLink = ({ children, to, isActive }) => {
  return (
    <Link
      to={to}
      className={`flex items-center font-medium py-2 px-4 rounded-lg ${
        isActive
          ? 'bg-rose-100 text-rose-600'
          : 'text-gray-600 hover:bg-rose-50'
      }`}
    >
      {children}
    </Link>
  );
};