const gameArea = document.getElementById('game-area');
const startBtn = document.getElementById('start-btn');
const shopBtn = document.getElementById('shop-btn');
const statsBtn = document.getElementById('stats-btn');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const rankDisplay = document.getElementById('rank');
const creditsDisplay = document.getElementById('credits');
const gameTimeInput = document.getElementById('game-time');
const targetSizeInput = document.getElementById('target-size');
const modeSelect = document.getElementById('mode');
const dpiInput = document.getElementById('dpi');
const sensitivityInput = document.getElementById('sensitivity');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const logoutBtn = document.getElementById('logout-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const authStatus = document.getElementById('auth-status');
const authDiv = document.getElementById('auth');
const gameDiv = document.getElementById('game');
const historyBody = document.getElementById('history-body');
const shopDiv = document.getElementById('shop');
const closeShopBtn = document.getElementById('close-shop');
const statsPanel = document.getElementById('stats-panel');
const closeStatsBtn = document.getElementById('close-stats');
const accuracyDisplay = document.getElementById('accuracy');
const reactionDisplay = document.getElementById('reaction');
const kpsDisplay = document.getElementById('kps');
const statsGraph = document.getElementById('stats-graph').getContext('2d');

let score = 0;
let timeLeft = 0;
let gameActive = false;
let targetSize = 50;
let currentUser = null;
let credits = 0;
let upgrades = { bg: 'default', anim: 'none' };
let hits = 0;
let misses = 0;
let firstClickTime = 0;
let mode = 'flick';

const shopItems = {
    bg: { default: { cost: 0, name: 'Default' }, gradient: { cost: 50, name: 'Gradient' }, space: { cost: 100, name: 'Space' } },
    anim: { none: { cost: 0, name: 'None' }, burst: { cost: 50, name: 'Burst' }, ripple: { cost: 100, name: 'Ripple' } }
};

// Load/Save Data
function loadUsers() { return JSON.parse(localStorage.getItem('users')) || {}; }
function saveUsers(users) { localStorage.setItem('users', JSON.stringify(users)); }
function loadUserData(username) {
    const data = JSON.parse(localStorage.getItem(`data_${username}`)) || {};
    return { history: data.history || [], credits: data.credits || 0, upgrades: data.upgrades || { bg: 'default', anim: 'none' } };
}
function saveUserData(username, history, credits, upgrades) {
    localStorage.setItem(`data_${username}`, JSON.stringify({ history, credits, upgrades }));
}

// Rank System
function getRank(score) {
    if (score <= 10) return "Rookie";
    else if (score <= 20) return "Amateur";
    else if (score <= 30) return "Skilled";
    else if (score <= 40) return "Pro";
    else if (score <= 50) return "Elite";
    else return "Legend";
}

// Authentication
loginBtn.addEventListener('click', () => {
    const users = loadUsers();
    const username = usernameInput.value.toLowerCase();
    const password = passwordInput.value;
    if (users[username] && users[username] === password) {
        currentUser = username;
        const userData = loadUserData(username);
        credits = userData.credits;
        upgrades = userData.upgrades;
        authStatus.textContent = `Logged in as ${username}`;
        authDiv.querySelector('#login-form').style.display = 'none';
        logoutBtn.style.display = 'inline';
        gameDiv.style.display = 'block';
        creditsDisplay.textContent = credits;
        loadUserHistory();
        applyUpgrades();
    } else {
        authStatus.textContent = 'Invalid Gmail or password';
    }
});

signupBtn.addEventListener('click', () => {
    const users = loadUsers();
    const username = usernameInput.value.toLowerCase();
    const password = passwordInput.value;
    if (!username.endsWith('@gmail.com')) {
        authStatus.textContent = 'Please use a Gmail address (e.g., example@gmail.com)';
    } else if (users[username]) {
        authStatus.textContent = 'This Gmail is already registered';
    } else if (username && password) {
        users[username] = password;
        saveUsers(users);
        authStatus.textContent = 'Sign up successful! Please log in.';
        usernameInput.value = '';
        passwordInput.value = '';
    } else {
        authStatus.textContent = 'Enter a Gmail address and password';
    }
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    authStatus.textContent = '';
    authDiv.querySelector('#login-form').style.display = 'block';
    logoutBtn.style.display = 'none';
    gameDiv.style.display = 'none';
    historyBody.innerHTML = '';
});

// Game Logic
startBtn.addEventListener('click', startGame);

function startGame() {
    if (gameActive || !currentUser) return;
    gameActive = true;
    score = 0;
    hits = 0;
    misses = 0;
    firstClickTime = 0;
    timeLeft = parseInt(gameTimeInput.value) || 30;
    targetSize = parseInt(targetSizeInput.value) || 50;
    mode = modeSelect.value;
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    rankDisplay.textContent = "Unranked";
    startBtn.disabled = true;
    gameArea.innerHTML = '';

    spawnTarget();
    const timer = setInterval(() => {
        timeLeft--;
        timeDisplay.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            gameActive = false;
            startBtn.disabled = false;
            const finalRank = getRank(score);
            rankDisplay.textContent = finalRank;
            credits += score;
            creditsDisplay.textContent = credits;
            savePerformance(score, finalRank, mode);
            saveUserData(currentUser, loadUserData(currentUser).history, credits, upgrades);
            showStats();
            alert(`Game Over! Score: ${score} | Rank: ${finalRank} | Credits Earned: ${score}`);
            gameArea.innerHTML = '';
        }
    }, 1000);
}

