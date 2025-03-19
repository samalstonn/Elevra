import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma"; // Adjust the import path to match your project structure

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const city = searchParams.get("city");
        const state = searchParams.get("state");

        if (!city || !state) {
            return NextResponse.json(
                { error: "City and state are required query parameters" },
                { status: 400 }
            );
        }

        const elections = await prisma.election.findMany({
            where: {
                city,
                state,
            },
            include: {
                candidates: true,
            },
        });

        return NextResponse.json(elections);
    } catch (error) {
        console.error("Error fetching elections:", error);
        return NextResponse.json({ error: "Error fetching elections" }, { status: 500 });
    }
}