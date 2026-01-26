import asyncHandler from '../../common/utils/asyncHandler.js';
import * as accountService from '../services/account.service.js';
import { successResponse } from '../../common/utils/response.js';

/**
 * 회원탈퇴
 * DELETE /api/auth/account
 */
export const deleteAccount = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  await accountService.deleteUserAccount(userId);

  return successResponse(res, null, '회원탈퇴가 완료되었습니다', 200);
});