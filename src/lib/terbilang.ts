/**
 * Utility helper untuk mengonversi angka nominal ke dalam teks Terbilang Bahasa Indonesia.
 * Contoh: 1500000 -> "Satu Juta Lima Ratus Ribu Rupiah"
 */
export function terbilang(n: number): string {
  if (isNaN(n) || n === 0) return "";

  const angka = [
    "", "Satu", "Dua", "Tiga", "Empat", "Lima",
    "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"
  ];

  let num = Math.abs(Math.floor(n));
  let result = "";

  if (num < 12) {
    result = angka[num];
  } else if (num < 20) {
    result = terbilang(num - 10) + " Belas";
  } else if (num < 100) {
    result = terbilang(Math.floor(num / 10)) + " Puluh " + terbilang(num % 10);
  } else if (num < 200) {
    result = "Seratus " + terbilang(num - 100);
  } else if (num < 1000) {
    result = terbilang(Math.floor(num / 100)) + " Ratus " + terbilang(num % 100);
  } else if (num < 2000) {
    result = "Seribu " + terbilang(num - 1000);
  } else if (num < 1000000) {
    result = terbilang(Math.floor(num / 1000)) + " Ribu " + terbilang(num % 1000);
  } else if (num < 1000000000) {
    result = terbilang(Math.floor(num / 1000000)) + " Juta " + terbilang(num % 1000000);
  } else if (num < 1000000000000) {
    result = terbilang(Math.floor(num / 1000000000)) + " Miliar " + terbilang(num % 1000000000);
  } else {
    result = terbilang(Math.floor(num / 1000000000000)) + " Triliun " + terbilang(num % 1000000000000);
  }

  // Bersihkan spasi ganda
  result = result.replace(/\s+/g, " ").trim();
  return result ? `${result} Rupiah` : "";
}

/**
 * Format angka ke dalam Rupiah terpisah titik (misal: 1500000 -> 1.500.000)
 */
export function formatRupiahInput(val: string): { raw: number; formatted: string } {
  // Hanya ambil digit angka
  const clean = val.replace(/\D/g, "");
  if (!clean) return { raw: 0, formatted: "" };

  const raw = parseInt(clean, 10);
  const formatted = new Intl.NumberFormat("id-ID").format(raw);
  return { raw, formatted };
}
