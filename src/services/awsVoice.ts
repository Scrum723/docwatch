/**
 * AWS voice for DOC Watch Alexa+ chat demo.
 * - TTS: Amazon Polly Neural / Generative (high-quality spoken replies)
 * - STT: Amazon Transcribe Streaming (mic → text when browser STT fails)
 *
 * Uses default AWS credential chain (CLI/SSO profile, env, instance role).
 * Never log secrets.
 */

import {
  PollyClient,
  SynthesizeSpeechCommand,
  DescribeVoicesCommand,
  type Engine,
  type VoiceId,
} from "@aws-sdk/client-polly";
import {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
  type AudioStream,
  type LanguageCode,
} from "@aws-sdk/client-transcribe-streaming";
import { Readable } from "node:stream";

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

export type TtsResult = {
  ok: true;
  contentType: "audio/mpeg";
  audioBase64: string;
  voiceId: string;
  engine: string;
  provider: "amazon-polly";
} | {
  ok: false;
  error: string;
  provider: "amazon-polly";
};

export type SttResult = {
  ok: true;
  transcript: string;
  provider: "amazon-transcribe";
} | {
  ok: false;
  error: string;
  provider: "amazon-transcribe";
};

function pollyClient() {
  return new PollyClient({ region: REGION });
}

function transcribeClient() {
  return new TranscribeStreamingClient({ region: REGION });
}

/** Prefer generative/neural female voices for Alexa+ demo playback. */
export async function pickPollyVoice(): Promise<{ voiceId: VoiceId; engine: Engine }> {
  const preferred = (process.env.POLLY_VOICE_ID || "").trim() as VoiceId | "";
  const preferredEngine = (process.env.POLLY_ENGINE || "").trim() as Engine | "";

  if (preferred) {
    return {
      voiceId: preferred,
      engine: preferredEngine || "neural",
    };
  }

  try {
    const out = await pollyClient().send(
      new DescribeVoicesCommand({ LanguageCode: "en-US", Engine: "neural" })
    );
    const voices = out.Voices || [];
    const rank = (id?: string) => {
      const n = id || "";
      if (/^(Ruth|Danielle|Joanna|Kajal|Salli)$/i.test(n)) return 100;
      if (/^(Ivy|Kendra|Kimberly)$/i.test(n)) return 80;
      if (/^(Matthew|Stephen|Justin)$/i.test(n)) return 40;
      return 10;
    };
    const sorted = [...voices].sort((a, b) => rank(b.Id) - rank(a.Id));
    const top = sorted[0];
    if (top?.Id) {
      const engines = top.SupportedEngines || [];
      const engine: Engine = engines.includes("generative")
        ? "generative"
        : engines.includes("neural")
          ? "neural"
          : "standard";
      return { voiceId: top.Id as VoiceId, engine };
    }
  } catch {
    // fall through to hard default
  }

  return { voiceId: "Joanna", engine: "neural" };
}

export async function synthesizePollySpeech(text: string): Promise<TtsResult> {
  const clean = String(text || "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 2500);

  if (!clean) {
    return { ok: false, error: "Empty text for Polly", provider: "amazon-polly" };
  }

  try {
    const { voiceId, engine } = await pickPollyVoice();
    // Generative can reject some punctuation-heavy strings; retry neural on failure.
    const tryEngines: Engine[] = engine === "generative" ? ["generative", "neural"] : [engine, "neural"];

    let lastErr = "Polly synthesize failed";
    for (const eng of tryEngines) {
      try {
        const out = await pollyClient().send(
          new SynthesizeSpeechCommand({
            Text: clean,
            VoiceId: voiceId,
            Engine: eng,
            OutputFormat: "mp3",
            TextType: "text",
          })
        );
        if (!out.AudioStream) {
          lastErr = "Polly returned empty audio";
          continue;
        }
        const bytes = await streamToBuffer(out.AudioStream as Readable);
        return {
          ok: true,
          contentType: "audio/mpeg",
          audioBase64: bytes.toString("base64"),
          voiceId,
          engine: eng,
          provider: "amazon-polly",
        };
      } catch (err) {
        lastErr = err instanceof Error ? err.message : String(err);
      }
    }
    return { ok: false, error: lastErr, provider: "amazon-polly" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message, provider: "amazon-polly" };
  }
}

/**
 * Transcribe PCM16 LE mono audio (recommended 16 kHz) via Amazon Transcribe Streaming.
 */
export async function transcribePcm16(pcm: Buffer, sampleRate = 16000): Promise<SttResult> {
  if (!pcm || pcm.length < 3200) {
    return { ok: false, error: "Audio too short", provider: "amazon-transcribe" };
  }

  try {
    const audioStream = (async function* (): AsyncGenerator<AudioStream> {
      const chunkSize = 8 * 1024;
      for (let i = 0; i < pcm.length; i += chunkSize) {
        yield { AudioEvent: { AudioChunk: pcm.subarray(i, i + chunkSize) } };
      }
    })();

    const out = await transcribeClient().send(
      new StartStreamTranscriptionCommand({
        LanguageCode: "en-US" as LanguageCode,
        MediaSampleRateHertz: sampleRate,
        MediaEncoding: "pcm",
        AudioStream: audioStream,
      })
    );

    let transcript = "";
    if (out.TranscriptResultStream) {
      for await (const event of out.TranscriptResultStream) {
        const results = event.TranscriptEvent?.Transcript?.Results || [];
        for (const r of results) {
          if (r.IsPartial) continue;
          const alt = r.Alternatives?.[0]?.Transcript;
          if (alt) transcript += (transcript ? " " : "") + alt;
        }
      }
    }

    transcript = transcript.trim();
    if (!transcript) {
      return { ok: false, error: "No speech detected", provider: "amazon-transcribe" };
    }
    return { ok: true, transcript, provider: "amazon-transcribe" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message, provider: "amazon-transcribe" };
  }
}

export async function awsVoiceHealth(): Promise<{
  region: string;
  polly: boolean;
  pollyVoice?: string;
  pollyEngine?: string;
  transcribe: boolean;
  error?: string;
}> {
  try {
    const pick = await pickPollyVoice();
    // Light call that proves credentials + Polly access.
    await pollyClient().send(
      new DescribeVoicesCommand({ LanguageCode: "en-US", Engine: "neural" })
    );
    return {
      region: REGION,
      polly: true,
      pollyVoice: pick.voiceId,
      pollyEngine: pick.engine,
      // Transcribe proven on first real mic call; assume reachable if Polly works with same creds.
      transcribe: true,
    };
  } catch (err) {
    return {
      region: REGION,
      polly: false,
      transcribe: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function streamToBuffer(stream: Readable | Blob | Uint8Array | AsyncIterable<Uint8Array>): Promise<Buffer> {
  if (Buffer.isBuffer(stream)) return stream;
  if (stream instanceof Uint8Array) return Buffer.from(stream);
  if (typeof (stream as any).transformToByteArray === "function") {
    const arr = await (stream as any).transformToByteArray();
    return Buffer.from(arr);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Uint8Array | Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
