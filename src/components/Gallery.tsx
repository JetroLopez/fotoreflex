import React, { useState, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import PolaroidFrame from './PolaroidFrame';

const categories = [
  { id: 'all', name: 'Todos' },
  { id: 'portraits', name: 'Retratos' },
  { id: 'family', name: 'Familia' },
  { id: 'events', name: 'Eventos' },
  { id: 'restoration', name: 'Restauración' },
];

const galleryItems = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158',
    alt: 'Retrato profesional',
    caption: 'Retrato profesional',
    category: 'portraits',
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1500673922987-e212871fec22',
    alt: 'Fotografía familiar',
    caption: 'Momentos en familia',
    category: 'family',
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
    alt: 'Boda',
    caption: 'Boda de María y Juan',
    category: 'events',
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05',
    alt: 'Foto restaurada',
    caption: 'Restauración fotográfica',
    category: 'restoration',
  },
  {
    id: 5,
    src: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21',
    alt: 'Evento corporativo',
    caption: 'Evento empresarial',
    category: 'events',
  },
  {
    id: 6,
    src: 'https://images.unsplash.com/photo-1458668383970-8ddd3927deed',
    alt: 'Retrato artístico',
    caption: 'Sesión artística',
    category: 'portraits',
  },
];

// Memoize individual gallery items
const GalleryItem = memo(({ item }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="transform transition-all duration-300 hover:-rotate-2"
  >
    <PolaroidFrame
      src={item.src}
      alt={item.alt}
      caption={item.caption}
      loading="lazy"
    />
  </motion.div>
));

GalleryItem.displayName = 'GalleryItem';

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  
  const filteredItems = useCallback(
    () => activeCategory === 'all' 
      ? galleryItems 
      : galleryItems.filter(item => item.category === activeCategory),
    [activeCategory]
  );

  const handleCategoryChange = useCallback((categoryId) => {
    setActiveCategory(categoryId);
  }, []);

  return (
    <div className="py-12">
      <div className="flex justify-center mb-8 overflow-x-auto pb-2">
        <div className="flex space-x-2">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-full transition-colors ${
                activeCategory === category.id
                  ? 'bg-studio-brown text-white'
                  : 'bg-gray-100 text-studio-brown hover:bg-gray-200'
              }`}
              onClick={() => handleCategoryChange(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        layout
      >
        {filteredItems().map((item) => (
          <GalleryItem key={item.id} item={item} />
        ))}
      </motion.div>
    </div>
  );
};

export default memo(Gallery);
