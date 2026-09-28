/**
 * StudyFlow - Student Study Tracker
 * Pure Vanilla JavaScript (Zero external dependencies or frameworks)
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Default Sample Data (Seeded on first visit)
  // ---------------------------------------------------------------------------
  const DEFAULT_SUBJECTS = [
    { id: 'sub-1', name: 'Calculus & Algebra', color: '#4f46e5' },
    { id: 'sub-2', name: 'Computer Science', color: '#059669' },
    { id: 'sub-3', name: 'Physics & Mechanics', color: '#0284c7' },
    { id: 'sub-4', name: 'Literature & History', color: '#d97706' }
  ];

  const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const DEFAULT_TASKS = [
    {
      id: 'task-1',
      title: 'Review Chapter 5 notes on Integration techniques',
      subjectId: 'sub-1',
      dueDate: getTodayISO(),
      priority: 'high',
      completed: true,
      createdAt: Date.now() - 3600000
    },
    {
      id: 'task-2',
      title: 'Implement Binary Search Tree in Python',
      subjectId: 'sub-2',
      dueDate: getTodayISO(),
      priority: 'urgent',
      completed: false,
      createdAt: Date.now() - 1800000
    },
    {
      id: 'task-3',
      title: 'Solve thermodynamics practice set (Q 1-12)',
      subjectId: 'sub-3',
      dueDate: getTodayISO(),
      priority: 'normal',
      completed: false,
      createdAt: Date.now() - 900000
    },
    {
      id: 'task-4',
      title: 'Read assigned chapters in historical literature',
      subjectId: 'sub-4',
      dueDate: getTodayISO(),
      priority: 'normal',
      completed: false,
      createdAt: Date.now()
    }
  ];

  const COLOR_PALETTE = [
    '#4f46e5', // Indigo
    '#059669', // Emerald
    '#0284c7', // Sky Blue
    '#d97706', // Amber
    '#dc2626', // Crimson
    '#7c3aed', // Purple
    '#0d9488', // Teal
    '#e11d48'  // Rose
  ];

  // ---------------------------------------------------------------------------
  // State Management
  // ---------------------------------------------------------------------------
  const state = {
    subjects: [],
    tasks: [],
    filter: 'all',          // 'all' | 'today' | 'pending' | 'completed'
    selectedSubjectFilter: null, // subjectId or null
    searchQuery: '',
    timer: {
      mode: 'pomodoro',     // 'pomodoro' (25m), 'shortBreak' (5m), 'longBreak' (15m)
      duration: 25 * 60,
      remaining: 25 * 60,
      isRunning: false,
      timerInterval: null,
      sessionsCompletedToday: 1,
      totalFocusMinutesToday: 25,
      lastActiveDate: getTodayISO()
    },
    theme: 'light'
  };

  // ---------------------------------------------------------------------------
  // LocalStorage Keys
  // ---------------------------------------------------------------------------
  const STORAGE_KEYS = {
    SUBJECTS: 'studyflow_subjects_v1',
    TASKS: 'studyflow_tasks_v1',
    TIMER_STATS: 'studyflow_timer_stats_v1',
    THEME: 'studyflow_theme_v1'
  };

  function loadStateFromStorage() {
    try {
      const storedSubjects = localStorage.getItem(STORAGE_KEYS.SUBJECTS);
      const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
      const storedTimer = localStorage.getItem(STORAGE_KEYS.TIMER_STATS);
      const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);

      if (storedSubjects) {
        state.subjects = JSON.parse(storedSubjects);
      } else {
        state.subjects = DEFAULT_SUBJECTS;
        saveSubjectsToStorage();
      }

      if (storedTasks) {
        state.tasks = JSON.parse(storedTasks);
      } else {
        state.tasks = DEFAULT_TASKS;
        saveTasksToStorage();
      }

      if (storedTimer) {
        const parsedTimer = JSON.parse(storedTimer);
        // Reset daily stats if day changed
        if (parsedTimer.lastActiveDate === getTodayISO()) {
          state.timer.sessionsCompletedToday = parsedTimer.sessionsCompletedToday || 0;
          state.timer.totalFocusMinutesToday = parsedTimer.totalFocusMinutesToday || 0;
        } else {
          state.timer.sessionsCompletedToday = 0;
          state.timer.totalFocusMinutesToday = 0;
          state.timer.lastActiveDate = getTodayISO();
        }
      }

      if (storedTheme) {
        state.theme = storedTheme;
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        state.theme = 'dark';
      }
    } catch (e) {
      console.warn('LocalStorage error or unavailable, using in-memory state', e);
      state.subjects = DEFAULT_SUBJECTS;
      state.tasks = DEFAULT_TASKS;
    }
  }

  function saveSubjectsToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(state.subjects));
    } catch (e) {
      console.error('Failed to save subjects', e);
    }
  }

  function saveTasksToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
    } catch (e) {
      console.error('Failed to save tasks', e);
    }
  }

  function saveTimerStatsToStorage() {
    try {
      const data = {
        sessionsCompletedToday: state.timer.sessionsCompletedToday,
        totalFocusMinutesToday: state.timer.totalFocusMinutesToday,
        lastActiveDate: getTodayISO()
      };
      localStorage.setItem(STORAGE_KEYS.TIMER_STATS, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save timer stats', e);
    }
  }

  function saveThemeToStorage(theme) {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // Audio Synthesizer (Zero audio files, pure Web Audio API)
  // ---------------------------------------------------------------------------
  function playCompletionChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      // Soft ascending 3-note chime
      playTone(523.25, now, 0.4);       // C5
      playTone(659.25, now + 0.15, 0.5); // E5
      playTone(783.99, now + 0.3, 0.8);  // G5
    } catch (e) {
      // Audio playback allowed to fail gracefully
    }
  }

  function playTickSound() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // Toast Notifications
  // ---------------------------------------------------------------------------
  function showToast(message) {
    const container = document.getElementById('toastNotification');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  // ---------------------------------------------------------------------------
  // Date Display & Formatting
  // ---------------------------------------------------------------------------
  function updateHeaderDate() {
    const el = document.getElementById('currentDateDisplay');
    if (!el) return;
    const now = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    el.textContent = now.toLocaleDateString(undefined, options);
  }

  function formatRelativeDate(isoDate) {
    if (!isoDate) return '';
    const today = getTodayISO();
    if (isoDate === today) return 'Today';

    const [y, m, d] = isoDate.split('-').map(Number);
    const target = new Date(y, m - 1, d);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target - todayDate) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';

    return target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // ---------------------------------------------------------------------------
  // Theme Management
  // ---------------------------------------------------------------------------
  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const sunIcon = document.getElementById('themeIconSun');
    const moonIcon = document.getElementById('themeIconMoon');

    if (sunIcon && moonIcon) {
      if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
      } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
      }
    }
    saveThemeToStorage(theme);
  }

  function initTheme() {
    applyTheme(state.theme);
    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Subjects Management
  // ---------------------------------------------------------------------------
  let selectedSubjectColor = COLOR_PALETTE[0];

  function getSubjectById(id) {
    return state.subjects.find((s) => s.id === id) || { name: 'General', color: '#64748b' };
  }

  function renderSubjectDropdowns() {
    const taskSelect = document.getElementById('taskSubjectSelect');
    const timerSelect = document.getElementById('timerSubjectSelect');

    const renderOptions = (selectEl, includeAll = false) => {
      if (!selectEl) return;
      selectEl.innerHTML = '';
      if (includeAll) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'All Subjects';
        selectEl.appendChild(opt);
      }
      state.subjects.forEach((sub) => {
        const opt = document.createElement('option');
        opt.value = sub.id;
        opt.textContent = sub.name;
        selectEl.appendChild(opt);
      });
    };

    renderOptions(taskSelect);
    renderOptions(timerSelect);
  }

  function renderSubjectProgress() {
    const listContainer = document.getElementById('subjectProgressList');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (state.subjects.length === 0) {
      listContainer.innerHTML = '<div class="empty-sub">No subjects yet. Click "Manage" to add your subjects.</div>';
      return;
    }

    state.subjects.forEach((sub) => {
      const subTasks = state.tasks.filter((t) => t.subjectId === sub.id);
      const completedSubTasks = subTasks.filter((t) => t.completed).length;
      const totalSubTasks = subTasks.length;
      const percentage = totalSubTasks > 0 ? Math.round((completedSubTasks / totalSubTasks) * 100) : 0;

      const item = document.createElement('div');
      item.className = 'subject-item';
      if (state.selectedSubjectFilter === sub.id) {
        item.classList.add('active-filter');
      }

      item.innerHTML = `
        <div class="subject-row-header">
          <div class="subject-name-group">
            <span class="subject-color-dot" style="background-color: ${sub.color};"></span>
            <span class="subject-title">${escapeHTML(sub.name)}</span>
          </div>
          <span class="subject-stats-text">${completedSubTasks}/${totalSubTasks} (${percentage}%)</span>
        </div>
        <div class="subject-progress-bar-wrap">
          <div class="subject-progress-bar" style="width: ${percentage}%; background-color: ${sub.color};"></div>
        </div>
      `;

      item.addEventListener('click', () => {
        if (state.selectedSubjectFilter === sub.id) {
          state.selectedSubjectFilter = null;
        } else {
          state.selectedSubjectFilter = sub.id;
        }
        updateSubjectFilterBanner();
        renderSubjectProgress();
        renderTasks();
      });

      listContainer.appendChild(item);
    });
  }

  function updateSubjectFilterBanner() {
    const banner = document.getElementById('subjectFilterBanner');
    const nameEl = document.getElementById('filterSubjectName');
    if (!banner || !nameEl) return;

    if (state.selectedSubjectFilter) {
      const sub = getSubjectById(state.selectedSubjectFilter);
      nameEl.textContent = sub.name;
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  }

  function initSubjectModal() {
    const modal = document.getElementById('subjectModal');
    const openBtn = document.getElementById('openAddSubjectBtn');
    const closeBtn = document.getElementById('closeSubjectModalBtn');
    const createForm = document.getElementById('createSubjectForm');
    const nameInput = document.getElementById('newSubjectNameInput');
    const paletteContainer = document.getElementById('colorPaletteContainer');
    const countEl = document.getElementById('modalSubjectCount');
    const listEl = document.getElementById('modalSubjectList');

    if (!modal) return;

    // Build palette
    paletteContainer.innerHTML = '';
    COLOR_PALETTE.forEach((color, idx) => {
      const opt = document.createElement('div');
      opt.className = 'color-option' + (idx === 0 ? ' selected' : '');
      opt.style.backgroundColor = color;
      opt.setAttribute('role', 'button');
      opt.setAttribute('tabindex', '0');
      opt.addEventListener('click', () => {
        document.querySelectorAll('.color-option').forEach((el) => el.classList.remove('selected'));
        opt.classList.add('selected');
        selectedSubjectColor = color;
      });
      paletteContainer.appendChild(opt);
    });

    const openModal = () => {
      renderModalSubjects();
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      nameInput.value = '';
      nameInput.focus();
    };

    const closeModal = () => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    };

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    function renderModalSubjects() {
      countEl.textContent = state.subjects.length;
      listEl.innerHTML = '';

      state.subjects.forEach((sub) => {
        const item = document.createElement('div');
        item.className = 'modal-subject-item';
        item.innerHTML = `
          <div class="modal-subject-item-left">
            <span class="subject-color-dot" style="background-color: ${sub.color};"></span>
            <strong>${escapeHTML(sub.name)}</strong>
          </div>
          <button class="btn-ghost-danger btn-delete-sub" data-id="${sub.id}" title="Delete subject">
            Delete
          </button>
        `;

        item.querySelector('.btn-delete-sub').addEventListener('click', () => {
          deleteSubject(sub.id);
          renderModalSubjects();
        });

        listEl.appendChild(item);
      });
    }

    createForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      if (!name) return;

      const newSubject = {
        id: 'sub-' + Date.now(),
        name: name,
        color: selectedSubjectColor
      };

      state.subjects.push(newSubject);
      saveSubjectsToStorage();
      renderSubjectDropdowns();
      renderSubjectProgress();
      updateDashboardMetrics();
      renderModalSubjects();
      nameInput.value = '';
      showToast(`Subject "${name}" added!`);
    });
  }

  function deleteSubject(subId) {
    if (state.subjects.length <= 1) {
      showToast('You must keep at least one subject.');
      return;
    }

    state.subjects = state.subjects.filter((s) => s.id !== subId);
    // Reassign affected tasks to first remaining subject
    const fallbackId = state.subjects[0].id;
    state.tasks.forEach((t) => {
      if (t.subjectId === subId) {
        t.subjectId = fallbackId;
      }
    });

    if (state.selectedSubjectFilter === subId) {
      state.selectedSubjectFilter = null;
      updateSubjectFilterBanner();
    }

    saveSubjectsToStorage();
    saveTasksToStorage();
    renderSubjectDropdowns();
    renderSubjectProgress();
    renderTasks();
    updateDashboardMetrics();
    showToast('Subject removed.');
  }

  // ---------------------------------------------------------------------------
  // Tasks Management
  // ---------------------------------------------------------------------------
  function initTaskListeners() {
    const form = document.getElementById('addTaskForm');
    const titleInput = document.getElementById('taskTitleInput');
    const subjectSelect = document.getElementById('taskSubjectSelect');
    const dueDateInput = document.getElementById('taskDueDateInput');
    const prioritySelect = document.getElementById('taskPrioritySelect');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const clearSubjectFilterBtn = document.getElementById('clearSubjectFilterBtn');
    const searchInput = document.getElementById('taskSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    // Default due date to today
    dueDateInput.value = getTodayISO();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = titleInput.value.trim();
      if (!title) return;

      const newTask = {
        id: 'task-' + Date.now(),
        title: title,
        subjectId: subjectSelect.value || state.subjects[0]?.id || 'sub-1',
        dueDate: dueDateInput.value || getTodayISO(),
        priority: prioritySelect.value || 'normal',
        completed: false,
        createdAt: Date.now()
      };

      state.tasks.unshift(newTask);
      saveTasksToStorage();
      titleInput.value = '';
      titleInput.focus();

      renderTasks();
      renderSubjectProgress();
      updateDashboardMetrics();
      showToast('Study task added!');
    });

    // Clear completed tasks
    clearCompletedBtn.addEventListener('click', () => {
      const completedCount = state.tasks.filter((t) => t.completed).length;
      if (completedCount === 0) {
        showToast('No completed tasks to clear.');
        return;
      }
      state.tasks = state.tasks.filter((t) => !t.completed);
      saveTasksToStorage();
      renderTasks();
      renderSubjectProgress();
      updateDashboardMetrics();
      showToast(`Cleared ${completedCount} completed task${completedCount > 1 ? 's' : ''}.`);
    });

    // Clear subject filter banner
    if (clearSubjectFilterBtn) {
      clearSubjectFilterBtn.addEventListener('click', () => {
        state.selectedSubjectFilter = null;
        updateSubjectFilterBanner();
        renderSubjectProgress();
        renderTasks();
      });
    }

    // Filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        filterTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        state.filter = tab.dataset.filter;
        renderTasks();
      });
    });

    // Search tasks
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
        renderTasks();
      });

      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        state.searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderTasks();
        searchInput.focus();
      });
    }
  }

  function toggleTaskCompletion(taskId) {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    saveTasksToStorage();
    renderTasks();
    renderSubjectProgress();
    updateDashboardMetrics();

    if (task.completed) {
      playTickSound();
      showToast('Task completed! Great focus! ✨');
    }
  }

  function deleteTask(taskId) {
    state.tasks = state.tasks.filter((t) => t.id !== taskId);
    saveTasksToStorage();
    renderTasks();
    renderSubjectProgress();
    updateDashboardMetrics();
    showToast('Task deleted.');
  }

  function renderTasks() {
    const container = document.getElementById('tasksListContainer');
    const emptyState = document.getElementById('emptyTasksState');
    const countSummary = document.getElementById('tasksSummaryCount');
    if (!container) return;

    const todayISO = getTodayISO();

    // Filter logic
    let filtered = state.tasks.filter((task) => {
      // Subject filter
      if (state.selectedSubjectFilter && task.subjectId !== state.selectedSubjectFilter) {
        return false;
      }
      // Status / Date filter
      if (state.filter === 'today' && task.dueDate !== todayISO) {
        return false;
      }
      if (state.filter === 'pending' && task.completed) {
        return false;
      }
      if (state.filter === 'completed' && !task.completed) {
        return false;
      }
      // Search query
      if (state.searchQuery) {
        const matchesTitle = task.title.toLowerCase().includes(state.searchQuery);
        const subject = getSubjectById(task.subjectId);
        const matchesSubject = subject.name.toLowerCase().includes(state.searchQuery);
        if (!matchesTitle && !matchesSubject) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'flex';
    } else {
      emptyState.style.display = 'none';
      container.innerHTML = '';

      filtered.forEach((task) => {
        const subject = getSubjectById(task.subjectId);
        const item = document.createElement('div');
        item.className = 'task-item' + (task.completed ? ' completed' : '');
        item.dataset.id = task.id;

        const dateLabel = formatRelativeDate(task.dueDate);

        item.innerHTML = `
          <div class="task-left">
            <input 
              type="checkbox" 
              class="custom-checkbox task-check" 
              ${task.completed ? 'checked' : ''} 
              aria-label="Mark task complete"
            >
            <div class="task-body">
              <span class="task-text">${escapeHTML(task.title)}</span>
              <div class="task-meta-row">
                <span class="task-subject-tag" style="color: ${subject.color};">
                  <span class="subject-color-dot" style="background-color: ${subject.color}; width: 6px; height: 6px;"></span>
                  ${escapeHTML(subject.name)}
                </span>
                ${dateLabel ? `<span class="meta-dot-sep">·</span><span>${dateLabel}</span>` : ''}
                <span class="meta-dot-sep">·</span>
                <span class="priority-tag priority-${task.priority}">${task.priority}</span>
              </div>
            </div>
          </div>
          <div class="task-actions">
            <button class="btn-task-delete" title="Delete task" aria-label="Delete task">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        `;

        item.querySelector('.task-check').addEventListener('change', () => {
          toggleTaskCompletion(task.id);
        });

        item.querySelector('.btn-task-delete').addEventListener('click', (e) => {
          e.stopPropagation();
          deleteTask(task.id);
        });

        container.appendChild(item);
      });
    }

    // Update count summary
    const completedCount = state.tasks.filter((t) => t.completed).length;
    const totalCount = state.tasks.length;
    countSummary.textContent = `${completedCount} of ${totalCount} completed`;
  }

  // ---------------------------------------------------------------------------
  // Dashboard Metrics & Progress Calculation
  // ---------------------------------------------------------------------------
  function updateDashboardMetrics() {
    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter((t) => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Radial Progress
    const radialPercentage = document.getElementById('overallPercentage');
    const radialCircle = document.getElementById('radialProgressCircle');
    const taskRatioText = document.getElementById('taskRatioText');

    if (radialPercentage) radialPercentage.textContent = `${percentage}%`;
    if (taskRatioText) taskRatioText.textContent = `${completedTasks} of ${totalTasks} tasks`;

    if (radialCircle) {
      // Circumference = 2 * PI * 42 = 263.89
      const circumference = 263.89;
      const offset = circumference - (percentage / 100) * circumference;
      radialCircle.style.strokeDashoffset = offset;
    }

    // Stat counters
    const pendingEl = document.getElementById('pendingTasksCount');
    const focusTimeEl = document.getElementById('focusTimeCount');
    const subjectsCountEl = document.getElementById('activeSubjectsCount');

    if (pendingEl) pendingEl.textContent = pendingTasks;
    if (focusTimeEl) focusTimeEl.textContent = `${state.timer.totalFocusMinutesToday} min`;
    if (subjectsCountEl) subjectsCountEl.textContent = state.subjects.length;

    // Card Footer Progress Bar
    const footerBar = document.getElementById('footerProgressBar');
    const footerCompletedRatio = document.getElementById('footerCompletedRatio');
    const footerPercentText = document.getElementById('footerPercentText');

    if (footerBar) footerBar.style.width = `${percentage}%`;
    if (footerCompletedRatio) footerCompletedRatio.textContent = `${completedTasks} of ${totalTasks} completed`;
    if (footerPercentText) footerPercentText.textContent = `${percentage}% Complete`;

    // Dynamic Motivational Message
    const msgEl = document.getElementById('motivationalMessage');
    if (msgEl) {
      if (totalTasks === 0) {
        msgEl.textContent = 'Add your daily subjects and tasks to start conquering your syllabus.';
      } else if (percentage === 0) {
        msgEl.textContent = 'Ready to start your study session today? Take that first step!';
      } else if (percentage < 50) {
        msgEl.textContent = 'Great momentum! Keep chipping away at your checklist.';
      } else if (percentage < 100) {
        msgEl.textContent = 'More than halfway there! Maintain your study momentum.';
      } else {
        msgEl.textContent = 'Outstanding work! All daily goals completed. Time for a well-deserved break! 🎉';
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 25-Minute Study Timer (Pomodoro)
  // ---------------------------------------------------------------------------
  const TIMER_DURATIONS = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  };

  function initTimer() {
    const toggleBtn = document.getElementById('timerToggleBtn');
    const toggleText = document.getElementById('timerToggleText');
    const playIcon = document.getElementById('timerPlayIcon');
    const pauseIcon = document.getElementById('timerPauseIcon');
    const resetBtn = document.getElementById('timerResetBtn');
    const minusBtn = document.getElementById('timerAdjustMinus');
    const plusBtn = document.getElementById('timerAdjustPlus');
    const modeButtons = document.querySelectorAll('.timer-mode-btn');

    // Mode Selector
    modeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (state.timer.isRunning) {
          pauseTimer();
        }
        modeButtons.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const mode = btn.dataset.mode;
        state.timer.mode = mode;
        state.timer.duration = TIMER_DURATIONS[mode];
        state.timer.remaining = TIMER_DURATIONS[mode];
        updateTimerDisplay();
        updateTimerStatusLabel();
      });
    });

    // Start / Pause
    toggleBtn.addEventListener('click', () => {
      if (state.timer.isRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    });

    // Reset
    resetBtn.addEventListener('click', () => {
      pauseTimer();
      state.timer.remaining = state.timer.duration;
      updateTimerDisplay();
      updateTimerStatusLabel();
    });

    // Adjust +/- 5 min
    minusBtn.addEventListener('click', () => {
      if (state.timer.remaining > 300) {
        state.timer.remaining -= 300;
        state.timer.duration = Math.max(state.timer.duration - 300, 300);
        updateTimerDisplay();
      }
    });

    plusBtn.addEventListener('click', () => {
      state.timer.remaining += 300;
      state.timer.duration += 300;
      updateTimerDisplay();
    });

    updateTimerDisplay();
    renderPomodoroDots();
  }

  function startTimer() {
    state.timer.isRunning = true;
    updateTimerControlsUI(true);
    updateTimerStatusLabel();

    state.timer.timerInterval = setInterval(() => {
      if (state.timer.remaining > 0) {
        state.timer.remaining -= 1;
        updateTimerDisplay();
      } else {
        timerFinished();
      }
    }, 1000);
  }

  function pauseTimer() {
    state.timer.isRunning = false;
    clearInterval(state.timer.timerInterval);
    state.timer.timerInterval = null;
    updateTimerControlsUI(false);
    updateTimerStatusLabel();
    document.title = 'StudyFlow - Student Study Tracker';
  }

  function timerFinished() {
    pauseTimer();
    playCompletionChime();

    if (state.timer.mode === 'pomodoro') {
      const minutesFocused = Math.round(state.timer.duration / 60);
      state.timer.sessionsCompletedToday += 1;
      state.timer.totalFocusMinutesToday += minutesFocused;
      saveTimerStatsToStorage();
      updateDashboardMetrics();
      renderPomodoroDots();

      const selectEl = document.getElementById('timerSubjectSelect');
      const subjectName = selectEl ? selectEl.options[selectEl.selectedIndex]?.text : 'Study';

      showToast(`25-min ${subjectName} session finished! Time for a 5-min break.`);

      // Prompt to switch to short break
      const shortBreakBtn = document.getElementById('modeShortBreak');
      if (shortBreakBtn) shortBreakBtn.click();
    } else {
      showToast('Break finished! Ready to begin the next study session.');
      const pomodoroBtn = document.getElementById('modePomodoro');
      if (pomodoroBtn) pomodoroBtn.click();
    }
  }

  function updateTimerControlsUI(isRunning) {
    const toggleText = document.getElementById('timerToggleText');
    const playIcon = document.getElementById('timerPlayIcon');
    const pauseIcon = document.getElementById('timerPauseIcon');

    if (isRunning) {
      if (toggleText) toggleText.textContent = 'Pause';
      if (playIcon) playIcon.style.display = 'none';
      if (pauseIcon) pauseIcon.style.display = 'block';
    } else {
      if (toggleText) toggleText.textContent = 'Start Session';
      if (playIcon) playIcon.style.display = 'block';
      if (pauseIcon) pauseIcon.style.display = 'none';
    }
  }

  function updateTimerDisplay() {
    const digitsEl = document.getElementById('timerDigits');
    const progressCircle = document.getElementById('timerProgressCircle');

    const minutes = Math.floor(state.timer.remaining / 60);
    const seconds = state.timer.remaining % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (digitsEl) digitsEl.textContent = formatted;

    // Document Title
    if (state.timer.isRunning) {
      document.title = `(${formatted}) StudyFlow Timer`;
    }

    // Circular SVG Progress Ring
    if (progressCircle) {
      // Circumference = 2 * PI * 95 = 596.90
      const circumference = 596.9;
      const progressFraction = state.timer.remaining / state.timer.duration;
      const offset = circumference * (1 - progressFraction);
      progressCircle.style.strokeDashoffset = offset;
    }
  }

  function updateTimerStatusLabel() {
    const labelEl = document.getElementById('timerStatusLabel');
    if (!labelEl) return;

    if (state.timer.isRunning) {
      labelEl.textContent = state.timer.mode === 'pomodoro' ? 'Focusing...' : 'Resting...';
      labelEl.style.color = 'var(--accent-emerald)';
    } else {
      labelEl.textContent = state.timer.remaining === state.timer.duration ? 'Ready to Focus' : 'Paused';
      labelEl.style.color = 'var(--text-muted)';
    }
  }

  function renderPomodoroDots() {
    const container = document.getElementById('pomodoroDotsContainer');
    const sessionTag = document.getElementById('sessionTag');
    if (!container) return;

    container.innerHTML = '';
    const totalSlots = Math.max(4, state.timer.sessionsCompletedToday + 1);

    for (let i = 0; i < totalSlots; i++) {
      const dot = document.createElement('div');
      dot.className = 'pomo-dot' + (i < state.timer.sessionsCompletedToday ? ' filled' : '');
      dot.title = `Session ${i + 1}`;
      container.appendChild(dot);
    }

    if (sessionTag) {
      sessionTag.textContent = `Session #${state.timer.sessionsCompletedToday + 1}`;
    }
  }

  // ---------------------------------------------------------------------------
  // Backup & Data Modal
  // ---------------------------------------------------------------------------
  function initDataModal() {
    const modal = document.getElementById('dataModal');
    const openBtn = document.getElementById('dataOptionsBtn');
    const closeBtn = document.getElementById('closeDataModalBtn');
    const exportBtn = document.getElementById('exportJsonBtn');
    const importInput = document.getElementById('importJsonFileInput');
    const resetSampleBtn = document.getElementById('resetSampleDataBtn');
    const clearAllBtn = document.getElementById('clearAllDataBtn');

    if (!modal) return;

    const openModal = () => modal.classList.add('open');
    const closeModal = () => modal.classList.remove('open');

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Export JSON
    exportBtn.addEventListener('click', () => {
      const backupData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        subjects: state.subjects,
        tasks: state.tasks,
        timerStats: {
          sessionsCompletedToday: state.timer.sessionsCompletedToday,
          totalFocusMinutesToday: state.timer.totalFocusMinutesToday
        }
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `studyflow-backup-${getTodayISO()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Study backup exported successfully!');
    });

    // Import JSON
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported.subjects) && Array.isArray(imported.tasks)) {
            state.subjects = imported.subjects;
            state.tasks = imported.tasks;
            saveSubjectsToStorage();
            saveTasksToStorage();
            renderSubjectDropdowns();
            renderSubjectProgress();
            renderTasks();
            updateDashboardMetrics();
            closeModal();
            showToast('Backup restored successfully!');
          } else {
            showToast('Invalid backup file format.');
          }
        } catch (err) {
          showToast('Could not read JSON backup file.');
        }
      };
      reader.readAsText(file);
    });

    // Reset to Sample
    resetSampleBtn.addEventListener('click', () => {
      state.subjects = JSON.parse(JSON.stringify(DEFAULT_SUBJECTS));
      state.tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS));
      saveSubjectsToStorage();
      saveTasksToStorage();
      renderSubjectDropdowns();
      renderSubjectProgress();
      renderTasks();
      updateDashboardMetrics();
      closeModal();
      showToast('Loaded sample subjects and tasks.');
    });

    // Clear All
    clearAllBtn.addEventListener('click', () => {
      state.tasks = [];
      state.timer.sessionsCompletedToday = 0;
      state.timer.totalFocusMinutesToday = 0;
      saveTasksToStorage();
      saveTimerStatsToStorage();
      renderTasks();
      renderSubjectProgress();
      renderPomodoroDots();
      updateDashboardMetrics();
      closeModal();
      showToast('All tasks & study records reset.');
    });
  }

  // ---------------------------------------------------------------------------
  // Security & Utility
  // ---------------------------------------------------------------------------
  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---------------------------------------------------------------------------
  // Application Bootstrap
  // ---------------------------------------------------------------------------
  function init() {
    loadStateFromStorage();
    initTheme();
    updateHeaderDate();

    renderSubjectDropdowns();
    initSubjectModal();

    initTaskListeners();
    renderTasks();
    renderSubjectProgress();

    initTimer();
    updateDashboardMetrics();
    initDataModal();
  }

  // Start app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
