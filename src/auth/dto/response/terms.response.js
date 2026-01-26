/**
 * 약관 응답 DTO
 */
export class TermsResponseDto {
  constructor(terms) {
    this.id = terms.id;
    this.title = terms.title;
    this.content = terms.content;
    this.version = terms.version;
    this.isRequired = terms.isRequired;
    this.order = terms.order;
  }
}

/**
 * 약관 동의 응답 DTO 
 */
export class TermsAgreementResponseDto {
  constructor(result) {
    this.user = result.user ? {
      id: result.user.id,
      nickname: result.user.nickname,
      email: result.user.email,
      accountType: result.user.accountType
    } : undefined;
    
    this.tokens = result.tokens || undefined;
    this.agreementsCount = result.agreementsCount;
    this.completedAt = new Date();
  }
}