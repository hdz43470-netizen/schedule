'use strict';

const DAY_NAMES = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];

const PERIODS = [
  { label: '第1-2节', section: '上午', start: 1, end: 2 },
  { label: '第3-4节', section: '上午', start: 3, end: 4 },
  { label: '第5-6节', section: '下午', start: 5, end: 6 },
  { label: '第7-8节', section: '下午', start: 7, end: 8 },
  { label: '第9-10节', section: '晚上', start: 9, end: 10 }
];

function expandWeeks(spec) {
  const weeks = [];
  const parts = String(spec).replace(/周/g, '').split(',');
  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (!part) continue;
    let parity = null;
    if (part.includes('单')) parity = 'odd';
    if (part.includes('双')) parity = 'even';
    const core = part.replace(/[单双()（）]/g, '');
    const range = core.split('-').map(Number);
    const start = range[0];
    const end = range.length > 1 ? range[1] : start;
    for (let w = start; w <= end; w += 1) {
      if (parity === 'odd' && w % 2 === 0) continue;
      if (parity === 'even' && w % 2 === 1) continue;
      weeks.push(w);
    }
  }
  return Array.from(new Set(weeks)).sort((a, b) => a - b);
}

const CAMPUS = '老满城校区';
const GROUP_AGRI = '农业智能装备工程2401';
const GROUP_MECH_AGRI = '机械设计制造及其自动化2401；农业智能装备工程2401';
const GROUP_MECH3_AGRI = '机械设计制造及其自动化2403；农业智能装备工程2401';
const GROUP_AGRI_NEW = '农业智能装备工程2401；新能源科学与工程2401';