function spawnTarget() {
    if (!gameActive) return;

    const target = document.createElement('div');
    target.classList.add('target');
    target.style.width = `${targetSize}px`;
    target.style.height = `${targetSize}px`;
    let x = Math.random() * (gameArea.offsetWidth - targetSize);
    let y = Math.random() * (gameArea.offsetHeight - targetSize);
    target.style.left = `${x}px`;
    target.style.top = `${y}px`;

    if (mode === 'track') {
        let dx = (Math.random() - 0.5) * 4;
        let dy = (Math.random() - 0.5) * 4;
        const move = setInterval(() => {
            if (!gameActive || !target.parentElement) { clearInterval(move); return; }
            x += dx; y += dy;
            if (x < 0 || x > gameArea.offsetWidth - targetSize) dx = -dx;
            if (y < 0 || y > gameArea.offsetHeight - targetSize) dy = -dy;
            target.style.left = `${x}px`;
            target.style.top = `${y}px`;
        }, 20);
    }

    target.addEventListener('click', () => {
        hits++;
        if (!firstClickTime) firstClickTime = Date.now();
        score++;
        scoreDisplay.textContent = score;
        if (upgrades.anim !== 'none') {
            target.classList.add(`hit-${upgrades.anim}`);
            target.addEventListener('animationend', () => {
                if (target.parentElement) gameArea.removeChild(target);
                if (mode !== 'switch' || Math.random() < 0.5) spawnTarget();
            }, { once: true });
        } else {
            gameArea.removeChild(target);
            if (mode !== 'switch' || Math.random() < 0.5) spawnTarget();
        }
    });

    gameArea.addEventListener('click', (e) => {
        if (e.target !== target && !e.target.classList.contains('target')) misses++;
    }, { once: true });

    gameArea.appendChild(target);
    if (mode === 'switch') setTimeout(() => spawnTarget(), 500);
}

// Performance History
function savePerformance(score, rank, mode) {
    const userData = loadUserData(currentUser);
    const history = userData.history;
    const entry = { date: new Date().toLocaleString(), mode, score, rank };
    history.push(entry);
    saveUserData(currentUser, history, credits, upgrades);
    loadUserHistory();
}

function loadUserHistory() {
    const userData = loadUserData(currentUser);
    const history = userData.history;
    historyBody.innerHTML = '';
    history.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${entry.date}</td><td>${entry.mode}</td><td>${entry.score}</td><td>${entry.rank}</td>`;
        historyBody.appendChild(row);
    });
}

// Shop and Upgrades
shopBtn.addEventListener('click', () => {
    shopDiv.style.display = 'block';
    updateShopButtons();
});

closeShopBtn.addEventListener('click', () => {
    shopDiv.style.display = 'none';
});

document.querySelectorAll('.shop-item').forEach(button => {
    button.addEventListener('click', () => {
        const type = button.getAttribute('data-type');
        const id = button.getAttribute('data-id');
        const item = shopItems[type][id];
        if (credits >= item.cost) {
            credits -= item.cost;
            upgrades[type] = id;
            creditsDisplay.textContent = credits;
            saveUserData(currentUser, loadUserData(currentUser).history, credits, upgrades);
            applyUpgrades();
            updateShopButtons();
            alert(`Purchased ${item.name} ${type === 'bg' ? 'Background' : 'Hit Animation'}!`);
        } else {
            alert('Not enough credits!');
        }
    });
});

function applyUpgrades() {
    gameArea.className = 'game-area';
    if (upgrades.bg !== 'default') gameArea.classList.add(`bg-${upgrades.bg}`);
}

function updateShopButtons() {
    document.querySelectorAll('.shop-item').forEach(button => {
        const type = button.getAttribute('data-type');
        const id = button.getAttribute('data-id');
        const item = shopItems[type][id];
        button.disabled = upgrades[type] === id;
        button.textContent = `${item.name} (${item.cost} Credits${upgrades[type] === id ? ' - Active' : ''})`;
    });
}

// Stats Dashboard
statsBtn.addEventListener('click', () => {
    showStats();
    statsPanel.style.display = 'block';
});

closeStatsBtn.addEventListener('click', () => {
    statsPanel.style.display = 'none';
});

function showStats() {
    const accuracy = hits + misses > 0 ? (hits / (hits + misses) * 100).toFixed(1) : 0;
    const reaction = hits > 0 ? ((Date.now() - firstClickTime) / hits).toFixed(0) : 0;
    const kps = (score / (parseInt(gameTimeInput.value) || 30)).toFixed(2);
    accuracyDisplay.textContent = `${accuracy}%`;
    reactionDisplay.textContent = `${reaction}ms`;
    kpsDisplay.textContent = kps;

    const userData = loadUserData(currentUser);
    const scores = userData.history.slice(-5).map(entry => entry.score);
    new Chart(statsGraph, {
        type: 'line',
        data: { labels: scores.map((_, i) => `Game ${i + 1}`), datasets: [{ label: 'Score', data: scores, borderColor: '#4CAF50', fill: false }] },
        options: { scales: { y: { beginAtZero: true } } }
    });
}

// Initial Load
if (currentUser) {
    const userData = loadUserData(currentUser);
    credits = userData.credits;
    upgrades = userData.upgrades;
    creditsDisplay.textContent = credits;
    loadUserHistory();
    applyUpgrades();
}
