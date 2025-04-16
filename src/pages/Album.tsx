import React from 'react';
import { supabase } from '../lib/supabase';
import Masonry from 'react-masonry-css';

interface Photo {
  id: string;
  url: string;
  posts: {
    title: string;
  };
}

export default function Album() {
  const [photos, setPhotos] = React.useState<Photo[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchPhotos() {
      const { data, error } = await supabase
        .from('photos')
        .select(`
          *,
          posts (title)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching photos:', error);
      } else {
        setPhotos(data || []);
      }
      setLoading(false);
    }

    fetchPhotos();
  }, []);

  const breakpointColumns = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div>

      <Masonry
        breakpointCols={breakpointColumns}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-clip-padding"
      >
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="mb-4 break-inside-avoid"
          >
            <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
              <img
                src={photo.url}
                alt={photo.posts?.title || 'Foto del álbum'}
                className="w-full h-auto"
                loading="lazy"
              />
              {photo.posts?.title && (
                <div className="p-4">
                  <p className="text-gray-600 text-sm">{photo.posts.title}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </Masonry>

      {photos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay fotos en el álbum aún.</p>
        </div>
      )}
    </div>
  );
}