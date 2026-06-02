// Konfigurasi (bisa diubah di sini)
const CONFIG = {
    targetUTC: "2026-06-02T10:00:00Z",        // 2 Juni 2026 pukul 17.00 WIB
    targetDateReadable: "Selasa, 2 Juni 2026 pukul 17.00 WIB",
    sklGoogleDriveLink: "https://drive.google.com/drive/folders/1sOGEG9RT-ywn9WMalQnO92b0dDP3k0kn?usp=sharing"
    
};

let usersData = [];
let isLoggedIn = false;
let timerInterval = null;
let currentUser = null; // menyimpan username yang login

// DOM Elements
const loginPanel = document.getElementById('loginPanel');
const graduatePanel = document.getElementById('graduatePanel');
const loginBtn = document.getElementById('loginBtn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const logoutBtn = document.getElementById('logoutBtn');
const targetDateText = document.getElementById('targetDateText');
const announcementContent = document.getElementById('announcementContent');

// Set target date text
if (targetDateText) targetDateText.innerText = `📅 ${CONFIG.targetDateReadable}`;

// --- Fungsi baca CSV dari file data/users.csv ---
async function loadUsersFromCSV() {
    try {
        const response = await fetch('data/users.csv');
        const csvText = await response.text();
        
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const idxUsername = headers.indexOf('username');
        const idxPassword = headers.indexOf('password');
        const idxName = headers.indexOf('name');
        
        if (idxUsername === -1 || idxPassword === -1 || idxName === -1) {
            throw new Error('CSV harus memiliki kolom: username, password, name');
        }
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length >= 3) {
                usersData.push({
                    username: values[idxUsername],
                    password: values[idxPassword],
                    name: values[idxName]
                });
            }
        }
        
        console.log(`${usersData.length} user berhasil dimuat dari CSV`);
        if (usersData.length === 0) {
            alert('Peringatan: File users.csv kosong atau format salah.');
        }
        checkSession();
    } catch (err) {
        console.error('Gagal memuat users.csv:', err);
        alert(`Gagal memuat data user. Pastikan file data/users.csv ada dengan format:\nusername,password,name\ncontoh: alfatih,mts123,Alfatih`);
        usersData = [{ username: "demo", password: "demo123", name: "User Demo" }];
        checkSession();
    }
}

// Timer countdown
function updateTimerDisplay() {
    const targetTime = new Date(CONFIG.targetUTC).getTime();
    const now = new Date();
    const diff = targetTime - now;

    const daysElem = document.getElementById('days');
    const hoursElem = document.getElementById('hours');
    const minutesElem = document.getElementById('minutes');
    const secondsElem = document.getElementById('seconds');

    if (diff <= 0) {
        if (daysElem) daysElem.innerText = "00";
        if (hoursElem) hoursElem.innerText = "00";
        if (minutesElem) minutesElem.innerText = "00";
        if (secondsElem) secondsElem.innerText = "00";
        const timerWidget = document.getElementById('timerWidget');
        if (timerWidget && !timerWidget.getAttribute('data-expired')) {
            timerWidget.style.background = "#d4af37";
            timerWidget.style.color = "#1f3e32";
            const labelDiv = timerWidget.querySelector('.timer-label');
            if(labelDiv) labelDiv.innerHTML = '<i class="fas fa-check-circle"></i> PENGUMUMAN TELAH DIBUKA!';
            timerWidget.setAttribute('data-expired', 'true');
        }
        // Jika waktu sudah lewat dan pengguna sedang login, refresh tampilan kelulusan
        if (isLoggedIn) {
            renderAnnouncementContent();
        }
        return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    const days = Math.floor(totalHours / 24);

    if (daysElem) daysElem.innerText = days < 10 ? '0' + days : days;
    if (hoursElem) hoursElem.innerText = hours < 10 ? '0' + hours : hours;
    if (minutesElem) minutesElem.innerText = minutes < 10 ? '0' + minutes : minutes;
    if (secondsElem) secondsElem.innerText = seconds < 10 ? '0' + seconds : seconds;
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        updateTimerDisplay();
        if (isLoggedIn) {
            renderAnnouncementContent(); // update konten jika waktu berubah
        }
    }, 1000);
}

// Cek apakah pengumuman sudah boleh ditampilkan
function isAnnouncementOpen() {
    const now = new Date();
    return now.getTime() >= new Date(CONFIG.targetUTC).getTime();
}

