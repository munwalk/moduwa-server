import { parseTtsRequest } from "./tts.dto.js";
import { synthesizeTts } from "./tts.service.js";
import { BaseError } from "../errors/app.error.js";

export async function tts(req, res, next) {
    try {
        const parsed = parseTtsRequest(req.body);

        if (!parsed.ok) {
            const e = new BaseError(parsed.error.message, parsed.error.status, parsed.error.code);
            e.detail = parsed.error.detail ?? null;
            throw e;
        }

        const { contentType, audioBuffer } = await synthesizeTts(parsed.data);

        res.status(200);
        res.setHeader("Content-Type", contentType);
        return res.send(audioBuffer);
    } catch (err) {
        return next(err);
    }
}