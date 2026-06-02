// Global variables
let isLoggedIn = false;
let timerInterval = null;
let configData = null;
let usersData = [];

// DOM elements
const loginPanel = document.getElementById('loginPanel');
const graduatePanel = document.getElementById('graduatePanel');
const loginBtn = document.getElementById('loginBtn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const logoutBtn = document.getElementById('logoutBtn');
const targetDateText = document.getElementById('targetDateText');

// Load config & users
async function loadData() {
    try {
        const configRes = await fetch('data/config.json');
        configData = await configRes.json();
        
        const usersRes = await fetch('data/users.json');
        usersData = await usersRes.json();
        
        // Set target date text
        if (targetDateText) {
            targetDateText.innerText = `📅 ${configData.targetDateReadable}`;
        }
        startTimer();
        checkSession();
    } catch (err) {
        console.error('Gagal memuat data:', err);
        alert('Gagal memuat data. Pastikan file config.json dan users.json ada di folder data/');
    }
}

// Timer
function updateTimerDisplay() {
    if (!configData) return;
    const targetTime = new Date(configData.targetUTC).getTime();
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
    if (!configData) return false;
    const now = new Date();
    return now.getTime() >= new Date(configData.targetUTC).getTime();
}

function updateSKLButton() {
    const sklArea = document.getElementById('sklButtonArea');
    const driveText = document.getElementById('driveLinkText');
    if (!sklArea || !configData) return;
    
    const isOpen = isAnnouncementOpen();
    const sklLink = configData.sklGoogleDriveLink;
    
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
                <i class="fas fa-hourglass-half"></i> SKL Tersedia Setelah ${configData.targetDateReadable}
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
        alert("❌ Username atau password salah. Cek file users.json untuk data yang tersedia.");
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

// Start
loadData();
