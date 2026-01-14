import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as userRepository from '../repositories/user.repository.js';
import * as userProviderRepository from '../repositories/userProvider.repository.js';
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

  const userProvider = await userProviderRepository.findUserProvider(provider, providerUserId);

  let user;

  if (userProvider) {
    user = userProvider.user;
    await userRepository.updateLastLogin(user.id);
  } else {
    user = await userRepository.createUserWithDefaults({
      nickname: nickname || `${provider}_${providerUserId.slice(0, 8)}`,
      email,
      accountType: 'SOCIAL',
      lastLoginAt: new Date()
    });

    await userProviderRepository.createUserProvider({
      userId: user.id,
      provider,
      providerUserId
    });
  }

  const tokens = await generateTokens(user.id, user.accountType);

  return { user, tokens };
};

/**
 * 게스트 → 소셜 계정 전환
 */
export const convertGuestToSocial = async (userId, provider, profile) => {
  const { id: providerUserId, email, nickname } = profile;

  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  if (user.accountType !== 'GUEST') {
    throw new Error('NOT_GUEST_ACCOUNT');
  }

  const existingProvider = await userProviderRepository.findUserProvider(provider, providerUserId);

  if (existingProvider) {
    throw new Error('SOCIAL_ACCOUNT_ALREADY_LINKED');
  }

  const updatedUser = await userRepository.convertGuestToSocial(
    userId,
    {
      userId,
      provider,
      providerUserId
    },
    {
      accountType: 'SOCIAL',
      email,
      nickname: nickname || user.nickname
    }
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