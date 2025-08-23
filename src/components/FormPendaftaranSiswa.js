import React, { useEffect, useState, useContext, useCallback } from 'react';
import {
  Box, Button, Drawer, IconButton, TextField, Typography, MenuItem,
  ToggleButtonGroup, ToggleButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { AuthContext } from '../context/AuthContext';

/**
 * Komponen Form Pendaftaran Siswa
 * Digunakan untuk mengelola form pendaftaran siswa baru dengan validasi dan filtering berdasarkan role user
 * @param {boolean} open - Status drawer terbuka/tertutup
 * @param {function} onClose - Callback untuk menutup drawer
 * @param {function} fetchData - Callback untuk refresh data setelah submit
 * @param {object} editingData - Data siswa yang sedang diedit (optional)
 */
const FormPendaftaranSiswa = ({ open, onClose, fetchData, editingData }) => {
  const { userData } = useContext(AuthContext);

  // ===================== HELPER FUNCTIONS =====================
  // Helper fungsi untuk mengubah format mata uang Indonesia ke angka
  const parseCurrency = useCallback((value) => {
    if (!value) return 0;
    try {
      const cleanValue = value.toString().replace(/\./g, '');
      const numValue = parseInt(cleanValue);
      return isNaN(numValue) ? 0 : numValue;
    } catch (error) {
      console.warn('Error parsing currency:', value, error);
      return 0;
    }
  }, []);

  // Helper fungsi untuk format nilai mata uang ke format Indonesia (1.000.000)
  const formatCurrency = useCallback((value) => {
    if (!value) return '0';
    try {
      // Jika value sudah berformat (mengandung titik), parse dulu
      const numericValue = typeof value === 'string' && value.includes('.')
        ? parseCurrency(value)
        : parseInt(value);

      if (isNaN(numericValue)) return '0';
      return numericValue.toLocaleString('id-ID');
    } catch (error) {
      console.warn('Error formatting currency:', value, error);
      return '0';
    }
  }, [parseCurrency]);

  // ===================== STATE MANAGEMENT =====================
  // State untuk form data dengan default values
  const [form, setForm] = useState({
    tglDaftar: '', namaPendaftar: '', nomorWA: '', email: '', asalSekolah: '',
    jurusan: '', biayaJurusan: '', biayaPendaftaran: '', jalurPendaftaran: '', noKwitansi: '', presenter: [],
    caraDaftar: '', ket: '', jenisPotongan: '', jumlahPotongan: '', totalBiayaPendaftaran: '', totalBiayaJurusan: '', sumberInformasi: '', kantorCabang: ''
  });

  // State untuk menyimpan data master dari Firebase
  const [biayaJurusanList, setBiayaJurusanList] = useState([]);
  const [jurusanMasterList, setJurusanMasterList] = useState([]);
  const [kantorList, setKantorList] = useState([]);
  const [presenterList, setPresenterList] = useState([]);
  const [gelombangList, setGelombangList] = useState([]);
  const [jenisPotonganList, setJenisPotonganList] = useState([]);
  const [sumberList, setSumberList] = useState([]);
  const [metodeList, setMetodeList] = useState([]);
  const [jalurList, setJalurList] = useState([]);
  const [biayaList, setBiayaList] = useState([]);

  // ===================== DATA FETCHING =====================
  // Fetch semua data master dari Firebase secara parallel untuk performance yang lebih baik
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Jalankan semua query Firebase secara parallel untuk meningkatkan performance
        const [
          biayaJurusanSnapshot,
          jurusanMasterSnapshot,
          kantorSnapshot,
          presenterSnapshot,
          gelombangSnapshot,
          potonganBiayaSnapshot,
          sumberInformasiSnapshot,
          metodeBayarSnapshot,
          jalurPendaftaranSnapshot,
          biayaPendaftaranSnapshot
        ] = await Promise.all([
          getDocs(collection(db, 'biaya_jurusan')),
          getDocs(collection(db, 'daftar_jurusan')),
          getDocs(collection(db, 'kantor')),
          getDocs(collection(db, 'presenter')),
          getDocs(collection(db, 'gelombang')),
          getDocs(collection(db, 'potongan_biaya')),
          getDocs(collection(db, 'sumber_informasi')),
          getDocs(collection(db, 'metode_bayar')),
          getDocs(collection(db, 'jalur_pendaftaran')),
          getDocs(collection(db, 'biaya_pendaftaran'))
        ]);

        // Set state dengan data yang telah diambil
        setBiayaJurusanList(biayaJurusanSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setJurusanMasterList(jurusanMasterSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setKantorList(kantorSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setPresenterList(presenterSnapshot.docs.map(doc => doc.data()));
        setGelombangList(gelombangSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setJenisPotonganList(potonganBiayaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setSumberList(sumberInformasiSnapshot.docs.map(doc => doc.data()));
        setMetodeList(metodeBayarSnapshot.docs.map(doc => doc.data()));
        setJalurList(jalurPendaftaranSnapshot.docs.map(doc => doc.data()));
        setBiayaList(biayaPendaftaranSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Terjadi kesalahan saat memuat data. Silakan refresh halaman.');
      }
    };

    fetchAllData();
  }, []);

  // ===================== FILTER FUNCTIONS =====================
  /**
   * Mendapatkan list jurusan yang tersedia berdasarkan cabangOffice user atau kantor cabang yang dipilih
   * Filter berdasarkan role user: presenter hanya melihat jurusan untuk cabangOffice mereka
   * @param {string} selectedKantorCabang - Kantor cabang yang dipilih di form (optional)
   * @param {string} selectedJalurPendaftaran - Jalur pendaftaran yang dipilih di form (optional)
   * @returns {Array} List jurusan yang sudah difilter dengan format display
   */
  const getAvailableJurusan = useCallback((selectedKantorCabang = null, selectedJalurPendaftaran = null) => {
    if (!biayaJurusanList.length || !jurusanMasterList.length || !kantorList.length) return [];

    // Filter biaya jurusan berdasarkan cabang office yang dipilih
    let filteredBiayaJurusan = biayaJurusanList;

    // Tentukan kantorCabang yang akan digunakan untuk filtering
    const kantorCabangForFiltering = selectedKantorCabang || form.kantorCabang || userData?.cabangOffice;
    const jalurPendaftaranForFiltering = selectedJalurPendaftaran || form.jalurPendaftaran;

    // Filter berdasarkan kantor cabang yang dipilih/default
    if (kantorCabangForFiltering) {
      filteredBiayaJurusan = biayaJurusanList.filter(bj => bj.cabangOffice === kantorCabangForFiltering);
    }

    // Filter berdasarkan jalur pendaftaran jika dipilih
    if (jalurPendaftaranForFiltering) {
      filteredBiayaJurusan = filteredBiayaJurusan.filter(bj => bj.jalurPendaftaran === jalurPendaftaranForFiltering);
    }

    // Gabungkan dengan data master jurusan untuk mendapatkan kode dan nama
    const result = filteredBiayaJurusan.map(biayaJurusan => {
      const masterJurusan = jurusanMasterList.find(jm => jm.id === biayaJurusan.jurusanId);
      const namaKantor = biayaJurusan.cabangOffice || 'Kantor tidak ditemukan';

      return {
        ...biayaJurusan,
        kode: masterJurusan?.kode || '',
        nama: masterJurusan?.nama || '',
        namaKantor: namaKantor,
        displayName: masterJurusan && namaKantor
          ? `${masterJurusan.kode} - ${masterJurusan.nama} - ${namaKantor}`
          : 'Data tidak lengkap'
      };
    }).filter(item => item.kode && item.nama); // Filter out incomplete data

    return result;
  }, [biayaJurusanList, jurusanMasterList, kantorList, userData, form.kantorCabang, form.jalurPendaftaran]);

  /**
   * Mendapatkan biaya pendaftaran yang tersedia berdasarkan kantor cabang dan jalur pendaftaran yang dipilih
   * Filter berdasarkan kantor cabang dan jalur pendaftaran di form
   * @param {string} selectedKantorCabang - Kantor cabang yang dipilih di form (optional)
   * @param {string} selectedJalurPendaftaran - Jalur pendaftaran yang dipilih di form (optional)
   * @returns {Array} List biaya pendaftaran yang sudah difilter
   */
  const getAvailableBiayaPendaftaran = useCallback((selectedKantorCabang = null, selectedJalurPendaftaran = null) => {
    if (!biayaList.length) return [];

    // Tentukan kantorCabang dan jalurPendaftaran yang akan digunakan untuk filtering
    const kantorCabangForFiltering = selectedKantorCabang || form.kantorCabang || userData?.cabangOffice;
    const jalurPendaftaranForFiltering = selectedJalurPendaftaran || form.jalurPendaftaran;

    // Filter berdasarkan kantor cabang dan jalur pendaftaran yang dipilih/default
    let filteredList = biayaList;

    // Filter berdasarkan kantor cabang
    if (kantorCabangForFiltering) {
      filteredList = filteredList.filter(b => b.cabangOffice === kantorCabangForFiltering);
    }

    // Filter berdasarkan jalur pendaftaran jika dipilih
    if (jalurPendaftaranForFiltering) {
      filteredList = filteredList.filter(b => b.jalurPendaftaran === jalurPendaftaranForFiltering);
    }

    // Jika tidak ada filter yang diterapkan, tampilkan semua (untuk pimpinan)
    if (!kantorCabangForFiltering && userData?.role === 'pimpinan') {
      return biayaList;
    }

    return filteredList;
  }, [biayaList, userData, form.kantorCabang, form.jalurPendaftaran]);

  /**
   * Mendapatkan potongan biaya yang tersedia berdasarkan kantor cabang dan jalur pendaftaran yang dipilih
   * Filter berdasarkan kantor cabang dan jalur pendaftaran di form, sama seperti logic pada biaya pendaftaran
   * @param {string} selectedKantorCabang - Kantor cabang yang dipilih di form (optional)
   * @param {string} selectedJalurPendaftaran - Jalur pendaftaran yang dipilih di form (optional)
   * @returns {Array} List potongan biaya yang sudah difilter
   */
  const getAvailablePotonganBiaya = useCallback((selectedKantorCabang = null, selectedJalurPendaftaran = null) => {
    if (!jenisPotonganList.length) return [];

    // Tentukan kantorCabang dan jalurPendaftaran yang akan digunakan untuk filtering
    const kantorCabangForFiltering = selectedKantorCabang || form.kantorCabang || userData?.cabangOffice;
    const jalurPendaftaranForFiltering = selectedJalurPendaftaran || form.jalurPendaftaran;

    // Filter berdasarkan kantor cabang dan jalur pendaftaran yang dipilih/default
    let filteredList = jenisPotonganList;

    // Filter berdasarkan kantor cabang
    if (kantorCabangForFiltering) {
      filteredList = filteredList.filter(p => p.cabangOffice === kantorCabangForFiltering);
    }

    // Filter berdasarkan jalur pendaftaran jika dipilih
    if (jalurPendaftaranForFiltering) {
      filteredList = filteredList.filter(p => p.jalurPendaftaran === jalurPendaftaranForFiltering);
    }

    // Jika tidak ada kantor cabang yang dipilih, tampilkan semua (untuk pimpinan)
    if (!kantorCabangForFiltering && userData?.role === 'pimpinan') {
      return jenisPotonganList;
    }

    return filteredList;
  }, [jenisPotonganList, userData, form.kantorCabang, form.jalurPendaftaran]);

  /**
   * Mendapatkan list kantor cabang yang tersedia berdasarkan role user
   * Role pimpinan dapat melihat semua kantor, presenter hanya kantor mereka sendiri
   * @returns {Array} List kantor cabang yang sudah difilter
   */
  const getAvailableKantorCabang = useCallback(() => {
    if (!kantorList.length) return [];

    // Jika user adalah pimpinan, tampilkan semua kantor cabang
    if (userData?.role === 'pimpinan') {
      return kantorList;
    }

    // Jika user bukan pimpinan, hanya tampilkan kantor cabang user tersebut
    if (userData?.cabangOffice) {
      return kantorList.filter(k => k.namaKantor === userData.cabangOffice);
    }

    return [];
  }, [kantorList, userData]);

  /**
   * Mendapatkan jalur pendaftaran yang tersedia berdasarkan kantor cabang yang dipilih
   * Filter berdasarkan kantor cabang di form, sama seperti logic pada jurusan
   * @param {string} selectedKantorCabang - Kantor cabang yang dipilih di form (optional)
   * @returns {Array} List jalur pendaftaran yang sudah difilter
   */
  const getAvailableJalurPendaftaran = useCallback((selectedKantorCabang) => {
    if (!jalurList.length) return [];

    // Tentukan kantor cabang yang akan digunakan untuk filter
    const kantorCabang = selectedKantorCabang || userData?.cabangOffice;

    // Filter berdasarkan kantor cabang yang dipilih/default
    if (kantorCabang) {
      return jalurList.filter(j => j.kantorCabang === kantorCabang);
    }

    // Jika tidak ada kantor cabang yang dipilih, tampilkan semua (untuk pimpinan)
    return jalurList;
  }, [jalurList, userData]);

  // ===================== FORM INITIALIZATION =====================
  // Effect untuk mengisi form saat mode edit
  useEffect(() => {
    if (editingData) {
      // Validasi permission untuk presenter saat edit
      if (userData?.role === 'presenter') {
        // Presenter dapat mengedit data dari cabangOffice yang sama
        if (editingData.cabangOffice !== userData.cabangOffice) {
          alert('Anda tidak memiliki permission untuk mengedit data ini. Data ini bukan dari cabang office Anda.');
          onClose();
          return;
        }
      }

      setForm({
        ...editingData,
        presenter: editingData.presenter || [],
        jenisPotongan: editingData.jenisPotongan || '',
        jumlahPotongan: editingData.jumlahPotongan || '',
        biayaJurusan: editingData.biayaJurusan ? formatCurrency(editingData.biayaJurusan) : '',
        totalBiayaPendaftaran: editingData.totalBiayaPendaftaran ? formatCurrency(editingData.totalBiayaPendaftaran) : (editingData.biayaPendaftaran ? formatCurrency(editingData.biayaPendaftaran) : ''),
        totalBiayaJurusan: editingData.totalBiayaJurusan ? formatCurrency(editingData.totalBiayaJurusan) : (editingData.biayaJurusan ? formatCurrency(editingData.biayaJurusan) : ''),
        jalurPendaftaran: editingData.jalurPendaftaran || '',
        sumberInformasi: editingData.sumberInformasi || '',
        kantorCabang: editingData.cabangOffice || ''
      });
    } else {
      // Inisialisasi form baru
      const defaultKantorCabang = userData?.role === 'pimpinan' ? '' : (userData?.cabangOffice || '');
      setForm({
        tglDaftar: '', namaPendaftar: '', nomorWA: '', email: '', asalSekolah: '',
        jurusan: '', biayaJurusan: '', biayaPendaftaran: '', jalurPendaftaran: '', noKwitansi: '',
        presenter: [], // Tidak ada default presenter, user harus pilih sendiri
        caraDaftar: '', ket: '', jenisPotongan: '', jumlahPotongan: '',
        totalBiayaPendaftaran: '', totalBiayaJurusan: '', sumberInformasi: '', kantorCabang: defaultKantorCabang
      });
    }
  }, [editingData, userData, onClose, formatCurrency, parseCurrency]);

  // ===================== BUSINESS LOGIC FUNCTIONS =====================
  /**
   * Generate nomor pendaftaran yang unique berdasarkan tanggal dan gelombang
   * Format: YYYYMMDD-XXX (XXX adalah urutan 3 digit)
   * Menggunakan algoritma increment untuk mencegah duplicate
   * @param {string} tgl - Tanggal pendaftaran dalam format YYYY-MM-DD
   * @returns {object} Object berisi nomorPendaftaran dan idGelombang
   */
  const generateNomorPendaftaran = async (tgl) => {
    const dateStr = tgl.replace(/-/g, ''); // Convert ke YYYYMMDD

    // Cari gelombang yang aktif berdasarkan tanggal
    const qGel = gelombangList.find(g => g.tanggalMulai <= tgl && g.tanggalAkhir >= tgl);
    if (!qGel) {
      alert('Tanggal daftar tidak masuk dalam rentang gelombang manapun!');
      return { nomorPendaftaran: '', idGelombang: '' };
    }

    try {
      // Ambil semua data pendaftaran untuk gelombang ini untuk menentukan urutan
      const snapshot = await getDocs(query(collection(db, 'pendaftaran_siswa'), where('idGelombang', '==', qGel.id)));

      // Ambil semua nomor pendaftaran yang sudah ada untuk mencegah duplicate
      const existingNumbers = snapshot.docs.map(doc => doc.data().nomorPendaftaran);

      // Generate nomor pendaftaran dengan urutan increment
      let urutan = snapshot.size + 1;
      let nomor = `${dateStr}-${urutan.toString().padStart(3, '0')}`;

      // Loop increment sampai mendapat nomor yang benar-benar unique
      while (existingNumbers.includes(nomor)) {
        urutan++;
        nomor = `${dateStr}-${urutan.toString().padStart(3, '0')}`;
      }

      // Double check dengan query database untuk memastikan nomor benar-benar unique
      // Ini menangani edge case jika ada concurrent access
      const checkSnapshot = await getDocs(query(collection(db, 'pendaftaran_siswa'), where('nomorPendaftaran', '==', nomor)));
      if (!checkSnapshot.empty) {
        urutan++;
        nomor = `${dateStr}-${urutan.toString().padStart(3, '0')}`;
      }

      return { nomorPendaftaran: nomor, idGelombang: qGel.id };
    } catch (error) {
      console.error('Error generating nomor pendaftaran:', error);
      alert('Terjadi kesalahan saat generate nomor pendaftaran. Silakan coba lagi.');
      return { nomorPendaftaran: '', idGelombang: '' };
    }
  };

  // ===================== FORM SUBMISSION =====================
  /**
   * Handle submit form pendaftaran siswa
   * Melakukan validasi, security check, dan menyimpan data ke Firebase
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi required fields
    if (!form.tglDaftar || !form.namaPendaftar || !form.jurusan) {
      alert('Mohon lengkapi data yang wajib diisi: Tanggal Daftar, Nama Pendaftar, dan Jurusan.');
      return;
    }

    try {
      // Validasi format email jika diisi
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        alert('Format email tidak valid.');
        return;
      }

      // Validasi presenter harus dipilih
      if (!form.presenter || form.presenter.length === 0) {
        alert('Silakan pilih minimal satu presenter.');
        return;
      }

    // Ambil informasi lengkap jurusan yang dipilih
    const selectedJurusanInfo = getAvailableJurusan(form.kantorCabang, form.jalurPendaftaran).find(j => j.displayName === form.jurusan);

    // Validasi keamanan: pastikan data yang dipilih sesuai dengan kantor cabang dan jalur pendaftaran yang dipilih
    const kantorCabangToValidate = form.kantorCabang || userData?.cabangOffice;
    const jalurPendaftaranToValidate = form.jalurPendaftaran;

    if (kantorCabangToValidate) {
      // Validasi jurusan sesuai dengan kantor cabang dan jalur pendaftaran
      if (selectedJurusanInfo?.cabangOffice !== kantorCabangToValidate) {
        alert('Error: Jurusan yang dipilih tidak sesuai dengan kantor cabang yang dipilih.');
        return;
      }
      if (jalurPendaftaranToValidate && selectedJurusanInfo?.jalurPendaftaran !== jalurPendaftaranToValidate) {
        alert('Error: Jurusan yang dipilih tidak sesuai dengan jalur pendaftaran yang dipilih.');
        return;
      }

      // Validasi biaya pendaftaran jika ada
      if (form.biayaPendaftaran) {
        const selectedBiayaPendaftaran = getAvailableBiayaPendaftaran(form.kantorCabang, form.jalurPendaftaran).find(b => b.jumlahBiayaPendaftaran === form.biayaPendaftaran);
        if (selectedBiayaPendaftaran?.cabangOffice !== kantorCabangToValidate) {
          alert('Error: Biaya pendaftaran yang dipilih tidak sesuai dengan kantor cabang yang dipilih.');
          return;
        }
        if (jalurPendaftaranToValidate && selectedBiayaPendaftaran?.jalurPendaftaran !== jalurPendaftaranToValidate) {
          alert('Error: Biaya pendaftaran yang dipilih tidak sesuai dengan jalur pendaftaran yang dipilih.');
          return;
        }
      }

      // Validasi potongan biaya jika ada
      if (form.jenisPotongan) {
        const selectedPotongan = getAvailablePotonganBiaya(form.kantorCabang, form.jalurPendaftaran).find(p => p.jenisPotongan === form.jenisPotongan);
        if (selectedPotongan?.cabangOffice !== kantorCabangToValidate) {
          alert('Error: Potongan biaya yang dipilih tidak sesuai dengan kantor cabang yang dipilih.');
          return;
        }
        if (jalurPendaftaranToValidate && selectedPotongan?.jalurPendaftaran !== jalurPendaftaranToValidate) {
          alert('Error: Potongan biaya yang dipilih tidak sesuai dengan jalur pendaftaran yang dipilih.');
          return;
        }
      }
    }

    // Tentukan cabangOffice yang akan disimpan (gunakan value dari form kantorCabang)
    let cabangOfficeToSave = form.kantorCabang || userData?.cabangOffice || '';

    if (editingData?.id) {
      await updateDoc(doc(db, 'pendaftaran_siswa', editingData.id), {
        ...form,
        jurusanKode: selectedJurusanInfo?.kode || '',
        jurusanNama: selectedJurusanInfo?.nama || '',
        biayaJurusan: parseCurrency(form.biayaJurusan).toString(),
        totalBiayaPendaftaran: parseCurrency(form.totalBiayaPendaftaran).toString(),
        totalBiayaJurusan: parseCurrency(form.totalBiayaJurusan).toString(),
        sumberInformasi: form.sumberInformasi,
        cabangOffice: cabangOfficeToSave
      });
    } else {
      const { nomorPendaftaran, idGelombang } = await generateNomorPendaftaran(form.tglDaftar);

      // Validasi hasil generate nomor pendaftaran
      if (!nomorPendaftaran || !idGelombang) {
        alert('Gagal generate nomor pendaftaran. Pastikan tanggal daftar valid.');
        return;
      }

      // Validasi final untuk memastikan nomor pendaftaran benar-benar unique
      const finalCheck = await getDocs(query(collection(db, 'pendaftaran_siswa'), where('nomorPendaftaran', '==', nomorPendaftaran)));
      if (!finalCheck.empty) {
        alert('Terjadi error dalam generate nomor pendaftaran. Silakan coba lagi.');
        return;
      }

      await addDoc(collection(db, 'pendaftaran_siswa'), {
        nomorPendaftaran,
        tglDaftar: form.tglDaftar,
        idGelombang,
        namaPendaftar: form.namaPendaftar,
        nomorWA: form.nomorWA,
        email: form.email,
        asalSekolah: form.asalSekolah,
        jurusan: form.jurusan,
        jurusanKode: selectedJurusanInfo?.kode || '',
        jurusanNama: selectedJurusanInfo?.nama || '',
        biayaJurusan: parseCurrency(form.biayaJurusan).toString(),
        biayaPendaftaran: form.biayaPendaftaran,
        jalurPendaftaran: form.jalurPendaftaran,
        noKwitansi: form.noKwitansi,
        presenter: form.presenter,
        caraDaftar: form.caraDaftar,
        ket: form.ket,
        cabangOffice: cabangOfficeToSave,
        jenisPotongan: form.jenisPotongan,
        jumlahPotongan: form.jumlahPotongan,
        totalBiayaPendaftaran: parseCurrency(form.totalBiayaPendaftaran).toString(),
        totalBiayaJurusan: parseCurrency(form.totalBiayaJurusan).toString(),
        sumberInformasi: form.sumberInformasi
      });
    }

    // Refresh data dan tutup form setelah berhasil submit
    fetchData();
    onClose();

    // Reset form ke kondisi default setelah submit
    const defaultKantorCabang = userData?.role === 'pimpinan' ? '' : (userData?.cabangOffice || '');
    setForm({
      tglDaftar: '', namaPendaftar: '', nomorWA: '', email: '', asalSekolah: '',
      jurusan: '', biayaJurusan: '', biayaPendaftaran: '', jalurPendaftaran: '', noKwitansi: '',
      presenter: [],
      caraDaftar: '', ket: '', jenisPotongan: '', jumlahPotongan: '',
      totalBiayaPendaftaran: '', totalBiayaJurusan: '', sumberInformasi: '', kantorCabang: defaultKantorCabang
    });
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
    }
  };

  // ===================== CALCULATION HELPERS =====================
  /**
   * Menghitung ulang total biaya berdasarkan biaya jurusan dan potongan
   * @param {string|number} biayaJurusan - Biaya jurusan
   * @param {string|number} jumlahPotongan - Jumlah potongan
   * @returns {number} Total biaya setelah dikurangi potongan
   */
  const calculateTotalBiayaJurusan = useCallback((biayaJurusan, jumlahPotongan) => {
    const biayaNum = parseCurrency(biayaJurusan);
    const potonganNum = parseCurrency(jumlahPotongan);
    const potonganValid = Math.min(potonganNum, biayaNum); // Potongan tidak boleh lebih dari biaya
    return Math.max(biayaNum - potonganValid, 0); // Total tidak boleh negatif
  }, [parseCurrency]);

  // ===================== EVENT HANDLERS =====================
  /**
   * Handle perubahan nilai pada form input
   * Termasuk logic khusus untuk calculation dan cascading updates
   * @param {Event} e - Input change event
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    // Handle perubahan kantor cabang - reset fields yang bergantung
    if (name === 'kantorCabang') {
      setForm(prev => ({
        ...prev,
        kantorCabang: value,
        jurusan: '',              // Reset karena jurusan bergantung pada kantor
        biayaJurusan: '',
        totalBiayaJurusan: '',
        biayaPendaftaran: '',     // Reset karena biaya pendaftaran bergantung pada kantor
        totalBiayaPendaftaran: '',
        jenisPotongan: '',        // Reset karena potongan bergantung pada kantor
        jumlahPotongan: '',
        jalurPendaftaran: ''      // Reset karena jalur pendaftaran bergantung pada kantor
      }));
    }
    // Handle perubahan jalur pendaftaran - reset fields yang bergantung
    else if (name === 'jalurPendaftaran') {
      setForm(prev => ({
        ...prev,
        jalurPendaftaran: value,
        jurusan: '',              // Reset karena jurusan bergantung pada jalur pendaftaran
        biayaJurusan: '',
        totalBiayaJurusan: '',
        biayaPendaftaran: '',     // Reset karena biaya pendaftaran bergantung pada jalur
        totalBiayaPendaftaran: '',
        jenisPotongan: '',        // Reset karena potongan biaya bergantung pada jalur pendaftaran
        jumlahPotongan: ''
      }));
    }
    // Handle perubahan jurusan - update biaya dan hitung ulang total
    else if (name === 'jurusan') {
      const availableJurusan = getAvailableJurusan(form.kantorCabang, form.jalurPendaftaran);
      const selectedJurusan = availableJurusan.find(j => j.displayName === value);

      // Pastikan biaya dalam format yang benar
      let biayaJurusan = '0';
      if (selectedJurusan?.biaya) {
        // Jika biaya sudah dalam format number, gunakan langsung
        // Jika dalam format string dengan titik, parse dulu
        biayaJurusan = typeof selectedJurusan.biaya === 'string'
          ? selectedJurusan.biaya.replace(/\./g, '')
          : selectedJurusan.biaya.toString();
      }

      // Hitung ulang total dengan potongan yang ada
      const totalBiayaJurusan = calculateTotalBiayaJurusan(biayaJurusan, form.jumlahPotongan);

      setForm(prev => ({
        ...prev,
        jurusan: value,
        biayaJurusan: formatCurrency(biayaJurusan),
        totalBiayaJurusan: formatCurrency(totalBiayaJurusan),
        // Adjust potongan jika biaya baru lebih kecil
        jumlahPotongan: parseCurrency(biayaJurusan) === 0 ? '' : Math.min(parseCurrency(prev.jumlahPotongan), parseCurrency(biayaJurusan)).toString(),
        jenisPotongan: parseCurrency(biayaJurusan) === 0 ? '' : prev.jenisPotongan
      }));
    }
    // Handle perubahan biaya pendaftaran - update total
    else if (name === 'biayaPendaftaran') {
      setForm(prev => ({
        ...prev,
        [name]: value,
        totalBiayaPendaftaran: formatCurrency(value)
      }));
    }
    // Handle perubahan jenis potongan - update jumlah potongan otomatis
    else if (name === 'jenisPotongan') {
      const availablePotongan = getAvailablePotonganBiaya(form.kantorCabang, form.jalurPendaftaran);
      const selected = availablePotongan.find(d => d.jenisPotongan === value);
      const jumlahPotongan = selected ? parseCurrency(selected.jumlahPotongan) : 0;
      const totalBiayaJurusan = calculateTotalBiayaJurusan(form.biayaJurusan, jumlahPotongan);

      setForm(prev => ({
        ...prev,
        jenisPotongan: value,
        jumlahPotongan: selected ? Math.min(jumlahPotongan, parseCurrency(form.biayaJurusan)).toString() : '',
        totalBiayaJurusan: formatCurrency(totalBiayaJurusan)
      }));
    }
    // Handle manual input potongan
    else if (name === 'jumlahPotongan') {
      const totalBiayaJurusan = calculateTotalBiayaJurusan(form.biayaJurusan, value);

      setForm(prev => ({
        ...prev,
        jumlahPotongan: value,
        totalBiayaJurusan: formatCurrency(totalBiayaJurusan)
      }));
    }
    // Handle perubahan field lainnya
    else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }, [getAvailableJurusan, getAvailablePotonganBiaya, calculateTotalBiayaJurusan, formatCurrency, parseCurrency, form.jumlahPotongan, form.biayaJurusan, form.kantorCabang, form.jalurPendaftaran]);

  /**
   * Handle perubahan pada presenter (multiple selection)
   * @param {Event} event - ToggleButton group change event
   * @param {Array} newPresenter - Array presenter yang dipilih
   */
  const handlePresenterChange = useCallback((event, newPresenter) => {
    setForm(prev => ({ ...prev, presenter: newPresenter }));
  }, []);

  // ===================== UI RENDER =====================
  return (
    <Drawer anchor="left" open={open} onClose={onClose} PaperProps={{ sx: { width: '75vw' } }}>
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {editingData ? 'Edit Pendaftaran Siswa' : 'Tambah Pendaftaran Siswa'}
          </Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Kolom kiri - Data Pribadi */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                type="date"
                label="Tanggal Daftar"
                name="tglDaftar"
                value={form.tglDaftar}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                select
                label="Kantor Cabang"
                name="kantorCabang"
                value={form.kantorCabang}
                onChange={handleChange}
                fullWidth
                required
                disabled={userData?.role !== 'pimpinan'}
              >
                <MenuItem value="">Pilih Kantor Cabang</MenuItem>
                {getAvailableKantorCabang().map((kantor) => (
                  <MenuItem key={kantor.id} value={kantor.namaKantor}>
                    {kantor.namaKantor}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Jalur Pendaftaran"
                name="jalurPendaftaran"
                value={form.jalurPendaftaran}
                onChange={handleChange}
                fullWidth
                required
              >
                <MenuItem value="">Pilih Jalur Pendaftaran</MenuItem>
                {getAvailableJalurPendaftaran(form.kantorCabang).map((j) => (
                  <MenuItem key={j.id || `jalur-${j.jalurPendaftaran}-${j.kantorCabang}`} value={j.jalurPendaftaran}>{j.jalurPendaftaran}</MenuItem>
                ))}
              </TextField>
              <TextField label="Nama Pendaftar" name="namaPendaftar" value={form.namaPendaftar} onChange={handleChange} fullWidth />
              <TextField label="Nomor WA" name="nomorWA" value={form.nomorWA} onChange={handleChange} fullWidth />
              <TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />
              <TextField label="Asal Sekolah" name="asalSekolah" value={form.asalSekolah} onChange={handleChange} fullWidth />
              <TextField
                select
                label="Jurusan"
                name="jurusan"
                value={form.jurusan}
                onChange={handleChange}
                fullWidth
                required
                disabled={!form.kantorCabang || !form.jalurPendaftaran}
              >
                <MenuItem value="">Pilih Jurusan</MenuItem>
                {!form.kantorCabang ? (
                  <MenuItem disabled>Pilih kantor cabang terlebih dahulu</MenuItem>
                ) : !form.jalurPendaftaran ? (
                  <MenuItem disabled>Pilih jalur pendaftaran terlebih dahulu</MenuItem>
                ) : getAvailableJurusan(form.kantorCabang, form.jalurPendaftaran).length === 0 ? (
                  <MenuItem disabled>Tidak ada jurusan tersedia untuk kantor dan jalur ini</MenuItem>
                ) : (
                  getAvailableJurusan(form.kantorCabang, form.jalurPendaftaran).map((j) => (
                    <MenuItem key={j.id || `${j.kode}-${j.nama}`} value={j.displayName}>{j.displayName}</MenuItem>
                  ))
                )}
              </TextField>
              <TextField
                label="Biaya Jurusan"
                name="biayaJurusan"
                value={form.biayaJurusan ? `Rp ${form.biayaJurusan}` : ''}
                fullWidth
                disabled
              />
              <TextField
                select
                label="Biaya Pendaftaran"
                name="biayaPendaftaran"
                value={form.biayaPendaftaran}
                onChange={handleChange}
                fullWidth
                required
                disabled={!form.kantorCabang || !form.jalurPendaftaran}
              >
                <MenuItem value="">Pilih Biaya Pendaftaran</MenuItem>
                {!form.kantorCabang ? (
                  <MenuItem disabled>Pilih kantor cabang terlebih dahulu</MenuItem>
                ) : !form.jalurPendaftaran ? (
                  <MenuItem disabled>Pilih jalur pendaftaran terlebih dahulu</MenuItem>
                ) : getAvailableBiayaPendaftaran(form.kantorCabang, form.jalurPendaftaran).length === 0 ? (
                  <MenuItem disabled>Tidak ada biaya pendaftaran tersedia untuk kantor dan jalur ini</MenuItem>
                ) : (
                  getAvailableBiayaPendaftaran(form.kantorCabang, form.jalurPendaftaran).map((b) => (
                    <MenuItem key={b.id || `${b.cabangOffice}-${b.jalurPendaftaran}-${b.jumlahBiayaPendaftaran}`} value={b.jumlahBiayaPendaftaran}>
                      {b.jalurPendaftaran} - Rp {b.jumlahBiayaPendaftaran}
                    </MenuItem>
                  ))
                )}
              </TextField>
              <TextField
                select
                label="Jenis Potongan"
                name="jenisPotongan"
                value={form.jenisPotongan || ''}
                onChange={handleChange}
                fullWidth
                disabled={parseCurrency(form.biayaJurusan) === 0 || !form.kantorCabang || !form.jalurPendaftaran}
              >
                <MenuItem value="">Tanpa Potongan Biaya</MenuItem>
                {!form.kantorCabang ? (
                  <MenuItem disabled>Pilih kantor cabang terlebih dahulu</MenuItem>
                ) : !form.jalurPendaftaran ? (
                  <MenuItem disabled>Pilih jalur pendaftaran terlebih dahulu</MenuItem>
                ) : parseCurrency(form.biayaJurusan) === 0 ? (
                  <MenuItem disabled>Pilih jurusan terlebih dahulu</MenuItem>
                ) : getAvailablePotonganBiaya(form.kantorCabang, form.jalurPendaftaran).length === 0 ? (
                  <MenuItem disabled>Tidak ada potongan biaya tersedia untuk kantor dan jalur ini</MenuItem>
                ) : (
                  getAvailablePotonganBiaya(form.kantorCabang, form.jalurPendaftaran).map((d) => (
                    <MenuItem key={d.id || `${d.cabangOffice}-${d.jalurPendaftaran}-${d.jenisPotongan}`} value={d.jenisPotongan}>{d.jenisPotongan}</MenuItem>
                  ))
                )}
              </TextField>
              <TextField
                label="Jumlah Potongan"
                name="jumlahPotongan"
                value={form.jumlahPotongan ? `Rp ${formatCurrency(form.jumlahPotongan)}` : ''}
                fullWidth
                disabled={parseCurrency(form.biayaJurusan) === 0}
              />
              <TextField
                label="Total Biaya Pendaftaran"
                name="totalBiayaPendaftaran"
                value={form.totalBiayaPendaftaran ? `Rp ${form.totalBiayaPendaftaran}` : ''}
                fullWidth
                disabled
              />
              {/* Total Biaya Jurusan tetap dihitung di background tapi tidak ditampilkan di UI */}
            </Box>

            {/* Kolom kanan */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="No Kwitansi" name="noKwitansi" value={form.noKwitansi} onChange={handleChange} fullWidth />

              <Box>
                <Typography sx={{ mb: 1 }}>Pilih Presenter</Typography>
                <ToggleButtonGroup
                  value={form.presenter}
                  onChange={handlePresenterChange}
                  multiple
                  color="primary"
                  size="small"
                  sx={{ flexWrap: 'wrap', gap: 1 }}
                >
                  {presenterList.map((p) => (
                    <ToggleButton
                      key={p.id || `presenter-${p.namaLengkap}`}
                      value={p.namaLengkap}
                      selected={form.presenter.includes(p.namaLengkap)}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '8px',
                        borderColor: '#1976d2',
                        '&.Mui-selected': {
                          backgroundColor: '#1976d2',
                          color: '#fff',
                        },
                        '&:hover': {
                          backgroundColor: '#1565c0',
                          color: '#fff'
                        }
                      }}
                    >
                      {p.namaLengkap}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              <TextField select label="Cara Daftar" name="caraDaftar" value={form.caraDaftar} onChange={handleChange} fullWidth>
                {/* <MenuItem value="CASH">CASH</MenuItem>
                <MenuItem value="TF">TF</MenuItem>
                <MenuItem value="CICIL">CICIL</MenuItem> */}
                <MenuItem value="">Pilih Metode Pembayaran</MenuItem>
                {metodeList.map((s) => (
                  <MenuItem key={s.id || `metode-${s.idcode}`} value={s.idcode}>{s.idcode}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Sumber Informasi"
                name="sumberInformasi"
                value={form.sumberInformasi}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="">Pilih Sumber Informasi</MenuItem>
                {sumberList.map((s) => (
                  <MenuItem key={s.id || `sumber-${s.sumber}`} value={s.sumber}>{s.sumber}</MenuItem>
                ))}
              </TextField>
              <TextField label="Keterangan" name="ket" value={form.ket} onChange={handleChange} fullWidth multiline minRows={3} />
            </Box>
          </Box>

          <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }}>
            {editingData ? 'Simpan Perubahan' : 'Simpan'}
          </Button>
        </form>

      </Box>
    </Drawer>
  );
};

export default FormPendaftaranSiswa;
