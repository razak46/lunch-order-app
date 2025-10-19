'use client';

import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, AlertCircle, Loader2, Trash2, MessageSquare, ChevronDown, ChevronUp, Download, Lock, Unlock, Info, Users, ShoppingBag, X, Eye, Plus, Minus } from 'lucide-react';

const LunchOrderApp = () => {
  // Admin state
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  // Menu state
  const [menuImage, setMenuImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [isMenuConfirmed, setIsMenuConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  // User order state
  const [userName, setUserName] = useState('');
  const [selectedItems, setSelectedItems] = useState({}); // { "itemName-namiste": true, "itemName-ssebou": true }
  const [quantities, setQuantities] = useState({}); // { "itemName-namiste": 2, "itemName-ssebou": 1 }
  const [notes, setNotes] = useState({}); // { "itemName-namiste": "note", "itemName-ssebou": "note" }
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  // NEW: Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Orders display state
  const [allOrders, setAllOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [showOrdersSection, setShowOrdersSection] = useState(true);

  // Load menu on mount
  useEffect(() => {
    loadMenu();
    loadOrders();
    // Refresh orders every 30 seconds
    const interval = setInterval(loadOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMenu = async () => {
    try {
      setIsLoadingMenu(true);
      const response = await fetch('/api/menu');
      const data = await response.json();
      
      if (data.menu && data.menuItems) {
        setMenuImage(data.menu);
        setMenuItems(data.menuItems);
        setIsMenuConfirmed(true);
      }
    } catch (err) {
      console.error('Error loading menu:', err);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const loadOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const response = await fetch('/api/orders');
      const data = await response.json();
      
      if (data.orders) {
        setAllOrders(data.orders);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsAdminMode(true);
      setShowAdminLogin(false);
      setAdminPassword('');
    } else {
      setError('Nesprávné heslo');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Image = event.target.result;
      setMenuImage(base64Image);
      setIsProcessing(true);
      setError('');

      try {
        const response = await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image: base64Image.split(',')[1],
            action: 'analyze'
          })
        });

        const data = await response.json();
        
        if (data.error) {
          setError(data.error);
        } else if (data.menuItems) {
          setMenuItems(data.menuItems);
        }
      } catch (err) {
        setError('Chyba při zpracování: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const confirmMenu = async () => {
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          menu: menuImage,
          menuItems: menuItems
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setIsMenuConfirmed(true);
        setError('');
      } else {
        setError(data.error || 'Chyba při potvrzení menu');
      }
    } catch (err) {
      setError('Chyba při ukládání menu');
    }
  };

  const clearMenu = async () => {
    try {
      await fetch('/api/menu', {
        method: 'DELETE'
      });
      
      setMenuImage(null);
      setMenuItems([]);
      setIsMenuConfirmed(false);
      setAllOrders([]);
    } catch (err) {
      setError('Chyba při mazání menu');
    }
  };

  const getItemKey = (itemName, type) => `${itemName}-${type}`;

  const toggleItemSelection = (itemName, type) => {
    const key = getItemKey(itemName, type);
    setSelectedItems(prev => {
      const newSelected = !prev[key];
      // Initialize quantity when selecting
      if (newSelected && !quantities[key]) {
        setQuantities(prevQty => ({
          ...prevQty,
          [key]: 1
        }));
      }
      return {
        ...prev,
        [key]: newSelected
      };
    });
  };

  const updateQuantity = (itemName, type, change) => {
    const key = getItemKey(itemName, type);
    setQuantities(prev => {
      const currentQty = prev[key] || 1;
      const newQty = Math.max(0, Math.min(99, currentQty + change));
      
      // If quantity becomes 0, deselect the item
      if (newQty === 0) {
        setSelectedItems(prevSelected => ({
          ...prevSelected,
          [key]: false
        }));
      }
      
      return {
        ...prev,
        [key]: newQty
      };
    });
  };

  const toggleItemExpanded = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  // NEW: Show confirmation dialog instead of direct submit
  const handleOrderClick = () => {
    if (!userName || Object.keys(selectedItems).filter(k => selectedItems[k]).length === 0) {
      return;
    }
    setShowConfirmDialog(true);
  };

  // NEW: Actual submit after confirmation
  const confirmAndSubmitOrder = async () => {
    try {
      const orderData = {
        userName,
        items: Object.entries(selectedItems)
          .filter(([_, selected]) => selected)
          .map(([key]) => {
            const [itemName, type] = key.split('-');
            return {
              name: itemName,
              quantity: quantities[key] || 1,
              type: type,
              note: notes[key] || ''
            };
          }),
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();
      
      if (data.success) {
        setOrderSubmitted(true);
        setShowConfirmDialog(false);
        loadOrders(); // Refresh orders list
        setError('');
      } else {
        setError(data.error || 'Chyba při odesílání objednávky');
        setShowConfirmDialog(false);
      }
    } catch (err) {
      setError('Chyba při odesílání objednávky');
      setShowConfirmDialog(false);
    }
  };

  const exportOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      
      if (data.orders && data.orders.length > 0) {
        let exportText = '🍽️ OBJEDNÁVKY OBĚDŮ\n';
        exportText += '═══════════════════════════════════\n\n';

        // Group items by type across all orders
        const namiste = [];
        const ssebou = [];
        
        data.orders.forEach(order => {
          order.items.forEach(item => {
            const entry = {
              userName: order.userName,
              itemName: item.name,
              quantity: item.quantity || 1,
              note: item.note || '',
              timestamp: order.timestamp
            };
            
            if (item.type === 'namiste') {
              namiste.push(entry);
            } else {
              ssebou.push(entry);
            }
          });
        });

        if (namiste.length > 0) {
          exportText += '🍽️ NA MÍSTĚ:\n';
          exportText += '─────────────────────────────────\n';
          namiste.forEach(entry => {
            exportText += `\n👤 ${entry.userName}\n`;
            exportText += `   ${entry.quantity}× ${entry.itemName}`;
            if (entry.note) {
              exportText += ` - ${entry.note}`;
            }
            exportText += '\n';
          });
          exportText += '\n';
        }

        if (ssebou.length > 0) {
          exportText += '🥡 S SEBOU:\n';
          exportText += '─────────────────────────────────\n';
          ssebou.forEach(entry => {
            exportText += `\n👤 ${entry.userName}\n`;
            exportText += `   ${entry.quantity}× ${entry.itemName}`;
            if (entry.note) {
              exportText += ` - ${entry.note}`;
            }
            exportText += '\n';
          });
        }

        exportText += '\n═══════════════════════════════════\n';
        exportText += `Celkem objednávek: ${data.orders.length}\n`;
        exportText += `Na místě: ${namiste.length} položek\n`;
        exportText += `S sebou: ${ssebou.length} položek\n`;
        exportText += `Vygenerováno: ${new Date().toLocaleString('cs-CZ')}\n`;

        const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `objednavky-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Chyba při exportu objednávek');
    }
  };

  // NEW: Confirmation Dialog Component
  const ConfirmationDialog = () => {
    const selectedItemsList = Object.entries(selectedItems)
      .filter(([_, selected]) => selected)
      .map(([key]) => {
        const [itemName, type] = key.split('-');
        return {
          name: itemName,
          quantity: quantities[key] || 1,
          type: type,
          note: notes[key] || ''
        };
      });

    const totalItems = selectedItemsList.reduce((sum, item) => sum + item.quantity, 0);
    const namiste = selectedItemsList.filter(item => item.type === 'namiste');
    const ssebou = selectedItemsList.filter(item => item.type === 'ssebou');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Kontrola objednávky</h2>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* User info */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Jméno</p>
                  <p className="font-semibold text-lg">{userName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Shrnutí</p>
                  <p className="font-semibold text-lg">
                    {namiste.length > 0 && `🍽️ ${namiste.reduce((sum, item) => sum + item.quantity, 0)}× na místě`}
                    {namiste.length > 0 && ssebou.length > 0 && ' | '}
                    {ssebou.length > 0 && `🥡 ${ssebou.reduce((sum, item) => sum + item.quantity, 0)}× s sebou`}
                  </p>
                </div>
              </div>
            </div>

            {/* Selected items */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-500" />
                Vybraná jídla ({selectedItemsList.length} položek, {totalItems} ks celkem)
              </h3>
              <div className="space-y-3">
                {selectedItemsList.map((item, index) => (
                  <div key={index} className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.type === 'namiste' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.type === 'namiste' ? '🍽️ Na místě' : '🥡 S sebou'}
                        </span>
                      </div>
                      <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {item.quantity}× ks
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-sm text-gray-600 mt-1">
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        {item.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Zkontrolujte svou objednávku</p>
                  <p>Po potvrzení již nebude možné objednávku změnit. Ujistěte se, že máte vše správně.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 flex gap-3">
            <button
              onClick={() => setShowConfirmDialog(false)}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Zpět k úpravě
            </button>
            <button
              onClick={confirmAndSubmitOrder}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <CheckCircle className="w-5 h-5" />
              Potvrzuji objednávku
            </button>
          </div>
        </div>
      </div>
    );
  };

  // NEW: Orders Display Component
  const OrdersDisplay = () => {
    if (allOrders.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Zatím žádné objednávky</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{allOrders.length}</p>
            <p className="text-sm text-blue-800">Celkem objednávek</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {allOrders.reduce((sum, order) => sum + order.items.length, 0)}
            </p>
            <p className="text-sm text-green-800">Celkem položek</p>
          </div>
        </div>

        {/* Orders list */}
        <div>
          <h4 className="font-semibold text-lg mb-3">Všechny objednávky</h4>
          <div className="space-y-3">
            {allOrders.map((order, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-semibold text-gray-800">{order.userName}</p>
                  <span className="text-xs text-gray-500">
                    {new Date(order.timestamp).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-orange-600">{item.quantity}×</span>
                        <span className="text-gray-700">{item.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.type === 'namiste' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.type === 'namiste' ? '🍽️' : '🥡'}
                        </span>
                      </div>
                      {item.note && (
                        <span className="text-gray-500 text-xs">({item.note})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoadingMenu) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Načítám menu...</p>
        </div>
      </div>
    );
  }

  // Admin mode
  if (isAdminMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Admin header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-orange-500" />
                <h1 className="text-2xl font-bold text-gray-800">Admin režim</h1>
              </div>
              <button
                onClick={() => setIsAdminMode(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex items-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                Odhlásit
              </button>
            </div>
          </div>

          {/* Menu management */}
          {!isMenuConfirmed ? (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Nahrát menu</h2>
              
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="menu-upload"
              />
              
              <label
                htmlFor="menu-upload"
                className="cursor-pointer block w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-500 transition-colors"
              >
                <Camera className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">Klikněte pro výběr fotky menu</p>
              </label>

              {menuImage && (
                <div className="mt-6">
                  <img src={menuImage} alt="Menu" className="w-full rounded-lg shadow-lg mb-4" />
                  
                  {isProcessing && (
                    <div className="flex items-center justify-center gap-2 text-orange-500 mb-4">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Rozpoznávám menu...</span>
                    </div>
                  )}

                  {menuItems.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Rozpoznaná jídla:</h3>
                      <div className="space-y-2 mb-4">
                        {menuItems.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const newItems = [...menuItems];
                                newItems[index].name = e.target.value;
                                setMenuItems(newItems);
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                            />
                            <button
                              onClick={() => setMenuItems(menuItems.filter((_, i) => i !== index))}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setMenuItems([...menuItems, { name: '' }])}
                        className="w-full mb-4 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 transition-colors"
                      >
                        + Přidat jídlo
                      </button>

                      <button
                        onClick={confirmMenu}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Potvrdit a publikovat menu
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Menu preview */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Aktivní menu</h2>
                  <button
                    onClick={clearMenu}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Smazat menu
                  </button>
                </div>
                
                {menuImage && (
                  <img src={menuImage} alt="Menu" className="w-full rounded-lg shadow-lg mb-4" />
                )}
                
                <div className="space-y-2">
                  {menuItems.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      {item.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Orders management */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="w-6 h-6 text-orange-500" />
                    Objednávky ({allOrders.length})
                  </h2>
                  <button
                    onClick={exportOrders}
                    disabled={allOrders.length === 0}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>

                <OrdersDisplay />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // User mode - Order submitted
  if (orderSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Objednávka odeslána!</h2>
          <p className="text-gray-600 mb-6">Vaše objednávka byla úspěšně přijata.</p>
          <button
            onClick={() => {
              setOrderSubmitted(false);
              setUserName('');
              setSelectedItems({});
              setQuantities({});
              setNotes({});
              loadOrders();
            }}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Odeslat další objednávku
          </button>
        </div>
      </div>
    );
  }

  // User mode - No menu available
  if (!isMenuConfirmed || menuItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowAdminLogin(true)}
              className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
            >
              <Lock className="w-5 h-5" />
            </button>
          </div>
          
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-10 h-10 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Menu není k dispozici</h2>
          <p className="text-gray-600">Administrátor zatím nenahrál dnešní menu. Zkuste to prosím později.</p>
        </div>

        {showAdminLogin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full">
              <h3 className="text-xl font-semibold mb-4">Admin přihlášení</h3>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                placeholder="Heslo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAdminLogin(false);
                    setAdminPassword('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Zrušit
                </button>
                <button
                  onClick={handleAdminLogin}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
                >
                  Přihlásit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // User mode - Order form
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Objednávka oběda</h1>
            <button
              onClick={() => setShowAdminLogin(true)}
              className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
            >
              <Lock className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Menu preview */}
        {menuImage && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Dnešní menu</h2>
            <img src={menuImage} alt="Menu" className="w-full rounded-lg shadow-lg" />
          </div>
        )}

        {/* User info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Vaše údaje</h2>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Vaše jméno"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Menu selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Výběr jídla</h2>
          
          <div className="space-y-4">
            {menuItems.map((item, index) => {
              const namisteKey = getItemKey(item.name, 'namiste');
              const ssebouKey = getItemKey(item.name, 'ssebou');
              const isNamisteSelected = selectedItems[namisteKey];
              const isSsebouSelected = selectedItems[ssebouKey];
              const isAnySelected = isNamisteSelected || isSsebouSelected;
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Item name header */}
                  <div className="bg-gray-50 p-3 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <button
                      onClick={() => toggleItemExpanded(item.name)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      {expandedItems[item.name] ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>

                  {/* Selection buttons */}
                  <div className="p-4 space-y-3">
                    {/* Na místě option */}
                    <div className={`border-2 rounded-lg p-3 transition-all ${
                      isNamisteSelected 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-green-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => toggleItemSelection(item.name, 'namiste')}
                          className="flex items-center gap-3 flex-1"
                        >
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            isNamisteSelected
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300'
                          }`}>
                            {isNamisteSelected && (
                              <CheckCircle className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <span className="font-medium text-gray-700">🍽️ Na místě</span>
                        </button>
                        
                        {isNamisteSelected && (
                          <div className="flex items-center gap-2 bg-white border-2 border-green-300 rounded-lg px-2">
                            <button
                              onClick={() => updateQuantity(item.name, 'namiste', -1)}
                              className="text-green-600 hover:text-green-700 font-bold text-lg px-2 py-1"
                              title={quantities[namisteKey] === 1 ? "Kliknutím odznačíte" : "Snížit počet"}
                            >
                              −
                            </button>
                            <span className="font-bold text-gray-800 min-w-[2ch] text-center">
                              {quantities[namisteKey] || 1}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.name, 'namiste', 1)}
                              className="text-green-600 hover:text-green-700 font-bold text-lg px-2 py-1"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* S sebou option */}
                    <div className={`border-2 rounded-lg p-3 transition-all ${
                      isSsebouSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => toggleItemSelection(item.name, 'ssebou')}
                          className="flex items-center gap-3 flex-1"
                        >
                          <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                            isSsebouSelected
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {isSsebouSelected && (
                              <CheckCircle className="w-5 h-5 text-white" />
                            )}
                          </div>
                          <span className="font-medium text-gray-700">🥡 S sebou</span>
                        </button>
                        
                        {isSsebouSelected && (
                          <div className="flex items-center gap-2 bg-white border-2 border-blue-300 rounded-lg px-2">
                            <button
                              onClick={() => updateQuantity(item.name, 'ssebou', -1)}
                              className="text-blue-600 hover:text-blue-700 font-bold text-lg px-2 py-1"
                              title={quantities[ssebouKey] === 1 ? "Kliknutím odznačíte" : "Snížit počet"}
                            >
                              −
                            </button>
                            <span className="font-bold text-gray-800 min-w-[2ch] text-center">
                              {quantities[ssebouKey] || 1}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.name, 'ssebou', 1)}
                              className="text-blue-600 hover:text-blue-700 font-bold text-lg px-2 py-1"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes section - only show when any option is selected */}
                    {isAnySelected && (
                      <div className="pt-3 border-t border-gray-200 space-y-2">
                        {isNamisteSelected && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Poznámka k "Na místě"
                            </label>
                            <input
                              type="text"
                              value={notes[namisteKey] || ''}
                              onChange={(e) => setNotes({ ...notes, [namisteKey]: e.target.value })}
                              placeholder="např. bez cibule, méně soli..."
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                        )}
                        {isSsebouSelected && (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Poznámka k "S sebou"
                            </label>
                            <input
                              type="text"
                              value={notes[ssebouKey] || ''}
                              onChange={(e) => setNotes({ ...notes, [ssebouKey]: e.target.value })}
                              placeholder="např. bez cibule, méně soli..."
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* NEW: Live orders display */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Eye className="w-6 h-6 text-orange-500" />
              Aktuální objednávky ({allOrders.length})
            </h2>
            <button
              onClick={() => setShowOrdersSection(!showOrdersSection)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {showOrdersSection ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
          </div>
          
          {showOrdersSection && (
            <div>
              {isLoadingOrders ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Načítám objednávky...</p>
                </div>
              ) : (
                <>
                  <OrdersDisplay />
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={loadOrders}
                      className="px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Loader2 className="w-4 h-4" />
                      Obnovit seznam
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Submit button */}
        <button
          onClick={handleOrderClick}
          disabled={!userName || Object.keys(selectedItems).filter(k => selectedItems[k]).length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          <ShoppingBag className="w-5 h-5" />
          Pokračovat k potvrzení
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Info box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Tip:</p>
              <p>U každého jídla můžeš vybrat:</p>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li><strong>🍽️ Na místě</strong> - zaškrtni a nastav počet</li>
                <li><strong>🥡 S sebou</strong> - zaškrtni a nastav počet</li>
                <li><strong>Oboje najednou!</strong> - např. 2× na místě + 1× s sebou</li>
                <li>Klikni na šipku ⌄ pro přidání poznámek</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Admin login modal */}
        {showAdminLogin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full">
              <h3 className="text-xl font-semibold mb-4">Admin přihlášení</h3>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                placeholder="Heslo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAdminLogin(false);
                    setAdminPassword('');
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Zrušit
                </button>
                <button
                  onClick={handleAdminLogin}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
                >
                  Přihlásit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NEW: Confirmation Dialog */}
      {showConfirmDialog && <ConfirmationDialog />}
    </div>
  );
};

export default LunchOrderApp;
