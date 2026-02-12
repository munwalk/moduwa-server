-- DropForeignKey
ALTER TABLE `AIFeedback` DROP FOREIGN KEY `AIFeedback_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `ConversationHistory` DROP FOREIGN KEY `ConversationHistory_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `FavoriteSentence` DROP FOREIGN KEY `FavoriteSentence_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `RoutineMessage` DROP FOREIGN KEY `RoutineMessage_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `Subscription` DROP FOREIGN KEY `Subscription_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `TermsAgreement` DROP FOREIGN KEY `TermsAgreement_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `UserCategory` DROP FOREIGN KEY `UserCategory_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `UserProvider` DROP FOREIGN KEY `UserProvider_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `UserSettings` DROP FOREIGN KEY `UserSettings_user_id_fkey`;

-- DropIndex
DROP INDEX `UserWord_category_id_display_order_idx` ON `UserWord`;

-- AlterTable
ALTER TABLE `AIFeedback` MODIFY `user_id` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `ConversationHistory` MODIFY `user_id` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `FavoriteSentence` MODIFY `user_id` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `RoutineMessage` ADD COLUMN `days_of_month` JSON NULL,
    ADD COLUMN `dismissed_until` DATETIME(3) NULL,
    ADD COLUMN `is_month_end` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `repeat_type` VARCHAR(20) NOT NULL DEFAULT 'WEEKLY',
    ADD COLUMN `snoozed_until` DATETIME(3) NULL,
    MODIFY `user_id` VARCHAR(255) NOT NULL,
    MODIFY `days_of_week` JSON NULL;

-- AlterTable
ALTER TABLE `Subscription` MODIFY `user_id` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `TermsAgreement` MODIFY `user_id` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `UserCategory` ADD COLUMN `isDefault` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `user_id` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `UserProvider` MODIFY `user_id` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `UserSettings` MODIFY `user_id` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `UserWord` ALTER COLUMN `part_of_speech` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Word` ALTER COLUMN `part_of_speech` DROP DEFAULT;

-- CreateIndex
CREATE INDEX `ConversationHistory_user_id_is_deleted_selected_sentence_idx` ON `ConversationHistory`(`user_id`, `is_deleted`, `selected_sentence`(255));

-- CreateIndex
CREATE INDEX `RoutineMessage_user_id_repeat_type_idx` ON `RoutineMessage`(`user_id`, `repeat_type`);

-- AddForeignKey
ALTER TABLE `UserProvider` ADD CONSTRAINT `UserProvider_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCategory` ADD CONSTRAINT `UserCategory_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserWord` ADD CONSTRAINT `UserWord_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteSentence` ADD CONSTRAINT `FavoriteSentence_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoutineMessage` ADD CONSTRAINT `RoutineMessage_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationHistory` ADD CONSTRAINT `ConversationHistory_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIFeedback` ADD CONSTRAINT `AIFeedback_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSettings` ADD CONSTRAINT `UserSettings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TermsAgreement` ADD CONSTRAINT `TermsAgreement_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
