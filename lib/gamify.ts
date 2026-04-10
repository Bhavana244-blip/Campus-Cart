import { Colors } from '../constants/colors';

export const XP_PER_LEVEL = 500;

export const XP_RULES = {
  DAILY_LOGIN: 10,
  POST_LISTING: 50,
  COMPLETE_SALE: 150,
  PRO_BUNDLE: 200,
  BUYER_REVIEW: 30,
};

export const getRankInfo = (level: number) => {
  if (level >= 20) return { title: 'Campus Legend', color: '#7C3AED', rank: 'MASTER' };
  if (level >= 15) return { title: 'Senior', color: '#F59E0B', rank: 'GOLD' };
  if (level >= 10) return { title: 'Junior', color: '#8B5CF6', rank: 'PURPLE' };
  if (level >= 5) return { title: 'Sophomore', color: '#3B82F6', rank: 'BLUE' };
  return { title: 'Freshman', color: '#10B981', rank: 'GREEN' };
};

export const calculateLevel = (xp: number) => {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
};

export const getXPProgress = (xp: number) => {
  const currentLevelXP = xp % XP_PER_LEVEL;
  return currentLevelXP / XP_PER_LEVEL;
};
