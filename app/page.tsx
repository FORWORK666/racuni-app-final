"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

type Invoice = {
  id: string;
  invoice_number: string;
  client_name: string;
  total: number;
};

type Item = {
  description: string;
  price: string;
};

export default function Home() {
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientOib, setClientOib] = useState("");

  const [items, setItems] = useState<Item[]>([
    {
      description: "",
      price: "",
    },
  ]);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadInvoices() {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      setInvoices(data);
    }
  }

  function addItem() {
    setItems([
      ...items,
      {
        description: "",
        price: "",
      },
    ]);
  }

  function updateItem(
    index: number,
    field: "description" | "price",
    value: string
  ) {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  }

  async function createInvoice() {
    if (!clientName.trim()) {
      alert("Upiši klijenta");
      return;
    }

    const filteredItems = items.filter(
      (item) => item.description.trim() && item.price
    );

    if (filteredItems.length === 0) {
      alert("Dodaj stavke");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/create-invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        clientName,
        clientAddress,
        clientOib,
        items: filteredItems.map((item) => ({
          description: item.description,
          price: Number(item.price),
        })),
      }),
    });

    const result = await response.json();

    setLoading(false);

    if (!response.ok) {
      console.log(result);
      alert(result.error || "Greška kod kreiranja računa");
      return;
    }

    setClientName("");
    setClientAddress("");
    setClientOib("");
    setItems([
      {
        description: "",
        price: "",
      },
    ]);

    await loadInvoices();

    alert(`Račun ${result.invoiceNumber} spremljen i poslan na Gmail`);
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-black px-3 py-4 text-white sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="w-full min-w-0 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-8">
          <h1 className="mb-8 break-words text-3xl font-bold leading-tight sm:text-4xl">
            ElektroM&RR
          </h1>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Naziv klijenta
              </label>

              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full min-w-0 rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                Adresa klijenta
              </label>

              <input
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="w-full min-w-0 rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-zinc-400">
                OIB klijenta
              </label>

              <input
                value={clientOib}
                onChange={(e) => setClientOib(e.target.value)}
                className="w-full min-w-0 rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none"
              />
            </div>

            <h2 className="pt-2 text-xl font-bold">Stavke</h2>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-black p-4"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
                    <input
                      placeholder="Opis usluge"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(index, "description", e.target.value)
                      }
                      className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none"
                    />

                    <input
                      type="number"
                      placeholder="Cijena (€)"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(index, "price", e.target.value)
                      }
                      className="w-full min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addItem}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-3 font-semibold"
            >
              + Dodaj stavku
            </button>

            <button
              onClick={createInvoice}
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white disabled:opacity-50"
            >
              {loading ? "Spremam i šaljem..." : "Kreiraj račun"}
            </button>
          </div>
        </section>

        <section className="w-full min-w-0 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-5 sm:p-8">
          <h2 className="mb-6 text-2xl font-bold">Zadnji računi</h2>

          <div className="space-y-3">
            {invoices.length === 0 && (
              <p className="text-zinc-500">Nema računa.</p>
            )}

            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="w-full min-w-0 rounded-2xl border border-zinc-800 bg-black p-4"
              >
                <div className="flex min-w-0 items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {invoice.client_name}
                    </p>

                    <p className="truncate text-sm text-zinc-500">
                      #{invoice.invoice_number}
                    </p>
                  </div>

                  <p className="shrink-0 text-lg font-bold">
                    {Number(invoice.total).toFixed(2)} €
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}