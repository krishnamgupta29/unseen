export interface Profile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarGradient: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  highlights: string[];
  isFollowing?: boolean;
  moodTag?: string;
}

export interface Post {
  id: string;
  profileId: string;
  type: 'text' | 'voice';
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  waveform?: number[];
  duration?: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isMe: boolean;
  type?: 'text' | 'voice';
  waveform?: number[];
  duration?: string;
}

export interface Conversation {
  id: string;
  profileId: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: Message[];
}

export interface Notification {
  id: string;
  type: 'reaction' | 'message' | 'reply' | 'follow';
  content: string;
  timestamp: string;
  read: boolean;
  profileId: string;
  postId?: string;
  conversationId?: string;
}

export interface Comment {
  id: string;
  postId: string;
  content: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
  parentId?: string;
}

export const initialComments: Record<string, Comment[]> = {
  '1': [
    { id: 'c1', postId: '1', content: "I relate to this more than I expected.", timestamp: '1m ago', likes: 12 },
    { id: 'c2', postId: '1', content: "Kuch cheezein bolna mushkil hota hai, likhna thoda easy.", timestamp: '3m ago', likes: 8 },
    { id: 'c3', postId: '1', content: "You're not alone in this.", timestamp: '5m ago', likes: 23 },
  ],
  '2': [
    { id: 'c4', postId: '2', content: "Your voice carries so much emotion. Felt every word.", timestamp: '2m ago', likes: 15 },
    { id: 'c5', postId: '2', content: "Raat ko sunna chahiye tha ye... hit different hota.", timestamp: '8m ago', likes: 7 },
  ],
  '3': [
    { id: 'c6', postId: '3', content: "Same story yaar. Apna dhyan rakhna seekhna padega.", timestamp: '10m ago', likes: 19 },
    { id: 'c7', postId: '3', content: "Sending you strength. You matter too.", timestamp: '15m ago', likes: 11 },
    { id: 'c8', postId: '3', content: "Dil se nikli baat hai ye.", timestamp: '20m ago', likes: 6 },
  ],
  '4': [
    { id: 'c9', postId: '4', content: "The mask gets heavy. It's okay to put it down sometimes.", timestamp: '5m ago', likes: 34 },
    { id: 'c10', postId: '4', content: "Real ones stay. Trust the process.", timestamp: '12m ago', likes: 21 },
    { id: 'c11', postId: '4', content: "Ye padh ke aankhein bhar aayi. Thank you for being so honest.", timestamp: '18m ago', likes: 16 },
    { id: 'c12', postId: '4', content: "Being vulnerable is actually being strong.", timestamp: '25m ago', likes: 9 },
  ],
  '5': [
    { id: 'c13', postId: '5', content: "Voice notes hit different at 2am.", timestamp: '1h ago', likes: 28 },
    { id: 'c14', postId: '5', content: "Kuch baatein text mein nahi aa paati.", timestamp: '1h ago', likes: 14 },
  ],
  '6': [
    { id: 'c15', postId: '6', content: "Crowd mein akela feel karna... relatable hai bahut.", timestamp: '30m ago', likes: 22 },
    { id: 'c16', postId: '6', content: "Surface level connections are exhausting.", timestamp: '45m ago', likes: 17 },
  ],
  '7': [
    { id: 'c17', postId: '7', content: "3am thoughts are the most honest ones.", timestamp: '2h ago', likes: 31 },
  ],
  '8': [
    { id: 'c18', postId: '8', content: "Jo nahi keh paate, woh yahan likh dete hain. Beautiful.", timestamp: '3h ago', likes: 25 },
    { id: 'c19', postId: '8', content: "Understanding without knowing... that's what this place is.", timestamp: '4h ago', likes: 18 },
  ],
  '9': [
    { id: 'c20', postId: '9', content: "Needed to hear this today. Progress is progress.", timestamp: '1h ago', likes: 42 },
    { id: 'c21', postId: '9', content: "Some days you're healing, some days you're surviving. Both count.", timestamp: '2h ago', likes: 37 },
    { id: 'c22', postId: '9', content: "Getting up everyday IS a win. Don't forget that.", timestamp: '3h ago', likes: 29 },
  ],
}

