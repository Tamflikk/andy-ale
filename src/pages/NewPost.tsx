import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Camera, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewPost() {
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // Check if user is logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error('Debes iniciar sesión para crear publicaciones');
        navigate('/login');
      }
    });
  }, [navigate]);

  React.useEffect(() => {
    if (files) {
      const newPreviews = Array.from(files).map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
      return () => newPreviews.forEach(preview => URL.revokeObjectURL(preview));
    }
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      if (selectedFiles.length > 10) {
        toast.error('Máximo 10 fotos por publicación');
        return;
      }
      setFiles(selectedFiles);
    }
  };

  const removePreview = (index: number) => {
    if (!files) return;
    
    const dt = new DataTransfer();
    Array.from(files).forEach((file, i) => {
      if (i !== index) dt.items.add(file);
    });
    
    setFiles(dt.files);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files?.length) {
      toast.error('Por favor selecciona al menos una foto');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      // Create post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert([
          {
            title,
            content,
            author_id: user.id
          }
        ])
        .select()
        .single();

      if (postError) throw postError;

      // Upload photos
      const photoPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('photos')
          .getPublicUrl(filePath);

        return supabase
          .from('photos')
          .insert([
            {
              url: publicUrl,
              post_id: post.id
            }
          ]);
      });

      await Promise.all(photoPromises);
      toast.success('Publicación creada exitosamente');
      navigate('/');
    } catch (err) {
      console.error('Error creating post:', err);
      toast.error('Error al crear la publicación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-semibold text-gray-800 mb-8">
        Nueva Publicación
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Contenido
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fotos
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-rose-500 transition-colors duration-200"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Haz clic para seleccionar fotos o arrastra y suelta aquí
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Máximo 10 fotos por publicación
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={loading}
            />

            {previews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {previews.map((preview, index) => (
                  <div key={preview} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePreview(index)}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-rose-500 text-white py-3 px-4 rounded-md hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Creando publicación...</span>
            </>
          ) : (
            <span>Crear Publicación</span>
          )}
        </button>
      </form>
    </div>
  );
}