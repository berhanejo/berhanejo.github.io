export type GoalCategory = 'fitness' | 'learning' | 'reading' | 'mindset';

export type Program = {
  id: string;
  title: string;
  category: GoalCategory;
  categoryLabel: string;
  focus: string;
  totalDays: number;
  nextReminder: string;
  proofLabel: string;
  proofExamples: string[];
};

export type CheckInPrompt = {
  status: 'done' | 'pending';
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
      totalDays: 30,
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
      totalDays: 45,
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
      totalDays: 21,
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
      totalDays: 30,
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
      totalDays: 60,
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
      totalDays: 21,
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
      totalDays: 30,
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
      totalDays: 21,
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
      totalDays: 45,
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
      totalDays: 30,
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
      totalDays: 21,
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
      totalDays: 45,
      nextReminder: '22:15',
      proofLabel: 'Proof',
      proofExamples: ['reflection note', 'journal photo', 'reset checklist', 'mood tracker screenshot'],
    },
  ],
};

export const checkInByCategory: Record<GoalCategory, CheckInPrompt> = {
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
