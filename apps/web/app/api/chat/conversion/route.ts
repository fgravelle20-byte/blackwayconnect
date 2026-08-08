import { NextResponse } from "next/server";
import { handleConversionChat } from "@/modules/chatbot/conversion-engine";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await handleConversionChat(body);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "chat_error";
    const status = message.includes("Required") || message.includes("Invalid") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
