"use client";

import { useState } from "react";



type Item = {
  description: string;
  price: string;
};

export default function Home() {
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientOib, setClientOib] = useState("");
  const [items, setItems] = useState<Item[]>([{ description: "", price: "" }]);

  const [offerClientName, setOfferClientName] = useState("");
  const [offerClientAddress, setOfferClientAddress] = useState("");
  const [offerClientOib, setOfferClientOib] = useState("");
  const [offerNote, setOfferNote] = useState("");
  const [offerItems, setOfferItems] = useState<Item[]>([
    { description: "", price: "" },
  ]);

  
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [offerLoading, setOfferLoading] = useState(false);

  

  function updateItem(
    list: Item[],
    setList: (items: Item[]) => void,
    index: number,
    field: "description" | "price",
    value: string
  ) {
    const updated = [...list];
    updated[index][field] = value;
    setList(updated);
  }

  async function createInvoice() {
    const filteredItems = items.filter((i) => i.description && i.price);

    if (!clientName || filteredItems.length === 0) {
      alert("Upiši klijenta i stavke");
      return;
    }

    setInvoiceLoading(true);

    const res = await fetch("/api/create-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName,
        clientAddress,
        clientOib,
        items: filteredItems.map((i) => ({
          description: i.description,
          price: Number(i.price),
        })),
      }),
    });

    const result = await res.json();
    setInvoiceLoading(false);

    if (!res.ok) {
      alert(result.error || "Greška kod računa");
      return;
    }

    setClientName("");
    setClientAddress("");
    setClientOib("");
    setItems([{ description: "", price: "" }]);
   

    alert(`Račun ${result.invoiceNumber} poslan na Gmail`);
  }

  async function createOffer() {
    const filteredItems = offerItems.filter((i) => i.description && i.price);

    if (!offerClientName || filteredItems.length === 0) {
      alert("Upiši klijenta i stavke ponude");
      return;
    }

    setOfferLoading(true);

    const res = await fetch("/api/create-offer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: offerClientName,
        clientAddress: offerClientAddress,
        clientOib: offerClientOib,
        note: offerNote,
        items: filteredItems.map((i) => ({
          description: i.description,
          price: Number(i.price),
        })),
      }),
    });

    const result = await res.json();
    setOfferLoading(false);

    if (!res.ok) {
      alert(result.error || "Greška kod ponude");
      return;
    }

    setOfferClientName("");
    setOfferClientAddress("");
    setOfferClientOib("");
    setOfferNote("");
    setOfferItems([{ description: "", price: "" }]);

    alert(`Ponuda ${result.offerNumber} poslana na Gmail`);
  }

  

  return (
    <main className="min-h-screen bg-black px-3 py-4 text-white sm:px-6">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-8">
          <h1 className="mb-6 text-3xl font-bold">Novi račun</h1>

          <div className="space-y-4">
            <input placeholder="Naziv klijenta" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3" />
            <input placeholder="Adresa klijenta" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3" />
            <input placeholder="OIB klijenta" value={clientOib} onChange={(e) => setClientOib(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3" />

            <h2 className="text-xl font-bold">Stavke računa</h2>

            {items.map((item, index) => (
              <div key={index} className="grid gap-3 rounded-2xl bg-black p-4 sm:grid-cols-[1fr_160px]">
                <input placeholder="Opis usluge" value={item.description} onChange={(e) => updateItem(items, setItems, index, "description", e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                <input placeholder="Cijena €" type="number" value={item.price} onChange={(e) => updateItem(items, setItems, index, "price", e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
              </div>
            ))}

            <button onClick={() => setItems([...items, { description: "", price: "" }])} className="w-full rounded-xl bg-zinc-800 py-3 font-bold">
              + Dodaj stavku
            </button>

            <button onClick={createInvoice} disabled={invoiceLoading} className="w-full rounded-xl bg-blue-600 py-4 font-bold disabled:opacity-50">
              {invoiceLoading ? "Šaljem račun..." : "Pošalji račun PDF"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-8">
          <h1 className="mb-6 text-3xl font-bold">Nova ponuda</h1>

          <div className="space-y-4">
            <input placeholder="Naziv klijenta" value={offerClientName} onChange={(e) => setOfferClientName(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3" />
            <input placeholder="Adresa klijenta" value={offerClientAddress} onChange={(e) => setOfferClientAddress(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3" />
            <input placeholder="OIB klijenta" value={offerClientOib} onChange={(e) => setOfferClientOib(e.target.value)} className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3" />

            <h2 className="text-xl font-bold">Stavke ponude</h2>

            {offerItems.map((item, index) => (
              <div key={index} className="grid gap-3 rounded-2xl bg-black p-4 sm:grid-cols-[1fr_160px]">
                <input placeholder="Opis usluge" value={item.description} onChange={(e) => updateItem(offerItems, setOfferItems, index, "description", e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
                <input placeholder="Cijena €" type="number" value={item.price} onChange={(e) => updateItem(offerItems, setOfferItems, index, "price", e.target.value)} className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" />
              </div>
            ))}

            <button onClick={() => setOfferItems([...offerItems, { description: "", price: "" }])} className="w-full rounded-xl bg-zinc-800 py-3 font-bold">
              + Dodaj stavku ponude
            </button>

            <textarea
              placeholder="Napomena ponude: rok izvođenja, uvjeti, plaćanje..."
              value={offerNote}
              onChange={(e) => setOfferNote(e.target.value)}
              rows={5}
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3"
            />

            <button onClick={createOffer} disabled={offerLoading} className="w-full rounded-xl bg-green-600 py-4 font-bold disabled:opacity-50">
              {offerLoading ? "Šaljem ponudu..." : "Pošalji ponudu PDF"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}