const COURSES = [
  {
    id: 'm1a',
    name: '人工智能基础',
    short: '人工智能',
    day: 1,
    start: 1,
    end: 2,
    weeks: expandWeeks('1-2'),
    weeksText: '1-2周',
    campus: CAMPUS,
    room: '一号楼1601',
    teacher: '靳伟',
    groups: GROUP_AGRI,
    kind: '理论'
  },
  {
    id: 'm1b',
    name: '人工智能基础',
    short: '人工智能',
    day: 1,
    start: 1,
    end: 2,
    weeks: expandWeeks('3-8'),
    weeksText: '3-8周',
    campus: CAMPUS,
    room: '一号楼1601',
    teacher: '王志鹏',
    groups: GROUP_AGRI,
    kind: '理论'
  },
  {
    id: 't1a',
    name: '习近平新时代中国特色社会主义思想概论',
    short: '习近平思想概论',
    day: 2,
    start: 1,
    end: 2,
    weeks: expandWeeks('1-5,7-9'),
    weeksText: '1-5、7-9周',
    campus: CAMPUS,
    room: '二号楼2216',
    teacher: '王晓暄',
    groups: GROUP_MECH_AGRI,
    kind: '理论'
  },
  {
    id: 'w1a',
    name: '机械设计',
    short: '机械设计',
    day: 3,
    start: 1,
    end: 2,
    weeks: expandWeeks('10-14'),
    weeksText: '10-14周',
    campus: CAMPUS,
    room: '一号楼1501',
    teacher: '邢春晓',
    groups: GROUP_AGRI,
    kind: '理论'
  },
  {
    id: 'th1a',
    name: '液压传动',
    short: '液压传动',
    day: 4,
    start: 1,
    end: 2,
    weeks: expandWeeks('10-13'),
    weeksText: '10-13周',
    campus: CAMPUS,
    room: '一号楼1501',
    teacher: '邢春晓',
    groups: GROUP_AGRI,
    kind: '理论'
  },
  {
    id: 'f1a',
    name: '液压传动',
    short: '液压传动',
    day: 5,
    start: 1,
    end: 2,
    weeks: expandWeeks('1-3,5-7单,8-14'),
    weeksText: '1-3、5-7（单）、8-14周',
    campus: CAMPUS,
    room: '二号楼2321',
    teacher: '秦旺旺',
    groups: GROUP_MECH_AGRI,
    kind: '理论'
  },
  {
    id: 'f1b',
    name: '液压传动',
    short: '液压传动',
    day: 5,
    start: 1,
    end: 2,
    weeks: expandWeeks('10-14'),
    weeksText: '10-14周',
    campus: CAMPUS,
    room: '二号楼2321',
    teacher: '邢春晓',
    groups: GROUP_AGRI,
    kind: '理论'
  },
  {
    id: 'm3a',
    name: '机械设计',
    short: '机械设计',
    day: 1,
    start: 3,
    end: 4,
    weeks: expandWeeks('1-9'),
    weeksText: '1-9周',
    campus: CAMPUS,
    room: '多思楼203',
    teacher: '王晓暄',
    groups: GROUP_MECH_AGRI,
    kind: '理论'
  },
  {
    id: 'w3a',
    name: '人工智能基础',
    short: '人工智能',
    day: 3,
    start: 3,
    end: 4,
    weeks: expandWeeks('1-2'),
    weeksText: '1-2周',
    campus: CAMPUS,
    room: '九号楼0104',
    teacher: '靳伟',
    groups: GROUP_AGRI,
    kind: '理论'
  },
  {
    id: 'w3b',
    name: '人工智能基础',
    short: '人工智能',
    day: 3,
    start: 3,
    end: 4,
    weeks: expandWeeks('3-5,7-9'),
    weeksText: '3-5、7-9周',
    campus: CAMPUS,
    room: '九号楼0104',
    teacher: '王志鹏',
    groups: GROUP_AGRI,
    kind: '理论'
  },
  {
    id: 'th3a',
    name: '毛泽东思想和中国特色社会主义理论体系概论',
    short: '毛泽东理论概论',
    day: 4,
    start: 3,
    end: 4,
    weeks: expandWeeks('1-4,6-11'),
    weeksText: '1-4、6-11周',
    campus: CAMPUS,
    room: '二号楼2225',
    teacher: '毋立根',
    groups: GROUP_MECH3_AGRI,
    kind: '理论'
  },
  {
    id: 'f3a',
    name: '单片机与嵌入式系统',
    short: '单片机',
    day: 5,
    start: 3,
    end: 4,
    weeks: expandWeeks('4,8-11'),
    weeksText: '4、8-11周',
    campus: CAMPUS,
    room: '一号楼1601',
    teacher: '朱兴亮',
    groups: GROUP_AGRI,
    kind: '理论'
  },
  {
    id: 'f3b',
    name: '单片机与嵌入式系统',
    short: '单片机',
    day: 5,
    start: 3,
    end: 4,
    weeks: expandWeeks('6-7'),
    weeksText: '6-7周',
    campus: CAMPUS,
    room: '一号楼1601',
    teacher: '徐阳',
    groups: GROUP_AGRI,
    kind: '理论'
  },
  {
    id: 'm5a',
    name: '单片机与嵌入式系统',
    short: '单片机',
    day: 1,
    start: 5,
    end: 6,
    weeks: expandWeeks('4-5,10-12'),
    weeksText: '4-5、10-12周',
    campus: CAMPUS,
    room: '九号楼0108',
    teacher: '朱兴亮',
    groups: GROUP_AGRI,
    kind: '理论'
  },
  {
    id: 'm5b',
    name: '单片机与嵌入式系统',
    short: '单片机',
    day: 1,
    start: 5,
    end: 6,
    weeks: expandWeeks('6-8'),
    weeksText: '6-8周',
    campus: CAMPUS,
    room: '九号楼0502',
    teacher: '徐阳',
    groups: GROUP_AGRI,
    kind: '理论'
  },
  {
    id: 'm5c',
    name: '单片机与嵌入式系统',
    short: '单片机',
    day: 1,
    start: 5,
    end: 6,
    weeks: expandWeeks('9'),
    weeksText: '9周',
    campus: CAMPUS,
    room: '九号楼0502',
    teacher: '朱兴亮',
    groups: GROUP_AGRI,
    kind: '理论'
  },
  {
    id: 't5a',
    name: '大学生就业指导',
    short: '就业指导',
    day: 2,
    start: 5,
    end: 6,
    weeks: expandWeeks('1'),
    weeksText: '第1周',
    campus: CAMPUS,
    room: '二号楼2421',
    teacher: '王若愚',
    groups: GROUP_AGRI_NEW,
    kind: '理论'
  },
  {
    id: 't5b',
    name: '形势与政策',
    short: '形势与政策',
    day: 2,
    start: 5,
    end: 6,
    weeks: expandWeeks('3'),
    weeksText: '第3周',
    campus: CAMPUS,
    room: '二号楼2325',
    teacher: '王娜',
    groups: GROUP_AGRI_NEW,
    kind: '理论'
  },
  {
    id: 't5c',
    name: '形势与政策',
    short: '形势与政策',
    day: 2,
    start: 5,
    end: 6,
    weeks: expandWeeks('4'),
    weeksText: '第4周',
    campus: CAMPUS,
    room: '二号楼2325',
    teacher: '张瑾',
    groups: GROUP_AGRI_NEW,
    kind: '理论'
  },
  {
    id: 't5d',
    name: '形势与政策',
    short: '形势与政策',
    day: 2,
    start: 5,
    end: 6,
    weeks: expandWeeks('5'),
    weeksText: '第5周',
    campus: CAMPUS,
    room: '二号楼2325',
    teacher: '刘宇',
    groups: GROUP_AGRI_NEW,
    kind: '理论'
  },
  {
    id: 'th5a',
    name: '习近平新时代中国特色社会主义思想概论',
    short: '习近平思想概论',
    day: 4,
    start: 5,
    end: 6,
    weeks: expandWeeks('1-3,6-14'),
    weeksText: '1-3、6-14周',
    campus: CAMPUS,
    room: '二号楼2321',
    teacher: '秦旺旺',
    groups: GROUP_MECH3_AGRI,
    kind: '理论'
  },
  {
    id: 'f5a',
    name: '国家安全教育',
    short: '国家安全',
    day: 5,
    start: 5,
    end: 6,
    weeks: expandWeeks('1-4'),
    weeksText: '1-4周',
    campus: CAMPUS,
    room: '一号楼1103',
    teacher: '马志强',
    groups: GROUP_MECH3_AGRI,
    kind: '理论'
  },
  {
    id: 'f5b',
    name: '机械设计',
    short: '机械设计',
    day: 5,
    start: 5,
    end: 6,
    weeks: expandWeeks('6-9'),
    weeksText: '6-9周',
    campus: CAMPUS,
    room: '多思楼203',
    teacher: '王晓暄',
    groups: GROUP_MECH_AGRI,
    kind: '理论'
  },
  {
    id: 'm7a',
    name: '大学生就业指导',
    short: '就业指导',
    day: 1,
    start: 7,
    end: 8,
    weeks: expandWeeks('1-3'),
    weeksText: '1-3周',
    campus: CAMPUS,
    room: '二号楼2421',
    teacher: '王若愚',
    groups: GROUP_AGRI_NEW,
    kind: '理论'
  },
  {
    id: 'w7a',
    name: '大学生就业指导',
    short: '就业指导',
    day: 3,
    start: 7,
    end: 8,
    weeks: expandWeeks('1-4'),
    weeksText: '1-4周',
    campus: CAMPUS,
    room: '二号楼2421',
    teacher: '王若愚',
    groups: GROUP_AGRI_NEW,
    kind: '理论'
  },
  {
    id: 'th7a',
    name: '毛泽东思想和中国特色社会主义理论体系概论',
    short: '毛泽东理论概论',
    day: 4,
    start: 7,
    end: 8,
    weeks: expandWeeks('1-4,6-8双,9-10'),
    weeksText: '1-4、6-8（双）、9-10周',
    campus: CAMPUS,
    room: '二号楼2216',
    teacher: '毋立根',
    groups: GROUP_MECH3_AGRI,
    kind: '理论'
  },
  {
    id: 'm9a',
    name: '农业机械概论',
    short: '农业机械',
    day: 1,
    start: 9,
    end: 10,
    weeks: expandWeeks('1-5,7-9'),
    weeksText: '1-5、7-9周',
    campus: CAMPUS,
    room: '二号楼2425',
    teacher: '姜彦武',
    groups: '无',
    kind: '理论'
  }
];

