// --- DOM ELEMENT GLOBALS ---
let countdownTimerEl, levelEl, xpPointsEl, xpToNextLevelEl, xpBarEl, streakDaysEl, questListEl;
let questModalEl, questForm, modalTitleEl, questIdInput, questNameInput, questCategoryInput, questPriorityInput, questXpInput, questNotesInput;
let addQuestBtn, cancelQuestBtn;
let settingsModalEl, openSettingsBtn, closeSettingsBtn, themeSelect, focusDurationInput, breakDurationInput, soundToggle, resetProgressFromSettingsBtn;
let filterCategoryEl;
let pomodoroDisplayEl, pomodoroModeEl, startPomodoroBtn, pausePomodoroBtn, resetPomodoroBtn, notificationSound;

// --- STATE ---
let quests = [];
let xp = 0;
let streak = 0;
let lastCompletionDate = null;
let unlockedRewards = [];
let settings = {
    theme: 'cyber-neon',
    focusDuration: 45,
    breakDuration: 5,
    soundEnabled: true
};
const XP_PER_LEVEL = 100;
const LEVEL_REWARDS = {
    2: { title: "Novice Planner", icon: "🌱" },
    5: { title: "Quest Conqueror", icon: "⚔️" },
    10: { title: "Productivity Master", icon: "🧠" },
    15: { title: "JedBot Engineer", icon: "🤖" },
    20: { title: "NSAT Champion", icon: "🏆" }
};
let pomodoroState = 'stopped';
let currentMode = 'focus';
let pomodoroEndTime;
let pomodoroTimeLeft;
let pomodoroAnimationId;
let draggedQuestId = null;
let countdownInterval;


function assignDOMElements() {
    countdownTimerEl = document.getElementById('countdown-timer');
    levelEl = document.getElementById('level');
    xpPointsEl = document.getElementById('xp-points');
    xpToNextLevelEl = document.getElementById('xp-to-next-level');
    xpBarEl = document.getElementById('xp-bar');
    streakDaysEl = document.getElementById('streak-days');
    questListEl = document.getElementById('quest-list');
    questModalEl = document.getElementById('quest-modal');
    questForm = document.getElementById('quest-form');
    modalTitleEl = document.getElementById('modal-title');
    questIdInput = document.getElementById('quest-id');
    questNameInput = document.getElementById('quest-name');
    questCategoryInput = document.getElementById('quest-category');
    questPriorityInput = document.getElementById('quest-priority');
    questXpInput = document.getElementById('quest-xp');
    questNotesInput = document.getElementById('quest-notes');
    addQuestBtn = document.getElementById('add-quest-btn');
    cancelQuestBtn = document.getElementById('cancel-quest-btn');
    openSettingsBtn = document.getElementById('open-settings-btn');
    filterCategoryEl = document.getElementById('filter-category');
    settingsModalEl = document.getElementById('settings-modal');
    closeSettingsBtn = document.getElementById('close-settings-btn');
    themeSelect = document.getElementById('theme-select');
    focusDurationInput = document.getElementById('focus-duration');
    breakDurationInput = document.getElementById('break-duration');
    soundToggle = document.getElementById('sound-toggle');
    resetProgressFromSettingsBtn = document.getElementById('reset-progress-from-settings');
    pomodoroDisplayEl = document.getElementById('pomodoro-display');
    pomodoroModeEl = document.getElementById('pomodoro-mode');
    startPomodoroBtn = document.getElementById('start-pomodoro');
    pausePomodoroBtn = document.getElementById('pause-pomodoro');
    resetPomodoroBtn = document.getElementById('reset-pomodoro');
    notificationSound = document.getElementById('notification-sound');
}

function applySettings() {
    document.body.className = settings.theme;
    if (pomodoroState === 'stopped') {
        updatePomodoroDisplay(settings.focusDuration * 60 * 1000);
    }
}

