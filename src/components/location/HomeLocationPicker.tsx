"use client";

import { useState } from "react";
import { MapPin, Navigation, Check, AlertCircle, ExternalLink, Globe } from "lucide-react";

interface HomeLocationPickerProps {
  initialAddress?: string;
  initialCity?: string;
  initialCountryCode?: string;
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationSaved?: (data: {
    address: string;
    city: string;
    countryCode: string;
    latitude: number;
    longitude: number;
  }) => void;
}

export default function HomeLocationPicker({
  initialAddress = "",
  initialCity = "",
  initialCountryCode = "CI",
  initialLat = null,
  initialLng = null,
  onLocationSaved
}: HomeLocationPickerProps) {
  const [address, setAddress] = useState(initialAddress);
  const [city, setCity] = useState(initialCity);
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [latitude, setLatitude] = useState<number | null>(initialLat);
  const [longitude, setLongitude] = useState<number | null>(initialLng);

  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Use HTML5 Geolocation to get high-accuracy coordinates
  const handleGetCoordinates = () => {
    if (!navigator.geolocation) {
      setMessage({ type: "error", text: "La géolocalisation n'est pas supportée par votre navigateur." });
      return;
    }

    setIsLocating(true);
    setMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);

        // Reverse geocoding via OpenStreetMap Nominatim for accuracy
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
              const detectedCity = data.address.city || data.address.town || data.address.village || data.address.suburb || "";
              const detectedRoad = data.address.road || data.address.neighbourhood || data.display_name?.split(",")[0] || "";
              if (!city && detectedCity) setCity(detectedCity);
              if (!address && detectedRoad) setAddress(detectedRoad);
              if (data.address.country_code) {
                const code = data.address.country_code.toUpperCase();
                if (["CI", "CM", "GA", "CD"].includes(code)) {
                  setCountryCode(code);
                }
              }
            }
          }
        } catch (e) {
          // Keep raw coordinates if reverse geocode fails
        } finally {
          setIsLocating(false);
          setMessage({ type: "success", text: "Position GPS détectée avec succès !" });
        }
      },
      (error) => {
        setIsLocating(false);
        setMessage({
          type: "error",
          text: error.code === 1 
            ? "Accès GPS refusé. Veuillez autoriser la localisation ou saisir votre adresse manuellement." 
            : "Impossible de déterminer votre position GPS actuelle."
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address && !latitude) {
      setMessage({ type: "error", text: "Veuillez renseigner votre adresse de domicile ou capturer votre position GPS." });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/location", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          address,
          city,
          countryCode,
          latitude: latitude || 0,
          longitude: longitude || 0
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la sauvegarde.");

      setMessage({ type: "success", text: "Localisation du domicile enregistrée ! (+100 points de solvabilité attribués)" });
      if (onLocationSaved && latitude && longitude) {
        onLocationSaved({
          address,
          city,
          countryCode,
          latitude,
          longitude
        });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const googleMapsUrl = latitude && longitude 
    ? `https://www.google.com/maps?q=${latitude},${longitude}` 
    : address 
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${city} ${countryCode}`)}`
      : null;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 sm:space-y-5 animate-fadeIn">
      
      {/* Title */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#064E29] flex items-center justify-center font-bold shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider leading-snug">
              Localisation du Domicile (Google Maps / GPS)
            </h3>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5 leading-relaxed">
              Vérification de l'adresse de résidence pour fiabiliser votre dossier de prêt
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 bg-emerald-50 text-[#064E29] text-[10px] font-black rounded-full border border-emerald-200 shrink-0">
          +100 pts
        </span>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
            : "bg-rose-50 text-rose-800 border border-rose-200"
        }`}>
          {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* GPS Quick Capture Button */}
      <button
        type="button"
        onClick={handleGetCoordinates}
        disabled={isLocating}
        className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-[#064E29] border border-emerald-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
      >
        <Navigation className={`w-4 h-4 ${isLocating ? "animate-spin" : ""}`} />
        <span>{isLocating ? "Acquisition GPS satellite en cours..." : "Capturer ma position GPS exacte (Haute Précision)"}</span>
      </button>

      <form onSubmit={handleSaveLocation} className="space-y-4">
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pays de résidence
            </label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
            >
              <option value="CI">🇨🇮 Côte d'Ivoire</option>
              <option value="CM">🇨🇲 Cameroun</option>
              <option value="GA">🇬🇦 Gabon</option>
              <option value="CD">🇨🇩 République Démocratique du Congo (RDC)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ville ou Commune
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Abidjan, Douala, Libreville, Kinshasa..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Adresse physique / Quartier / Repère de domicile
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex: Cocody Angré 8ème tranche, Akwa Douala, Gombe Kinshasa..."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
          />
        </div>

        {/* GPS Coordinates Feedback & Map Preview */}
        {latitude && longitude && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <span className="font-bold text-slate-700">Coordonnées GPS enregistrées :</span>
              <span className="font-mono text-emerald-800 font-bold break-all">
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </span>
            </div>

            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#064E29] hover:underline"
              >
                <span>Visualiser le repère sur Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSaving ? <span className="loading loading-spinner loading-sm"></span> : "Valider mon adresse de domicile"}
        </button>

      </form>

    </div>
  );
}
