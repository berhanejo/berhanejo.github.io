const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
const originalResolveFilename = Module._resolveFilename;
const originalLoad = Module._load;

Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    return originalResolveFilename.call(
      this,
      path.join(projectRoot, request.slice(2)),
      parent,
      isMain,
      options
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

Module._load = function loadWithNativeMocks(request, parent, isMain) {
  if (request === 'expo-file-system') {
    return {
      File: class File {
        constructor(uri) {
          this.uri = uri;
        }

        async bytes() {
          return new Uint8Array();
        }
      },
    };
  }

  if (request === '@/lib/supabase') {
    return {
      supabase: {
        storage: {
          from() {
            return {
              upload: async () => ({ error: null }),
              createSignedUrls: async () => ({ data: [], error: null }),
            };
          },
        },
      },
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

require.extensions['.ts'] = function compileTypeScript(module, filename) {
  const source = require('node:fs').readFileSync(filename, 'utf8');
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;

  module._compile(output, filename);
};

const { programsByCategory, categoryOptions, checkInByCategory } = require('@/data/mock-data');
const { formatDateKey, getStartOfWeekMonday } = require('@/lib/derive/date');
const { computeGoalStats } = require('@/lib/derive/streaks');
const { computeWeekView } = require('@/lib/derive/week-view');
const { computeCoachMessage } = require('@/lib/derive/coach-message');
const { getGoalContent } = require('@/lib/derive/goal-content');
const { getCheckInCategoryContent } = require('@/lib/check-in/category-content');
const { buildAppSessionViewModel } = require('@/lib/session/app-session-view-model');
const { getErrorMessage } = require('@/lib/error-message');
const { buildCheckInPhotoPath } = require('@/lib/supabase-storage');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test('goal catalog covers every category with usable programs and check-in copy', () => {
  const optionIds = categoryOptions.map((option) => option.id);
  assert.deepEqual(optionIds.sort(), Object.keys(programsByCategory).sort());

  for (const category of optionIds) {
    assert.ok(checkInByCategory[category], `missing check-in prompt for ${category}`);
    assert.ok(getCheckInCategoryContent(category), `missing check-in screen content for ${category}`);
    assert.ok(programsByCategory[category].length >= 3, `missing catalog programs for ${category}`);

    for (const program of programsByCategory[category]) {
      assert.equal(program.category, category);
      assert.ok(program.title);
      assert.ok(program.focus);
      assert.ok(program.totalDays > 0);
      assert.ok(program.proofExamples.length > 0);
    }
  }
});

test('date helpers format local dates and find Monday week starts', () => {
  assert.equal(formatDateKey(new Date(2026, 6, 29, 14, 30)), '2026-07-29');
  assert.equal(formatDateKey(getStartOfWeekMonday(new Date(2026, 6, 29))), '2026-07-27');
  assert.equal(formatDateKey(getStartOfWeekMonday(new Date(2026, 7, 2))), '2026-07-27');
});

test('goal stats count completed, missed, current streak, and pending today correctly', () => {
  const stats = computeGoalStats({
    runStartedAt: '2026-07-25',
    durationDays: 30,
    checkInDates: ['2026-07-25', '2026-07-27', '2026-07-28'],
    today: new Date(2026, 6, 29, 12),
  });

  assert.equal(stats.elapsedDays, 5);
  assert.equal(stats.relevantDays, 4);
  assert.equal(stats.completedDays, 3);
  assert.equal(stats.missedDays, 1);
  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.bestStreak, 2);
  assert.equal(stats.todayStatus, 'pending');
  assert.equal(stats.hasCheckedInToday, false);
});

test('goal stats mark today done and include it in completion rate', () => {
  const stats = computeGoalStats({
    runStartedAt: '2026-07-27',
    durationDays: 7,
    checkInDates: ['2026-07-27', '2026-07-28', '2026-07-29'],
    today: new Date(2026, 6, 29, 12),
  });

  assert.equal(stats.relevantDays, 3);
  assert.equal(stats.completionRate, 100);
  assert.equal(stats.currentStreak, 3);
  assert.equal(stats.todayStatus, 'done');
});

test('week view maps past misses, today pending, future pending, and done days', () => {
  const week = computeWeekView({
    today: new Date(2026, 6, 29, 12),
    totalActiveGoals: 2,
    isDateFullyDone: (dateKey) => dateKey === '2026-07-27',
  });

  assert.deepEqual(
    week.map((day) => [day.label, day.dateKey, day.status, day.isToday]),
    [
      ['Mon', '2026-07-27', 'done', false],
      ['Tue', '2026-07-28', 'missed', false],
      ['Wed', '2026-07-29', 'pending', true],
      ['Thu', '2026-07-30', 'pending', false],
      ['Fri', '2026-07-31', 'pending', false],
      ['Sat', '2026-08-01', 'pending', false],
      ['Sun', '2026-08-02', 'pending', false],
    ]
  );
});

test('coach messages prioritize streak praise, reentry, callout, and reminders', () => {
  assert.equal(
    computeCoachMessage({
      categoryLabel: 'Fitness',
      goalTitle: '30 Days Morning Walks',
      todayStatus: 'done',
      currentStreak: 3,
      yesterdayStatus: 'done',
      recentMissedDays: 0,
      completionRate: 100,
    }).type,
    'streak_praise'
  );

  assert.equal(
    computeCoachMessage({
      categoryLabel: 'Reading',
      goalTitle: '30 Days Reading Habit',
      todayStatus: 'pending',
      currentStreak: 0,
      yesterdayStatus: 'missed',
      recentMissedDays: 1,
      completionRate: 40,
    }).type,
    'reentry'
  );

  assert.equal(
    computeCoachMessage({
      categoryLabel: 'Learning',
      goalTitle: '30 Days Deep Work',
      todayStatus: 'pending',
      currentStreak: 0,
      yesterdayStatus: 'done',
      recentMissedDays: 2,
      completionRate: 60,
    }).type,
    'callout'
  );
});

test('goal content returns catalog copy for presets and fallback copy for custom goals', () => {
  const catalogProgram = programsByCategory.fitness[0];
  assert.deepEqual(
    getGoalContent({
      category: catalogProgram.category,
      title: catalogProgram.title,
      isCustom: false,
    }),
    {
      categoryLabel: catalogProgram.categoryLabel,
      focus: catalogProgram.focus,
      proofLabel: catalogProgram.proofLabel,
      proofExamples: catalogProgram.proofExamples,
      nextReminder: catalogProgram.nextReminder,
    }
  );

  assert.equal(
    getGoalContent({
      category: 'mindset',
      title: 'Custom reset',
      isCustom: true,
    }).categoryLabel,
    'Mindset'
  );
});

test('error and storage helpers produce stable outputs', () => {
  assert.equal(getErrorMessage(new Error('Readable failure'), 'Fallback'), 'Readable failure');
  assert.equal(getErrorMessage({ message: 'Plain object failure' }, 'Fallback'), 'Plain object failure');
  assert.equal(getErrorMessage(null, 'Fallback'), 'Fallback');
  assert.equal(buildCheckInPhotoPath('group-1', 'user-1', 'check-1'), 'group-1/user-1/check-1.jpg');
});

test('app session view model preserves the main dashboard and group feed shape', () => {
  const fitnessProgram = programsByCategory.fitness[0];
  const learningProgram = programsByCategory.learning[0];
  const today = new Date(2026, 6, 29, 12);
  const goals = [
    {
      id: 'goal-1',
      userId: 'user-1',
      groupId: 'group-1',
      category: fitnessProgram.category,
      title: fitnessProgram.title,
      isCustom: false,
      durationDays: fitnessProgram.totalDays,
      isActive: true,
      isArchived: false,
      runNumber: 1,
      runStartedAt: '2026-07-27',
      createdAt: '2026-07-27T00:00:00Z',
    },
    {
      id: 'goal-2',
      userId: 'user-1',
      groupId: 'group-1',
      category: learningProgram.category,
      title: learningProgram.title,
      isCustom: false,
      durationDays: learningProgram.totalDays,
      isActive: true,
      isArchived: false,
      runNumber: 1,
      runStartedAt: '2026-07-29',
      createdAt: '2026-07-29T00:00:00Z',
    },
  ];
  const groupGoals = [
    ...goals,
    {
      id: 'goal-3',
      userId: 'user-2',
      groupId: 'group-1',
      category: 'reading',
      title: programsByCategory.reading[0].title,
      isCustom: false,
      durationDays: 30,
      isActive: true,
      isArchived: false,
      runNumber: 1,
      runStartedAt: '2026-07-29',
      createdAt: '2026-07-29T00:00:00Z',
    },
  ];
  const checkIns = [
    {
      id: 'check-1',
      userId: 'user-1',
      goalId: 'goal-1',
      groupId: 'group-1',
      runNumber: 1,
      checkInDate: '2026-07-28',
      caption: 'Yesterday done',
      photoPath: 'group-1/user-1/check-1.jpg',
      createdAt: '2026-07-28T18:00:00Z',
      goalTitle: fitnessProgram.title,
      goalCategory: fitnessProgram.category,
    },
    {
      id: 'check-2',
      userId: 'user-1',
      goalId: 'goal-1',
      groupId: 'group-1',
      runNumber: 1,
      checkInDate: '2026-07-29',
      caption: 'Today done',
      photoPath: 'group-1/user-1/check-2.jpg',
      createdAt: '2026-07-29T18:00:00Z',
      goalTitle: fitnessProgram.title,
      goalCategory: fitnessProgram.category,
    },
  ];
  const groupCheckIns = [
    ...checkIns,
    {
      id: 'check-3',
      userId: 'user-2',
      goalId: 'goal-3',
      groupId: 'group-1',
      runNumber: 1,
      checkInDate: '2026-07-29',
      caption: 'Read 20 pages',
      photoPath: 'group-1/user-2/check-3.jpg',
      createdAt: '2026-07-29T19:00:00Z',
      goalTitle: programsByCategory.reading[0].title,
      goalCategory: 'reading',
    },
  ];

  const viewModel = buildAppSessionViewModel({
    user: {
      id: 'user-1',
      email: 'ava@example.com',
      user_metadata: { display_name: 'Ava Pulse' },
    },
    userId: 'user-1',
    groups: [
      { id: 'group-1', name: 'Consistency Crew', ownerId: 'user-1', role: 'owner' },
      { id: 'group-2', name: 'Plan B', ownerId: 'user-3', role: 'member' },
    ],
    activeGroupId: 'group-1',
    goals,
    checkIns,
    checkInEvents: [
      {
        id: 'event-1',
        checkInId: 'check-2',
        userId: 'user-1',
        eventType: 'updated',
        caption: 'Today done, edited',
        photoPath: 'group-1/user-1/check-2.jpg',
        createdAt: '2026-07-29T20:00:00Z',
      },
    ],
    groupMembersRaw: [
      { userId: 'user-1', displayName: 'Ava Pulse', role: 'owner' },
      { userId: 'user-2', displayName: 'Ben', role: 'member' },
    ],
    groupGoals,
    groupCheckIns,
    signedUrlByPath: {
      'group-1/user-1/check-2.jpg': 'https://example.test/user-check-2.jpg',
      'group-1/user-2/check-3.jpg': 'https://example.test/user-check-3.jpg',
    },
    maxActivePrograms: 3,
    primaryGoalId: 'goal-1',
    today,
  });

  assert.equal(viewModel.currentUser.name, 'Ava Pulse');
  assert.equal(viewModel.groupName, 'Consistency Crew');
  assert.equal(viewModel.activeGroupId, 'group-1');
  assert.deepEqual(
    viewModel.groupSummaries.map((group) => [group.name, group.isActive]),
    [
      ['Consistency Crew', true],
      ['Plan B', false],
    ]
  );
  assert.equal(viewModel.currentProgram.id, 'goal-1');
  assert.equal(viewModel.activePrograms.length, 2);
  assert.equal(viewModel.completedGoalsToday, 1);
  assert.equal(viewModel.completionPercentToday, 50);
  assert.equal(viewModel.todayOverallStatus, 'pending');
  assert.equal(viewModel.hasCheckedInToday, true);
  assert.deepEqual(
    viewModel.groupMembers.map((member) => member.name),
    ['You', 'Ben']
  );
  assert.deepEqual(
    viewModel.todayChallengeStatuses.map((item) => [item.goalId, item.userName, item.status]),
    [
      ['goal-1', 'You', 'done'],
      ['goal-2', 'You', 'pending'],
      ['goal-3', 'Ben', 'done'],
    ]
  );
  assert.equal(viewModel.latestCheckInCaption, 'Today done');
  assert.equal(viewModel.latestCheckInImageUri, 'https://example.test/user-check-2.jpg');
  assert.equal(viewModel.groupActivityFeed[0].id, 'check-3');
  assert.equal(viewModel.groupActivityFeed[0].imageUri, 'https://example.test/user-check-3.jpg');
  assert.equal(viewModel.historyItems[0].type, 'updated');
  assert.equal(viewModel.historyItems[0].caption, 'Today done, edited');
});

test('web tab navigation avoids phone bottom bars and clipped labels', () => {
  const tabLayoutSource = fs.readFileSync(path.join(projectRoot, 'app/(tabs)/_layout.tsx'), 'utf8');
  const screenContainerSource = fs.readFileSync(
    path.join(projectRoot, 'components/screen-container.tsx'),
    'utf8'
  );
  const postExportSource = fs.readFileSync(path.join(projectRoot, 'scripts/post-export-web.js'), 'utf8');

  assert.ok(
    tabLayoutSource.includes("top: 'calc(8px + env(safe-area-inset-top))'"),
    'web tab bar should use the top safe area instead of the phone bottom edge'
  );
  assert.ok(
    tabLayoutSource.includes('isWeb ? styles.tabBarWrapTop : styles.tabBarWrapBottom'),
    'web and native tab positions should be separated'
  );
  assert.ok(
    !tabLayoutSource.includes('tabBarLabel') && !tabLayoutSource.includes('tabBarShowLabel'),
    'custom app tab bar should not render text labels that can be clipped'
  );
  assert.ok(tabLayoutSource.includes('height: 36'), 'tab bar should stay compact on small screens');
  assert.ok(screenContainerSource.includes("Platform.OS === 'web' ? 64"), 'web screens need top nav clearance');
  assert.ok(postExportSource.includes('100dvh'), 'web export should account for mobile browser viewport height');
  assert.ok(
    postExportSource.includes('viewport-fit=cover'),
    'web export should preserve safe-area viewport support'
  );
});

console.log('Smoke tests passed');
