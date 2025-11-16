import React, { useState } from "react";

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
    <h3 className="text-xs font-semibold text-gray-900 mb-1.5">{title}</h3>
    <div className="prose prose-sm max-w-none text-gray-700">{children}</div>
  </div>
);

const ReleasePrep: React.FC = () => {
  const [formData, setFormData] = useState({
    version: "1.0.0",
    versionCode: "1",
    about: "Aplikasi ini adalah solusi mobile agen pulsa, mengelola pembayaran dan penjualan pulsa dan paket serta tagihan PPOB",
    legal: "© 2025 Hexflate Agen Pulsa. Seluruh hak cipta dilindungi undang-undang. Nama dan logo Hexflate adalah merek dagang terdaftar",
    lightColor: "#0273EE",
    darkColor: "#0052D1",
    iconFile: null as File | null,
    splashFile: null as File | null,
  });

  const [generated, setGenerated] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setGenerated(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      setGenerated(false);
    }
  };

  const parseColorToARGB = (color: string): string => {
    // Handle RGB format: rgb(255, 115, 238) or rgba(255, 115, 238, 1)
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      return `Color.fromARGB(255, ${r}, ${g}, ${b})`;
    }

    // Handle hex format: #0273EE or 0273EE
    let hex = color.replace("#", "");
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `Color.fromARGB(255, ${r}, ${g}, ${b})`;
    }

    // Fallback to default if parsing fails
    return `Color.fromARGB(255, 2, 115, 238)`;
  };

  const generateAppConfig = () => {
    const lightColorARGB = parseColorToARGB(formData.lightColor);
    const darkColorARGB = parseColorToARGB(formData.darkColor);

    const appConfig = {
      version: formData.version,
      version_code: formData.versionCode,
      about: formData.about,
      legal: formData.legal,
      light_seed_color: lightColorARGB,
      dark_seed_color: darkColorARGB,
    };

    return JSON.stringify(appConfig, null, 2);
  };

  const handleDownloadZip = async () => {
    if (!formData.iconFile || !formData.splashFile) {
      alert("Harap upload icon dan splash screen terlebih dahulu!");
      return;
    }

    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Add app_config.json
      const config = generateAppConfig();
      zip.file("app_config.json", config);

      // Add icon file
      const iconData = await formData.iconFile.arrayBuffer();
      zip.file("app_icon_1024.png", iconData);

      // Add splash file
      const splashData = await formData.splashFile.arrayBuffer();
      zip.file("splash_1080x1920.png", splashData);

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Download ZIP
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `release-prep-${formData.version}-${formData.versionCode}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setGenerated(true);
    } catch (error) {
      console.error("Error creating ZIP file:", error);
      alert("Terjadi kesalahan saat membuat file ZIP. Silakan coba lagi.");
    }
  };


  return (
    <div className="space-y-3">
      <Section title="Informasi Aplikasi">
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Versi Aplikasi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                placeholder="1.0.0"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">
                Version Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="versionCode"
                value={formData.versionCode}
                onChange={handleInputChange}
                placeholder="1"
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Tentang Aplikasi <span className="text-red-500">*</span>
            </label>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleInputChange}
              rows={2}
              placeholder="Deskripsi singkat tentang aplikasi Anda"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Informasi Legal <span className="text-red-500">*</span>
            </label>
            <textarea
              name="legal"
              value={formData.legal}
              onChange={handleInputChange}
              rows={2}
              placeholder="© 2025 Nama Perusahaan. Seluruh hak cipta dilindungi."
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>
      </Section>

      <Section title="Tema Warna">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Warna Tema Terang <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1.5">
              <input
                type="color"
                name="lightColor"
                value={formData.lightColor}
                onChange={handleInputChange}
                className="h-8 w-12 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                name="lightColor"
                value={formData.lightColor}
                onChange={handleInputChange}
                placeholder="#0273EE"
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Warna Tema Gelap <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1.5">
              <input
                type="color"
                name="darkColor"
                value={formData.darkColor}
                onChange={handleInputChange}
                className="h-8 w-12 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                name="darkColor"
                value={formData.darkColor}
                onChange={handleInputChange}
                placeholder="#0052D1"
                className="flex-1 px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-2 gap-3">
        <Section title="Icon Aplikasi">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Upload Icon <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              name="iconFile"
              accept="image/png"
              onChange={handleFileChange}
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            />
            <p className="text-xs text-gray-500 mt-0.5">
              PNG 1024x1024
            </p>
            {formData.iconFile && (
              <p className="text-xs text-green-600 mt-0.5">
                ✓ {formData.iconFile.name} ({Math.round(formData.iconFile.size / 1024)} KB)
              </p>
            )}
          </div>
        </Section>

        <Section title="Splash Screen">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              Upload Splash Screen <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              name="splashFile"
              accept="image/png"
              onChange={handleFileChange}
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
            />
            <p className="text-xs text-gray-500 mt-0.5">
              PNG 1080x1920
            </p>
            {formData.splashFile && (
              <p className="text-xs text-green-600 mt-0.5">
                ✓ {formData.splashFile.name} ({Math.round(formData.splashFile.size / 1024)} KB)
              </p>
            )}
          </div>
        </Section>
      </div>

      <Section title="Generate & Download">
        <div className="space-y-1.5">
          <p className="text-xs text-gray-700">
            File ZIP berisi: <span className="font-mono">app_config.json</span>, <span className="font-mono">app_icon_1024.png</span>, <span className="font-mono">splash_1080x1920.png</span>
          </p>
          <button
            onClick={handleDownloadZip}
            disabled={!formData.iconFile || !formData.splashFile}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-xs"
          >
            Unduh Package ZIP
          </button>
          {generated && (
            <p className="text-xs text-green-600">
              ✓ File ZIP berhasil diunduh! Kirimkan ke developer untuk proses build.
            </p>
          )}
        </div>
      </Section>

      <Section title="Kirim ke Developer">
        <div className="bg-blue-50 border border-blue-200 rounded p-2">
          <p className="text-xs text-blue-800">
            Setelah mengunduh file ZIP, kirimkan file tersebut ke developer untuk meminta build aplikasi (AAB & APK).
          </p>
        </div>
      </Section>
    </div>
  );
};

export default ReleasePrep;
