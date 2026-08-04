'use strict';

(function () {
  const DEFAULT_START = '2026-08-31';
  const SETTINGS_KEY = 'zh-schedule-settings-v1';
  const USER_COURSES_KEY = 'zh-schedule-user-courses-v1';
  const OVERRIDES_KEY = 'zh-schedule-overrides-v1';
  const REMOVED_KEY = 'zh-schedule-removed-v1';
  const PLANS_KEY = 'zh-schedule-plans-v1';
  const TOTAL_WEEKS = 17;
  const GRID_DAYS = [1, 2, 3, 4, 5, 6, 7];
  const DAY_SHORT = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  const $ = (id) => document.getElementById(id);

  const els = {
    todayView: $('todayView'),
    weekView: $('weekView'),
    semesterView: $('semesterView'),
    planView: $('planView'),
    detailModal: $('detailModal'),
    detailBody: $('detailBody'),
    detailClose: $('detailClose'),
    settingsModal: $('settingsModal'),
    settingsForm: $('settingsForm'),
    startDate: $('startDate'),
    manualWeek: $('manualWeek'),
    settingsBtn: $('settingsBtn'),
    settingsClose: $('settingsClose'),
    courseModal: $('courseModal'),
    courseForm: $('courseForm'),
    courseClose: $('courseClose'),
    courseModalTitle: $('courseModalTitle'),
    courseId: $('courseId'),
    courseName: $('courseName'),
    courseShort: $('courseShort'),
    courseDay: $('courseDay'),
    coursePeriod: $('coursePeriod'),
    courseWeeks: $('courseWeeks'),
    courseRoom: $('courseRoom'),
    courseTeacher: $('courseTeacher'),
    courseGroups: $('courseGroups'),
    courseKind: $('courseKind'),
    courseError: $('courseError'),
    planModal: $('planModal'),
    planForm: $('planForm'),
    planClose: $('planClose'),
    planModalTitle: $('planModalTitle'),
    planId: $('planId'),
    planTitle: $('planTitle'),
    planDay: $('planDay'),
    planPeriod: $('planPeriod'),
    planWeeks: $('planWeeks'),
    planNote: $('planNote'),
    planError: $('planError'),
    confirmModal: $('confirmModal'),
    confirmText: $('confirmText'),
    confirmCancel: $('confirmCancel'),
    confirmOk: $('confirmOk')
  };

  let settings = loadSettings();
  let userCourses = loadArray(USER_COURSES_KEY);
  let courseOverrides = loadObject(OVERRIDES_KEY);
  let removedIds = loadArray(REMOVED_KEY);
  let plans = loadArray(PLANS_KEY);
  let activeTab = 'today';
  let activeWeek = resolveWeek();
  let searchText = '';
  let pendingConfirm = null;

  function loadSettings() {
    const fallback = {
      startDate: DEFAULT_START,
      weekMode: 'auto',
      manualWeek: 1
    };
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
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
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      // Storage can be unavailable in private mode.
    }
  }

  function loadArray(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return Array.isArray(value) ? value : [];
    } catch (err) {
      return [];
    }
  }

  function loadObject(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (err) {
      return {};
    }
  }

  function saveArray(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      // Storage can be unavailable in private mode.
    }
  }

  function saveObject(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
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

  function isBeforeTerm() {
    return startOfDay(new Date()) < startOfDay(parseDate(settings.startDate));
  }

  function daysUntilTerm() {
    const today = startOfDay(new Date());
    const start = startOfDay(parseDate(settings.startDate));
    return Math.max(0, Math.round((start - today) / 86400000));
  }

  function uid(prefix) {
    return (
      prefix +
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 8)
    );
  }

  function effectiveCourses() {
    const list = [];
    COURSES.forEach((course) => {
      if (removedIds.includes(course.id)) return;
      if (courseOverrides[course.id]) {
        list.push(Object.assign({}, course, courseOverrides[course.id], { edited: true }));
      } else {
        list.push(Object.assign({}, course));
      }
    });
    userCourses.forEach((course) => {
      list.push(Object.assign({}, course, { custom: true }));
    });
    return list;
  }

  function classesForWeekDay(day, week) {
    return effectiveCourses()
      .filter((course) => course.day === day && course.weeks.includes(week))
      .sort((a, b) => a.start - b.start || a.end - b.end);
  }

  function classesForSlot(day, period, week) {
    return effectiveCourses().filter(
      (course) =>
        course.day === day &&
        course.start === period.start &&
        course.end === period.end &&
        course.weeks.includes(week)
    );
  }

  function plansForWeekDay(day, week) {
    return plans
      .filter((plan) => plan.day === day && plan.weeks.includes(week))
      .sort((a, b) => a.start - b.start || a.end - b.end);
  }

  function plansForSlot(day, period, week) {
    return plans.filter(
      (plan) =>
        plan.day === day &&
        plan.start === period.start &&
        plan.end === period.end &&
        plan.weeks.includes(week)
    );
  }

  function findItem(id) {
    if (!id) return null;
    if (String(id).indexOf('p:') === 0) {
      return plans.find((plan) => plan.id === id) || null;
    }
    const course = effectiveCourses().find((item) => item.id === id);
    if (course) return course;
    return EXTRAS.find((item) => item.id === id) || null;
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
    if (kind === '规划') return 'badge-plan';
    return 'badge-kind';
  }

  function periodText(start, end) {
    return start === end ? '第' + start + '节' : '第' + start + '-' + end + '节';
  }

  function shortFromName(name, fallback) {
    const clean = String(name || '').trim();
    const short = String(fallback || '').trim();
    if (short) return short;
    return clean.length > 6 ? clean.slice(0, 6) : clean;
  }

  function populateDaySelect(select) {
    select.innerHTML = '';
    DAY_NAMES.forEach((name, index) => {
      const option = document.createElement('option');
      option.value = String(index + 1);
      option.textContent = name;
      select.appendChild(option);
    });
  }

  function populatePeriodSelect(select) {
    select.innerHTML = '';
    PERIODS.forEach((period) => {
      const option = document.createElement('option');
      option.value = period.start + '-' + period.end;
      option.textContent = period.section + ' ' + period.label;
      select.appendChild(option);
    });
  }

  function setTab(tab) {
    activeTab = tab;
    const views = {
      today: els.todayView,
      week: els.weekView,
      semester: els.semesterView,
      plan: els.planView
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
    if (tab === 'plan') renderPlan();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function dayHeading(title, sub) {
    return (
      '<div class="day-heading"><div><h1>' +
      esc(title) +
      '</h1><div class="day-sub">' +
      esc(sub) +
      '</div></div></div>'
    );
  }

  function renderToday() {
    const now = new Date();
    const day = now.getDay() === 0 ? 7 : now.getDay();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const title = month + '月' + date + '日 ' + DAY_NAMES[day - 1];

    if (isBeforeTerm()) {
      const left = daysUntilTerm();
      let html = dayHeading(title, '距开学 ' + left + ' 天');
      html +=
        '<div class="hero-msg">' +
        '<span class="hero-overline">未开学</span>' +
        '<span class="hero-title">距离开学还有 ' +
        left +
        ' 天</span></div>';
      html +=
        '<div class="empty-state"><div class="empty-title">尚未开学</div></div>';
      els.todayView.innerHTML = html;
      return;
    }

    const classes = classesForWeekDay(day, activeWeek);
    const dayPlans = plansForWeekDay(day, activeWeek);
    const next = classes[0] || null;
    let html = dayHeading(title, '第' + activeWeek + '周');

    if (next) {
      html +=
        '<button class="next-class" data-id="' +
        next.id +
        '" type="button">' +
        '<span class="next-icon">' +
        clockIcon() +
        '</span>' +
        '<span class="next-copy"><span class="next-label">下一节</span>' +
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
        '<div class="next-class muted-next">' +
        '<span class="next-copy"><span class="next-label">今日</span>' +
        '<span class="next-name">今天没有课</span></span></div>';
    }

    if (classes.length > 0) {
      html += '<div class="today-list">';
      PERIODS.forEach((period) => {
        const items = classes.filter(
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
          html += courseRow(course);
        });
      });
      html += '</div>';
    } else if (dayPlans.length === 0) {
      html +=
        '<div class="empty-state"><div class="empty-title">今天没有课</div></div>';
    }

    if (dayPlans.length > 0) {
      html +=
        '<div class="section-heading"><span>个人规划</span>' +
        '<span class="section-count">' +
        dayPlans.length +
        ' 项</span></div>';
      html += '<div class="today-list">';
      dayPlans.forEach((plan) => {
        html += planRow(plan);
      });
      html += '</div>';
    }

    els.todayView.innerHTML = html;
    bindCourseButtons(els.todayView);
  }

  function courseRow(course) {
    return (
      '<button class="class-row" data-id="' +
      course.id +
      '" type="button">' +
      '<div class="period-block">' +
      '<div class="period">' +
      periodText(course.start, course.end) +
      '</div>' +
      '<div class="section">' +
      PERIODS.find((p) => p.start === course.start && p.end === course.end).section +
      '</div></div>' +
      '<div class="class-main">' +
      '<div class="class-title">' +
      esc(course.short) +
      (course.custom || course.edited
        ? '<span class="badge badge-custom">自定义</span>'
        : '') +
      '</div>' +
      '<div class="class-meta"><span>' +
      esc(course.room) +
      '</span><span>' +
      esc(course.teacher) +
      '</span></div>' +
      '</div></button>'
    );
  }

  function planRow(plan) {
    const section =
      PERIODS.find((p) => p.start === plan.start && p.end === plan.end) || {};
    return (
      '<button class="plan-row" data-id="' +
      plan.id +
      '" type="button">' +
      '<div class="period-block">' +
      '<div class="period">' +
      periodText(plan.start, plan.end) +
      '</div>' +
      '<div class="section">' +
      esc(section.section || '') +
      '</div></div>' +
      '<div class="class-main">' +
      '<div class="class-title plan-title">' +
      esc(plan.title) +
      '</div>' +
      '<div class="class-meta"><span>' +
      esc(plan.weeksText) +
      '</span><span>' +
      esc(plan.note || '个人规划') +
      '</span></div>' +
      '</div>' +
      '<span class="badge badge-plan">规划</span></button>'
    );
  }

  function renderWeek() {
    const todayDay = new Date().getDay() === 0 ? 7 : new Date().getDay();
    const autoWeek = currentAutoWeek();

    let html = '';
    html += '<div class="day-heading">';
    html += '<div><h1>周课表</h1><div class="day-sub">第' + activeWeek + '周</div></div>';
    html +=
      '<button class="add-btn" id="addCourseBtn" type="button">' +
      plusIcon() +
      '课程</button>';
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

    html +=
      '<div class="grid-scroll"><div class="grid-wrap"><div class="schedule-grid">';
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
        const courses = classesForSlot(day, period, activeWeek);
        const dayPlans = plansForSlot(day, period, activeWeek);
        const items = courses.concat(dayPlans);
        html +=
          '<div class="grid-cell' +
          (day === todayDay ? ' is-today' : '') +
          '">';
        items.slice(0, 3).forEach((item) => {
          if (item.kind === '规划' || String(item.id).indexOf('p:') === 0) {
            html +=
              '<button class="cell-class cell-plan" data-id="' +
              item.id +
              '" type="button">' +
              '<span class="cell-name">' +
              esc(item.title) +
              '</span>' +
              '<span class="cell-room">' +
              esc(item.note || '规划') +
              '</span></button>';
          } else {
            html +=
              '<button class="cell-class" data-id="' +
              item.id +
              '" type="button">' +
              '<span class="cell-name">' +
              esc(item.short) +
              '</span>' +
              '<span class="cell-room">' +
              esc(item.room) +
              '</span></button>';
          }
        });
        if (items.length > 3) {
          html +=
            '<div class="cell-class cell-more"><span class="cell-name">+' +
            (items.length - 3) +
            '</span></div>';
        }
        html += '</div>';
      });
    });

    html += '</div></div></div>';
    html +=
      '<div class="week-legend">' +
      '<span class="legend-item"><span class="dot dot-course"></span>本周</span>' +
      '<span class="legend-item"><span class="dot dot-plan"></span>规划</span>' +
      '</div>';
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
    $('addCourseBtn').addEventListener('click', () => openCourseModal(null));
    bindCourseButtons(els.weekView);
  }

  function renderSemester() {
    const query = searchText.trim().toLowerCase();
    const matches = (item) => {
      if (!query) return true;
      const haystack = [
        item.name,
        item.short,
        item.teacher,
        item.room,
        item.weeksText,
        item.groups,
        item.title,
        item.note
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    };

    const filtered = effectiveCourses().filter(matches);
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
    html += '<div class="day-heading">';
    html += '<div><h1>学期课程</h1><div class="day-sub">' + filtered.length + ' 条安排</div></div>';
    html +=
      '<button class="add-btn" id="semesterAddBtn" type="button">' +
      plusIcon() +
      '课程</button>';
    html += '</div>';
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
          '</div></div>' +
          (course.custom || course.edited
            ? '<span class="badge badge-custom">自定义</span>'
            : '') +
          '</button>';
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
    $('semesterAddBtn').addEventListener('click', () => openCourseModal(null));
    bindCourseButtons(els.semesterView);
  }

  function renderPlan() {
    let html = '';
    html += '<div class="day-heading">';
    html += '<div><h1>我的规划</h1><div class="day-sub">' + plans.length + ' 项安排</div></div>';
    html +=
      '<button class="add-btn" id="addPlanBtn" type="button">' +
      plusIcon() +
      '规划</button>';
    html += '</div>';

    if (plans.length === 0) {
      html +=
        '<div class="empty-state"><div class="empty-title">还没有个人规划</div></div>';
    } else {
      GRID_DAYS.forEach((day) => {
        const dayPlans = plans
          .filter((plan) => plan.day === day)
          .sort((a, b) => a.start - b.start || a.end - b.end);
        if (dayPlans.length === 0) return;
        html +=
          '<div class="section-heading"><span>' +
          DAY_NAMES[day - 1] +
          '</span><span class="section-count">' +
          dayPlans.length +
          ' 项</span></div>';
        html += '<div class="today-list">';
        dayPlans.forEach((plan) => {
          html += planRow(plan);
        });
        html += '</div>';
      });
    }

    els.planView.innerHTML = html;
    $('addPlanBtn').addEventListener('click', () => openPlanModal(null));
    bindCourseButtons(els.planView);
  }

  function bindCourseButtons(root) {
    root.querySelectorAll('[data-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = findItem(button.dataset.id);
        if (item) openDetail(item);
      });
    });
  }

  function openDetail(item) {
    if (!item) return;
    let html = '';
    html += '<div class="detail-head"><div><h2>' + esc(item.name || item.title) + '</h2>';
    html += '<div class="detail-badges">';
    const kind = item.kind || (String(item.id).indexOf('p:') === 0 ? '规划' : '课程');
    html +=
      '<span class="badge ' +
      badgeClass(kind) +
      '">' +
      esc(kind) +
      '</span>';
    if (item.custom || item.edited) {
      html += '<span class="badge badge-custom">自定义</span>';
    }
    html += '</div></div></div>';

    html += '<div class="detail-rows">';
    const isPlan = String(item.id).indexOf('p:') === 0;
    if (isPlan) {
      html += detailRow('时间', DAY_NAMES[item.day - 1] + ' · ' + periodText(item.start, item.end));
      html += detailRow('周次', item.weeksText);
      html += detailRow('备注', item.note || '个人规划');
    } else if (item.day) {
      html += detailRow('时间', DAY_NAMES[item.day - 1] + ' · ' + periodText(item.start, item.end));
      html += detailRow('周次', item.weeksText);
      html += detailRow('校区', item.campus || '老满城校区');
      html += detailRow('场地', item.room || '无固定场地');
      html += detailRow('教师', item.teacher);
      if (item.groups) html += detailRow('教学班', item.groups);
    } else {
      html += detailRow('时间', '无固定时间');
      html += detailRow('周次', item.weeksText);
      html += detailRow('校区', item.campus || '老满城校区');
      html += detailRow('场地', item.room || '无固定场地');
      html += detailRow('教师', item.teacher);
      if (item.note) html += detailRow('说明', item.note);
    }
    html += '</div>';

    if (isPlan || item.day) {
      html += '<div class="detail-actions">';
      html +=
        '<button class="action-btn" data-edit="' +
        item.id +
        '" type="button">' +
        pencilIcon() +
        '编辑</button>';
      html +=
        '<button class="action-btn danger" data-delete="' +
        item.id +
        '" type="button">' +
        trashIcon() +
        '删除</button>';
      html += '</div>';
    }

    els.detailBody.innerHTML = html;
    els.detailBody.querySelectorAll('[data-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        const target = findItem(button.dataset.edit);
        closeDetail();
        if (String(button.dataset.edit).indexOf('p:') === 0) {
          openPlanModal(target);
        } else {
          openCourseModal(target);
        }
      });
    });
    els.detailBody.querySelectorAll('[data-delete]').forEach((button) => {
      button.addEventListener('click', () => {
        const id = button.dataset.delete;
        closeDetail();
        openConfirm('删除后不会影响原课表，可以随时重新添加。', () => {
          if (String(id).indexOf('p:') === 0) {
            plans = plans.filter((plan) => plan.id !== id);
            saveArray(PLANS_KEY, plans);
          } else if (userCourses.some((course) => course.id === id)) {
            userCourses = userCourses.filter((course) => course.id !== id);
            saveArray(USER_COURSES_KEY, userCourses);
          } else {
            if (courseOverrides[id]) {
              delete courseOverrides[id];
              saveObject(OVERRIDES_KEY, courseOverrides);
            }
            removedIds.push(id);
            saveArray(REMOVED_KEY, removedIds);
          }
          setTab(activeTab);
        });
      });
    });
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

  function openCourseModal(course) {
    els.courseError.classList.add('hidden');
    els.courseForm.reset();
    els.courseId.value = course ? course.id : '';
    els.courseModalTitle.textContent = course ? '编辑课程' : '添加课程';
    if (course) {
      els.courseName.value = course.name || '';
      els.courseShort.value = course.short || '';
      els.courseDay.value = String(course.day);
      els.coursePeriod.value = course.start + '-' + course.end;
      els.courseWeeks.value = course.weeksText || '';
      els.courseRoom.value = course.room || '';
      els.courseTeacher.value = course.teacher || '';
      els.courseGroups.value = course.groups || '';
      els.courseKind.value = course.kind || '理论';
    } else {
      els.courseWeeks.value = '1-17';
      els.courseKind.value = '理论';
    }
    els.courseModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    els.courseName.focus();
  }

  function closeCourseModal() {
    els.courseModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function openPlanModal(plan) {
    els.planError.classList.add('hidden');
    els.planForm.reset();
    els.planId.value = plan ? plan.id : '';
    els.planModalTitle.textContent = plan ? '编辑规划' : '添加规划';
    if (plan) {
      els.planTitle.value = plan.title || '';
      els.planDay.value = String(plan.day);
      els.planPeriod.value = plan.start + '-' + plan.end;
      els.planWeeks.value = plan.weeksText || '';
      els.planNote.value = plan.note || '';
    } else {
      els.planWeeks.value = '1-17';
    }
    els.planModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    els.planTitle.focus();
  }

  function closePlanModal() {
    els.planModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function openConfirm(text, onOk) {
    els.confirmText.textContent = text;
    pendingConfirm = onOk;
    els.confirmModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeConfirm() {
    els.confirmModal.classList.add('hidden');
    pendingConfirm = null;
    document.body.style.overflow = '';
  }

  function parsePeriodValue(value) {
    const parts = String(value).split('-').map(Number);
    return { start: parts[0], end: parts[1] || parts[0] };
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

  function clockIcon() {
    return (
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' +
      '</svg>'
    );
  }

  function plusIcon() {
    return (
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M5 12h14"/><path d="M12 5v14"/>' +
      '</svg>'
    );
  }

  function pencilIcon() {
    return (
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>' +
      '<path d="m15 5 4 4"/>' +
      '</svg>'
    );
  }

  function trashIcon() {
    return (
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>' +
      '<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>' +
      '<line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>' +
      '</svg>'
    );
  }

  function init() {
    populateDaySelect(els.courseDay);
    populatePeriodSelect(els.coursePeriod);
    populateDaySelect(els.planDay);
    populatePeriodSelect(els.planPeriod);
    fillWeekOptions();

    document.querySelectorAll('.nav-item').forEach((button) => {
      button.addEventListener('click', () => setTab(button.dataset.tab));
    });

    els.settingsBtn.addEventListener('click', openSettings);
    els.settingsClose.addEventListener('click', closeSettings);
    els.detailClose.addEventListener('click', closeDetail);
    els.courseClose.addEventListener('click', closeCourseModal);
    els.planClose.addEventListener('click', closePlanModal);
    els.confirmCancel.addEventListener('click', closeConfirm);
    els.confirmOk.addEventListener('click', () => {
      const action = pendingConfirm;
      closeConfirm();
      if (action) action();
    });

    [els.detailModal, els.settingsModal, els.courseModal, els.planModal].forEach(
      (modal) => {
        modal.addEventListener('click', (event) => {
          if (event.target !== modal) return;
          if (modal === els.detailModal) closeDetail();
          if (modal === els.settingsModal) closeSettings();
          if (modal === els.courseModal) closeCourseModal();
          if (modal === els.planModal) closePlanModal();
        });
      }
    );
    els.confirmModal.addEventListener('click', (event) => {
      if (event.target === els.confirmModal) closeConfirm();
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

    els.courseForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const name = els.courseName.value.trim();
      if (!name) {
        showFormError(els.courseError, '课程名称不能为空');
        return;
      }
      const weeksText = els.courseWeeks.value.trim();
      const weeks = expandWeeks(weeksText);
      if (!weeks.length) {
        showFormError(els.courseError, '周次格式不正确，如 1-17 或 1-3,5-7单');
        return;
      }
      const period = parsePeriodValue(els.coursePeriod.value);
      const fields = {
        name: name,
        short: shortFromName(name, els.courseShort.value),
        day: Number(els.courseDay.value),
        start: period.start,
        end: period.end,
        weeks: weeks,
        weeksText: weeksText,
        campus: '老满城校区',
        room: els.courseRoom.value.trim() || '待定',
        teacher: els.courseTeacher.value.trim() || '待定',
        groups: els.courseGroups.value.trim() || '无',
        kind: els.courseKind.value
      };
      const id = els.courseId.value;
      if (id) {
        const userIndex = userCourses.findIndex((course) => course.id === id);
        if (userIndex >= 0) {
          userCourses[userIndex] = Object.assign({}, userCourses[userIndex], fields);
          saveArray(USER_COURSES_KEY, userCourses);
        } else {
          courseOverrides[id] = fields;
          saveObject(OVERRIDES_KEY, courseOverrides);
        }
      } else {
        userCourses.push(Object.assign({ id: uid('u') }, fields));
        saveArray(USER_COURSES_KEY, userCourses);
      }
      closeCourseModal();
      setTab(activeTab);
    });

    els.planForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const title = els.planTitle.value.trim();
      if (!title) {
        showFormError(els.planError, '标题不能为空');
        return;
      }
      const weeksText = els.planWeeks.value.trim();
      const weeks = expandWeeks(weeksText);
      if (!weeks.length) {
        showFormError(els.planError, '周次格式不正确，如 1-17');
        return;
      }
      const period = parsePeriodValue(els.planPeriod.value);
      const fields = {
        title: title,
        day: Number(els.planDay.value),
        start: period.start,
        end: period.end,
        weeks: weeks,
        weeksText: weeksText,
        note: els.planNote.value.trim()
      };
      const id = els.planId.value;
      if (id) {
        const index = plans.findIndex((plan) => plan.id === id);
        if (index >= 0) {
          plans[index] = Object.assign({}, plans[index], fields);
          saveArray(PLANS_KEY, plans);
        }
      } else {
        plans.push(Object.assign({ id: uid('p:') }, fields, { kind: '规划' }));
        saveArray(PLANS_KEY, plans);
      }
      closePlanModal();
      setTab(activeTab);
    });

    setTab('today');

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      });
    }
  }

  function showFormError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
  }

  init();
})();
