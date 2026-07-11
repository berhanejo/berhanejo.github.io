export type MemberStatus = 'done' | 'pending' | 'missed';
export type GoalCategory = 'fitness' | 'learning' | 'reading' | 'mindset';
export type ProofType = 'photo' | 'video' | 'text' | 'screenshot';

export type GroupMember = {
  id: string;
  name: string;
  status: MemberStatus;
};

export type MockGroupMember = {
  id: string;
  name: string;
};

export type MockCheckIn = {
  date: string;
  userId: string;
  programId: string;
  note: string;
  submittedAt?: string;
};

export type MockUser = {
  id: string;
  name: string;
  goal: string;
  groupName: string;
  groupMembers: MockGroupMember[];
  selectedCategoryIds: GoalCategory[];
  selectedProgramIds: string[];
  activeProgramIds: string[];
};

export type Program = {
  id: string;
  title: string;
  category: GoalCategory;
  categoryLabel: string;
  focus: string;
  day: number;
  totalDays: number;
  streak: number;
  completionRate: number;
  nextReminder: string;
  proofLabel: string;
  proofExamples: string[];
};

export type CheckIn = {
  status: MemberStatus;
  prompt: string;
  instructions: string;
  captionPlaceholder: string;
  ctaLabel: string;
};

export const programsByCategory: Record<GoalCategory, Program[]> = {
  fitness: [
    {
      id: 'fitness-1',
      title: '30 Days Morning Walks',
      category: 'fitness',
      categoryLabel: 'Fitness',
      focus: 'Build a simple daily movement routine with one consistent walk and visible proof.',
      day: 12,
      totalDays: 30,
      streak: 6,
      completionRate: 84,
      nextReminder: '07:00',
      proofLabel: 'Proof',
      proofExamples: ['workout photo', 'movement clip', 'step screenshot', 'gym mirror shot'],
    },
    {
      id: 'fitness-2',
      title: '45 Days Strength Sessions',
      category: 'fitness',
      categoryLabel: 'Fitness',
      focus: 'Stay accountable to short strength sessions and keep momentum visible each day.',
      day: 9,
      totalDays: 45,
      streak: 4,
      completionRate: 78,
      nextReminder: '18:30',
      proofLabel: 'Proof',
      proofExamples: ['workout photo', 'set list screenshot', 'movement clip', 'post-session mirror shot'],
    },
    {
      id: 'fitness-3',
      title: '21 Days Mobility Reset',
      category: 'fitness',
      categoryLabel: 'Fitness',
      focus: 'Use short mobility sessions to rebuild consistency without overcomplicating the routine.',
      day: 7,
      totalDays: 21,
      streak: 5,
      completionRate: 86,
      nextReminder: '20:00',
      proofLabel: 'Proof',
      proofExamples: ['stretching photo', 'mobility clip', 'routine screenshot', 'floor setup photo'],
    },
  ],
  learning: [
    {
      id: 'learning-1',
      title: '30 Days Deep Work',
      category: 'learning',
      categoryLabel: 'Learning',
      focus: 'Build a daily study habit with one focused session and visible proof.',
      day: 12,
      totalDays: 30,
      streak: 6,
      completionRate: 84,
      nextReminder: '20:00',
      proofLabel: 'Proof',
      proofExamples: ['study desk photo', 'course progress screenshot', 'workbook page', 'short completion clip'],
    },
    {
      id: 'learning-2',
      title: '60 Days Language Practice',
      category: 'learning',
      categoryLabel: 'Learning',
      focus: 'Practice a language daily and make progress visible through simple proof.',
      day: 18,
      totalDays: 60,
      streak: 10,
      completionRate: 88,
      nextReminder: '19:00',
      proofLabel: 'Proof',
      proofExamples: ['lesson screenshot', 'notes page', 'vocabulary card', 'study setup photo'],
    },
    {
      id: 'learning-3',
      title: '21 Days Skill Sprint',
      category: 'learning',
      categoryLabel: 'Learning',
      focus: 'Ship one focused learning block every day around a single skill.',
      day: 5,
      totalDays: 21,
      streak: 3,
      completionRate: 80,
      nextReminder: '21:00',
      proofLabel: 'Proof',
      proofExamples: ['project screenshot', 'practice notes', 'tutorial checkpoint', 'desk photo'],
    },
  ],
  reading: [
    {
      id: 'reading-1',
      title: '30 Days Reading Habit',
      category: 'reading',
      categoryLabel: 'Reading',
      focus: 'Finish a small daily reading block and keep your progress visible every day.',
      day: 14,
      totalDays: 30,
      streak: 8,
      completionRate: 87,
      nextReminder: '21:30',
      proofLabel: 'Proof',
      proofExamples: ['book page photo', 'reading tracker screenshot', 'highlight note', 'short reflection note'],
    },
    {
      id: 'reading-2',
      title: '21 Days Nonfiction Focus',
      category: 'reading',
      categoryLabel: 'Reading',
      focus: 'Read a nonfiction chapter daily and capture one key takeaway as proof.',
      day: 6,
      totalDays: 21,
      streak: 4,
      completionRate: 82,
      nextReminder: '20:30',
      proofLabel: 'Proof',
      proofExamples: ['chapter photo', 'kindle screenshot', 'margin note', 'takeaway summary'],
    },
    {
      id: 'reading-3',
      title: '45 Days Fiction Evenings',
      category: 'reading',
      categoryLabel: 'Reading',
      focus: 'Make evening reading a stable ritual with one visible check-in every night.',
      day: 16,
      totalDays: 45,
      streak: 11,
      completionRate: 90,
      nextReminder: '22:00',
      proofLabel: 'Proof',
      proofExamples: ['book cover photo', 'page snapshot', 'reading tracker entry', 'short note'],
    },
  ],
  mindset: [
    {
      id: 'mindset-1',
      title: '30 Days Morning Reset',
      category: 'mindset',
      categoryLabel: 'Mindset',
      focus: 'Create a calm daily reset ritual with a short reflection and visible proof.',
      day: 10,
      totalDays: 30,
      streak: 7,
      completionRate: 85,
      nextReminder: '08:00',
      proofLabel: 'Proof',
      proofExamples: ['journal photo', 'reset checklist', 'reflection note', 'habit tracker screenshot'],
    },
    {
      id: 'mindset-2',
      title: '21 Days Gratitude',
      category: 'mindset',
      categoryLabel: 'Mindset',
      focus: 'Build a short gratitude practice and make completion visible to your group.',
      day: 8,
      totalDays: 21,
      streak: 5,
      completionRate: 83,
      nextReminder: '21:00',
      proofLabel: 'Proof',
      proofExamples: ['journal entry photo', 'gratitude note', 'checklist screenshot', 'reflection card'],
    },
    {
      id: 'mindset-3',
      title: '45 Days Evening Reflection',
      category: 'mindset',
      categoryLabel: 'Mindset',
      focus: 'End each day with a brief reset and keep the streak visible.',
      day: 17,
      totalDays: 45,
      streak: 9,
      completionRate: 81,
      nextReminder: '22:15',
      proofLabel: 'Proof',
      proofExamples: ['reflection note', 'journal photo', 'reset checklist', 'mood tracker screenshot'],
    },
  ],
};

