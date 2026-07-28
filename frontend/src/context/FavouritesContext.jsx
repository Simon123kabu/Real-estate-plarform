import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const FavouritesContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_URL;

export function FavouritesProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavourites();
    } else {
      setFavourites([]);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchFavourites = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/favorites`, {
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Each record looks like { _id, property: {...}, createdAt } — unwrap to just the property
        const properties = data.data.map((record) => record.property).filter(Boolean);
        setFavourites(properties);
      } else {
        setFavourites([]);
      }
    } catch (err) {
      setFavourites([]);
    } finally {
      setLoading(false);
    }
  };

  const isFavourite = (propertyId) => favourites.some((item) => item._id === propertyId);

  const toggleFavourite = async (listing) => {
    const alreadyFavourited = isFavourite(listing._id);

    // Update instantly for a snappy feel
    if (alreadyFavourited) {
      setFavourites((prev) => prev.filter((item) => item._id !== listing._id));
    } else {
      setFavourites((prev) => [...prev, listing]);
    }

    try {
      const res = await fetch(`${API_BASE}/favorites/${listing._id}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();

      if (res.ok && typeof data.saved === 'boolean') {
        if (data.saved) {
          // Server confirmed save — ensure it's in the list exactly once
          setFavourites((prev) =>
            prev.some((item) => item._id === listing._id) ? prev : [...prev, listing]
          );
        } else {
          // Server confirmed removal — ensure it's not in the list
          setFavourites((prev) => prev.filter((item) => item._id !== listing._id));
        }
      } else {
        // Not logged in or some other issue — revert
        fetchFavourites();
        if (data.message) alert(data.message);
      }
    } catch (err) {
      fetchFavourites();
    }
  };

  const value = {
    favourites,
    loading,
    isFavourite,
    toggleFavourite,
    refetchFavourites: fetchFavourites,
  };

  return (
    <FavouritesContext.Provider value={value}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  const context = useContext(FavouritesContext);
  if (!context) {
    throw new Error('useFavourites must be used within a FavouritesProvider');
  }
  return context;
}
