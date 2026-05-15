export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_APP_PASSWORD,
  },
});

type Item = {
  description: string;
  price: number;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const clientName = body.clientName || "";
    const clientAddress = body.clientAddress || "";
    const clientOib = body.clientOib || "";
    const items: Item[] = body.items || [];

    if (!clientName || items.length === 0) {
      return NextResponse.json(
        { error: "Nedostaju podaci za ponudu." },
        { status: 400 }
      );
    }

    const total = items.reduce(
      (sum, item) => sum + Number(item.price),
      0
    );

    const year = new Date().getFullYear();

    const { count } = await supabase
      .from("offers")
      .select("*", { count: "exact", head: true });

    const offerNumber = `${(count || 0) + 1}-P/${year}`;

    const { data: offer, error: offerError } = await supabase
      .from("offers")
      .insert([
        {
          offer_number: offerNumber,
          client_name: clientName,
          client_address: clientAddress,
          client_oib: clientOib,
          total,
          status: "draft",
        },
      ])
      .select()
      .single();

    if (offerError) {
      return NextResponse.json(
        { error: offerError.message },
        { status: 500 }
      );
    }

    const { error: itemsError } = await supabase
      .from("offer_items")
      .insert(
        items.map((item) => ({
          offer_id: offer.id,
          description: item.description,
          price: Number(item.price),
        }))
      );

    if (itemsError) {
      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    const itemsText = items
      .map(
        (item, index) =>
          `${index + 1}. ${item.description} - ${Number(
            item.price
          ).toFixed(2)} EUR`
      )
      .join("\n");

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      subject: `Ponuda ${offerNumber}`,
      text: `
Ponuda: ${offerNumber}

Klijent:
${clientName}

Adresa:
${clientAddress}

OIB:
${clientOib}

Stavke:
${itemsText}

Ukupno:
${total.toFixed(2)} EUR
      `,
    });

    return NextResponse.json({
      success: true,
      offerNumber,
      total,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Greška kod kreiranja ponude.",
      },
      { status: 500 }
    );
  }
}