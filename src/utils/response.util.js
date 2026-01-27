/**
 * 공통 응답 헬퍼 미들웨어
 * 모든 컨트롤러에서 일관된 응답 형식을 사용하도록 지원
 */

/**
 * 성공 응답 헬퍼를 res 객체에 추가하는 미들웨어
 */
const responseHelper = (req, res, next) => {
  /**
   * 성공 응답
   * @param {Object} data - 응답 데이터
   * @param {string} message - 성공 메시지
   */
  res.success = (data, message = "요청 성공") => {
    return res.json({
      success: true,
      data,
      message,
    });
  };

  /**
   * 실패 응답
   * @param {Object} options - 에러 정보
   * @param {string} options.code - 에러 코드
   * @param {string} options.message - 에러 메시지
   * @param {*} options.detail - 에러 상세 정보 (옵션)
   */
  res.error = ({ code = "UNKNOWN", message = "오류 발생", detail = null }) => {
    return res.json({
      success: false,
      error: { code, message, detail },
    });
  };

  next();
};

export default responseHelper;
