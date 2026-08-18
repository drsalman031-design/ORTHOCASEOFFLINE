// Orthodontic Domain Voice Dictation & Phonetics Normalization Engine
// Transforms raw browser speech recognition into standardized postgraduate orthodontic terminology.

/**
 * Phonetic dictionary and clinical regex rules for Orthodontic terms
 */
export function normalizeOrthoSpeechText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Spoken Punctuation & Formatting Commands
  text = text
    .replace(/\b(full stop|period)\b/gi, '.')
    .replace(/\b(comma)\b/gi, ',')
    .replace(/\b(colon)\b/gi, ':')
    .replace(/\b(semicolon)\b/gi, ';')
    .replace(/\b(question mark)\b/gi, '?')
    .replace(/\b(exclamation mark)\b/gi, '!')
    .replace(/\b(new paragraph|next paragraph)\b/gi, '\n\n')
    .replace(/\b(new line|next line|enter)\b/gi, '\n')
    .replace(/\b(bullet point|bullet|new bullet)\b/gi, '\n• ')
    .replace(/\b(open parenthesis|open bracket)\b/gi, '(')
    .replace(/\b(close parenthesis|close bracket)\b/gi, ')');

  // 2. Units of measurement & symbols
  text = text
    .replace(/(\d+(?:\.\d+)?)\s*(degrees?|deg)\b/gi, '$1°')
    .replace(/(\d+(?:\.\d+)?)\s*(millimeters?|millimetre?|m\s*m|mm)\b/gi, '$1 mm')
    .replace(/(\d+(?:\.\d+)?)\s*(centimeters?|cm)\b/gi, '$1 cm')
    .replace(/(\d+(?:\.\d+)?)\s*(percent|percentage|pct)\b/gi, '$1%')
    .replace(/\bplus or minus\b/gi, '±')
    .replace(/\bplus minus\b/gi, '±');

  // 3. Angle's Classification & Molar/Canine Relations
  text = text
    // Class II div 1 / div 2
    .replace(/\bclass\s*(?:two|2|ii)\s*div(?:ision)?\s*(?:one|1|i)\b/gi, 'Class II division 1')
    .replace(/\bclass\s*(?:two|2|ii)\s*div(?:ision)?\s*(?:two|2|ii)\b/gi, 'Class II division 2')
    .replace(/\bclass\s*(?:two|2|ii)\s*sub(?:division)?\s*(?:one|1|i)\b/gi, 'Class II subdivision 1')
    .replace(/\bclass\s*(?:two|2|ii)\s*sub(?:division)?\s*(?:two|2|ii)\b/gi, 'Class II subdivision 2')
    .replace(/\bclass\s*(?:two|2|ii)\s*sub\b/gi, 'Class II subdivision')
    .replace(/\bclass\s*(?:three|3|iii)\s*sub(?:division)?\b/gi, 'Class III subdivision')
    // General classes
    .replace(/\bclass\s*(?:one|1|i)\b/gi, 'Class I')
    .replace(/\bclass\s*(?:two|2|ii)\b/gi, 'Class II')
    .replace(/\bclass\s*(?:three|3|iii)\b/gi, 'Class III')
    .replace(/\bpseudo\s*class\s*(?:three|3|iii)\b/gi, 'Pseudo-Class III')
    .replace(/\bend\s*on\s*molar\b/gi, 'end-on molar')
    .replace(/\bflush\s*terminal\s*plane\b/gi, 'flush terminal plane')
    .replace(/\bmesial\s*step\b/gi, 'mesial step')
    .replace(/\bdistal\s*step\b/gi, 'distal step');

  // 4. Skeletal & Facial Types
  text = text
    .replace(/\bskeletal\s*class\s*(?:one|1|i)\b/gi, 'Skeletal Class I')
    .replace(/\bskeletal\s*class\s*(?:two|2|ii)\b/gi, 'Skeletal Class II')
    .replace(/\bskeletal\s*class\s*(?:three|3|iii)\b/gi, 'Skeletal Class III')
    .replace(/\bortho\s*(?:gnathic|gnathik|gnostic|kynetic)\b/gi, 'orthognathic')
    .replace(/\bretro\s*(?:gnathic|gnathik|gnostic)\b/gi, 'retrognathic')
    .replace(/\bpro\s*(?:gnathic|gnathik|gnostic)\b/gi, 'prognathic')
    .replace(/\b(?:bimax|bimaxillary)\s*(?:dento\s*alveolar|dental\s*alveolar|dentoalveolar)?\s*protrusion\b/gi, 'bimaxillary dentoalveolar protrusion')
    .replace(/\bbimax\b/gi, 'bimaxillary')
    .replace(/\bdolicho\s*(?:facial|cephalic)\b/gi, 'dolichofacial')
    .replace(/\bbrachy\s*(?:facial|cephalic)\b/gi, 'brachyfacial')
    .replace(/\bmeso\s*(?:facial|cephalic)\b/gi, 'mesofacial')
    .replace(/\bhyper\s*divergent\b/gi, 'hyperdivergent')
    .replace(/\bhypo\s*divergent\b/gi, 'hypodivergent')
    .replace(/\bnormo\s*divergent\b/gi, 'normodivergent');

  // 5. Cephalometric Landmarks, Planes & Analyses
  text = text
    // SNA / SNB / ANB
    .replace(/\b(?:s\s*and\s*a|s\s*n\s*a|sna)\b/gi, 'SNA')
    .replace(/\b(?:s\s*and\s*b|s\s*n\s*b|snb)\b/gi, 'SNB')
    .replace(/\b(?:a\s*and\s*b|a\s*n\s*b|anb)\b/gi, 'ANB')
    .replace(/\b(?:f\s*m\s*a|fma|f\s*m\s*p\s*a|fmpa)\b/gi, 'FMA')
    .replace(/\b(?:i\s*m\s*p\s*a|impa|impact(?=\s*(?:angle|of|\d|degrees?)))\b/gi, 'IMPA')
    .replace(/\b(?:f\s*m\s*i\s*a|fmia)\b/gi, 'FMIA')
    .replace(/\b(?:u\s*1\s*s\s*n|u1\s*sn|u1-sn|upper incisor to s n)\b/gi, 'U1-SN')
    .replace(/\b(?:u\s*1\s*n\s*a|u1\s*na|u1-na|upper incisor to n a)\b/gi, 'U1-NA')
    .replace(/\b(?:l\s*1\s*n\s*b|l1\s*nb|l1-nb|lower incisor to n b)\b/gi, 'L1-NB')
    .replace(/\b(?:u\s*1\s*l\s*1|u1\s*l1|u1-l1|inter\s*incisal\s*angle)\b/gi, 'Interincisal angle')
    .replace(/\b(?:wits?|wit's)\s*(?:appraisal|value)?\b/gi, 'Wits appraisal')
    .replace(/\bbeta\s*angle\b/gi, 'Beta angle')
    .replace(/\byen\s*angle\b/gi, 'Yen angle')
    .replace(/\bgo\s*gn\s*(?:to\s*)?sn\b/gi, 'Go-Gn to SN')
    .replace(/\by\s*axis\b/gi, 'Y-axis')
    .replace(/\bfrankfort\s*horizontal\b/gi, 'Frankfort Horizontal')
    .replace(/\bsteine?r'?s?\b/gi, "Steiner's")
    .replace(/\btweed'?s?\b/gi, "Tweed's")
    .replace(/\bdowns?'?s?\b/gi, "Downs")
    .replace(/\bmcnamara'?s?\b/gi, "McNamara")
    .replace(/\bricketts?'?s?\b/gi, "Ricketts")
    .replace(/\bholdaway'?s?\b/gi, "Holdaway")
    .replace(/\bjarabak'?s?\b/gi, "Jarabak")
    .replace(/\bbonwill\s*hawley\b/gi, 'Bonwill-Hawley')
    .replace(/\bbonwill\b/gi, 'Bonwill')
    .replace(/\bhawley\b/gi, 'Hawley')
    .replace(/\bco\s*gn\b/gi, 'Co-Gn')
    .replace(/\bco\s*point\s*a\b/gi, 'Co-Point A')
    .replace(/\bn\s*perp\b/gi, 'N-Perp');

  // 6. Dental Occlusion & Terminology
  text = text
    .replace(/\bover\s*jet\b/gi, 'overjet')
    .replace(/\bover\s*bite\b/gi, 'overbite')
    .replace(/\bcross\s*bite\b/gi, 'crossbite')
    .replace(/\bopen\s*bite\b/gi, 'open bite')
    .replace(/\bdeep\s*bite\b/gi, 'deep bite')
    .replace(/\bscissors?\s*bite\b/gi, 'scissors bite')
    .replace(/\bmesio\s*buccal\b/gi, 'mesiobuccal')
    .replace(/\bdisto\s*buccal\b/gi, 'distobuccal')
    .replace(/\bmesio\s*palatal\b/gi, 'mesiopalatal')
    .replace(/\bdisto\s*palatal\b/gi, 'distopalatal')
    .replace(/\bmesio\s*lingual\b/gi, 'mesiolingual')
    .replace(/\bdisto\s*lingual\b/gi, 'distolingual')
    .replace(/\bbucco\s*version\b/gi, 'buccoversion')
    .replace(/\blinguo\s*version\b/gi, 'linguoversion')
    .replace(/\bpalato\s*version\b/gi, 'palatoversion')
    .replace(/\blabio\s*version\b/gi, 'labioversion')
    .replace(/\binfra\s*occlusion\b/gi, 'infraocclusion')
    .replace(/\bsupra\s*occlusion\b/gi, 'supraocclusion')
    .replace(/\bcurve of (?:spee|spy|speed)\b/gi, 'curve of Spee')
    .replace(/\bcurve of wilson\b/gi, 'curve of Wilson')
    .replace(/\bboltons?\s*(?:discrepancy|analysis)?\b/gi, 'Bolton discrepancy')
    .replace(/\bcareys?\s*(?:analysis)?\b/gi, "Carey's analysis")
    .replace(/\bponts?\s*(?:analysis)?\b/gi, "Pont's analysis")
    .replace(/\bashley\s*howes?\b/gi, "Ashley-Howe's")
    .replace(/\bkorkhaus\b/gi, 'Korkhaus')
    .replace(/\bproclined\b/gi, 'proclined')
    .replace(/\bretroclined\b/gi, 'retroclined')
    .replace(/\bproclination\b/gi, 'proclination')
    .replace(/\bretroclination\b/gi, 'retroclination');

  // 7. Orthodontic Materials, Appliances & Biomechanics
  text = text
    .replace(/\b(?:t\s*p\s*a|tpa|trans\s*palatal\s*arch)\b/gi, 'Transpalatal Arch (TPA)')
    .replace(/\b(?:r\s*p\s*e|rpe|rapid\s*palatal\s*expansion|rapid\s*palatal\s*expander)\b/gi, 'Rapid Palatal Expansion (RPE)')
    .replace(/\b(?:s\s*a\s*r\s*p\s*e|sarpe)\b/gi, 'SARPE')
    .replace(/\bquad\s*helix\b/gi, 'Quad Helix')
    .replace(/\b(?:m\s*b\s*t|mbt)\s*(?:slot|brackets?|prescription)?\b/gi, '0.022" MBT slot')
    .replace(/\broth\s*(?:slot|brackets?|prescription)?\b/gi, '0.022" Roth slot')
    .replace(/\b(?:i\s*p\s*r|ipr|inter\s*proximal\s*reduction)\b/gi, 'Interproximal Reduction (IPR)')
    .replace(/\b(?:t\s*a\s*d|tad|tads|temporary\s*anchorage\s*devices?|mini\s*implants?|mini\s*screws?)\b/gi, 'TADs (Mini-implants)')
    .replace(/\bcu\s*ni\s*ti\b/gi, 'CuNiTi')
    .replace(/\bni\s*ti\b/gi, 'NiTi')
    .replace(/\bt\s*m\s*a\b/gi, 'TMA')
    .replace(/\bstainless\s*steel\b/gi, 'Stainless Steel')
    .replace(/\btranspalatal\b/gi, 'transpalatal')
    .replace(/\bintermaxillary\s*elastics\b/gi, 'intermaxillary elastics');

  // 8. Soft Tissue & Profile
  text = text
    .replace(/\bnaso\s*labial\s*angle\b/gi, 'nasolabial angle')
    .replace(/\bmento\s*labial\s*sulcus\b/gi, 'mentolabial sulcus')
    .replace(/\b(?:e\s*line|rickets?\s*e\s*line)\b/gi, 'E-line (Ricketts)')
    .replace(/\b(?:s\s*line|steiners?\s*s\s*line)\b/gi, 'S-line (Steiner)')
    .replace(/\b(?:h\s*line|holdaways?\s*h\s*line)\b/gi, 'H-line (Holdaway)')
    .replace(/\bincompetent\s*lips?\b/gi, 'incompetent lips')
    .replace(/\bcompetent\s*lips?\b/gi, 'competent lips')
    .replace(/\bpotentially\s*competent\s*lips?\b/gi, 'potentially competent lips')
    .replace(/\bgummy\s*smile\b/gi, 'gummy smile')
    .replace(/\bconvex\s*profile\b/gi, 'convex profile')
    .replace(/\bstraight\s*profile\b/gi, 'straight profile')
    .replace(/\bconcave\s*profile\b/gi, 'concave profile');

  // Clean spacing around punctuation
  text = text
    .replace(/\s+([.,;:?!])/g, '$1')
    .replace(/([.,;:?!])([^\s\d])/g, '$1 $2')
    .replace(/[ \t]+/g, ' ')
    .trim();

  // Capitalize start of sentences
  text = text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, p1, p2) => p1 + p2.toUpperCase());

  return text;
}

/**
 * 100% Local Offline Postgraduate Orthodontic Text & Voice Normalization
 */
export function polishOrthoDictationOffline(text: string): string {
  if (!text || text.trim().length === 0) return '';
  return normalizeOrthoSpeechText(text);
}

/** Legacy alias for backward compatibility */
export const polishOrthoDictationAI = polishOrthoDictationOffline;

/**
 * Standard Postgraduate Orthodontic Quick-Macro Phrases for 1-Tap Entry
 */
export const ORTHO_QUICK_MACROS = [
  { label: 'Class II div 1', text: 'Class II division 1 malocclusion on a Class II skeletal base with increased overjet and retrognathic mandible.' },
  { label: 'Class II div 2', text: 'Class II division 2 malocclusion with retroclined maxillary central incisors and deep bite.' },
  { label: 'Class III Malocclusion', text: 'Class III malocclusion with reverse overjet and mandibular prognathism.' },
  { label: 'Bimaxillary Protrusion', text: 'Bimaxillary dentoalveolar protrusion with acute nasolabial angle and lip incompetency.' },
  { label: 'Max Anchorage', text: 'Maximum anchorage required in maxillary arch; Transpalatal Arch (TPA) / TADs indicated.' },
  { label: 'Moderate Anchorage', text: 'Moderate anchorage; reciprocal space closure with second premolar mesialization.' },
  { label: 'Extraction 14, 24, 34, 44', text: 'Therapeutic extraction of all four first premolars (14, 24, 34, 44) for crowding relief and profile flattening.' },
  { label: 'Non-Extraction / Stripping', text: 'Non-extraction protocol with interproximal reduction (IPR) and arch expansion.' },
  { label: 'Deep Bite Correction', text: 'Deep bite correction via anterior bite plane and leveling of lower curve of Spee.' },
  { label: 'Open Bite Correction', text: 'Anterior open bite correction with tongue habit appliance and posterior intrusion.' },
] as const;
