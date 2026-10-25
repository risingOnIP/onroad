interface TextChunkProps {
  text: string;
}

export function TextChunk({ text }: TextChunkProps) {
  return (
    <div className="text-sm leading-relaxed whitespace-pre-wrap">
      {text}
    </div>
  );
}