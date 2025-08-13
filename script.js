document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const countdownTimerEl = document.getElementById('countdown-timer');
    const levelEl = document.getElementById('level');
    const xpPointsEl = document.getElementById('xp-points');
    const xpToNextLevelEl = document.getElementById('xp-to-next-level');
    const xpBarEl = document.getElementById('xp-bar');
    const streakDaysEl = document.getElementById('streak-days');
    const questListEl = document.getElementById('quest-list');

    // Modal Elements
    const questModalEl = document.getElementById('quest-modal');
    const questForm = document.getElementById('quest-form');
    const modalTitleEl = document.getElementById('modal-title');
    const questIdInput = document.getElementById('quest-id');
    const questNameInput = document.getElementById('quest-name');
    const questCategoryInput = document.getElementById('quest-category');
    const questPriorityInput = document.getElementById('quest-priority');
    const questXpInput = document.getElementById('quest-xp');
    const questNotesInput = document.getElementById('quest-notes');

    // Buttons
    const addQuestBtn = document.getElementById('add-quest-btn');
    const cancelQuestBtn = document.getElementById('cancel-quest-btn');
    const resetProgressBtn = document.getElementById('reset-progress');

    // Filters
    const filterCategoryEl = document.getElementById('filter-category');

    // --- STATE ---
    let quests = [];
    let xp = 0;
    let streak = 0;
    let lastCompletionDate = null;
    const XP_PER_LEVEL = 100;

    // --- STATE & UI MANAGEMENT ---

    function loadState() {
        const state = JSON.parse(localStorage.getItem('jedQuestState'));
        if (state) {
            quests = state.quests || [];
            xp = state.xp || 0;
            streak = state.streak || 0;
            lastCompletionDate = state.lastCompletionDate;
        }
    }

    function saveState() {
        const state = { quests, xp, streak, lastCompletionDate };
        localStorage.setItem('jedQuestState', JSON.stringify(state));
    }

    function updateUI() {
        // Update progress tracker
        const currentLevel = Math.floor(xp / XP_PER_LEVEL) + 1;
        const xpInCurrentLevel = xp % XP_PER_LEVEL;
        levelEl.textContent = currentLevel;
        xpPointsEl.textContent = xpInCurrentLevel;
        xpToNextLevelEl.textContent = XP_PER_LEVEL;
        xpBarEl.style.width = `${(xpInCurrentLevel / XP_PER_LEVEL) * 100}%`;
        streakDaysEl.textContent = streak;

        renderQuests();
        saveState();
    }

    function renderQuests() {
        const filterValue = filterCategoryEl.value;
        questListEl.innerHTML = '';

        const filteredQuests = quests.filter(quest => filterValue === 'all' || quest.category === filterValue);

        if (filteredQuests.length === 0) {
            if (quests.length === 0) {
                questListEl.innerHTML = `<p style="text-align:center;">No quests yet. Add one to get started!</p>`;
            } else {
                questListEl.innerHTML = `<p style="text-align:center;">No quests match this filter.</p>`;
            }
            return;
        }

        filteredQuests.forEach(quest => {
            const questEl = document.createElement('li');
            questEl.dataset.id = quest.id;
            questEl.dataset.priority = quest.priority;
            if (quest.completed) {
                questEl.classList.add('completed');
            }

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
                </div>
            `;
            questListEl.appendChild(questEl);
        });
    }

    // --- MODAL MANAGEMENT ---

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

    // --- CRUD & GAMIFICATION ---

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

        if (id) { // Update existing quest
            const quest = quests.find(q => q.id === id);
            Object.assign(quest, questData);
        } else { // Create new quest
            const newQuest = {
                id: Date.now().toString(),
                ...questData,
                completed: false,
            };
            quests.push(newQuest);
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
                addXp(-quest.xp); // Subtract XP if undone
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

    function addXp(amount) {
        xp += amount;
        if (xp < 0) xp = 0;
    }

    function resetAllProgress() {
        if (confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
            quests = [];
            xp = 0;
            streak = 0;
            lastCompletionDate = null;
            updateUI();
        }
    }

    // --- COUNTDOWN TIMER ---
    const nsatExamDate = new Date('2025-10-12T10:00:00').getTime();
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = nsatExamDate - now;
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
    const countdownInterval = setInterval(updateCountdown, 1000);

    // --- EVENT LISTENERS ---
    addQuestBtn.addEventListener('click', () => openModal());
    questModalEl.addEventListener('click', (e) => {
        if (e.target === questModalEl) closeModal();
    });
    cancelQuestBtn.addEventListener('click', closeModal);
    questForm.addEventListener('submit', handleFormSubmit);
    questListEl.addEventListener('click', handleQuestAction);
    resetProgressBtn.addEventListener('click', resetAllProgress);
    filterCategoryEl.addEventListener('change', renderQuests);

    // --- INITIALIZATION ---
    function init() {
        loadState();
        updateUI();
        updateCountdown();
    }

    init();
});
