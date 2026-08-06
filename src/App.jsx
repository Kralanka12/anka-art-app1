import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  PenTool, Eraser, PaintBucket, Square, Circle,
  Move, Undo, Redo, ZoomIn, ZoomOut, Search,
  Download, Trash2, Pipette, Check, X, Sparkles,
  ChevronDown, Plus, FolderPlus, ArrowLeft, ArrowUp, ArrowDown, ArrowRight,
  Palette, Grid, Type, Share2, Save, Image as ImageIcon, Upload, Sliders, Maximize2, Flame, RefreshCw, Folder, HardDrive, Video, User, LogOut, LogIn, UserPlus, Settings, ShieldCheck, Lock, ShieldAlert
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser
} from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

// --- FIREBASE BAŞLATMA ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = firebaseConfig.projectId || 'anka-art-studio';

// --- GÜVENLİK / DDOS KORUMASI YAZILIMI ---
class DDoSProtectionWall {
  constructor(maxRequests = 45, timeWindowMs = 10000, blockDurationMs = 30000) {
    this.maxRequests = maxRequests;
    this.timeWindowMs = timeWindowMs;
    this.blockDurationMs = blockDurationMs;
    this.requestLog = [];
    this.isBlocked = false;
    this.blockExpiry = 0;
  }

  checkTraffic() {
    const now = Date.now();
    if (this.isBlocked) {
      if (now > this.blockExpiry) {
        this.isBlocked = false;
        this.requestLog = [];
      } else {
        return false; // Trafik engellendi (DDoS koruması devrede)
      }
    }

    // Zaman penceresi dışındaki logları temizle
    this.requestLog = this.requestLog.filter(timestamp => now - timestamp < this.timeWindowMs);
    this.requestLog.push(now);

    if (this.requestLog.length > this.maxRequests) {
      this.isBlocked = true;
      this.blockExpiry = now + this.blockDurationMs;
      return false;
    }
    return true;
  }
}

const ddosShield = new DDoSProtectionWall();

const safeOperation = (callback) => {
  if (!ddosShield.checkTraffic()) {
    alert("DDoS Koruması Devrede: Aşırı istek veya hızlı işlem algılandı! Lütfen birkaç saniye bekleyin.");
    return;
  }
  callback();
};

// --- GOOGLE FONTS LİSTESİ (Google Fonts kataloğundan geniş, kategorilere ayrılmış seçki) ---
// Not: "İnternetteki her font" pratikte mümkün değil (yüz binlerce lisanslı/lisanssız
// font var ve hepsini yüklemek uygulamayı çökertir). Bunun yerine Google Fonts'un halka açık
// kataloğundan performansı bozmayacak, geniş ve kategorilenmiş ~150 fontluk bir seçki sunuyoruz.
// Fontlar toplu değil, yalnızca font seçici içinde göründükçe (lazy) yükleniyor.
const buildFontList = (names, category, fallback) => names.map(name => {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return {
    id,
    label: name,
    category,
    value: `'${name}', ${fallback}`,
    url: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, '+')}:wght@400;700&display=swap`
  };
});

const fontFamilies = [
  { id: 'sans', label: 'Sans-Serif (Sistem)', category: 'Sans-Serif', value: 'system-ui, -apple-system, sans-serif' },
  { id: 'mono', label: 'Monospace (Sistem)', category: 'Monospace', value: 'ui-monospace, monospace' },

  ...buildFontList([
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Inter', 'Nunito', 'Raleway',
    'Ubuntu', 'Work Sans', 'Rubik', 'Karla', 'Mulish', 'Barlow', 'Quicksand', 'Manrope',
    'DM Sans', 'Josefin Sans', 'Oxygen', 'PT Sans', 'Noto Sans', 'Source Sans 3', 'Fira Sans',
    'Cabin', 'Heebo', 'Hind', 'Titillium Web', 'Varela Round', 'Kanit', 'Jost'
  ], 'Sans-Serif', "sans-serif"),

  ...buildFontList([
    'Playfair Display', 'Merriweather', 'Lora', 'PT Serif', 'Noto Serif', 'Source Serif 4',
    'Crimson Text', 'Libre Baskerville', 'EB Garamond', 'Cormorant Garamond', 'Bitter', 'Domine',
    'Vollkorn', 'Zilla Slab', 'Spectral', 'Cardo', 'Arvo', 'Rokkitt', 'Alegreya', 'Frank Ruhl Libre',
    'Cinzel', 'Old Standard TT', 'Prata', 'Marcellus', 'Abril Fatface', 'DM Serif Display',
    'IBM Plex Serif', 'Neuton', 'Gelasio', 'Bree Serif'
  ], 'Serif', "serif"),

  ...buildFontList([
    'Bungee', 'Bangers', 'Fredoka', 'Righteous', 'Alfa Slab One', 'Passion One', 'Anton',
    'Luckiest Guy', 'Baloo 2', 'Titan One', 'Squada One', 'Bebas Neue', 'Chewy', 'Fjalla One',
    'Boogaloo', 'Sigmar One', 'Bowlby One', 'Concert One', 'Comfortaa', 'Staatliches', 'Yeseva One',
    'Shrikhand', 'Monoton', 'Faster One', 'Rammetto One', 'Bungee Shade', 'Bungee Inline',
    'Black Ops One', 'Creepster', 'Lobster'
  ], 'Vurgulu / Dekoratif', "cursive"),

  ...buildFontList([
    'Pacifico', 'Permanent Marker', 'Caveat', 'Dancing Script', 'Great Vibes', 'Satisfy',
    'Sacramento', 'Kaushan Script', 'Amatic SC', 'Indie Flower', 'Shadows Into Light', 'Courgette',
    'Cookie', 'Yellowtail', 'Homemade Apple', 'Kalam', 'Patrick Hand', 'Handlee', 'Gochi Hand',
    'Architects Daughter', 'Reenie Beanie', 'Alex Brush', 'Allura', 'Marck Script', 'Rock Salt',
    'Nanum Pen Script', 'Neucha', 'Covered By Your Grace', 'Waiting for the Sunrise'
  ], 'El Yazısı', "cursive"),

  ...buildFontList([
    'Roboto Mono', 'Source Code Pro', 'JetBrains Mono', 'Space Mono', 'IBM Plex Mono',
    'Inconsolata', 'Fira Code', 'Courier Prime', 'PT Mono', 'Overpass Mono', 'Cutive Mono',
    'Anonymous Pro', 'Share Tech Mono', 'Nova Mono', 'DM Mono'
  ], 'Monospace / Kod', "monospace"),

  ...buildFontList([
    'Press Start 2P', 'VT323', 'Silkscreen', 'Pixelify Sans', 'Chakra Petch'
  ], 'Piksel / Retro', "monospace")
];

// Bir font linkini yalnızca bir kez ekler (aynı fontu iki kez enjekte etmez)
const injectedFontUrls = new Set();
const ensureFontLoaded = (font) => {
  if (!font || !font.url || injectedFontUrls.has(font.url)) return;
  injectedFontUrls.add(font.url);
  const link = document.createElement('link');
  link.href = font.url;
  link.rel = 'stylesheet';
  document.head.appendChild(link);
};

// Font seçici içindeki tek bir satır: sadece ekranda göründüğünde (lazy)
// Google Fonts dosyasını indirir ve altında o fontla yazılmış küçük bir önizleme gösterir.
const FontOptionRow = ({ font, isSelected, previewText, onSelect }) => {
  const rowRef = useRef(null);
  const [fontReady, setFontReady] = useState(!font.url); // sistem fontlarının URL'i yok, direkt hazır say

  useEffect(() => {
    if (!font.url) return;
    const el = rowRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      // IntersectionObserver yoksa (eski tarayıcı) doğrudan yükle
      ensureFontLoaded(font);
      setFontReady(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          ensureFontLoaded(font);
          setFontReady(true);
          observer.disconnect();
        }
      });
    }, { root: el.closest('[data-font-scroll-root]'), rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [font]);

  return (
    <button
      ref={rowRef}
      type="button"
      onClick={() => onSelect(font)}
      className={`w-full text-left px-3.5 py-2.5 rounded-xl transition-colors border ${
        isSelected ? 'bg-blue-600/15 border-blue-500' : 'bg-transparent border-transparent hover:bg-[#1E2238]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11px] font-semibold truncate ${isSelected ? 'text-blue-400' : 'text-gray-300'}`}>
          {font.label}
        </span>
        <span className="text-[9px] text-gray-500 uppercase tracking-wide flex-shrink-0">{font.category}</span>
      </div>
      <div
        className="text-base text-white mt-1 truncate leading-tight"
        style={{ fontFamily: fontReady ? font.value : 'inherit', minHeight: '1.4em' }}
      >
        {fontReady ? (previewText || font.label) : '···'}
      </div>
    </button>
  );
};

const hexToRgba = (hex) => {
  if (!hex) return { r: 0, g: 0, b: 0, a: 0 };
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: 255
  };
};

const rgbaToHex = (r, g, b) => {
  return "#" + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, x)).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
};

// --- FIREBASE AUTH HATA MESAJLARI (Türkçe) ---
const mapFirebaseError = (err) => {
  const code = err && err.code ? err.code : '';
  switch (code) {
    case 'auth/email-already-in-use': return 'Bu e-posta adresi zaten kayıtlı.';
    case 'auth/invalid-email': return 'Geçersiz e-posta adresi girdiniz.';
    case 'auth/weak-password': return 'Şifre çok zayıf, en az 6 karakter olmalı.';
    case 'auth/missing-password': return 'Lütfen şifrenizi girin.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Hatalı e-posta veya şifre!';
    case 'auth/too-many-requests': return 'Çok fazla deneme yapıldı, lütfen birkaç dakika sonra tekrar deneyin.';
    case 'auth/requires-recent-login': return 'Bu işlem için güvenlik amacıyla mevcut şifrenizi doğru girmeniz gerekiyor.';
    case 'auth/network-request-failed': return 'Bağlantı hatası, internetinizi kontrol edin.';
    default: return 'Bir hata oluştu, lütfen tekrar deneyin.';
  }
};

