from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from konlpy.tag import Okt
from enum import Enum
from typing import List


class PartOfSpeech(str, Enum):
    SUBJECT = "SUBJECT"
    NOUN = "NOUN"
    VERB = "VERB"
    ADJECTIVE = "ADJECTIVE"
    MODIFIER = "MODIFIER"
    EMOTION = "EMOTION"


app = FastAPI(title="Korean NLP Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

okt = Okt()


def map_pos_to_category(pos_tag: str) -> PartOfSpeech:
    if pos_tag.startswith('N'):
        return PartOfSpeech.NOUN
    elif pos_tag.startswith('V'):
        return PartOfSpeech.VERB
    elif pos_tag.startswith('Adj'):
        return PartOfSpeech.ADJECTIVE
    elif pos_tag in ['Adv', 'Determiner', 'Eomi']:
        return PartOfSpeech.MODIFIER
    elif pos_tag == 'Josa':
        return PartOfSpeech.MODIFIER
    else:
        return PartOfSpeech.MODIFIER


class WordRequest(BaseModel):
    word: str


class WordCategoryResponse(BaseModel):
    word: str
    pos: str
    category: PartOfSpeech


@app.get("/")
async def root():
    return {"status": "alive", "service": "Korean NLP Microservice"}


@app.post("/analyze/word")
async def analyze_word(request: WordRequest):
    pos_result = okt.pos(request.word)

    if pos_result:
        word, pos = pos_result[0]
        category = map_pos_to_category(pos)
        return WordCategoryResponse(word=word, pos=pos, category=category)
    return WordCategoryResponse(word=request.word, pos="Unknown", category=PartOfSpeech.MODIFIER)


@app.post("/analyze/nouns")
async def extract_nouns(request: WordRequest):
    pos_result = okt.pos(request.word)

    if pos_result:
        word, pos = pos_result[0]
        is_noun = pos.startswith('N')
        return {
            "word": word,
            "is_noun": is_noun,
            "category": "NOUN" if is_noun else "OTHER",
        }
    return {"word": request.word, "is_noun": False, "category": "OTHER"}


@app.post("/analyze/morphs")
async def extract_morphs(request: WordRequest):
    pos_result = okt.pos(request.word)

    if pos_result:
        word, pos = pos_result[0]
        category = map_pos_to_category(pos)
        return {
            "word": word,
            "pos": pos,
            "category": category.value,
        }
    return {"word": request.word, "pos": "Unknown", "category": "MODIFIER"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
