'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (password === 'admin123') {
      // Set admin cookie or session
      document.cookie = 'admin=true; path=/';
      router.push('/?admin=true');
    } else {
      setError('Nesprávné heslo');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Admin přihlášení
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Zadejte admin heslo pro přístup ke správě
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Heslo"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            autoFocus
          />

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Přihlásit se
          </button>

          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full mt-3 py-3 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Zpět na objednávky
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-white-500 text-center">
            Výchozí heslo: admin123
          </p>
        </div>
      </div>
    </div>
  );
}
