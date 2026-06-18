type Props = {
  content: string;
};

export function AssistantMessageText({ content }: Props) {
  const paragraphs = content.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-800">
      {paragraphs.map((paragraph) => (
        <p key={paragraph.slice(0, 40)} className="whitespace-pre-wrap">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
