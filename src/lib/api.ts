const API_URL = 'http://localhost:3000/api';

export const api = {
  async register(username: string, email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Registration failed');
    return res.json();
  },
  
  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Login failed');
    return res.json(); // { token, user }
  },

  async getProgress(token: string) {
    const res = await fetch(`${API_URL}/progress`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch progress');
    return res.json();
  },

  async updateProgress(token: string, unlockedLevels: number[], starsData: Record<number, number>) {
    const res = await fetch(`${API_URL}/progress`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ unlockedLevels, starsData })
    });
    if (!res.ok) throw new Error('Failed to update progress');
    return res.json();
  }
};
