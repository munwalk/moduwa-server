import prisma from "../config/prisma.config.js";

// GET
export const findRoutineMessagesByUser = async ({ userId }) => {
  return prisma.routineMessage.findMany({
    where: { userId },
    orderBy: [{ scheduledTime: "asc" }, { createdAt: "desc" }],
  });
};

// POST
export const createRoutineMessage = async ({
  userId,
  message,
  scheduledTime,
  repeatType,
  daysOfWeek,
  daysOfMonth,
  isMonthEnd,
}) => {
  return prisma.routineMessage.create({
    data: {
      userId,
      message,
      scheduledTime,
      isActive: true,
      repeatType: repeatType ?? "WEEKLY",
      daysOfWeek: daysOfWeek ?? null,
      daysOfMonth: daysOfMonth ?? null,
      isMonthEnd: !!isMonthEnd,
      snoozedUntil: null,
      dismissedUntil: null,
    },
  });
};

// PATCH
export const findRoutineById = async ({ id }) => {
  return prisma.routineMessage.findUnique({ where: { id } });
};

export const updateRoutineMessage = async ({ id, data }) => {
  return prisma.routineMessage.update({
    where: { id },
    data,
  });
};

// DELETE
export const deleteRoutineMessagesByIds = async ({ userId, ids }) => {
  return prisma.routineMessage.deleteMany({
    where: {
      userId,
      id: { in: ids },
    },
  });
};

export const deleteAllRoutineMessagesByUser = async ({ userId }) => {
  return prisma.routineMessage.deleteMany({
    where: { userId },
  });
};