export const defaultProgram = programsByCategory.learning[0];

export const checkInByCategory: Record<GoalCategory, CheckIn> = {
  fitness: {
    status: 'pending',
    prompt: 'Share proof that you completed today’s movement or training session.',
    instructions: 'Post one clear piece of proof so your group can verify that today is complete.',
    captionPlaceholder:
      'Example: Finished a 35 minute walk and hit my step goal before breakfast.',
    ctaLabel: 'Post check-in',
  },
  learning: {
    status: 'pending',
    prompt: 'Share proof that you finished today’s focused learning block.',
    instructions: 'Post one clear piece of proof so your group can verify that today is complete.',
    captionPlaceholder:
      'Example: Finished 40 minutes of focused Spanish practice and completed lesson 3.',
    ctaLabel: 'Post check-in',
  },
  reading: {
    status: 'pending',
    prompt: 'Share proof that you completed today’s reading session.',
    instructions: 'Post one clear piece of proof so your group can verify that today is complete.',
    captionPlaceholder:
      'Example: Read 22 pages and wrote down one idea I want to remember.',
    ctaLabel: 'Post check-in',
  },
  mindset: {
    status: 'pending',
    prompt: 'Share proof that you completed today’s reset or reflection practice.',
    instructions: 'Post one clear piece of proof so your group can verify that today is complete.',
    captionPlaceholder:
      'Example: Finished my evening reset checklist and wrote a short reflection.',
    ctaLabel: 'Post check-in',
  },
};

