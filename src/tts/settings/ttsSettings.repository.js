import prisma from "../../config/prisma.config.js";

export const getOrCreateUserSettings = async ({ userId }) => {
    const existing = await prisma.userSettings.findUnique({
        where: { userId },
    });

    if (existing) {
        return existing;
    }

    // 기존 settings.repository.js 패턴을 그대로 따릅니다.
    // voiceKey는 DB default("ADULT_FEMALE_DEFAULT")로 들어가게 됩니다.
    return prisma.userSettings.create({
        data: {
            userId,
            gridColumns: 7,
        },
    });
};

export const upsertUserVoiceKey = async ({ userId, voiceKey }) => {
    return prisma.userSettings.upsert({
        where: { userId },
        update: { voiceKey },
        create: { userId, gridColumns: 7, voiceKey },
    });
};
