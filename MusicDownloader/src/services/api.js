import { API_BASE_URL } from '../utils/config';

class ApiService {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Songs
    async getSongs() {
        return this.request('/api/songs');
    }

    async getSong(id) {
        return this.request(`/api/songs/${id}`);
    }

    async deleteSong(id) {
        return this.request(`/api/songs/${id}`, { method: 'DELETE' });
    }

    async downloadFromUrl(url, customTitle, customArtist) {
        return this.request('/api/download', {
            method: 'POST',
            body: JSON.stringify({ url, customTitle, customArtist }),
        });
    }

    async toggleFavorite(id) {
        return this.request(`/api/songs/${id}/favorite`, { method: 'PUT' });
    }

    async updateSong(id, data) {
        return this.request(`/api/songs/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async searchSongs(query) {
        return this.request(`/api/search?q=${encodeURIComponent(query)}`);
    }

    // Playlists
    async getPlaylists() {
        return this.request('/api/playlists');
    }

    async createPlaylist(name) {
        return this.request('/api/playlists', {
            method: 'POST',
            body: JSON.stringify({ name }),
        });
    }

    async addSongToPlaylist(playlistId, songId) {
        return this.request(`/api/playlists/${playlistId}/songs`, {
            method: 'POST',
            body: JSON.stringify({ songId }),
        });
    }

    async deletePlaylist(id) {
        return this.request(`/api/playlists/${id}`, { method: 'DELETE' });
    }

    async healthCheck() {
        return this.request('/api/health');
    }

    getAudioUrl(audioPath) {
        return `${API_BASE_URL}${audioPath}`;
    }

    getThumbnailUrl(thumbnail) {
        if (!thumbnail) return null;
        if (thumbnail.startsWith('http')) return thumbnail;
        return `${API_BASE_URL}${thumbnail}`;
    }
}

export default new ApiService();