export const moodTags = [
  '✨ feeling reflective',
  '🌙 late night thoughts',
  '💭 overthinking again',
  '🤍 healing slowly',
  '🖤 in my feels',
  '☁️ floating somewhere',
  '🌧️ heavy heart today',
  '🔥 raw and unfiltered',
  '💫 hopeful',
  '🍃 letting go',
];

export const profileThemes = [
  { id: 'violet', gradient: 'from-violet-600 via-purple-600 to-indigo-600', label: 'Violet Dream' },
  { id: 'ocean', gradient: 'from-cyan-400 via-blue-500 to-indigo-600', label: 'Ocean Deep' },
  { id: 'sunset', gradient: 'from-rose-400 via-pink-500 to-purple-600', label: 'Sunset Glow' },
  { id: 'ember', gradient: 'from-amber-400 via-orange-500 to-red-500', label: 'Ember Warm' },
  { id: 'forest', gradient: 'from-emerald-400 via-teal-500 to-cyan-600', label: 'Forest Calm' },
  { id: 'midnight', gradient: 'from-slate-400 via-zinc-500 to-neutral-600', label: 'Midnight Grey' },
  { id: 'aurora', gradient: 'from-indigo-400 via-purple-500 to-pink-500', label: 'Aurora' },
  { id: 'sky', gradient: 'from-sky-400 via-blue-500 to-indigo-600', label: 'Clear Sky' },
];

export const profiles: Profile[] = [
  {
    id: '1',
    username: 'raat_ki_baat',
    displayName: 'Raat Ki Baat',
    bio: 'I keep saying I\'m fine, but honestly? Not really. Yahan pe thoda honest ho paata hoon.',
    avatarGradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    postsCount: 47,
    followersCount: 2341,
    followingCount: 189,
    highlights: ['raatein', 'khamoshi', '3am'],
    isFollowing: false,
    moodTag: '🌙 late night thoughts',
  },
  {
    id: '2',
    username: 'silent_dil',
    displayName: 'Silent Dil',
    bio: 'Dil heavy hai, words light rakhta hoon. Some feelings are just easier to write than say out loud.',
    avatarGradient: 'from-cyan-400 via-blue-500 to-indigo-600',
    postsCount: 82,
    followersCount: 5672,
    followingCount: 234,
    highlights: ['confessions', 'neendein'],
    isFollowing: true,
    moodTag: '🖤 in my feels',
  },
  {
    id: '3',
    username: 'khamosh_awaz',
    displayName: 'Khamosh Awaz',
    bio: 'Truth feels a bit easier here. No judgments, no filters, just real talk.',
    avatarGradient: 'from-rose-400 via-pink-500 to-purple-600',
    postsCount: 31,
    followersCount: 1289,
    followingCount: 156,
    highlights: ['raw', 'unfiltered'],
    isFollowing: false,
    moodTag: '🔥 raw and unfiltered',
  },
  {
    id: '4',
    username: 'anjaana_insaan',
    displayName: 'Anjaana Insaan',
    bio: 'Everyone says "share karo" but who actually listens? Finding my voice in this anonymous space.',
    avatarGradient: 'from-amber-400 via-orange-500 to-red-500',
    postsCount: 65,
    followersCount: 3456,
    followingCount: 278,
    highlights: ['sach', 'raaz', 'healing'],
    isFollowing: false,
    moodTag: '💭 overthinking again',
  },
  {
    id: '5',
    username: 'dooba_hua',
    displayName: 'Dooba Hua',
    bio: 'What I can\'t say out loud, I write here. Jo nahi keh paata, woh yahan likh deta hoon.',
    avatarGradient: 'from-emerald-400 via-teal-500 to-cyan-600',
    postsCount: 93,
    followersCount: 8901,
    followingCount: 312,
    highlights: ['sapne', 'yaadein'],
    isFollowing: true,
    moodTag: '✨ feeling reflective',
  },
  {
    id: '6',
    username: 'bekhabar_rooh',
    displayName: 'Bekhabar Rooh',
    bio: 'Identity hidden, feelings not. Pehchaan chhupi hai, jazbaat nahi.',
    avatarGradient: 'from-slate-400 via-zinc-500 to-neutral-600',
    postsCount: 28,
    followersCount: 987,
    followingCount: 145,
    highlights: ['sachchi', 'imaandaar'],
    isFollowing: false,
    moodTag: '☁️ floating somewhere',
  },
  {
    id: '7',
    username: 'tanha_musafir',
    displayName: 'Tanha Musafir',
    bio: 'Traveling alone but realizing everyone\'s story is kinda the same. Safar akela hai, kahani ek.',
    avatarGradient: 'from-indigo-400 via-purple-500 to-pink-500',
    postsCount: 54,
    followersCount: 4521,
    followingCount: 201,
    highlights: ['safar', 'raaste'],
    isFollowing: false,
    moodTag: '🍃 letting go',
  },
  {
    id: '8',
    username: 'gehra_sochta',
    displayName: 'Gehra Sochta',
    bio: 'Overthinking is either my hobby or my curse, still figuring out which one.',
    avatarGradient: 'from-sky-400 via-blue-500 to-indigo-600',
    postsCount: 76,
    followersCount: 6234,
    followingCount: 167,
    highlights: ['thoughts', 'late-night'],
    isFollowing: true,
    moodTag: '💭 overthinking again',
  },
];

