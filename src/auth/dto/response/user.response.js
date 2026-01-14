/**
 * 사용자 정보 응답 DTO
 */
export class UserResponseDto {
  constructor(user) {
    this.id = user.id;
    this.nickname = user.nickname;
    this.email = user.email || null;
    this.accountType = user.accountType;
    this.createdAt = user.createdAt;
    this.lastLoginAt = user.lastLoginAt;
  }
}

/**
 * 사용자 상세 정보 응답 DTO (설정 포함)
 */
export class UserDetailResponseDto {
  constructor(user, settings, subscription) {
    this.id = user.id;
    this.nickname = user.nickname;
    this.email = user.email || null;
    this.accountType = user.accountType;
    this.createdAt = user.createdAt;
    this.lastLoginAt = user.lastLoginAt;
    this.settings = settings ? {
      ttsVoiceType: settings.ttsVoiceType,
      ttsAgeType: settings.ttsAgeType,
      ttsTone: settings.ttsTone,
      gridColumns: settings.gridColumns
    } : null;
    this.subscription = subscription ? {
      planType: subscription.planType,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate
    } : null;
  }
}

/**
 * 계정 전환 응답 DTO
 */
export class ConvertAccountResponseDto {
  constructor(user) {
    this.id = user.id;
    this.nickname = user.nickname;
    this.email = user.email || null;
    this.accountType = user.accountType;
  }
}