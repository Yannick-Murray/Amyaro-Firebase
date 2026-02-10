import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { DeleteAccountModal, ProfileEditModal } from '../components/business';
import { ManageShopModal } from '../components/business/ManageShopModal';
import { ShopService } from '../services/shopService';
import type { Shop } from '../types/todoList';

const Profile = () => {
  const { user, logout, refreshUserData } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [shopModalMode, setShopModalMode] = useState<'create' | 'edit'>('create');
  const [editingShop, setEditingShop] = useState<Shop | undefined>();
  const [userShops, setUserShops] = useState<Shop[]>([]);
  const [isLoadingShops, setIsLoadingShops] = useState(false);

  // Lade User-Shops
  useEffect(() => {
    if (user) {
      loadUserShops();
    }
  }, [user]);

  const loadUserShops = async () => {
    setIsLoadingShops(true);
    try {
      const shops = await ShopService.getUserShops();
      setUserShops(shops);
    } catch (error) {
      console.error('Fehler beim Laden der Shops:', error);
    } finally {
      setIsLoadingShops(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfileUpdated = async () => {
    setShowProfileEditModal(false);
    try {
      await refreshUserData();
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const handleCreateShop = () => {
    setShopModalMode('create');
    setEditingShop(undefined);
    setShowShopModal(true);
  };

  const handleEditShop = (shop: Shop) => {
    setShopModalMode('edit');
    setEditingShop(shop);
    setShowShopModal(true);
  };

  const handleDeleteShop = async (shopId: string) => {
    if (!confirm('Möchtest du diesen Shop wirklich löschen?')) {
      return;
    }

    try {
      await ShopService.deleteUserShop(shopId);
      await loadUserShops();
    } catch (error) {
      console.error('Fehler beim Löschen des Shops:', error);
      alert('Fehler beim Löschen des Shops');
    }
  };

  const handleSaveShop = async (displayName: string, category?: string, order?: number) => {
    try {
      if (shopModalMode === 'create') {
        await ShopService.createUserShop(displayName, category);
      } else if (editingShop) {
        await ShopService.updateUserShop(editingShop.id, {
          displayName,
          category,
          order
        });
      }
      await loadUserShops();
      setShowShopModal(false);
    } catch (error) {
      console.error('Fehler beim Speichern des Shops:', error);
      throw error;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="amyaro-card p-4">
            <div className="text-center mb-4">
              <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profil" className="rounded-circle" style={{width: '80px', height: '80px'}} />
                ) : (
                  <i className="bi bi-person-circle display-4"></i>
                )}
              </div>
              <h2>{user.displayName || 'Unbekannter Benutzer'}</h2>
              <p className="text-muted">{user.email}</p>
            </div>

            <div className="mb-4">
              <h5 className="mb-3">Account-Informationen</h5>
              <div className="row">
                <div className="col-sm-4">
                  <strong>Name:</strong>
                </div>
                <div className="col-sm-8">
                  {user.displayName || 'Nicht angegeben'}
                </div>
              </div>
              <hr />
              <div className="row">
                <div className="col-sm-4">
                  <strong>E-Mail:</strong>
                </div>
                <div className="col-sm-8">
                  {user.email}
                </div>
              </div>
              <hr />
              <div className="row">
                <div className="col-sm-4">
                  <strong>Registriert:</strong>
                </div>
                <div className="col-sm-8">
                  {new Date(user.createdAt).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>

            {/* Meine Shops Section */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Meine Shops</h5>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={handleCreateShop}
                >
                  <i className="bi bi-plus-circle me-1"></i>
                  Shop hinzufügen
                </button>
              </div>
              
              {isLoadingShops ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Lädt...</span>
                  </div>
                </div>
              ) : userShops.length === 0 ? (
                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Du hast noch keine eigenen Shops angelegt. Shops können beim Abschließen einer Liste gespeichert werden oder hier manuell hinzugefügt werden.
                </div>
              ) : (
                <div className="list-group">
                  {userShops.map(shop => (
                    <div 
                      key={shop.id} 
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong>{shop.displayName}</strong>
                        {shop.category && (
                          <span className="badge bg-secondary ms-2">
                            {shop.category === 'discount' && 'Discounter'}
                            {shop.category === 'supermarket' && 'Supermarkt'}
                            {shop.category === 'drugstore' && 'Drogerie'}
                            {shop.category === 'specialty' && 'Fachgeschäft'}
                            {shop.category === 'online' && 'Online-Shop'}
                            {shop.category === 'other' && 'Sonstiges'}
                          </span>
                        )}
                      </div>
                      <div>
                        <button 
                          className="btn btn-sm btn-outline-secondary me-2"
                          onClick={() => handleEditShop(shop)}
                          title="Bearbeiten"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteShop(shop.id)}
                          title="Löschen"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="d-grid gap-2">
              <button 
                className="btn btn-outline-primary"
                onClick={() => setShowProfileEditModal(true)}
              >
                <i className="bi bi-person-gear me-2"></i>
                Profil bearbeiten
              </button>
              <button className="btn btn-outline-secondary" disabled>
                <i className="bi bi-key me-2"></i>
                Passwort ändern (Coming Soon)
              </button>
              <hr />
              
              {/* 🔒 GDPR: Account Deletion */}
              <button
                className="btn btn-outline-danger"
                onClick={() => setShowDeleteModal(true)}
              >
                <i className="bi bi-trash me-2"></i>
                Account permanent löschen
              </button>
              
              <hr />
              <button 
                className="btn btn-danger"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        user={user}
      />

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={showProfileEditModal}
        onClose={() => setShowProfileEditModal(false)}
        user={user}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Manage Shop Modal */}
      <ManageShopModal
        isOpen={showShopModal}
        onClose={() => setShowShopModal(false)}
        onSave={handleSaveShop}
        mode={shopModalMode}
        existingShop={editingShop}
      />
    </div>
  );
};

export default Profile;