const generateWaveform = (): number[] => {
  return Array.from({ length: 50 }, () => Math.random() * 0.8 + 0.2);
};

export const posts: Post[] = [
  {
    id: '1',
    profileId: '1',
    type: 'text',
    content: `I keep pretending everything's fine. Got so used to it that when someone genuinely asks "how are you?", I don't even know how to answer honestly anymore.

Like... I'm okay? But also not okay? 
It's confusing even to me.`,
    timestamp: '2m ago',
    likes: 234,
    comments: 45,
  },
  {
    id: '2',
    profileId: '2',
    type: 'voice',
    content: 'Late night confession... just listen',
    timestamp: '15m ago',
    likes: 567,
    comments: 89,
    waveform: generateWaveform(),
    duration: '1:47',
  },
  {
    id: '3',
    profileId: '3',
    type: 'text',
    content: `Kisi ko hurt nahi karna tha, but somehow ended up hurting myself instead.

Story of my life, honestly. Taking care of everyone except me.`,
    timestamp: '1h ago',
    likes: 891,
    comments: 123,
  },
  {
    id: '4',
    profileId: '4',
    type: 'text',
    content: `Being strong is exhausting.

Constantly managing everything, everyone, myself... sometimes I wonder how long I can keep wearing this mask.

But also scared to take it off. What if nobody stays when they see the real me?`,
    timestamp: '2h ago',
    likes: 1456,
    comments: 167,
  },
  {
    id: '5',
    profileId: '5',
    type: 'voice',
    content: 'Some things sound better in voice than text',
    timestamp: '3h ago',
    likes: 1234,
    comments: 201,
    waveform: generateWaveform(),
    duration: '2:23',
  },
  {
    id: '6',
    profileId: '6',
    type: 'text',
    content: `Feeling alone even in a crowd.

At parties, with friends, with family... there's always this gap. Everything seems fine on the surface but something's just... off.`,
    timestamp: '4h ago',
    likes: 678,
    comments: 92,
  },
  {
    id: '7',
    profileId: '1',
    type: 'voice',
    content: '3am thoughts... nobody listens anyway',
    timestamp: '5h ago',
    likes: 345,
    comments: 56,
    waveform: generateWaveform(),
    duration: '3:15',
  },
  {
    id: '8',
    profileId: '7',
    type: 'text',
    content: `I never complain to anyone.
But at night, when the phone's on the side table...
feels like so much was left unsaid.

There's so much inside that just doesn't come out. Maybe that's why I'm here... where nobody knows me, but somehow understands.`,
    timestamp: '6h ago',
    likes: 789,
    comments: 134,
  },
  {
    id: '9',
    profileId: '8',
    type: 'text',
    content: `Healing isn't linear. Learned this the hard way.

Some days feel okay, some days feel like day one all over again. Both are valid. Progress is slow but it's there.

Gotta remind myself that just getting up everyday is also a win.`,
    timestamp: '8h ago',
    likes: 1567,
    comments: 245,
  },
  {
    id: '10',
    profileId: '4',
    type: 'voice',
    content: 'A voice note for my future self',
    timestamp: '12h ago',
    likes: 923,
    comments: 178,
    waveform: generateWaveform(),
    duration: '4:02',
  },
  {
    id: '11',
    profileId: '5',
    type: 'text',
    content: `Being strong becomes an act after a while.
And the tiredness just builds up from staying silent.

Sometimes all I need is someone to say "It's okay, you don't have to talk. I'm here."`,
    timestamp: '1d ago',
    likes: 2341,
    comments: 389,
  },
  {
    id: '12',
    profileId: '6',
    type: 'text',
    content: `Anonymity gave me the courage I never had in real life.

Here I can say things I've never told anyone. Weird how I can be more honest with strangers than with people I actually know.`,
    timestamp: '1d ago',
    likes: 567,
    comments: 78,
  },
  {
    id: '13',
    profileId: '7',
    type: 'text',
    content: `"Share karo, halka lagega" everyone says.
But share with whom?

Everyone has their own stuff going on. Don't wanna be a burden. So I come here instead... where nobody judges.`,
    timestamp: '1d ago',
    likes: 1876,
    comments: 234,
  },
  {
    id: '14',
    profileId: '8',
    type: 'voice',
    content: 'Late night thoughts... put on your earphones',
    timestamp: '2d ago',
    likes: 1123,
    comments: 156,
    waveform: generateWaveform(),
    duration: '2:45',
  },
  {
    id: '15',
    profileId: '3',
    type: 'text',
    content: `Ever thought about how many people see you as their "strong friend"?

And who's YOUR strong friend?

I thought about it... and couldn't find an answer.`,
    timestamp: '2d ago',
    likes: 2567,
    comments: 312,
  },
];

