import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { writeFile, unlink, readFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get("audio") as File | null;

  if (!audio) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
  }

  const id = randomUUID();
  const inputPath = join("/tmp", `whisper-${id}.webm`);
  const outputBase = join("/tmp", `whisper-${id}`);

  try {
    const buffer = Buffer.from(await audio.arrayBuffer());
    await writeFile(inputPath, buffer);

    const text = await new Promise<string>((resolve, reject) => {
      exec(
        `/opt/homebrew/bin/whisper "${inputPath}" --model base --language es --output_format txt --output_dir /tmp`,
        { timeout: 60000 },
        async (err) => {
          try {
            // Whisper writes output to <inputname>.txt
            const txtPath = `${outputBase}.webm.txt`;
            const content = await readFile(txtPath, "utf-8").catch(() => "");
            // Clean up output files
            await unlink(txtPath).catch(() => {});
            if (err && !content) {
              reject(new Error(`Whisper failed: ${err.message}`));
            } else {
              resolve(content.trim());
            }
          } catch (e) {
            reject(e);
          }
        }
      );
    });

    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { error: `Transcription failed: ${err instanceof Error ? err.message : err}` },
      { status: 500 }
    );
  } finally {
    await unlink(inputPath).catch(() => {});
  }
}
