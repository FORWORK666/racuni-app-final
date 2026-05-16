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

function formatMoney(value: number) {
  return `${Number(value).toFixed(2)} EUR`;
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

  // HEADER BACKGROUND
  page.drawRectangle({
    x: 40,
    y: 740,
    width: 515,
    height: 70,
    color: rgb(0.06, 0.06, 0.07),
  });

  // BRAND
  page.drawText(cleanText(COMPANY_BRAND), {
    x: 55,
    y: 782,
    size: 24,
    font: bold,
    color: rgb(1, 1, 1),
  });

  page.drawText("podbrend za elektro, klima i terenske usluge", {
    x: 55,
    y: 762,
    size: 8,
    font,
    color: rgb(0.82, 0.82, 0.82),
  });

  // LEGAL COMPANY
  page.drawText(cleanText(COMPANY_NAME), {
    x: 350,
    y: 785,
    size: 10,
    font: bold,
    color: rgb(1, 1, 1),
  });

  page.drawText(cleanText(COMPANY_ADDRESS), {
    x: 350,
    y: 770,
    size: 9,
    font,
    color: rgb(0.9, 0.9, 0.9),
  });

  page.drawText(cleanText(COMPANY_CITY), {
    x: 350,
    y: 756,
    size: 9,
    font,
    color: rgb(0.9, 0.9, 0.9),
  });

  page.drawText(`OIB: ${COMPANY_OIB}`, {
    x: 350,
    y: 742,
    size: 9,
    font,
    color: rgb(0.9, 0.9, 0.9),
  });

  y = 700;

  // DOCUMENT TITLE
  page.drawText("PONUDA", {
    x: 50,
    y,
    size: 28,
    font: bold,
    color: rgb(0.05, 0.05, 0.05),
  });

  page.drawText(`Broj ponude: ${cleanText(offerNumber)}`, {
    x: 50,
    y: y - 28,
    size: 11,
    font,
  });

  page.drawText(`Datum izdavanja: ${new Date().toLocaleDateString("hr-HR")}`, {
    x: 50,
    y: y - 44,
    size: 11,
    font,
  });

  page.drawText(`IBAN: ${COMPANY_IBAN}`, {
    x: 350,
    y: y - 28,
    size: 10,
    font,
  });

  page.drawText("Placanje: po prihvacanju ponude / dogovoru", {
    x: 350,
    y: y - 44,
    size: 10,
    font,
  });

  y -= 90;

  // CLIENT BOX
  page.drawRectangle({
    x: 50,
    y: y - 70,
    width: 495,
    height: 75,
    borderColor: rgb(0.82, 0.82, 0.82),
    borderWidth: 1,
  });

  page.drawText("KLIJENT", {
    x: 65,
    y: y - 18,
    size: 10,
    font: bold,
    color: rgb(0.25, 0.25, 0.25),
  });

  page.drawText(cleanText(clientName), {
    x: 65,
    y: y - 36,
    size: 12,
    font: bold,
  });

  if (clientAddress) {
    page.drawText(cleanText(clientAddress), {
      x: 65,
      y: y - 52,
      size: 10,
      font,
    });
  }

  if (clientOib) {
    page.drawText(`OIB: ${cleanText(clientOib)}`, {
      x: 350,
      y: y - 36,
      size: 10,
      font,
    });
  }

  y -= 115;

  // TABLE HEADER
  page.drawRectangle({
    x: 50,
    y: y - 8,
    width: 495,
    height: 30,
    color: rgb(0.93, 0.93, 0.93),
  });

  page.drawText("Opis usluge / radova", {
    x: 65,
    y,
    size: 11,
    font: bold,
  });

  page.drawText("Iznos", {
    x: 445,
    y,
    size: 11,
    font: bold,
  });

  y -= 35;

  // ITEMS
  items.forEach((item, index) => {
    page.drawText(`${index + 1}. ${cleanText(item.description)}`, {
      x: 65,
      y,
      size: 10,
      font,
      maxWidth: 350,
    });

    page.drawText(formatMoney(item.price), {
      x: 420,
      y,
      size: 10,
      font,
    });

    page.drawLine({
      start: { x: 50, y: y - 8 },
      end: { x: 545, y: y - 8 },
      thickness: 0.5,
      color: rgb(0.88, 0.88, 0.88),
    });

    y -= 26;
  });

  y -= 20;

  // TOTAL BOX
  page.drawRectangle({
    x: 335,
    y: y - 20,
    width: 210,
    height: 42,
    color: rgb(0.06, 0.06, 0.07),
  });

  page.drawText("UKUPNO:", {
    x: 350,
    y: y + 5,
    size: 11,
    font: bold,
    color: rgb(1, 1, 1),
  });

  page.drawText(formatMoney(total), {
    x: 425,
    y: y + 5,
    size: 13,
    font: bold,
    color: rgb(1, 1, 1),
  });

  y -= 85;

  // NOTE
  page.drawText("Napomena:", {
    x: 50,
    y,
    size: 12,
    font: bold,
  });

  y -= 18;

  page.drawRectangle({
    x: 50,
    y: y - 55,
    width: 495,
    height: 65,
    borderColor: rgb(0.86, 0.86, 0.86),
    borderWidth: 1,
  });

  page.drawText(cleanText(note || "Ponuda vrijedi 7 dana od datuma izdavanja."), {
    x: 65,
    y: y - 18,
    size: 10,
    font,
    maxWidth: 455,
    lineHeight: 13,
  });

  // FOOTER
  page.drawLine({
    start: { x: 50, y: 105 },
    end: { x: 545, y: 105 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  page.drawText("Ponuda je informativna do prihvacanja i dogovora termina izvedbe.", {
    x: 50,
    y: 85,
    size: 9,
    font,
  });

  page.drawText("PDV nije obracunan temeljem cl. 90. st. 2. Zakona o PDV-u.", {
    x: 50,
    y: 70,
    size: 9,
    font,
  });

  page.drawText(`${cleanText(COMPANY_BRAND)} / ${cleanText(COMPANY_NAME)} / OIB: ${COMPANY_OIB}`, {
    x: 50,
    y: 55,
    size: 8,
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