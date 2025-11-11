import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-2b77319f`;

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'dokter' | 'pasien' | 'admin';
}

export interface Patient {
  userId: string;
  nama: string;
  umur: number;
  keluhan: string;
  catatan_dokter: string;
  updated_at?: string;
  updated_by?: string;
}

export interface Transaction {
  id: string;
  pasien_id: string;
  pasien_nama: string;
  obat: string;
  harga: number;
  status_pembayaran: string;
  created_at: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
}

// Auth API
export const signUp = async (email: string, password: string, name: string, role: 'dokter' | 'pasien' | 'admin') => {
  const response = await fetch(`${API_BASE_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`
    },
    body: JSON.stringify({ email, password, name, role })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to sign up');
  }
  return data;
};

export const getCurrentUser = async (accessToken: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to get user');
  }
  return data.user;
};

// Patient API
export const getPatients = async (accessToken: string): Promise<Patient[]> => {
  const response = await fetch(`${API_BASE_URL}/patients`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to get patients');
  }
  return data.patients;
};

export const getPatient = async (accessToken: string, userId: string): Promise<Patient | null> => {
  const response = await fetch(`${API_BASE_URL}/patient/${userId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to get patient');
  }
  return data.patient;
};

export const savePatient = async (accessToken: string, patient: Patient) => {
  const response = await fetch(`${API_BASE_URL}/patient`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(patient)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to save patient');
  }
  return data.patient;
};

// Transaction API
export const getTransactions = async (accessToken: string): Promise<Transaction[]> => {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to get transactions');
  }
  return data.transactions;
};

export const createTransaction = async (accessToken: string, transaction: {
  pasien_id: string;
  pasien_nama: string;
  obat: string;
  harga: number;
  status_pembayaran: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(transaction)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create transaction');
  }
  return data.transaction;
};

export const updateTransaction = async (accessToken: string, id: string, updates: {
  status_pembayaran?: string;
  obat?: string;
  harga?: number;
}) => {
  const response = await fetch(`${API_BASE_URL}/transaction/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(updates)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update transaction');
  }
  return data.transaction;
};

export const deleteTransaction = async (accessToken: string, id: string) => {
  const response = await fetch(`${API_BASE_URL}/transaction/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete transaction');
  }
  return data;
};
