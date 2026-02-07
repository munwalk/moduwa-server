import express from "express";
import {
  getRoutines,
  postRoutine,
  patchRoutine,
  deleteSelectedRoutines,
  deleteAllRoutinesController,
  getRoutineModal,
  snoozeRoutineModal,
  dismissRoutineModal,
} from "./routine.controller.js";
import { authenticate } from "../auth/middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Routines - 자동 출력 문장 API
 *     description: 자동 출력 문장(루틴 문장) 생성/조회/수정/삭제 및 모달(다시알림/끄기) API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Routine:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "65244887-9c33-4cba-9d40-da31f0f0c111"
 *         message:
 *           type: string
 *           example: "물을 끓여와주세요."
 *         repeatType:
 *           type: string
 *           description: "반복 주기"
 *           example: "WEEKLY"
 *           enum: [DAILY, WEEKLY, BIWEEKLY, MONTHLY]
 *         daysOfWeek:
 *           type: array
 *           nullable: true
 *           description: "WEEKLY/BIWEEKLY에서만 사용 (1=월 ~ 7=일)"
 *           items:
 *             type: integer
 *             minimum: 1
 *             maximum: 7
 *           example: [2,4,6]
 *         daysOfMonth:
 *           type: array
 *           nullable: true
 *           description: "MONTHLY에서만 사용 (1~31)"
 *           items:
 *             type: integer
 *             minimum: 1
 *             maximum: 31
 *           example: [10,20]
 *         isMonthEnd:
 *           type: boolean
 *           description: "MONTHLY에서 말일 버튼 선택 여부"
 *           example: true
 *         scheduledTime:
 *           type: string
 *           description: "HH:MM"
 *           example: "08:30"
 *         isActive:
 *           type: boolean
 *           example: true
 *         snoozedUntil:
 *           type: string
 *           nullable: true
 *           format: date-time
 *           example: "2026-02-07T12:35:00.000Z"
 *         dismissedUntil:
 *           type: string
 *           nullable: true
 *           format: date-time
 *           example: "2026-02-07T23:59:59.999Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     RoutineCreateRequest:
 *       type: object
 *       required: [message, scheduledTime]
 *       properties:
 *         message:
 *           type: string
 *           example: "약 먹을 시간이에요."
 *         scheduledTime:
 *           type: string
 *           example: "21:00"
 *         repeatType:
 *           type: string
 *           example: "MONTHLY"
 *           enum: [DAILY, WEEKLY, BIWEEKLY, MONTHLY]
 *         daysOfWeek:
 *           type: array
 *           nullable: true
 *           items:
 *             type: integer
 *           example: [2,4,6]
 *         daysOfMonth:
 *           type: array
 *           nullable: true
 *           items:
 *             type: integer
 *           example: [10,20]
 *         isMonthEnd:
 *           type: boolean
 *           example: true
 *
 *     RoutineUpdateRequest:
 *       type: object
 *       description: "PATCH는 message/scheduledTime/repeatType/daysOfWeek/daysOfMonth/isMonthEnd 중 1개 이상"
 *       properties:
 *         message:
 *           type: string
 *           example: "물을 끓여와주세요."
 *         scheduledTime:
 *           type: string
 *           example: "08:30"
 *         repeatType:
 *           type: string
 *           example: "WEEKLY"
 *           enum: [DAILY, WEEKLY, BIWEEKLY, MONTHLY]
 *         daysOfWeek:
 *           type: array
 *           nullable: true
 *           items:
 *             type: integer
 *           example: [2,4,6]
 *         daysOfMonth:
 *           type: array
 *           nullable: true
 *           items:
 *             type: integer
 *           example: [10,20]
 *         isMonthEnd:
 *           type: boolean
 *           example: false
 *
 *     RoutineDeleteRequest:
 *       type: object
 *       required: [ids]
 *       properties:
 *         ids:
 *           type: array
 *           items:
 *             type: string
 *           example: ["65244887-9c33-4cba-9d40-da31f0f0c111", "8f9a8c2a-1111-2222-3333-444444444444"]
 *
 *     RoutineModalResponse:
 *       type: object
 *       properties:
 *         routine:
 *           nullable: true
 *           allOf:
 *             - $ref: "#/components/schemas/Routine"
 *         actions:
 *           type: object
 *           properties:
 *             snoozeMinutes:
 *               type: integer
 *               example: 5
 *             canSnooze:
 *               type: boolean
 *               example: true
 *             canDismiss:
 *               type: boolean
 *               example: true
 *         serverTime:
 *           type: string
 *           format: date-time
 *
 *     RoutineSnoozeRequest:
 *       type: object
 *       properties:
 *         minutes:
 *           type: integer
 *           description: "기본값 5, 허용 1~60"
 *           example: 5
 */

