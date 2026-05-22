/**
 * Content Moderation Service
 * v1: Keyword-based scoring (ML-ready architecture)
 * v2: Drop-in ML model replacement via moderateWithAI()
 */

// ─── Toxic keyword categories ───────────────────────────────────────────────
const TOXICITY_PATTERNS: { pattern: RegExp; weight: number; category: string }[] = [
  // Threats (high weight)
  { pattern: /\b(kill|murder|hurt|attack|threat|bomb|shoot|stab)\b/i, weight: 0.6, category: 'threat' },
  // Harassment
  { pattern: /\b(harass|stalk|follow you|find you|know where)\b/i, weight: 0.5, category: 'harassment' },
  // Self-harm
  { pattern: /\b(suicide|kill myself|end my life|self.?harm|cut myself|want to die)\b/i, weight: 0.7, category: 'self_harm' },
  // Hate speech (placeholder — real implementation uses trained classifier)
  { pattern: /\b(hate|disgusting|worthless|garbage|trash)\b/i, weight: 0.2, category: 'hate' },
  // Spam signals
  { pattern: /(https?:\/\/[^\s]+){3,}/i, weight: 0.4, category: 'spam_links' },
  { pattern: /(.)\1{9,}/i, weight: 0.3, category: 'spam_repeat' },
  // NSFW text signals
  { pattern: /\b(xxx|porn|nude|nsfw|explicit)\b/i, weight: 0.5, category: 'nsfw' },
];

const SPAM_PATTERNS = [
  /follow (me|for follow|4 follow)/i,
  /click (here|link|this)/i,
  /buy (now|cheap|discount)/i,
  /(free|win|winner|prize|congratulations).{0,20}(click|link|http)/i,
];

export interface ModerationResult {
  toxicityScore: number;     // 0.0 – 1.0
  isFlagged: boolean;
  isBlocked: boolean;
  categories: string[];
  reasons: string[];
}

/**
 * Analyze content and return a moderation result
 */
export function moderateContent(content: string): ModerationResult {
  let totalScore = 0;
  const categories: string[] = [];
  const reasons: string[] = [];

  // Run toxicity patterns
  for (const { pattern, weight, category } of TOXICITY_PATTERNS) {
    if (pattern.test(content)) {
      totalScore += weight;
      if (!categories.includes(category)) {
        categories.push(category);
        reasons.push(`Detected: ${category}`);
      }
    }
  }

  // Run spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(content)) {
      totalScore += 0.3;
      if (!categories.includes('spam')) {
        categories.push('spam');
        reasons.push('Spam pattern detected');
      }
    }
  }

  // Cap at 1.0
  const toxicityScore = Math.min(1.0, totalScore);

  return {
    toxicityScore,
    isFlagged: toxicityScore >= 0.4,
    isBlocked: toxicityScore >= 0.8,
    categories,
    reasons,
  };
}

/**
 * Detect duplicate/spam posts from same user
 */
const recentPostHashes = new Map<string, { hash: string; time: number }[]>();

export function detectSpamPost(userId: string, content: string): boolean {
  const now = Date.now();
  const hash = simpleHash(content.toLowerCase().trim());

  if (!recentPostHashes.has(userId)) {
    recentPostHashes.set(userId, []);
  }

  const userPosts = recentPostHashes.get(userId)!;

  // Clean posts older than 60 seconds
  const recent = userPosts.filter(p => now - p.time < 60000);

  // Flood check: >3 posts in 60 seconds
  if (recent.length >= 3) return true;

  // Duplicate content check
  if (recent.some(p => p.hash === hash)) return true;

  recent.push({ hash, time: now });
  recentPostHashes.set(userId, recent);
  return false;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
}

/**
 * Placeholder for future ML model integration
 * Replace body with actual API call to ML service
 */
export async function moderateWithAI(_content: string): Promise<number> {
  // Future: call to Python FastAPI ML service
  // const response = await fetch('http://ml-service/moderate', { method: 'POST', body: JSON.stringify({ text: content }) });
  // return (await response.json()).score;
  return 0;
}
