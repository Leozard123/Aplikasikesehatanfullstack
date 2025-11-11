import { useState, useEffect } from 'react';
import { getPatient, getTransactions, getCurrentUser, type Patient, type Transaction } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { User, FileText, DollarSign, Calendar, Pill } from 'lucide-react';
import { Badge } from './ui/badge';

interface PasienDashboardProps {
  accessToken: string;
  onLogout: () => void;
}

export function PasienDashboard({ accessToken, onLogout }: PasienDashboardProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser(accessToken);
      setCurrentUser(user);
      
      const [patientData, transactionsData] = await Promise.all([
        getPatient(accessToken, user.id),
        getTransactions(accessToken)
      ]);
      
      setPatient(patientData);
      setTransactions(transactionsData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalBelumBayar = transactions
    .filter(t => t.status_pembayaran === 'Belum Bayar')
    .reduce((sum, t) => sum + t.harga, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl">Dashboard Pasien</h1>
                <p className="text-sm text-gray-600">Selamat datang, {currentUser?.name}</p>
              </div>
            </div>
            <Button onClick={onLogout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Transaksi</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{transactions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Total Belum Bayar</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">Rp {totalBelumBayar.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm">Status</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl">Aktif</div>
            </CardContent>
          </Card>
        </div>

        {/* Patient Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Data Pribadi & Catatan Kesehatan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {patient ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nama</p>
                    <p>{patient.nama}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Umur</p>
                    <p>{patient.umur} tahun</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Keluhan</p>
                    <p>{patient.keluhan || '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-2">Catatan Dokter</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="whitespace-pre-wrap">{patient.catatan_dokter || 'Belum ada catatan dari dokter'}</p>
                    </div>
                  </div>
                  {patient.updated_at && (
                    <div className="md:col-span-2 text-sm text-gray-500">
                      Terakhir diperbarui: {new Date(patient.updated_at).toLocaleString('id-ID')}
                      {patient.updated_by && ` oleh ${patient.updated_by}`}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Belum ada catatan kesehatan</p>
                <p className="text-sm">Hubungi dokter untuk pemeriksaan</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5" />
              Riwayat Pembayaran & Obat
            </CardTitle>
            <CardDescription>Daftar transaksi dan status pembayaran</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Belum ada riwayat transaksi</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Obat</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Status Pembayaran</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </TableCell>
                      <TableCell>{transaction.obat}</TableCell>
                      <TableCell>Rp {transaction.harga.toLocaleString('id-ID')}</TableCell>
                      <TableCell>
                        <Badge
                          variant={transaction.status_pembayaran === 'Lunas' ? 'default' : 'secondary'}
                          className={
                            transaction.status_pembayaran === 'Lunas'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {transaction.status_pembayaran}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
