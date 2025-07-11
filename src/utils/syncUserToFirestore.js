// src/utils/syncUserToFirestore.js
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
} from 'firebase/firestore';

export const syncUserToFirestore = async (user, defaultRole = 'pimpinan') => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('uid', '==', user.uid));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    // user sudah ada
    return snapshot.docs[0].data();
  }

  const userData = {
    uid: user.uid,
    email: user.email,
    namaLengkap: user.displayName || 'Tanpa Nama',
    role: defaultRole,
    cabangOffice: 'pusat',
  };

  await setDoc(doc(db, 'users', user.uid), userData);
  return userData;
};