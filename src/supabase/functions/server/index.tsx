import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// ============ Auth Routes ============

// Sign up new user
app.post('/make-server-2b77319f/signup', async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    
    if (!email || !password || !name || !role) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (!['dokter', 'pasien', 'admin'].includes(role)) {
      return c.json({ error: 'Invalid role. Must be dokter, pasien, or admin' }, 400);
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Error creating user during signup: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    // Save user data to KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role,
      created_at: new Date().toISOString()
    });

    return c.json({ 
      user: { 
        id: data.user.id, 
        email, 
        name, 
        role 
      } 
    });
  } catch (err) {
    console.log(`Unexpected error during signup: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get current user data
app.get('/make-server-2b77319f/user', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      console.log(`Auth error while getting user: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user data from KV store
    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData) {
      return c.json({ error: 'User data not found' }, 404);
    }

    return c.json({ user: userData });
  } catch (err) {
    console.log(`Error fetching user data: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============ Patient Routes ============

// Get all patients (for dokter and admin)
app.get('/make-server-2b77319f/patients', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || (userData.role !== 'dokter' && userData.role !== 'admin')) {
      return c.json({ error: 'Forbidden - Only dokter and admin can view all patients' }, 403);
    }

    const patients = await kv.getByPrefix('patient:');
    return c.json({ patients });
  } catch (err) {
    console.log(`Error fetching patients: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get patient by user ID (for pasien to view their own data)
app.get('/make-server-2b77319f/patient/:userId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const userId = c.req.param('userId');
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check if user is accessing their own data or is dokter/admin
    const userData = await kv.get(`user:${user.id}`);
    if (user.id !== userId && userData.role !== 'dokter' && userData.role !== 'admin') {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const patient = await kv.get(`patient:${userId}`);
    
    if (!patient) {
      return c.json({ patient: null });
    }

    return c.json({ patient });
  } catch (err) {
    console.log(`Error fetching patient: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create or update patient record
app.post('/make-server-2b77319f/patient', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || userData.role !== 'dokter') {
      return c.json({ error: 'Forbidden - Only dokter can create/update patient records' }, 403);
    }

    const { userId, nama, umur, keluhan, catatan_dokter } = await c.req.json();

    if (!userId || !nama) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const patientData = {
      userId,
      nama,
      umur: umur || 0,
      keluhan: keluhan || '',
      catatan_dokter: catatan_dokter || '',
      updated_at: new Date().toISOString(),
      updated_by: userData.name
    };

    await kv.set(`patient:${userId}`, patientData);

    return c.json({ patient: patientData });
  } catch (err) {
    console.log(`Error creating/updating patient: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ============ Transaction Routes ============

// Get all transactions
app.get('/make-server-2b77319f/transactions', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    // Admin can see all, pasien can see their own
    const transactions = await kv.getByPrefix('transaction:');
    
    if (userData.role === 'pasien') {
      // Filter only this patient's transactions
      const filteredTransactions = transactions.filter(t => t.pasien_id === user.id);
      return c.json({ transactions: filteredTransactions });
    }

    return c.json({ transactions });
  } catch (err) {
    console.log(`Error fetching transactions: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create transaction
app.post('/make-server-2b77319f/transaction', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: 'Forbidden - Only admin can create transactions' }, 403);
    }

    const { pasien_id, pasien_nama, obat, harga, status_pembayaran } = await c.req.json();

    if (!pasien_id || !pasien_nama || !obat || !harga) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const transactionData = {
      id: transactionId,
      pasien_id,
      pasien_nama,
      obat,
      harga,
      status_pembayaran: status_pembayaran || 'Belum Bayar',
      created_at: new Date().toISOString(),
      created_by: userData.name
    };

    await kv.set(`transaction:${transactionId}`, transactionData);

    return c.json({ transaction: transactionData });
  } catch (err) {
    console.log(`Error creating transaction: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update transaction status
app.put('/make-server-2b77319f/transaction/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const transactionId = c.req.param('id');
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: 'Forbidden - Only admin can update transactions' }, 403);
    }

    const transaction = await kv.get(`transaction:${transactionId}`);
    
    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    const { status_pembayaran, obat, harga } = await c.req.json();

    const updatedTransaction = {
      ...transaction,
      status_pembayaran: status_pembayaran || transaction.status_pembayaran,
      obat: obat || transaction.obat,
      harga: harga !== undefined ? harga : transaction.harga,
      updated_at: new Date().toISOString(),
      updated_by: userData.name
    };

    await kv.set(`transaction:${transactionId}`, updatedTransaction);

    return c.json({ transaction: updatedTransaction });
  } catch (err) {
    console.log(`Error updating transaction: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Delete transaction
app.delete('/make-server-2b77319f/transaction/:id', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const transactionId = c.req.param('id');
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    
    if (!userData || userData.role !== 'admin') {
      return c.json({ error: 'Forbidden - Only admin can delete transactions' }, 403);
    }

    await kv.del(`transaction:${transactionId}`);

    return c.json({ success: true });
  } catch (err) {
    console.log(`Error deleting transaction: ${err}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Health check
app.get('/make-server-2b77319f/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);
