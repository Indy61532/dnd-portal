// HeroVault API Client
// Wrapper for backend API communication

class HeroVaultAPI {
  constructor() {
    this.baseURL = process.env.API_URL || 'http://localhost:3000/api';
    this.token = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  // Set authentication tokens
  setTokens(accessToken, refreshToken) {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    if (accessToken) localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
  }

  // Clear authentication tokens
  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Get authorization header
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Try to refresh token if 401
        if (response.status === 401 && this.refreshToken && endpoint !== '/auth/refresh') {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            // Retry original request
            config.headers['Authorization'] = `Bearer ${this.token}`;
            const retryResponse = await fetch(url, config);
            const retryData = await retryResponse.json();
            if (!retryResponse.ok) throw new Error(retryData.message || 'Request failed');
            return retryData;
          }
        }
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      const data = await response.json();
      if (response.ok && data.accessToken) {
        this.setTokens(data.accessToken, data.refreshToken || this.refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }

  // Auth methods
  async register(email, password, displayName) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName })
    });
    if (data.accessToken) {
      this.setTokens(data.accessToken, data.refreshToken);
    }
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.accessToken) {
      this.setTokens(data.accessToken, data.refreshToken);
    }
    return data;
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Character methods
  async getCharacters() {
    return this.request('/characters');
  }

  async getCharacter(id) {
    return this.request(`/characters/${id}`);
  }

  async createCharacter(characterData, imageFile) {
    const formData = new FormData();
    Object.keys(characterData).forEach(key => {
      if (characterData[key] !== null && characterData[key] !== undefined) {
        if (typeof characterData[key] === 'object') {
          formData.append(key, JSON.stringify(characterData[key]));
        } else {
          formData.append(key, characterData[key]);
        }
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const headers = { 'Authorization': `Bearer ${this.token}` };
    delete headers['Content-Type']; // Let browser set multipart/form-data

    return this.request('/characters', {
      method: 'POST',
      headers,
      body: formData
    });
  }

  async updateCharacter(id, characterData, imageFile) {
    const formData = new FormData();
    Object.keys(characterData).forEach(key => {
      if (characterData[key] !== null && characterData[key] !== undefined) {
        if (typeof characterData[key] === 'object') {
          formData.append(key, JSON.stringify(characterData[key]));
        } else {
          formData.append(key, characterData[key]);
        }
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const headers = { 'Authorization': `Bearer ${this.token}` };
    delete headers['Content-Type'];

    return this.request(`/characters/${id}`, {
      method: 'PUT',
      headers,
      body: formData
    });
  }

  async deleteCharacter(id) {
    return this.request(`/characters/${id}`, { method: 'DELETE' });
  }

  // Generic content CRUD helper
  async getContent(type, id = null, filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = id ? `/${type}s/${id}` : `/${type}s${queryParams ? '?' + queryParams : ''}`;
    return this.request(endpoint);
  }

  async createContent(type, data, imageFile) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if (Array.isArray(data[key])) {
          formData.append(key, JSON.stringify(data[key]));
        } else if (typeof data[key] === 'object') {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const headers = { 'Authorization': `Bearer ${this.token}` };
    delete headers['Content-Type'];

    return this.request(`/${type}s`, {
      method: 'POST',
      headers,
      body: formData
    });
  }

  async updateContent(type, id, data, imageFile) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined) {
        if (Array.isArray(data[key])) {
          formData.append(key, JSON.stringify(data[key]));
        } else if (typeof data[key] === 'object') {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const headers = { 'Authorization': `Bearer ${this.token}` };
    delete headers['Content-Type'];

    return this.request(`/${type}s/${id}`, {
      method: 'PUT',
      headers,
      body: formData
    });
  }

  async deleteContent(type, id) {
    return this.request(`/${type}s/${id}`, { method: 'DELETE' });
  }

  // Content type specific methods
  async getItems(filters = {}) {
    return this.getContent('item', null, filters);
  }

  async getMonsters(filters = {}) {
    return this.getContent('monster', null, filters);
  }

  async getSpells(filters = {}) {
    return this.getContent('spell', null, filters);
  }

  async getClasses(filters = {}) {
    return this.getContent('class', null, filters);
  }

  async getRaces(filters = {}) {
    return this.getContent('race', null, filters);
  }

  async getBackgrounds(filters = {}) {
    return this.getContent('background', null, filters);
  }

  async getFeats(filters = {}) {
    return this.getContent('feat', null, filters);
  }

  async getSubclasses(filters = {}) {
    return this.getContent('subclass', null, filters);
  }

  async getPets(filters = {}) {
    return this.getContent('pet', null, filters);
  }

  async getFaiths(filters = {}) {
    return this.getContent('faith', null, filters);
  }

  // Collection methods
  async getCollection(contentType = null) {
    const query = contentType ? `?contentType=${contentType}` : '';
    return this.request(`/collection${query}`);
  }

  async addToCollection(contentType, contentId) {
    return this.request(`/collection/${contentType}/${contentId}`, {
      method: 'POST'
    });
  }

  async removeFromCollection(contentType, contentId) {
    return this.request(`/collection/${contentType}/${contentId}`, {
      method: 'DELETE'
    });
  }

  async isInCollection(contentType, contentId) {
    return this.request(`/collection/${contentType}/${contentId}`);
  }

  // Browse/Search
  async browse(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/browse${queryParams ? '?' + queryParams : ''}`);
  }

  // Campaign methods
  async getCampaigns() {
    return this.request('/campaigns');
  }

  async getCampaign(id) {
    return this.request(`/campaigns/${id}`);
  }

  async createCampaign(campaignData, imageFile) {
    const formData = new FormData();
    Object.keys(campaignData).forEach(key => {
      if (campaignData[key] !== null && campaignData[key] !== undefined) {
        formData.append(key, campaignData[key]);
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const headers = { 'Authorization': `Bearer ${this.token}` };
    delete headers['Content-Type'];

    return this.request('/campaigns', {
      method: 'POST',
      headers,
      body: formData
    });
  }

  async updateCampaign(id, campaignData, imageFile) {
    const formData = new FormData();
    Object.keys(campaignData).forEach(key => {
      if (campaignData[key] !== null && campaignData[key] !== undefined) {
        formData.append(key, campaignData[key]);
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const headers = { 'Authorization': `Bearer ${this.token}` };
    delete headers['Content-Type'];

    return this.request(`/campaigns/${id}`, {
      method: 'PUT',
      headers,
      body: formData
    });
  }

  async deleteCampaign(id) {
    return this.request(`/campaigns/${id}`, { method: 'DELETE' });
  }

  async addCampaignMember(campaignId, userId, role = 'player') {
    return this.request(`/campaigns/${campaignId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role })
    });
  }

  async removeCampaignMember(campaignId, userId) {
    return this.request(`/campaigns/${campaignId}/members/${userId}`, {
      method: 'DELETE'
    });
  }

  // User profile methods
  async getUserProfile() {
    return this.request('/users/me');
  }

  async updateUserProfile(profileData, avatarFile) {
    const formData = new FormData();
    Object.keys(profileData).forEach(key => {
      if (profileData[key] !== null && profileData[key] !== undefined) {
        formData.append(key, profileData[key]);
      }
    });
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    const headers = { 'Authorization': `Bearer ${this.token}` };
    delete headers['Content-Type'];

    return this.request('/users/me', {
      method: 'PUT',
      headers,
      body: formData
    });
  }
}

// Create global API instance
window.HeroVaultAPI = new HeroVaultAPI();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HeroVaultAPI;
}

