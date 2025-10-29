import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("q")

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 })
  }

  const apiKey = process.env.OPENCAGE_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 })
  }

  const url = new URL("https://api.opencagedata.com/geocode/v1/json")
  url.searchParams.set("q", query)
  url.searchParams.set("key", apiKey)
  url.searchParams.set("limit", "1")

  try {
    const res = await fetch(url.toString())
    const data = await res.json()

    if (data.results?.length > 0) {
      return NextResponse.json(data.results[0].geometry)
    } else {
      return NextResponse.json({ error: "No results found" }, { status: 404 })
    }
  } catch (err) {
    console.error("Error fetching geocode:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
