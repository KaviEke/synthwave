export const songs = [
  {
    id: 'twinkle',
    title: 'Twinkle Twinkle Little Star',
    artist: 'Traditional',
    cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&q=80',
    tempo: 100,
    lyrics: [
      { line: 'Twinkle, twinkle, little star', notes: 'GGDDEED' },
      { line: 'How I wonder what you are', notes: 'CCBBAAG' },
      { line: 'Up above the world so high', notes: 'DDCCBBA' },
      { line: 'Like a diamond in the sky', notes: 'DDCCBBA' },
      { line: 'Twinkle, twinkle, little star', notes: 'GGDDEED' },
      { line: 'How I wonder what you are', notes: 'CCBBAAG' },
    ],
    parts: {
      piano: {
        notes: ['G','G','D','D','E','E','D','C','C','B','B','A','A','G','D','D','C','C','B','B','A','D','D','C','C','B','B','A','G','G','D','D','E','E','D','C','C','B','B','A','A','G'],
      },
      violin: {
        notes: ['G','G','D','D','E','E','D','C','C','B','B','A','A','G','D','D','C','C','B','B','A','D','D','C','C','B','B','A','G','G','D','D','E','E','D','C','C','B','B','A','A','G'],
      },
      drum: {
        notes: ['KICK','SNARE','KICK','SNARE','KICK','SNARE','KICK','KICK','SNARE','KICK','SNARE','KICK','SNARE','KICK','KICK','SNARE','KICK','SNARE','KICK','SNARE','KICK','KICK','SNARE','KICK','SNARE','KICK','SNARE','KICK','KICK','SNARE','KICK','SNARE','KICK','SNARE','KICK','KICK','SNARE','KICK','SNARE','KICK','SNARE','KICK'],
      }
    }
  }
];
