import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Heart, Loader2, Pin, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface LoveNote {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

// Array de colores para las notas
const noteColors = [
  'bg-rose-100',
  'bg-yellow-100',
  'bg-blue-100',
  'bg-green-100',
  'bg-purple-100',
  'bg-orange-100',
];

// Array de ángulos de rotación para las notas
const noteRotations = [
  'rotate-1',
  '-rotate-1',
  'rotate-2',
  '-rotate-2',
  'rotate-0',
];

export default function LoveNotes() {
  const [notes, setNotes] = useState<LoveNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [masonry, setMasonry] = useState<Record<string, any>>({
    columns: 3,
    columnGap: 24,
  });
  
  // Ref para el formulario modal de nueva nota
  const formRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Función para manejar redimensionamiento
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setMasonry({ columns: 1, columnGap: 16 });
      } else if (window.innerWidth < 768) {
        setMasonry({ columns: 2, columnGap: 20 });
      } else {
        setMasonry({ columns: 3, columnGap: 24 });
      }
    };

    // Establecer las columnas iniciales basadas en el tamaño de pantalla
    handleResize();

    // Agregar event listener
    window.addEventListener('resize', handleResize);

    // Verificar sesión del usuario
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    fetchNotes();

    // Configurar el canal de realtime para actualizaciones de notas
    const channel = supabase
      .channel('love_notes_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'love_notes'
      }, () => {
        fetchNotes();
      })
      .subscribe();

    return () => {
      window.removeEventListener('resize', handleResize);
      channel.unsubscribe();
    };
  }, []);

  // Evento para cerrar el modal al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowNoteForm(false);
      }
    }

    if (showNoteForm) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNoteForm]);

  async function fetchNotes() {
    try {
      const { data, error } = await supabase
        .from('love_notes')
        .select(`
          *,
          profiles (username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      toast.error('Error al cargar las notas');
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !newNote.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('love_notes')
        .insert([
          {
            content: newNote.trim(),
            author_id: user.id
          }
        ]);

      if (error) throw error;
      
      setNewNote('');
      setShowNoteForm(false);
      toast.success('Nota de amor publicada');
    } catch (error) {
      toast.error('Error al enviar la nota');
      console.error('Error creating note:', error);
    } finally {
      setSubmitting(false);
    }
  }

  // Organizar notas en formato de columnas para masonry layout
  const organizeColumns = () => {
    const columns: LoveNote[][] = Array.from({ length: masonry.columns }, () => []);
    
    notes.forEach((note, index) => {
      const columnIndex = index % masonry.columns;
      columns[columnIndex].push(note);
    });
    
    return columns;
  };

  // Obtener un color aleatorio pero consistente para una nota específica
  const getNoteColor = (id: string) => {
    const numericHash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return noteColors[numericHash % noteColors.length];
  };

  // Obtener una rotación aleatoria pero consistente para una nota específica
  const getNoteRotation = (id: string) => {
    const numericHash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return noteRotations[numericHash % noteRotations.length];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 text-rose-500 animate-spin" />
      </div>
    );
  }

  const columns = organizeColumns();

  return (
    <div className="relative px-4 sm:px-6">
      {/* Fondo de tablero de corcho */}
      <div className="fixed inset-0 bg-amber-800 -z-10 pointer-events-none" style={{
        backgroundImage: `radial-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px)`,
        backgroundSize: '20px 20px'
      }}></div>

      {/* Botón fijo para añadir nueva nota */}
      <div className="fixed bottom-6 right-6 z-10">
        <button
          onClick={() => setShowNoteForm(true)}
          disabled={!user}
          className="bg-rose-500 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={user ? "Añadir nota de amor" : "Inicia sesión para añadir notas"}
        >
          <Heart className="h-8 w-8" />
        </button>
      </div>

      {/* Modal para nueva nota */}
      {showNoteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            ref={formRef}
            className="bg-rose-50 max-w-md w-full rounded-lg p-6 shadow-xl relative border-2 border-rose-200"
          >
            <button
              onClick={() => setShowNoteForm(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h2 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
              <Heart className="h-5 w-5 text-rose-500 mr-2" />
              Nueva Nota de Amor
            </h2>
            
            <form onSubmit={handleSubmit}>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Escribe tu nota de amor aquí..."
                className="w-full p-3 border border-rose-200 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none bg-white"
                rows={5}
                required
                disabled={submitting}
                autoFocus
              />
              <button
                type="submit"
                disabled={submitting}
                className="mt-4 w-full bg-rose-500 text-white py-3 px-4 rounded-md hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Publicar Nota</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <Heart className="h-16 w-16 text-rose-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No hay notas de amor aún.</p>
          {user ? (
            <button
              onClick={() => setShowNoteForm(true)}
              className="mt-4 inline-flex items-center px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600"
            >
              <Heart className="h-5 w-5 mr-2" />
              Escribe la primera nota
            </button>
          ) : (
            <p className="text-gray-400 mt-2">Inicia sesión para crear la primera nota</p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap -mx-3">
          {columns.map((column, columnIndex) => (
            <div 
              key={columnIndex} 
              className="px-3" 
              style={{ width: `${100 / masonry.columns}%` }}
            >
              <div className="space-y-6">
                {column.map((note) => (
                  <div
                    key={note.id}
                    className={`relative p-6 rounded-md shadow-md transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${getNoteColor(note.id)} ${getNoteRotation(note.id)}`}
                  >
                    {/* Pin en la parte superior */}
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Pin className="h-8 w-8 text-rose-500 drop-shadow-md" />
                    </div>
                    
                    <div className="pt-2">
                      <p className="text-gray-800 whitespace-pre-line mb-4 text-lg font-handwriting">
                        {note.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 mt-3 pt-2 border-t border-gray-200 border-dashed">
                        <span className="font-medium">~ {note.profiles.username}</span>
                        <span>{format(new Date(note.created_at), "d 'de' MMMM", { locale: es })}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}