function loadState() {
    const savedState = JSON.parse(localStorage.getItem('jedQuestState'));
    if (savedState) {
        quests = savedState.quests || [];
        xp = savedState.xp || 0;
        streak = savedState.streak || 0;
        lastCompletionDate = savedState.lastCompletionDate;
        unlockedRewards = savedState.unlockedRewards || [];
        Object.assign(settings, savedState.settings);
    }
}

function saveState() {
    const state = { quests, xp, streak, lastCompletionDate, unlockedRewards, settings };
    localStorage.setItem('jedQuestState', JSON.stringify(state));
}

function updateUI() {
    const currentLevel = Math.floor(xp / XP_PER_LEVEL) + 1;
    const xpInCurrentLevel = xp % XP_PER_LEVEL;
    levelEl.textContent = currentLevel;
    xpPointsEl.textContent = xpInCurrentLevel;
    xpToNextLevelEl.textContent = XP_PER_LEVEL;
    xpBarEl.style.width = `${(xpInCurrentLevel / XP_PER_LEVEL) * 100}%`;
    streakDaysEl.textContent = streak;
    renderQuests();
    renderRewards();
    saveState();
}

function renderQuests() {
    const filterValue = filterCategoryEl.value;
    questListEl.innerHTML = '';
    const filteredQuests = quests.filter(quest => filterValue === 'all' || quest.category === filterValue);
    if (filteredQuests.length === 0) {
        questListEl.innerHTML = quests.length === 0 ? `<p style="text-align:center;">No quests yet. Add one to get started!</p>` : `<p style="text-align:center;">No quests match this filter.</p>`;
        return;
    }
    filteredQuests.forEach(quest => {
        const questEl = document.createElement('li');
        questEl.draggable = true;
        questEl.dataset.id = quest.id;
        questEl.dataset.priority = quest.priority;
        if (quest.completed) questEl.classList.add('completed');
        questEl.innerHTML = `
            <div class="quest-info">
                <span class="quest-name">${quest.name}</span>
                <span class="quest-category">${quest.category}</span>
                ${quest.notes ? `<p class="quest-notes">${quest.notes}</p>` : ''}
            </div>
            <div class="quest-actions">
                <button class="complete-btn">${quest.completed ? 'Undo' : 'Complete'}</button>
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>`;
        questListEl.appendChild(questEl);
    });
}

function openModal(questToEdit = null) {
    questForm.reset();
    if (questToEdit) {
        modalTitleEl.textContent = 'Edit Quest';
        questIdInput.value = questToEdit.id;
        questNameInput.value = questToEdit.name;
        questCategoryInput.value = questToEdit.category;
        questPriorityInput.value = questToEdit.priority;
        questXpInput.value = questToEdit.xp;
        questNotesInput.value = questToEdit.notes;
    } else {
        modalTitleEl.textContent = 'Add New Quest';
        questIdInput.value = '';
    }
    questModalEl.style.display = 'flex';
}

function closeModal() {
    questModalEl.style.display = 'none';
}

function handleFormSubmit(e) {
    e.preventDefault();
    const id = questIdInput.value;
    const questData = {
        name: questNameInput.value,
        category: questCategoryInput.value,
        priority: questPriorityInput.value,
        xp: parseInt(questXpInput.value),
        notes: questNotesInput.value,
    };
    if (id) {
        const quest = quests.find(q => q.id === id);
        Object.assign(quest, questData);
    } else {
        quests.push({ id: `${Date.now()}-${Math.random()}`, ...questData, completed: false });
    }
    closeModal();
    updateUI();
}

