import { NextResponse } from "next/server";

// 简易Mock，后续接入数据库
const posts = [
  { id: 1, title: "第一篇博客", slug: "post-1" },
  { id: 2, title: "Second Post", slug: "post-2" }
];

export async function GET() {
  return NextResponse.json({ code: 200, data: posts });
}

export async function POST(request: Request) {
  const body = await request.json();
  const created = { id: Date.now(), ...body };
  return NextResponse.json({ code: 200, data: created });
}
