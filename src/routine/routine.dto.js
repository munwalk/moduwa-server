export const toRoutineDto = (row) => ({
  id: row.id,
  message: row.message,
  daysOfWeek: row.daysOfWeek,
  scheduledTime: row.scheduledTime,
  isActive: row.isActive,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const toRoutineDtoList = (rows) => rows.map(toRoutineDto);
