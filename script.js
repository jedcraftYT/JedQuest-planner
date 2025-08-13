document.addEventListener('DOMContentLoaded', () => {
    // --- COUNTDOWN TIMER ---
    const countdownTimer = document.getElementById('countdown-timer');
    const nsatExamDate = new Date('2025-10-12T10:00:00').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = nsatExamDate - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        countdownTimer.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        if (distance < 0) {
            clearInterval(interval);
            countdownTimer.innerHTML = "EXAM DAY!";
        }
    }

    const interval = setInterval(updateCountdown, 1000);

    // --- QUESTS ---
    let nsatQuests = [];
    const subjects = ["Physics", "Chemistry", "Maths"];
    subjects.forEach(subject => {
        for (let i = 1; i <= 12; i++) {
            nsatQuests.push({ name: `${subject} Chapter ${i}`, xp: 50, completed: false });
        }
    });

    let jedbotQuests = [
        { name: "Setup project structure", xp: 30, completed: false },
        { name: "Implement basic UI", xp: 40, completed: false },
        { name: "Design quest system logic", xp: 60, completed: false },
        { name: "Implement Pomodoro Timer", xp: 50, completed: false },
        { name: "Implement XP & Streak System", xp: 70, completed: false },
        { name: "Add LocalStorage Persistence", xp: 80, completed: false },
        { name: "Style the application", xp: 50, completed: false },
        { name: "Finalize UI/UX", xp: 40, completed: false },
    ];

    const nsatQuestList = document.getElementById('nsat-quest-list');
    const jedbotQuestList = document.getElementById('jedbot-quest-list');

    function renderQuests() {
        nsatQuestList.innerHTML = '';
        jedbotQuestList.innerHTML = '';

        nsatQuests.forEach((quest, index) => {
            const questButton = quest.completed
                ? `<button disabled>Completed</button>`
                : `<button class="complete-quest" data-type="nsat" data-index="${index}">Complete</button>`;

            nsatQuestList.innerHTML += `
                <li class="${quest.completed ? 'completed' : ''}">
                    <span>${quest.name}</span>
                    <div class="quest-actions">
                        ${questButton}
                    </div>
                </li>
            `;
        });

        jedbotQuests.forEach((quest, index) => {
            const questButton = quest.completed
                ? `<button disabled>Completed</button>`
                : `<button class="complete-quest" data-type="jedbot" data-index="${index}">Complete</button>`;

            jedbotQuestList.innerHTML += `
                <li class="${quest.completed ? 'completed' : ''}">
                    <span>${quest.name}</span>
                    <div class="quest-actions">
                        ${questButton}
                    </div>
                </li>
            `;
        });
    }

    let xp = 0;
    let streak = 0;
    let lastCompletionDate = null;

    const xpPointsSpan = document.getElementById('xp-points');
    const xpBar = document.getElementById('xp-bar');
    const streakDaysSpan = document.getElementById('streak-days');
    const rewardsList = document.getElementById('rewards-list');

    const rewards = {
        100: "Snack break!",
        250: "15-min free time",
        500: "Customize JedBot theme"
    };

    function saveState() {
        const state = {
            xp,
            streak,
            lastCompletionDate,
            nsatQuests,
            jedbotQuests,
            unlockedRewards: Array.from(rewardsList.children).map(li => li.id)
        };
        localStorage.setItem('studyPlannerState', JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem('studyPlannerState');
        if (!savedState) return;

        const state = JSON.parse(savedState);
        xp = state.xp || 0;
        streak = state.streak || 0;
        lastCompletionDate = state.lastCompletionDate;
        if (state.nsatQuests) nsatQuests = state.nsatQuests;
        if (state.jedbotQuests) jedbotQuests = state.jedbotQuests;

        if (state.unlockedRewards) {
            state.unlockedRewards.forEach(rewardId => {
                const threshold = rewardId.split('-')[1];
                if (rewards[threshold] && !document.getElementById(rewardId)) {
                    const rewardItem = document.createElement('li');
                    rewardItem.id = rewardId;
                    rewardItem.textContent = rewards[threshold];
                    rewardsList.appendChild(rewardItem);
                }
            });
        }
    }

    function addXp(amount) {
        xp += amount;
        updateUi();
        checkForRewards();
        saveState();
    }

    function updateUi() {
        xpPointsSpan.textContent = xp;
        streakDaysSpan.textContent = streak;
        const xpForNextLevel = 100;
        const percentage = (xp % xpForNextLevel) / xpForNextLevel * 100;
        xpBar.style.width = `${percentage}%`;
    }

    function checkForRewards() {
        for (const threshold in rewards) {
            if (xp >= threshold && !document.querySelector(`#reward-${threshold}`)) {
                const rewardItem = document.createElement('li');
                rewardItem.id = `reward-${threshold}`;
                rewardItem.textContent = rewards[threshold];
                rewardsList.appendChild(rewardItem);
                saveState();
            }
        }
    }

    function updateStreak() {
        const today = new Date().toDateString();
        if (lastCompletionDate) {
            const lastDate = new Date(lastCompletionDate).toDateString();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastDate === today) {
                // Same day, do nothing to streak.
            } else if (lastDate === yesterday.toDateString()) {
                // Consecutive day.
                streak++;
                addXp(streak * 10); // Streak bonus!
            } else {
                // Not consecutive, reset streak.
                streak = 1;
            }
        } else {
            // First ever completion.
            streak = 1;
        }
        lastCompletionDate = new Date().toISOString();
    }

    function completeQuest(type, index) {
        const questList = type === 'nsat' ? nsatQuests : jedbotQuests;
        const quest = questList[index];

        if (!quest.completed) {
            quest.completed = true;
            updateStreak();
            addXp(quest.xp);
            renderQuests();
        }
    }

    document.querySelector('#quest-board').addEventListener('click', (e) => {
        if (e.target.classList.contains('complete-quest')) {
            const type = e.target.dataset.type;
            const index = parseInt(e.target.dataset.index, 10);
            completeQuest(type, index);
        }
    });

    // --- POMODORO TIMER ---
    const pomodoroDisplay = document.getElementById('pomodoro-display');
    const startBtn = document.getElementById('start-pomodoro');
    const pauseBtn = document.getElementById('pause-pomodoro');
    const resetBtn = document.getElementById('reset-pomodoro');

    let timerInterval;
    let timeLeft = 25 * 60;
    let isPaused = true;

    function updatePomodoroDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        pomodoroDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function startTimer() {
        if (isPaused) {
            isPaused = false;
            timerInterval = setInterval(() => {
                timeLeft--;
                updatePomodoroDisplay();
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    alert("Pomodoro session complete! Take a short break.");
                    addXp(25); // Reward for completing a pomodoro
                    resetTimer();
                }
            }, 1000);
        }
    }

    function pauseTimer() {
        isPaused = true;
        clearInterval(timerInterval);
    }

    function resetTimer() {
        isPaused = true;
        clearInterval(timerInterval);
        timeLeft = 25 * 60;
        updatePomodoroDisplay();
    }

    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);

    // --- INITIALIZE ---
    function initialize() {
        loadState();
        updateCountdown();
        renderQuests();
        updatePomodoroDisplay();
        updateUi();
    }

    initialize();
});
