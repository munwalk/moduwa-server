import { PrismaClient } from '@prisma/client';
import * as termsRepository from '../repositories/terms.repository.js';
import { getPendingSignup, deletePendingSignup } from './token.service.js';
import { generateTokens } from './auth.service.js';

const prisma = new PrismaClient();

/**
 * 활성화된 약관 목록 조회
 */
export const getActiveTerms = async () => {
  return await termsRepository.findActiveTerms();
};
/**
 * 소셜 로그인 후 약관 동의 + 회원가입 완료
 */
export const completeSocialSignupWithTerms = async (pendingToken, agreements) => {
  // 1. 임시 가입 정보 조회
  const pendingData = await getPendingSignup(pendingToken);
  
  if (!pendingData) {
    throw new Error('PENDING_SIGNUP_EXPIRED');
  }

  const { provider, profile } = pendingData;
  const { id: providerUserId, email, nickname } = profile;

  // 2. 필수 약관 체크
  const requiredTerms = await termsRepository.findRequiredTerms();
  const requiredTermsIds = requiredTerms.map(term => term.id);

  const agreedRequiredTermsIds = agreements
    .filter(ag => ag.isAgreed && requiredTermsIds.includes(ag.termsId))
    .map(ag => ag.termsId);

  if (agreedRequiredTermsIds.length !== requiredTermsIds.length) {
    throw new Error('REQUIRED_TERMS_NOT_AGREED');
  }

  // 3. 트랜잭션: User 생성 + UserProvider 생성 + 약관 동의 저장
  const result = await prisma.$transaction(async (tx) => {
    // User 생성
    const user = await tx.user.create({
      data: {
        nickname: nickname || `${provider}_${String(providerUserId).slice(0, 8)}`,
        email,
        accountType: 'SOCIAL',
        lastLoginAt: new Date()
      }
    });

    // UserProvider 생성
    await tx.userProvider.create({
      data: {
        userId: user.id,
        provider,
        providerUserId: String(providerUserId)
      }
    });

    // UserSettings 생성
    await tx.userSettings.create({
      data: {
        userId: user.id
      }
    });

    // Subscription 생성
    await tx.subscription.create({
      data: {
        userId: user.id,
        planType: 'FREE',
        status: 'ACTIVE',
        startDate: new Date()
      }
    });

    // 약관 동의 저장
    const agreementsData = agreements.map(ag => ({
      userId: user.id,
      termsId: ag.termsId,
      isAgreed: ag.isAgreed,
      agreedAt: ag.isAgreed ? new Date() : null
    }));

    await tx.termsAgreement.createMany({
      data: agreementsData
    });

    return user;
  });

  // 4. 임시 가입 정보 삭제
  await deletePendingSignup(pendingToken);

  // 5. JWT 토큰 생성
  const tokens = await generateTokens(result.id, result.accountType);

  return {
    user: result,
    tokens,
    agreementsCount: agreements.filter(ag => ag.isAgreed).length
  };
};


/**
 * 약관 동의 생성 (회원가입 시 또는 추가 동의)
 */
export const createTermsAgreements = async (userId, agreements) => {
  // agreements: [{ termsId, isAgreed }]

  // 1. 필수 약관 체크
  const requiredTerms = await termsRepository.findRequiredTerms();
  const requiredTermsIds = requiredTerms.map(term => term.id);

  const agreedRequiredTermsIds = agreements
    .filter(ag => ag.isAgreed && requiredTermsIds.includes(ag.termsId))
    .map(ag => ag.termsId);

  if (agreedRequiredTermsIds.length !== requiredTermsIds.length) {
    throw new Error('REQUIRED_TERMS_NOT_AGREED');
  }

  // 2. 약관 동의 저장
  const agreementsData = agreements.map(ag => ({
    userId,
    termsId: ag.termsId,
    isAgreed: ag.isAgreed,
    agreedAt: ag.isAgreed ? new Date() : null
  }));

  await termsRepository.createBulkAgreements(agreementsData);

  return {
    userId,
    agreementsCount: agreements.filter(ag => ag.isAgreed).length
  };
};

/**
 * 사용자 약관 동의 내역 조회
 */
export const getUserTermsAgreements = async (userId) => {
  return await termsRepository.findUserAgreements(userId);
};

/**
 * 약관 동의 철회 (선택 약관만 가능)
 */
export const revokeTermsAgreement = async (userId, termsId) => {
  // 1. 약관 정보 조회
  const terms = await termsRepository.findTermsById(termsId);

  if (!terms) {
    throw new Error('TERMS_NOT_FOUND');
  }

  // 2. 필수 약관인지 확인
  if (terms.isRequired) {
    throw new Error('CANNOT_REVOKE_REQUIRED_TERMS');
  }

  // 3. 동의 철회
  await termsRepository.updateAgreement(userId, termsId, {
    isAgreed: false,
    revokedAt: new Date()
  });

  return true;
};