import React, { useState } from "react";
import {
  GlobalTheming,
  ThemeColors,
  WelcomePoster,
  MenuItem,
} from "../../types";
import ColorPicker from "../ColorPicker";
import { Plus, Trash2, Save, Eye, EyeOff, MapPin, Info } from "lucide-react";
import {
  getRoutesByCategory,
  getDefaultArgsForRoute,
  doesRouteRequireArgs,
  findRouteByValue,
} from "../../data/routeConfig";
import TagInput from "../TagInput";
import RouteArgsConfig from "../RouteArgsConfig";

interface GlobalConfigEditorProps {
  globalConfig?: GlobalTheming;
  onUpdate: (config: GlobalTheming) => void;
  showThemingOnly?: boolean;
  menuItems?: MenuItem[]; // Available menu items for cloning
}

const GlobalConfigEditor: React.FC<GlobalConfigEditorProps> = ({
  globalConfig,
  onUpdate,
  showThemingOnly = false,
  menuItems = [],
}) => {
  const [config, setConfig] = useState<GlobalTheming>(
    globalConfig ||
      ({
        lightTheme: {
          surfaceColor: "#fafafa",
          gradiantButtonTailColor: "#085EA5",
          gradiantButtonDisabledColor: "#FFE0E0E0",
          gradiantButtonDisabledTextColor: "#FFD3D3D3",
          paragraphTextColor: "#555555",
        },
        darkTheme: {
          surfaceColor: "#191724",
          gradiantButtonTailColor: "#9ccfd8",
          gradiantButtonDisabledColor: "#403d52",
          gradiantButtonDisabledTextColor: "#524f67",
          paragraphTextColor: "#f6c177",
        },
        containerBorderRadius: 30,
        welcomePoster: {
          imageUrl: "",
          title: "Selamat Datang di Aplikasi Kami",
          route: "/product",
          routeArgs: {
            operators: ["TSELREG"],
            hintText: "Nomor HP Pelanggan",
          },
          autoDismissSeconds: 10,
        },
      } as GlobalTheming),
  );

  const updateTheme = (
    theme: "lightTheme" | "darkTheme",
    updates: Partial<ThemeColors>,
  ) => {
    const updatedConfig = {
      ...config,
      [theme]: {
        ...config[theme],
        ...updates,
      },
    };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const updateWelcomePoster = (updates: Partial<WelcomePoster>) => {
    const updatedConfig = {
      ...config,
      welcomePoster: {
        ...config.welcomePoster,
        ...updates,
      },
    } as GlobalTheming;
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const updateGlobalSettings = (updates: Partial<GlobalTheming>) => {
    const updatedConfig = { ...config, ...updates };
    setConfig(updatedConfig);
    onUpdate(updatedConfig);
  };

  const ThemeSection: React.FC<{
    theme: "lightTheme" | "darkTheme";
    title: string;
  }> = ({ theme, title }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warna Permukaan
          </label>
          <ColorPicker
            color={config[theme]?.surfaceColor || "#fafafa"}
            onChange={(color) => updateTheme(theme, { surfaceColor: color })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warna Akhiran Tombol Gradien
          </label>
          <ColorPicker
            color={config[theme]?.gradiantButtonTailColor || "#085EA5"}
            onChange={(color) =>
              updateTheme(theme, { gradiantButtonTailColor: color })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warna Tombol Nonaktif
          </label>
          <ColorPicker
            color={config[theme]?.gradiantButtonDisabledColor || "#FFE0E0E0"}
            onChange={(color) =>
              updateTheme(theme, { gradiantButtonDisabledColor: color })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warna Teks Tombol Nonaktif
          </label>
          <ColorPicker
            color={
              config[theme]?.gradiantButtonDisabledTextColor || "#FFD3D3D3"
            }
            onChange={(color) =>
              updateTheme(theme, { gradiantButtonDisabledTextColor: color })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warna Teks Paragraf
          </label>
          <ColorPicker
            color={config[theme]?.paragraphTextColor || "#555555"}
            onChange={(color) =>
              updateTheme(theme, { paragraphTextColor: color })
            }
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {!showThemingOnly && (
        <>
          {/* Global Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Pengaturan Global
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Radius Batas Container
                </label>
                <input
                  type="number"
                  value={config.containerBorderRadius || 30}
                  onChange={(e) =>
                    updateGlobalSettings({
                      containerBorderRadius: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  max="50"
                />
              </div>
            </div>
          </div>

          {/* Welcome Poster */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Welcome Poster
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Gambar
                </label>
                <input
                  type="url"
                  value={config.welcomePoster?.imageUrl || ""}
                  onChange={(e) =>
                    updateWelcomePoster({ imageUrl: e.target.value })
                  }
                  placeholder="https://example.com/welcome-banner.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul
                </label>
                <input
                  type="text"
                  value={config.welcomePoster?.title || ""}
                  onChange={(e) =>
                    updateWelcomePoster({ title: e.target.value })
                  }
                  placeholder="Selamat Datang di Aplikasi Kami"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Advanced Route Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Konfigurasi Rute
                </label>

                {/* Route Selection */}
                <div className="mb-3">
                  <select
                    value={config.welcomePoster?.route || ""}
                    onChange={(e) => {
                      const selectedRoute = e.target.value;
                      const defaultArgs = getDefaultArgsForRoute(selectedRoute);
                      updateWelcomePoster({
                        route: selectedRoute,
                        routeArgs: defaultArgs || {},
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Pilih rute...</option>
                    {Object.entries(getRoutesByCategory()).map(
                      ([category, routes]) => (
                        <optgroup key={category} label={category}>
                          {routes.map((route) => (
                            <option key={route.value} value={route.value}>
                              {route.label} - {route.description}
                            </option>
                          ))}
                        </optgroup>
                      ),
                    )}
                  </select>
                </div>

                {/* Route Information */}
                {config.welcomePoster?.route && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <div className="font-medium">
                          {
                            findRouteByValue(config.welcomePoster.route)
                              ?.description
                          }
                        </div>
                        {doesRouteRequireArgs(config.welcomePoster.route) && (
                          <div className="text-xs text-blue-600 mt-1">
                            Rute ini memerlukan konfigurasi tambahan di bawah.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Route Arguments - unified configuration */}
                {config.welcomePoster?.route && (
                  <div className="space-y-3 p-3 bg-gray-50 rounded border">
                    <h4 className="text-sm font-medium text-gray-700">
                      Argumen Rute
                    </h4>
                    <RouteArgsConfig
                      route={config.welcomePoster.route}
                      routeArgs={config.welcomePoster.routeArgs}
                      onChange={(routeArgs) => updateWelcomePoster({ routeArgs })}
                    />
                  </div>
                )}

                {/* Route Arguments - Custom Route */}
                {config.welcomePoster?.route &&
                  config.welcomePoster.route !== "/product" &&
                  config.welcomePoster.route !== "/webview" &&
                  doesRouteRequireArgs(config.welcomePoster.route) && (
                    <div className="space-y-3 p-3 bg-gray-50 rounded border">
                      <h4 className="text-sm font-medium text-gray-700">
                        Argumen Rute Kustom
                      </h4>
                      <div className="text-xs text-gray-600">
                        Rute ini mungkin memerlukan argumen kustom. Periksa
                        dokumentasi rute untuk persyaratan khusus.
                      </div>
                    </div>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Otomatis Tutup (detik)
                </label>
                <input
                  type="number"
                  value={config.welcomePoster?.autoDismissSeconds || 10}
                  onChange={(e) =>
                    updateWelcomePoster({
                      autoDismissSeconds: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  max="60"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Light Theme */}
      <ThemeSection theme="lightTheme" title="Tema Terang" />

      {/* Dark Theme */}
      <ThemeSection theme="darkTheme" title="Tema Gelap" />

      {/* Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Pratinjau Tema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Light Theme Preview */}
          <div
            className="border border-gray-200 rounded-lg p-4"
            style={{ backgroundColor: config.lightTheme?.surfaceColor }}
          >
            <h4
              className="text-sm font-medium mb-3"
              style={{ color: config.lightTheme?.paragraphTextColor }}
            >
              Tema Terang
            </h4>
            <div className="space-y-2">
              <div
                className="h-8 rounded-md"
                style={{
                  backgroundColor: config.lightTheme?.gradiantButtonTailColor,
                }}
              />
              <div
                className="h-8 rounded-md flex items-center justify-center text-sm"
                style={{
                  backgroundColor:
                    config.lightTheme?.gradiantButtonDisabledColor,
                  color: config.lightTheme?.gradiantButtonDisabledTextColor,
                }}
              >
                Tombol Nonaktif
              </div>
            </div>
          </div>

          {/* Dark Theme Preview */}
          <div
            className="border border-gray-200 rounded-lg p-4"
            style={{ backgroundColor: config.darkTheme?.surfaceColor }}
          >
            <h4
              className="text-sm font-medium mb-3"
              style={{ color: config.darkTheme?.paragraphTextColor }}
            >
              Tema Gelap
            </h4>
            <div className="space-y-2">
              <div
                className="h-8 rounded-md"
                style={{
                  backgroundColor: config.darkTheme?.gradiantButtonTailColor,
                }}
              />
              <div
                className="h-8 rounded-md flex items-center justify-center text-sm"
                style={{
                  backgroundColor:
                    config.darkTheme?.gradiantButtonDisabledColor,
                  color: config.darkTheme?.gradiantButtonDisabledTextColor,
                }}
              >
                Tombol Nonaktif
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalConfigEditor;