export const conversations: Conversation[] = [
  {
    id: '1',
    profileId: '2',
    lastMessage: "That voice note really hit different yaar.",
    timestamp: '5m ago',
    unread: 2,
    messages: [
      { id: '1', senderId: '2', content: 'Hey, saw your post', timestamp: '10m ago', isMe: false, type: 'text' },
      { id: '2', senderId: 'me', content: 'Thanks for reaching out, means a lot', timestamp: '8m ago', isMe: true, type: 'text' },
      { id: '3', senderId: '2', content: "Felt it deeply, you know?", timestamp: '6m ago', isMe: false, type: 'text' },
      { id: '4', senderId: '2', content: "That voice note really hit different yaar.", timestamp: '5m ago', isMe: false, type: 'text' },
    ],
  },
  {
    id: '2',
    profileId: '3',
    lastMessage: "You're not alone in this.",
    timestamp: '1h ago',
    unread: 0,
    messages: [
      { id: '1', senderId: 'me', content: 'Your posts always resonate with me', timestamp: '2h ago', isMe: true, type: 'text' },
      { id: '2', senderId: '3', content: "That's really nice to hear", timestamp: '1h 30m ago', isMe: false, type: 'text' },
      { id: '3', senderId: '3', content: '', timestamp: '1h 15m ago', isMe: false, type: 'voice', waveform: generateWaveform(), duration: '0:32' },
      { id: '4', senderId: '3', content: "You're not alone in this.", timestamp: '1h ago', isMe: false, type: 'text' },
    ],
  },
  {
    id: '3',
    profileId: '5',
    lastMessage: 'Same feeling here.',
    timestamp: '3h ago',
    unread: 1,
    messages: [
      { id: '1', senderId: '5', content: 'That 3am post of yours... wow', timestamp: '4h ago', isMe: false, type: 'text' },
      { id: '2', senderId: 'me', content: 'Night time is when I can actually be honest', timestamp: '3h 30m ago', isMe: true, type: 'text' },
      { id: '3', senderId: 'me', content: '', timestamp: '3h 20m ago', isMe: true, type: 'voice', waveform: generateWaveform(), duration: '0:45' },
      { id: '4', senderId: '5', content: 'Same feeling here.', timestamp: '3h ago', isMe: false, type: 'text' },
    ],
  },
  {
    id: '4',
    profileId: '1',
    lastMessage: 'Keep speaking your truth',
    timestamp: '1d ago',
    unread: 0,
    messages: [
      { id: '1', senderId: '1', content: 'Your vulnerability is inspiring', timestamp: '1d ago', isMe: false, type: 'text' },
      { id: '2', senderId: 'me', content: 'Everyone\'s story deserves to be heard', timestamp: '1d ago', isMe: true, type: 'text' },
      { id: '3', senderId: '1', content: 'Keep speaking your truth', timestamp: '1d ago', isMe: false, type: 'text' },
    ],
  },
  {
    id: '5',
    profileId: '7',
    lastMessage: 'I understand',
    timestamp: '2d ago',
    unread: 0,
    messages: [
      { id: '1', senderId: '7', content: 'Your post reminded me of something', timestamp: '2d ago', isMe: false, type: 'text' },
      { id: '2', senderId: 'me', content: 'What happened?', timestamp: '2d ago', isMe: true, type: 'text' },
      { id: '3', senderId: '7', content: '', timestamp: '2d ago', isMe: false, type: 'voice', waveform: generateWaveform(), duration: '1:12' },
      { id: '4', senderId: '7', content: 'I understand', timestamp: '2d ago', isMe: false, type: 'text' },
    ],
  },
];

