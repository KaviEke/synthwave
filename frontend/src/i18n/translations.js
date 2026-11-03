// Centralized UI copy for the Syntronics website.
// 'en' is the source of truth; 'si' mirrors its shape exactly.
// Brand names (SYNTRONICS, SynthWave) and common tech terms (IoT, 3D, AI, PCB…)
// are intentionally kept in English in the Sinhala copy.

export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = ['en', 'si'];

const en = {
  common: {
    loading: 'Loading...',
    siteTitle: 'SynthWave Motion | Interactive Digital Instrument',
  },
  nav: {
    active: 'Active',
    liveSession: 'Live Session',
    tutorial: 'Tutorial',
    loopStudio: 'Loop Studio',
    dashboard: 'Dashboard',
    logout: 'Logout',
    discover: 'Discover',
    support: 'Support Us',
    premium: 'Premium',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    languageLabel: 'Choose language',
    english: 'English',
    sinhala: 'Sinhala',
  },
  hero: {
    titleLine1: 'Live Your Day',
    titleLine2: 'With Music',
    subtitle:
      'Make your day more lively with a variety of premium music instruments. Connect your IoT devices and experience interactive sound synthesis.',
    liveMusic: 'Live Music',
    signIn: 'Sign In',
    supportedInstruments: 'Supported Instruments',
    instruments: ['Violin', 'Piano', 'Drum Kit'],
  },
  showcase: {
    title: 'Experience The Build',
    subtitle:
      'Explore the Synth Wave controller in full 3D. Drag to rotate, scroll to zoom, and see every detail of the craft.',
    loading: 'Loading 3D Model…',
    hint: 'Drag to rotate · Scroll to zoom',
  },
  team: {
    title: 'Behind The Build',
    founder: 'Founder',
    coFounder: 'Co-Founder',
    members: {
      kavindu: {
        name: 'Kavindu Ekanayaka',
        role: ['Lead Software Architect', 'Web Developer & AI Engineer'],
      },
      chamoth: {
        name: 'Chamoth Liyanaarachchi',
        role: ['Lead Hardware Engineer', 'PCB Design & AI Engineer'],
      },
      indumini: {
        name: 'Indumini Wathsala',
        role: ['Associate Software, Hardware', '& AI Engineer'],
      },
      michael: {
        name: 'Michael Sharon',
        role: ['Associate Software', '& Firmware Engineer'],
      },
      shrinitha: {
        name: 'Shrinitha',
        role: ['Associate Software', '& Firmware Engineer'],
      },
    },
  },
  discover: {
    title: 'Discover Our Project',
    paragraphs: [
      'Welcome to our hardware project, an interactive motion-based music system designed to turn physical movement into sound. This project combines smart sensors, embedded systems, and software integration to create a unique musical experience where users can control instruments through gestures and motion. By blending hardware and creativity, we aim to show how modern technology can make music more immersive, expressive, and engaging.',
      'Our system focuses on transforming natural hand movements into real-time musical output. Using motion sensors and a connected host system, the project can detect actions such as hits, drags, and directional movements, then convert them into different instrument sounds. This allows users to experience a new way of playing music beyond traditional instruments.',
      'This project was developed not only as a technical solution, but also as an exploration of innovation in interactive entertainment and digital music. It highlights the power of combining electronics, programming, and design to build something practical, creative, and enjoyable.',
    ],
  },
  support: {
    title: 'Support Us',
    subtitle:
      'We would love to hear your feedback on the SYNTRONICS hardware experience! Send us a message below.',
    success: 'Thank you! Your feedback has been successfully submitted to our team.',
    emailLabel: 'Your Email',
    emailPlaceholder: 'Email Address',
    messageLabel: 'Feedback Message',
    messagePlaceholder: 'What do you think about the project?',
    submit: 'Send Feedback',
  },
  premium: {
    title: 'Unlock Premium Instruments',
    subtitle: 'Expand your interactive setup.',
    free: {
      name: 'Free Mode',
      features: {
        sync: 'Basic hardware synchronization',
        analytics: 'Session Dashboard Analytics',
        violin: '1 Instrument Included: Violin',
        piano: 'Piano Integration',
        drum: 'Drum Kit Expansion',
      },
      cta: 'Current Plan',
    },
    pro: {
      badge: 'Most Popular',
      name: 'Full Kit Access',
      features: {
        latency: 'Advanced hardware low-latency',
        analytics: 'Pro Session Analytics',
        violin: 'Violin',
        piano: 'Grand Piano Extension',
        drum: 'Drum Kit Hero Extension',
      },
      cta: 'Purchase Expansion',
    },
  },
  login: {
    pageTitle: 'Login | SynthWave Motion',
    tagline: 'Access your digital instrument control center and dive back into the music.',
    heading: 'Sign In',
    username: 'Username',
    password: 'Password',
    submit: 'Enter Dashboard',
    newArtist: 'New artist?',
    createAccount: 'Create Account',
    errors: {
      usernameRequired: 'Please enter your username.',
      passwordRequired: 'Please enter your password.',
    },
  },
  register: {
    pageTitle: 'Create Account | SynthWave Motion',
    heading: 'Begin Journey',
    username: 'Username',
    email: 'Email Address',
    password: 'Password',
    submit: 'Register Hardware',
    alreadyGeared: 'Already geared up?',
    signIn: 'Sign In',
    errors: {
      usernameMin: 'Username must be at least 3 characters.',
      emailInvalid: 'Please enter a valid email address.',
      passwordMin: 'Password must be at least 6 characters.',
    },
  },
  footer: {
    rights: 'All rights reserved.',
  },
};

