import axios from "axios";

// 1. Change to port 80 (Nginx Gateway)
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost"; 

export const LoginApi = async (googleData) => {
  try {
    const response = await axios.post(`${backendUrl}/api/auth/login`, googleData, {
      // 2. CRITICAL: Allow the browser to save the 'HttpOnly' cookie
      withCredentials: true 
    });
    
    return response.data; 
  } catch (error) {
    console.error("API Login Error:", error.response?.data || error.message);
    throw error;
  }
};