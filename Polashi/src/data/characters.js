// All character definitions for both game modes.
// Use getCharacter(roleId, gameMode) to retrieve display info for the active mode.

const CHARACTERS = {
  // ── Loyal Side ─────────────────────────────────────────────────────────────
  ARTHUR: {
    avalon:  { name: 'Arthur',              title: 'King of Camelot'    },
    polashi: { name: 'নবাব সিরাজউদ্দৌলা', title: 'নবাব পক্ষের নেতা' },
    team: 'loyal',
    icon: '👑',
    nightInfo: null,
    description: {
      avalon:  'The symbol of the loyal side. No special power — play by observation and trust.',
      polashi: 'নবাব পক্ষের প্রতীক। কোনো বিশেষ ক্ষমতা নেই — পর্যবেক্ষণ ও বিশ্বাসের ওপর নির্ভর করুন।',
    },
    nightDescription: {
      avalon:  'You have no special night knowledge. Trust your instincts.',
      polashi: 'রাতের পর্যায়ে আপনার কোনো বিশেষ তথ্য নেই। নিজের বিচারের ওপর ভরসা রাখুন।',
    },
  },

  MERLIN: {
    avalon:  { name: 'Merlin',    title: 'The Secret Informant' },
    polashi: { name: 'মীর মদন', title: 'গোপন তথ্যদাতা'        },
    team: 'loyal',
    icon: '🌟',
    description: {
      avalon:  'You know who the traitors are (except Mordred). Guide your team subtly — if you are identified at the end, the traitors win.',
      polashi: 'আপনি জানেন কে কে বিশ্বাসঘাতক (রায় দুর্লভ ছাড়া)। দলকে সাবধানে পথ দেখান — শেষে চিহ্নিত হলে বিশ্বাসঘাতকরা জিতবে।',
    },
    nightDescription: {
      avalon:  'You see the traitors highlighted below (Mordred is hidden from you).',
      polashi: 'নিচে বিশ্বাসঘাতকরা হাইলাইট করা আছেন (রায় দুর্লভ আপনার থেকে লুকানো)।',
    },
  },

  PERCIVAL: {
    avalon:  { name: 'Percival',    title: 'The Protector'    },
    polashi: { name: 'মোহন লাল',  title: 'রক্ষাকারী'         },
    team: 'loyal',
    icon: '🛡️',
    description: {
      avalon:  'You see who Merlin is — but if Morgana is in the game, you also see a decoy. Protect the real Merlin.',
      polashi: 'আপনি মীর মদনকে চেনেন — তবে ঘষেটি বেগম থাকলে একটি ছদ্মবেশীও দেখবেন। আসল মীর মদনকে রক্ষা করুন।',
    },
    nightDescription: {
      avalon:  'One of the highlighted players is Merlin. The other (if any) is Morgana — you cannot tell which is which.',
      polashi: 'হাইলাইট করা একজন হলেন মীর মদন। অন্যজন (যদি থাকেন) হলেন ঘষেটি বেগম — কে কে তা আপনি জানেন না।',
    },
  },

  LOYAL_1: {
    avalon:  { name: 'Loyal Servant I',   title: 'Loyal Servant of Arthur' },
    polashi: { name: 'লুৎফুন্নিসা বেগম', title: 'বিশ্বস্ত সেবক'            },
    team: 'loyal',
    icon: '🤍',
    description: {
      avalon:  'No special power. Use discussion and deduction to root out the traitors.',
      polashi: 'কোনো বিশেষ ক্ষমতা নেই। আলোচনা ও অনুমানের মাধ্যমে বিশ্বাসঘাতক খুঁজে বের করুন।',
    },
    nightDescription: {
      avalon:  'You have no special night knowledge.',
      polashi: 'রাতের পর্যায়ে আপনার কোনো বিশেষ তথ্য নেই।',
    },
  },

  LOYAL_2: {
    avalon:  { name: 'Loyal Servant II', title: 'Loyal Servant of Arthur' },
    polashi: { name: 'সেন্ট ফ্রে',      title: 'বিশ্বস্ত সেবক'            },
    team: 'loyal',
    icon: '🤍',
    description: {
      avalon:  'No special power. Use discussion and deduction to root out the traitors.',
      polashi: 'কোনো বিশেষ ক্ষমতা নেই। আলোচনা ও অনুমানের মাধ্যমে বিশ্বাসঘাতক খুঁজে বের করুন।',
    },
    nightDescription: {
      avalon:  'You have no special night knowledge.',
      polashi: 'রাতের পর্যায়ে আপনার কোনো বিশেষ তথ্য নেই।',
    },
  },

  LOYAL_3: {
    avalon:  { name: 'Loyal Servant III', title: 'Loyal Servant of Arthur' },
    polashi: { name: 'ডেবুসি',           title: 'বিশ্বস্ত সেবক'            },
    team: 'loyal',
    icon: '🤍',
    description: {
      avalon:  'No special power. Use discussion and deduction to root out the traitors.',
      polashi: 'কোনো বিশেষ ক্ষমতা নেই। আলোচনা ও অনুমানের মাধ্যমে বিশ্বাসঘাতক খুঁজে বের করুন।',
    },
    nightDescription: {
      avalon:  'You have no special night knowledge.',
      polashi: 'রাতের পর্যায়ে আপনার কোনো বিশেষ তথ্য নেই।',
    },
  },

  LOYAL_4: {
    avalon:  { name: 'Loyal Servant IV', title: 'Loyal Servant of Arthur' },
    polashi: { name: 'বিশ্বস্ত সৈনিক',  title: 'বিশ্বস্ত সেবক'            },
    team: 'loyal',
    icon: '🤍',
    description: {
      avalon:  'No special power. Use discussion and deduction to root out the traitors.',
      polashi: 'কোনো বিশেষ ক্ষমতা নেই। আলোচনা ও অনুমানের মাধ্যমে বিশ্বাসঘাতক খুঁজে বের করুন।',
    },
    nightDescription: {
      avalon:  'You have no special night knowledge.',
      polashi: 'রাতের পর্যায়ে আপনার কোনো বিশেষ তথ্য নেই।',
    },
  },

  // ── Traitor Side ───────────────────────────────────────────────────────────
  ASSASSIN: {
    avalon:  { name: 'The Assassin', title: 'Executioner of the Traitors' },
    polashi: { name: 'মীর জাফর',    title: 'বিশ্বাসঘাতকদের ঘাতক'          },
    team: 'traitor',
    icon: '🗡️',
    description: {
      avalon:  'If the loyal side wins 3 missions, you get ONE guess to identify Merlin. A correct guess wins the game for the traitors.',
      polashi: 'বিশ্বস্তরা ৩টি অভিযান জিতলে আপনি একটিমাত্র সুযোগ পান মীর মদনকে চিহ্নিত করার। সঠিক হলে বিশ্বাসঘাতকরা জেতে।',
    },
    nightDescription: {
      avalon:  'Your fellow traitors are shown below. Watch Merlin carefully throughout the game.',
      polashi: 'আপনার সহ-বিশ্বাসঘাতকরা নিচে দেখানো হয়েছে। সারা খেলা মীর মদনকে মনোযোগ দিয়ে পর্যবেক্ষণ করুন।',
    },
  },

  MORDRED: {
    avalon:  { name: 'Mordred',      title: 'Hidden from Merlin'    },
    polashi: { name: 'রায় দুর্লভ', title: 'মীর মদনের অদৃশ্য শত্রু' },
    team: 'traitor',
    icon: '👻',
    description: {
      avalon:  'Merlin cannot see you. You are the most dangerous traitor — use your invisibility to stay trusted.',
      polashi: 'মীর মদন আপনাকে চিনতে পারবেন না। সবচেয়ে বিপজ্জনক বিশ্বাসঘাতক — আপনার অদৃশ্যতা কাজে লাগান।',
    },
    nightDescription: {
      avalon:  'Merlin cannot see you. Your fellow traitors are shown below.',
      polashi: 'মীর মদন আপনাকে চিনবেন না। আপনার সহ-বিশ্বাসঘাতকরা নিচে দেখানো হয়েছে।',
    },
  },

  MORGANA: {
    avalon:  { name: 'Morgana',       title: 'The Deceiver'             },
    polashi: { name: 'ঘষেটি বেগম',   title: 'প্রতারক'                   },
    team: 'traitor',
    icon: '🎭',
    description: {
      avalon:  'Percival sees you as a potential Merlin. Act like Merlin to create maximum confusion.',
      polashi: 'মোহন লাল আপনাকে সম্ভাব্য মীর মদন হিসেবে দেখেন। মীর মদনের মতো আচরণ করে বিভ্রান্তি তৈরি করুন।',
    },
    nightDescription: {
      avalon:  'Percival sees you alongside the real Merlin — he cannot tell you apart. Your fellow traitors are shown below.',
      polashi: 'মোহন লাল আপনাকে ও আসল মীর মদনকে পাশাপাশি দেখেন — তিনি পার্থক্য বুঝতে পারবেন না।',
    },
  },

  OBERON: {
    avalon:  { name: 'Oberon',    title: 'The Isolated Wildcard' },
    polashi: { name: 'উমিচাঁদ', title: 'বিচ্ছিন্ন তাস'           },
    team: 'traitor',
    icon: '🌑',
    description: {
      avalon:  'You do not reveal yourself to other traitors, and they do not know who you are. Play completely blind.',
      polashi: 'আপনি অন্য বিশ্বাসঘাতকদের কাছে পরিচয় দেন না, এবং তারাও আপনাকে চেনে না। সম্পূর্ণ অজ্ঞভাবে খেলুন।',
    },
    nightDescription: {
      avalon:  'You keep your eyes closed with everyone else. No one knows who you are — not even the other traitors.',
      polashi: 'আপনি সবার মতো চোখ বন্ধ রাখুন। কেউ জানে না আপনি কে — এমনকি অন্য বিশ্বাসঘাতকরাও না।',
    },
  },

  MINION_1: {
    avalon:  { name: 'Minion of Mordred I',  title: 'Minion of Mordred' },
    polashi: { name: 'ইস্ট ইন্ডিয়া চর I', title: 'বিশ্বাসঘাতক চর'      },
    team: 'traitor',
    icon: '🔴',
    description: {
      avalon:  'No special power. Work with your fellow traitors to sabotage 3 missions.',
      polashi: 'কোনো বিশেষ ক্ষমতা নেই। সহ-বিশ্বাসঘাতকদের সাথে ৩টি অভিযান ব্যর্থ করুন।',
    },
    nightDescription: {
      avalon:  'Your fellow traitors are shown below.',
      polashi: 'আপনার সহ-বিশ্বাসঘাতকরা নিচে দেখানো হয়েছে।',
    },
  },

  MINION_2: {
    avalon:  { name: 'Minion of Mordred II', title: 'Minion of Mordred' },
    polashi: { name: 'ইস্ট ইন্ডিয়া চর II', title: 'বিশ্বাসঘাতক চর'    },
    team: 'traitor',
    icon: '🔴',
    description: {
      avalon:  'No special power. Work with your fellow traitors to sabotage 3 missions.',
      polashi: 'কোনো বিশেষ ক্ষমতা নেই। সহ-বিশ্বাসঘাতকদের সাথে ৩টি অভিযান ব্যর্থ করুন।',
    },
    nightDescription: {
      avalon:  'Your fellow traitors are shown below.',
      polashi: 'আপনার সহ-বিশ্বাসঘাতকরা নিচে দেখানো হয়েছে।',
    },
  },

  MINION_3: {
    avalon:  { name: 'Minion of Mordred III', title: 'Minion of Mordred' },
    polashi: { name: 'ইস্ট ইন্ডিয়া চর III', title: 'বিশ্বাসঘাতক চর'   },
    team: 'traitor',
    icon: '🔴',
    description: {
      avalon:  'No special power. Work with your fellow traitors to sabotage 3 missions.',
      polashi: 'কোনো বিশেষ ক্ষমতা নেই। সহ-বিশ্বাসঘাতকদের সাথে ৩টি অভিযান ব্যর্থ করুন।',
    },
    nightDescription: {
      avalon:  'Your fellow traitors are shown below.',
      polashi: 'আপনার সহ-বিশ্বাসঘাতকরা নিচে দেখানো হয়েছে।',
    },
  },
};

export function getCharacter(roleId, gameMode = 'avalon') {
  const char = CHARACTERS[roleId];
  if (!char) return null;
  const mode = gameMode === 'polashi' ? 'polashi' : 'avalon';
  return {
    ...char,
    name: char[mode].name,
    title: char[mode].title,
    description: char.description[mode],
    nightDescription: char.nightDescription[mode],
  };
}

// Mission terminology by game mode
export const MISSION_TERMS = {
  avalon:  { mission: 'Quest',    missions: 'Quests',   leader: 'Leader',    approve: 'Approve', reject: 'Reject', success: 'Success', fail: 'Fail' },
  polashi: { mission: 'অভিযান',  missions: 'অভিযান',  leader: 'সেনাপতি',  approve: 'সমর্থন',  reject: 'প্রত্যাখ্যান', success: 'সাফল্য', fail: 'ব্যর্থতা' },
};

export const TEAM_NAMES = {
  avalon:  { loyal: 'Loyal Servants', traitor: 'Minions of Mordred' },
  polashi: { loyal: 'নবাব পক্ষ',      traitor: 'EIC পক্ষ'           },
};

export default CHARACTERS;
