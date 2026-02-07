export const toRoutineDto = (row) => ({
  id: row.id,
  message: row.message,

  // weekly
  daysOfWeek: row.daysOfWeek ?? null,

  // monthly
  repeatType: row.repeatType ?? "WEEKLY",
  daysOfMonth: row.daysOfMonth ?? null,
  isMonthEnd: row.isMonthEnd ?? false,

  scheduledTime: row.scheduledTime,
  isActive: row.isActive,

  // 모달 상태
  snoozedUntil: row.snoozedUntil ?? null,
  dismissedUntil: row.dismissedUntil ?? null,

  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const toRoutineDtoList = (rows) => rows.map(toRoutineDto);
