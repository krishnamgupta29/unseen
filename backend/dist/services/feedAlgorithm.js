"use strict";
/**
 * Feed Algorithm Service
 * Ranks posts using a weighted scoring formula
 *
 * SCORE = (E × 0.4) + (F × 0.3) + (R × 0.2) + (P × 0.1)
 *
 * E = Engagement Score  — likes, comments, saves, reposts
 * F = Freshness Score   — exponential decay over time
 * R = Relevance Score   — mood match, hashtag affinity
 * P = Personalization   — user interaction history
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.scorePost = scorePost;
exports.rankPosts = rankPosts;
exports.buildUserContext = buildUserContext;
exports.detectFeedMode = detectFeedMode;
const HOUR_MS = 3600000;
/**
 * Calculate the engagement score (0–100)
 */
function calcEngagement(post) {
    const raw = (post.likesCount * 1) +
        (post.commentsCount * 2) +
        (post.savesCount * 3) +
        (post.repostsCount * 2) +
        (post.viewsCount * 0.1);
    // Normalize with log scale to prevent viral posts dominating forever
    return Math.min(100, Math.log1p(raw) * 15);
}
/**
 * Calculate freshness score — decays over 72 hours
 */
function calcFreshness(createdAt) {
    const ageHours = (Date.now() - new Date(createdAt).getTime()) / HOUR_MS;
    return Math.max(0, 100 * Math.exp(-ageHours / 24));
}
/**
 * Calculate relevance based on user preferences
 */
function calcRelevance(post, ctx) {
    let score = 0;
    // Mood match
    if (post.moodTag && ctx.userMoods.includes(post.moodTag.toLowerCase())) {
        score += 40;
    }
    // Hashtag overlap
    const overlap = post.hashtags.filter(tag => ctx.userHashtags.includes(tag));
    score += Math.min(40, overlap.length * 15);
    // Followed author bonus
    if (ctx.followedAuthors.includes(post.author.toString())) {
        score += 20;
    }
    return Math.min(100, score);
}
/**
 * Late Night mode — active 11pm – 4am
 * Boosts posts with moods: lonely, sad, midnight, thoughts
 */
const LATE_NIGHT_MOODS = ['lonely', 'sad', 'midnight', 'thoughts', 'sleepless', 'melancholy', 'overthinking'];
function lateNightBoost(post) {
    if (!post.moodTag)
        return 0;
    return LATE_NIGHT_MOODS.some(m => post.moodTag.toLowerCase().includes(m)) ? 20 : 0;
}
/**
 * Rising posts — fast velocity in last 2 hours
 */
function calcVelocity(post) {
    const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / HOUR_MS;
    if (ageHours > 2)
        return 0;
    return Math.min(100, (post.engagementScore / Math.max(1, ageHours)) * 10);
}
/**
 * Master scoring function
 */
function scorePost(post, ctx) {
    const E = calcEngagement(post);
    const F = calcFreshness(post.createdAt);
    const R = calcRelevance(post, ctx);
    let score = E * 0.4 + F * 0.3 + R * 0.2;
    switch (ctx.feedMode) {
        case 'following':
            // Massively boost followed authors
            if (ctx.followedAuthors.includes(post.author.toString()))
                score += 30;
            break;
        case 'trending':
            score = E * 0.7 + F * 0.3;
            break;
        case 'late_night':
            score += lateNightBoost(post);
            break;
        case 'rising':
            score = calcVelocity(post) * 0.6 + F * 0.4;
            break;
        case 'for_you':
        default:
            score += 0; // balanced formula
    }
    return Math.min(100, Math.max(0, score));
}
/**
 * Sort posts by feed score for a given context
 */
function rankPosts(posts, ctx) {
    return posts
        .filter(p => !p.isDeleted && p.moderationStatus !== 'removed')
        .map(p => ({ post: p, score: scorePost(p, ctx) }))
        .sort((a, b) => b.score - a.score)
        .map(({ post }) => post);
}
/**
 * Build user context from interaction history
 */
function buildUserContext(followedAuthors, recentMoods, recentHashtags, feedMode) {
    return {
        userMoods: recentMoods,
        userHashtags: recentHashtags,
        followedAuthors,
        feedMode,
    };
}
/**
 * Detect current time mode for automatic Late Night suggestion
 */
function detectFeedMode() {
    const hour = new Date().getHours();
    return hour >= 23 || hour < 4 ? 'late_night' : 'for_you';
}