function handleQuestAction(e) {
    const questEl = e.target.closest('li');
    if (!questEl) return;
    const questId = questEl.dataset.id;
    const quest = quests.find(q => q.id === questId);
    if (e.target.classList.contains('complete-btn')) {
        quest.completed = !quest.completed;
        if (quest.completed) {
            updateStreak();
            addXp(quest.xp);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else {
            addXp(-quest.xp);
        }
    } else if (e.target.classList.contains('edit-btn')) {
        openModal(quest);
    } else if (e.target.classList.contains('delete-btn')) {
        quests = quests.filter(q => q.id !== questId);
    }
    updateUI();
}

function updateStreak() {
    const today = new Date().toDateString();
    if (lastCompletionDate) {
        const lastDate = new Date(lastCompletionDate).toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (lastDate === today) return;
        if (lastDate === yesterday.toDateString()) {
            streak++;
            addXp(streak * 10);
        } else {
            streak = 1;
        }
    } else {
        streak = 1;
    }
    lastCompletionDate = new Date().toISOString();
}

function addXp(amount) {
    xp += amount;
    if (xp < 0) xp = 0;
    checkForNewRewards();
}

function checkForNewRewards() {
    const currentLevel = Math.floor(xp / XP_PER_LEVEL) + 1;
    for (const level in LEVEL_REWARDS) {
        const reward = LEVEL_REWARDS[level];
        const isUnlocked = unlockedRewards.some(r => r.title === reward.title);
        if (currentLevel >= level && !isUnlocked) {
            unlockedRewards.push(reward);
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 }, angle: 270, startVelocity: 30, gravity: 1.5 });
        }
    }
}

function renderRewards() {
    rewardsListEl.innerHTML = '';
    if (unlockedRewards.length === 0) {
        rewardsListEl.innerHTML = `<li class="no-rewards">No rewards unlocked yet. Keep going!</li>`;
    } else {
        unlockedRewards.forEach(reward => {
            const li = document.createElement('li');
            li.classList.add('reward-badge');
            li.innerHTML = `<span class="reward-icon">${reward.icon}</span> <span class="reward-title">${reward.title}</span>`;
            rewardsListEl.appendChild(li);
        });
    }
}

function resetAllProgress() {
    if (confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
        quests = [];
        xp = 0;
        streak = 0;
        lastCompletionDate = null;
        unlockedRewards = [];
        updateUI();
    }
}

function playNotificationSound() {
    if (settings.soundEnabled) {
        notificationSound.play().catch(e => console.error("Audio play failed:", e));
    }
}

