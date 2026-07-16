import type { PortalContentBlock as PortalContentBlockData } from "@/lib/country-portals/types";

interface DisplayItem {
  title?: string;
  description: string;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string => typeof item === "string" && Boolean(item.trim()),
  );
}

function displayItems(value: unknown): DisplayItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (typeof item === "string" && item.trim()) {
      return [{ description: item }];
    }
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];

    const record = item as Record<string, unknown>;
    const description =
      stringValue(record.description) ??
      stringValue(record.text) ??
      stringValue(record.body);
    if (!description) return [];

    return [
      {
        title: stringValue(record.title) ?? stringValue(record.label),
        description,
      },
    ];
  });
}

function kindLabel(kind: string): string {
  return kind.replaceAll("_", " ");
}

export function PortalContentBlock({
  block,
}: {
  block: PortalContentBlockData;
}) {
  const paragraphs = stringList(block.body.paragraphs);
  const lead =
    stringValue(block.body.lede) ??
    stringValue(block.body.summary) ??
    (paragraphs.length === 0
      ? stringValue(block.body.text) ?? stringValue(block.body.description)
      : undefined);
  const items = [
    ...displayItems(block.body.items),
    ...displayItems(block.body.steps),
  ];
  const hasBody = Boolean(lead || paragraphs.length || items.length);

  return (
    <article className="border-l border-sand-300 bg-void-elevated px-5 py-6 sm:px-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {block.title ? (
          <h3 className="font-display text-2xl text-cream">{block.title}</h3>
        ) : (
          <h3 className="text-base font-medium capitalize text-cream">
            {kindLabel(block.kind)}
          </h3>
        )}
        <p className="inline-flex items-center gap-2 text-xs text-soft">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
          Released module
          {(block.riskLevel === "high" || block.riskLevel === "critical") && (
            <span className="font-medium text-danger">· Verify before acting</span>
          )}
        </p>
      </div>

      {lead ? (
        <p className="mt-4 text-sm leading-7 text-navy-800">{lead}</p>
      ) : null}

      {paragraphs.length ? (
        <div className="mt-4 space-y-4 text-sm leading-7 text-navy-800">
          {paragraphs.map((paragraph, index) => (
            <p key={`${block.versionId}-paragraph-${index}`}>{paragraph}</p>
          ))}
        </div>
      ) : null}

      {items.length ? (
        <ol className="mt-5 space-y-4">
          {items.map((item, index) => (
            <li
              key={`${block.versionId}-item-${index}`}
              className="grid grid-cols-[2rem_1fr] gap-3 text-sm"
            >
              <span className="field-guide-index flex h-8 w-8 items-center justify-center border border-sand-200 text-xs text-soft">
                {index + 1}
              </span>
              <div>
                {item.title ? (
                  <p className="font-medium text-cream">{item.title}</p>
                ) : null}
                <p className="leading-7 text-navy-800">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {!hasBody ? (
        <p className="mt-4 text-sm text-navy-800">
          No additional display text is available in this released module. Use
          the reviewed claims in this section where available.
        </p>
      ) : null}
    </article>
  );
}
