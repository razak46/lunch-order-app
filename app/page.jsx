'use client';
import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle, AlertCircle, Loader2, Trash2, MessageSquare, ChevronDown, ChevronUp, Download, Lock, Unlock, Info, Users, ShoppingBag, X, Eye, Plus, Minus, ArrowUp, ArrowDown, Edit2, Save } from 'lucide-react';

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
  const [selectedItems, setSelectedItems] = useState({});
  const [quantities, setQuantities] = useState({});
  const [notes, setNotes] = useState({});
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  // NEW: Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Orders display state
  const [allOrders, setAllOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [showOrdersSection, setShowOrdersSection] = useState(true);

  // Order editing state (admin)
  const [editingOrder, setEditingOrder] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Drinks state
  const [drinks, setDrinks] = useState([]);
  const [isLoadingDrinks, setIsLoadingDrinks] = useState(false);
  const [showDrinksManager, setShowDrinksManager] = useState(false);

  // Check for admin mode from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === 'true') {
      const adminCookie = document.cookie.split('; ').find(row => row.startsWith('admin='));
      if (adminCookie) {
        setIsAdminMode(true);
      }
    }
  }, []);

  // Load menu on mount
  useEffect(() => {
    loadMenu();
    loadOrders();
    loadDrinks();
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

  const loadDrinks = async () => {
    try {
      setIsLoadingDrinks(true);
      const response = await fetch('/api/drinks');
      const data = await response.json();
      
      if (data.drinks) {
        setDrinks(data.drinks);
      }
    } catch (err) {
      console.error('Error loading drinks:', err);
    } finally {
      setIsLoadingDrinks(false);
    }
  };

  const saveDrinks = async (updatedDrinks) => {
    try {
      const response = await fetch('/api/drinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drinks: updatedDrinks })
      });

      const data = await response.json();
      
      if (data.success) {
        setDrinks(updatedDrinks);
        // Show success feedback
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successMsg.textContent = '✓ Nápoje uloženy';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 2000);
      } else {
        setError(data.error || 'Chyba při ukládání nápojů');
      }
    } catch (err) {
      setError('Chyba při ukládání nápojů');
    }
  };

  const toggleDrinkActive = (id) => {
    setDrinks(prev => prev.map(drink => 
      drink.id === id ? { ...drink, active: !drink.active } : drink
    ));
  };

  const toggleDrinkSeasonal = (id) => {
    setDrinks(prev => prev.map(drink => 
      drink.id === id ? { ...drink, seasonal: !drink.seasonal } : drink
    ));
  };

  const updateDrinkName = (id, newName) => {
    setDrinks(prev => prev.map(drink => 
      drink.id === id ? { ...drink, name: newName } : drink
    ));
  };

  const deleteDrink = (id) => {
    setDrinks(prev => prev.filter(drink => drink.id !== id));
  };

  const addNewDrink = () => {
    const maxId = drinks.reduce((max, d) => Math.max(max, d.id), 0);
    setDrinks(prev => [...prev, { id: maxId + 1, name: '', active: true, seasonal: false }]);
  };

  const moveDrinkUp = (index) => {
    if (index === 0) return;
    const newDrinks = [...drinks];
    [newDrinks[index - 1], newDrinks[index]] = [newDrinks[index], newDrinks[index - 1]];
    setDrinks(newDrinks);
  };

  const moveDrinkDown = (index) => {
    if (index === drinks.length - 1) return;
    const newDrinks = [...drinks];
    [newDrinks[index], newDrinks[index + 1]] = [newDrinks[index + 1], newDrinks[index]];
    setDrinks(newDrinks);
  };

  // Order management functions (admin)
  const deleteOrder = async (orderId) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId })
      });

      const data = await response.json();
      
      if (data.success) {
        setAllOrders(prev => prev.filter(o => o.id !== orderId));
        setShowDeleteConfirm(null);
        // Show success feedback
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successMsg.textContent = '✓ Objednávka smazána';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 2000);
      } else {
        setError(data.error || 'Chyba při mazání objednávky');
      }
    } catch (err) {
      setError('Chyba při mazání objednávky');
    }
  };

  const updateOrder = async (updatedOrder) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder)
      });

      const data = await response.json();
      
      if (data.success) {
        setAllOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
        setEditingOrder(null);
        // Show success feedback
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successMsg.textContent = '✓ Objednávka upravena';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 2000);
      } else {
        setError(data.error || 'Chyba při úpravě objednávky');
      }
    } catch (err) {
      setError('Chyba při úpravě objednávky');
    }
  };

  const startEditingOrder = (order) => {
    // Deep copy the order for editing
    setEditingOrder(JSON.parse(JSON.stringify(order)));
  };

  const updateEditingOrderItem = (itemIndex, field, value) => {
    setEditingOrder(prev => {
      const updated = { ...prev };
      updated.items = [...prev.items];
      updated.items[itemIndex] = { ...updated.items[itemIndex], [field]: value };
      return updated;
    });
  };

  const removeEditingOrderItem = (itemIndex) => {
    setEditingOrder(prev => {
      const updated = { ...prev };
      updated.items = prev.items.filter((_, i) => i !== itemIndex);
      return updated;
    });
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
          // Only set food items, drinks are loaded separately from drinks state
          setMenuItems(data.menuItems.map(item => ({ ...item, isDrink: false })));
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

  const moveItemUp = (index) => {
    if (index === 0) return;
    const newItems = [...menuItems];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setMenuItems(newItems);
  };

  const moveItemDown = (index) => {
    if (index === menuItems.length - 1) return;
    const newItems = [...menuItems];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setMenuItems(newItems);
  };

  const deleteMenuItem = (index) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const addNewMenuItem = () => {
    setMenuItems([...menuItems, { name: '' }]);
  };

  const updateMenuItems = async () => {
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          menu: menuImage,
          menuItems: menuItems.filter(item => item.name.trim() !== '')
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setError('');
        // Show success feedback
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successMsg.textContent = '✓ Menu uloženo';
        document.body.appendChild(successMsg);
        setTimeout(() => successMsg.remove(), 2000);
      } else {
        setError(data.error || 'Chyba při ukládání menu');
      }
    } catch (err) {
      setError('Chyba při ukládání menu');
    }
  };

  const getItemKey = (itemName, type) => `${itemName}-${type}`;

  const toggleItemSelection = (itemName, type) => {
    const key = getItemKey(itemName, type);
    setSelectedItems(prev => {
      const newSelected = !prev[key];
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

  const handleOrderClick = () => {
    if (!userName || Object.keys(selectedItems).filter(k => selectedItems[k]).length === 0) {
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmAndSubmitOrder = async () => {
    try {
      const orderData = {
        userName,
        items: Object.entries(selectedItems)
          .filter(([_, selected]) => selected)
          .map(([key]) => {
            const lastDashIndex = key.lastIndexOf('-');
            const itemName = key.substring(0, lastDashIndex);
            const type = key.substring(lastDashIndex + 1);
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
        loadOrders();
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
        let exportText = '🍽️ OBJEDNÁVKY OBĚD\n';
        exportText += '═════════════════════════════════\n\n';

        const namisteMap = new Map();
        const ssebouMap = new Map();
        
        data.orders.forEach(order => {
          if (!order.items || !Array.isArray(order.items)) return;
          order.items.forEach(item => {
            const mapToUse = item.type === 'namiste' ? namisteMap : ssebouMap;
            
            if (!mapToUse.has(item.name)) {
              mapToUse.set(item.name, {
                total: 0,
                withNotes: []
              });
            }
            
            const menuData = mapToUse.get(item.name);
            menuData.total += item.quantity || 1;
            
            if (item.note && item.note.trim()) {
              const existingNote = menuData.withNotes.find(n => n.note === item.note.trim());
              if (existingNote) {
                existingNote.quantity += item.quantity || 1;
              } else {
                menuData.withNotes.push({
                  quantity: item.quantity || 1,
                  note: item.note.trim()
                });
              }
            }
          });
        });

        if (namisteMap.size > 0) {
          exportText += '🍽️ NA MÍSTĚ:\n';
          exportText += '─────────────────────────────────\n\n';
          
          let namisteTotal = 0;
          namisteMap.forEach((data, menuName) => {
            exportText += `"${menuName}" - ${data.total} ks\n`;
            namisteTotal += data.total;
            
            if (data.withNotes.length > 0) {
              data.withNotes.forEach(noteItem => {
                exportText += `  z toho ${noteItem.quantity} ks .. "${noteItem.note}"\n`;
              });
            }
            exportText += '\n';
          });
          
          exportText += `CELKEM NA MÍSTĚ: ${namisteTotal} ks\n\n`;
        }

        if (ssebouMap.size > 0) {
          exportText += '🥡 S SEBOU:\n';
          exportText += '─────────────────────────────────\n\n';
          
          let ssebouTotal = 0;
          ssebouMap.forEach((data, menuName) => {
            exportText += `"${menuName}" - ${data.total} ks\n`;
            ssebouTotal += data.total;
            
            if (data.withNotes.length > 0) {
              data.withNotes.forEach(noteItem => {
                exportText += `  z toho ${noteItem.quantity} ks .. "${noteItem.note}"\n`;
              });
            }
            exportText += '\n';
          });
          
          exportText += `CELKEM S SEBOU: ${ssebouTotal} ks\n\n`;
        }

        const grandTotal = [...namisteMap.values()].reduce((sum, data) => sum + data.total, 0) +
                          [...ssebouMap.values()].reduce((sum, data) => sum + data.total, 0);
        
        exportText += '═════════════════════════════════\n';
        exportText += `CELKEM VŠECH MENU: ${grandTotal} ks\n`;
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

  const ConfirmationDialog = () => {
    const selectedItemsList = Object.entries(selectedItems)
      .filter(([_, selected]) => selected)
      .map(([key]) => {
        const lastDashIndex = key.lastIndexOf('-');
        const itemName = key.substring(0, lastDashIndex);
        const type = key.substring(lastDashIndex + 1);
        return {
          name: itemName,
          quantity: quantities[key] || 1,
          type: type,
          note: notes[key] || ''
        };
      });

    const namiste = selectedItemsList.filter(item => item.type === 'namiste');
    const ssebou = selectedItemsList.filter(item => item.type === 'ssebou');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
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

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
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

            <div className="space-y-4">
              {namiste.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="text-2xl">🍽️</span>
                    Na místě
                  </h3>
                  <div className="space-y-2">
                    {namiste.map((item, idx) => (
                      <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{item.name}</p>
                            {item.note && (
                              <p className="text-sm text-gray-600 mt-1">💬 {item.note}</p>
                            )}
                          </div>
                          <span className="font-bold text-green-700 ml-4">{item.quantity}×</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ssebou.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="text-2xl">🥡</span>
                    S sebou
                  </h3>
                  <div className="space-y-2">
                    {ssebou.map((item, idx) => (
                      <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{item.name}</p>
                            {item.note && (
                              <p className="text-sm text-gray-600 mt-1">💬 {item.note}</p>
                            )}
                          </div>
                          <span className="font-bold text-blue-700 ml-4">{item.quantity}×</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Zpět k úpravám
              </button>
              <button
                onClick={confirmAndSubmitOrder}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Potvrdit objednávku
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const OrdersDisplay = () => {
    if (allOrders.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Zatím žádné objednávky</p>
        </div>
      );
    }

    const namisteOrders = [];
    const ssebouOrders = [];
    
    allOrders.forEach(order => {
      if (!order.items || !Array.isArray(order.items)) return;
      order.items.forEach(item => {
        const orderItem = {
          userName: order.userName,
          itemName: item.name,
          quantity: item.quantity || 1,
          note: item.note || '',
          timestamp: order.timestamp
        };
        
        if (item.type === 'namiste') {
          namisteOrders.push(orderItem);
        } else {
          ssebouOrders.push(orderItem);
        }
      });
    });

    return (
      <div className="space-y-6">
        {namisteOrders.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span className="text-2xl">🍽️</span>
              Na místě ({namisteOrders.reduce((sum, item) => sum + item.quantity, 0)} ks)
            </h3>
            <div className="space-y-2">
              {namisteOrders.map((order, idx) => (
                <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{order.userName}</p>
                      <p className="text-sm text-gray-600">{order.itemName}</p>
                      {order.note && (
                        <p className="text-sm text-gray-600 mt-1">💬 {order.note}</p>
                      )}
                    </div>
                    <span className="font-bold text-green-700 ml-4">{order.quantity}×</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {ssebouOrders.length > 0 && (
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <span className="text-2xl">🥡</span>
              S sebou ({ssebouOrders.reduce((sum, item) => sum + item.quantity, 0)} ks)
            </h3>
            <div className="space-y-2">
              {ssebouOrders.map((order, idx) => (
                <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{order.userName}</p>
                      <p className="text-sm text-gray-600">{order.itemName}</p>
                      {order.note && (
                        <p className="text-sm text-gray-600 mt-1">💬 {order.note}</p>
                      )}
                    </div>
                    <span className="font-bold text-blue-700 ml-4">{order.quantity}×</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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

  if (isAdminMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">🍽️ Správa obědů</h1>
            <button
              onClick={() => {
                setIsAdminMode(false);
                document.cookie = 'admin=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              Odhlásit admina
            </button>
          </div>

          {!isMenuConfirmed ? (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Nahrát nové menu</h2>
              
              <div className="mb-6">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                  <Camera className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-gray-600">Klikněte nebo přetáhněte foto menu</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {menuImage && (
                <div className="mb-6">
                  <img src={menuImage} alt="Menu preview" className="w-full rounded-lg shadow-lg" />
                </div>
              )}

              {isProcessing && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" />
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
          ) : (
            <div className="space-y-6">
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
                
                <div className="space-y-2 mb-4">
                  {menuItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveItemUp(index)}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Posunout nahoru"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveItemDown(index)}
                          disabled={index === menuItems.length - 1}
                          className="p-1 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Posunout dolů"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-gray-400 text-sm font-mono w-6">{index + 1}.</span>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...menuItems];
                          newItems[index].name = e.target.value;
                          setMenuItems(newItems);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                      />
                      <button
                        onClick={() => deleteMenuItem(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Smazat položku"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={addNewMenuItem}
                    className="flex-1 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Přidat položku
                  </button>
                  <button
                    onClick={updateMenuItems}
                    className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Uložit změny
                  </button>
                </div>
              </div>

              {/* Drinks Manager Section */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    🥤 Správa nápojů
                  </h2>
                  <button
                    onClick={() => setShowDrinksManager(!showDrinksManager)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {showDrinksManager ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>

                {showDrinksManager && (
                  <div>
                    <p className="text-sm text-gray-500 mb-4">
                      Aktivní nápoje se automaticky přidají k menu při rozpoznání. Sezónní označení je pouze pro váš přehled.
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      {drinks.map((drink, index) => (
                        <div 
                          key={drink.id} 
                          className={`flex items-center gap-2 p-3 rounded-lg transition-colors ${
                            drink.active ? 'bg-green-50 border border-green-200' : 'bg-gray-100 border border-gray-200'
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => moveDrinkUp(index)}
                              disabled={index === 0}
                              className="p-1 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Posunout nahoru"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveDrinkDown(index)}
                              disabled={index === drinks.length - 1}
                              className="p-1 text-gray-500 hover:text-orange-500 hover:bg-orange-50 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title="Posunout dolů"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <button
                            onClick={() => toggleDrinkActive(drink.id)}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              drink.active
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 hover:border-green-400'
                            }`}
                            title={drink.active ? 'V nabídce' : 'Mimo nabídku'}
                          >
                            {drink.active && <CheckCircle className="w-4 h-4 text-white" />}
                          </button>
                          
                          <input
                            type="text"
                            value={drink.name}
                            onChange={(e) => updateDrinkName(drink.id, e.target.value)}
                            className={`flex-1 px-3 py-2 border rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none ${
                              drink.active ? 'border-green-300 bg-white' : 'border-gray-300 bg-gray-50 text-gray-500'
                            }`}
                          />
                          
                          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={drink.seasonal}
                              onChange={() => toggleDrinkSeasonal(drink.id)}
                              className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                            <span className={drink.seasonal ? 'text-orange-500' : ''}>
                              {drink.seasonal ? '☀️ Sezónní' : 'Sezónní'}
                            </span>
                          </label>
                          
                          <button
                            onClick={() => deleteDrink(drink.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Smazat nápoj"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={addNewDrink}
                        className="flex-1 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:text-orange-500 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Přidat nápoj
                      </button>
                      <button
                        onClick={() => saveDrinks(drinks)}
                        className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Uložit nápoje
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="w-6 h-6 text-orange-500" />
                    Objednávky ({allOrders.length})
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={loadOrders}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Loader2 className="w-4 h-4" />
                      Obnovit
                    </button>
                    <button
                      onClick={exportOrders}
                      disabled={allOrders.length === 0}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                  </div>
                </div>

                {allOrders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Zatím žádné objednávky</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allOrders.map((order, orderIndex) => (
                      <div key={order.id || orderIndex} className="border border-gray-200 rounded-lg p-4">
                        {editingOrder && editingOrder.id === order.id ? (
                          // Editing mode
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-600">Jméno:</label>
                                <input
                                  type="text"
                                  value={editingOrder.userName}
                                  onChange={(e) => setEditingOrder(prev => ({ ...prev, userName: e.target.value }))}
                                  className="px-3 py-1 border border-gray-300 rounded-lg focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => updateOrder(editingOrder)}
                                  className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-1 text-sm"
                                >
                                  <Save className="w-4 h-4" />
                                  Uložit
                                </button>
                                <button
                                  onClick={() => setEditingOrder(null)}
                                  className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors text-sm"
                                >
                                  Zrušit
                                </button>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              {editingOrder.items && editingOrder.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateEditingOrderItem(itemIndex, 'name', e.target.value)}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Název položky"
                                  />
                                  <select
                                    value={item.type}
                                    onChange={(e) => updateEditingOrderItem(itemIndex, 'type', e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                                  >
                                    <option value="namiste">Na místě</option>
                                    <option value="ssebou">S sebou</option>
                                  </select>
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateEditingOrderItem(itemIndex, 'quantity', parseInt(e.target.value) || 1)}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                    min="1"
                                  />
                                  <input
                                    type="text"
                                    value={item.note || ''}
                                    onChange={(e) => updateEditingOrderItem(itemIndex, 'note', e.target.value)}
                                    className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Poznámka"
                                  />
                                  <button
                                    onClick={() => removeEditingOrderItem(itemIndex)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-gray-800">{order.userName}</span>
                                <span className="text-xs text-gray-400">
                                  {order.timestamp && new Date(order.timestamp).toLocaleString('cs-CZ')}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEditingOrder(order)}
                                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Upravit objednávku"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(order.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Smazat objednávku"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Delete confirmation */}
                            {showDeleteConfirm === order.id && (
                              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800 mb-2">Opravdu smazat tuto objednávku?</p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => deleteOrder(order.id)}
                                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
                                  >
                                    Ano, smazat
                                  </button>
                                  <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-sm"
                                  >
                                    Zrušit
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            <div className="space-y-1">
                              {order.items && order.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-center gap-2 text-sm">
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    item.type === 'namiste' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {item.type === 'namiste' ? '🍽️' : '🥡'}
                                  </span>
                                  <span className="text-gray-700">{item.name}</span>
                                  <span className="font-semibold">{item.quantity}×</span>
                                  {item.note && (
                                    <span className="text-gray-500 text-xs">({item.note})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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

  if (orderSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Objednávka odeslaná!</h2>
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

  if (!isMenuConfirmed || menuItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center relative">
          <div className="absolute top-4 right-4">
            <a
              href="/admin"
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium transition-colors inline-block"
            >
              Administrace
            </a>
          </div>
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Menu není dostupné</h2>
          <p className="text-gray-600">Momentálně není publikované žádné menu. Zkuste to prosím později.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">🍽️ Objednávka oběda</h1>
          <a
            href="/admin"
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors inline-block"
          >
            Administrace
          </a>
        </div>

        {menuImage && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Menu</h2>
            <img src={menuImage} alt="Menu" className="w-full rounded-lg shadow-lg" />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Vaše jméno
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="např. Jan Novák"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🍽️ Jídla</h2>
          <div className="space-y-4">
            {menuItems.filter(item => item && !item.isDrink).map((item, index) => {
              const namisteKey = getItemKey(item.name, 'namiste');
              const ssebouKey = getItemKey(item.name, 'ssebou');
              const isNamisteSelected = selectedItems[namisteKey];
              const isSsebouSelected = selectedItems[ssebouKey];
              const isAnySelected = isNamisteSelected || isSsebouSelected;

              return (
                <div key={`food-${index}`} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                    <button
                      onClick={() => toggleItemExpanded(item.name)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      {expandedItems[item.name] ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className={`border-2 rounded-lg p-3 transition-colors ${
                      isNamisteSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200'
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

                    <div className={`border-2 rounded-lg p-3 transition-colors ${
                      isSsebouSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200'
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

        {/* Drinks Section - using drinks state directly, only "na místě" option */}
        {drinks.filter(d => d && d.active).length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">🥤 Nápoje</h2>
            <div className="space-y-4">
              {drinks.filter(d => d && d.active).map((drink, index) => {
                const namisteKey = getItemKey(drink.name, 'namiste');
                const isNamisteSelected = selectedItems[namisteKey];

                return (
                  <div key={`drink-${drink.id || index}`} className="border border-cyan-200 rounded-lg p-4 bg-cyan-50/30">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => toggleItemSelection(drink.name, 'namiste')}
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
                        <span className="font-semibold text-lg text-gray-800">{drink.name}</span>
                      </button>
                      
                      {isNamisteSelected && (
                        <div className="flex items-center gap-2 bg-white border-2 border-green-300 rounded-lg px-2">
                          <button
                            onClick={() => updateQuantity(drink.name, 'namiste', -1)}
                            className="text-green-600 hover:text-green-700 font-bold text-lg px-2 py-1"
                          >
                            −
                          </button>
                          <span className="font-bold text-gray-800 min-w-[2ch] text-center">
                            {quantities[namisteKey] || 1}
                          </span>
                          <button
                            onClick={() => updateQuantity(drink.name, 'namiste', 1)}
                            className="text-green-600 hover:text-green-700 font-bold text-lg px-2 py-1"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>

                    {isNamisteSelected && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Poznámka
                        </label>
                        <input
                          type="text"
                          value={notes[namisteKey] || ''}
                          onChange={(e) => setNotes({ ...notes, [namisteKey]: e.target.value })}
                          placeholder="např. bez ledu..."
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Eye className="w-6 h-6 text-orange-500" />
              Aktuální objednávky ({allOrders.length})
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={exportOrders}
                disabled={allOrders.length === 0}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
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
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showConfirmDialog && <ConfirmationDialog />}
    </div>
  );
};

export default LunchOrderApp;