// Render konten di dalam graduatePanel berdasarkan status waktu
function renderAnnouncementContent() {
    if (!announcementContent) return;
    
    const isOpen = isAnnouncementOpen();
    const user = usersData.find(u => u.username === currentUser);
    const displayName = user ? user.name : (currentUser || "Siswa");
    
    if (!isOpen) {
        // Tampilkan pesan bahwa pengumuman belum dibuka
        announcementContent.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <i class="fas fa-clock" style="font-size: 3rem; color: #eab308; margin-bottom: 15px;"></i>
                <h3 style="color: #1f3e32;">⏳ Pengumuman Belum Dibuka</h3>
                <p style="margin-top: 10px;">Pengumuman kelulusan baru akan ditampilkan pada:</p>
                <p style="font-weight: bold; background: #fef5e6; display: inline-block; padding: 8px 16px; border-radius: 30px; margin: 10px 0;">
                    <i class="fas fa-calendar-alt"></i> ${CONFIG.targetDateReadable}
                </p>
                <p>Silakan kembali lagi pada waktu tersebut. Terima kasih.</p>
                <div style="margin-top: 20px; font-size: 0.8rem; color: #7a6a3a;">
                    <i class="fas fa-info-circle"></i> Anda sudah login sebagai <strong>${displayName}</strong>
                </div>
            </div>
        `;
    } else {
        // Tampilkan ucapan selamat dan tombol SKL
        const sklLink = CONFIG.sklGoogleDriveLink;
        announcementContent.innerHTML = `
            <div class="congrats">
                <i class="fas fa-gem"></i>
                <h2>Alhamdulillah! Selamat Lulus</h2>
                <i class="fas fa-hand-peace"></i>
                <div class="badge-lulus">
                    <i class="fas fa-trophy"></i> Kelas 9 MTs Irsyaduth Thullab Tedunan
                </div>
            </div>
            <div style="text-align: center; margin: 15px 0;">
                <p style="font-size: 1.1rem;">🎉 Dengan rahmat Allah, Ananda <strong>${displayName}</strong> dinyatakan <strong style="color:#c77d1e;">LULUS</strong> tahun pelajaran 2025/2026 🎉</p>
                <p style="margin-top:8px;">✨ Semoga ilmu yang didapat berkah, sukses di jenjang berikutnya ✨</p>
            </div>
            <div class="skl-section">
                <i class="fas fa-file-alt" style="font-size: 2rem; color: #d4a017;"></i>
                <h4 style="margin: 5px 0;">Surat Keterangan Lulus (SKL)</h4>
                <div id="sklButtonArea">
                    <a href="${sklLink}" target="_blank" class="btn-skl active">
                        <i class="fab fa-google-drive"></i> Buka / Unduh SKL (Google Drive)
                    </a>
                    <p style="font-size:12px; margin-top:12px;"><i class="fas fa-download"></i> Klik untuk mengakses Surat Keterangan Lulus resmi</p>
                </div>
                <div class="link-info" id="driveLinkText">
                    <i class="fab fa-google-drive"></i> Link resmi: <a href="${sklLink}" target="_blank" style="color:#1e6b4a;">${sklLink.substring(0, 50)}...</a>
                </div>
            </div>
        `;
    }
}

function showGraduateDashboard(username) {
    currentUser = username;
    loginPanel.style.display = 'none';
    graduatePanel.style.display = 'block';
    isLoggedIn = true;
    renderAnnouncementContent(); // tampilkan sesuai status waktu
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('loggedUser', username);
}

function logoutHandler() {
    isLoggedIn = false;
    currentUser = null;
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('loggedUser');
    loginPanel.style.display = 'block';
    graduatePanel.style.display = 'none';
    usernameInput.value = '';
    passwordInput.value = '';
}

function attemptLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
        alert("✋ Mohon isi username dan password!");
        return;
    }
    
    const validUser = usersData.find(u => u.username === username && u.password === password);
    if (validUser) {
        showGraduateDashboard(username);
    } else {
        alert("❌ Username atau password salah. Periksa kembali atau hubungi panitia.");
    }
}

function checkSession() {
    const logged = sessionStorage.getItem('isLoggedIn');
    if (logged === 'true') {
        const savedUser = sessionStorage.getItem('loggedUser');
        if (savedUser && usersData.some(u => u.username === savedUser)) {
            showGraduateDashboard(savedUser);
        } else {
            sessionStorage.clear();
            loginPanel.style.display = 'block';
            graduatePanel.style.display = 'none';
        }
    } else {
        loginPanel.style.display = 'block';
        graduatePanel.style.display = 'none';
    }
}

// Event listeners
loginBtn.addEventListener('click', attemptLogin);
logoutBtn.addEventListener('click', logoutHandler);
[usernameInput, passwordInput].forEach(inp => inp.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') attemptLogin();
}));

// Mulai
startTimer();
loadUsersFromCSV();
