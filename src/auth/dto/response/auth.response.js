/**
 * 인증 응답 DTO
 */
export class AuthResponseDto {
  constructor(user, tokens) {
    this.user = {
      id: user.id,
      nickname: user.nickname,
      email: user.email || null,
      accountType: user.accountType
    };
    this.tokens = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType || 'Bearer',
      expiresIn: tokens.expiresIn || 3600
    };
  }
}

/**
 * 토큰 갱신 응답 DTO
 */
export class TokenRefreshResponseDto {
  constructor(tokens) {
    this.tokens = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: tokens.tokenType || 'Bearer',
      expiresIn: tokens.expiresIn || 3600
    };
  }
}