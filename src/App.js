import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './pages/HomePage';
import LoginPimpinan from './pages/LoginPimpinan';
import LoginPresenter from './pages/LoginPresenter';
import PimpinanDashboard from './pages/PimpinanDashboard';
import PresenterDashboard from './pages/PresenterDashboard';
import TambahUser from './pages/TambahUser';
import TambahGelombang from './pages/TambahGelombang';
import DataJurusan from './pages/DataJurusan';
import DataPresenter from './pages/DataPresenter';
import MetodeBayar from './pages/MetodeBayar';
import PendaftaranSiswa from './pages/PendaftaranSiswa';
import AuthProvider from './context/AuthContext';
import DaftarUlangSiswa from './pages/DaftarUlangSiswa';
import TambahPotonganBiaya from './pages/TambahPotonganBiaya';
import TambahSumberInformasi from './pages/TambahSumberInformasi';
import TambahBiayaPendaftaran from './pages/TambahBiayaPendaftaran';
import TambahJalurPendaftaran from './pages/TambahJalurPendaftaran';
import TambahKantor from './pages/TambahKantor';
import StatistikPresenter from './pages/statistikPresenter';
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login-pimpinan" element={<LoginPimpinan />} />
          <Route path="/login-presenter" element={<LoginPresenter />} />

          {/* Protected Routes untuk Pimpinan */}
          <Route path="/pimpinan/dashboard" element={
            <ProtectedRoute requiredRole="pimpinan">
              <PimpinanDashboard />
            </ProtectedRoute>
          } />
          <Route path="/pimpinan/tambah-user" element={
            <ProtectedRoute requiredRole="pimpinan">
              <TambahUser />
            </ProtectedRoute>
          } />
          <Route path="/pimpinan/tambah-gelombang" element={
            <ProtectedRoute requiredRole="pimpinan">
              <TambahGelombang />
            </ProtectedRoute>
          } />
          <Route path="/pimpinan/data-jurusan" element={
            <ProtectedRoute requiredRole="pimpinan">
              <DataJurusan />
            </ProtectedRoute>
          } />
          <Route path="/pimpinan/data-presenter" element={
            <ProtectedRoute requiredRole="pimpinan">
              <DataPresenter />
            </ProtectedRoute>
          } />
          <Route path="/pimpinan/metode-bayar" element={
            <ProtectedRoute requiredRole="pimpinan">
              <MetodeBayar />
            </ProtectedRoute>
          } />
          <Route path="/pimpinan/pendaftaran-siswa" element={
            <ProtectedRoute requiredRole="pimpinan">
              <PendaftaranSiswa />
            </ProtectedRoute>
          } />
          <Route path="/pimpinan/daftar-ulang" element={
            <ProtectedRoute requiredRole="pimpinan">
              <DaftarUlangSiswa />
            </ProtectedRoute>
          } />
          <Route path="/pimpinan/tambah-potongan-biaya" element={
            <ProtectedRoute requiredRole="pimpinan">
              <TambahPotonganBiaya />
            </ProtectedRoute>
          } />
          <Route path="/pimpinan/tambah-sumber-informasi" element={
            <ProtectedRoute requiredRole="pimpinan">
              <TambahSumberInformasi />
            </ProtectedRoute>
          } />
          <Route path="/pimpinan/tambah-biaya-pendaftaran" element={
            <ProtectedRoute requiredRole="pimpinan">
              <TambahBiayaPendaftaran />
            </ProtectedRoute>
          } />
          <Route path="/pimpinan/tambah-jalur-pendaftaran" element={
            <ProtectedRoute requiredRole="pimpinan">
              <TambahJalurPendaftaran />
            </ProtectedRoute>
          } />
          <Route path="/pimpinan/tambah-kantor" element={
            <ProtectedRoute requiredRole="pimpinan">
              <TambahKantor />
            </ProtectedRoute>
          } />
          <Route path="/pimpinan/statistik-presenter" element={
            <ProtectedRoute requiredRole="pimpinan">
              <StatistikPresenter />
            </ProtectedRoute>
          } />

          {/* Protected Routes untuk Presenter */}
          <Route path="/presenter/dashboard" element={
            <ProtectedRoute requiredRole="presenter">
              <PresenterDashboard />
            </ProtectedRoute>
          } />
          <Route path="/presenter/pendaftaran-siswa" element={
            <ProtectedRoute requiredRole="presenter">
              <PendaftaranSiswa />
            </ProtectedRoute>
          } />
          <Route path="/presenter/daftar-ulang" element={
            <ProtectedRoute requiredRole="presenter">
              <DaftarUlangSiswa />
            </ProtectedRoute>
          } />

          {/* Redirect any unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
