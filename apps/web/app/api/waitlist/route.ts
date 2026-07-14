import { POST as newsletterPost } from "../newsletter/route";

/** @deprecated Use /api/newsletter — kept so old clients keep working. */
export async function POST(request: Request) {
  return newsletterPost(request);
}
