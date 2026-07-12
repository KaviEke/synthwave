export const songs = [
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star',
    artist: 'Traditional',
    cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&q=80',
    tempo: 100,
    lyrics: [
      { line: 'Twinkle, twinkle, little star', notes: 'Pa Pa Ri Ri Ga Ga Ri' },
      { line: 'How I wonder what you are', notes: 'Sa Sa Ni Ni Dha Dha Pa' },
      { line: 'Up above the world so high', notes: 'Ri Ri Sa Sa Ni Ni Dha' },
      { line: 'Like a diamond in the sky', notes: 'Ri Ri Sa Sa Ni Ni Dha' },
      { line: 'Twinkle, twinkle, little star', notes: 'Pa Pa Ri Ri Ga Ga Ri' },
      { line: 'How I wonder what you are', notes: 'Sa Sa Ni Ni Dha Dha Pa' },
    ],
    parts: {
      piano: {
        // Using Hindustani swaras to match the canonical events from the Pi
        notes: ['Pa','Pa','Ri','Ri','Ga','Ga','Ri','Sa','Sa','Ni','Ni','Dha','Dha','Pa','Ri','Ri','Sa','Sa','Ni','Ni','Dha','Ri','Ri','Sa','Sa','Ni','Ni','Dha','Pa','Pa','Ri','Ri','Ga','Ga','Ri','Sa','Sa','Ni','Ni','Dha','Dha','Pa'],
      },
      violin: {
        notes: ['Pa','Pa','Ri','Ri','Ga','Ga','Ri','Sa','Sa','Ni','Ni','Dha','Dha','Pa','Ri','Ri','Sa','Sa','Ni','Ni','Dha','Ri','Ri','Sa','Sa','Ni','Ni','Dha','Pa','Pa','Ri','Ri','Ga','Ga','Ri','Sa','Sa','Ni','Ni','Dha','Dha','Pa'],
      },
      drum: {
        // Drum names match the canonical drum event names from the Pi
        notes: ['KICK','SNARE','KICK','SNARE','KICK','SNARE','KICK','KICK','SNARE','KICK','SNARE','KICK','SNARE','KICK','KICK','SNARE','KICK','SNARE','KICK','SNARE','KICK','KICK','SNARE','KICK','SNARE','KICK','SNARE','KICK','KICK','SNARE','KICK','SNARE','KICK','SNARE','KICK','KICK','SNARE','KICK','SNARE','KICK','SNARE','KICK'],
      }
    }
  }
];
