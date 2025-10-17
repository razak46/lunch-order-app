'use client';

import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, AlertCircle, Loader2, Trash2, MessageSquare, ChevronDown, ChevronUp, Download, Lock, Unlock, ZoomIn } from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  description?: string;
}

interface OrderItem {
  menuItemId: number;
  local: number;
  takeaway: number;
  note: string;
}

interface Order {
  id: number;
  name: string;
  items: OrderItem[];
  timestamp: string;
}

export default function LunchOrderApp() {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [menuImage, setMenuImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentOrder, setCurrentOrder] = useState<{ name: string; items: OrderItem[] }>({ name: '', items: [] });
  const [error, setError] = useState('');
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingMenu, setEditingMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);

  // Načtení dat při startu
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Načtení menu
      const menuRes = await fetch('/api/menu');
      const menuData = await menuRes.json();
      setMenuItems(menuData.menu || []);
      setMenuImage(menuData.image || null);
      
      // Načtení objednávek
      const ordersRes = await fetch('/api/orders');
      const ordersData = await ordersRes.json();
      setOrders(ordersData.orders || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Chyba při načítání dat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result?.toString().split(',')[1];
        const imageDataUrl = event.target?.result?.toString();
        setMenuImage(imageDataUrl || null);

        try {
          // Volání našeho backend API endpointu (žádný CORS problém!)
          const response = await fetch('/api/recognize', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              image: base64Image,
              mediaType: file.type
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Chyba při rozpoznávání menu');
          }

          const data = await response.json();
          const recognizedItems = data.menuItems;
          
          const formattedItems = recognizedItems.map((item: any, index: number) => ({
            id: Date.now() + index,
            name: item.name,
            description: item.description || ''
          }));

          setMenuItems(formattedItems);
          setEditingMenu(true);
          setError(''); // Vyčištění chyby po úspěchu
        } catch (apiError: any) {
          console.error('API Error Details:', {
            error: apiError,
            message: apiError?.message,
            status: apiError?.status
          });
          
          // Zobrazení detailnější chybové zprávy
          const errorMsg = apiError?.message || 'Neznámá chyba';
          setError(`AI rozpoznání selhalo: ${errorMsg}. Upravte prosím menu ručně.`);
          
          setMenuItems([
            { id: Date.now() + 1, name: 'Menu 1', description: 'Vyplňte název jídla' },
            { id: Date.now() + 2, name: 'Menu 2', description: 'Vyplňte název jídla' },
            { id: Date.now() + 3, name: 'Menu 3', description: 'Vyplňte název jídla' }
          ]);
          setEditingMenu(true);
        }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setError('Chyba při nahrávání obrázku');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const updateMenuItem = (id: number, field: string, value: string) => {
    setMenuItems(menuItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addMenuItem = () => {
    setMenuItems([...menuItems, { 
      id: Date.now(), 
      name: 'Nové menu', 
      description: '' 
    }]);
  };

  const removeMenuItem = (id: number) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
  };

  const confirmMenu = async () => {
    if (menuItems.length === 0) {
      setError('Přidejte alespoň jednu položku menu');
      return;
    }
    
    try {
      // Uložení menu do databáze
      await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu: menuItems, image: menuImage })
      });
      
      setEditingMenu(false);
      setIsAdminUnlocked(false);
      setError('');
    } catch (error) {
      setError('Chyba při ukládání menu');
      console.error(error);
    }
  };

  const toggleNoteExpansion = (menuItemId: number) => {
    setExpandedNotes(prev => ({
      ...prev,
      [menuItemId]: !prev[menuItemId]
    }));
  };

  const submitOrder = async () => {
    if (!currentOrder.name || !currentOrder.name.trim()) {
      setError('⚠️ Vyplňte prosím své jméno - je to povinná položka!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const orderItems = currentOrder.items.filter(item => item.local > 0 || item.takeaway > 0);
    if (orderItems.length === 0) {
      setError('Vyberte alespoň jedno jídlo');
      return;
    }

    const newOrder: Order = {
      id: Date.now(),
      name: currentOrder.name.trim(),
      items: orderItems,
      timestamp: new Date().toISOString()
    };

    try {
      // Uložení objednávky do databáze
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      });
      
      setOrders([...orders, newOrder]);
      setSuccessMessage(`Objednávka pro ${newOrder.name} byla úspěšně přidána!`);
      setShowSuccessModal(true);
      setCurrentOrder({ name: '', items: [] });
      setExpandedNotes({});
      setError('');
    } catch (error) {
      setError('Chyba při ukládání objednávky');
      console.error(error);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage('');
  };

  const updateOrderPortions = (menuItemId: number, type: 'local' | 'takeaway', value: number) => {
    const existingItemIndex = currentOrder.items.findIndex(item => item.menuItemId === menuItemId);
    const newItems = [...currentOrder.items];

    if (existingItemIndex >= 0) {
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        [type]: Math.max(0, value)
      };
      
      if (newItems[existingItemIndex].local === 0 && newItems[existingItemIndex].takeaway === 0) {
        newItems.splice(existingItemIndex, 1);
      }
    } else if (value > 0) {
      newItems.push({ 
        menuItemId, 
        local: type === 'local' ? value : 0,
        takeaway: type === 'takeaway' ? value : 0,
        note: ''
      });
    }

    setCurrentOrder({ ...currentOrder, items: newItems });
  };

  const updateOrderNote = (menuItemId: number, note: string) => {
    const existingItemIndex = currentOrder.items.findIndex(item => item.menuItemId === menuItemId);
    const newItems = [...currentOrder.items];

    if (existingItemIndex >= 0) {
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        note: note
      };
    } else {
      newItems.push({ 
        menuItemId, 
        local: 0,
        takeaway: 0,
        note: note
      });
    }

    setCurrentOrder({ ...currentOrder, items: newItems });
  };

  const getOrderPortions = (menuItemId: number) => {
    const item = currentOrder.items.find(item => item.menuItemId === menuItemId);
    return item ? { local: item.local, takeaway: item.takeaway } : { local: 0, takeaway: 0 };
  };

  const getOrderNote = (menuItemId: number) => {
    const item = currentOrder.items.find(item => item.menuItemId === menuItemId);
    return item ? item.note || '' : '';
  };

  const getTotalPortions = (menuItemId: number) => {
    const portions = getOrderPortions(menuItemId);
    return portions.local + portions.takeaway;
  };

  const getRestaurantSummary = () => {
    const summary: Record<number, any> = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const menuItem = menuItems.find(m => m.id === item.menuItemId);
        if (!menuItem) return;

        if (!summary[menuItem.id]) {
          summary[menuItem.id] = {
            name: menuItem.name,
            local: { count: 0, notes: [] },
            takeaway: { count: 0, notes: [] }
          };
        }

        if (item.local > 0) {
          summary[menuItem.id].local.count += item.local;
          if (item.note && item.note.trim()) {
            summary[menuItem.id].local.notes.push({
              name: order.name,
              note: item.note.trim()
            });
          }
        }

        if (item.takeaway > 0) {
          summary[menuItem.id].takeaway.count += item.takeaway;
          if (item.note && item.note.trim()) {
            summary[menuItem.id].takeaway.notes.push({
              name: order.name,
              note: item.note.trim()
            });
          }
        }
      });
    });

    return Object.values(summary);
  };

  const exportForRestaurant = () => {
    const summary = getRestaurantSummary();
    const date = new Date().toLocaleDateString('cs-CZ');
    
    let text = `OBJEDNÁVKA OBĚDA - ${date}\n`;
    text += `${'='.repeat(50)}\n\n`;
    
    summary.forEach((item: any, index: number) => {
      text += `${index + 1}. ${item.name}\n`;
      
      if (item.local.count > 0) {
        text += `  * Na místě - ${item.local.count} ${item.local.count === 1 ? 'porce' : item.local.count < 5 ? 'porce' : 'porcí'}\n`;
        item.local.notes.forEach((note: any) => {
          text += `    * Poznámka: ${note.note} (${note.name})\n`;
        });
      }
      
      if (item.takeaway.count > 0) {
        text += `  * S sebou - ${item.takeaway.count} ${item.takeaway.count === 1 ? 'porce' : item.takeaway.count < 5 ? 'porce' : 'porcí'}\n`;
        item.takeaway.notes.forEach((note: any) => {
          text += `    * Poznámka: ${note.note} (${note.name})\n`;
        });
      }
      
      text += `\n`;
    });

    const totalPortions = summary.reduce((sum: number, item: any) => sum + item.local.count + item.takeaway.count, 0);
    text += `CELKOVÝ POČET PORCÍ: ${totalPortions}\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `objednavka-restaurace-${date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteOrder = async (orderId: number) => {
    if (!window.confirm('Opravdu chcete smazat tuto objednávku?')) return;
    
    try {
      await fetch(`/api/orders?id=${orderId}`, { method: 'DELETE' });
      setOrders(orders.filter(order => order.id !== orderId));
    } catch (error) {
      setError('Chyba při mazání objednávky');
      console.error(error);
    }
  };

  const resetAll = async () => {
    if (!window.confirm('Opravdu chcete resetovat celou aplikaci? Všechna data budou smazána.')) return;
    
    try {
      await fetch('/api/menu', { method: 'DELETE' });
      await fetch('/api/orders', { method: 'DELETE' });
      
      setMenuImage(null);
      setMenuItems([]);
      setOrders([]);
      setCurrentOrder({ name: '', items: [] });
      setExpandedNotes({});
      setEditingMenu(false);
      setIsAdminUnlocked(false);
      setError('');
    } catch (error) {
      setError('Chyba při resetování aplikace');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
          <p className="text-indigo-700 font-medium">Načítám aplikaci...</p>
        </div>
      </div>
    );
  }

  const SuccessModal = () => {
    if (!showSuccessModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-scale-in">
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="text-green-600" size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Úspěšně odesláno!</h3>
            <p className="text-gray-600 mb-6">{successMessage}</p>
            <button
              onClick={closeSuccessModal}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ImageModal = () => {
    if (!showImageModal || !menuImage) return null;

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4 cursor-zoom-out"
        onClick={() => setShowImageModal(false)}
      >
        <button
          onClick={() => setShowImageModal(false)}
          className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg z-10"
          aria-label="Zavřít"
        >
          <span className="text-gray-800 text-3xl font-bold leading-none">×</span>
        </button>
        <img 
          src={menuImage} 
          alt="Menu - zvětšený náhled" 
          className="max-w-full max-h-full object-contain animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🍽️ Objednávka Oběda</h1>
              <p className="text-gray-600 mt-1">Systém pro týmové objednávání</p>
            </div>
            {menuItems.length > 0 && (
              <button
                onClick={resetAll}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <Trash2 size={18} />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded animate-pulse">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          </div>
        )}

        <SuccessModal />
        <ImageModal />

        {/* ADMIN SECTION */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Lock size={24} className="text-indigo-600" />
              Admin sekce - Nahrání menu
            </h2>
            {!editingMenu && menuItems.length > 0 && (
              <button
                onClick={() => setIsAdminUnlocked(!isAdminUnlocked)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                {isAdminUnlocked ? <Unlock size={18} /> : <Lock size={18} />}
                {isAdminUnlocked ? 'Zamknout' : 'Odemknout'}
              </button>
            )}
          </div>

          {(!menuItems.length || isAdminUnlocked || editingMenu) ? (
            <>
              {!editingMenu ? (
                <label className="cursor-pointer block">
                  <div className="border-4 border-dashed border-indigo-300 rounded-lg p-8 hover:border-indigo-500 transition-colors bg-indigo-50 text-center">
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-indigo-600" size={48} />
                        <p className="text-indigo-700 font-medium">Rozpoznávám menu...</p>
                      </div>
                    ) : (
                      <>
                        <Camera className="mx-auto text-indigo-400 mb-4" size={48} />
                        <p className="text-lg text-gray-700 font-medium">Klikněte pro nahrání menu</p>
                        <p className="text-sm text-gray-500 mt-2">AI automaticky rozpozná všechna jídla</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isProcessing}
                  />
                </label>
              ) : (
                <>
                  {menuImage && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg relative">
                      <div className="relative inline-block mx-auto">
                        <img 
                          src={menuImage} 
                          alt="Menu" 
                          className="max-w-full h-auto rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity" 
                          style={{ maxHeight: '200px' }}
                          onClick={() => setShowImageModal(true)}
                        />
                        <button
                          onClick={() => setShowImageModal(true)}
                          className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all"
                          title="Zvětšit obrázek"
                        >
                          <ZoomIn size={20} className="text-indigo-600" />
                        </button>
                      </div>
                      <p className="text-center text-sm text-gray-500 mt-2">Klikněte na obrázek pro zvětšení</p>
                    </div>
                  )}

                  <div className="space-y-3 mb-4">
                    {menuItems.map((item, index) => (
                      <div key={item.id} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateMenuItem(item.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            placeholder={`Název jídla ${index + 1}`}
                          />
                        </div>
                        <button
                          onClick={() => removeMenuItem(item.id)}
                          className="mt-1 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={addMenuItem}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      + Přidat položku
                    </button>
                    <button
                      onClick={confirmMenu}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={20} />
                      Potvrdit menu
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Menu je uzamčeno. Klikněte na "Odemknout" pro úpravu.
            </div>
          )}
        </div>

        {/* ORDER FORM */}
        {menuItems.length > 0 && !editingMenu && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Objednávka</h2>

            {menuImage && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg relative">
                <div className="relative inline-block mx-auto">
                  <img 
                    src={menuImage} 
                    alt="Menu" 
                    className="max-w-full h-auto rounded-lg shadow-md cursor-pointer hover:opacity-90 transition-opacity" 
                    style={{ maxHeight: '200px' }}
                    onClick={() => setShowImageModal(true)}
                  />
                  <button
                    onClick={() => setShowImageModal(true)}
                    className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all"
                    title="Zvětšit obrázek"
                  >
                    <ZoomIn size={20} className="text-indigo-600" />
                  </button>
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">Klikněte na obrázek pro zvětšení</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vaše jméno <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={currentOrder.name}
                onChange={(e) => setCurrentOrder({ ...currentOrder, name: e.target.value })}
                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg ${
                  !currentOrder.name.trim() && error ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Např: Jan Novák"
              />
            </div>

            <div className="space-y-4 mb-4">
              {menuItems.map((item) => {
                const portions = getOrderPortions(item.id);
                const total = getTotalPortions(item.id);
                const note = getOrderNote(item.id);
                const isNoteExpanded = expandedNotes[item.id];

                return (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-lg text-gray-800 mb-3">{item.name}</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📍</span>
                          <span className="font-semibold text-gray-700">Na místě:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateOrderPortions(item.id, 'local', portions.local - 1)}
                            className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-bold text-lg"
                          >
                            −
                          </button>
                          <span className="w-10 text-center text-lg font-bold text-gray-800">{portions.local}</span>
                          <button
                            onClick={() => updateOrderPortions(item.id, 'local', portions.local + 1)}
                            className="w-8 h-8 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📦</span>
                          <span className="font-semibold text-gray-700">S sebou:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateOrderPortions(item.id, 'takeaway', portions.takeaway - 1)}
                            className="w-8 h-8 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-bold text-lg"
                          >
                            −
                          </button>
                          <span className="w-10 text-center text-lg font-bold text-gray-800">{portions.takeaway}</span>
                          <button
                            onClick={() => updateOrderPortions(item.id, 'takeaway', portions.takeaway + 1)}
                            className="w-8 h-8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="p-2 bg-white rounded-lg">
                        <button
                          onClick={() => toggleNoteExpansion(item.id)}
                          className="w-full flex items-center justify-between text-gray-700 hover:text-indigo-600 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <MessageSquare size={18} className="text-indigo-500" />
                            <span className="font-medium text-sm">
                              {note ? 'Poznámka: ' + (note.length > 25 ? note.substring(0, 25) + '...' : note) : 'Přidat poznámku'}
                            </span>
                          </div>
                          {isNoteExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        
                        {isNoteExpanded && (
                          <div className="mt-2">
                            <textarea
                              value={note}
                              onChange={(e) => updateOrderNote(item.id, e.target.value)}
                              placeholder="Např: Bez cibule, extra omáčka..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                              rows={2}
                            />
                          </div>
                        )}
                      </div>

                      {total > 0 && (
                        <div className="pt-2 border-t border-gray-300">
                          <p className="text-center font-bold text-indigo-600">
                            Celkem: {total} {total === 1 ? 'porce' : total < 5 ? 'porce' : 'porcí'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={submitOrder}
              className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg flex items-center justify-center gap-2 shadow-lg"
            >
              <CheckCircle size={24} />
              Přidat objednávku
            </button>
          </div>
        )}

        {/* ORDERS OVERVIEW */}
        {orders.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">👥 Kdo si co objednal</h2>
            
            <div className="space-y-3">
              {orders.map((order, index) => (
                <div key={order.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800 mb-2">
                        {index + 1}. {order.name}
                      </h3>
                      <ul className="space-y-2">
                        {order.items.map((item, itemIndex) => {
                          const menuItem = menuItems.find(m => m.id === item.menuItemId);
                          if (!menuItem) return null;

                          const parts = [];
                          if (item.local > 0) {
                            parts.push(
                              <span key="local" className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                📍 {item.local}× místě
                              </span>
                            );
                          }
                          if (item.takeaway > 0) {
                            parts.push(
                              <span key="takeaway" className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                📦 {item.takeaway}× sebou
                              </span>
                            );
                          }

                          return (
                            <li key={itemIndex} className="text-gray-700">
                              <span className="font-semibold">{menuItem.name}:</span>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {parts}
                              </div>
                              {item.note && item.note.trim() && (
                                <div className="mt-1 p-2 bg-yellow-50 border-l-2 border-yellow-400 rounded text-sm">
                                  <span className="text-yellow-800">
                                    💬 {item.note.trim()}
                                  </span>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESTAURANT SUMMARY */}
        {orders.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">📋 Souhrn pro restauraci</h2>
              <button
                onClick={exportForRestaurant}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download size={18} />
                Stáhnout
              </button>
            </div>
            
            <div className="space-y-4">
              {getRestaurantSummary().map((item: any, index: number) => (
                <div key={index} className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-l-4 border-green-500">
                  <h3 className="font-bold text-lg text-gray-800 mb-3">{item.name}</h3>
                  
                  {item.local.count > 0 && (
                    <div className="mb-2">
                      <p className="font-semibold text-green-700">
                        * Na místě - {item.local.count} {item.local.count === 1 ? 'porce' : item.local.count < 5 ? 'porce' : 'porcí'}
                      </p>
                      {item.local.notes.map((note: any, noteIndex: number) => (
                        <p key={noteIndex} className="ml-4 text-sm text-gray-700">
                          * Poznámka: {note.note} ({note.name})
                        </p>
                      ))}
                    </div>
                  )}
                  
                  {item.takeaway.count > 0 && (
                    <div>
                      <p className="font-semibold text-blue-700">
                        * S sebou - {item.takeaway.count} {item.takeaway.count === 1 ? 'porce' : item.takeaway.count < 5 ? 'porce' : 'porcí'}
                      </p>
                      {item.takeaway.notes.map((note: any, noteIndex: number) => (
                        <p key={noteIndex} className="ml-4 text-sm text-gray-700">
                          * Poznámka: {note.note} ({note.name})
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
              <p className="text-center text-xl font-bold text-indigo-800">
                CELKEM: {getRestaurantSummary().reduce((sum: number, item: any) => sum + item.local.count + item.takeaway.count, 0)} porcí
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
