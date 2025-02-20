import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect("/?error=missing_code");
  }

  const STRAVA_CLIENT_ID = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  const STRAVA_CLIENT_SECRET = process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET;

  // Exchange the authorization code for an access token
  const response = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code: code,
      grant_type: "authorization_code",
    }),
  });

  const data = await response.json();
  console.log("Strava API Response:", data); // Debugging
  
  if (!data.access_token) {
    console.error("Error: Missing access token!", data); // Log full error
    return NextResponse.redirect(`/?error=${data.message || "auth_failed"}`);
  }

  if (!data.access_token) {
    return NextResponse.redirect(new URL("/?error=missing_code", req.url).toString());
  }

  return NextResponse.redirect(`/strava/upload?token=${data.access_token}`);
}