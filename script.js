// Konfigurasi (bisa diubah di sini)
const CONFIG = {
    targetUTC: "2026-06-02T10:00:00Z",        // 2 Juni 2026 pukul 17.00 WIB
    targetDateReadable: "Selasa, 2 Juni 2026 pukul 17.00 WIB",
    sklGoogleDriveLink: "https://drive.google.com/file/d/1S9j3L8kF7gH2tJ5rQ6wE4rT9yU1i_oP5/view?usp=sharing"
};

let usersData = []; // akan diisi dari CSV
let isLoggedIn = false;
let timerInterval = null;

// DOM Elements
const loginPanel = document.getElementById('loginPanel');
const graduatePanel = document.getElementById('graduatePanel');
const loginBtn = document.getElementById('loginBtn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const logoutBtn = document.getElementById('logoutBtn');
const targetDateText = document.getElementById('targetDateText');

// Set target date text
if (targetDateText) targetDateText.innerText = `📅 ${CONFIG.targetDateReadable}`;

// --- Fungsi baca CSV dari file data/users.csv ---
async function loadUsersFromCSV() {
    try {
        const response = await fetch('data/users.csv');
        const csvText = await response.text();
        
        // Parsing CSV sederhana (asumsi kolom: username,password,name)
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Pastikan urutan kolom bebas, cari index username, password, name
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
            alert('Peringatan: File users.csv kosong atau format salah. Tambahkan data user.');
        }
        // Setelah load, cek session
        checkSession();
    } catch (err) {
        console.error('Gagal memuat users.csv:', err);
        alert(`Gagal memuat data user. Pastikan file data/users.csv ada dengan format:\nusername,password,name\ncontoh: alfatih,mts123,Alfatih`);
        // Fallback: data dummy agar demo tetap berjalan
        usersData = [
            { username: "demo", password: "demo123", name: "User Demo" }
        ];
        checkSession();
    }
}

// Timer
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
        if (isLoggedIn) updateSKLButton();
    }, 1000);
}

function isAnnouncementOpen() {
    const now = new Date();
    return now.getTime() >= new Date(CONFIG.targetUTC).getTime();
}

function updateSKLButton() {
    const sklArea = document.getElementById('sklButtonArea');
    const driveText = document.getElementById('driveLinkText');
    if (!sklArea) return;
    
    const isOpen = isAnnouncementOpen();
    const sklLink = CONFIG.sklGoogleDriveLink;
    
    if (isOpen) {
        sklArea.innerHTML = `
            <a href="${sklLink}" target="_blank" class="btn-skl active">
                <i class="fab fa-google-drive"></i> Buka / Unduh SKL (Google Drive)
            </a>
            <p style="font-size:12px; margin-top:12px;"><i class="fas fa-download"></i> Klik untuk mengakses Surat Keterangan Lulus resmi</p>
        `;
        if(driveText) driveText.innerHTML = `<i class="fab fa-google-drive"></i> Link resmi: <a href="${sklLink}" target="_blank" style="color:#1e6b4a;">${sklLink.substring(0, 50)}...</a>`;
    } else {
        sklArea.innerHTML = `
            <div class="btn-skl disabled">
                <i class="fas fa-hourglass-half"></i> SKL Tersedia Setelah ${CONFIG.targetDateReadable}
            </div>
            <p style="font-size:12px; margin-top:12px;"><i class="fas fa-info-circle"></i> Pengumuman resmi dibuka pada waktu tersebut.</p>
        `;
        if(driveText) driveText.innerHTML = `<i class="fab fa-google-drive"></i> Link SKL akan aktif sesuai waktu pengumuman.`;
    }
}

function showGraduateDashboard(username) {
    const user = usersData.find(u => u.username === username);
    const displayName = user ? user.name : username;
    
    const greetingDiv = document.getElementById('personalGreeting');
    if (greetingDiv) {
        greetingDiv.innerHTML = `<p style="font-size: 1.1rem;">🎉 Dengan rahmat Allah, Ananda <strong>${displayName}</strong> dinyatakan <strong style="color:#c77d1e;">LULUS</strong> tahun pelajaran 2025/2026 🎉</p>
                                 <p style="margin-top:8px;">✨ Semoga ilmu yang didapat berkah, sukses di jenjang berikutnya ✨</p>`;
    }
    
    updateSKLButton();
    loginPanel.style.display = 'none';
    graduatePanel.style.display = 'block';
    isLoggedIn = true;
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('loggedUser', username);
}

function logoutHandler() {
    isLoggedIn = false;
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

// Mulai: load CSV dulu, lalu timer
startTimer();
loadUsersFromCSV();