export const notifications: Notification[] = [
  {
    id: '1',
    type: 'reaction',
    content: 'Someone felt your post ❤️',
    timestamp: '1m ago',
    read: false,
    profileId: '2',
    postId: '1',
  },
  {
    id: '2',
    type: 'message',
    content: 'New anonymous message received',
    timestamp: '5m ago',
    read: false,
    profileId: '3',
    conversationId: '2',
  },
  {
    id: '3',
    type: 'reply',
    content: 'Someone replied to your thought',
    timestamp: '15m ago',
    read: false,
    profileId: '5',
    postId: '4',
  },
  {
    id: '4',
    type: 'follow',
    content: 'A new soul started following you',
    timestamp: '1h ago',
    read: true,
    profileId: '4',
  },
  {
    id: '5',
    type: 'reaction',
    content: 'Your voice note touched someone',
    timestamp: '2h ago',
    read: true,
    profileId: '1',
    postId: '7',
  },
  {
    id: '6',
    type: 'reply',
    content: 'Someone connected with your confession',
    timestamp: '4h ago',
    read: true,
    profileId: '6',
    postId: '6',
  },
  {
    id: '7',
    type: 'message',
    content: 'New anonymous message waiting',
    timestamp: '6h ago',
    read: true,
    profileId: '2',
    conversationId: '1',
  },
  {
    id: '8',
    type: 'follow',
    content: 'Someone discovered your profile',
    timestamp: '1d ago',
    read: true,
    profileId: '5',
  },
];

export const currentUser: Profile = {
  id: 'me',
  username: 'chuppi_todunga',
  displayName: 'Chuppi Todunga',
  bio: 'Finding my voice in the silence. Yahan pe thoda khul ke baat kar paata hoon.',
  avatarGradient: 'from-violet-600 via-purple-600 to-indigo-600',
  postsCount: 12,
  followersCount: 456,
  followingCount: 89,
  highlights: ['my thoughts', 'voices'],
  moodTag: '✨ feeling reflective',
};

export const getProfile = (id: string): Profile | undefined => {
  if (id === 'me') return currentUser;
  return profiles.find(p => p.id === id);
};

export const getPostsByProfile = (profileId: string): Post[] => {
  return posts.filter(p => p.profileId === profileId);
};

export const getConversation = (id: string): Conversation | undefined => {
  return conversations.find(c => c.id === id);
};
