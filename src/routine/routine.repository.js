import prisma from "../config/prisma.config.js";

export const findRoutineMessagesByUser = async ({ userId }) => {
  return prisma.routineMessage.findMany({
    where: { userId },
    orderBy: [{ scheduledTime: "asc" }, { createdAt: "desc" }],
  });
};

export const createRoutineMessage = async ({
  userId,
  message,
  daysOfWeek,
  scheduledTime,
}) => {
  return prisma.routineMessage.create({
    data: {
      userId,
      message,
      daysOfWeek,
      scheduledTime,
      isActive: true,
    },
  });
};