const si = {
  common: {
    loading: 'පූරණය වෙමින්...',
    siteTitle: 'SynthWave Motion | අන්තර්ක්‍රියාකාරී ඩිජිටල් සංගීත භාණ්ඩය',
  },
  nav: {
    active: 'සක්‍රියයි',
    liveSession: 'සජීවී සැසිය',
    tutorial: 'පාඩම්',
    loopStudio: 'ලූප් ස්ටුඩියෝ',
    dashboard: 'පාලක පුවරුව',
    logout: 'ඉවත් වන්න',
    discover: 'ගවේෂණය',
    support: 'අපට සහාය වන්න',
    premium: 'ප්‍රිමියම්',
    openMenu: 'මෙනුව විවෘත කරන්න',
    closeMenu: 'මෙනුව වසන්න',
    languageLabel: 'භාෂාව තෝරන්න',
    english: 'ඉංග්‍රීසි',
    sinhala: 'සිංහල',
  },
  hero: {
    titleLine1: 'ඔබේ දවස',
    titleLine2: 'සංගීතයෙන් පුරවන්න',
    subtitle:
      'විවිධ ප්‍රිමියම් සංගීත භාණ්ඩ සමඟ ඔබේ දවස වඩාත් ජීවමාන කරගන්න. ඔබේ IoT උපාංග සම්බන්ධ කර අන්තර්ක්‍රියාකාරී ශබ්ද සංශ්ලේෂණය අත්විඳින්න.',
    liveMusic: 'සජීවී සංගීතය',
    signIn: 'පිවිසෙන්න',
    supportedInstruments: 'සහාය දක්වන සංගීත භාණ්ඩ',
    instruments: ['වයලීනය', 'පියානෝව', 'ඩ්‍රම් කට්ටලය'],
  },
  showcase: {
    title: 'නිර්මාණය අත්විඳින්න',
    subtitle:
      'Synth Wave පාලකය සම්පූර්ණ 3D ආකාරයෙන් ගවේෂණය කරන්න. කරකැවීමට අදින්න, විශාලනය කිරීමට scroll කරන්න, නිර්මාණයේ සෑම සියුම් අංගයක්ම සමීපව බලන්න.',
    loading: '3D මාදිලිය පූරණය වෙමින්…',
    hint: 'කරකැවීමට අදින්න · විශාලනයට scroll කරන්න',
  },
  team: {
    title: 'නිර්මාණය පිටුපස කණ්ඩායම',
    founder: 'නිර්මාතෘ',
    coFounder: 'සම-නිර්මාතෘ',
    members: {
      kavindu: {
        name: 'කවිඳු ඒකනායක',
        role: ['ප්‍රධාන මෘදුකාංග ගෘහ නිර්මාණ ශිල්පී', 'වෙබ් සංවර්ධක සහ AI ඉංජිනේරු'],
      },
      chamoth: {
        name: 'චමෝත් ලියනආරච්චි',
        role: ['ප්‍රධාන දෘඩාංග ඉංජිනේරු', 'PCB නිර්මාණ සහ AI ඉංජිනේරු'],
      },
      indumini: {
        name: 'ඉඳුමිණි වත්සලා',
        role: ['සහකාර මෘදුකාංග, දෘඩාංග', 'සහ AI ඉංජිනේරු'],
      },
      michael: {
        name: 'මයිකල් ෂැරන්',
        role: ['සහකාර මෘදුකාංග', 'සහ Firmware ඉංජිනේරු'],
      },
      shrinitha: {
        name: 'ශ්‍රීනිතා',
        role: ['සහකාර මෘදුකාංග', 'සහ Firmware ඉංජිනේරු'],
      },
    },
  },
  discover: {
    title: 'අපගේ ව්‍යාපෘතිය ගවේෂණය කරන්න',
    paragraphs: [
      'අපගේ දෘඩාංග ව්‍යාපෘතියට ඔබව සාදරයෙන් පිළිගනිමු. මෙය ශාරීරික චලනයන් ශබ්දය බවට පරිවර්තනය කිරීමට නිර්මාණය කළ, අන්තර්ක්‍රියාකාරී චලන-පාදක සංගීත පද්ධතියකි. ස්මාර්ට් සංවේදක, embedded පද්ධති සහ මෘදුකාංග ඒකාබද්ධ කිරීම එකට මුසු කරමින්, අභිනයන් සහ චලනයන් හරහා සංගීත භාණ්ඩ පාලනය කළ හැකි අද්විතීය සංගීත අත්දැකීමක් මෙම ව්‍යාපෘතිය මගින් බිහි කරයි. දෘඩාංග සහ නිර්මාණශීලීත්වය එක් කරමින්, නවීන තාක්ෂණය මගින් සංගීතය වඩාත් ගැඹුරු, ප්‍රකාශනශීලී සහ ආකර්ෂණීය අත්දැකීමක් කළ හැකි ආකාරය පෙන්වීම අපගේ අරමුණයි.',
      'අපගේ පද්ධතිය ස්වාභාවික අත් චලනයන් තත්‍ය කාලීන සංගීත ප්‍රතිදානයක් බවට පරිවර්තනය කිරීම කෙරෙහි අවධානය යොමු කරයි. චලන සංවේදක සහ සම්බන්ධිත ධාරක පද්ධතියක් භාවිතයෙන්, ගැසීම්, ඇදීම් සහ දිශානුගත චලනයන් වැනි ක්‍රියා හඳුනාගෙන ඒවා විවිධ සංගීත භාණ්ඩ ශබ්ද බවට පරිවර්තනය කරයි. මේ හරහා සාම්ප්‍රදායික සංගීත භාණ්ඩවලින් ඔබ්බට ගිය, සංගීතය වාදනය කිරීමේ නව ක්‍රමයක් අත්විඳීමට පරිශීලකයින්ට අවස්ථාව ලැබේ.',
      'මෙම ව්‍යාපෘතිය තාක්ෂණික විසඳුමක් ලෙස පමණක් නොව, අන්තර්ක්‍රියාකාරී විනෝදාස්වාදය සහ ඩිජිටල් සංගීතය තුළ නවෝත්පාදනය පිළිබඳ ගවේෂණයක් ලෙසද සංවර්ධනය කරන ලදී. ප්‍රායෝගික, නිර්මාණශීලී සහ රසවිඳිය හැකි දෙයක් ගොඩනැගීමට ඉලෙක්ට්‍රොනික, ක්‍රමලේඛනය සහ නිර්මාණකරණය ඒකාබද්ධ කිරීමේ ශක්තිය එය මනාව පෙන්නුම් කරයි.',
    ],
  },
  support: {
    title: 'අපට සහාය වන්න',
    subtitle:
      'SYNTRONICS දෘඩාංග අත්දැකීම පිළිබඳ ඔබේ අදහස් දැනගැනීමට අපි ඉතා කැමැත්තෙමු! පහතින් අපට පණිවිඩයක් එවන්න.',
    success: 'ස්තූතියි! ඔබේ ප්‍රතිචාරය අපගේ කණ්ඩායම වෙත සාර්ථකව යොමු කරන ලදී.',
    emailLabel: 'ඔබේ ඊමේල් ලිපිනය',
    emailPlaceholder: 'ඊමේල් ලිපිනය',
    messageLabel: 'ප්‍රතිචාර පණිවිඩය',
    messagePlaceholder: 'මෙම ව්‍යාපෘතිය ගැන ඔබේ අදහස කුමක්ද?',
    submit: 'ප්‍රතිචාරය යවන්න',
  },
  premium: {
    title: 'ප්‍රිමියම් සංගීත භාණ්ඩ විවෘත කරන්න',
    subtitle: 'ඔබේ අන්තර්ක්‍රියාකාරී සැකසුම තවත් පුළුල් කරගන්න.',
    free: {
      name: 'නොමිලේ සැලැස්ම',
      features: {
        sync: 'මූලික දෘඩාංග සමමුහුර්තකරණය',
        analytics: 'සැසි පාලක පුවරු විශ්ලේෂණ',
        violin: 'ඇතුළත් සංගීත භාණ්ඩ 1ක්: වයලීනය',
        piano: 'පියානෝ ඒකාබද්ධ කිරීම',
        drum: 'ඩ්‍රම් කට්ටල දිගුව',
      },
      cta: 'වත්මන් සැලැස්ම',
    },
    pro: {
      badge: 'වඩාත් ජනප්‍රිය',
      name: 'සම්පූර්ණ කට්ටල ප්‍රවේශය',
      features: {
        latency: 'උසස් low-latency දෘඩාංග ක්‍රියාකාරිත්වය',
        analytics: 'Pro සැසි විශ්ලේෂණ',
        violin: 'වයලීනය',
        piano: 'ග්‍රෑන්ඩ් පියානෝ දිගුව',
        drum: 'Drum Kit Hero දිගුව',
      },
      cta: 'දිගුව මිලදී ගන්න',
    },
  },
  login: {
    pageTitle: 'පිවිසුම | SynthWave Motion',
    tagline: 'ඔබේ ඩිජිටල් සංගීත භාණ්ඩ පාලන මධ්‍යස්ථානයට පිවිස නැවතත් සංගීතයේ ගිලී යන්න.',
    heading: 'පිවිසෙන්න',
    username: 'පරිශීලක නාමය',
    password: 'මුරපදය',
    submit: 'පාලක පුවරුවට පිවිසෙන්න',
    newArtist: 'නව කලාකරුවෙක්ද?',
    createAccount: 'ගිණුමක් සාදන්න',
    errors: {
      usernameRequired: 'කරුණාකර ඔබේ පරිශීලක නාමය ඇතුළත් කරන්න.',
      passwordRequired: 'කරුණාකර ඔබේ මුරපදය ඇතුළත් කරන්න.',
    },
  },
  register: {
    pageTitle: 'ගිණුමක් සාදන්න | SynthWave Motion',
    heading: 'ගමන අරඹන්න',
    username: 'පරිශීලක නාමය',
    email: 'ඊමේල් ලිපිනය',
    password: 'මුරපදය',
    submit: 'දෘඩාංග ලියාපදිංචි කරන්න',
    alreadyGeared: 'දැනටමත් ගිණුමක් තිබේද?',
    signIn: 'පිවිසෙන්න',
    errors: {
      usernameMin: 'පරිශීලක නාමය අවම වශයෙන් අක්ෂර 3ක් විය යුතුය.',
      emailInvalid: 'කරුණාකර වලංගු ඊමේල් ලිපිනයක් ඇතුළත් කරන්න.',
      passwordMin: 'මුරපදය අවම වශයෙන් අක්ෂර 6ක් විය යුතුය.',
    },
  },
  footer: {
    rights: 'සියලුම හිමිකම් ඇවිරිණි.',
  },
};

const translations = { en, si };
export default translations;