/**
 * @swagger
 * /api/routines:
 *   get:
 *     tags: [Routines - 자동 출력 문장 API]
 *     summary: 루틴 문장 목록 조회
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 루틴 문장 목록 조회 성공
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
 *                     routines:
 *                       type: array
 *                       items:
 *                         $ref: "#/components/schemas/Routine"
 *                 message:
 *                   type: string
 *                   example: "루틴 문장 목록 조회 성공"
 */
router.get("/", authenticate, getRoutines);

/**
 * @swagger
 * /api/routines:
 *   post:
 *     tags: [Routines - 자동 출력 문장 API]
 *     summary: 루틴 문장 생성
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/RoutineCreateRequest"
 *     responses:
 *       200:
 *         description: 루틴 문장 생성 성공
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
 *                     routine:
 *                       $ref: "#/components/schemas/Routine"
 *                 message:
 *                   type: string
 *                   example: "루틴 문장 생성 성공"
 *       400:
 *         description: 유효성 오류
 */
router.post("/", authenticate, postRoutine);

/**
 * @swagger
 * /api/routines/{id}:
 *   patch:
 *     tags: [Routines - 자동 출력 문장 API]
 *     summary: 루틴 문장 수정
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: routineId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/RoutineUpdateRequest"
 *     responses:
 *       200:
 *         description: 루틴 문장 수정 성공
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
 *                     routine:
 *                       $ref: "#/components/schemas/Routine"
 *                 message:
 *                   type: string
 *                   example: "루틴 문장 수정 성공"
 *       400:
 *         description: 유효성 오류
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 대상 없음
 */
router.patch("/:id", authenticate, patchRoutine);

/**
 * @swagger
 * /api/routines:
 *   delete:
 *     tags: [Routines - 자동 출력 문장 API]
 *     summary: 루틴 문장 선택 삭제
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/RoutineDeleteRequest"
 *     responses:
 *       200:
 *         description: 루틴 문장 선택 삭제 성공
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
 *                       example: 2
 *                     deletedIds:
 *                       type: array
 *                       items:
 *                         type: string
 *                 message:
 *                   type: string
 *                   example: "루틴 문장 선택 삭제 성공"
 */
router.delete("/", authenticate, deleteSelectedRoutines);

/**
 * @swagger
 * /api/routines/all:
 *   delete:
 *     tags: [Routines - 자동 출력 문장 API]
 *     summary: 루틴 문장 전체 삭제
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 루틴 문장 전체 삭제 성공
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
 *                       example: 4
 *                 message:
 *                   type: string
 *                   example: "루틴 문장 전체 삭제 성공"
 */
router.delete("/all", authenticate, deleteAllRoutinesController);

/**
 * @swagger
 * /api/routines/modal:
 *   get:
 *     tags: [Routines - 자동 출력 문장 API]
 *     summary: 자동 출력 문장 모달 조회 (현재 시각에 해당하는 루틴 1건)
 *     description: "현재 시간(HH:MM) + 반복 조건(매일/매주/격주/매월/말일) + snooze/dismiss 상태를 반영하여, 모달에 띄울 루틴 1건을 반환합니다. 대상이 없으면 routine=null"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 자동 출력 문장 모달 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: "#/components/schemas/RoutineModalResponse"
 *                 message:
 *                   type: string
 *                   example: "자동 출력 문장 모달 조회 성공"
 */
router.get("/modal", authenticate, getRoutineModal);

/**
 * @swagger
 * /api/routines/{id}/modal/snooze:
 *   post:
 *     tags: [Routines - 자동 출력 문장 API]
 *     summary: 자동 출력 문장 5분 뒤 다시 알림 (snooze)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: routineId
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/RoutineSnoozeRequest"
 *     responses:
 *       200:
 *         description: 자동 출력 문장 다시 알림 설정 성공
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
 *                     routine:
 *                       $ref: "#/components/schemas/Routine"
 *                     snoozedUntil:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: "자동 출력 문장 5분 뒤 다시 알림 설정 성공"
 */
router.post("/:id/modal/snooze", authenticate, snoozeRoutineModal);

/**
 * @swagger
 * /api/routines/{id}/modal/dismiss:
 *   post:
 *     tags: [Routines - 자동 출력 문장 API]
 *     summary: 자동 출력 문장 오늘 끄기 (dismiss)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: routineId
 *     responses:
 *       200:
 *         description: 자동 출력 문장 끄기(오늘) 성공
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
 *                     routine:
 *                       $ref: "#/components/schemas/Routine"
 *                     dismissedUntil:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: "자동 출력 문장 끄기(오늘) 성공"
 */
router.post("/:id/modal/dismiss", authenticate, dismissRoutineModal);

export default router;
