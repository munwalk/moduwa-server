-- Add voiceKey column to UserSettings
ALTER TABLE `UserSettings`
  ADD COLUMN `voiceKey` VARCHAR(191) NOT NULL DEFAULT 'ADULT_FEMALE_DEFAULT';