const EXTRAS = [
  {
    id: 'x1',
    name: '单片机与嵌入式系统应用课程设计',
    short: '单片机课程设计',
    teacher: '徐阳、朱兴亮',
    weeks: expandWeeks('1-17'),
    weeksText: '1-17周',
    kind: '实践',
    note: '共17周'
  },
  {
    id: 'x2',
    name: '机械设计课程设计',
    short: '机械设计课程设计',
    teacher: '王晓暄',
    weeks: expandWeeks('1-17'),
    weeksText: '1-17周',
    kind: '实践',
    note: '共17周'
  },
  {
    id: 'x3',
    name: '国家安全教育',
    short: '国家安全教育',
    teacher: '马志强',
    weeks: expandWeeks('7-8'),
    weeksText: '7-8周',
    kind: '课外',
    note: '网络课程'
  },
  {
    id: 'x4',
    name: '毛泽东思想和中国特色社会主义理论体系概论',
    short: '毛泽东理论概论',
    teacher: '毋立根',
    weeks: expandWeeks('1-6,8-14'),
    weeksText: '1-6、8-14周',
    kind: '课外',
    note: '网络课程'
  },
  {
    id: 'x5',
    name: '体育5',
    short: '体育5',
    teacher: '欧了盖西·卡的',
    weeks: expandWeeks('1-17'),
    weeksText: '1-17周',
    kind: '体育',
    note: '共17周'
  }
];