const getLinePixels = (x0, y0, x1, y1) => {
  const pixels = [];
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = (x0 < x1) ? 1 : -1;
  let sy = (y0 < y1) ? 1 : -1;
  let err = dx - dy;
  while (true) {
    pixels.push({ x: x0, y: y0 });
    if (x0 === x1 && y0 === y1) break;
    let e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
  return pixels;
};

const SCREENSHOT_PALETTE = [
  '#FF0000', '#000000', '#FFFFFF', '#00FF00',
  '#0000FF', '#FFB700', '#FF9100', '#795548',
  '#7F8C8D', '#FFC0CB', '#00FFFF', '#8E44AD',
  '#2ECC71', '#E74C3C', '#9B59B6', '#00CED1'
];

export default function App() {
  const HD_CANVAS_SIZE = 1080;

  // --- HESAP VE FIREBASE STATE (Gerçek Firebase Authentication: e-posta + şifre) ---
  const [fbUser, setFbUser] = useState(null); // Sadece e-postası DOĞRULANMIŞ kullanıcılar için dolu
  const [userProfile, setUserProfile] = useState(null); // Firestore'daki nickname/profilePic belgesi
  const [dbProjects, setDbProjects] = useState([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  // fbUser (doğrulanmış) + Firestore profil belgesini tek bir nesnede birleştir
  const loggedInUser = fbUser ? {
    uid: fbUser.uid,
    email: fbUser.email,
    nickname: (userProfile && userProfile.nickname) || fbUser.email,
    profilePic: (userProfile && userProfile.profilePic) || ''
  } : null;

  // Ayarlar modal state
  const [settingsNickname, setSettingsNickname] = useState('');
  const [settingsCurrentPassword, setSettingsCurrentPassword] = useState('');
  const [settingsNewPassword, setSettingsNewPassword] = useState('');
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(false);

  // --- PROJE STATE ---
  const [localProjects, setLocalProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjSize, setNewProjSize] = useState(32);

  // --- ÇİZİM STATE ---
  const [gridSize, setGridSize] = useState(32);
  const [currentTool, setCurrentTool] = useState('pencil');
  const [pencilType, setPencilType] = useState('single');
  const [showPencilMenu, setShowPencilMenu] = useState(false);
  const [palette, setPalette] = useState(SCREENSHOT_PALETTE);
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [zoom, setZoom] = useState(16);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);

  // --- ETKİLEŞİM STATE ---
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const mainCanvasRef = useRef(null);
  const hdOverlayCanvasRef = useRef(null);
  const galleryInputRef = useRef(null);
  const deviceFileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const profilePicInputRef = useRef(null);
  const touchContainerRef = useRef(null);
  const overlayVideoRef = useRef(null);
  const overlayImageRef = useRef(null); 

  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const [showDosyaModal, setShowDosyaModal] = useState(false);
  const [showKaydetModal, setShowKaydetModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

  // --- KATMAN (OVERLAY) STATE ---
  const [overlayElement, setOverlayElement] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDraggingOverlay, setIsDraggingOverlay] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState({ x: 0, y: 0 });
  const [overlayStartPos, setOverlayStartPos] = useState({ x: 0, y: 0, w: 0, h: 0 });

  const [textInput, setTextInput] = useState('ANKA ART');
  const [selectedFont, setSelectedFont] = useState(fontFamilies[0].value);
  const [textColor, setTextColor] = useState('#FF0000');
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [fontSearchQuery, setFontSearchQuery] = useState('');

  // Seçili font veya tuval üzerindeki metin katmanının fontu değiştiğinde,
  // o fontun henüz seçici içinde görülmemiş olma ihtimaline karşı yüklendiğinden emin ol
  useEffect(() => {
    const match = fontFamilies.find(f => f.value === selectedFont);
    if (match) ensureFontLoaded(match);
  }, [selectedFont]);

  useEffect(() => {
    if (!overlayElement || overlayElement.type !== 'text' || !overlayElement.font) return;
    const match = fontFamilies.find(f => f.value === overlayElement.font);
    if (match) ensureFontLoaded(match);
  }, [overlayElement && overlayElement.font]);

  // Firebase Authentication Dinleme (gerçek e-posta/şifre girişi)
  // Not: E-postası doğrulanmamış kullanıcılar fbUser'a yansıtılmaz; app.jsx içindeki
  // handleLogin zaten doğrulanmamış girişleri reddedip signOut yapıyor, ama sayfa
  // yenilendiğinde (ör. doğrulama linkine başka sekmede tıklandıktan sonra) burada
  // user.reload() ile emailVerified bilgisini taze tutuyoruz.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try { await user.reload(); } catch (e) { /* yoksay */ }
        if (!user.emailVerified) {
          setFbUser(null);
          return;
        }
      }
      setFbUser(user);
    });
    return () => unsub();
  }, []);

  // Giriş yapan kullanıcının profil belgesini ve bulut projelerini dinle
  useEffect(() => {
    if (!fbUser) {
      setUserProfile(null);
      setDbProjects([]);
      return;
    }

    const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', fbUser.uid);
    const unsubUser = onSnapshot(userDocRef, snap => {
      setUserProfile(snap.exists() ? snap.data() : null);
    }, err => console.error(err));

    const projRef = collection(db, 'artifacts', appId, 'public', 'data', 'projects');
    const unsubProj = onSnapshot(projRef, snap => {
      setDbProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error(err));

    return () => { unsubUser(); unsubProj(); };
  }, [fbUser]);

  // Ayarlar formundaki takma adı, Firestore'dan gelen profil ile senkron tut
  useEffect(() => {
    if (userProfile) {
      setSettingsNickname(userProfile.nickname || (fbUser && fbUser.email) || '');
    }
  }, [userProfile]);

  // Not: Fontlar artık burada toplu yüklenmiyor — 150 fontu baştan yüklemek uygulamayı
  // yavaşlatır. Her font yalnızca seçici içinde göründüğünde (lazy) yükleniyor,
  // bkz. ensureFontLoaded() ve FontOptionRow bileşeni.

  const showToast = (msg) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(''), 3000);
  };

  // --- HESAP İŞLEMLERİ (Firebase Authentication: e-posta + şifre + doğrulama maili) ---
  const handleRegister = () => {
    safeOperation(async () => {
      const email = authEmail.trim();
      const password = authPassword.trim();
      if (!email || !password) {
        return showToast('Lütfen tüm alanları doldurun.');
      }
      if (password.length < 6) {
        return showToast('Şifre en az 6 karakter olmalıdır.');
      }
      setAuthLoading(true);
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);

        // Doğrulama maili gönderimini ayrı bir try/catch'e alıyoruz: bu adım
        // (kota, geçici Firebase hatası vb. yüzünden) başarısız olsa bile hesap
        // zaten oluşmuş oluyor — kullanıcı giriş ekranından "Tekrar Gönder" ile
        // kurtarabilsin diye kaydı ve oturum kapatmayı yine de tamamlıyoruz.
        let mailSent = true;
        try {
          await sendEmailVerification(cred.user);
        } catch (mailErr) {
          mailSent = false;
          console.error('Doğrulama maili gönderilemedi:', mailErr);
        }

        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', cred.user.uid), {
          uid: cred.user.uid,
          email,
          nickname: email.split('@')[0],
          profilePic: '',
          createdAt: Date.now()
        });
        // Doğrulama tamamlanana kadar oturumu kapat, kullanıcı doğrulayınca giriş yapsın
        await signOut(auth);
        setAuthMode('login');
        setAuthEmail(email);
        setAuthPassword('');
        showToast(
          mailSent
            ? 'Hesabınız oluşturuldu! E-postanıza gönderdiğimiz doğrulama bağlantısına tıkladıktan sonra giriş yapabilirsiniz. (Gelmezse spam/gereksiz klasörünü kontrol edin)'
            : 'Hesabınız oluşturuldu ama doğrulama maili gönderilemedi. Giriş ekranında e-posta+şifrenizi girip "Doğrulama mailini tekrar gönder" butonunu kullanın.'
        );
      } catch (err) {
        showToast(mapFirebaseError(err));
      } finally {
        setAuthLoading(false);
      }
    });
  };

  const handleLogin = () => {
    safeOperation(async () => {
      const email = authEmail.trim();
      const password = authPassword.trim();
      if (!email || !password) {
        return showToast('Lütfen tüm alanları doldurun.');
      }
      setAuthLoading(true);
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (!cred.user.emailVerified) {
          await signOut(auth);
          setUnverifiedEmail(email);
          showToast('E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzu (ve spam klasörünü) kontrol edin.');
          return;
        }
        setUnverifiedEmail('');
        setShowAccountModal(false);
        setAuthPassword('');
        showToast('Başarıyla giriş yapıldı!');
      } catch (err) {
        showToast(mapFirebaseError(err));
      } finally {
        setAuthLoading(false);
      }
    });
  };

  // Doğrulama e-postasını tekrar gönder (girilen e-posta/şifre ile kısa süreli oturum açıp gönderir)
  const handleResendVerification = () => {
    safeOperation(async () => {
      const email = (unverifiedEmail || authEmail).trim();
      const password = authPassword.trim();
      if (!email || !password) {
        return showToast('Doğrulama mailini tekrar göndermek için e-posta ve şifrenizi girin.');
      }
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(cred.user);
        await signOut(auth);
        showToast('Doğrulama e-postası tekrar gönderildi!');
      } catch (err) {
        showToast(mapFirebaseError(err));
      }
    });
  };

  // Şifremi Unuttum: sıfırlama linki gönder
  const handleForgotPassword = () => {
    safeOperation(async () => {
      const email = authEmail.trim();
      if (!email) {
        return showToast('Şifre sıfırlama bağlantısı için e-posta adresinizi girin.');
      }
      try {
        await sendPasswordResetEmail(auth, email);
        showToast('Şifre sıfırlama bağlantısı e-postanıza gönderildi!');
        setAuthMode('login');
      } catch (err) {
        showToast(mapFirebaseError(err));
      }
    });
  };

  const handleLogout = () => {
    signOut(auth);
    setCurrentProject(null);
    showToast('Hesaptan çıkış yapıldı.');
  };

  // Ayarlar: Profil İkonu Değiştirme
  const handleProfilePicUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !fbUser) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Img = event.target.result;
      updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', fbUser.uid), { profilePic: base64Img })
        .then(() => showToast('Profil ikonunuz güncellendi!'))
        .catch(() => showToast('Profil ikonu güncellenirken hata oluştu.'));
    };
    reader.readAsDataURL(file);
  };

  // Ayarlar: Bilgi Güncelleme (Takma Ad & Şifre)
  const handleSaveSettings = () => {
    safeOperation(async () => {
      if (!fbUser) return;
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', fbUser.uid), {
          nickname: settingsNickname.trim() || fbUser.email
        });

        if (settingsNewPassword.trim()) {
          if (settingsNewPassword.trim().length < 6) {
            return showToast('Yeni şifre en az 6 karakter olmalıdır.');
          }
          if (!settingsCurrentPassword.trim()) {
            return showToast('Şifrenizi değiştirmek için mevcut şifrenizi girmelisiniz.');
          }
          const credential = EmailAuthProvider.credential(fbUser.email, settingsCurrentPassword.trim());
          await reauthenticateWithCredential(fbUser, credential);
          await updatePassword(fbUser, settingsNewPassword.trim());
        }

        setSettingsNewPassword('');
        setSettingsCurrentPassword('');
        setShowSettingsModal(false);
        showToast('Ayarlarınız başarıyla kaydedildi!');
      } catch (err) {
        showToast(mapFirebaseError(err));
      }
    });
  };

  // Ayarlar: Hesabı Sil (Çift Basma + Mevcut Şifre Şartı)
  const handleDeleteAccount = () => {
    if (!deleteConfirmStep) {
      setDeleteConfirmStep(true);
      showToast('Hesabınızı kalıcı olarak silmek için mevcut şifrenizi girip butona tekrar basın!');
      return;
    }
    safeOperation(async () => {
      if (!fbUser) return;
      if (!settingsCurrentPassword.trim()) {
        setDeleteConfirmStep(false);
        return showToast('Hesabınızı silmek için mevcut şifrenizi girmelisiniz.');
      }
      try {
        const credential = EmailAuthProvider.credential(fbUser.email, settingsCurrentPassword.trim());
        await reauthenticateWithCredential(fbUser, credential);
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', fbUser.uid));
        await deleteUser(fbUser);
        setCurrentProject(null);
        setShowSettingsModal(false);
        setDeleteConfirmStep(false);
        setSettingsCurrentPassword('');
        showToast('Hesabınız ve tüm verileriniz silindi.');
      } catch (err) {
        setDeleteConfirmStep(false);
        showToast(mapFirebaseError(err));
      }
    });
  };

  // Proje Listesini Belirleme (Giriş yapan kullanıcının uid'si ile eşleşenler)
  const displayProjects = loggedInUser 
    ? dbProjects.filter(p => p.owner === loggedInUser.uid).sort((a,b) => b.createdAtMs - a.createdAtMs)
    : localProjects;

  const restoreState = useCallback((stateObj) => {
    const canvas = mainCanvasRef.current;
    const hdCanvas = hdOverlayCanvasRef.current;
    if (!canvas || !hdCanvas) return;

    const ctx = canvas.getContext('2d');
    const hdCtx = hdCanvas.getContext('2d');

    if (stateObj.pixelData) {
      const img1 = new Image();
      img1.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img1, 0, 0);
      };
      img1.src = stateObj.pixelData;
    }

    if (stateObj.hdData) {
      const img2 = new Image();
      img2.onload = () => {
        hdCtx.clearRect(0, 0, HD_CANVAS_SIZE, HD_CANVAS_SIZE);
        hdCtx.drawImage(img2, 0, 0);
      };
      img2.src = stateObj.hdData;
    }
  }, []);

  const saveState = useCallback(() => {
    const canvas = mainCanvasRef.current;
    const hdCanvas = hdOverlayCanvasRef.current;
    if (!canvas || !hdCanvas) return;

    const pixelData = canvas.toDataURL();
    const hdData = hdCanvas.toDataURL();
    const stateObj = { pixelData, hdData };

    setHistory(prevHistory => {
      const newHistory = prevHistory.slice(0, historyStep + 1);
      newHistory.push(stateObj);
      if (newHistory.length > 40) newHistory.shift();
      return newHistory;
    });
    setHistoryStep(prevStep => Math.min(prevStep + 1, 39));
  }, [historyStep]);

  useEffect(() => {
    if (currentProject) {
      setGridSize(currentProject.size);
      setTimeout(() => {
        const canvas = mainCanvasRef.current;
        const hdCanvas = hdOverlayCanvasRef.current;
        if (canvas && hdCanvas) {
          canvas.width = currentProject.size;
          canvas.height = currentProject.size;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.imageSmoothingEnabled = false;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          hdCanvas.width = HD_CANVAS_SIZE;
          hdCanvas.height = HD_CANVAS_SIZE;
          const hdCtx = hdCanvas.getContext('2d');
          hdCtx.clearRect(0, 0, HD_CANVAS_SIZE, HD_CANVAS_SIZE);

          if (currentProject.pixelData) {
            restoreState({ pixelData: currentProject.pixelData, hdData: currentProject.hdData });
          } else {
            saveState();
          }
        }
      }, 50);
    }
  }, [currentProject, restoreState, saveState]);

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      restoreState(history[newStep]);
      setHistoryStep(newStep);
    }
  };

  const redo = () => {
    if (historyStep >= 0 && historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      restoreState(history[newStep]);
      setHistoryStep(newStep);
    }
  };

  const getCanvasCoords = (e) => {
    const container = touchContainerRef.current ? touchContainerRef.current.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const relX = clientX - container.left;
    const relY = clientY - container.top;

    const pixelX = Math.floor(relX / zoom);
    const pixelY = Math.floor(relY / zoom);

    return {
      x: Math.max(0, Math.min(gridSize - 1, pixelX)),
      y: Math.max(0, Math.min(gridSize - 1, pixelY))
    };
  };

  const drawPixel = (ctx, x, y, color) => {
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return;
    if (color === null) {
      ctx.clearRect(x, y, 1, 1);
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  };

  const drawPencilPattern = (ctx, x, y, color) => {
    if (pencilType === 'single') {
      drawPixel(ctx, x, y, color);
    } else if (pencilType === 'double') {
      drawPixel(ctx, x, y, color);
      drawPixel(ctx, x + 1, y, color);
      drawPixel(ctx, x, y + 1, color);
      drawPixel(ctx, x + 1, y + 1, color);
    } else if (pencilType === 'triple') {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          drawPixel(ctx, x + dx, y + dy, color);
        }
      }
    } else if (pencilType === 'large') {
      for (let dx = -1; dx <= 2; dx++) {
        for (let dy = -1; dy <= 2; dy++) {
          drawPixel(ctx, x + dx, y + dy, color);
        }
      }
    } else if (pencilType === 'dither') {
      if ((x + y) % 2 === 0) {
        drawPixel(ctx, x, y, color);
      }
    } else if (pencilType === 'cross') {
      drawPixel(ctx, x, y, color);
      drawPixel(ctx, x - 1, y, color);
      drawPixel(ctx, x + 1, y, color);
      drawPixel(ctx, x, y - 1, color);
      drawPixel(ctx, x, y + 1, color);
    } else if (pencilType === 'spray') {
      drawPixel(ctx, x, y, color);
      if (Math.random() > 0.5) drawPixel(ctx, x + (Math.random() > 0.5 ? 1 : -1), y + (Math.random() > 0.5 ? 1 : -1), color);
    }
  };

  const floodFill = (startX, startY, fillColor) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, gridSize, gridSize);
    const data = imgData.data;

    const getPixelColor = (x, y) => {
      const idx = (y * gridSize + x) * 4;
      return `${data[idx]},${data[idx+1]},${data[idx+2]},${data[idx+3]}`;
    };

    const targetColor = getPixelColor(startX, startY);
    const fillRgba = hexToRgba(fillColor);
    const fillStr = `${fillRgba.r},${fillRgba.g},${fillRgba.b},${fillRgba.a}`;

    if (targetColor === fillStr) return;

    const queue = [{ x: startX, y: startY }];
    const visited = new Set();

    while (queue.length > 0) {
      const { x, y } = queue.pop();
      const key = `${x},${y}`;

      if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;
      if (visited.has(key)) continue;
      visited.add(key);

      if (getPixelColor(x, y) === targetColor) {
        drawPixel(ctx, x, y, fillColor);
        queue.push({ x: x + 1, y });
        queue.push({ x: x - 1, y });
        queue.push({ x, y: y + 1 });
        queue.push({ x, y: y - 1 });
      }
    }
    saveState();
  };

  const fillEntireCanvas = () => {
    safeOperation(() => {
      const canvas = mainCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = selectedColor;
      ctx.fillRect(0, 0, gridSize, gridSize);
      saveState();
      setShowPencilMenu(false);
      showToast('Tüm alan boyandı');
    });
  };

  const clearEntireCanvas = () => {
    safeOperation(() => {
      const canvas = mainCanvasRef.current;
      const hdCanvas = hdOverlayCanvasRef.current;
      if (!canvas || !hdCanvas) return;
      const ctx = canvas.getContext('2d');
      const hdCtx = hdCanvas.getContext('2d');
      ctx.clearRect(0, 0, gridSize, gridSize);
      hdCtx.clearRect(0, 0, HD_CANVAS_SIZE, HD_CANVAS_SIZE);
      saveState();
      setShowPencilMenu(false);
      showToast('Tuval temizlendi');
    });
  };

  const pickColor = (x, y) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    if (pixel[3] > 0) {
      const hex = rgbaToHex(pixel[0], pixel[1], pixel[2]);
      setSelectedColor(hex);
      setCurrentTool('pencil');
    }
  };

  const handlePointerDown = (e) => {
    if (overlayElement) return;
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setLastPos(coords);

    if (currentTool === 'move') {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
      return;
    }

    if (currentTool === 'zoom') {
      setZoom(prev => Math.min(prev + 4, 32));
      return;
    }

    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (currentTool === 'pencil') {
      drawPencilPattern(ctx, coords.x, coords.y, selectedColor);
    } else if (currentTool === 'eraser') {
      drawPixel(ctx, coords.x, coords.y, null);
    } else if (currentTool === 'fill') {
      floodFill(coords.x, coords.y, selectedColor);
    } else if (currentTool === 'pipette') {
      pickColor(coords.x, coords.y);
    }
  };

  const handlePointerMove = (e) => {
    if (overlayElement) return;
    const coords = getCanvasCoords(e);

    if (!isDrawing) return;

    if (currentTool === 'move') {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPan({ x: clientX - dragStart.x, y: clientY - dragStart.y });
      return;
    }

    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (currentTool === 'pencil' || currentTool === 'eraser') {
      const linePixels = getLinePixels(lastPos.x, lastPos.y, coords.x, coords.y);
      const color = currentTool === 'pencil' ? selectedColor : null;
      linePixels.forEach(p => {
        if (currentTool === 'pencil') {
          drawPencilPattern(ctx, p.x, p.y, color);
        } else {
          drawPixel(ctx, p.x, p.y, color);
        }
      });
      setLastPos(coords);
    }
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentTool === 'pencil' || currentTool === 'eraser') {
      saveState();
    }
  };

  const handleOverlayPointerDown = (e, mode) => {
    e.stopPropagation();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setIsResizing(mode === 'drag' ? false : mode);
    setIsDraggingOverlay(mode === 'drag');

    setDragStartPoint({ x: clientX, y: clientY });
    setOverlayStartPos({
      x: overlayElement.x,
      y: overlayElement.y,
      w: overlayElement.width,
      h: overlayElement.height
    });
  };

  const handleOverlayPointerMove = useCallback((e) => {
    if (!overlayElement || (!isResizing && !isDraggingOverlay)) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const container = touchContainerRef.current ? touchContainerRef.current.getBoundingClientRect() : { width: 300, height: 300 };
    const dxPx = clientX - dragStartPoint.x;
    const dyPx = clientY - dragStartPoint.y;

    const dxPercent = (dxPx / container.width) * 100;
    const dyPercent = (dyPx / container.height) * 100;

    if (isResizing === 'resize-se') {
      setOverlayElement(prev => ({
        ...prev,
        width: Math.max(10, Math.min(90, overlayStartPos.w + dxPercent)),
        height: Math.max(8, Math.min(80, overlayStartPos.h + dyPercent))
      }));
    } else if (isResizing === 'resize-sw') {
      const newW = overlayStartPos.w - dxPercent;
      const newX = overlayStartPos.x + dxPercent;
      const newH = overlayStartPos.h + dyPercent;
      
      if (newW >= 10 && newW <= 90) {
        setOverlayElement(prev => ({
          ...prev,
          width: newW,
          x: newX,
          height: Math.max(8, Math.min(80, newH))
        }));
      } else {
        setOverlayElement(prev => ({
          ...prev,
          height: Math.max(8, Math.min(80, newH))
        }));
      }
    } else if (isDraggingOverlay) {
      setOverlayElement(prev => ({
        ...prev,
        x: Math.max(-10, Math.min(80, overlayStartPos.x + dxPercent)),
        y: Math.max(-10, Math.min(80, overlayStartPos.y + dyPercent))
      }));
    }
  }, [overlayElement, isResizing, isDraggingOverlay, dragStartPoint, overlayStartPos]);

  const handleOverlayPointerUp = useCallback(() => {
    setIsResizing(false);
    setIsDraggingOverlay(false);
  }, []);

  const handleFileUpload = (e, isProjectFile = false) => {
    safeOperation(() => {
      const file = e.target.files[0];
      if (!file) return;

      if (isProjectFile && file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target.result);
            if (parsed.size && (parsed.pixelData || parsed.hdData)) {
              const loadedProj = {
                id: Date.now().toString(),
                name: parsed.name || file.name.replace('.json', ''),
                size: parsed.size,
                createdAt: new Date().toLocaleDateString('tr-TR'),
                createdAtMs: Date.now(),
                pixelData: parsed.pixelData,
                hdData: parsed.hdData,
                owner: loggedInUser ? loggedInUser.uid : 'local'
              };
              if (loggedInUser && fbUser) {
                setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', loadedProj.id), loadedProj);
              } else {
                setLocalProjects(prev => [loadedProj, ...prev]);
              }
              setCurrentProject(loadedProj);
              showToast('Proje dosyası başarıyla yüklendi!');
            }
          } catch (err) {
            showToast('Geçersiz proje dosyası!');
          }
        };
        reader.readAsText(file);
      } else if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setOverlayElement({
          type: 'video',
          content: url,
          x: 25,
          y: 25,
          width: 50,
          height: 50
        });
        showToast('Video eklendi.');
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setOverlayElement({
            type: 'image',
            content: event.target.result,
            x: 32,
            y: 32,
            width: 35,
            height: 35
          });
          showToast('Resim eklendi.');
        };
        reader.readAsDataURL(file);
      }
      setShowDosyaModal(false);
    });
  };

  const startTextOverlay = () => {
    if (!textInput.trim()) return;
    setOverlayElement({
      type: 'text',
      content: textInput,
      font: selectedFont,
      color: textColor,
      x: 25,
      y: 40,
      width: 50,
      height: 20
    });
    setShowTextModal(false);
  };

  const applyOverlayToCanvas = () => {
    if (!overlayElement) return;

    const hdCanvas = hdOverlayCanvasRef.current;
    if (!hdCanvas) return;
    const hdCtx = hdCanvas.getContext('2d');
    hdCtx.imageSmoothingEnabled = true;

    const realX = (overlayElement.x / 100) * HD_CANVAS_SIZE;
    const realY = (overlayElement.y / 100) * HD_CANVAS_SIZE;
    const realW = (overlayElement.width / 100) * HD_CANVAS_SIZE;
    const realH = (overlayElement.height / 100) * HD_CANVAS_SIZE;

    if (overlayElement.type === 'text') {
      hdCtx.font = `bold ${realH * 0.5}px ${overlayElement.font}`;
      hdCtx.fillStyle = overlayElement.color;
      hdCtx.textBaseline = 'middle';
      hdCtx.textAlign = 'center';
      hdCtx.fillText(overlayElement.content, realX + (realW/2), realY + (realH/2));
      saveState();
      setOverlayElement(null);
      showToast('Metin katmana eklendi');
    } else if (overlayElement.type === 'image') {
      if (overlayImageRef.current) {
        hdCtx.drawImage(overlayImageRef.current, realX, realY, realW, realH);
        saveState();
        setOverlayElement(null);
        showToast('Görsel katmana eklendi');
      }
    } else if (overlayElement.type === 'video') {
      if (overlayVideoRef.current) {
        hdCtx.drawImage(overlayVideoRef.current, realX, realY, realW, realH);
        saveState();
        setOverlayElement(null);
        showToast('Video tuvale sabitlendi.');
      }
    }
  };

  // --- HESAP VERİLERİNE OTOMATİK KAYIT ---
  const saveProjectInternally = () => {
    if (!currentProject) return;
    const canvas = mainCanvasRef.current;
    const hdCanvas = hdOverlayCanvasRef.current;
    if (!canvas || !hdCanvas) return;

    const pixelData = canvas.toDataURL();
    const hdData = hdCanvas.toDataURL();

    const updatedProj = { ...currentProject, pixelData, hdData };
    setCurrentProject(updatedProj);

    if (loggedInUser && fbUser) {
      setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', updatedProj.id), updatedProj)
        .catch(err => console.error("Buluta kaydetme hatası", err));
    } else {
      setLocalProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
    }
  };

  const generateMergedCanvas = () => {
    const mainCanvas = mainCanvasRef.current;
    const hdCanvas = hdOverlayCanvasRef.current;
    if (!mainCanvas || !hdCanvas) return null;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = HD_CANVAS_SIZE;
    finalCanvas.height = HD_CANVAS_SIZE;
    const fCtx = finalCanvas.getContext('2d');

    fCtx.imageSmoothingEnabled = false;
    fCtx.drawImage(mainCanvas, 0, 0, HD_CANVAS_SIZE, HD_CANVAS_SIZE);

    fCtx.imageSmoothingEnabled = true;
    fCtx.drawImage(hdCanvas, 0, 0);

    return finalCanvas;
  };

  const exportImage1080p = () => {
    safeOperation(() => {
      saveProjectInternally(); 
      const finalCanvas = generateMergedCanvas();
      if (!finalCanvas) return;

      const link = document.createElement('a');
      link.download = `${currentProject ? currentProject.name : 'anka-art'}-1080p.png`;
      link.href = finalCanvas.toDataURL('image/png');
      link.click();
      setShowKaydetModal(false);
      showToast('Hesaba kaydedildi ve PNG olarak indirildi!');
    });
  };

  const exportProjectJson = () => {
    safeOperation(() => {
      saveProjectInternally(); 
      const mainCanvas = mainCanvasRef.current;
      const hdCanvas = hdOverlayCanvasRef.current;
      if (!mainCanvas || !hdCanvas) return;

      const projectData = {
        name: currentProject ? currentProject.name : 'anka-art-projesi',
        size: gridSize,
        pixelData: mainCanvas.toDataURL(),
        hdData: hdCanvas.toDataURL(),
        savedAt: new Date().toISOString()
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${projectData.name}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setShowKaydetModal(false);
      showToast('Hesaba ve Cihaza (.json) olarak kaydedildi!');
    });
  };

  const handleCreateProject = () => {
    safeOperation(() => {
      const name = newProjName.trim() || `Proje ${displayProjects.length + 1}`;
      const newProj = {
        id: Date.now().toString(),
        name,
        size: Number(newProjSize),
        createdAt: new Date().toLocaleDateString('tr-TR'),
        createdAtMs: Date.now(),
        pixelData: null,
        hdData: null,
        owner: loggedInUser ? loggedInUser.uid : 'local'
      };
      
      if (loggedInUser && fbUser) {
        setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', newProj.id), newProj);
      } else {
        setLocalProjects([newProj, ...localProjects]);
      }
      
      setCurrentProject(newProj);
      setShowNewProjectModal(false);
      setNewProjName('');
    });
  };


  // --- EKRAN 1: DASHBOARD (PROJELER) ---
  if (!currentProject) {
    return (
      <div className="min-h-screen w-screen bg-[#0F1018] text-white flex flex-col p-3 md:p-8 font-sans justify-between overflow-x-hidden">
        <div className="max-w-6xl mx-auto w-full">
          {/* Dashboard Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 md:mb-8 border-b border-[#202336] pb-4 md:pb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center text-black font-black shadow-lg shadow-orange-500/20 flex-shrink-0">
                <Flame size={24} className="text-white fill-amber-300" />
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-black tracking-wider bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
                  Anka Art
                </h1>
                <p className="text-[10px] md:text-xs text-gray-400">Piksel Tasarım & Stüdyo Ortamı (DDoS Korumalı)</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-3 flex-wrap">
              {/* Hesap Butonu veya Profili */}
              <button
                onClick={() => setShowAccountModal(true)}
                className="flex items-center space-x-2 bg-[#1A1D2D] hover:bg-[#25283B] border border-[#2F334D] px-3 md:px-4 py-2.5 md:py-3 rounded-2xl transition-all shadow-md text-xs md:text-sm font-bold"
              >
                {loggedInUser && loggedInUser.profilePic ? (
                  <img src={loggedInUser.profilePic} alt="Profile" className="w-6 h-6 rounded-full object-cover border border-amber-400" />
                ) : (
                  <User size={18} className={loggedInUser ? 'text-emerald-400' : 'text-gray-400'} />
                )}
                <span>{loggedInUser ? (loggedInUser.nickname) : 'Hesap Girişi'}</span>
              </button>

              {/* Ayarlar Tuşu (Sadece hesap açıkken görünür) */}
              {loggedInUser && (
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="flex items-center space-x-1.5 bg-[#22263B] hover:bg-[#2C314D] border border-[#373C5C] px-3 md:px-4 py-2.5 md:py-3 rounded-2xl transition-all shadow-md text-xs md:text-sm font-bold text-amber-400"
                  title="Hesap Ayarları"
                >
                  <Settings size={18} />
                  <span className="hidden sm:inline">Ayarlar</span>
                </button>
              )}

              <button
                onClick={() => setShowNewProjectModal(true)}
                className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold px-4 md:px-5 py-2.5 md:py-3 rounded-2xl shadow-lg shadow-orange-500/20 transition-all transform hover:scale-105 active:scale-95 text-xs md:text-sm"
              >
                <Plus size={18} />
                <span>Yeni Proje</span>
              </button>
            </div>
          </div>

          {/* Projeler Listesi */}
          <div>
            <h2 className="text-xs font-bold text-gray-400 mb-4 tracking-widest uppercase flex items-center space-x-2">
              <FolderPlus size={16} className={loggedInUser ? 'text-emerald-400' : 'text-amber-500'} />
              <span>{loggedInUser ? `${loggedInUser.nickname} - Bulut Projeleriniz` : 'Yerel Projeleriniz'}</span>
            </h2>
            
            {displayProjects.length === 0 ? (
              <div className="bg-[#171826] border border-[#25283B] rounded-3xl p-8 md:p-12 text-center">
                <FolderPlus size={40} className="mx-auto text-gray-600 mb-3" />
                <p className="text-gray-400 text-xs md:text-sm">Henüz oluşturulmuş veya bu hesaba kayıtlı bir projeniz yok.</p>
                <button
                  onClick={() => setShowNewProjectModal(true)}
                  className="mt-4 px-4 py-2 bg-amber-500/10 text-amber-400 rounded-xl text-xs font-semibold hover:bg-amber-500/20 transition-colors"
                >
                  İlk Projenizi Oluşturun
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
                {displayProjects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => setCurrentProject(proj)}
                    className="bg-[#171826] border border-[#25283B] hover:border-amber-500/50 rounded-3xl p-4 cursor-pointer transition-all hover:shadow-2xl hover:shadow-amber-500/10 group relative flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-full h-32 md:h-36 bg-[#0B0C12] rounded-2xl border border-[#202336] mb-3 flex items-center justify-center overflow-hidden relative">
                        {proj.pixelData ? (
                          <img src={proj.pixelData} alt={proj.name} className="h-full w-full object-contain p-3" style={{ imageRendering: 'pixelated' }} />
                        ) : (
                          <Grid size={32} className="text-gray-700 opacity-50" />
                        )}
                        <span className="absolute top-2 right-2 text-[10px] font-mono bg-[#202336]/90 backdrop-blur-md text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                          {proj.size}x{proj.size}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-100 group-hover:text-amber-400 transition-colors text-sm truncate">{proj.name}</h3>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#202336] text-[11px] text-gray-500">
                      <span>{proj.createdAt}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (loggedInUser && fbUser) {
                            deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', proj.id));
                          } else {
                            setLocalProjects(localProjects.filter(p => p.id !== proj.id));
                          }
                          showToast('Proje silindi.');
                        }}
                        className="p-1.5 hover:bg-rose-500/20 text-gray-500 hover:text-rose-400 rounded-lg transition-colors"
                        title="Projeyi Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* HESAP MODALI (LOGIN / REGISTER) */}
        {showAccountModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#171826] border border-[#2A2D44] rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
              <button onClick={() => setShowAccountModal(false)} className="absolute top-5 right-5 p-1 text-gray-400 hover:text-white rounded-lg">
                <X size={24} />
              </button>

              {loggedInUser ? (
                <div className="text-center">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500 overflow-hidden">
                    {loggedInUser.profilePic ? (
                      <img src={loggedInUser.profilePic} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} className="text-emerald-400" />
                    )}
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Hoş Geldin, {loggedInUser.nickname}!</h3>
                  <p className="text-gray-400 text-xs md:text-sm mb-6">Tüm projeleriniz hesabınızla eşleşerek güvenle kaydediliyor.</p>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => { setShowAccountModal(false); setShowSettingsModal(true); }}
                      className="w-full flex items-center justify-center space-x-2 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold rounded-xl transition-all text-xs md:text-sm"
                    >
                      <Settings size={18} />
                      <span>Hesap Ayarları & Profil Düzenle</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center space-x-2 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl transition-all text-xs md:text-sm"
                    >
                      <LogOut size={18} />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                      {authMode === 'login' ? 'Hesap Girişi' : authMode === 'register' ? 'Hesap Oluştur' : 'Şifremi Unuttum'}
                    </h3>
                    <p className="text-gray-400 text-xs md:text-sm">
                      {authMode === 'forgot'
                        ? 'E-posta adresinize bir şifre sıfırlama bağlantısı gönderelim.'
                        : authMode === 'register'
                          ? 'Kayıt olduktan sonra e-postanıza gelecek bağlantıyla hesabınızı doğrulamanız gerekir.'
                          : 'Projelerinizi kaydetmek ve bulutta saklamak için giriş yapın.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 mb-1.5 block">E-posta Adresiniz:</label>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="ornek@eposta.com"
                        autoCapitalize="none"
                        autoCorrect="off"
                        className="w-full bg-[#0B0C12] border border-[#2A2D44] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    {authMode !== 'forgot' && (
                      <div>
                        <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Şifre Giriniz:</label>
                        <input
                          type="password"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="Şifreniz (en az 6 karakter)"
                          className="w-full bg-[#0B0C12] border border-[#2A2D44] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                      </div>
                    )}

                    {unverifiedEmail && authMode === 'login' && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-400">
                        <p className="mb-2">E-posta adresiniz henüz doğrulanmadı. Doğrulama bağlantısı için gelen kutunuzu (ve spam klasörünü) kontrol edin.</p>
                        <button onClick={handleResendVerification} className="font-bold underline underline-offset-2">
                          Doğrulama mailini tekrar gönder
                        </button>
                      </div>
                    )}

                    <button
                      disabled={authLoading}
                      onClick={authMode === 'login' ? handleLogin : authMode === 'register' ? handleRegister : handleForgotPassword}
                      className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all text-sm disabled:opacity-50"
                    >
                      {authLoading
                        ? 'Lütfen bekleyin...'
                        : authMode === 'login' ? 'Giriş Yap' : authMode === 'register' ? 'Hesabımı Oluştur' : 'Sıfırlama Bağlantısı Gönder'}
                    </button>
                  </div>

                  <div className="mt-6 text-center space-y-2">
                    <button 
                      onClick={() => { setAuthMode(authMode === 'register' ? 'login' : 'register'); setAuthEmail(''); setAuthPassword(''); setUnverifiedEmail(''); }}
                      className="block w-full text-xs md:text-sm font-semibold text-gray-400 hover:text-white underline decoration-gray-600 underline-offset-4"
                    >
                      {authMode === 'register' ? 'Zaten hesabınız var mı? Giriş yapın' : 'Hesabınız yoksa hesap oluşturunuz'}
                    </button>
                    {authMode !== 'register' && (
                      <button
                        onClick={() => { setAuthMode(authMode === 'forgot' ? 'login' : 'forgot'); setUnverifiedEmail(''); }}
                        className="block w-full text-[11px] md:text-xs font-semibold text-gray-500 hover:text-gray-300 underline decoration-gray-700 underline-offset-4"
                      >
                        {authMode === 'forgot' ? 'Girişe geri dön' : 'Şifremi unuttum'}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* HESAP AYARLARI MODALI (Profil İkonu, Takma Ad, Şifre Değiştir, Hesabı Sil) */}
        {showSettingsModal && loggedInUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-[#171826] border border-[#2A2D44] rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl relative my-auto">
              <button onClick={() => setShowSettingsModal(false)} className="absolute top-5 right-5 p-1 text-gray-400 hover:text-white rounded-lg">
                <X size={24} />
              </button>

              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
                  <Settings size={22} />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-white">Hesap Ayarları</h3>
                  <p className="text-xs text-gray-400">Profil bilgilerinizi ve güvenliğinizi yönetin</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Profil İkonu Yükleme */}
                <div className="flex items-center space-x-4 bg-[#0B0C12] border border-[#2A2D44] p-3.5 rounded-2xl">
                  <div className="w-14 h-14 rounded-full bg-gray-800 overflow-hidden border border-amber-500/40 flex-shrink-0 flex items-center justify-center">
                    {loggedInUser.profilePic ? (
                      <img src={loggedInUser.profilePic} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-white mb-1">Profil İkonu</div>
                    <input type="file" ref={profilePicInputRef} onChange={handleProfilePicUpload} accept="image/*" className="hidden" />
                    <button 
                      onClick={() => profilePicInputRef.current && profilePicInputRef.current.click()}
                      className="px-3 py-1.5 bg-[#1E2238] hover:bg-[#282E4D] text-amber-400 text-xs font-semibold rounded-xl transition-all"
                    >
                      Galeriden Seç / Değiştir
                    </button>
                  </div>
                </div>

                {/* E-posta (salt okunur bilgi) */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">E-posta Adresiniz:</label>
                  <div className="w-full bg-[#0B0C12] border border-[#2A2D44] rounded-xl px-4 py-3 text-sm text-gray-400">
                    {fbUser ? fbUser.email : ''}
                  </div>
                </div>

                {/* Takma Ad (Nickname) */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Takma Adınız (Nickname):</label>
                  <input
                    type="text"
                    value={settingsNickname}
                    onChange={(e) => setSettingsNickname(e.target.value)}
                    placeholder="Takma adınızı girin"
                    className="w-full bg-[#0B0C12] border border-[#2A2D44] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Şifre Değiştir */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Yeni Şifre (Boş bırakırsanız değişmez):</label>
                  <input
                    type="password"
                    value={settingsNewPassword}
                    onChange={(e) => setSettingsNewPassword(e.target.value)}
                    placeholder="Yeni şifreniz"
                    className="w-full bg-[#0B0C12] border border-[#2A2D44] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                {/* Mevcut Şifre - şifre değişikliği ve hesap silme için güvenlik amaçlı zorunlu */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Mevcut Şifreniz (Şifre değiştirmek veya hesabı silmek için gerekli):</label>
                  <input
                    type="password"
                    value={settingsCurrentPassword}
                    onChange={(e) => setSettingsCurrentPassword(e.target.value)}
                    placeholder="Mevcut şifreniz"
                    className="w-full bg-[#0B0C12] border border-[#2A2D44] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <button
                  onClick={handleSaveSettings}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold rounded-xl shadow-lg transition-all text-xs md:text-sm mt-2"
                >
                  Ayarları Kaydet
                </button>

                {/* Hesabı Sil Bölümü (İki kez basma şartı) */}
                <div className="pt-4 mt-4 border-t border-[#2A2D44]">
                  <button
                    onClick={handleDeleteAccount}
                    className={`w-full py-3 rounded-xl text-xs md:text-sm font-bold transition-all border ${
                      deleteConfirmStep 
                        ? 'bg-red-600 hover:bg-red-500 text-white border-red-400 animate-pulse' 
                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/30'
                    }`}
                  >
                    {deleteConfirmStep ? 'EMİN MİSİNİZ? (Yukarıya mevcut şifrenizi girip tekrar basın)' : 'Hesabı Kalıcı Olarak Sil'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* YENİ PROJE MODALI */}
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#171826] border border-[#2A2D44] rounded-3xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Flame size={20} className="text-amber-400" />
                  <span>Yeni Proje Oluştur</span>
                </h3>
                <button onClick={() => setShowNewProjectModal(false)} className="p-1 text-gray-400 hover:text-white rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Proje İsmi Giriniz</label>
                  <input
                    type="text"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    placeholder="Örn: Anka Karakter, Oyun İkonu"
                    className="w-full bg-[#0B0C12] border border-[#2A2D44] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 mb-2 block">Proje Boyutu Seçiniz</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[8, 16, 25, 32, 64, 128].map((size) => (
                      <button
                        key={size}
                        onClick={() => setNewProjSize(size)}
                        className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                          newProjSize === size
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400 text-black shadow-lg shadow-orange-500/20'
                            : 'bg-[#0B0C12] border-[#2A2D44] text-gray-300 hover:border-gray-500'
                        }`}
                      >
                        {size} x {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowNewProjectModal(false)}
                  className="flex-1 py-3 bg-[#202336] hover:bg-[#2A2D44] text-gray-300 text-xs font-bold rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleCreateProject}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-extrabold rounded-xl shadow-lg shadow-orange-500/20 transition-all"
                >
                  Proje Başlat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- EKRAN 2: ÇİZİM & EDİTÖR EKRANI ---
  return (
    <div 
      className="flex flex-col h-[100dvh] w-screen bg-[#13141E] text-white font-sans overflow-hidden select-none"
      onPointerMove={handleOverlayPointerMove}
      onPointerUp={handleOverlayPointerUp}
      onTouchMove={handleOverlayPointerMove}
      onTouchEnd={handleOverlayPointerUp}
    >
      
      {/* Gizli Input'lar */}
      <input type="file" ref={galleryInputRef} onChange={(e) => handleFileUpload(e, false)} accept="image/*" className="hidden" />
      <input type="file" ref={deviceFileInputRef} onChange={(e) => handleFileUpload(e, true)} accept="*/*" className="hidden" />
      <input type="file" ref={videoInputRef} onChange={(e) => handleFileUpload(e, false)} accept="video/*" className="hidden" />

      {/* Üst Menü / Navbar (Sığdırılmış ve responsive) */}
      <header className="h-14 bg-[#181926] border-b border-[#222436] flex items-center justify-between px-2 md:px-3 z-30 overflow-x-auto scrollbar-none">
        <div className="flex items-center space-x-1.5 md:space-x-2 flex-shrink-0">
          <button 
            onClick={() => { saveProjectInternally(); setCurrentProject(null); }}
            className="p-2 hover:bg-[#25273C] text-gray-300 rounded-xl transition-colors"
            title="Projelere Dön (Kaydeder)"
          >
            <ArrowLeft size={18} />
          </button>

          <button 
            onClick={() => galleryInputRef.current && galleryInputRef.current.click()}
            className="w-8 h-8 md:w-9 md:h-9 bg-[#6C5CE7] text-white rounded-xl flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
            title="Galeriden Resim Ekle"
          >
            <ImageIcon size={16} />
          </button>

          <button 
            onClick={() => videoInputRef.current && videoInputRef.current.click()}
            className="w-8 h-8 md:w-9 md:h-9 bg-[#D63031] text-white rounded-xl flex items-center justify-center shadow-md hover:opacity-90 transition-opacity"
            title="Galeriden Video Ekle"
          >
            <Video size={16} />
          </button>

          <button 
            onClick={() => setShowTextModal(true)}
            className="w-8 h-8 md:w-9 md:h-9 bg-[#0984E3] text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
            title="Yazı/Metin Ekle"
          >
            <span>T</span>
          </button>

          <button 
            onClick={() => setShowDosyaModal(true)}
            className="hidden sm:flex items-center space-x-1.5 bg-[#1A1D2D] border border-[#2F334D] text-white px-2.5 py-1.5 rounded-full text-xs font-semibold shadow-md hover:opacity-90"
          >
            <FolderPlus size={14} />
            <span>Dosya</span>
          </button>
        </div>

        <div className="flex items-center space-x-1.5 md:space-x-2 flex-shrink-0">
          {loggedInUser && (
             <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mr-1">
               {loggedInUser.profilePic ? (
                 <img src={loggedInUser.profilePic} alt="Av" className="w-4 h-4 rounded-full object-cover" />
               ) : (
                 <User size={13} />
               )}
               <span className="text-xs font-bold">{loggedInUser.nickname}</span>
             </div>
          )}

          <button 
            onClick={undo}
            disabled={historyStep <= 0}
            className="w-8 h-8 md:w-9 md:h-9 bg-[#1F2133] hover:bg-[#2A2C44] disabled:opacity-30 rounded-full flex items-center justify-center text-gray-300 transition-colors"
            title="Geri Al"
          >
            <Undo size={15} />
          </button>

          <button 
            onClick={redo}
            disabled={historyStep >= history.length - 1}
            className="w-8 h-8 md:w-9 md:h-9 bg-[#1F2133] hover:bg-[#2A2C44] disabled:opacity-30 rounded-full flex items-center justify-center text-gray-300 transition-colors"
            title="İleri Al"
          >
            <Redo size={15} />
          </button>

          <button 
            onClick={() => {
              saveProjectInternally();
              showToast('Proje hesap verilerine kaydedildi!');
            }}
            className="flex items-center space-x-1 px-2.5 md:px-3 py-1.5 bg-[#00B894] hover:bg-[#00A383] text-white rounded-full shadow-lg transition-all active:scale-95"
            title="Hesaba Kaydet"
          >
            <Save size={15} />
            <span className="font-bold text-[11px] md:text-xs">KAYDET</span>
          </button>

          <button 
            onClick={() => setShowKaydetModal(true)}
            className="w-8 h-8 md:w-9 md:h-9 bg-[#1F2745] text-[#3867D6] hover:bg-[#28355E] rounded-full flex items-center justify-center transition-colors active:scale-95"
            title="Dışa Aktar"
          >
            <Download size={15} />
          </button>
        </div>
      </header>

      {/* Ana Çözünürlük ve Çalışma Alanı */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sol Araç Çubuğu */}
        <div className="w-14 md:w-16 bg-[#161724] border-r border-[#222436] flex flex-col items-center py-3 md:py-4 justify-between z-20">
          <div className="flex flex-col items-center space-y-3 md:space-y-4 w-full px-1.5 md:px-2">
            <div className="relative">
              <button 
                onClick={() => {
                  setCurrentTool('pencil');
                  setShowPencilMenu(!showPencilMenu);
                }}
                className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl relative transition-all flex items-center justify-center ${
                  currentTool === 'pencil' 
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105 ring-2 ring-amber-400' 
                    : 'bg-[#1F2133] text-gray-400 hover:bg-[#292B42]'
                }`}
              >
                <PenTool size={18} />
                <ChevronDown size={9} className="absolute bottom-1 right-1 text-white/90" />
              </button>

              {showPencilMenu && (
                <div className="absolute left-14 md:left-16 top-0 bg-[#1D1F30] border border-[#2D3048] p-2 rounded-2xl shadow-2xl z-50 w-52 md:w-56 space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase">Kalem & Fırça Tipi</div>
                  {[
                    { id: 'single', name: 'Tek Piksel (1x1)' },
                    { id: 'double', name: 'Çift Piksel (2x2)' },
                    { id: 'triple', name: 'Geniş Fırça (3x3)' },
                    { id: 'large', name: 'Büyük Fırça (4x4)' },
                    { id: 'dither', name: 'Dither (Noktalı)' },
                    { id: 'cross', name: 'Çapraz Desen' },
                    { id: 'spray', name: 'Sprey Efekti' }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => { setPencilType(t.id); setShowPencilMenu(false); }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-xl flex items-center justify-between ${
                        pencilType === t.id ? 'bg-amber-500 text-white font-bold' : 'hover:bg-[#292B42] text-gray-300'
                      }`}
                    >
                      <span>{t.name}</span>
                      {pencilType === t.id && <Check size={12} />}
                    </button>
                  ))}

                  <div className="border-t border-[#2D3048] my-1 pt-1" />
                  <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase">Hızlı Eylemler</div>
                  <button
                    onClick={fillEntireCanvas}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl flex items-center space-x-2 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-semibold"
                  >
                    <PaintBucket size={14} />
                    <span>Tüm Alanı Boya</span>
                  </button>
                  <button
                    onClick={clearEntireCanvas}
                    className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl flex items-center space-x-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-semibold"
                  >
                    <Trash2 size={14} />
                    <span>Tuvali Temizle</span>
                  </button>
                </div>
              )}
            </div>

            <button 
              onClick={() => setCurrentTool('eraser')}
              className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl transition-all flex items-center justify-center ${
                currentTool === 'eraser' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'text-gray-400 hover:bg-[#1F2133]'
              }`}
              title="Silgi"
            >
              <Eraser size={18} />
            </button>

            <button 
              onClick={() => setCurrentTool('fill')}
              className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl transition-all flex items-center justify-center ${
                currentTool === 'fill' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'text-gray-400 hover:bg-[#1F2133]'
              }`}
              title="Boya Kovası"
            >
              <PaintBucket size={18} />
            </button>

            <button 
              onClick={() => setCurrentTool('pipette')}
              className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl transition-all flex items-center justify-center ${
                currentTool === 'pipette' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'text-gray-400 hover:bg-[#1F2133]'
              }`}
              title="Damlalık"
            >
              <Pipette size={18} />
            </button>

            <button 
              onClick={() => setCurrentTool('zoom')}
              className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl transition-all flex items-center justify-center ${
                currentTool === 'zoom' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'text-gray-400 hover:bg-[#1F2133]'
              }`}
              title="Yakınlaştır"
            >
              <Search size={18} />
            </button>

            <button 
              onClick={() => setCurrentTool('move')}
              className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl transition-all flex items-center justify-center ${
                currentTool === 'move' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'text-gray-400 hover:bg-[#1F2133]'
              }`}
              title="Tuval Taşı"
            >
              <Move size={18} />
            </button>
          </div>

          <button 
            onClick={() => setShowGrid(!showGrid)}
            className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl border-2 flex items-center justify-center transition-all ${
              showGrid 
                ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                : 'border-[#292B42] text-gray-500 hover:border-gray-400'
            }`}
            title="Izgarayı Aç/Kapat"
          >
            <Grid size={18} />
          </button>
        </div>

        {/* Canvas & Orta Alan */}
        <div 
          className="flex-1 bg-[#0E0F17] relative overflow-hidden flex items-center justify-center touch-none cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {notificationMsg && (
            <div className="absolute top-4 z-40 bg-amber-500 text-black px-4 py-2 rounded-full font-bold text-xs shadow-2xl animate-bounce">
              {notificationMsg}
            </div>
          )}

          {/* Sabit Yakınlaştırma Kontrolü (Büyüteç) */}
          <div className="absolute bottom-3 right-3 z-40 flex flex-col items-center bg-[#181926]/95 backdrop-blur-md border border-[#2F334D] rounded-2xl shadow-2xl overflow-hidden">
            <button
              onClick={() => setZoom(prev => Math.min(32, prev + 2))}
              className="w-10 h-10 flex items-center justify-center text-gray-200 hover:bg-[#2A2C44] transition-colors"
              title="Yakınlaştır"
            >
              <ZoomIn size={18} />
            </button>
            <div className="w-full h-[1px] bg-[#2F334D]" />
            <button
              onClick={() => { setPan({ x: 0, y: 0 }); setZoom(16); }}
              className="w-10 h-10 flex items-center justify-center text-amber-400 hover:bg-[#2A2C44] transition-colors"
              title="Ekrana Sığdır"
            >
              <Search size={17} />
            </button>
            <div className="w-full h-[1px] bg-[#2F334D]" />
            <button
              onClick={() => setZoom(prev => Math.max(4, prev - 2))}
              className="w-10 h-10 flex items-center justify-center text-gray-200 hover:bg-[#2A2C44] transition-colors"
              title="Uzaklaştır"
            >
              <ZoomOut size={18} />
            </button>
          </div>

          <div 
            ref={touchContainerRef}
            className="relative shadow-2xl"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
          >
            <div 
              className="absolute inset-0 border border-[#252839]"
              style={{
                width: gridSize * zoom,
                height: gridSize * zoom,
                backgroundImage: showGrid 
                  ? `linear-gradient(45deg, #30334a 25%, transparent 25%), 
                     linear-gradient(-45deg, #30334a 25%, transparent 25%), 
                     linear-gradient(45deg, transparent 75%, #30334a 75%), 
                     linear-gradient(-45deg, transparent 75%, #30334a 75%)`
                  : 'none',
                backgroundSize: `${zoom * 2}px ${zoom * 2}px`,
                backgroundPosition: `0 0, 0 ${zoom}px, ${zoom}px -${zoom}px, -${zoom}px 0px`,
                backgroundColor: '#14151f'
              }}
            />

            <canvas
              ref={mainCanvasRef}
              className="relative z-10 cursor-crosshair"
              style={{
                width: gridSize * zoom,
                height: gridSize * zoom,
                imageRendering: 'pixelated'
              }}
            />

            <canvas
              ref={hdOverlayCanvasRef}
              className="absolute inset-0 z-15 pointer-events-none"
              style={{
                width: gridSize * zoom,
                height: gridSize * zoom
              }}
            />

            {/* Belirgin Piksel Izgara Çizgileri */}
            {showGrid && zoom >= 8 && (
              <div
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                  width: gridSize * zoom,
                  height: gridSize * zoom,
                  backgroundImage: `
                    linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px)
                  `,
                  backgroundSize: `${zoom}px ${zoom}px`
                }}
              />
            )}

            {/* Hareket ettirilebilir & Boyutlandırılabilir Katman (Overlay) */}
            {overlayElement && (
              <div 
                className="absolute z-30 border-2 border-dashed border-amber-400 bg-amber-500/10 cursor-move touch-none flex items-center justify-center"
                style={{
                  left: `${overlayElement.x}%`,
                  top: `${overlayElement.y}%`,
                  width: `${overlayElement.width}%`,
                  height: `${overlayElement.height}%`
                }}
                onPointerDown={(e) => handleOverlayPointerDown(e, 'drag')}
                onTouchStart={(e) => handleOverlayPointerDown(e, 'drag')}
              >
                {/* İptal ve Sabitle Tuşları */}
                <div className="absolute -top-12 flex space-x-2">
                  <button
                    onClick={() => setOverlayElement(null)}
                    className="w-9 h-9 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform z-40 touch-none"
                    title="İptal"
                  >
                    <X size={18} />
                  </button>
                  <button
                    onClick={applyOverlayToCanvas}
                    className="w-9 h-9 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-transform z-40 touch-none"
                    title="Tuvale Sabitle"
                  >
                    <Check size={18} />
                  </button>
                </div>

                <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-none p-0.5">
                  {overlayElement.type === 'text' && (
                    <svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet">
                      <text 
                        x="100" y="50" 
                        dominantBaseline="central" 
                        textAnchor="middle" 
                        fill={overlayElement.color} 
                        fontFamily={overlayElement.font} 
                        fontWeight="bold"
                        fontSize="60"
                      >
                        {overlayElement.content}
                      </text>
                    </svg>
                  )}
                  {overlayElement.type === 'image' && (
                    <img 
                      ref={overlayImageRef}
                      src={overlayElement.content} 
                      alt="Overlay" 
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  )}
                  {overlayElement.type === 'video' && (
                    <video 
                      ref={overlayVideoRef}
                      src={overlayElement.content} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  )}
                </div>

                {/* SOL ALT KÖŞE BOYUTLANDIRICI */}
                <div 
                  onPointerDown={(e) => handleOverlayPointerDown(e, 'resize-sw')}
                  onTouchStart={(e) => handleOverlayPointerDown(e, 'resize-sw')}
                  className="absolute -bottom-3.5 -left-3.5 w-7 h-7 bg-amber-500 text-black rounded-full flex items-center justify-center shadow-2xl cursor-sw-resize touch-none font-bold z-50 border-2 border-white"
                  title="Sol Alttan Boyutlandır"
                >
                  <ArrowDown size={12} className="rotate-45" />
                </div>

                {/* SAĞ ALT KÖŞE BOYUTLANDIRICI */}
                <div 
                  onPointerDown={(e) => handleOverlayPointerDown(e, 'resize-se')}
                  onTouchStart={(e) => handleOverlayPointerDown(e, 'resize-se')}
                  className="absolute -bottom-3.5 -right-3.5 w-7 h-7 bg-amber-500 text-black rounded-full flex items-center justify-center shadow-2xl cursor-se-resize touch-none font-bold z-50 border-2 border-white"
                  title="Sağ Alttan Boyutlandır"
                >
                  <ArrowDown size={12} className="-rotate-45" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alt Renk & Zoom Çubuğu */}
      <footer className="h-16 bg-[#181926] border-t border-[#222436] flex items-center justify-between px-3 md:px-4 z-30">
        <div className="flex items-center space-x-2 md:space-x-3 overflow-x-auto py-1 scrollbar-none">
          <div className="relative flex-shrink-0">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl cursor-pointer bg-transparent border-0 opacity-0 absolute inset-0"
            />
            <div 
              className="w-9 h-9 md:w-10 md:h-10 rounded-xl border-2 border-white/20 shadow-md flex items-center justify-center pointer-events-none"
              style={{ backgroundColor: selectedColor }}
            >
              <Palette size={16} className="text-white drop-shadow" />
            </div>
          </div>

          <div className="h-8 w-[1px] bg-[#292B42]" />

          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {palette.map((c, i) => (
              <button
                key={i}
                onClick={() => setSelectedColor(c)}
                className={`w-6 h-6 md:w-7 md:h-7 rounded-lg transition-transform flex-shrink-0 ${
                  selectedColor === c ? 'scale-125 ring-2 ring-white shadow-lg z-10' : 'hover:scale-110 opacity-90'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-1.5 md:space-x-2 pl-2 border-l border-[#222436] flex-shrink-0">
          <button
            onClick={() => setZoom(prev => Math.max(4, prev - 2))}
            className="w-8 h-8 bg-[#1F2133] hover:bg-[#2A2C44] rounded-lg flex items-center justify-center text-gray-300"
            title="Uzaklaştır"
          >
            <ZoomOut size={15} />
          </button>
          <span className="text-xs font-mono font-bold text-gray-400 w-8 text-center">{zoom}x</span>
          <button
            onClick={() => setZoom(prev => Math.min(32, prev + 2))}
            className="w-8 h-8 bg-[#1F2133] hover:bg-[#2A2C44] rounded-lg flex items-center justify-center text-gray-300"
            title="Yakınlaştır"
          >
            <ZoomIn size={15} />
          </button>
          <button
            onClick={() => { setPan({ x: 0, y: 0 }); setZoom(16); }}
            className="p-2 bg-[#1F2133] hover:bg-[#2A2C44] rounded-lg text-gray-300"
            title="Merkezle"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </footer>

      {/* METİN EKLE MODAL */}
      {showTextModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#171826] border border-[#2A2D44] rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Type size={20} className="text-blue-400" />
                <span>Yazı Katmanı Ekle</span>
              </h3>
              <button onClick={() => setShowTextModal(false)} className="p-1 text-gray-400 hover:text-white rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Metin</label>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Yazınızı buraya yazın..."
                  className="w-full bg-[#0B0C12] border border-[#2A2D44] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Yazı Tipi (Font) — {fontFamilies.length} font arasından seç</label>
                <button
                  type="button"
                  onClick={() => setShowFontPicker(true)}
                  className="w-full flex items-center justify-between bg-[#0B0C12] border border-[#2A2D44] rounded-xl px-4 py-3 text-sm text-white focus:outline-none hover:border-blue-500 transition-colors"
                >
                  <span style={{ fontFamily: selectedFont }} className="truncate">
                    {(fontFamilies.find(f => f.value === selectedFont) || {}).label || 'Font Seç'}
                  </span>
                  <ChevronDown size={16} className="text-gray-400 flex-shrink-0 ml-2" />
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Metin Rengi</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-12 h-10 bg-transparent cursor-pointer rounded-lg border-0"
                  />
                  <span className="text-xs font-mono text-gray-300">{textColor}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowTextModal(false)}
                className="flex-1 py-3 bg-[#202336] hover:bg-[#2A2D44] text-gray-300 text-xs font-bold rounded-xl"
              >
                İptal
              </button>
              <button
                onClick={startTextOverlay}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                Ekle ve Düzenle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FONT SEÇİCİ MODAL (Arama + her fontun kendi yazı tipiyle canlı önizlemesi) */}
      {showFontPicker && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[60] p-4">
          <div className="bg-[#171826] border border-[#2A2D44] rounded-3xl w-full max-w-md shadow-2xl flex flex-col" style={{ height: '85vh' }}>
            <div className="flex items-center justify-between p-5 pb-3 flex-shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Type size={20} className="text-blue-400" />
                <span>Font Seç ({fontFamilies.length})</span>
              </h3>
              <button onClick={() => setShowFontPicker(false)} className="p-1 text-gray-400 hover:text-white rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="px-5 pb-3 flex-shrink-0">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={fontSearchQuery}
                  onChange={(e) => setFontSearchQuery(e.target.value)}
                  placeholder="Font ara (ör. Roboto, El Yazısı, Piksel...)"
                  className="w-full bg-[#0B0C12] border border-[#2A2D44] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div data-font-scroll-root className="flex-1 overflow-y-auto px-5 pb-5 space-y-1.5">
              {fontFamilies
                .filter(f => {
                  const q = fontSearchQuery.trim().toLowerCase();
                  if (!q) return true;
                  return f.label.toLowerCase().includes(q) || (f.category || '').toLowerCase().includes(q);
                })
                .map(f => (
                  <FontOptionRow
                    key={f.id}
                    font={f}
                    isSelected={f.value === selectedFont}
                    previewText={textInput || 'ANKA ART'}
                    onSelect={(font) => {
                      setSelectedFont(font.value);
                      setShowFontPicker(false);
                    }}
                  />
                ))}
            </div>
          </div>
        </div>
      )}

      {/* DOSYA YÜKLEME MODAL */}
      {showDosyaModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#171826] border border-[#2A2D44] rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <FolderPlus size={20} className="text-emerald-400" />
                <span>İçeri Aktar / Yükle</span>
              </h3>
              <button onClick={() => setShowDosyaModal(false)} className="p-1 text-gray-400 hover:text-white rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => galleryInputRef.current && galleryInputRef.current.click()}
                className="w-full flex items-center space-x-3 bg-[#0B0C12] hover:bg-[#1A1C2B] border border-[#2A2D44] p-4 rounded-2xl text-left transition-colors"
              >
                <ImageIcon className="text-purple-400" size={24} />
                <div>
                  <div className="text-sm font-bold text-white">Galeriden Resim Ekle</div>
                  <div className="text-xs text-gray-400">Piksel veya HD kaplama görseli yükle</div>
                </div>
              </button>

              <button
                onClick={() => videoInputRef.current && videoInputRef.current.click()}
                className="w-full flex items-center space-x-3 bg-[#0B0C12] hover:bg-[#1A1C2B] border border-[#2A2D44] p-4 rounded-2xl text-left transition-colors"
              >
                <Video className="text-red-400" size={24} />
                <div>
                  <div className="text-sm font-bold text-white">Video Yükle</div>
                  <div className="text-xs text-gray-400">Arka plana veya katmana video ekle</div>
                </div>
              </button>

              <button
                onClick={() => deviceFileInputRef.current && deviceFileInputRef.current.click()}
                className="w-full flex items-center space-x-3 bg-[#0B0C12] hover:bg-[#1A1C2B] border border-[#2A2D44] p-4 rounded-2xl text-left transition-colors"
              >
                <HardDrive className="text-emerald-400" size={24} />
                <div>
                  <div className="text-sm font-bold text-white">Proje Dosyası Aç (.json)</div>
                  <div className="text-xs text-gray-400">Cihazdan kayıtlı Anka Art projesini yükle</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIŞA AKTAR VE İNDİR MODAL */}
      {showKaydetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#171826] border border-[#2A2D44] rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Download size={20} className="text-emerald-400" />
                <span>Dışa Aktar & İndir</span>
              </h3>
              <button onClick={() => setShowKaydetModal(false)} className="p-1 text-gray-400 hover:text-white rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={exportImage1080p}
                className="w-full flex items-center justify-between bg-[#0B0C12] hover:bg-[#1A1C2B] border border-[#2A2D44] p-4 rounded-2xl transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <ImageIcon className="text-emerald-400" size={24} />
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">HD PNG Görseli İndir (1080p)</div>
                    <div className="text-xs text-gray-400">Hesaba kaydeder ve yüksek kalitede indirir</div>
                  </div>
                </div>
              </button>

              <button
                onClick={exportProjectJson}
                className="w-full flex items-center justify-between bg-[#0B0C12] hover:bg-[#1A1C2B] border border-[#2A2D44] p-4 rounded-2xl transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Folder className="text-amber-400" size={24} />
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">Proje Dosyasını Cihaza İndir (.json)</div>
                    <div className="text-xs text-gray-400">Hesaba ve cihaza yedekle</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
