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