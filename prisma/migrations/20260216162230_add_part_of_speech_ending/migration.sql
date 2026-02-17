-- Add 'ENDING' to Word.part_of_speech enum
-- MySQL 8+ / MariaDB: modify enum definition
-- Note: This rebuilds the column definition with the new enum list.

ALTER TABLE `Word`
  MODIFY COLUMN `part_of_speech`
    ENUM('NOUN','VERB','ADJECTIVE','MODIFIER','NONE','ENDING')
    NOT NULL;
