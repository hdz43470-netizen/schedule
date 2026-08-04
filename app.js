'use strict';

(function () {
  const DEFAULT_START = '2026-08-31';
  const STORAGE_KEY = 'zh-schedule-settings-v1';
  const TOTAL_WEEKS = 17;
  const GRID_DAYS = [1, 2, 3, 4, 5];
  const DAY_SHORT = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  const $ = (id) => document.getElementById(id);

  const els = {
    app: $('app'),
    todayView: $('todayView'),
    weekView: $('weekView'),
    semesterView: $('semesterView'),
    detailModal: $('detailModal'),
    detailBody: $('detailBody'),
    detailClose: $('detailClose'),
    settingsModal: $('settingsModal'),
    settingsForm: $('settingsForm'),
    startDate: $('startDate'),
    manualWeek: $('manualWeek'),
    settingsBtn: $('settingsBtn'),
    settingsClose: $('settingsClose')
  };

  let settings = loadSettings();
  let activeTab = 'today';
  let activeWeek = resolveWeek();
  let searchText = '';

  function loadSettings() {
    const fallback = {
      startDate: DEFAULT_START,
      weekMode: 'auto',
      manualWeek: 1
    };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fallback;
      const saved = JSON.parse(raw);
      return {
        startDate: saved.startDate || fallback.startDate,
        weekMode: saved.weekMode === 'manual' ? 'manual' : 'auto',
        manualWeek: clamp(Number(saved.manualWeek) || 1, 1, TOTAL_WEEKS)
      };
    } catch (err) {
      return fallback;
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      // Storage can be unavailable in private mode.
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function parseDate(value) {
    const parts = String(value).split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function currentAutoWeek() {
    const today = startOfDay(new Date());
    const start = startOfDay(parseDate(settings.startDate));
    const diffDays = Math.floor((today - start) / 86400000);
    return clamp(Math.floor(diffDays / 7) + 1, 1, TOTAL_WEEKS);
  }

  function resolveWeek() {
    if (settings.weekMode === 'manual') {
      return clamp(Number(settings.manualWeek) || 1, 1, TOTAL_WEEKS);
    }
    return currentAutoWeek();
  }

  function setWeek(week) {
    activeWeek = clamp(week, 1, TOTAL_WEEKS);
  }

  function classesForWeekDay(day, week) {
    return COURSES
      .filter((course) => course.day === day && course.weeks.includes(week))
      .sort((a, b) => a.start - b.start || a.end - b.end);
  }

  function classesForSlot(day, period, week) {
    return COURSES.filter(
      (course) =>
        course.day === day &&
        course.start === period.start &&
        course.end === period.end &&
        course.weeks.includes(week)
    );
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function badgeClass(kind) {
    if (kind === '实践') return 'badge-practice';
    if (kind === '课外') return 'badge-outside';
    if (kind === '体育') return 'badge-sport';
    return 'badge-kind';
  }

  function periodText(start, end) {
    return start === end ? '第' + start + '节' : '第' + start + '-' + end + '节';
  }

  function setTab(tab) {
    activeTab = tab;
    const views = {
      today: els.todayView,
      week: els.weekView,
      semester: els.semesterView
    };
    Object.keys(views).forEach((key) => {
      views[key].classList.toggle('hidden', key !== tab);
    });
    document.querySelectorAll('.nav-item').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.tab === tab);
    });
    if (tab === 'today') renderToday();
    if (tab === 'week') renderWeek();
    if (tab === 'semester') renderSemester();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function renderToday() {
    const now = new Date();
    const day = now.getDay() === 0 ? 7 : now.getDay();
    const classes = classesForWeekDay(day, activeWeek);
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const next = classes[0] || null;

    let html = '';
    html += '<div class="day-heading">';
    html += '<h1>' + month + '月' + date + '日 ' + DAY_NAMES[day - 1] + '</h1>';
    html += '<div class="day-sub">第' + activeWeek + '周</div>';
    html += '</div>';

    if (next) {
      html +=
        '<button class="next-class" data-id="' +
        next.id +
        '" type="button">' +
        '<span><span class="next-label">下一节</span>' +
        '<span class="next-name">' +
        esc(next.short) +
        '</span>' +
        '<span class="next-meta">' +
        esc(next.room) +
        ' · ' +
        esc(next.teacher) +
        '</span></span>' +
        '<span class="next-time">' +
        periodText(next.start, next.end) +
        '</span></button>';
    } else {
      html +=
        '<div class="next-class">' +
        '<span><span class="next-label">今日</span>' +
        '<span class="next-name">今天没有课</span></span></div>';
    }

    html += '<div class="today-list">';
    const dayClasses = classes;
    if (dayClasses.length === 0) {
      html +=
        '<div class="empty-state"><div class="empty-title">今天没有课</div>' +
        '<div>可以看看其他周的安排</div></div>';
    } else {
      PERIODS.forEach((period) => {
        const items = dayClasses.filter(
          (course) => course.start === period.start && course.end === period.end
        );
        if (items.length === 0) return;
        html +=
          '<div class="section-heading"><span>' +
          period.section +
          ' ' +
          period.label +
          '</span><span class="section-count">' +
          items.length +
          ' 节</span></div>';
        items.forEach((course) => {
          html +=
            '<button class="class-row" data-id="' +
            course.id +
            '" type="button">' +
            '<div class="period-block">' +
            '<div class="period">' +
            periodText(course.start, course.end) +
            '</div>' +
            '<div class="section">' +
            period.section +
            '</div></div>' +
            '<div class="class-main">' +
            '<div class="class-title">' +
            esc(course.short) +
            '</div>' +
            '<div class="class-meta"><span>' +
            esc(course.room) +
            '</span><span>' +
            esc(course.teacher) +
            '</span></div>' +
            '</div></button>';
        });
      });
    }
    html += '</div>';
    els.todayView.innerHTML = html;
    bindCourseButtons(els.todayView);
  }

  function renderWeek() {
    const todayDay = new Date().getDay() === 0 ? 7 : new Date().getDay();
    const autoWeek = currentAutoWeek();

    let html = '';
    html += '<div class="day-heading">';
    html += '<h1>周课表</h1>';
    html += '<div class="day-sub">第' + activeWeek + '周</div>';
    html += '</div>';

    html += '<div class="week-picker" aria-label="选择周次">';
    for (let week = 1; week <= TOTAL_WEEKS; week += 1) {
      const classes = ['week-chip'];
      if (week === activeWeek) classes.push('is-selected');
      if (week === autoWeek) classes.push('is-current');
      html +=
        '<button class="' +
        classes.join(' ') +
        '" data-week="' +
        week +
        '" type="button">' +
        week +
        '周</button>';
    }
    html += '</div>';

    html += '<div class="grid-wrap"><div class="schedule-grid">';
    html += '<div class="grid-header"></div>';
    GRID_DAYS.forEach((day) => {
      html +=
        '<div class="grid-header' +
        (day === todayDay ? ' is-today' : '') +
        '">' +
        DAY_SHORT[day - 1] +
        '</div>';
    });

    PERIODS.forEach((period) => {
      html +=
        '<div class="grid-time"><strong>' +
        period.label +
        '</strong><span>' +
        period.section +
        '</span></div>';
      GRID_DAYS.forEach((day) => {
        const items = classesForSlot(day, period, activeWeek);
        html +=
          '<div class="grid-cell' +
          (day === todayDay ? ' is-today' : '') +
          '">';
        items.slice(0, 3).forEach((course) => {
          html +=
            '<button class="cell-class" data-id="' +
            course.id +
            '" type="button">' +
            '<span class="cell-name">' +
            esc(course.short) +
            '</span>' +
            '<span class="cell-room">' +
            esc(course.room) +
            '</span></button>';
        });
        if (items.length > 3) {
          html +=
            '<div class="cell-class"><span class="cell-name">+' +
            (items.length - 3) +
            '</span></div>';
        }
        html += '</div>';
      });
    });

    html += '</div></div>';
    html +=
      '<div class="week-legend"><span class="legend-item"><span class="dot"></span>本周</span></div>';
    els.weekView.innerHTML = html;

    els.weekView.querySelectorAll('.week-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        setWeek(Number(chip.dataset.week));
        settings.weekMode = 'manual';
        settings.manualWeek = activeWeek;
        saveSettings();
        renderWeek();
      });
    });
    bindCourseButtons(els.weekView);
  }

  function renderSemester() {
    const query = searchText.trim().toLowerCase();
    const matches = (course) => {
      if (!query) return true;
      const haystack = [
        course.name,
        course.short,
        course.teacher,
        course.room,
        course.weeksText,
        course.groups
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    };

    const filtered = COURSES.filter(matches);
    const groups = [];
    const seen = new Map();
    filtered.forEach((course) => {
      if (!seen.has(course.name)) {
        seen.set(course.name, []);
        groups.push({ name: course.name, items: seen.get(course.name) });
      }
      seen.get(course.name).push(course);
    });

    const extras = EXTRAS.filter(matches);

    let html = '';
    html += '<div class="day-heading"><h1>学期课程</h1>';
    html += '<div class="day-sub">' + filtered.length + ' 条安排</div></div>';
    html +=
      '<div class="search-bar">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>' +
      '</svg>' +
      '<input type="search" id="searchInput" value="' +
      esc(searchText) +
      '" placeholder="搜索课程、教室或教师" aria-label="搜索课程"></div>';

    if (groups.length === 0 && extras.length === 0) {
      html += '<div class="empty-state"><div class="empty-title">没有找到课程</div></div>';
    }

    groups.forEach((group) => {
      html += '<div class="course-group">';
      html +=
        '<div class="course-group-head"><span class="course-name">' +
        esc(group.name) +
        '</span>' +
        '<span class="course-count">' +
        group.items.length +
        ' 条</span></div>';
      group.items.forEach((course) => {
        html +=
          '<button class="course-item" data-id="' +
          course.id +
          '" type="button">' +
          '<div class="item-time">' +
          DAY_SHORT[course.day - 1] +
          '<br>' +
          periodText(course.start, course.end) +
          '</div>' +
          '<div class="item-main">' +
          '<div class="item-line">' +
          esc(course.weeksText) +
          ' · ' +
          esc(course.room) +
          '</div>' +
          '<div class="item-line">' +
          esc(course.teacher) +
          '</div></div></button>';
      });
      html += '</div>';
    });

    html += '<div class="section-heading"><span>实践与课外</span>';
    html += '<span class="section-count">' + extras.length + ' 项</span></div>';
    html += '<div class="extras-list">';
    if (extras.length === 0) {
      html += '<div class="empty-state"><div class="empty-title">没有匹配项</div></div>';
    }
    extras.forEach((extra) => {
      html +=
        '<button class="extra-row" data-id="' +
        extra.id +
        '" type="button">' +
        '<div class="extra-main">' +
        '<div class="extra-name">' +
        esc(extra.short) +
        '</div>' +
        '<div class="extra-meta">' +
        esc(extra.weeksText) +
        ' · ' +
        esc(extra.teacher) +
        '</div></div>' +
        '<span class="badge ' +
        badgeClass(extra.kind) +
        '">' +
        esc(extra.kind) +
        '</span></button>';
    });
    html += '</div>';

    els.semesterView.innerHTML = html;

    const input = $('searchInput');
    if (input) {
      input.addEventListener('input', () => {
        searchText = input.value;
        renderSemester();
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      });
    }
    bindCourseButtons(els.semesterView);
  }

  function bindCourseButtons(root) {
    root.querySelectorAll('[data-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.id;
        const course = COURSES.find((item) => item.id === id);
        const extra = EXTRAS.find((item) => item.id === id);
        openDetail(course || extra);
      });
    });
  }

  function openDetail(item) {
    if (!item) return;
    let html = '';
    html += '<div class="detail-head"><div><h2>' + esc(item.name) + '</h2>';
    html +=
      '<div class="detail-badges"><span class="badge ' +
      badgeClass(item.kind) +
      '">' +
      esc(item.kind) +
      '</span></div></div></div>';
    html += '<div class="detail-rows">';
    if (item.day) {
      html +=
        detailRow(
          '时间',
          DAY_NAMES[item.day - 1] + ' · ' + periodText(item.start, item.end)
        );
    } else {
      html += detailRow('时间', '无固定时间');
    }
    html += detailRow('周次', item.weeksText);
    html += detailRow('校区', item.campus || '老满城校区');
    html += detailRow('场地', item.room || '无固定场地');
    html += detailRow('教师', item.teacher);
    if (item.groups) html += detailRow('教学班', item.groups);
    if (item.note) html += detailRow('说明', item.note);
    html += '</div>';
    els.detailBody.innerHTML = html;
    els.detailModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function detailRow(label, value) {
    return (
      '<div class="detail-row"><div class="detail-label">' +
      esc(label) +
      '</div><div class="detail-value">' +
      esc(value) +
      '</div></div>'
    );
  }

  function closeDetail() {
    els.detailModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function openSettings() {
    els.startDate.value = settings.startDate;
    const radio = document.querySelector(
      'input[name="weekMode"][value="' + settings.weekMode + '"]'
    );
    if (radio) radio.checked = true;
    els.manualWeek.value = String(settings.manualWeek);
    updateManualWeekState();
    els.settingsModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeSettings() {
    els.settingsModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function updateManualWeekState() {
    const mode = document.querySelector('input[name="weekMode"]:checked');
    els.manualWeek.disabled = !mode || mode.value !== 'manual';
  }

  function fillWeekOptions() {
    els.manualWeek.innerHTML = '';
    for (let week = 1; week <= TOTAL_WEEKS; week += 1) {
      const option = document.createElement('option');
      option.value = String(week);
      option.textContent = '第' + week + '周';
      els.manualWeek.appendChild(option);
    }
  }

  function init() {
    fillWeekOptions();
    document.querySelectorAll('.nav-item').forEach((button) => {
      button.addEventListener('click', () => setTab(button.dataset.tab));
    });
    els.settingsBtn.addEventListener('click', openSettings);
    els.settingsClose.addEventListener('click', closeSettings);
    els.detailClose.addEventListener('click', closeDetail);
    els.detailModal.addEventListener('click', (event) => {
      if (event.target === els.detailModal) closeDetail();
    });
    els.settingsModal.addEventListener('click', (event) => {
      if (event.target === els.settingsModal) closeSettings();
    });
    document.querySelectorAll('input[name="weekMode"]').forEach((radio) => {
      radio.addEventListener('change', updateManualWeekState);
    });
    els.settingsForm.addEventListener('submit', (event) => {
      event.preventDefault();
      settings.startDate = els.startDate.value || DEFAULT_START;
      const mode = document.querySelector('input[name="weekMode"]:checked');
      settings.weekMode = mode && mode.value === 'manual' ? 'manual' : 'auto';
      settings.manualWeek = clamp(Number(els.manualWeek.value) || 1, 1, TOTAL_WEEKS);
      saveSettings();
      setWeek(resolveWeek());
      closeSettings();
      setTab(activeTab);
    });

    setTab('today');

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }

  init();
})();
