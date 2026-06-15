import { useState, useEffect } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export function useApi(endpoint, params = {}) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}${endpoint}`, { params })
      .then(r => { setData(r.data); setLoading(false); })
      .catch(e => { setError(e); setLoading(false); });
  }, [endpoint, JSON.stringify(params)]);

  return { data, loading, error };
}

export const api = axios.create({ baseURL: API });
