export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

const COMPANY_BRAND = "ElektroM&RR";
const COMPANY_NAME = "Digital & Social j.d.o.o.";
const COMPANY_ADDRESS = "Dumbrova 7";
const COMPANY_CITY = "Potpican";
const COMPANY_OIB = "47120481628";
const COMPANY_IBAN = "HR7723400091111381969";

type Item = {
  description: string;
  price: number;
};

function cleanText(value: string) {
  return String(value || "")
    .replace(/č/g, "c")
    .replace(/ć/g, "c")
    .replace(/ž/g, "z")
    .replace(/š/g, "s")
    .replace(/đ/g, "d")
    .replace(/Č/g, "C")
    .replace(/Ć/g, "C")
    .replace(/Ž/g, "Z")
    .replace(/Š/g, "S")
    .replace(/Đ/g, "D")
    .replace(/[^\x00-\x7F]/g, "");
}

async function makeOfferPdfBuffer({
  offerNumber,
  clientName,
  clientAddress,
  clientOib,
  note,
  items,
  total,
}: {
  offerNumber: string;
  clientName: string;
  clientAddress: string;
  clientOib: string;
  note: string;
  items: Item[];
  total: number;
}) {
  const pdfDoc = await PDFDocument.create();

  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 790;

  page.drawText(cleanText(COMPANY_BRAND), {
    x: 50,
    y,
    size: 26,
    font: bold,
  });

  page.drawText(cleanText(COMPANY_NAME), {
    x: 350,
    y,
    size: 10,
    font: bold,
  });

  page.drawText(cleanText(COMPANY_ADDRESS), {
    x: 350,
    y: y - 15,
    size: 10,
    font,
  });

  page.drawText(cleanText(COMPANY_CITY), {
    x: 350,
    y: y - 30,
    size: 10,
    font,
  });

  page.drawText(`OIB: ${COMPANY_OIB}`, {
    x: 350,
    y: y - 45,
    size: 10,
    font,
  });

  page.drawText(`IBAN: ${COMPANY_IBAN}`, {
    x: 350,
    y: y - 60,
    size: 10,
    font,
  });

  y -= 100;

  page.drawLine({
    start: { x: 50, y },
    end: { x: 545, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  y -= 45;

  page.drawText("PONUDA", {
    x: 50,
    y,
    size: 24,
    font: bold,
  });

  y -= 30;

  page.drawText(`Broj ponude: ${cleanText(offerNumber)}`, {
    x: 50,
    y,
    size: 12,
    font,
  });

  y -= 18;

  page.drawText(`Datum: ${new Date().toLocaleDateString("hr-HR")}`, {
    x: 50,
    y,
    size: 12,
    font,
  });

  y -= 45;

  page.drawText("Klijent:", {
    x: 50,
    y,
    size: 13,
    font: bold,
  });

  y -= 20;

  page.drawText(cleanText(clientName), {
    x: 50,
    y,
    size: 12,
    font,
  });

  if (clientAddress) {
    y -= 15;
    page.drawText(cleanText(clientAddress), {
      x: 50,
      y,
      size: 11,
      font,
    });
  }

  if (clientOib) {
    y -= 15;
    page.drawText(`OIB: ${cleanText(clientOib)}`, {
      x: 50,
      y,
      size: 11,
      font,
    });
  }

  y -= 50;

  page.drawRectangle({
    x: 50,
    y: y - 8,
    width: 495,
    height: 28,
    color: rgb(0.93, 0.93, 0.93),
  });

  page.drawText("Opis usluge", {
    x: 60,
    y,
    size: 11,
    font: bold,
  });

  page.drawText("Iznos", {
    x: 440,
    y,
    size: 11,
    font: bold,
  });

  y -= 30;

  items.forEach((item, index) => {
    page.drawText(`${index + 1}. ${cleanText(item.description)}`, {
      x: 60,
      y,
      size: 11,
      font,
    });

    page.drawText(`${Number(item.price).toFixed(2)} EUR`, {
      x: 430,
      y,
      size: 11,
      font,
    });

    y -= 24;
  });

  y -= 20;

  page.drawLine({
    start: { x: 50, y },
    end: { x: 545, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  y -= 35;

  page.drawText(`UKUPNO: ${Number(total).toFixed(2)} EUR`, {
    x: 350,
    y,
    size: 16,
    font: bold,
  });

  if (note) {
    y -= 55;

    page.drawText("Napomena:", {
      x: 50,
      y,
      size: 12,
      font: bold,
    });

    y -= 18;

    const noteText = cleanText(note).slice(0, 300);

    page.drawText(noteText, {
      x: 50,
      y,
      size: 10,
      font,
      maxWidth: 480,
      lineHeight: 13,
    });
  }

  page.drawText("Ova ponuda vrijedi 7 dana od datuma izdavanja.", {
    x: 50,
    y: 85,
    size: 10,
    font,
  });

  page.drawText("PDV nije obracunan temeljem cl. 90. st. 2. Zakona o PDV-u.", {
    x: 50,
    y: 70,
    size: 10,
    font,
  });

  page.drawText("Hvala na povjerenju.", {
    x: 50,
    y: 55,
    size: 10,
    font,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const clientName = body.clientName || "";
    const clientAddress = body.clientAddress || "";
    const clientOib = body.clientOib || "";
    const note = body.note || "";
    const items: Item[] = body.items || [];

    if (!clientName || items.length === 0) {
      return NextResponse.json(
        { error: "Nedostaju podaci za ponudu." },
        { status: 400 }
      );
    }

    const total = items.reduce((sum, item) => sum + Number(item.price), 0);
    const year = new Date().getFullYear();

    const { count, error: countError } = await supabase
      .from("offers")
      .select("*", { count: "exact", head: true });

    if (countError) {
      return NextResponse.json(
        { error: `SUPABASE COUNT ERROR: ${countError.message}` },
        { status: 500 }
      );
    }

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
        { error: `SUPABASE OFFER ERROR: ${offerError.message}` },
        { status: 500 }
      );
    }

    const { error: itemsError } = await supabase.from("offer_items").insert(
      items.map((item) => ({
        offer_id: offer.id,
        description: item.description,
        price: Number(item.price),
      }))
    );

    if (itemsError) {
      return NextResponse.json(
        { error: `SUPABASE OFFER ITEMS ERROR: ${itemsError.message}` },
        { status: 500 }
      );
    }

    const pdfBuffer = await makeOfferPdfBuffer({
      offerNumber,
      clientName,
      clientAddress,
      clientOib,
      note,
      items,
      total,
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      subject: `Ponuda ${offerNumber}`,
      text: `Ponuda ${offerNumber} je kreirana. PDF je u privitku.`,
      attachments: [
        {
          filename: `ponuda-${offerNumber.replace("/", "-")}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
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
            : "Greska kod kreiranja ponude.",
      },
      { status: 500 }
    );
  }
}