export const categoryOptions = [
  {
    id: 'fitness',
    label: 'Fitness / Movement',
    description: 'Build momentum with movement, training, or simple daily activity.',
  },
  {
    id: 'learning',
    label: 'Learning',
    description: 'Grow a focused study rhythm around one skill or topic.',
  },
  {
    id: 'reading',
    label: 'Reading',
    description: 'Create a sustainable reading habit with visible daily progress.',
  },
  {
    id: 'mindset',
    label: 'Mindset',
    description: 'Improve your daily reset, reflection, and mental clarity routines.',
  },
] as const;

export const coachMessage = {
  title: 'Consistency beats intensity.',
  body: 'One clear check-in keeps the routine alive. Finish today, post proof, and protect the streak.',
};

export const mockUsers: MockUser[] = [
  {
    id: 'mock-alex',
    name: 'Alex Carter',
    goal: 'Stay consistent with daily focused learning for 30 days',
    groupName: 'Daily Builders',
    groupMembers: [
      { id: 'alex-1', name: 'Emma' },
      { id: 'alex-2', name: 'Noah' },
      { id: 'alex-3', name: 'Lina' },
    ],
    selectedCategoryIds: ['learning', 'mindset'],
    selectedProgramIds: ['learning-1', 'mindset-1'],
    activeProgramIds: ['learning-1'],
  },
  {
    id: 'mock-samira',
    name: 'Samira Khan',
    goal: 'Build a steady fitness + reading routine with visible daily proof',
    groupName: 'Momentum Circle',
    groupMembers: [
      { id: 'samira-1', name: 'Mia' },
      { id: 'samira-2', name: 'Jonas' },
      { id: 'samira-3', name: 'Levi' },
    ],
    selectedCategoryIds: ['fitness', 'reading'],
    selectedProgramIds: ['fitness-1', 'reading-1'],
    activeProgramIds: ['fitness-1', 'reading-1'],
  },
  {
    id: 'mock-luca',
    name: 'Luca Meyer',
    goal: 'Improve mindset consistency and finish one reflection every evening',
    groupName: 'Reset Crew',
    groupMembers: [
      { id: 'luca-1', name: 'Nora' },
      { id: 'luca-2', name: 'Kai' },
      { id: 'luca-3', name: 'Sven' },
    ],
    selectedCategoryIds: ['mindset'],
    selectedProgramIds: ['mindset-2'],
    activeProgramIds: ['mindset-2'],
  },
];

export const mockCheckIns: MockCheckIn[] = [
  {
    date: '2026-03-18',
    userId: 'mock-alex',
    programId: 'learning-1',
    note: 'Focused 45 minutes on lesson 3.',
    submittedAt: '2026-03-18T19:40:00.000Z',
  },
  {
    date: '2026-03-19',
    userId: 'mock-alex',
    programId: 'learning-1',
    note: 'Finished review and summary.',
    submittedAt: '2026-03-19T20:05:00.000Z',
  },
  {
    date: '2026-03-18',
    userId: 'mock-samira',
    programId: 'fitness-1',
    note: 'Walked 35 minutes before work.',
    submittedAt: '2026-03-18T07:10:00.000Z',
  },
  {
    date: '2026-03-20',
    userId: 'mock-samira',
    programId: 'reading-1',
    note: 'Read 24 pages and captured highlights.',
    submittedAt: '2026-03-20T21:20:00.000Z',
  },
  {
    date: '2026-03-20',
    userId: 'mock-luca',
    programId: 'mindset-2',
    note: 'Completed gratitude journaling.',
    submittedAt: '2026-03-20T21:45:00.000Z',
  },
  {
    date: '2026-03-21',
    userId: 'alex-1',
    programId: 'learning-1',
    note: 'Group check-in complete.',
  },
  {
    date: '2026-03-21',
    userId: 'samira-2',
    programId: 'fitness-1',
    note: 'Evening training done.',
  },
];
