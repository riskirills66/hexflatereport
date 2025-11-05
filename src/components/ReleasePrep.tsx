import React, { useState } from "react";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
    <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>
    <div className="prose prose-sm max-w-none text-gray-700">{children}</div>
  </div>
);

const CodeBlock: React.FC<{ language?: string; code: string }> = ({ code }) => (
  <pre className="bg-gray-900 text-gray-100 text-xs rounded-md p-3 overflow-auto">
    <code>{code}</code>
  </pre>
);

const ReleasePrep: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const appJson = `{
  "version": "1.0.0",
  "version_code": "1",
  "about" : "Aplikasi ini adalah solusi mobile agen pulsa, mengelola pembayaran dan penjualan pulsa dan paket serta tagihan PPOB",
  "legal": "© 2025 Hexflate Agen Puulsa. Seluruh hak cipta dilindungi undang-undang. Nama dan logo Hexflate adalah merek dagang terdaftar",
  "light_seed_color": "Color.fromARGB(255, 2, 115, 238)", // Warna aksen untuk mode terang
  "dark_seed_color": "Color.fromARGB(255, 0, 82, 209)" // Warna aksen untuk mode gelap
}`;

  const keyProps = `storePassword=justextrasteps
keyPassword=justextrasteps
keyAlias=upload
storeFile=upload-keystore.jks`;

  const emailTemplate = `Request Build Release (AAB & APK)\n\nHalo Tim Dev,\n\nMohon bantu build rilis aplikasi Hexflate dan kirimkan file berikut:\n- AAB (release)\n- APK (release, universal)\n\nDetail & lampiran disertakan:\n- Icon 1024x1024 (PNG transparan)\n- Splash 1080x1920 (PNG transparan, potret)\n- app_config.json\n- google-services.json (Firebase)\n- key.properties\n- upload-keystore.jks\n- Kredensial akun demo (di bawah)\n\nInformasi rilis:\n- package_name: com.hexflate.pulsa\n- version: 1.0.0\n- version_code: 1\n\nKredensial akun demo:\n- ID: HEX8888\n- NOMOR: 082233445566 \n\nCatatan tambahan:\n- Pastikan signature menggunakan upload-keystore yang terlampir.\n- Pastikan versi dan package sesuai.\n\nTerima kasih.`;

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(emailTemplate);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setCopied(false);
    }
  };

  const handleDownloadChecklist = () => {
    const checklist = `Checklist Rilis - Hexflate\n\nLampirkan berkas berikut ke tim developer:\n[ ] app_icon_1024.png (PNG, transparan)\n[ ] splash_1080x1920.png (PNG, transparan)\n[ ] app_config.json\n[ ] google-services.json\n[ ] key.properties\n[ ] upload-keystore.jks\n[ ] Kredensial akun demo (username & password)\n\nInformasi versi:\n- package_name: com.hexflate.pulsa\n- version: 1.0.0\n- version_code: 1\n`;
    const blob = new Blob([checklist], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "release_checklist.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="bg-indigo-600 text-white rounded-lg p-5">
        <h2 className="text-lg font-bold">Panduan Persiapan Rilis Aplikasi</h2>
        <p className="text-indigo-100 text-sm mt-1">
          Checklist berkas dan konfigurasi yang diperlukan sebelum build rilis.
        </p>
      </div>

      <Section title="Logo Transparan (PNG 1024x1024)">
        <ul className="list-disc pl-5">
          <li>Format: PNG, transparan, tanpa latar belakang.</li>
          <li>Ukuran: 1024 x 1024 piksel.</li>
          <li>
            Nama file yang direkomendasikan:{" "}
            <span className="font-mono">app_icon_1024.png</span>.
          </li>
        </ul>
      </Section>

      <Section title="Konfigurasi Aplikasi (JSON)">
        <p className="mb-2">
          Siapkan berkas konfigurasi aplikasi dalam format JSON seperti contoh
          berikut:
        </p>
        <CodeBlock code={appJson} />
        <p className="mt-2 text-sm text-gray-600">
          Simpan sebagai <span className="font-mono">app_config.json</span> dan
          pastikan nilai sesuai proyek Anda.
        </p>
      </Section>

      <Section title="key.properties (Android keystore)">
        <p className="mb-2">Contoh isi berkas:</p>
        <CodeBlock code={keyProps} />
        <ul className="list-disc pl-5 mt-2">
          <li>
            Pastikan <span className="font-mono">upload-keystore.jks</span>{" "}
            tersedia dan aman.
          </li>
          <li>Jangan commit berkas sensitif ke repository publik.</li>
        </ul>
      </Section>

      <Section title="Splash Screen Transparan (PNG 1080x1920, Potrait)">
        <ul className="list-disc pl-5">
          <li>Format: PNG, latar belakang transparan.</li>
          <li>Ukuran: 1080 x 1920 piksel, orientasi potret.</li>
          <li>
            Nama file yang direkomendasikan:{" "}
            <span className="font-mono">splash_1080x1920.png</span>.
          </li>
        </ul>
      </Section>

      <Section title="Upload Keystore (Jika Sudah Dibuat)">
        <ul className="list-disc pl-5">
          <li>
            Simpan keystore <strong>di tempat aman</strong> dan buat cadangan.
          </li>
          <li>
            Pastikan password dan alias sesuai dengan isi{" "}
            <span className="font-mono">key.properties</span>.
          </li>
        </ul>
      </Section>

      <Section title="Akun Dummy (Demo)">
        <ul className="list-disc pl-5">
          <li>Pastikan ada akun dummy untuk keperluan demo/QA.</li>
          <li>
            Dokumentasikan kredensial demo di tempat yang aman dan dibagikan ke
            tim terkait.
          </li>
          <li>
            Pastikan hak akses sesuai agar tidak mengganggu data produksi.
          </li>
        </ul>
      </Section>

      <Section title="Kirim ke Kontak Developer (Request AAB & APK)">
        <p className="mb-2">
          Gunakan pesan berikut untuk dikirim ke kontak developer
          (WhatsApp/Telegram/Email) saat meminta build{" "}
          <span className="font-mono">AAB</span> dan{" "}
          <span className="font-mono">APK</span>:
        </p>
        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
          <textarea
            readOnly
            value={emailTemplate}
            className="w-full h-56 text-xs font-mono bg-transparent focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={handleCopyTemplate}
              className="px-3 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              {copied ? "Tersalin!" : "Salin Template"}
            </button>
            <button
              onClick={handleDownloadChecklist}
              className="px-3 py-1.5 text-xs rounded bg-gray-800 text-white hover:bg-gray-900"
            >
              Unduh Checklist.txt
            </button>
          </div>
        </div>
        <div className="mt-3">
          <p className="text-sm text-gray-700 font-medium">
            Pastikan berkas berikut dilampirkan:
          </p>
          <ul className="list-disc pl-5 text-sm">
            <li>
              <span className="font-mono">app_icon_1024.png</span> (logo
              transparan 1024x1024)
            </li>
            <li>
              <span className="font-mono">splash_1080x1920.png</span> (splash
              transparan potret)
            </li>
            <li>
              <span className="font-mono">app_config.json</span> (konfigurasi
              aplikasi)
            </li>
            <li>
              <span className="font-mono">google-services.json</span> (Firebase)
            </li>
            <li>
              <span className="font-mono">key.properties</span> dan{" "}
              <span className="font-mono">upload-keystore.jks</span>
            </li>
            <li>Kredensial akun demo (username & password)</li>
          </ul>
        </div>
      </Section>

      <Section title="Catatan Tambahan">
        <ul className="list-disc pl-5">
          <li>
            Verifikasi kembali <span className="font-mono">package_name</span>{" "}
            konsisten dengan Firebase dan Play Console.
          </li>
          <li>
            Perbarui <span className="font-mono">version</span> dan{" "}
            <span className="font-mono">version_code</span> sebelum build.
          </li>
        </ul>
      </Section>
    </div>
  );
};

export default ReleasePrep;
