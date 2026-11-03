// Display-only localisation for musical values coming from the hardware / song data.
// Never use these for comparisons — the canonical English names stay in state.

const SWARA_SI = {
  Sa: 'ස', Ri: 'රි', Re: 'රි', Ga: 'ග', Ma: 'ම', Pa: 'ප', Dha: 'ධ', Dh: 'ධ', Ni: 'නි',
  Komal: 'කෝමල', Tivra: 'තීව්‍ර', Mandra: 'මන්ද්‍ර', Madhya: 'මධ්‍ය', Tara: 'තාර',
};

const DRUM_SI = {
  KICK: 'කික්', HAT: 'හැට්', SNARE: 'ස්නෙයාර්', METALSNARE: 'මෙටල් ස්නෙයාර්', HIHAT: 'හයි-හැට්',
  TOM1: 'ටොම් 1', TOM2: 'ටොම් 2', TOM3: 'ටොම් 3', CYMBAL: 'සිම්බල්', CRASH: 'ක්‍රෑෂ්', RIDE: 'රයිඩ්',
};

const SWARA_TOKENS = /\b(Komal|Tivra|Mandra|Madhya|Tara|Sa|Ri|Re|Ga|Ma|Pa|Dha|Dh|Ni)\b/g;

// "Sa" -> "ස", "K.Ri" -> "කෝ.රි", "Komal Ga" -> "කෝමල ග", "Pa Pa Ri" -> "ප ප රි"
export function localizeSwara(value, lang) {
  if (lang !== 'si' || value == null || value === '') return value;
  return String(value)
    .replace(/\bK\.(?=[A-Z])/g, 'කෝ.')
    .replace(/\bT\.(?=[A-Z])/g, 'තී.')
    .replace(SWARA_TOKENS, (m) => SWARA_SI[m]);
}

// "SNARE" / "snare" / "Tom 1" -> Sinhala drum name; unknown values are returned unchanged.
export function localizeDrum(value, lang) {
  if (lang !== 'si' || value == null || value === '') return value;
  const key = String(value).toUpperCase().replace(/[\s_-]/g, '');
  return DRUM_SI[key] || value;
}
