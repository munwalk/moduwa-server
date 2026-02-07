import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as userRepository from '../repositories/user.repository.js';
import * as userProviderRepository from '../repositories/userProvider.repository.js';
import * as termsRepository from '../repositories/terms.repository.js';
import { generateAccessToken, generateRefreshToken } from './jwt.service.js';
import { saveRefreshToken } from './token.service.js';

const prisma = new PrismaClient();

/**
 * 게스트 계정 생성
 */
export const createGuestAccount = async (deviceId) => {
  const randomNum = Math.floor(Math.random() * 10000);
  const nickname = `게스트${randomNum}`;

  const user = await userRepository.createUserWithDefaults({
    nickname,
    accountType: 'GUEST'
  });

  const tokens = await generateTokens(user.id, user.accountType);

  return { user, tokens };
};

/**
 * 소셜 로그인 (회원가입 또는 로그인)
 */
export const socialLogin = async (provider, profile) => {
  const { id: providerUserId, email, nickname } = profile;

  const userProvider = await userProviderRepository.findUserProvider(provider, String(providerUserId) );

  let user;

  if (userProvider) {
    user = userProvider.user;
    await userRepository.updateLastLogin(user.id);
  } else {
    user = await userRepository.createUserWithDefaults({
      nickname: nickname || `${provider}_${String(providerUserId).slice(0, 8)}`,
      email,
      accountType: 'SOCIAL',
      lastLoginAt: new Date()
    });

    await userProviderRepository.createUserProvider({
      userId: user.id,
      provider,
      providerUserId: String(providerUserId)
    });
  }

  const tokens = await generateTokens(user.id, user.accountType);

  return { user, tokens };
};

/**
 * 게스트 → 소셜 계정 전환 (약관 동의 포함)
 */
export const convertGuestToSocial = async (userId, provider, profile, agreements) => {
  const { id: providerUserId, email, nickname } = profile;

  // 1. 사용자 확인
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  if (user.accountType !== 'GUEST') {
    throw new Error('NOT_GUEST_ACCOUNT');
  }

  // 2. 소셜 계정 중복 확인
  const existingProvider = await userProviderRepository.findUserProvider(provider, String(providerUserId));

  if (existingProvider) {
    throw new Error('SOCIAL_ACCOUNT_ALREADY_LINKED');
  }

  // 3. 필수 약관 동의 확인
  const requiredTerms = await termsRepository.findRequiredTerms();
  const requiredTermsIds = requiredTerms.map(term => term.id);

  const agreedRequiredTermsIds = agreements
    .filter(ag => ag.isAgreed && requiredTermsIds.includes(ag.termsId))
    .map(ag => ag.termsId);

  if (agreedRequiredTermsIds.length !== requiredTermsIds.length) {
    throw new Error('REQUIRED_TERMS_NOT_AGREED');
  }

  // 4. 약관 동의 데이터 생성
  const agreementsData = agreements.map(ag => ({
    userId,
    termsId: ag.termsId,
    isAgreed: ag.isAgreed,
    agreedAt: ag.isAgreed ? new Date() : null
  }));

  // 5. 계정 전환 + 약관 동의 저장 (트랜잭션)
  const updatedUser = await userRepository.convertGuestToSocial(
    userId,
    {
      userId,
      provider,
      providerUserId: String(providerUserId)
    },
    {
      accountType: 'SOCIAL',
      email,
      nickname: nickname || user.nickname
    },
    agreementsData
  );

  return updatedUser;
};

/**
 * Token 생성 (Access + Refresh)
 */
export const generateTokens = async (userId, accountType) => {
  const payload = { userId, accountType };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await saveRefreshToken(userId, refreshToken);

  return {
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: 3600
  };
};

/**
 * 사용자 조회
 */
export const getUserById = async (userId) => {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  return {
    user,
    settings: user.settings,
    subscription: user.subscriptions[0] || null
  };
};

/**
 * 기존 사용자 확인
 */
export const checkExistingUser = async (provider, providerUserId) => {
  const userProvider = await userProviderRepository.findUserProvider(provider, String(providerUserId));
  
  if (userProvider) {
    return userProvider.user;
  }
  
  return null;
};

/**
 * 기존 회원 로그인 처리
 */
export const loginExistingUser = async (user) => {
  // 마지막 로그인 시간 업데이트
  await userRepository.updateLastLogin(user.id);

  // 토큰 생성
  const tokens = await generateTokens(user.id, user.accountType);

  return { user, tokens };
};
