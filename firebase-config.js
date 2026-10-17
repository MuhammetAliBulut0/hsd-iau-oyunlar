// Firebase konsolundaki "firebaseConfig" bilgileri buraya gelir.
// Bu bilgiler şifre değildir; güvenliği firestore.rules dosyasındaki kurallar sağlar.
export const firebaseConfig = {
  apiKey: "AIzaSyAj89gs6KRrHNPmL4cgfvjaNAQTG7bRrH0",
  authDomain: "hsd-iau-oyunlar.firebaseapp.com",
  projectId: "hsd-iau-oyunlar",
  storageBucket: "hsd-iau-oyunlar.firebasestorage.app",
  messagingSenderId: "17765747113",
  appId: "1:17765747113:web:5af795e47552d4a84adcb8"
};

// Yönetici: her şeyi görür ve moderatör atayabilir.
// Aynı adres firestore.rules dosyasında da yazılı olmalı.
export const SUPER_ADMIN_EMAIL = "muhammetalib571@gmail.com";
