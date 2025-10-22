11// src/lib/api.js
// const API_BASE_URL = 'http://localhost:3000';
  const API_BASE_URL = 'http://localhost:3000';
export const createRoomAPI = async (initialSettings) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(initialSettings),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Error response body:", errorBody);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};

export const getRoomAPI = async (roomId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Room not found
      }
      const errorBody = await response.text();
      console.error("Error response body:", errorBody);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching room ${roomId}:`, error);
    throw error;
  }
};