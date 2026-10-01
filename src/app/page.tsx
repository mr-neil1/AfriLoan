"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Clock, 
  CheckCircle2, 
  Smartphone, 
  CreditCard, 
  TrendingUp, 
  HelpCircle, 
  ChevronRight,
  Sparkles,
  PhoneCall,
  Menu,
  X
} from "lucide-react";
import MobileRedirect from "@/components/MobileRedirect";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live Loan Simulator state
  const [simAmount, setSimAmount] = useState<number>(100000);
  const [simDuration, setSimDuration] = useState<number>(30);
  
  // Rate calculation
  let rate = 7.5;
  if (simDuration <= 15) rate = 5.0;
  else if (simDuration <= 30) rate = 7.5;
  else if (simDuration <= 60) rate = 9.0;
  else if (simDuration <= 90) rate = 11.0;
  else rate = 12.0;

  const totalInterest = Math.round(simAmount * (rate / 100));
  const totalRepay = simAmount + totalInterest;
  const installmentCount = simDuration >= 90 ? 4 : simDuration >= 60 ? 3 : simDuration >= 30 ? 2 : 1;
  const installmentAmount = Math.round(totalRepay / installmentCount);

  // Predefined packages
  const samplePackages = [
    {
      name: "Micro-Prêt Express",
      tier: "Urgence & Quotidien",
      amount: 25000,
      interest: "5%",
      duration: "15 jours",
      freq: "Paiement en fin de prêt",
      badge: "Rapide",
      highlight: false
    },
    {
      name: "Coup de Pouce",
      tier: "Démarrage & Projets",
      amount: 50000,
      interest: "6%",
      duration: "21 jours",
      freq: "2 échéances",
      badge: "Populaire",
      highlight: false
    },
    {
      name: "Relance Artisan & Commerce",
      tier: "Commerçants & PME",
      amount: 100000,
      interest: "7.5%",
      duration: "30 jours",
      freq: "Échéance tous les 15 jours",
      badge: "Recommandé",
      highlight: true
    },
    {
      name: "Prêt Projet Pro",
      tier: "Développement Entreprise",
      amount: 250000,
      interest: "8.5%",
      duration: "45 jours",
      freq: "Mensualités souples",
      badge: "Pro",
      highlight: false
    },
    {
      name: "Expansion Business",
      tier: "Grands Équipements",
      amount: 500000,
      interest: "9.5%",
      duration: "60 jours",
      freq: "3 échéances mensuelles",
      badge: "Premium",
      highlight: false
    },
    {
      name: "Grand Projet Vision",
      tier: "Investissement Majeur",
      amount: 1000000,
      interest: "11%",
      duration: "90 jours",
      freq: "4 échéances mensuelles",
      badge: "VIP",
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-amber-100 selection:text-amber-900">
      <MobileRedirect />

      {/* Top Banner Ticker */}
      <div className="bg-[#022C15] text-emerald-100/90 text-xs py-2 px-4 border-b border-emerald-900/50 flex items-center justify-between">
        <div className="container mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Déboursement instantané en moins de 15 minutes sur Mobile Money</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-emerald-300 font-medium">
            <span>Orange Money</span>
            <span>•</span>
            <span>MTN MoMo</span>
            <span>•</span>
            <span>Wave</span>
            <span>•</span>
            <span>Airtel Money</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
        <div className="container mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img 
              src="/logo.png" 
              alt="AfriLoan Logo" 
              className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105" 
            />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-700">
            <a href="#simulateur" className="hover:text-[#064E29] transition-colors">Simulateur</a>
            <a href="#formules" className="hover:text-[#064E29] transition-colors">Formules de Prêt</a>
            <a href="#fonctionnement" className="hover:text-[#064E29] transition-colors">Comment ça marche</a>
            <a href="#mobile-money" className="hover:text-[#064E29] transition-colors">Mobile Money</a>
            <a href="#faq" className="hover:text-[#064E29] transition-colors">FAQ</a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/auth"
              className="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-[#064E29] hover:bg-slate-100/70 rounded-xl transition-all"
            >
              Connexion
            </Link>
            <Link
              href="/auth?tab=register"
              className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 shadow-md shadow-emerald-950/20 rounded-xl transition-all flex items-center gap-2 group active:scale-95"
            >
              <span>Demander un prêt</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 animate-fadeIn">
            <a 
              href="#simulateur" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 py-2 hover:text-[#064E29]"
            >
              Simulateur de prêt
            </a>
            <a 
              href="#formules" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 py-2 hover:text-[#064E29]"
            >
              Formules de prêt
            </a>
            <a 
              href="#fonctionnement" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 py-2 hover:text-[#064E29]"
            >
              Fonctionnement
            </a>
            <a 
              href="#mobile-money" 
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-700 py-2 hover:text-[#064E29]"
            >
              Paiement Mobile Money
            </a>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/auth"
                className="w-full text-center py-2.5 text-sm font-bold text-slate-800 bg-slate-100 rounded-xl"
              >
                Espace Client
              </Link>
              <Link
                href="/auth?tab=register"
                className="w-full text-center py-2.5 text-sm font-bold text-white bg-[#064E29] rounded-xl shadow-md"
              >
                Demander un prêt
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-afriloan-hero text-white pt-16 pb-24 lg:pt-24 lg:pb-32">
        {/* Decorative background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/10 to-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="container mx-auto px-4 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-amber-300 shadow-inner">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Vos projets, notre priorité</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
                Le prêt en ligne <span className="text-gradient-gold">rapide & transparent</span> pensé pour l'Afrique.
              </h1>

              <p className="text-base sm:text-lg text-emerald-100/90 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                Accédez à des financements souples et avantageux, que ce soit à montant fixe ou 100% sur-mesure. Recevez vos fonds instantanément sur votre compte <strong>Orange Money, MTN MoMo, Wave ou Airtel Money</strong>.
              </p>

              {/* Badges / Strengths */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 max-w-xl mx-auto lg:mx-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-left">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <Zap className="w-4 h-4" />
                    <span>&lt; 15 minutes</span>
                  </div>
                  <div className="text-xs text-emerald-200/80 mt-1">Déboursement direct</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-left">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>100% Sécurisé</span>
                  </div>
                  <div className="text-xs text-emerald-200/80 mt-1">Données chiffrées</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-left col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <Smartphone className="w-4 h-4" />
                    <span>Mobile Money</span>
                  </div>
                  <div className="text-xs text-emerald-200/80 mt-1">Orange, MTN, Wave</div>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  href="/auth?tab=register"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-extrabold text-base rounded-2xl shadow-xl shadow-amber-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3"
                >
                  <span>Demander un prêt maintenant</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#simulateur"
                  className="w-full sm:w-auto px-7 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-base rounded-2xl border border-white/20 backdrop-blur-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Simuler mon échéancier</span>
                </a>
              </div>
            </div>

            {/* Right Card: Interactive Live Simulator */}
            <div id="simulateur" className="lg:col-span-5">
              <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/40 border border-slate-100 relative">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">Simulateur de Prêt</h3>
                    <p className="text-xs text-slate-500">Calcul immédiat & transparent</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-[#064E29] font-bold text-xs rounded-full border border-emerald-200">
                    Taux dès {rate}%
                  </span>
                </div>

                {/* Amount Slider */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-600">Montant souhaité :</label>
                    <span className="text-2xl font-black text-[#064E29]">
                      {simAmount.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10000}
                    max={1000000}
                    step={5000}
                    value={simAmount}
                    onChange={(e) => setSimAmount(Number(e.target.value))}
                    className="w-full accent-[#064E29] h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>10 000 FCFA</span>
                    <span>500 000 FCFA</span>
                    <span>1 000 000 FCFA</span>
                  </div>
                </div>

                {/* Duration Slider */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-600">Durée de remboursement :</label>
                    <span className="text-lg font-bold text-amber-600">
                      {simDuration} jours ({installmentCount} échéance{installmentCount > 1 ? "s" : ""})
                    </span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={90}
                    step={15}
                    value={simDuration}
                    onChange={(e) => setSimDuration(Number(e.target.value))}
                    className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>15 jours</span>
                    <span>30 jours</span>
                    <span>60 jours</span>
                    <span>90 jours</span>
                  </div>
                </div>

                {/* Summary Box */}
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5 border border-slate-100 mb-6">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Intérêts totaux ({rate}%) :</span>
                    <span className="font-semibold text-slate-900">{totalInterest.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Nombre de versements :</span>
                    <span className="font-semibold text-slate-900">{installmentCount} tranche(s)</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Montant par échéance :</span>
                    <span className="font-bold text-[#064E29]">{installmentAmount.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-900">Total à rembourser :</span>
                    <span className="text-xl font-extrabold text-[#064E29]">
                      {totalRepay.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                </div>

                {/* Submit button */}
                <Link
                  href={`/auth?tab=register&amount=${simAmount}&duration=${simDuration}`}
                  className="w-full py-4 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 text-white font-extrabold text-center rounded-2xl shadow-lg shadow-emerald-950/20 transition-all block active:scale-98"
                >
                  Obtenir ce financement
                </Link>

                <p className="text-[11px] text-center text-slate-400 mt-3">
                  Déboursement direct sur Orange Money, MTN MoMo, Wave ou Airtel Money dès validation.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MOBILE MONEY OPERATORS RIBBON */}
      <section id="mobile-money" className="py-12 bg-white border-b border-slate-100">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-wider font-extrabold text-slate-400 mb-6">
            Déboursements & Remboursements 100% compatibles avec les opérateurs majeurs
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-85">
            {/* Orange Money */}
            <div className="flex items-center gap-2.5 font-bold text-slate-800">
              <div className="w-10 h-10 rounded-xl bg-[#FF6600] flex items-center justify-center text-white font-black text-sm shadow-sm">
                OM
              </div>
              <span className="text-sm font-extrabold text-slate-700">Orange Money</span>
            </div>

            {/* MTN MoMo */}
            <div className="flex items-center gap-2.5 font-bold text-slate-800">
              <div className="w-10 h-10 rounded-xl bg-[#FFCC00] flex items-center justify-center text-slate-900 font-black text-sm shadow-sm">
                MoMo
              </div>
              <span className="text-sm font-extrabold text-slate-700">MTN MoMo</span>
            </div>

            {/* Wave */}
            <div className="flex items-center gap-2.5 font-bold text-slate-800">
              <div className="w-10 h-10 rounded-xl bg-[#1DA1F2] flex items-center justify-center text-white font-black text-sm shadow-sm">
                W
              </div>
              <span className="text-sm font-extrabold text-slate-700">Wave</span>
            </div>

            {/* Airtel Money */}
            <div className="flex items-center gap-2.5 font-bold text-slate-800">
              <div className="w-10 h-10 rounded-xl bg-[#ED1C24] flex items-center justify-center text-white font-black text-sm shadow-sm">
                AM
              </div>
              <span className="text-sm font-extrabold text-slate-700">Airtel Money</span>
            </div>
          </div>
        </div>
      </section>

      {/* FIXED LOAN PACKAGES SECTION */}
      <section id="formules" className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-[#064E29] text-xs font-bold uppercase tracking-wider">
              Formules prédéfinies
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Des formules de prêt claires, adaptées à chaque besoin
            </h2>
            <p className="text-base text-slate-600">
              Choisissez l’une de nos offres clés en main. Des montants fixes avec des échéances calibrées pour le marché africain.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {samplePackages.map((pkg, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-3xl p-7 transition-all duration-300 relative border flex flex-col justify-between ${
                  pkg.highlight 
                    ? "border-amber-400 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/30" 
                    : "border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-300"
                }`}
              >
                {pkg.highlight && (
                  <span className="absolute -top-3 right-6 px-3.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold text-xs rounded-full shadow-md">
                    {pkg.badge}
                  </span>
                )}

                <div>
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    {pkg.tier}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">{pkg.name}</h3>

                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <span className="text-3xl font-black text-[#064E29]">
                      {pkg.amount.toLocaleString("fr-FR")}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 ml-1">FCFA</span>
                  </div>

                  <ul className="space-y-3 text-sm text-slate-600 mb-8">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Taux d'intérêt : <strong className="text-slate-900">{pkg.interest}</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Durée : <strong className="text-slate-900">{pkg.duration}</strong></span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Modalité : {pkg.freq}</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Mobile Money : Versement instantané</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href={`/auth?tab=register&package=${pkg.name}&amount=${pkg.amount}`}
                  className={`w-full py-3.5 rounded-xl font-bold text-center text-sm transition-all block ${
                    pkg.highlight
                      ? "bg-gradient-to-r from-[#064E29] to-[#0A5C36] text-white shadow-md shadow-emerald-950/20 hover:opacity-95"
                      : "bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-[#064E29]"
                  }`}
                >
                  Choisir cette formule
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="fonctionnement" className="py-20 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
              Simplicité & Rapidité
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Comment fonctionne AfriLoan en 4 étapes
            </h2>
            <p className="text-base text-slate-600">
              Une procédure entièrement numérisée, sans paperasse inutile, pour un accès rapide aux liquidités.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 text-center relative group hover:bg-emerald-50/50 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-[#064E29] text-white font-black text-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-950/20">
                1
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Inscription en ligne</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Créez votre compte sécurisé en moins de 2 minutes avec vos informations et numéro Mobile Money.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 text-center relative group hover:bg-emerald-50/50 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-600/20">
                2
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Choix du prêt</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sélectionnez une formule prédéfinie ou personnalisez le montant et l'échéancier selon vos besoins.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 text-center relative group hover:bg-emerald-50/50 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-[#064E29] text-white font-black text-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-950/20">
                3
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Déboursement Express</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Les fonds sont envoyés instantanément sur votre compte Orange, MTN, Wave ou Airtel Money.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 text-center relative group hover:bg-emerald-50/50 transition-colors">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-600/20">
                4
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">Suivi & Remboursement</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Recevez des rappels automatiques et remboursez simplement par Mobile Money pour augmenter votre plafond.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS & WHY CHOOSE US */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-[#064E29] text-xs font-bold uppercase tracking-wider">
                Pourquoi choisir AfriLoan ?
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                La microfinance réinventée pour l'Afrique moderne
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Nous supprimons les barrières bancaires traditionnelles. Grâce aux paiements mobiles et à un algorithme d'évaluation transparent, empruntez en toute confiance.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#064E29] flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base mb-1">Rappels & Notifications Automatiques</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Ne manquez jamais une date d'échéance. Recevez des alertes SMS et notifications dans votre espace personnel avant chaque échéance.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base mb-1">Capacité de crédit évolutive</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Chaque remboursement à l'heure améliore votre score de solvabilité et augmente votre limite d'emprunt jusqu'à 2 000 000 FCFA.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#064E29] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base mb-1">Transparence totale, zéro frais caché</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Vous savez exactement ce que vous empruntez et ce que vous remboursez. Pas de frais de dossier surprises.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative card with logo & tagline */}
            <div className="bg-gradient-afriloan rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col items-center justify-center text-center">
              <img 
                src="/logo.png" 
                alt="AfriLoan" 
                className="w-48 h-auto mb-6 drop-shadow-md" 
              />
              <p className="text-amber-400 font-extrabold text-lg tracking-wide uppercase mb-3">
                Vos projets, notre priorité
              </p>
              <p className="text-sm text-emerald-100/90 max-w-md leading-relaxed mb-8">
                Des dizaines de milliers d'entrepreneurs, artisans, salariés et particuliers font confiance à AfriLoan au quotidien.
              </p>
              <Link
                href="/auth?tab=register"
                className="px-8 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold rounded-2xl shadow-lg shadow-amber-600/30 hover:opacity-95 transition-all active:scale-95"
              >
                Créer mon compte sécurisé
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto px-4 lg:px-8 max-w-4xl">
          <div className="text-center mb-16 space-y-4">
            <span className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
              Questions Fréquentes
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
              Tout ce que vous devez savoir
            </h2>
          </div>

          <div className="space-y-4">
            <details className="group bg-slate-50 rounded-2xl p-6 border border-slate-200/80 cursor-pointer">
              <summary className="font-extrabold text-slate-900 text-base list-none flex justify-between items-center">
                <span>Comment recevoir l'argent emprunté ?</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Les fonds sont transférés directement sur votre compte de paiement mobile (Orange Money, MTN MoMo, Wave ou Airtel Money) que vous avez associé à votre profil AfriLoan. Le délai est généralement compris entre 5 et 15 minutes.
              </p>
            </details>

            <details className="group bg-slate-50 rounded-2xl p-6 border border-slate-200/80 cursor-pointer">
              <summary className="font-extrabold text-slate-900 text-base list-none flex justify-between items-center">
                <span>Quels sont les taux d'intérêt appliqués ?</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Nos taux d'intérêt sont très compétitifs et démarrent à 5% selon le montant emprunté et la durée choisie. Tous les montants sont calculés et affichés en toute transparence avant votre validation.
              </p>
            </details>

            <details className="group bg-slate-50 rounded-2xl p-6 border border-slate-200/80 cursor-pointer">
              <summary className="font-extrabold text-slate-900 text-base list-none flex justify-between items-center">
                <span>Comment rembourser mes échéances ?</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Depuis votre espace personnel, cliquez simplement sur "Effectuer un remboursement". Vous pouvez payer la totalité ou une échéance via votre compte Mobile Money habituel en quelques secondes.
              </p>
            </details>

            <details className="group bg-slate-50 rounded-2xl p-6 border border-slate-200/80 cursor-pointer">
              <summary className="font-extrabold text-slate-900 text-base list-none flex justify-between items-center">
                <span>Comment augmenter ma limite d'emprunt ?</span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Chaque fois que vous remboursez un prêt en respectant vos dates d'échéances, votre score de solvabilité progresse et votre capacité d'emprunt augmente automatiquement de 20% à 25%.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#022C15] text-white pt-16 pb-12 border-t border-emerald-950">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-emerald-900/60">
            
            {/* Col 1 */}
            <div className="space-y-4 md:col-span-1">
              <img src="/logo.png" alt="AfriLoan" className="h-12 w-auto object-contain brightness-0 invert" />
              <p className="text-xs text-emerald-200/80 leading-relaxed">
                AfriLoan est la plateforme africaine de prêt en ligne conçue pour offrir un financement rapide, équitable et transparent à tous.
              </p>
              <p className="text-xs font-semibold text-amber-400">
                Vos projets, notre priorité.
              </p>
            </div>

            {/* Col 2 */}
            <div>
              <h4 className="text-sm font-extrabold text-white mb-4 uppercase tracking-wider">Solutions</h4>
              <ul className="space-y-2 text-xs text-emerald-200/80">
                <li><a href="#formules" className="hover:text-amber-400">Micro-Prêt Express</a></li>
                <li><a href="#formules" className="hover:text-amber-400">Prêt Commerce & Artisanat</a></li>
                <li><a href="#formules" className="hover:text-amber-400">Expansion PME / Business</a></li>
                <li><a href="#simulateur" className="hover:text-amber-400">Simulateur Personnalisé</a></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h4 className="text-sm font-extrabold text-white mb-4 uppercase tracking-wider">Opérateurs</h4>
              <ul className="space-y-2 text-xs text-emerald-200/80">
                <li>Orange Money (Côte d'Ivoire, Sénégal, Mali)</li>
                <li>MTN MoMo (CI, Bénin, Cameroun)</li>
                <li>Wave (Sénégal, CI)</li>
                <li>Airtel Money (Gabon, Congo, RDC)</li>
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h4 className="text-sm font-extrabold text-white mb-4 uppercase tracking-wider">Sécurité & Contact</h4>
              <p className="text-xs text-emerald-200/80 mb-3">
                Support client disponible 7j/7 par WhatsApp et Email.
              </p>
              <div className="text-xs text-amber-300 font-bold">
                contact@afriloan.com
              </div>
            </div>

          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-emerald-300/70 gap-4">
            <div>
              © {new Date().getFullYear()} AfriLoan. Tous droits réservés.
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white">Conditions Générales d'Utilisation</a>
              <a href="#" className="hover:text-white">Confidentialité</a>
              <a href="#" className="hover:text-white">Sécurité Bancaire</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
