-- CreateTable
CREATE TABLE `User` (
    `id` CHAR(36) NOT NULL,
    `nickname` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NULL,
    `account_type` ENUM('GUEST', 'SOCIAL') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `last_login_at` DATETIME(3) NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_account_type_idx`(`account_type`),
    INDEX `User_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserProvider` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `provider` ENUM('KAKAO', 'GOOGLE', 'NAVER') NOT NULL,
    `provider_user_id` VARCHAR(255) NOT NULL,
    `linked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserProvider_user_id_idx`(`user_id`),
    UNIQUE INDEX `UserProvider_provider_provider_user_id_key`(`provider`, `provider_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` CHAR(36) NOT NULL,
    `category_name` VARCHAR(50) NOT NULL,
    `display_order` INTEGER NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Category_category_name_key`(`category_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Word` (
    `id` CHAR(36) NOT NULL,
    `category_id` CHAR(36) NOT NULL,
    `word` VARCHAR(100) NOT NULL,
    `image_url` VARCHAR(500) NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Word_category_id_idx`(`category_id`),
    INDEX `Word_word_idx`(`word`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserCategory` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `category_name` VARCHAR(50) NOT NULL,
    `display_order` INTEGER NOT NULL,
    `icon_key` VARCHAR(50) NULL,
    `icon_url` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `UserCategory_user_id_display_order_idx`(`user_id`, `display_order`),
    UNIQUE INDEX `UserCategory_user_id_category_name_key`(`user_id`, `category_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserWord` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `word_id` CHAR(36) NULL,
    `user_category_id` CHAR(36) NOT NULL,
    `custom_word` VARCHAR(100) NULL,
    `custom_image_url` VARCHAR(500) NULL,
    `display_order` INTEGER NOT NULL,
    `is_favorite` BOOLEAN NOT NULL DEFAULT false,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `UserWord_user_id_idx`(`user_id`),
    INDEX `UserWord_user_id_is_favorite_idx`(`user_id`, `is_favorite`),
    INDEX `UserWord_user_id_is_deleted_idx`(`user_id`, `is_deleted`),
    INDEX `UserWord_user_category_id_display_order_idx`(`user_category_id`, `display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FavoriteSentence` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `sentence` TEXT NOT NULL,
    `sentence_source` ENUM('AI_SUGGESTED', 'USER_TYPED', 'EDITED') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FavoriteSentence_user_id_created_at_idx`(`user_id`, `created_at` DESC),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoutineMessage` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `message` TEXT NOT NULL,
    `days_of_week` JSON NOT NULL,
    `scheduled_time` VARCHAR(5) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `RoutineMessage_user_id_is_active_scheduled_time_idx`(`user_id`, `is_active`, `scheduled_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConversationHistory` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `input_words` JSON NULL,
    `typed_text` TEXT NULL,
    `input_type` ENUM('WORD_ONLY', 'TYPING_ONLY', 'MIXED') NOT NULL,
    `suggested_sentences` JSON NOT NULL,
    `selected_sentence` TEXT NULL,
    `selection_index` INTEGER NULL,
    `is_outputted` BOOLEAN NOT NULL DEFAULT false,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ConversationHistory_user_id_created_at_idx`(`user_id`, `created_at` DESC),
    INDEX `ConversationHistory_user_id_is_outputted_is_deleted_idx`(`user_id`, `is_outputted`, `is_deleted`),
    INDEX `ConversationHistory_user_id_is_deleted_created_at_idx`(`user_id`, `is_deleted`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AIFeedback` (
    `id` CHAR(36) NOT NULL,
    `conversation_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `original_sentence` TEXT NOT NULL,
    `edited_sentence` TEXT NOT NULL,
    `feedback_type` ENUM('EDITED', 'STYLE_CHANGED') NOT NULL,
    `edit_details` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AIFeedback_user_id_created_at_idx`(`user_id`, `created_at` DESC),
    INDEX `AIFeedback_conversation_id_idx`(`conversation_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSettings` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `tts_voice_type` ENUM('MALE', 'FEMALE') NOT NULL DEFAULT 'FEMALE',
    `tts_age_type` ENUM('YOUNG', 'OLD') NOT NULL DEFAULT 'YOUNG',
    `tts_tone` ENUM('NEUTRAL', 'WARM', 'ENERGETIC') NOT NULL DEFAULT 'NEUTRAL',
    `grid_columns` INTEGER NOT NULL DEFAULT 4,
    `preferences` JSON NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserSettings_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `plan_type` ENUM('FREE', 'PREMIUM', 'ENTERPRISE') NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Subscription_user_id_idx`(`user_id`),
    INDEX `Subscription_user_id_status_idx`(`user_id`, `status`),
    INDEX `Subscription_status_idx`(`status`),
    INDEX `Subscription_end_date_idx`(`end_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Terms` (
    `id` CHAR(36) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `version` VARCHAR(20) NOT NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Terms_is_active_display_order_idx`(`is_active`, `display_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TermsAgreement` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `terms_id` CHAR(36) NOT NULL,
    `is_agreed` BOOLEAN NOT NULL DEFAULT false,
    `agreed_at` DATETIME(3) NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TermsAgreement_user_id_idx`(`user_id`),
    INDEX `TermsAgreement_terms_id_idx`(`terms_id`),
    UNIQUE INDEX `TermsAgreement_user_id_terms_id_key`(`user_id`, `terms_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserProvider` ADD CONSTRAINT `UserProvider_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Word` ADD CONSTRAINT `Word_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCategory` ADD CONSTRAINT `UserCategory_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserWord` ADD CONSTRAINT `UserWord_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserWord` ADD CONSTRAINT `UserWord_word_id_fkey` FOREIGN KEY (`word_id`) REFERENCES `Word`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserWord` ADD CONSTRAINT `UserWord_user_category_id_fkey` FOREIGN KEY (`user_category_id`) REFERENCES `UserCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FavoriteSentence` ADD CONSTRAINT `FavoriteSentence_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoutineMessage` ADD CONSTRAINT `RoutineMessage_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConversationHistory` ADD CONSTRAINT `ConversationHistory_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIFeedback` ADD CONSTRAINT `AIFeedback_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `ConversationHistory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AIFeedback` ADD CONSTRAINT `AIFeedback_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSettings` ADD CONSTRAINT `UserSettings_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TermsAgreement` ADD CONSTRAINT `TermsAgreement_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TermsAgreement` ADD CONSTRAINT `TermsAgreement_terms_id_fkey` FOREIGN KEY (`terms_id`) REFERENCES `Terms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
