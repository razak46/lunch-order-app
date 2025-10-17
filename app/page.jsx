'use client';

import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, AlertCircle, Loader2, Trash2, MessageSquare, ChevronDown, ChevronUp, Download, Lock, Unlock, Info, Users, ShoppingBag } from 'lucide-react';

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
  const [orderType, setOrderType] = useState('namiste');
  const [orderTypeNote, setOrderTypeNote] = useState('');
  const [selectedItems, setSelectedItems] = useState({});
  const [notes, setNotes] = useState({});
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [orderSubmitted, setOrderSubmitted] = useState(false);

  // Load menu on mount
  useEffect(() => {
    loadMenu();
  }, []);

  const loadMenu = async () => {
    try {
      setIsLoadingMenu(true);
      const response = await fetch('/api/menu');
      const data = await response.json();
      
      if (data.menu) {
        setMenuItems(data.menu.items || []);
        setMenuImage(data.menu.image || null);
        setIsMenuConfirmed(true);
      }
      
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Error loading menu:', err);
    } finally {
      setIsLoadingMenu(false);
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsAdminMode(true);
      setShowAdminLogin(false);
      setError('');
    } else {
      setError('Nesprávné heslo');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMenuImage(e.target.result);
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const recognizeMenu = async () => {
    if (!menuImage) {
      setError('Nejprve nahrajte obrázek menu');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: menuImage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to recognize menu');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setMenuItems(data.items || []);
      
    } catch (err) {
      console.error('Error:', err);
      setError('Chyba při rozpoznávání menu. Zkuste to prosím znovu nebo přidejte jídla ručně.');
    } finally {
      setIsProcessing(false);
    }
  };

  const addMenuItem = () => {
    setMenuItems([...menuItems, { name: '', price: '' }]);
  };

  const updateMenuItem = (index, field, value) => {
    const updated = [...menuItems];
    updated[index][field] = value;
    setMenuItems(updated);
  };

  const removeMenuItem = (index) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const confirmMenu = async () => {
    if (menuItems.length === 0) {
      setError('Přidejte alespoň jedno jídlo');
      return;
    }

    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: menuItems,
          image: menuImage
        })
      });

      if (response.ok) {
        setIsMenuConfirmed(true);
        setError('');
        alert('Menu bylo úspěšně uloženo! Nyní můžete sdílet URL s týmem.');
      }
    } catch (err) {
      setError('Chyba při ukládání menu');
    }
  };

  const toggleItemSelection = (itemName) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const updateNote = (itemName, note) => {
    setNotes(prev => ({
      ...prev,
      [itemName]: note
    }));
  };

  const submitOrder = async () => {
    if (!userName.trim()) {
      setError('Zadejte prosím vaše jméno');
      return;
    }

    const selectedItemsList = menuItems
      .filter(item => selectedItems[item.name])
      .map(item => ({
        name: item.name,
        price: item.price,
        note: notes[item.name] || ''
      }));

    if (selectedItemsList.length === 0) {
      setError('Vyberte alespoň jedno jídlo');
      return;
    }

    const order = {
      userName,
      orderType,
      orderTypeNote: orderTypeNote.trim(),
      items: selectedItemsList,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });

      if (response.ok) {
        setOrderSubmitted(true);
        setError('');
        // Reload orders
        loadMenu();
      }
    } catch (err) {
      setError('Chyba při odesílání objednávky');
    }
  };

  const resetMenu = async () => {
    if (confirm('Opravdu chcete smazat aktuální menu a všechny objednávky?')) {
      try {
        await fetch('/api/menu', { method: 'DELETE' });
        setMenuItems([]);
        setMenuImage(null);
        setIsMenuConfirmed(false);
        setOrders([]);
        alert('Menu a objednávky byly smazány');
      } catch (err) {
        setError('Chyba při mazání menu');
      }
    }
  };

  const exportOrders = () => {
    const namiste = orders.filter(o => o.orderType === 'namiste');
    const ssebou = orders.filter(o => o.orderType === 'ssebou');

    let text = '=== OBJEDNÁVKY OBĚDŮ ===\n\n';
    
    if (namiste.length > 0) {
      text += '🍽️ NA MÍSTĚ:\n';
      text += '─────────────────\n';
      namiste.forEach(order => {
        text += `\n${order.userName}:\n`;
        if (order.orderTypeNote) {
          text += `  📍 ${order.orderTypeNote}\n`;
        }
        order.items.forEach(item => {
          text += `  • ${item.name}`;
          if (item.price) text += ` (${item.price})`;
          if (item.note) text += `\n    Poznámka: ${item.note}`;
          text += '\n';
        });
      });
    }

    if (ssebou.length > 0) {
      text += '\n🥡 S SEBOU:\n';
      text += '─────────────────\n';
      ssebou.forEach(order => {
        text += `\n${order.userName}:\n`;
        if (order.orderTypeNote) {
          text += `  📍 ${order.orderTypeNote}\n`;
        }
        order.items.forEach(item => {
          text += `  • ${item.name}`;
          if (item.price) text += ` (${item.price})`;
          if (item.note) text += `\n    Poznámka: ${item.note}`;
          text += '\n';
        });
      });
    }

    text += `\n\n📊 CELKEM: ${orders.length} objednávek`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `objednavky-${new Date().toLocaleDateString('cs-CZ')}.txt`;
    a.click();
  };

  // Loading state
  if (isLoadingMenu) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Admin header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-orange-500" />
                <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
              </div>
              <button
                onClick={() => setIsAdminMode(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Odhlásit
              </button>
            </div>
            
            {isMenuConfirmed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-800">Menu je aktivní! Uživatelé nyní mohou objednávat.</p>
                </div>
                <p className="text-sm text-green-600 mt-2">
                  Sdílej tento odkaz: <code className="bg-white px-2 py-1 rounded">{window.location.href.replace(/\?.*/, '')}</code>
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>

          {!isMenuConfirmed ? (
            <>
              {/* Upload section */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Nahrát menu
                </h2>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="menu-upload"
                  />
                  <label
                    htmlFor="menu-upload"
                    className="cursor-pointer inline-flex flex-col items-center gap-2"
                  >
                    <Camera className="w-12 h-12 text-gray-400" />
                    <span className="text-gray-600">Klikněte pro nahrání fotky menu</span>
                  </label>
                </div>

                {menuImage && (
                  <div className="mt-4">
                    <img src={menuImage} alt="Menu" className="max-w-full rounded-lg" />
                    <button
                      onClick={recognizeMenu}
                      disabled={isProcessing}
                      className="mt-4 w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Rozpoznávám menu...
                        </>
                      ) : (
                        'Rozpoznat menu pomocí AI'
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Menu items editor */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Menu položky</h2>
                
                {menuItems.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateMenuItem(index, 'name', e.target.value)}
                      placeholder="Název jídla"
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                    />
                    <input
                      type="text"
                      value={item.price}
                      onChange={(e) => updateMenuItem(index, 'price', e.target.value)}
                      placeholder="Cena"
                      className="w-32 border border-gray-300 rounded-lg px-4 py-2"
                    />
                    <button
                      onClick={() => removeMenuItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={addMenuItem}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 hover:border-orange-500 hover:text-orange-500 transition-colors"
                >
                  + Přidat jídlo
                </button>

                <button
                  onClick={confirmMenu}
                  disabled={menuItems.length === 0}
                  className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Potvrdit a publikovat menu
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Confirmed menu view */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Aktuální menu</h2>
                  <button
                    onClick={resetMenu}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Smazat menu
                  </button>
                </div>
                
                {menuImage && (
                  <img src={menuImage} alt="Menu" className="max-w-full rounded-lg mb-4" />
                )}
                
                <div className="space-y-2">
                  {menuItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-gray-600">{item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Orders section */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Objednávky ({orders.length})
                  </h2>
                  {orders.length > 0 && (
                    <button
                      onClick={exportOrders}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  )}
                </div>

                {orders.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Zatím žádné objednávky</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-lg">{order.userName}</span>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            order.orderType === 'namiste' 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {order.orderType === 'namiste' ? '🍽️ Na místě' : '🥡 S sebou'}
                          </span>
                        </div>
                        {order.orderTypeNote && (
                          <div className="mb-2 text-sm text-gray-600 italic bg-gray-50 p-2 rounded">
                            📍 {order.orderTypeNote}
                          </div>
                        )}
                        <div className="space-y-1">
                          {order.items.map((item, i) => (
                            <div key={i} className="text-gray-700">
                              • {item.name}
                              {item.note && (
                                <span className="text-sm text-gray-500 ml-2">({item.note})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // User mode - no menu available
  if (!isMenuConfirmed || menuItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Menu není dostupné</h2>
          <p className="text-gray-600 mb-6">
            Admin zatím nenahrál menu pro tento týden. Zkuste to prosím později.
          </p>
          <button
            onClick={() => setShowAdminLogin(true)}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <Lock className="w-4 h-4" />
            Přihlásit jako admin
          </button>

          {showAdminLogin && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                placeholder="Heslo"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-2"
              />
              <button
                onClick={handleAdminLogin}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg"
              >
                Přihlásit
              </button>
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // User mode - order submitted
  if (orderSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Objednávka odeslána!</h2>
          <p className="text-gray-600 mb-6">
            Vaše objednávka byla úspěšně zaznamenána.
          </p>
          <button
            onClick={() => {
              setOrderSubmitted(false);
              setUserName('');
              setOrderTypeNote('');
              setSelectedItems({});
              setNotes({});
            }}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Odeslat další objednávku
          </button>
        </div>
      </div>
    );
  }

  // User mode - order form
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-800">Objednávka oběda</h1>
            <button
              onClick={() => setShowAdminLogin(!showAdminLogin)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <Lock className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600">Vyber si z dnešního menu</p>

          {showAdminLogin && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                placeholder="Admin heslo"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-2"
              />
              <button
                onClick={handleAdminLogin}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg"
              >
                Přihlásit
              </button>
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Menu image */}
        {menuImage && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <img src={menuImage} alt="Menu" className="w-full rounded-lg" />
          </div>
        )}

        {/* User info */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Tvoje informace</h2>
          
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Tvoje jméno"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 text-lg"
          />

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setOrderType('namiste')}
              className={`p-4 rounded-lg border-2 transition-all ${
                orderType === 'namiste'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-green-300'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🍽️</div>
                <div className="font-semibold">Na místě</div>
              </div>
            </button>

            <button
              onClick={() => setOrderType('ssebou')}
              className={`p-4 rounded-lg border-2 transition-all ${
                orderType === 'ssebou'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🥡</div>
                <div className="font-semibold">S sebou</div>
              </div>
            </button>
          </div>

          <div className="mt-4">
            <input
              type="text"
              value={orderTypeNote}
              onChange={(e) => setOrderTypeNote(e.target.value)}
              placeholder={orderType === 'namiste' ? 'Poznámka k místu (např. zasedačka, stůl 5...)' : 'Poznámka k odběru (např. čas odběru, kam dodat...)'}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm"
            />
          </div>
        </div>

        {/* Menu selection */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Výběr jídla</h2>
          
          <div className="space-y-3">
            {menuItems.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleItemSelection(item.name)}
                  className={`w-full p-4 text-left transition-colors ${
                    selectedItems[item.name]
                      ? 'bg-orange-50 border-l-4 border-orange-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                        selectedItems[item.name]
                          ? 'bg-orange-500 border-orange-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedItems[item.name] && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">{item.name}</div>
                        {item.price && (
                          <div className="text-sm text-gray-500">{item.price}</div>
                        )}
                      </div>
                    </div>
                    {selectedItems[item.name] && (
                      <MessageSquare className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                </button>
                
                {selectedItems[item.name] && (
                  <div className="px-4 pb-4 bg-orange-50">
                    <input
                      type="text"
                      value={notes[item.name] || ''}
                      onChange={(e) => updateNote(item.name, e.target.value)}
                      placeholder="Poznámka (např. bez cibule, méně soli...)"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={submitOrder}
          disabled={!userName || Object.keys(selectedItems).filter(k => selectedItems[k]).length === 0}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 px-6 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          <ShoppingBag className="w-5 h-5" />
          Odeslat objednávku
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
              <p>U každého jídla můžeš přidat poznámku (např. "bez cibule", "méně solené").</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LunchOrderApp;