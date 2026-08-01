export type LanguageCode = "en" | "hi" | "gu" | "ja" | "ko";

export const LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "ja", label: "Japanese", native: "日本語" },
  { code: "ko", label: "Korean", native: "한국어" },
];

export const DIFFICULTIES = ["Grade 5", "Grade 8", "Grade 10", "College", "Expert"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export type Explanation = Record<LanguageCode, string>;

export const EXPLANATIONS: Record<Difficulty, Explanation> = {
  "Grade 5": {
    en: "Imagine a coin spinning on a table. While it spins, it is not heads or tails — it is both at once. A tiny particle can do the same thing until someone looks at it.",
    hi: "एक सिक्का घूम रहा है। जब तक वह घूम रहा है, वह न चित है न पट — दोनों है। एक छोटा कण भी ऐसा ही करता है, जब तक कोई उसे देख न ले।",
    gu: "એક સિક્કો ફરતો હોય ત્યારે તે નથી છાપ કે નથી કાંટો — બંને છે. નાનો કણ પણ એવું જ કરે છે, જ્યાં સુધી કોઈ જુએ નહીં.",
    ja: "回っているコインを想像して。回っている間は表でも裏でもなく、両方です。小さな粒子も、誰かが見るまで同じことをします。",
    ko: "돌고 있는 동전을 상상해 보세요. 도는 동안엔 앞면도 뒷면도 아닌 둘 다입니다. 작은 입자도 누군가 보기 전까지 똑같이 행동해요.",
  },
  "Grade 8": {
    en: "A quantum particle can hold several possible states at the same time. We only get one definite answer when we measure it — before that, physics only gives us the chances of each outcome.",
    hi: "एक क्वांटम कण एक साथ कई संभावित अवस्थाओं में रह सकता है। निश्चित उत्तर तभी मिलता है जब हम माप लेते हैं — उससे पहले भौतिकी केवल संभावनाएँ बताती है।",
    gu: "ક્વોન્ટમ કણ એકસાથે અનેક શક્ય સ્થિતિમાં રહી શકે છે. ચોક્કસ જવાબ માપ્યા પછી જ મળે છે — તે પહેલાં ભૌતિકશાસ્ત્ર માત્ર શક્યતાઓ આપે છે.",
    ja: "量子の粒子は複数の状態を同時に持てます。確定した答えは測定した瞬間だけ得られ、それまでは確率しか分かりません。",
    ko: "양자 입자는 여러 상태를 동시에 가질 수 있습니다. 확정된 답은 측정할 때만 나오고, 그전에는 확률만 알 수 있어요.",
  },
  "Grade 10": {
    en: "Superposition means a quantum system exists as a weighted combination of basis states. Measurement collapses that combination into one outcome, with probability given by the square of each weight.",
    hi: "सुपरपोज़िशन का अर्थ है कि क्वांटम तंत्र आधार अवस्थाओं के भारित संयोजन में रहता है। मापन उसे एक परिणाम में समेट देता है, जिसकी प्रायिकता भार के वर्ग के बराबर होती है।",
    gu: "સુપરપોઝિશન એટલે ક્વોન્ટમ સિસ્ટમ બેઝ સ્થિતિઓના વજનવાળા સંયોજનમાં હોય છે. માપન તેને એક પરિણામમાં સંકોચે છે, જેની સંભાવના વજનના વર્ગ જેટલી હોય છે.",
    ja: "重ね合わせとは、量子系が基底状態の重み付き結合として存在することです。測定によって一つの結果に収縮し、その確率は重みの二乗で決まります。",
    ko: "중첩이란 양자계가 기저 상태들의 가중 결합으로 존재한다는 뜻입니다. 측정하면 하나의 결과로 붕괴하며, 확률은 가중치의 제곱입니다.",
  },
  College: {
    en: "A pure state |ψ⟩ = α|0⟩ + β|1⟩ lives in a two-dimensional Hilbert space with |α|² + |β|² = 1. Measurement in the computational basis yields |0⟩ with probability |α|², and relative phase between α and β drives interference.",
    hi: "शुद्ध अवस्था |ψ⟩ = α|0⟩ + β|1⟩ दो-आयामी हिल्बर्ट स्पेस में होती है जहाँ |α|² + |β|² = 1। मापन पर |0⟩ मिलने की प्रायिकता |α|² है, और α व β का सापेक्ष कला अंतर व्यतिकरण उत्पन्न करता है।",
    gu: "શુદ્ધ સ્થિતિ |ψ⟩ = α|0⟩ + β|1⟩ દ્વિ-પરિમાણીય હિલ્બર્ટ સ્પેસમાં હોય છે, જ્યાં |α|² + |β|² = 1. માપનમાં |0⟩ મળવાની સંભાવના |α|² છે અને સાપેક્ષ ફેઝ ઇન્ટરફિયરન્સ સર્જે છે.",
    ja: "純粋状態 |ψ⟩ = α|0⟩ + β|1⟩ は |α|² + |β|² = 1 を満たす二次元ヒルベルト空間の元です。計算基底での測定は確率 |α|² で |0⟩ を与え、α と β の相対位相が干渉を生みます。",
    ko: "순수 상태 |ψ⟩ = α|0⟩ + β|1⟩ 는 |α|² + |β|² = 1 인 2차원 힐베르트 공간의 원소입니다. 계산 기저 측정은 확률 |α|²로 |0⟩을 주고, 상대 위상이 간섭을 만듭니다.",
  },
  Expert: {
    en: "Superposition is linearity of the state space, not an epistemic mixture: ρ = |ψ⟩⟨ψ| retains off-diagonal coherences that a classical mixture lacks. Environmental entanglement suppresses those terms on the decoherence timescale, yielding an effectively diagonal ensemble in the pointer basis.",
    hi: "सुपरपोज़िशन अवस्था-समष्टि की रैखिकता है, कोई सांख्यिकीय मिश्रण नहीं: ρ = |ψ⟩⟨ψ| में विकर्ण-बाह्य कोहेरेंस बचे रहते हैं। पर्यावरणीय उलझाव इन पदों को डीकोहेरेंस काल में दबा देता है।",
    gu: "સુપરપોઝિશન એ સ્ટેટ-સ્પેસની રેખીયતા છે, આંકડાકીય મિશ્રણ નહીં: ρ = |ψ⟩⟨ψ| માં ઓફ-ડાયગોનલ કોહેરન્સ રહે છે. પર્યાવરણીય એન્ટેંગલમેન્ટ તેમને ડીકોહેરન્સ સમયમાં દબાવે છે.",
    ja: "重ね合わせは状態空間の線形性であり、認識的混合ではありません。ρ = |ψ⟩⟨ψ| は古典混合にない非対角コヒーレンスを持ち、環境との量子もつれがデコヒーレンス時間でそれを抑制します。",
    ko: "중첩은 상태공간의 선형성이며 인식론적 혼합이 아닙니다. ρ = |ψ⟩⟨ψ|는 고전 혼합에 없는 비대각 결맞음을 가지며, 환경 얽힘이 결어긋남 시간 척도에서 이를 억제합니다.",
  },
};

export const ANALOGIES: Record<Difficulty, string> = {
  "Grade 5": "Like a spinning coin that hasn't landed yet.",
  "Grade 8": "Like a music playlist on shuffle — the next song exists as chances until it plays.",
  "Grade 10": "Like two waves in a pond overlapping to make one combined pattern.",
  College: "Like a vector pointing anywhere on a globe until you project it onto an axis.",
  Expert: "Like an interference pattern that survives only while the phase record stays private.",
};

export type TranscriptLine = {
  id: number;
  speaker: "Professor" | "Student";
  time: string;
  text: string;
  terms?: string[];
};

export const TRANSCRIPT: TranscriptLine[] = [
  {
    id: 1,
    speaker: "Professor",
    time: "10:02",
    text: "Today we'll discuss Quantum Superposition, the idea underneath every qubit you'll ever build.",
    terms: ["Quantum Superposition", "qubit"],
  },
  {
    id: 2,
    speaker: "Professor",
    time: "10:03",
    text: "Recall from last week that a classical bit is strictly zero or one. A qubit refuses that constraint.",
    terms: ["qubit"],
  },
  {
    id: 3,
    speaker: "Professor",
    time: "10:04",
    text: "We write the state as alpha ket zero plus beta ket one, where the squared amplitudes sum to one.",
    terms: ["amplitude"],
  },
  {
    id: 4,
    speaker: "Student",
    time: "10:05",
    text: "So the particle is genuinely in both states, not just unknown to us?",
  },
  {
    id: 5,
    speaker: "Professor",
    time: "10:05",
    text: "Correct. And that distinction is measurable — interference proves it. A mere lack of knowledge cannot interfere.",
    terms: ["interference"],
  },
  {
    id: 6,
    speaker: "Professor",
    time: "10:07",
    text: "The moment the environment learns which path was taken, Decoherence destroys the interference pattern.",
    terms: ["Decoherence", "interference"],
  },
  {
    id: 7,
    speaker: "Professor",
    time: "10:08",
    text: "Next we'll connect this to Entropy, and why information loss always points one direction in time.",
    terms: ["Entropy"],
  },
];

export type DictionaryEntry = {
  term: string;
  pronunciation: string;
  category: string;
  definition: string;
  simple: string;
  analogy: string;
  related: string[];
  examples: string[];
};

export const DICTIONARY: Record<string, DictionaryEntry> = {
  "quantum superposition": {
    term: "Quantum Superposition",
    pronunciation: "/ˈkwɒn.təm ˌsuː.pə.pəˈzɪʃ.ən/",
    category: "Quantum Mechanics",
    definition:
      "The principle that a quantum system can exist in a linear combination of multiple basis states simultaneously until measured.",
    simple:
      "A tiny particle can be in more than one situation at once — the universe only picks one when you check.",
    analogy:
      "A spinning coin: while it spins it is neither heads nor tails, it is a blend of both possibilities.",
    related: ["Qubit", "Decoherence", "Interference", "Wave function"],
    examples: [
      "A qubit in state (|0⟩ + |1⟩)/√2 gives 50/50 outcomes.",
      "Electrons passing a double slit interfere with themselves.",
    ],
  },
  qubit: {
    term: "Qubit",
    pronunciation: "/ˈkjuː.bɪt/",
    category: "Quantum Computing",
    definition:
      "The basic unit of quantum information: a two-level system whose state is a superposition of |0⟩ and |1⟩.",
    simple: "Like a normal computer bit, but it can hold a mix of 0 and 1 at the same time.",
    analogy: "A dimmer switch instead of an on/off switch — with a phase dial attached.",
    related: ["Quantum Superposition", "Bloch sphere", "Entanglement"],
    examples: ["Superconducting transmons act as qubits at 15 millikelvin."],
  },
  decoherence: {
    term: "Decoherence",
    pronunciation: "/diːkəʊˈhɪər.əns/",
    category: "Quantum Mechanics",
    definition:
      "The loss of quantum coherence as a system becomes entangled with its environment, suppressing off-diagonal terms in the density matrix.",
    simple: "When the outside world 'peeks' at a particle, the magic mixing quietly disappears.",
    analogy: "A secret stays powerful only while nobody overhears it.",
    related: ["Quantum Superposition", "Entropy", "Measurement"],
    examples: ["Qubits are shielded and cooled to delay decoherence past the gate time."],
  },
  entropy: {
    term: "Entropy",
    pronunciation: "/ˈen.trə.pi/",
    category: "Thermodynamics",
    definition:
      "A measure of the number of microscopic configurations consistent with a system's macroscopic state; it never decreases in an isolated system.",
    simple: "A score for how spread-out and disordered things are. It keeps going up.",
    analogy: "A tidy desk becomes messy on its own — never the other way around.",
    related: ["Second Law", "Decoherence", "Information"],
    examples: ["Ice melting in water raises the entropy of the combined system."],
  },
  interference: {
    term: "Interference",
    pronunciation: "/ˌɪn.təˈfɪər.əns/",
    category: "Wave Physics",
    definition:
      "The superposition of two or more waves producing a resultant amplitude that can be larger or smaller than the individual waves.",
    simple: "Two ripples meeting: sometimes they add up, sometimes they cancel out.",
    analogy: "Two people pushing a swing in rhythm — or against each other.",
    related: ["Quantum Superposition", "Amplitude", "Phase"],
    examples: ["The double-slit experiment's fringe pattern."],
  },
  amplitude: {
    term: "Amplitude",
    pronunciation: "/ˈæm.plɪ.tʃuːd/",
    category: "Quantum Mechanics",
    definition:
      "A complex number whose squared magnitude gives the probability of a measurement outcome.",
    simple: "A number that tells you how likely each possible answer is.",
    analogy: "The size of each slice in a probability pie — before you cut it.",
    related: ["Phase", "Born rule", "Wave function"],
    examples: ["|α|² = 0.25 means a 25% chance of measuring |0⟩."],
  },
  photosynthesis: {
    term: "Photosynthesis",
    pronunciation: "/ˌfəʊ.təʊˈsɪn.θə.sɪs/",
    category: "Biology",
    definition:
      "The process by which plants convert light energy, water and carbon dioxide into glucose and oxygen inside chloroplasts.",
    simple: "Plants use sunlight to cook their own food and breathe out oxygen.",
    analogy: "A leaf is a solar-powered kitchen: light in, sugar out, fresh air as a side effect.",
    related: ["Chlorophyll", "Chloroplast", "Cellular respiration"],
    examples: ["6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂"],
  },
};

export type VocabWord = {
  word: string;
  meaning: string;
  example: string;
  pronunciation: string;
  level: Difficulty;
};

export const VOCABULARY: VocabWord[] = [
  {
    word: "Coherence",
    meaning: "A fixed phase relationship that lets quantum states interfere.",
    example: "The qubit kept coherence for 120 microseconds.",
    pronunciation: "/kəʊˈhɪər.əns/",
    level: "College",
  },
  {
    word: "Eigenstate",
    meaning: "A state that a measurement leaves unchanged, up to a scale factor.",
    example: "After measuring, the system is in an eigenstate of the observable.",
    pronunciation: "/ˈaɪ.ɡənˌsteɪt/",
    level: "Expert",
  },
  {
    word: "Probability",
    meaning: "How likely an outcome is, from 0 to 1.",
    example: "The probability of heads is one half.",
    pronunciation: "/ˌprɒb.əˈbɪl.ə.ti/",
    level: "Grade 8",
  },
  {
    word: "Entanglement",
    meaning: "A shared state where two particles cannot be described separately.",
    example: "Entanglement links the two photons across the lab.",
    pronunciation: "/ɪnˈtæŋ.ɡəl.mənt/",
    level: "Grade 10",
  },
  {
    word: "Observable",
    meaning: "A physical quantity you can measure, like position or spin.",
    example: "Energy is the observable we measured today.",
    pronunciation: "/əbˈzɜː.və.bəl/",
    level: "Grade 10",
  },
  {
    word: "Wave",
    meaning: "A ripple that carries energy from one place to another.",
    example: "A water wave moves energy, not water.",
    pronunciation: "/weɪv/",
    level: "Grade 5",
  },
];

export type MemoryLecture = {
  id: string;
  title: string;
  date: string;
  concepts: string[];
  carried: string;
  status: "past" | "current";
};

export const MEMORY: MemoryLecture[] = [
  {
    id: "L1",
    title: "Classical Bits & Logic",
    date: "Mar 04",
    concepts: ["Bit", "Boolean gates", "Determinism"],
    carried: "You understood binary states well — used as the contrast for qubits.",
    status: "past",
  },
  {
    id: "L2",
    title: "Waves & Interference",
    date: "Mar 11",
    concepts: ["Amplitude", "Phase", "Interference"],
    carried: "Your interference notes are reused to explain superposition today.",
    status: "past",
  },
  {
    id: "L3",
    title: "Probability in Physics",
    date: "Mar 18",
    concepts: ["Distribution", "Expectation", "Born rule"],
    carried: "You struggled with the Born rule — AI re-explains it whenever |α|² appears.",
    status: "past",
  },
  {
    id: "L4",
    title: "Quantum Superposition",
    date: "Today",
    concepts: ["Superposition", "Qubit", "Decoherence"],
    carried: "Linking today's collapse discussion back to Lecture 2 interference.",
    status: "current",
  },
];

export const NOTES = {
  title: "Quantum Superposition",
  course: "PHY-341 · Introduction to Quantum Mechanics",
  date: "Today · 10:02 – 10:54",
  keyPoints: [
    "A qubit holds a weighted combination of |0⟩ and |1⟩, not an unknown classical value.",
    "Measurement collapses the state; probabilities follow the squared amplitude.",
    "Interference is the experimental proof that superposition is physical, not ignorance.",
    "Decoherence is environmental entanglement, and it sets the useful lifetime of a qubit.",
  ],
  formulas: [
    { expr: "|ψ⟩ = α|0⟩ + β|1⟩", note: "General single-qubit pure state" },
    { expr: "|α|² + |β|² = 1", note: "Normalisation condition" },
    { expr: "P(0) = |α|²", note: "Born rule for the computational basis" },
  ],
  definitions: [
    { term: "Superposition", body: "Linear combination of basis states in a Hilbert space." },
    { term: "Decoherence", body: "Loss of phase relationships via entanglement with environment." },
  ],
  examples: [
    "Hadamard on |0⟩ produces an equal superposition with 50/50 measurement statistics.",
    "The double-slit fringe pattern vanishes when a which-path detector is switched on.",
  ],
  summary:
    "Superposition is the linearity of quantum state space. It produces interference, it is destroyed by decoherence, and it is the resource every quantum algorithm spends.",
};

export type ChatMessage = { id: number; role: "user" | "ai"; text: string; context?: string };

export const CHAT_SEED: ChatMessage[] = [
  {
    id: 1,
    role: "user",
    text: "Why is entropy increasing?",
  },
  {
    id: 2,
    role: "ai",
    text: "Because there are vastly more disordered arrangements than ordered ones, a system drifting randomly almost always lands in a higher-entropy configuration. In today's lecture this is the same bookkeeping as decoherence: once the environment records which path the particle took, that information is spread out and cannot be gathered back.",
    context: "Linked to Lecture 3 · Probability in Physics",
  },
];

export const AI_REPLIES: string[] = [
  "Think of it as counting: each measurable outcome corresponds to many microscopic states, and the messy ones outnumber the tidy ones enormously. From Lecture 2, the same logic explains why interference fringes wash out.",
  "Short answer: the amplitudes still exist, but their relative phase is now stored in the environment. Since you noted in Lecture 3 that you found the Born rule tricky, remember P = |amplitude|² — phase disappears from that formula only once coherence is gone.",
  "Yes — and connecting to today's slide, that is exactly why quantum computers are refrigerated. Keeping the environment ignorant keeps the superposition usable.",
];

export const LOST_RECAP = {
  window: "10:03 – 10:08",
  summary:
    "You missed the transition from classical bits to qubits, and the first appearance of the amplitude equation.",
  points: [
    "A classical bit is strictly 0 or 1; a qubit holds α|0⟩ + β|1⟩ at once.",
    "Squared amplitudes must sum to 1 — that is just 'probabilities add to 100%'.",
    "Interference proves the mixture is real, not just missing information.",
    "The environment learning the path is called decoherence.",
  ],
  next: "The professor is about to link this to entropy — you are caught up.",
};
