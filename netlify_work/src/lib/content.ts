// Shared static content for the Retain app.

export interface SeedFlashcard {
  subject: string;
  front: string;
  back: string;
}

export interface QuizQuestion {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const SUBJECTS = ["Physics", "Chemistry", "Biology", "General"] as const;

export const FLASHCARDS: SeedFlashcard[] = [
  { subject: "Physics", front: "What is the SI unit of force?", back: "Newton (N). One newton equals 1 kg·m/s² — the force needed to accelerate 1 kg at 1 m/s²." },
  { subject: "Physics", front: "What is Newton's Law of Universal Gravitation?", back: "F = G·m₁·m₂ / r² — force on masses depends on the product of their masses and the inverse square of the distance between them." },
  { subject: "Physics", front: "What is the approximate speed of light in a vacuum?", back: "3 × 10⁸ m/s (300,000,000 m/s) — the universal speed limit in empty space." },
  { subject: "Chemistry", front: "Which gas is produced when a metal reacts with a strong acid?", back: "Hydrogen gas (H₂). Metals push acidic hydrogen out of the solution, which bubbles off." },
  { subject: "Chemistry", front: "What is the pH of neutral water at 25°C?", back: "7 — below 7 is acidic, above 7 is basic; neutral sits exactly in the middle." },
  { subject: "Chemistry", front: "What is the atomic number of carbon?", back: "6 — meaning 6 protons. Carbon's versatility (4 valence electrons) is why life chemistry runs on it." },
  { subject: "Biology", front: "Where is the DNA stored in a cell?", back: "Primarily in the nucleus (and mitochondria). DNA carries the genetic instruction set." },
  { subject: "Biology", front: "What is the 'powerhouse of the cell'?", back: "The mitochondrion — the site of cellular respiration, converting food into ATP." },
  { subject: "Biology", front: "Where does photosynthesis mainly occur?", back: "In chloroplasts — the chlorophyll in thylakoid membranes captures sunlight and drives the reaction." },
  { subject: "General", front: "What is the derivative of sin(x)?", back: "cos(x). The derivative of cos(x) is -sin(x) — the classic pair." },
  { subject: "General", front: "What is the average speed formula?", back: "speed = distance ÷ time. For a train: 120 km ÷ 2 h = 60 km/h." },
  { subject: "General", front: "How much earlier should you start studying when the clock is the enemy?", back: "Earlier than you think. Record-time retention is a schedule problem first — curiosity is the fuel." },
];

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    subject: "Physics",
    question: "A car starts from rest and accelerates uniformly at 2 m/s² for 5 seconds. What is its final velocity?",
    options: ["5 m/s", "10 m/s", "25 m/s", "50 m/s"],
    correctIndex: 1,
    explanation: "v = u + a·t = 0 + 2 × 5 = 10 m/s.",
  },
  {
    id: "q2",
    subject: "Chemistry",
    question: "A strong acid has an H⁺ concentration of 10⁻⁴ M. What is its pH?",
    options: ["4", "10", "-4", "7"],
    correctIndex: 0,
    explanation: "pH = -log[H⁺] = -log(10⁻⁴) = 4.",
  },
  {
    id: "q3",
    subject: "Biology",
    question: "Which organelle is known as the 'powerhouse of the cell'?",
    options: ["Nucleus", "Ribosome", "Mitochondrion", "Golgi body"],
    correctIndex: 2,
    explanation: "The mitochondrion produces ATP through cellular respiration.",
  },
  {
    id: "q4",
    subject: "Physics",
    question: "What is the SI unit of electric charge?",
    options: ["Volt", "Coulomb", "Ampere", "Ohm"],
    correctIndex: 1,
    explanation: "The coulomb (C) — 1 C is carried by 6.24 × 10¹⁸ electrons.",
  },
  {
    id: "q5",
    subject: "Chemistry",
    question: "Which of the following is a noble gas?",
    options: ["Nitrogen", "Oxygen", "Neon", "Carbon"],
    correctIndex: 2,
    explanation: "Neon is a noble gas — inert and monoatomic, in Group 18.",
  },
  {
    id: "q6",
    subject: "Biology",
    question: "DNA is primarily located in the:",
    options: ["Cytoplasm", "Nucleus", "Mitochondria", "Ribosomes"],
    correctIndex: 1,
    explanation: "The nucleus houses the chromosomes — DNA's main home.",
  },
  {
    id: "q7",
    subject: "General",
    question: "If the derivative of f(x) is 2x, then f(x) must equal:",
    options: ["x² + C", "x² + 2C", "2x² + C", "x²/2 + C"],
    correctIndex: 0,
    explanation: "∫2x dx = x² + C. Constants of integration must be kept.",
  },
  {
    id: "q8",
    subject: "General",
    question: "A train travels 120 km in 2 hours. What is its average speed?",
    options: ["30 km/h", "60 km/h", "120 km/h", "240 km/h"],
    correctIndex: 1,
    explanation: "speed = distance ÷ time = 120 ÷ 2 = 60 km/h.",
  },
  {
    id: "q9",
    subject: "Chemistry",
    question: "What is the chemical symbol for gold?",
    options: ["Gd", "Au", "Ag", "Go"],
    correctIndex: 1,
    explanation: "Au — from the Latin 'aurum'. Ag is silver.",
  },
  {
    id: "q10",
    subject: "Biology",
    question: "During photosynthesis, sunlight is absorbed mainly by:",
    options: ["Chlorophyll", "Hemoglobin", "Keratin", "Insulin"],
    correctIndex: 0,
    explanation: "Chlorophyll in chloroplast thylakoids captures the light energy.",
  },
  {
    id: "q11",
    subject: "Physics",
    question: "What is the force of gravity on a 10 kg object near Earth's surface? (g ≈ 9.8 m/s²)",
    options: ["98 N", "9.8 N", "100 N", "980 N"],
    correctIndex: 0,
    explanation: "F = m·g = 10 × 9.8 = 98 N.",
  },
  {
    id: "q12",
    subject: "General",
    question: "What is the derivative of cos(x)?",
    options: ["sin(x)", "-sin(x)", "cos(x)", "-cos(x)"],
    correctIndex: 1,
    explanation: "d/dx cos(x) = -sin(x). A classic sign trap.",
  },
];

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Voices", href: "#voices" },
];

export const IMAGES = {
  heroDesk: "/images/hero-desk.jpg",
  cta: "/images/cta-texture.jpg",
};
