import express from 'express';
import {
  getHistoryController,
  deleteHistoryController,
  deleteAllHistoryController,
  getOfflineWordsController
} from './history.controller.js';
import { authenticate } from '../auth/middlewares/auth.middleware.js';

const router = express.Router();

// 모든 경로에 authenticate를 적용하여 req.user.userId를 보장

/**
 * @swagger
 * /api/histories/offline-words:
 *   get:
 *     summary: 오프라인 사용 낱말 조회
 *     description: |
 *       사용자가 자주 사용하는 낱말을 조회합니다 (오프라인 사용 대비).
 *       즐겨찾기 낱말 전체 + 최근 3개월 이내 빈도순 낱말을 반환합니다.
 *       Redis 캐시 적용 (24시간 TTL).
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 80
 *           minimum: 1
 *           maximum: 80
 *         description: 빈도순 낱말 조회 개수 (기본값 80, 최대 80). 즐겨찾기는 개수 제한 없이 모두 포함.
 *     responses:
 *       200:
 *         description: 오프라인 사용 낱말 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     words:
 *                       type: array
 *                       description: 자주 사용한 낱말 목록 (즐겨찾기 우선, 이후 빈도수 내림차순 정렬)
 *                       items:
 *                         type: object
 *                         properties:
 *                           wordId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                             description: 낱말 카드 ID
 *                             example: "6c10795b-1da1-498e-9bda-d7c23b982ae1"
 *                           word:
 *                             type: string
 *                             description: 낱말
 *                             example: "물"
 *                           imageUrl:
 *                             type: string
 *                             nullable: true
 *                             description: 낱말 이미지 URL
 *                             example: "https://api.moduwa.com/images/물.png"
 *                           categoryId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                             description: 카테고리 ID
 *                             example: "4b74596e-5cad-4859-82a1-5cf43f6796fd"
 *                           categoryName:
 *                             type: string
 *                             nullable: true
 *                             description: 카테고리 이름
 *                             example: "음식"
 *                           isFavorite:
 *                             type: boolean
 *                             description: 즐겨찾기 여부
 *                             example: false
 *                           usageCount:
 *                             type: integer
 *                             description: 사용 횟수
 *                             example: 10
 *                           lastUsedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: 마지막 사용 시각 (ISO 8601 형식, 사용 기록 없으면 null)
 *                             example: "2026-01-30T17:24:05.217Z"
 *                     totalCount:
 *                       type: integer
 *                       description: 반환된 낱말 개수
 *                       example: 3
 *                     fromCache:
 *                       type: boolean
 *                       description: 캐시에서 반환되었는지 여부
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "오프라인 사용 낱말 조회 성공"
 *       400:
 *         description: limit 범위 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               limitTooSmall:
 *                 summary: limit 최소값 오류
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "limit은 1 이상이어야 합니다"
 *                     detail: null
 *               limitTooLarge:
 *                 summary: limit 최대값 오류
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "limit은 80 이하여야 합니다"
 *                     detail: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/offline-words', authenticate, getOfflineWordsController);

/**
 * @swagger
 * /api/histories:
 *   get:
 *     summary: 사용 기록 월별 조회
 *     description: 사용자의 학습 히스토리를 월별로 조회합니다 (삭제되지 않은 항목만, 최신순 정렬).
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1900
 *           maximum: 2100
 *         description: 조회할 년도 (1900~2100)
 *         example: 2026
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: 조회할 월 (1~12)
 *         example: 1
 *     responses:
 *       200:
 *         description: 대화 이력 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     histories:
 *                       type: array
 *                       description: 대화 이력 목록 (최신순 정렬)
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             description: 대화 기록 ID
 *                             example: "be7502ed-61ee-4932-a212-8eaa656a7c36"
 *                           inputWords:
 *                             type: array
 *                             description: 입력한 낱말 카드 배열
 *                             items:
 *                               type: object
 *                               properties:
 *                                 wordId:
 *                                   type: string
 *                                   format: uuid
 *                                   nullable: true
 *                                   description: 낱말 카드 ID
 *                                   example: null
 *                                 word:
 *                                   type: string
 *                                   description: 낱말
 *                                   example: "물"
 *                                 order:
 *                                   type: integer
 *                                   description: 순서
 *                                   example: 1
 *                           selectedSentence:
 *                             type: string
 *                             description: 선택한 문장
 *                             example: "물 좀 주세요"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             description: 생성 시각 (ISO 8601 형식)
 *                             example: "2026-01-28T18:38:43.416Z"
 *                 message:
 *                   type: string
 *                   example: "대화 이력 조회 성공"
 *       400:
 *         description: 파라미터 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingParams:
 *                 summary: year/month 파라미터 없음
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "year와 month 파라미터가 필요합니다"
 *                     detail: null
 *               invalidYear:
 *                 summary: year 범위 오류
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "year는 1900~2100 사이여야 합니다"
 *                     detail: null
 *               invalidMonth:
 *                 summary: month 범위 오류
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "month는 1~12 사이여야 합니다"
 *                     detail: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', authenticate, getHistoryController);

/**
 * @swagger
 * /api/histories/{id}:
 *   delete:
 *     summary: 사용 기록 선택 삭제
 *     description: 특정 학습 히스토리를 삭제합니다 (Soft Delete). 사용자 본인의 히스토리만 삭제 가능합니다.
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 삭제할 대화 기록 ID
 *         example: "be7502ed-61ee-4932-a212-8eaa656a7c36"
 *     responses:
 *       200:
 *         description: 대화 이력 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedId:
 *                       type: string
 *                       format: uuid
 *                       description: 삭제된 대화 기록 ID
 *                       example: "be7502ed-61ee-4932-a212-8eaa656a7c36"
 *                 message:
 *                   type: string
 *                   example: "대화 이력 삭제 성공"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: 리소스 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "NOT_FOUND"
 *                 message: "해당 대화 이력을 찾을 수 없습니다"
 */
router.delete('/:id', authenticate, deleteHistoryController);

/**
 * @swagger
 * /api/histories:
 *   delete:
 *     summary: 사용 기록 월별 일괄 삭제
 *     description: 특정 월의 모든 학습 히스토리를 삭제합니다 (조회 당월 일괄 삭제, Soft Delete). 사용자 본인의 히스토리만 삭제 가능합니다.
 *     tags: [History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1900
 *           maximum: 2100
 *         description: 삭제할 년도 (1900~2100)
 *         example: 2026
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *         description: 삭제할 월 (1~12)
 *         example: 1
 *     responses:
 *       200:
 *         description: 대화 이력 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                       description: 삭제된 대화 기록 개수
 *                       example: 15
 *                 message:
 *                   type: string
 *                   description: 응답 메시지 (year년 month월 형식)
 *                   example: "2026년 1월 대화 이력 삭제 성공"
 *       400:
 *         description: 파라미터 오류
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingParams:
 *                 summary: year/month 파라미터 없음
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "year와 month 파라미터가 필요합니다"
 *                     detail: null
 *               invalidYear:
 *                 summary: year 범위 오류
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "year는 1900~2100 사이여야 합니다"
 *                     detail: null
 *               invalidMonth:
 *                 summary: month 범위 오류
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION001"
 *                     message: "month는 1~12 사이여야 합니다"
 *                     detail: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/', authenticate, deleteAllHistoryController);

export default router;