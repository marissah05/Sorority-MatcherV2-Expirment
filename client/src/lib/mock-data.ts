export interface PNM {
  id: string;
  name: string;
  hometown: string;
  major: string;
  gpa: number;
  legacy: boolean;
  tags: string[];
  avatar: string;
  status: 'unmatched' | 'matched';
  matchedWith?: string; // activeId
}

export interface Active {
  id: string;
  name: string;
  role: string;
  avatar: string;
  maxMatches: number;
}

export const MOCK_PNMS: PNM[] = [
  {
    id: 'p1',
    name: 'Isabella Worthington',
    hometown: 'Charleston, SC',
    major: 'Communications',
    gpa: 3.8,
    legacy: true,
    tags: ['Philanthropy', 'Tennis'],
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    status: 'unmatched'
  },
  {
    id: 'p2',
    name: 'Sophia Sterling',
    hometown: 'Dallas, TX',
    major: 'Business',
    gpa: 4.0,
    legacy: false,
    tags: ['Cheer', 'Debate'],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    status: 'unmatched'
  },
  {
    id: 'p3',
    name: 'Olivia Kensington',
    hometown: 'Greenwich, CT',
    major: 'Art History',
    gpa: 3.6,
    legacy: true,
    tags: ['Gallery', 'Travel'],
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    status: 'unmatched'
  },
  {
    id: 'p4',
    name: 'Emma Chamberlain',
    hometown: 'Los Angeles, CA',
    major: 'Digital Media',
    gpa: 3.9,
    legacy: false,
    tags: ['Social', 'Photography'],
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
    status: 'unmatched'
  },
  {
    id: 'p5',
    name: 'Charlotte York',
    hometown: 'Manhattan, NY',
    major: 'Fine Arts',
    gpa: 3.7,
    legacy: true,
    tags: ['Art', 'Event Planning'],
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=200',
    status: 'unmatched'
  },
  {
    id: 'p6',
    name: 'Ava Montgomery',
    hometown: 'Savannah, GA',
    major: 'Fashion Marketing',
    gpa: 3.5,
    legacy: false,
    tags: ['Design', 'Volunteering'],
    avatar: 'https://images.unsplash.com/photo-1515202913167-d9538f8d61c1?auto=format&fit=crop&q=80&w=200',
    status: 'unmatched'
  },
  {
    id: 'p7',
    name: 'Mia St. James',
    hometown: 'Chicago, IL',
    major: 'Political Science',
    gpa: 3.95,
    legacy: true,
    tags: ['Law', 'Student Gov'],
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=200',
    status: 'unmatched'
  },
  {
    id: 'p8',
    name: 'Harper Lee',
    hometown: 'Nashville, TN',
    major: 'Music Business',
    gpa: 3.6,
    legacy: false,
    tags: ['Music', 'Choir'],
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    status: 'unmatched'
  }
];

export const MOCK_ACTIVES: Active[] = [
  {
    id: 'a1',
    name: 'Sarah Jenkins',
    role: 'Recruitment Chair',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    maxMatches: 3
  },
  {
    id: 'a2',
    name: 'Jessica Reynolds',
    role: 'President',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
    maxMatches: 2
  },
  {
    id: 'a3',
    name: 'Amanda Chen',
    role: 'Social Chair',
    avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656ec?auto=format&fit=crop&q=80&w=200',
    maxMatches: 2
  },
  {
    id: 'a4',
    name: 'Madison Pierce',
    role: 'Member',
    avatar: 'https://images.unsplash.com/photo-1542596594-649edbc13630?auto=format&fit=crop&q=80&w=200',
    maxMatches: 4
  }
];
