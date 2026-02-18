-- UserWord 테이블에서 word_id, category_id 컬럼 및 외래키 제약조건 제거
ALTER TABLE UserWord
  DROP FOREIGN KEY UserWord_word_id_fkey,
  DROP FOREIGN KEY UserWord_category_id_fkey;

ALTER TABLE UserWord
  DROP COLUMN word_id,
  DROP COLUMN category_id;