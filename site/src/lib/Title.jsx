/** The brand's two-tone section heading: the first part in ink, the second in the muted heading colour. */
export function Title({ id, parts, as: Tag = "h2", className = "section__title" }) {
  const [lead, tail] = Array.isArray(parts) ? parts : [parts];
  return <Tag id={id} className={className}>{lead}{tail && <> <span className="muted">{tail}</span></>}</Tag>;
}
