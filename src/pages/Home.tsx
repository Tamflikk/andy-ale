import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  photos: { url: string; id: string }[];
  profiles: { username: string; avatar_url?: string };
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullscreenImage, setFullscreenImage] = useState<{url: string, postId: string, index: number} | null>(null);
  const [expandedContent, setExpandedContent] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          photos (id, url),
          profiles (username, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    }

    fetchPosts();
  }, []);

  const toggleExpand = (postId: string) => {
    setExpandedContent(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const navigateFullscreen = (direction: 'prev' | 'next') => {
    if (!fullscreenImage) return;
    
    const post = posts.find(p => p.id === fullscreenImage.postId);
    if (!post || !post.photos) return;
    
    const totalImages = post.photos.length;
    let newIndex;
    
    if (direction === 'next') {
      newIndex = (fullscreenImage.index + 1) % totalImages;
    } else {
      newIndex = (fullscreenImage.index - 1 + totalImages) % totalImages;
    }
    
    setFullscreenImage({
      url: post.photos[newIndex].url,
      postId: fullscreenImage.postId,
      index: newIndex
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (fullscreenImage) {
      if (e.key === 'ArrowRight') navigateFullscreen('next');
      if (e.key === 'ArrowLeft') navigateFullscreen('prev');
      if (e.key === 'Escape') setFullscreenImage(null);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage]);

  // Bloquear scroll cuando está en vista de pantalla completa
  useEffect(() => {
    if (fullscreenImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [fullscreenImage]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  // Función para renderizar la galería de fotos
  const renderPhotoGallery = (post: Post) => {
    if (!post.photos || post.photos.length === 0) return null;
    
    // Para un solo elemento, mostrarlo a ancho completo
    if (post.photos.length === 1) {
      return (
        <div className="aspect-video cursor-pointer" onClick={() => setFullscreenImage({ url: post.photos[0].url, postId: post.id, index: 0 })}>
          <img 
            src={post.photos[0].url}
            alt={post.title}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      );
    }
    
    // Para dos elementos, mostrarlos en dos columnas iguales
    if (post.photos.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-1">
          {post.photos.map((photo, idx) => (
            <div 
              key={photo.id || idx}
              className="aspect-square cursor-pointer"
              onClick={() => setFullscreenImage({ url: photo.url, postId: post.id, index: idx })}
            >
              <img 
                src={photo.url}
                alt={`${post.title} - ${idx + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          ))}
        </div>
      );
    }
    
    // Para tres elementos, mostrar uno grande y dos pequeños
    if (post.photos.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-1">
          <div 
            className="aspect-square row-span-2 cursor-pointer"
            onClick={() => setFullscreenImage({ url: post.photos[0].url, postId: post.id, index: 0 })}
          >
            <img 
              src={post.photos[0].url}
              alt={`${post.title} - 1`}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          {post.photos.slice(1, 3).map((photo, idx) => (
            <div 
              key={photo.id || idx}
              className="aspect-square cursor-pointer"
              onClick={() => setFullscreenImage({ url: photo.url, postId: post.id, index: idx + 1 })}
            >
              <img 
                src={photo.url}
                alt={`${post.title} - ${idx + 2}`}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          ))}
        </div>
      );
    }
    
    // Para 4 o más fotos, mostrar las primeras 4 en un grid 2x2 con indicador de más
    return (
      <div className="grid grid-cols-2 gap-1">
        {post.photos.slice(0, 4).map((photo, idx) => (
          <div 
            key={photo.id || idx}
            className="aspect-square relative cursor-pointer"
            onClick={() => setFullscreenImage({ url: photo.url, postId: post.id, index: idx })}
          >
            <img 
              src={photo.url}
              alt={`${post.title} - ${idx + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
            {idx === 3 && post.photos.length > 4 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <span className="text-white text-xl font-bold">+{post.photos.length - 4}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <p className="text-gray-500 text-lg">No hay publicaciones aún.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                      {post.profiles.avatar_url ? (
                        <img 
                          src={post.profiles.avatar_url} 
                          alt={post.profiles.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-rose-100 text-rose-500 font-medium">
                          {post.profiles.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{post.profiles.username}</h3>
                      <p className="text-xs text-gray-500">
                        {format(new Date(post.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">{post.title}</h2>
                  
                  <div className="text-gray-600 mb-3">
                    {post.content.length > 150 && !expandedContent[post.id] ? (
                      <>
                        <p className="whitespace-pre-line">{post.content.slice(0, 150)}...</p>
                        <button 
                          onClick={() => toggleExpand(post.id)}
                          className="text-rose-500 text-sm font-medium hover:underline mt-1"
                        >
                          Ver más
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="whitespace-pre-line">{post.content}</p>
                        {post.content.length > 150 && (
                          <button 
                            onClick={() => toggleExpand(post.id)}
                            className="text-rose-500 text-sm font-medium hover:underline mt-1"
                          >
                            Ver menos
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {post.photos && post.photos.length > 0 && (
                  <div className="px-4 pb-4">
                    {renderPhotoGallery(post)}
                  </div>
                )}
                
                <div className="px-4 py-3 border-t border-gray-100 flex space-x-6">
                  <button className="flex items-center space-x-1 text-gray-500 hover:text-rose-500">
                    <Heart className="w-5 h-5" />
                    <span className="text-sm">Me gusta</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-500 hover:text-rose-500">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">Comentar</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-500 hover:text-rose-500">
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm">Compartir</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      
      {/* Visor de imágenes en pantalla completa */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
          <button 
            className="absolute top-4 right-4 text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
            onClick={() => setFullscreenImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          
          <button 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
            onClick={() => navigateFullscreen('prev')}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <img 
            src={fullscreenImage.url}
            alt="Imagen en pantalla completa"
            className="max-h-screen max-w-full object-contain"
          />
          
          <button 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
            onClick={() => navigateFullscreen('next')}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
            {posts.find(p => p.id === fullscreenImage.postId)?.photos.map((_, idx) => (
              <button
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  idx === fullscreenImage.index ? 'bg-white' : 'bg-white bg-opacity-30'
                }`}
                onClick={() => {
                  const post = posts.find(p => p.id === fullscreenImage.postId);
                  if (post && post.photos[idx]) {
                    setFullscreenImage({
                      url: post.photos[idx].url,
                      postId: fullscreenImage.postId,
                      index: idx
                    });
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}