function updatePomodoroDisplay(time) {
    const minutes = Math.floor(time / 60000);
    const seconds = Math.floor((time % 60000) / 1000);
    pomodoroDisplayEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startNextPomodoroCycle() {
    playNotificationSound();
    if (currentMode === 'focus') {
        currentMode = 'break';
        pomodoroModeEl.textContent = 'Break';
        pomodoroEndTime = Date.now() + (settings.breakDuration * 60 * 1000);
        addXp(25);
    } else {
        currentMode = 'focus';
        pomodoroModeEl.textContent = 'Focus';
        pomodoroEndTime = Date.now() + (settings.focusDuration * 60 * 1000);
    }
    pomodoroLoop();
}

function pomodoroLoop() {
    const remainingTime = pomodoroEndTime - Date.now();
    if (remainingTime <= 0) {
        startNextPomodoroCycle();
        return;
    }
    updatePomodoroDisplay(remainingTime);
    pomodoroAnimationId = requestAnimationFrame(pomodoroLoop);
}

function startPomodoro() {
    if (pomodoroState === 'focus' || pomodoroState === 'break') return;
    pomodoroState = currentMode;
    pomodoroEndTime = Date.now() + (pomodoroTimeLeft || (settings.focusDuration * 60 * 1000));
    pomodoroLoop();
}

function pausePomodoro() {
    if (pomodoroState !== 'focus' && pomodoroState !== 'break') return;
    pomodoroTimeLeft = pomodoroEndTime - Date.now();
    pomodoroState = 'paused';
    cancelAnimationFrame(pomodoroAnimationId);
}

function resetPomodoro() {
    pomodoroState = 'stopped';
    currentMode = 'focus';
    pomodoroModeEl.textContent = 'Focus';
    cancelAnimationFrame(pomodoroAnimationId);
    pomodoroTimeLeft = null;
    updatePomodoroDisplay(settings.focusDuration * 60 * 1000);
}

function updateCountdown() {
    const nsatExamDate = new Date('2025-10-12T10:00:00').getTime();
    const distance = nsatExamDate - Date.now();
    if (distance < 0) {
        clearInterval(countdownInterval);
        countdownTimerEl.innerHTML = "EXAM DAY!";
        return;
    }
    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);
    countdownTimerEl.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function openSettingsModal() {
    themeSelect.value = settings.theme;
    focusDurationInput.value = settings.focusDuration;
    breakDurationInput.value = settings.breakDuration;
    soundToggle.checked = settings.soundEnabled;
    settingsModalEl.style.display = 'flex';
}

function closeSettingsModal() {
    settingsModalEl.style.display = 'none';
}

function handleSettingsChange() {
    const newTheme = themeSelect.value;
    const newFocusDuration = parseInt(focusDurationInput.value);
    const newBreakDuration = parseInt(breakDurationInput.value);
    const newSoundEnabled = soundToggle.checked;
    if (newFocusDuration >= 5 && newBreakDuration >= 1) {
        settings.theme = newTheme;
        settings.focusDuration = newFocusDuration;
        settings.breakDuration = newBreakDuration;
        settings.soundEnabled = newSoundEnabled;
        applySettings();
        saveState();
    } else {
        alert("Please enter valid durations (Focus >= 5 min, Break >= 1 min).");
    }
}

function init() {
    assignDOMElements();
    loadState();
    applySettings();
    updateUI();
    updateCountdown();
    countdownInterval = setInterval(updateCountdown, 1000);
    updatePomodoroDisplay(settings.focusDuration * 60 * 1000);

    // --- EVENT LISTENERS ---
    addQuestBtn.addEventListener('click', () => openModal());
    questModalEl.addEventListener('click', (e) => { if (e.target === questModalEl) closeModal(); });
    cancelQuestBtn.addEventListener('click', closeModal);
    questForm.addEventListener('submit', handleFormSubmit);
    questListEl.addEventListener('click', handleQuestAction);
    filterCategoryEl.addEventListener('change', renderQuests);

    // Drag-n-Drop
    questListEl.addEventListener('dragstart', (e) => { if (e.target.matches('li')) { draggedQuestId = e.target.dataset.id; setTimeout(() => e.target.classList.add('dragging'), 0); } });
    questListEl.addEventListener('dragend', (e) => { if (e.target.matches('li')) { e.target.classList.remove('dragging'); } });
    questListEl.addEventListener('dragover', (e) => { e.preventDefault(); });
    questListEl.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetElement = getDragAfterElement(questListEl, e.clientY);
        const draggedIndex = quests.findIndex(q => q.id === draggedQuestId);
        const [draggedItem] = quests.splice(draggedIndex, 1);
        if (targetElement == null) {
            quests.push(draggedItem);
        } else {
            const targetId = targetElement.dataset.id;
            const targetIndex = quests.findIndex(q => q.id === targetId);
            quests.splice(targetIndex, 0, draggedItem);
        }
        updateUI();
    });

    // Settings
    openSettingsBtn.addEventListener('click', openSettingsModal);
    closeSettingsBtn.addEventListener('click', () => {
        handleSettingsChange();
        closeSettingsModal();
    });
    settingsModalEl.addEventListener('click', (e) => {
        if (e.target === settingsModalEl) {
            handleSettingsChange();
            closeSettingsModal();
        }
    });
    // settingsForm.addEventListener('change', handleSettingsChange); // Removed for save-on-close
    resetProgressFromSettingsBtn.addEventListener('click', () => {
        closeSettingsModal();
        resetAllProgress();
    });

    // Pomodoro
    startPomodoroBtn.addEventListener('click', startPomodoro);
    pausePomodoroBtn.addEventListener('click', pausePomodoro);
    resetPomodoroBtn.addEventListener('click', resetPomodoro);
}

document.addEventListener('DOMContentLoaded', init);
