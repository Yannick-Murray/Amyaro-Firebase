import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { ListService } from '../services/listService';
import type { List } from '../types/todoList';

interface ListsContextType {
  lists: List[];
  loading: boolean;
  error: string;
  refreshLists: () => Promise<void>;
  addList: (list: List) => void;
  removeList: (listId: string) => void;
  updateList: (list: List) => void;
}

const ListsContext = createContext<ListsContextType | undefined>(undefined);

export const useListsContext = () => {
  const context = useContext(ListsContext);
  if (!context) {
    throw new Error('useListsContext must be used within a ListsProvider');
  }
  return context;
};

interface ListsProviderProps {
  children: React.ReactNode;
}

export const ListsProvider: React.FC<ListsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshLists = async () => {
    if (!user) {
      setLists([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const userLists = await ListService.getUserLists(user.uid);
      setLists(userLists);
    } catch (err) {
      console.error('Fehler beim Laden der Listen:', err);
      setError('Fehler beim Laden der Listen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshLists();

    // Event Listener für Änderungen der Listen
    const handleListsChanged = () => {
      refreshLists();
    };

    window.addEventListener('listsChanged', handleListsChanged);
    
    return () => {
      window.removeEventListener('listsChanged', handleListsChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const addList = (list: List) => {
    setLists(prev => [list, ...prev]);
  };

  const removeList = (listId: string) => {
    setLists(prev => prev.filter(list => list.id !== listId));
  };

  const updateList = (updatedList: List) => {
    setLists(prev => prev.map(list => 
      list.id === updatedList.id ? updatedList : list
    ));
  };

  const value: ListsContextType = {
    lists,
    loading,
    error,
    refreshLists,
    addList,
    removeList,
    updateList
  };

  return (
    <ListsContext.Provider value={value}>
      {children}
    </ListsContext.Provider>
  );
};