import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LoginPimpinan from './pages/LoginPimpinan';
import PimpinanDashboard from './pages/PimpinanDashboard';
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


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login-pimpinan" element={<LoginPimpinan />} />
          <Route path="/pimpinan/dashboard" element={<PimpinanDashboard />} />
          <Route path="/pimpinan/tambah-user" element={<TambahUser />} />
          <Route path="/pimpinan/tambah-gelombang" element={<TambahGelombang />} />
          <Route path="/pimpinan/data-jurusan" element={<DataJurusan />} />
          <Route path="/pimpinan/data-presenter" element={<DataPresenter />} />
          <Route path="/pimpinan/metode-bayar" element={<MetodeBayar />} />
          <Route path="/pimpinan/pendaftaran-siswa" element={<PendaftaranSiswa />} />
          <Route path="/pimpinan/daftar-ulang" element={<DaftarUlangSiswa />} />
          <Route path="/pimpinan/tambah-potongan-biaya" element={<TambahPotonganBiaya />} />
          <Route path="/pimpinan/tambah-sumber-informasi" element={<TambahSumberInformasi />} />
          <Route path="/pimpinan/tambah-biaya-pendaftaran" element={<TambahBiayaPendaftaran />} />
          <Route path="/pimpinan/tambah-jalur-pendaftaran" element={<TambahJalurPendaftaran />} />
          <Route path="/pimpinan/tambah-kantor" element={<TambahKantor />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
