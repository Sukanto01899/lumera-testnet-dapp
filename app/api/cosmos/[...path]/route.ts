import { NextRequest, NextResponse } from "next/server";

const LCD_UPSTREAM =
  process.env.LCD_UPSTREAM ||
  process.env.NEXT_PUBLIC_LCD_UPSTREAM ||
  "https://api-t.lumera.nodestake.org";

const forwardRequest = async (
  req: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> => {
  const suffix = pathSegments.join("/");
  const search = req.nextUrl.search || "";
  const targetUrl = `${LCD_UPSTREAM}/${suffix}${search}`;

  const res = await fetch(targetUrl, {
    method: req.method,
    body: req.body,
    headers: {
      "Content-Type": req.headers.get("content-type") || "application/json",
    },
    cache: "no-store",
  });

  const text = await res.text();
  const contentType = res.headers.get("content-type") || "application/json";

  return new NextResponse(text, {
    status: res.status,
    headers: {
      "content-type": contentType,
    },
  });
};

type RouteParams = Promise<{ path?: string[] }>;

const extractPath = async (params: RouteParams) => {
  const resolved = await params;
  return resolved?.path ?? [];
};

export async function GET(req: NextRequest, { params }: { params: RouteParams }) {
  const path = await extractPath(params);
  return forwardRequest(req, path);
}

export async function POST(req: NextRequest, { params }: { params: RouteParams }) {
  const path = await extractPath(params);
  return forwardRequest(req, path);
}

export async function PUT(req: NextRequest, { params }: { params: RouteParams }) {
  const path = await extractPath(params);
  return forwardRequest(req, path);
}

export async function DELETE(req: NextRequest, { params }: { params: RouteParams }) {
  const path = await extractPath(params);
  return forwardRequest(req, path);
}
