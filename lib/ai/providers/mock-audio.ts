/**
 * Sintetizador de tom em runtime — gera um WAV PCM simples (sem letra
 * cantada, sem depender de nenhuma API paga) para o provedor mock ter algo
 * de verdade pra tocar no player enquanto nenhum provedor de música real
 * está configurado. Determinístico por seed, para take_1/take_2 soarem
 * ligeiramente diferentes.
 */

const SAMPLE_RATE = 22050;

function seedToNotes(seed: string): number[] {
  // pequena progressão de notas (Hz), variando por seed — só estética, não musical de verdade
  const scales: number[][] = [
    [261.63, 329.63, 392.0, 329.63, 440.0, 392.0], // dó maior-ish
    [293.66, 349.23, 440.0, 349.23, 493.88, 440.0], // ré maior-ish
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return scales[hash % scales.length];
}

export function synthesizeToneWav(seed: string, durationSeconds: number): Buffer {
  const notes = seedToNotes(seed);
  const totalSamples = Math.floor(SAMPLE_RATE * durationSeconds);
  const samples = new Int16Array(totalSamples);
  const noteDuration = durationSeconds / notes.length;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / SAMPLE_RATE;
    const noteIndex = Math.min(notes.length - 1, Math.floor(t / noteDuration));
    const freq = notes[noteIndex];
    const tInNote = t - noteIndex * noteDuration;
    // envelope suave (ataque/decaimento) por nota, pra evitar clique
    const envelope = Math.min(1, tInNote / 0.05) * Math.min(1, (noteDuration - tInNote) / 0.15);
    const value = Math.sin(2 * Math.PI * freq * t) * 0.5 * envelope;
    samples[i] = Math.max(-1, Math.min(1, value)) * 0x7fff;
  }

  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  Buffer.from(samples.buffer).copy(buffer, 44);

  return buffer;
}
