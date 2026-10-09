import { type NextRequest, NextResponse } from "next/server";

/**
 * Checagem rápida antes de renderizar o painel: sem cookie de sessão, nem
 * adianta montar a página. É só otimização; quem valida a sessão de verdade é
 * a API, a cada requisição.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("vb_session")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/painel", "/painel/:path*"],
};
