export const runtime = "nodejs";

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import bwipjs from "bwip-js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_APP_PASSWORD,
  },
});

// PODACI FIRME
const COMPANY_BRAND = "ElektroM&R";
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

function formatAmountForHub3(amount: number) {
  return Math.round(amount * 100).toString().padStart(15, "0");
}

function buildHub3Payload({
  amount,
  payerName,
  receiverName,
  receiverAddress,
  receiverCity,
  receiverIban,
  reference,
  description,
}: {
  amount: number;
  payerName: string;
  receiverName: string;
  receiverAddress: string;
  receiverCity: string;
  receiverIban: string;
  reference: string;
  description: string;
}) {
  return [
    "HRVHUB30",
    "EUR",
    formatAmountForHub3(amount),
    cleanText(payerName),
    "",
    "",
    cleanText(receiverName),
    cleanText(receiverAddress),
    cleanText(receiverCity),
    receiverIban,
    "HR00",
    reference,
    "",
    cleanText(description),
  ].join("\n");
}

async function makeBarcodeBuffer(payload: string) {
  return bwipjs.toBuffer({
    bcid: "pdf417",
    text: payload,
    scale: 2,
    columns: 9,
    eclevel: 4,
  });
}

async function makePdfBuffer({
  invoiceNumber,
  clientName,
  clientAddress,
  clientOib,
  items,
  total,
}: {
  invoiceNumber: string;
  clientName: string;
  clientAddress: string;
  clientOib: string;
  items: Item[];
  total: number;
}) {
  const pdfDoc = await PDFDocument.create();

  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const safeInvoiceNumber = invoiceNumber.replace("/", "-");

  const hub3Payload = buildHub3Payload({
    amount: total,
    payerName: clientName,
    receiverName: COMPANY_NAME,
    receiverAddress: COMPANY_ADDRESS,
    receiverCity: COMPANY_CITY,
    receiverIban: COMPANY_IBAN,
    reference: safeInvoiceNumber,
    description: `Racun ${invoiceNumber}`,
  });

  const barcodePng = await makeBarcodeBuffer(hub3Payload);
  const barcodeImage = await pdfDoc.embedPng(barcodePng);

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

  page.drawText("RACUN", {
    x: 50,
    y,
    size: 24,
    font: bold,
  });

  y -= 30;

  page.drawText(`Broj racuna: ${safeInvoiceNumber}`, {
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

  page.drawText("Kupac:", {
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

  y -= 100;

  page.drawText("Skeniraj za placanje", {
    x: 50,
    y,
    size: 13,
    font: bold,
  });

  const barcodeDims = barcodeImage.scale(0.5);

  page.drawImage(barcodeImage, {
    x: 50,
    y: y - 90,
    width: barcodeDims.width,
    height: barcodeDims.height,
  });

  page.drawText(`Model: HR00 | Poziv na broj: ${safeInvoiceNumber}`, {
    x: 50,
    y: y - 105,
    size: 9,
    font,
  });

  page.drawText("Nacin placanja: uplata na racun", {
    x: 50,
    y: 100,
    size: 10,
    font,
  });

  page.drawText("Placanje: odmah", {
    x: 50,
    y: 85,
    size: 10,
    font,
  });

  page.drawText("Model racuna: R1", {
    x: 50,
    y: 70,
    size: 10,
    font,
  });

  page.drawText("PDV nije obracunan temeljem cl. 90. st. 2. Zakona o PDV-u.", {
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
    const items: Item[] = body.items || [];

    if (!clientName || items.length === 0) {
      return NextResponse.json(
        { error: "Nedostaju podaci za racun." },
        { status: 400 }
      );
    }

    const total = items.reduce((sum, item) => sum + Number(item.price), 0);
    const year = new Date().getFullYear();
    const invoiceNumber = `${Date.now()}/${year}`;

    const pdfBuffer = await makePdfBuffer({
      invoiceNumber,
      clientName,
      clientAddress,
      clientOib,
      items,
      total,
    });

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      subject: `Racun ${invoiceNumber}`,
      text: `Racun ${invoiceNumber} je kreiran. PDF je u privitku.`,
      attachments: [
        {
          filename: `racun-${invoiceNumber.replace("/", "-")}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      invoiceNumber,
      total,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Nepoznata greska kod kreiranja racuna.",
      },
      { status: 500 }
    );
  }
}